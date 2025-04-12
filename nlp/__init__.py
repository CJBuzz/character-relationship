from .consolidate_main_char import consolidate_main_char
from .get_main_char import get_main_char
from .get_relevant_sentences import get_relevant_sentences_in_book, get_relevant_sentences_in_chapter
from .ner_coref import run_ner_coref
from .sentiment_analysis import analyse_sentiments, collate_relations

from .sentiment_scorer.base_scorer import BaseScorer
from .sentiment_scorer.afinn_scorer import AfinnScorer
