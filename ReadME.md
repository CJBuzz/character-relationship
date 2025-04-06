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

- Accurately reflect the prominence of a character in the the story and how importtant a character is with respect to another character. 
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

In this case, the NER model is expected to pick up 'she' (pronoun), 'Sophia' (proper noun), 'her' (pronoun) and 'best friend' (common noun). 


#### 2. Coreference Resolution

Coreference resolution involves finding all mentions in a text that refer to the same entity. Using the above sentence, the coreference resolution model should conclude that 'she' and 'her' both refer to one character, while 'Sophia' and 'best friend' both refer to another.

In this project, NER and coreference resolution were not conducted on 1 sentence at a time. Instead, a sizable chunk of the text, (a chapter in this case) was analysed together. In the above sentence, 'she' would be resolved as the character 'Emma', who was mentioned in another sentence. 

By using NER and coreference resolution, the characters mentioned in each sentence can be kept track of. If 2 or more characters are mentioned in a sentence, every pair of characters involved was counted to have 1 interaction. For the example sentence, the interaction count between 'Emma' and 'Sophia' would increase by 1.

If a sentence mentions 3 characters A, B and C, the interaction counts between A and B, B and C, and A and C would all increase by 1.


#### 3. Sentiment Analysis

Sentiment Analysis is a process that attempts to capture the underlying emotional tone of a sentence or a phrase. This is usually done by categorising the provided text as having a positive, negative or neutral sentiment. Characters with friendly and hostile relationships are expected to appear together more frequently in sentences that have positive and negative sentiments respectively.

Indeed, AFINN, the sentiment analysis library that was used, classfies the sentence 
 
> That she was calling Sophia her best friend?

as having a positive sentiment with a score of 1.0. As such 1.0 will be added to the sentiment score between the characters 'Emma' and 'Sophia'.

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

> This section is not completed. Apologies!



## Acknowledgements

I would like to express my thanks to the following people and resources:
- [**BookNLP**](https://github.com/booknlp/booknlp): BookNLP's pipeline was used for Named Entity Recognition and Coreference Resolution. It performed much better than alternatives such as SpaCy's and Flair's NER. 
- [**AFINN Sentiment Analysis**](https://github.com/fnielsen/afinn): AFINN was used for sentiment analysis.
- [**vis-network**](https://github.com/visjs/vis-network): Vis.js's Network was used to display the character network graph on the web page. The documentation provided was clear and easy to understand.
- Most importantly, the friend of mine who got me to read *Worm*.
