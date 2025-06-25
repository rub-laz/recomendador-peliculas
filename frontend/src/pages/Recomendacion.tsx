import { useState, useEffect } from "react";
import axios from "axios";

type Pelicula = {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
};

const Recomendacion = () => {
  const [pelicula, setPelicula] = useState("");
  const [tipoBusqueda, setTipoBusqueda] = useState("titulo");
  const [recomendaciones, setRecomendaciones] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [sugerencias, setSugerencias] = useState<string[]>([]);

  const obtenerRecomendaciones = async () => {
    setLoading(true);
    setBuscado(true);
    setSugerencias([]);

    try {
      const res = await axios.post("http://localhost:5000/api/recomendacion", {
        pelicula,
        select: tipoBusqueda,
      });
      setRecomendaciones(res.data.recomendaciones || res.data); // compatible con ambas respuestas
    } catch (error) {
      console.error("Error al obtener recomendaciones", error);
      setRecomendaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSugerencias = async () => {
      if (pelicula.length < 2) {
        setSugerencias([]);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/sugerencias", {
          params: { q: pelicula },
        });
        setSugerencias(res.data);
      } catch (error) {
        console.error("Error al obtener sugerencias", error);
      }
    };

    const timeout = setTimeout(fetchSugerencias, 300);
    return () => clearTimeout(timeout);
  }, [pelicula]);

  const handleSugerenciaClick = (titulo: string) => {
    setPelicula(titulo);
    setSugerencias([]);
  };

  return (
    <div>
      <h1>Recomendador de Películas</h1>

      <input
        type="text"
        value={pelicula}
        onChange={(e) => setPelicula(e.target.value)}
        placeholder="Nombre de la película"
      />

      <select
        name="select"
        value={tipoBusqueda}
        onChange={(e) => setTipoBusqueda(e.target.value)}
      >
        <option value="titulo">Título</option>
        <option value="descripcion">Descripción</option>
      </select>

      <button onClick={obtenerRecomendaciones}>Buscar</button>

      {sugerencias.length > 0 && (
        <ul style={{ background: "#f0f0f0", border: "1px solid #ccc" }}>
          {sugerencias.map((sug, i) => (
            <li
              key={i}
              onClick={() => handleSugerenciaClick(sug)}
              style={{ cursor: "pointer", padding: "0.5rem" }}
            >
              {sug}
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div style={{ marginTop: "1rem" }}>
          <span className="spinner" style={{ fontSize: "1rem" }}>
            ⏳
          </span>{" "}
          Buscando recomendaciones...
        </div>
      )}

      {!loading && recomendaciones.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem" }}>Recomendaciones</h2>
          <div className="contenedor-principal">
            {recomendaciones.map((peli) => (
              <div key={peli.id} className="item">
                <img src={`/${peli.poster_path}`} alt={peli.title} />
                <h3>{peli.title}</h3>
                <p><strong>Sinopsis:</strong> {peli.overview}</p>
                <p><strong>Valoración:</strong> {peli.vote_average.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && buscado && recomendaciones.length === 0 && (
        <p>No se encontraron recomendaciones.</p>
      )}

      <style>{`
        .contenedor-principal {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 20px;
        }

        .item {
          border: 1px solid #050505;
          padding: 10px;
          text-align: center;
          background-color: #f9f9f9;
          cursor: default;
        }

        .item img {
          width: 80%;
          height: auto;
          max-height: 200px;
          object-fit: cover;
          margin-bottom: 10px;
        }

        input, select {
          margin: 0.5rem;
          padding: 0.4rem;
        }

        button {
          padding: 0.4rem 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default Recomendacion;
