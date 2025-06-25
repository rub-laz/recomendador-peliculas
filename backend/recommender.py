from sentence_transformers import SentenceTransformer
import numpy as np
import pandas as pd
import glob
import os


class SentenceTransformerRecommender:
    """
    Clase que se encarga de pasar a embeddings texto utilizando el modelo declarado abajo.
    Además, tiene una función que calcula la similitud coseno entre dos embeddings.
    """

    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def encode(self, text, **kwargs):
        return self.model.encode(text, **kwargs)

    def similarity(self, input_embeddings, target_embeddings):
        """
        Calculate the cosine similarity between the target embeddings and all other embeddings.
        """
        return self.model.similarity(input_embeddings, target_embeddings)
