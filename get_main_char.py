import json
import os


def get_main_char(dir_path: str, output_dir: str) -> None:
    main_characters = {
        # name : {
        #     "id" : int
        #     "count" :  int,
        #     "appearance": [int]  
        # }
    }
    chapter_coref = {
        # chap_name : {
        #     character_chap_id : {
        #         "novel_id" : int,
        #         "count" : int
        #     }
        # }
    }
        

    if not os.path.isdir(dir_path): 
        raise NotADirectoryError('Given directory path is not valid!')

    for chapter in os.listdir(dir_path):
        with open(os.path.join(dir_path, chapter, f"{chapter}.book"), "r") as f:
            chap_json = json.load(f)

        chapter_characters = {}

        for character in chap_json['characters']:
            if character['mentions']['proper']:
                name = character['mentions']['proper'][0]['n']
            elif character['mentions']['common']:
                if character['count'] < 5: 
                    continue

                name = character['mentions']['common'][0]['n']
            else:
                if character['count'] < 5: 
                    continue

                name = character['mentions']['pronoun'][0]['n']
                if name == 'I': 
                    name = "NARRATOR"
            
            existing_char = main_characters.get(name, None)

            if existing_char is None:
                existing_char = {
                    'id': len(main_characters),
                    'count': character['count'],
                    'appearance': [chapter]
                }
                main_characters[name] = existing_char
            else:
                existing_char['count'] += character['count']
                existing_char['appearance'].append(chapter)

            chapter_characters[character['id']] = {
                'novel_id': existing_char['id'],
                'count': character['count']
            }

        chapter_coref[chapter] = chapter_characters

    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, 'main_characters.json'), 'w') as file:
        json.dump(main_characters, file, indent=4)

    with open(os.path.join(output_dir, "chapter_coref.json"), 'w') as file:
        json.dump(chapter_coref, file, indent=4)
