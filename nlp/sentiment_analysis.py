import json
import os
import pickle

import numpy as np
import pandas as pd
from tqdm import tqdm

from .sentiment_scorer.base_scorer import BaseScorer


def analyse_sentiments(
    ner_coref_data_dir: str,
    characters_data_dir: str,
    sentiment_scorer: BaseScorer
) -> None:
    """Conducts sentence-by-sentence sentiment analysis and creates a file character-relations.pkl that stores the sentiment scores and interaction counts between every pair of characters."""

    main_characters_aliases_file_path = os.path.join(characters_data_dir, 'main_characters_aliases.json')

    if not os.path.exists(main_characters_aliases_file_path):
        raise FileNotFoundError('Missing main_characters_aliases.json in given directory!')

    with open(main_characters_aliases_file_path, 'r') as file: 
        main_char_list = json.load(file)

    num_chars = len(main_char_list)
    num_chapters = len(os.listdir(ner_coref_data_dir))

    relations_arr = np.zeros((num_chars, num_chars, 2, num_chapters))

    chapter_values_arr = np.zeros((2, num_chapters))

    for chapter in tqdm(os.listdir(ner_coref_data_dir)):
        chapter_num = int(chapter.split('-')[1]) - 1
        relevant_sentences_file_path = os.path.join(ner_coref_data_dir, chapter, 'relevant_sentences.csv')
        df = pd.read_csv(relevant_sentences_file_path)

        df['Sentiment'] = 0.0

        for idx, row in df.iterrows():
            propn_pos = json.loads(row['proper_nouns_pos'])
            sentiment = sentiment_scorer.get(row['words'], propn_pos)

            df.loc[idx, 'Sentiment'] = sentiment

        chapter_values_arr[0][chapter_num] = df['Sentiment'].sum()
        chapter_values_arr[1][chapter_num] = idx

        for idx, row in df.iterrows():
            char_list = set(json.loads(row['characters']) + (json.loads(row['speaker']) if type(row['speaker']) is str else []))
            if len(char_list) < 2:
                continue
        
            for char1 in char_list:
                for char2 in char_list:
                    if char1 == char2:
                        continue

                    relations_arr[char1][char2][0][chapter_num] += df.loc[idx, 'Sentiment']
                    relations_arr[char1][char2][1][chapter_num] += 1

        df.to_csv(relevant_sentences_file_path, index=False)

    info = {
        "relations" : relations_arr,
        "chapter" : chapter_values_arr,
        "total" : np.array([
            chapter_values_arr[0].sum(),
            chapter_values_arr[1].sum()
        ])
    }

    character_relations_file_path = os.path.join(characters_data_dir, 'character-relations.pkl')
    with open(character_relations_file_path, 'wb') as file:
        pickle.dump(info, file)

    print("Completed Sentiment Analysis!")


def collate_relations(
    characters_data_dir: str,
    deduct_opposing_avg: bool = False,
    deduct_book_avg: bool = False
) -> None:
    main_characters_aliases_file_path = os.path.join(characters_data_dir, 'main_characters_aliases.json')

    if not os.path.exists(main_characters_aliases_file_path):
        raise FileNotFoundError('Missing main_characters_aliases.json in given directory!')

    with open(main_characters_aliases_file_path, 'r') as file: 
        main_char_list = json.load(file)

    pkl_fp = os.path.join(characters_data_dir, 'character-relations.pkl')

    if not os.path.exists(pkl_fp):
        raise FileNotFoundError('Missing character-relations.pkl in given directory!')

    with open(pkl_fp, 'rb') as file:
        info = pickle.load(file)

    arr = info['relations']

    store = [[[0, 0] for _ in range(len(main_char_list))]  for _ in range(len(main_char_list))]

    char_avgs = np.sum(arr, axis=(1, 3))

    book_avg = info['total'][0]/info['total'][1] if deduct_book_avg else False
    print(book_avg)

    for i in range(len(main_char_list)):
        for j in range(len(main_char_list)):
            if i==j: 
                store[i][j] = None
                continue

            opposing_avg = char_avgs[j][0]/char_avgs[j][1] if deduct_opposing_avg else False
            interaction_count = int(np.sum(arr[i][j][1]))

            store[i][j][0] = np.sum(arr[i][j][0]) / interaction_count - opposing_avg - book_avg if interaction_count else 0
            store[i][j][1] = interaction_count

    interactions_fp = os.path.join(characters_data_dir, 'interactions.json')

    with open(interactions_fp, 'w') as file:
        json.dump(store, file, indent=4)
