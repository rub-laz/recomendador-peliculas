# 🎬 Recomendador de Películas con Big Data y Machine Learning

Este repositorio contiene un sistema completo de recomendación de películas que integra tecnologías de **Big Data**, **Machine Learning**, y **Desarrollo Web Full Stack** para ofrecer recomendaciones personalizadas y en tiempo real a los usuarios.

## 📊 Dataset

Los datos utilizados provienen de [Kaggle](https://www.kaggle.com/), con:

- **+50,000 películas**
- **+26 millones de ratings** de usuarios

---

## 🧠 Modelo de Recomendación

### 🔄 Alternating Least Squares (ALS)

Se aplica el algoritmo **ALS (Alternating Least Squares)**, ampliamente utilizado en sistemas de recomendación colaborativos. Este modelo aprende a partir de la matriz usuario-película de puntuaciones para predecir qué películas podrían gustar a un usuario específico, incluso si no las ha puntuado directamente.

- Se basa en **factorización de matrices**.
- Encuentra representaciones latentes (embeddings) de usuarios y películas.
- Requiere un entorno distribuido como **PySpark** para escalar a millones de registros.

---

## 🔍 Buscador Semántico con Embeddings

Además del sistema colaborativo, se ha implementado un **buscador inteligente** de películas:

- Usa **embeddings de texto** para representar títulos y descripciones de las películas.
- Permite búsquedas por **título parcial o por palabras clave en la descripción**.
- Devuelve resultados semánticamente similares, no solo coincidencias exactas.

Esto mejora la exploración libre de películas, incluso si el usuario no recuerda un título exacto.

---

## 🔧 Tecnologías y Arquitectura

### 🧠 PySpark
- Exploración de datos, limpieza, transformación y entrenamiento del modelo ALS se realiza en **PySpark**, permitiendo procesamiento distribuido y manejo de grandes volúmenes de datos.

### 🔄 Kafka
- Usamos **Apache Kafka** para manejar eventos en tiempo real:
  - `👍 Me gusta`, `👎 No me gusta`, `✅ Visto`
- Estos eventos son enviados como mensajes y almacenados en Cassandra para enriquecer el perfil del usuario y modificar recomendaciones.
- Si el usuario da "me gusta" a una película, se le recomiendan otras similares (por descripción).
- Si da "no me gusta", se evitan esas similitudes.

### 🖥️ Backend
- **Flask**: API RESTful para gestionar usuarios, recomendaciones, búsquedas y eventos.
- **PostgreSQL**: Base de datos relacional para almacenar metadatos de películas (títulos, géneros, sinopsis, etc).
- **Cassandra**: Base de datos NoSQL distribuida para almacenar recomendaciones generadas y eventos de usuario provenientes de Kafka.

### 🌐 Frontend
- **React + TypeScript + Vite**:
  - Permite que el usuario navegue, marque películas y vea sus recomendaciones.
  - Integración en tiempo real con Kafka para enviar eventos.

---

## 🐳 Contenerización

Todo el ecosistema del proyecto ha sido completamente **contenerizado** utilizando **Docker**. Esto incluye:

- Servicios de backend (Flask API)
- Frontend (React + Vite)
- Infraestructura de datos: Kafka, Cassandra, PostgreSQL
- Scripts y entornos de ejecución para PySpark

Esto permite una **fácil orquestación y despliegue** de todo el sistema usando `docker-compose`.

---
