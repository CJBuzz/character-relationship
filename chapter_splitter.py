import argparse
import os
import re

parser = argparse.ArgumentParser(description="Chapter Splitter")

# Arguments
parser.add_argument(
    "bookname",
    type=str,
    help="Name of book .txt file",
)

args = parser.parse_args()


def chapter_splitter(book_name):
    text_path = os.path.join('text', f"{book_name}.txt")

    os.makedirs(os.path.join('text', book_name), exist_ok=True)

    with open(text_path, 'r') as file:
        content = file.read()

    sections = re.split(r'\n{6,}', content)

    for index, section in enumerate(sections):
        lines = section.strip().split('\n')
        if not lines: 
            continue
        
        chapter_title = re.sub(r'[^\w\-_]', '_', lines[0])[:50]
        output_file = f"Part-{index+1}-{chapter_title}.txt"
        output_path = os.path.join('text', book_name, output_file)

        with open(output_path, 'w') as output:
            output.write(section.strip())

        print(f"Created {output_file}.")

# Example usage:
chapter_splitter(args.bookname)
