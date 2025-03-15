from booknlp.booknlp import BookNLP

model_params={
		"pipeline":"entity,quote,coref", 
		"model":"big"
	}
	
booknlp=BookNLP("en", model_params)

# Input file to process
input_file="text/worm_1_1.txt"

# Output directory to store resulting files in
output_directory="output/"

# File within this directory will be named ${book_id}.entities, ${book_id}.tokens, etc.
book_id="worm_1_1"

booknlp.process(input_file, output_directory, book_id)