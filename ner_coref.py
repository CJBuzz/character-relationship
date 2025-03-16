import argparse
import os

from booknlp.booknlp import BookNLP


parser = argparse.ArgumentParser(description="BookNLP")

# Arguments
parser.add_argument(
 	"bookname",
    type=str,
    help="Name of directory with book chapters",
)
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

model_params = {
		"pipeline":"entity,quote,coref", 
		"model":"big"
	}
	
booknlp = BookNLP("en", model_params)

input_dir = os.path.join(args.input, args.bookname)
output_dir_book = os.path.join(args.output, args.bookname)

if not os.path.isdir(input_dir):
    raise FileNotFoundError('Given input directory not found!')

for chapter_name in os.listdir(input_dir):
    
    input_file = os.path.join(input_dir, chapter_name)
    book_id = chapter_name[:-4]
    output_dir = os.path.join(output_dir_book, book_id)


    os.makedirs(output_dir, exist_ok=True)

    booknlp.process(input_file, output_dir, book_id)  
    print(f"Completed {chapter_name}")
