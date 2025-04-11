# Character Relationships (Worm)

This project attempts to use Natural Language Processing techniques to analyse character relationships in the web serial [**Worm**](https://parahumans.wordpress.com/). You can view the webpage showing the results [here](https://cjbuzz.github.io/character-relationship/).

---

## Table of Contents

- [Introduction](#introduction)
- [Discussion](#discussion)
- [Acknowledgements](#acknowledgements)


## Introduction

**Worm** is a pretty long story featuring complex character relationships. This project aims to explore if Natural Language Processing is able to quantitatively capture the nuances of these relationships. 

Ideally, the results should achieve these 2 goals:

- Accurately reflect the prominence of a character in the the story and how important a character is with respect to another character. 
- Accurately reflect the degree of friendliness or hostility in the relationship between a pair of characters.  

Analyse character relationships using NLP involves the following 3 steps:

1. [**Named Entity Recognition**](#1-named-entity-recognition)
2. [**Coreference Resolution**](#2-coreference-resolution)
3. [**Sentiment Analysis**](#3-sentiment-analysis)

[BookNLP](https://github.com/booknlp/booknlp) was used for Named Entity Recognition (NER) and Coreference Resolution while [AFINN](https://github.com/fnielsen/afinn) was used for Sentiment Analysis.  


## Methodology


#### 1. Named Entity Recognition

Named Entity Recognition (NER) involves recognising proper nouns, common nouns and pronouns in a given text string. Consider the following sentence: 

> That she was calling Sophia her best friend?

In this case, the NER model is expected to pick up '*she*' (pronoun), '*Sophia*' (proper noun), '*her*' (pronoun) and '*best friend*' (common noun). 


#### 2. Coreference Resolution

Coreference resolution involves finding all mentions in a text that refer to the same entity. Using the above sentence, the coreference resolution model should conclude that 'she' and 'her' both refer to one character, while '*Sophia*' and '*best friend*' both refer to another.

In this project, NER and coreference resolution were not conducted on 1 sentence at a time. Instead, a sizable chunk of the text, (a chapter in this case) was analysed together. In the above sentence, '*she*' would be resolved as the character '*Emma*', who was mentioned in another sentence. 

By using NER and coreference resolution, the characters mentioned in each sentence can be kept track of. If 2 or more characters are mentioned in a sentence, every pair of characters involved was counted to have 1 interaction. For the example sentence, the interaction count between '*Emma*' and '*Sophia*' would increase by 1.

If a sentence mentions 3 characters A, B and C, the interaction counts between A and B, B and C, and A and C would all increase by 1.


#### 3. Sentiment Analysis

Sentiment Analysis is a process that attempts to capture the underlying emotional tone of a sentence or a phrase. This is usually done by categorising the provided text as having a positive, negative or neutral sentiment. Characters with friendly and hostile relationships are expected to appear together more frequently in sentences that have positive and negative sentiments respectively.

Indeed, AFINN, the sentiment analysis library that was used, classfies the sentence 
 
> That she was calling Sophia her best friend?

as having a positive sentiment with a score of 1.0. As such 1.0 will be added to the sentiment score between the characters '*Emma*' and '*Sophia*'.

Similarly, if a sentence mentions 3 characters A, B and C, the sentiment score of the sentence will be added to all the sentiment scores between A and B, B and C, and A and C.


#### Measures

1. Prominence & Importance

The interaction count between a pair of characters serves as a metric for the importance of a relationship to the overall story. 

The fraction of interaction between characters A and B out of the total interaction count in all relationships that involves character A serves as a metric for the relative importance of character B to character A.   

The total interaction count of all relationships that involves character A serves as a metric for prominence of character A in the story.

2. Friendliness & Hostility

By dividing the total sentiment score between characters A and B with the number of interactions between characters A and B, the average sentiment score can be yielded. This average serves as a metric for degree of the friendliness (if score > 0) or hostility (if score < 0) in the relationship.

In this project a further step was taken that involved adjusting the sentiment score between 2 characters by accounting for the average sentiment of both characters (based on all the interactions they are involved in). The idea that if character A is a generally nasty person who is antagonistic to almost everyone, and that if their sentiment score with character B is hostile (negative) but less so than average, the eventual metric should reflect this relatively friendly relationship. It appears that this adjustment more accurately reflects the friendliness/hostility between characters for *Worm*, but whether it is generally better is not conclusive and users can skip this step should they wish.


#### Workflow

The full methodology to obtain the number of interactions and the sentiment scores between every pair of major characters (~100 of them) is found in [this notebook](./workflow.ipynb). 

Do note that as *Worm* is a very long text, it was split into chapters before being NER was conducted by BookNLP (due to memory limitations). Afterwards, several additional steps were required to match characters between chapters.



## Results

The results of the above steps can be found in the file `interactions.json` in the `static` directory. It stores a 2 dimensional array of the form `arr[i][j]`. `i` and `j` are indices that represent a character whose name can be found in the file `character_names.json` (it stores another list - match the index to find the name). The value of `arr[i][j]` is either an array of length 2 or `null` (if `i == j`). If `i != j`, `arr[i][j][0]` stores the total number of interactions between character `i` and `j` while `arr[i][j][1]` stores the sentiment score.


#### Web Page

This results are displayed in an interactive graph in this [page](https://cjbuzz.github.io/character-relationship/). Characters are represented as nodes and their relationships as edges.

The width of the edge between 2 nodes reflects the number of interactions between the respective characters. The length of the edge reflects the importance of that relationship to the characters

The length is calculated as follows:

```math
L = 100 \times \sqrt[3]{\frac{T_{i}}{n_{ij}} + \frac{T_{j}}{n_{ij}}}
```

where $n_{ij}$ represents the number of interactions between characters `i` and `j`, $T_{i}$ represents the total number of interactions involving character `i` and $T_{j}$ represents tht toal number of interactions involving character `j`. The graph is arranged using the `repulsion` solver by `Vis.js`.

By default, the less important edges are not shown. This can be changed in the menu (top-left corner). By adjusting the minimum number of interactions or minimum percentage of interactions, more or less edges will be shown on the graph.

If a node has no connected edges, it will not be shown.

The minimum percentage of interactions takes into account both characters involved. It is calculated as follows:

```math
P = 100\% \times \frac{n_{ij}}{\sqrt{T_{i} \times T_{j}}} 
```

The sentiment score is also not reflected by default. By toggling the 'S' button in the menu, the colour of the edges can be changed to reflect the score. Greener shades represent friendlier relationships while redder shades show more hostile relationships.



## Discussion


#### Evaluating Named Entity Recognition and Coreference Resolution

BookNLP's named entity recognition and coreference resolution models performed satisfactorily as the interactions count between 2 characters generally capture the important of that relationship in a story. The most prominent characters such as the *Skitter* and *Tattletale* have the largest number of total interactions. The network graph rendered on the webpage show in-story teams such as *The Travellers* and *Faultline's Crew* having significant intra-group connections and places members of the group near each other. While the interaction counts are not manually compared, it appears to approximately match their in-story significance.

Nevertheless, some notable mistakes were made. *Worm* is largely written in first person perspective and BookNLP correctly identifies the narrator as an entity. However, the interludes and several arcs (notably *Sentinel*, *Migration* and *Teneral*) that is instead written in third person perspective. These chapters do not feature the narrator, though her other names and aliases such as Taylor, Skitter and Weaver might make an appearance. In some of these chapters, BookNLP incorrectly recognises the "narrator" entity. These are caught and removed in the project but indicates the possibility of further mistakes in NER and coreference resolution.

In addition, coreference resolution would be complicated if 2 or more characters share the same name. This is less of a problem in *Worm* as characters generally have distinct names but could be an issue in other works. In *One Hundred Years of Solitude*, there are multiple characters named *Aureliano* and *José Arcadio*. BookNLP and other coreference resolution tools would likely resolve them as a single character. 


#### Evaluating Sentiment Analysis

Unfortunately, the sentiment analysis methodology used in this project does not end up with results that seem to accurately reflect the friendliness or hostility in the relationship between 2 characters. Among *The Travellers*, *Perdition* and *Trickster* have the most antagonistic relationship within the group. However, *Perdition*'s sentiment score with *Trickster* is the second most positive when compared to his score with the rest of the team! This is clearly incongruous with the in-story group dynamics. 

Similarly, *Bitch* of the *Undersiders* may be a bit anti-social but otherwise gets along reasonably well with her teammates. However, she has very negative sentiment scores with the rest of her teammates.

There are certainly scores that do reflect the relationship in the story. However, the presence of so several scores that evidently do not align with their portrayal makes this method of limited effectiveness in measuring friendliness or hostility in the interactions between characters.

---

A possible reason could be sentiment analysis tools such as **AFINN** and **TextBlob** not being able to account for contextual information as they adopt a lexicon and rule-based approach. This involves mapping a list of words to their respective sentiment score. In a text, the sentiment score of each word is aggregated to determine the text's sentiment. This does not account for textual context.

Consider this sentence:

> Sophia would be there, and I could just imagine her smug smile of satisfaction as I showed up looking like I’d botched an attempt to tie-dye everything I owned.

Reading the sentence, one can conclude that the relationship between *Sophia* and the narrator is antagonistic,, as *Sophia* is happy ("smug smile of satisfaction") when the narrator fails ("botched an attempt"). However, AFINN grades this sentence with a positive score of 4.0.

When the sentiment score of each word is analysed, it turns out that the positive score is due to the words "smile" and "like", each with a score of 2.0. Taken individually, those 2 words do have positive connotations, with the assumption that "like" is used as a verb (e.g. "I like Person A"). In this sentence, "like" is instead used as a prepositional, which has a different meaning to how it is used as a verb. "Smile", normally seen in positive context, appears here to show how one character delights in another's failure - a sign of hostility rather than friendliness. With an inability to consider context, errors such as these could result in sentiment scores that are unrepresentative of the actual relationships between characters.

To account for textual context, larger transformer-based language models can be considered.  



## Acknowledgements

I would like to express my thanks to the following people and resources:
- [**BookNLP**](https://github.com/booknlp/booknlp): BookNLP's pipeline was used for Named Entity Recognition and Coreference Resolution. It performed much better than alternatives such as SpaCy's and Flair's NER. 
- [**AFINN Sentiment Analysis**](https://github.com/fnielsen/afinn): AFINN was used for sentiment analysis.
- [**vis-network**](https://github.com/visjs/vis-network): Vis.js's Network was used to display the character network graph on the web page. The documentation provided was clear and easy to understand.
- Most importantly, the friend of mine who got me to read *Worm*.
