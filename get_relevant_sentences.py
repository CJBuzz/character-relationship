import csv
import json
import os

import pandas as pd
    

def get_consolidated_id(consolidated_indices: dict[str, int], novel_id: int, chapter: str) -> int | None:
    # NARRATOR Should not appear in these chapters!
    if novel_id == 0 and ("Interlude" in chapter or "Teneral" in chapter or "Migration" in chapter or "Sentinel" in chapter):
        return None
    
    return consolidated_indices.get(str(novel_id), None)


def get_relevant_sentences_in_chapter(
    chapter: str,
    ner_coref_data_dir: str,
    text_dir: str,
    chapters_coref: dict[str, dict[str, dict[str, int]]],
    consolidated_indices: dict[str, int]
) -> None:
    
    chapter_dir = os.path.join(ner_coref_data_dir, chapter)
    chapter_text_file = os.path.join(text_dir, chapter + '.txt')

    tokens_df = pd.read_csv(os.path.join(chapter_dir, f"{chapter}.tokens"), delimiter='\t', quoting=csv.QUOTE_NONE)
    entities_df = pd.read_csv(os.path.join(chapter_dir, f"{chapter}.entities"), delimiter='\t', quoting=csv.QUOTE_NONE)
    quotes_df = pd.read_csv(os.path.join(chapter_dir, f"{chapter}.quotes"), delimiter='\t', quoting=csv.QUOTE_NONE) 

    # with open(os.path.join(chapter_dir, f"{chapter}.book"), "r") as f:
    #     book_json = json.load(f)

    with open(chapter_text_file, 'r', encoding='utf-8') as f:
        chapter_text = f.read()

    sentence_info = {
        "words": [],
        "start_token_id": [],
        "end_token_id": [],
        "speaker": [],
        "characters": []
    }

    num_paragraphs = int(tokens_df.iloc[-1]["paragraph_ID"])
    curr_entities_row_idx = 0
    entities_row = entities_df.iloc[curr_entities_row_idx] if entities_df.shape[0] else None
    curr_quotes_row_idx = 0
    quotes_row = quotes_df.iloc[curr_quotes_row_idx] if quotes_df.shape[0] else None

    chapter_coref = chapters_coref[chapter]
    main_characters_coref = [int(id) for id in chapter_coref.keys()]
        

    for paragraph_num in range(num_paragraphs+1):

        paragraph_df = tokens_df[tokens_df["paragraph_ID"] == paragraph_num]

        # Ensure paragraphs are also different
        start_sentence_id = int(paragraph_df.iloc[0]["sentence_ID"])
        end_sentence_id = int(paragraph_df.iloc[-1]["sentence_ID"])

        for sentence_id in range(start_sentence_id, end_sentence_id+1):
            sentence_df = paragraph_df[paragraph_df["sentence_ID"] == sentence_id]

            byte_onset = int(sentence_df.iloc[0]["byte_onset"])
            byte_offset = int(sentence_df.iloc[-1]["byte_offset"])
            sentence = chapter_text[byte_onset:byte_offset]

            start_token_id = int(sentence_df.iloc[0]["token_ID_within_document"])
            end_token_id = int(sentence_df.iloc[-1]["token_ID_within_document"])

            characters = set()
            speaker = set()
            
            while entities_row is not None and entities_row['end_token'] <= end_token_id:
                if entities_row['start_token'] >= start_token_id and entities_row['COREF'] in main_characters_coref:
                    novel_id = chapter_coref[str(entities_row['COREF'])]["novel_id"]

                    consolidated_id = get_consolidated_id(consolidated_indices, novel_id, chapter)
                    if consolidated_id is not None:
                        characters.add(int(consolidated_id))
                
                curr_entities_row_idx += 1
                if curr_entities_row_idx >= len(entities_df): 
                    entities_row = None
                    break

                entities_row = entities_df.iloc[curr_entities_row_idx]


            while quotes_row is not None and ((
                quotes_row['quote_end'] > start_token_id and quotes_row['quote_end'] <= end_token_id
            ) or (
                quotes_row['quote_start'] >= start_token_id and quotes_row['quote_start'] < end_token_id
            )):
                if quotes_row['char_id'] in main_characters_coref:
                    novel_id = chapter_coref[str(int(quotes_row['char_id']))]["novel_id"]
                    consolidated_id = get_consolidated_id(consolidated_indices, novel_id, chapter)
                    if consolidated_id is not None:
                        speaker.add(int(consolidated_id))

                if quotes_row['quote_end'] > end_token_id:
                    break
                
                curr_quotes_row_idx += 1
                if curr_quotes_row_idx >= len(quotes_df):
                    quotes_row = None
                    break
                
                quotes_row = quotes_df.iloc[curr_quotes_row_idx]

            speaker = list(speaker)
            # speaker = list(speaker) if speaker else None

            # if speaker is None and len(characters) < 2: 
            #     continue

            sentence_info['words'].append(sentence)
            sentence_info['start_token_id'].append(start_token_id)
            sentence_info['end_token_id'].append(end_token_id)
            sentence_info['characters'].append(list(characters))
            sentence_info['speaker'].append(speaker)

    relevant_sentences_df = pd.DataFrame.from_dict(sentence_info)
    relevant_sentences_csv_fp = os.path.join(chapter_dir, 'relevant_sentences.csv')
    relevant_sentences_df.to_csv(relevant_sentences_csv_fp, index=False)

    print(f"Completed {chapter}")


def get_relevant_sentences_in_book(
    ner_coref_data_dir: str,
    text_dir: str,
    characters_data_dir: str
) -> None:
    chapters_coref_file_path = os.path.join(characters_data_dir, 'chapters_coref.json')

    if not os.path.exists(chapters_coref_file_path):
        raise FileNotFoundError("Missing chapters_coref.json in given directory!")

    with open(chapters_coref_file_path) as file:
        chapters_coref = json.load(file)

    consolidated_indices_file_path = os.path.join(characters_data_dir, 'consolidated_indices.json')

    if not os.path.exists(consolidated_indices_file_path):
        raise FileNotFoundError("Missing consolidated_indices.json in given directory!")

    with open(consolidated_indices_file_path) as file:
        consolidated_indices = json.load(file)

    for chapter in os.listdir(ner_coref_data_dir):
        get_relevant_sentences_in_chapter(
            chapter,
            ner_coref_data_dir,
            text_dir,
            chapters_coref,
            consolidated_indices
        )
