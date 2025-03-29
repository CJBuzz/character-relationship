import argparse
import os

from booknlp.booknlp import BookNLP


parser = argparse.ArgumentParser(description="BookNLP")

# Arguments
parser.add_argument(
    "-i",
    "--input",
    type=str,
    help="Input directory",
    required=False,
    default="text"
)
parser.add_argument(
    "-o",
    "--output",
    type=str,
    help="Output directory",
    required=False,
    default="output"
)

args = parser.parse_args()


def run_ner_coref(text_dir: str, output_dir_book: str) -> None:
    model_params = {
            "pipeline":"entity,quote,coref", 
            "model":"big"
        }
        
    booknlp = BookNLP("en", model_params)

    if not os.path.isdir(text_dir):
        raise FileNotFoundError('Given input directory not found!')

    for chapter_name in os.listdir(text_dir):
        
        input_file = os.path.join(text_dir, chapter_name)
        book_id = chapter_name[:-4]
        output_dir = os.path.join(output_dir_book, book_id)


        os.makedirs(output_dir, exist_ok=True)

        booknlp.process(input_file, output_dir, book_id)  
        print(f"Completed {chapter_name}")


run_ner_coref(args.input, args.output)
