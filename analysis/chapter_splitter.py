import argparse
import os
import re

def split_chapters(text_dir: str, book_name: str):
    text_path = os.path.join(text_dir, f"{book_name}.txt")

    os.makedirs(os.path.join(text_dir, book_name), exist_ok=True)

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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chapter Splitter")

    # Arguments
    parser.add_argument(
        "bookname",
        type=str,
        help="Name of book .txt file",
    )
    parser.add_argument(
        "text_dir",
        type=str,
        help="Directory of book file"
    )

    args = parser.parse_args()

    split_chapters(args.text_dir, args.bookname)
