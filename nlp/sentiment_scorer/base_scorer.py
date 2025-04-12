import string


class BaseScorer():
    """Base Class for Sentiment Analysis Scorer"""

    placeholders = list(string.ascii_uppercase)

    def __init__(self, replace_propn: bool = True) -> None:
        """Initialise Base Scorer"""

        self.replace_propn = replace_propn

        return None
        
    def replace_proper_nouns(self, sentence: str, propn_pos: list[list[int, int]]) -> str:
        """Method to replace proper nouns"""

        propn_pos.sort(key = lambda x: x[1], reverse = True)

        for idx, (start_pos, end_pos) in enumerate(propn_pos):
            sentence = sentence[:start_pos] + BaseScorer.placeholders[idx%26] + sentence[end_pos:]

        return sentence
    
    def get_sentiment_score(self, sentence: str) -> float:
        """(NOT IMPLEMENTED) Method to get sentiment score"""

        raise NotImplementedError('get_sentiment_score is not implemented for BaseScorer!')

    def get(
        self, 
        sentence: str, 
        propn_pos: list[list[int, int]] | None = None
    ) -> float:
        """Method called by `analyse_sentiments` function"""
        
        if self.replace_propn and propn_pos: 
            sentence = self.replace_proper_nouns(sentence, propn_pos)

        return self.get_sentiment_score(sentence)
