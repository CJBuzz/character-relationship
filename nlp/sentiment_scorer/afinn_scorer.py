from .base_scorer import BaseScorer


class AfinnScorer(BaseScorer):
    """Class for AFINN Scorer"""

    def __init__(self, replace_propn: bool = True) -> None:
        super().__init__(replace_propn)

        from afinn import Afinn

        self.afinn_scorer = Afinn()

    def get_sentiment_score(self, sentence: str) -> float:
        sentiment_score = self.afinn_scorer.score(sentence)/2
        return sentiment_score
    