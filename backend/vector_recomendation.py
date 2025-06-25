import numpy as np
import ast


class MovieRecommender:
    def __init__(self, model, database):
        self.model = model
        self.database = database.copy()
        self.database_emb_des = np.stack(self.database["vector"].values)
        self.database_emb_title = np.stack(self.database["vector_titulo"].values)

    def get_recommendations(
        self, new_overview, tipo, top_n=12, order_by_vote: bool = False
    ):
        """
        Función que recibe como parámetros:
        - Texto a pasar a embedding para luego comparar con los demás.
        - Tipo: puede ser o título o descripción para que haga una búsqueda de los más parecidos según el parámetro.
        Devuelve la información de las 12 películas más parecidas para enviarla al frontend
        """

        new_overview_emb = self.model.encode(new_overview)
        if tipo == "titulo":
            similarities = calculate_similarity(
                self.database_emb_title, new_overview_emb
            )
            top_indices = similarities.argsort()[-top_n:][::-1]
            recommendations = self.database.iloc[top_indices][
                ["id", "title", "overview", "vote_average", "poster_path"]
            ]
        else:
            similarities = calculate_similarity(self.database_emb_des, new_overview_emb)
            top_indices = similarities.argsort()[-top_n:][::-1]
            recommendations = self.database.iloc[top_indices][
                ["id", "title", "overview", "vote_average", "poster_path"]
            ]

        if order_by_vote:
            recommendations = recommendations.sort_values(
                by="vote_average", ascending=False
            )

        return recommendations

    def get_recommendations_dislike(
        self, new_overview, peliculas, ids, top_n=5, order_by_vote: bool = False
    ):
        """
        Función que recibe como parámetros:
        - new_overview: texto a pasar a embedding para luego comparar con los demás.
        - Peliculas: embeddings de las peliculas dentro de recomendaciones para comparar con new_overview.
        - ids: ids de las peliculas del parámetro Peliculas para que luego haga una busqueda de sus datos
        Devuelve la información de las 5 películas más parecidas para eliminarlas de las recomendaciones
        """
        new_overview_emb = self.model.encode(new_overview)

        similarities = calculate_similarity(peliculas, new_overview_emb)
        top_indices = similarities.argsort()[-top_n:][::-1]

        # ← Aquí devolvemos los ids que vinieron del dataframe filtrado
        top_ids = [ids[i] for i in top_indices]

        recommendations = self.database[self.database["id"].isin(top_ids)][
            ["id", "title", "overview", "vote_average", "poster_path"]
        ]

        if order_by_vote:
            recommendations = recommendations.sort_values(
                by="vote_average", ascending=False
            )

        return recommendations


def calculate_similarity(embeddings, target_embedding):
    """
    Calculate the cosine similarity between the target embedding and all other embeddings.
    """
    similarities = np.dot(embeddings, target_embedding) / (
        np.linalg.norm(embeddings, axis=1) * np.linalg.norm(target_embedding)
    )
    return similarities
