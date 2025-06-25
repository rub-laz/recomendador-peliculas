from flask import Flask, jsonify, request, session
from flask_cors import CORS
import requests
import hashlib
import pandas as pd
import os
import numpy as np
import pickle
import ast
import json
import random
from datetime import datetime
from supabase import create_client
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

# Clases de embeddings
from vector_recomendation import MovieRecommender
from recommender import SentenceTransformerRecommender

# Funciones de Kafka (consumer y producer)
from kafka_functions import producer as prod
from kafka_functions import (
    consumer,
    actualizar_cassandra,
    peliculas_vistas,
    peliculas_like,
)


app = Flask(__name__)
CORS(app, supports_credentials=True)  # Permite peticiones desde React
app.secret_key = "1234"

# Base de datos no relacional (Cassandra)
cloud_config = {
    "secure_connect_bundle": "credenciales_cassandra/secure-connect-proyecto-recomendacion.zip"
}
with open("credenciales_cassandra/proyecto-recomendacion-token.json") as f:
    secrets = json.load(f)

CLIENT_ID = secrets["clientId"]
CLIENT_SECRET = secrets["secret"]
# Conexion al cluster
auth_provider = PlainTextAuthProvider(CLIENT_ID, CLIENT_SECRET)
cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
cassandra_session = cluster.connect("recomendaciones")

# Base de datos SQL de usuarios
SUPABASE_URL = "https://bpfdmufpudgtnnasfwin.supabase.co"
SUPABASE_API_KEY = "key"
TABLE_NAME = "users"

# Pasar los embeddings a formato lista
path_file = os.path.join(os.path.dirname(__file__), "data", "movies_clean.csv")
df_movies = pd.read_csv(path_file)

df_movies["vector"] = df_movies["vector"].apply(
    ast.literal_eval
)  # Convierte de str a lista

df_movies["vector_titulo"] = df_movies["vector_titulo"].apply(
    ast.literal_eval
)  # Convierte de str a lista

# Producer de Kafka
producer = prod()

st_model = SentenceTransformerRecommender()
recommender = MovieRecommender(st_model, df_movies)


@app.route("/api/users", methods=["GET"])
def get_users():
    """
    Función que muestra todos los usuarios y contraseñas hasheadas de
    la base de datos SQL
    """
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
    }
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=*"
    response = requests.get(url, headers=headers)
    return jsonify(response.json())


@app.route("/api/registro", methods=["POST"])
def registro():
    """
    Función que realiza el registro de un usuario (recibe los datos por POST).
    No funciona como registro real ya que el usuario debe de estar en el csv de ratings para
    que se generen las recomendaciones de películas.
    """
    data = request.get_json()
    username = data["username"]
    password = hashlib.sha256(data["password"].encode()).hexdigest()

    insert_url = f"{SUPABASE_URL}/rest/v1/users"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    payload = {
        "username": username,
        "hashed_password": password,
        "created_at": datetime.utcnow().isoformat(),
    }

    res = requests.post(insert_url, headers=headers, json=payload)
    return jsonify(res.json()), res.status_code


@app.route("/api/login", methods=["POST"])
def login():
    """
    Función que realiza el login del usuario en la aplicación comprobando
    que los datos se encuentran en la base de datos.
    """
    data = request.get_json()
    username = data["username"]
    password = hashlib.sha256(data["password"].encode()).hexdigest()

    query_url = f"{SUPABASE_URL}/rest/v1/users?username=eq.{username}&hashed_password=eq.{password}&select=id"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
    }

    res = requests.get(query_url, headers=headers)
    users = res.json()
    if users:
        session["username"] = username
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Credenciales incorrectas"}), 401


@app.route("/api/recomendacion", methods=["POST"])
def recomendacion():
    """
    Función que obtiene mediante POST tanto información (de la plantilla Recomendacion.tsx) del texto recibido
    como de un select que dependiendo si el valor es titulo o descripción hace una busqueda de peliculas parecidas.
    """
    data = request.get_json()
    texto_input = data.get("pelicula")
    tipo_busqueda = data.get("select")

    if not texto_input:
        return jsonify({"error": "Película no proporcionada"}), 400

    st_model = SentenceTransformerRecommender()
    recommender = MovieRecommender(st_model, df_movies)

    recomendaciones = []

    if texto_input.strip():
        if tipo_busqueda == "titulo":
            results = recommender.get_recommendations(texto_input, tipo="titulo")
        else:
            results = recommender.get_recommendations(texto_input, tipo="descripcion")

        recomendaciones = results.to_dict(orient="records")

    return jsonify(recomendaciones)


@app.route("/api/sugerencias", methods=["GET"])
def sugerencias():
    """
    Función experimental que cuando introduces palabras en la caja de texto de la plantilla Recomendacion.tsx
    hace búsquedas en la base de datos para encontrar títulos de películas que coinciden.
    """

    SUPABASE_URL = "https://bpfdmufpudgtnnasfwin.supabase.co"
    SUPABASE_API_KEY = "key"
    supabase = create_client(SUPABASE_URL, SUPABASE_API_KEY)

    query = request.args.get("q", "").lower()

    if not query:
        return jsonify([])

    # Buscar títulos que contengan el texto (máximo 3)
    response = (
        supabase.table("peliculas")
        .select("title")
        .ilike("title", f"%{query}%")
        .limit(3)
        .execute()
    )

    titulos = [item["title"] for item in response.data]
    return jsonify(titulos)


@app.route("/api/pelis", methods=["GET"])
def recomendaciones_personalizadas():
    """
    Función que primero comprueba si existen recomendaciones para dicho usuario en Cassandra:
    - En caso afirmativo, las devuelve.
    - En caso contrario, las genera llamando al modelo ALS con los .pickle (top 120 películas), las guarda en Cassandra y las envía al front.
    """

    username = session.get("username")
    user_code = int(username)

    # Funciones explicadas en kafka_functions.py
    actualizar_cassandra(user_code, cassandra_session)
    peliculas_ya_vistas = peliculas_vistas(user_code, cassandra_session, df_movies)
    peliculas_like(user_code, cassandra_session, df_movies, recommender)

    # Verificar si ya existen recomendaciones
    rows = cassandra_session.execute(
        "SELECT * FROM recommendations WHERE user_id = %s", (user_code,)
    )
    existing_recs = list(rows)

    if existing_recs:
        recomendaciones = [
            {
                "movieId": row.movie_id,
                "titulo": row.titulo,
                "sinopsis": row.sinopsis,
                "score": row.score,
                "img_path": row.img_path,
                "seen": row.seen,
            }
            for row in existing_recs
            if not row.seen  # solo las no vistas
        ]
        return jsonify(
            {"recomendaciones": recomendaciones, "vistas": peliculas_ya_vistas}
        )

    # Si no existen, generar usando ALS
    with open("modelo_ALS/user_factors.pkl", "rb") as f:
        user_factors = pickle.load(f)
    with open("modelo_ALS/item_factors.pkl", "rb") as f:
        item_factors = pickle.load(f)

    user_factors["features"] = user_factors["features"].apply(np.array)
    item_factors["features"] = item_factors["features"].apply(np.array)

    user_factors.set_index("id", inplace=True)
    item_factors.set_index("id", inplace=True)

    if user_code not in user_factors.index:
        return "Usuario no existe"

    user_vec = user_factors.loc[user_code, "features"]
    item_scores = item_factors["features"].apply(lambda x: np.dot(user_vec, x))
    top_items = item_scores.sort_values(ascending=False).head(120)
    serie_desordenada = top_items.sample(frac=1)

    recomendaciones = []
    insert_stmt = cassandra_session.prepare(
        """
        INSERT INTO recommendations (user_id, movie_id, score, titulo, sinopsis, img_path, seen)
        VALUES (?, ?, ?, ?, ?, ?, false)
    """
    )

    for movie_id, score in serie_desordenada.items():
        movie_row = df_movies[df_movies["id"] == int(movie_id)]
        if movie_row.empty:
            continue
        titulo = movie_row["title"].values[0]
        sinopsis = movie_row["overview"].values[0]
        img_path = movie_row["poster_path"].values[0]

        rec = {
            "movieId": int(movie_id),
            "titulo": titulo,
            "sinopsis": sinopsis,
            "score": float(score),
            "img_path": img_path,
            "seen": False,
        }
        recomendaciones.append(rec)

        # Insertar en Cassandra
        cassandra_session.execute(
            insert_stmt,
            (
                user_code,
                rec["movieId"],
                rec["score"],
                rec["titulo"],
                rec["sinopsis"],
                rec["img_path"],
            ),
        )

    return jsonify({"recomendaciones": recomendaciones, "vistas": peliculas_ya_vistas})


@app.route("/api/evento", methods=["POST"])
def evento_usuario():
    """
    Función que recibe información sobre un evento lanzado por el usuario (click a marcar como visto, me gusta o no me gusta)
    y mediante un producer lo envía al topic eventos_pelicula en el que un consumer (Cassandra) está escuchando para guardar dicha información
    en la base de datos de Cassandra.
    """
    data = request.get_json()
    movie_id = data.get("movie_id")
    accion = data.get("accion")
    username = session.get("username")

    if not movie_id or not accion:
        return jsonify({"error": "Faltan datos"}), 400

    evento = {
        "usuario": username,
        "pelicula_id": movie_id,
        "accion": accion,
        "timestamp": datetime.utcnow().isoformat(),
    }

    producer.send("eventos_peliculas", evento)

    # Envío los eventos a cassandra utlizando un consumer que escucha el topic "eventos_peliculas"
    consumer(cassandra_session)
    return jsonify({"ok": True, "evento": evento})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
