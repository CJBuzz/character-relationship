import json
import os


# characters_aliases = [
#     ["Person 1 Alias 1", "Person 1 Alias 2"] # for person one
#     ["Person 2 Alias 1", "Person 2 Alias 2"] # for person two
# ]

def consolidate_main_char(dir_path: str) -> None:
    if not os.path.isdir(dir_path): 
        raise NotADirectoryError('Given directory path is not valid!')
    
    main_characters_file_path = os.path.join(dir_path, "main_characters.json")
    if not os.path.exists(main_characters_file_path):
        raise FileNotFoundError('Missing main_characters.json in given directory!')

    characters_aliases_file_path = os.path.join(dir_path,"main_characters_aliases.json") 
    if not os.path.exists(characters_aliases_file_path):
        raise FileNotFoundError('Missing main_characters_aliases.json in given directory!')
    
    with open(main_characters_file_path, 'r') as file:
        main_characters_data = json.load(file)

    with open(characters_aliases_file_path, 'r') as file:
        characters_aliases = json.load(file)    
        

    # main_characters_data = {
    #     name : {
    #         "id" : int
    #         "count" :  int,
    #         "appearance": [int]  
    #         "consolidated_id": int
    #     }
    # }    
    consolidated_indices = {
        # int: int # maps main_character's id from main_characters_data to their consolidated index
    }

    for character in main_characters_data.keys():
        for idx, character_aliases in enumerate(characters_aliases):
            if character in character_aliases:
                main_characters_data[character]["consolidated_id"] = idx
                character_id = main_characters_data[character]["id"]
                consolidated_indices[character_id] = idx
                break
        else:
            main_characters_data[character]["consolidated_id"] = None
    
    with open(os.path.join(dir_path, "main_characters_consolidated.json"), 'w') as file:
        json.dump(main_characters_data, file, indent=4)

    with open(os.path.join(dir_path, "consolidated_indices.json"), 'w') as file:
        json.dump(consolidated_indices, file, indent=4)
