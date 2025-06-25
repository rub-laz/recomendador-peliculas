import { useState, useEffect } from "react";
import axios from "axios";
import BotonAuth from "../components/BotonAuth";

type Pelicula = {
  movieId: number;
  titulo: string;
  sinopsis: string;
  score: number;
  img_path: string;
  seen: boolean;
};

const DetallePelicula = ({
  pelicula,
  onClose,
  onEventoUsuario
}: {
  pelicula: Pelicula;
  onClose: () => void;
  onEventoUsuario: (accion: string) => void;
}) => (
  <div className="detalle">
    <span className="cerrar" onClick={onClose}>✖</span>
    <h2>{pelicula.titulo}</h2>
    <p><strong>Sinopsis:</strong> {pelicula.sinopsis}</p>
    <p><strong>Valoración:</strong> {pelicula.score.toFixed(2)}</p>
    <div style={{ marginTop: "10px" }}>
      <button onClick={() => onEventoUsuario("visto")}>✅ Marcar como visto</button>
      <button onClick={() => onEventoUsuario("like")}>👍 Me gusta</button>
      <button onClick={() => onEventoUsuario("dislike")}>👎 No me gusta</button>
    </div>
  </div>
);

const Pelis = () => {
  const [vistas, setVistas] = useState<Pelicula[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(false);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:5000/api/pelis", { withCredentials: true })
      .then((res) => {
        const { vistas, recomendaciones } = res.data;
        setVistas(vistas || []);
        setRecomendaciones(recomendaciones || []);
      })
      .catch((error) => {
        console.error("Error al obtener recomendaciones", error);
        setVistas([]);
        setRecomendaciones([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const enviarEventoUsuario = async (movieId: number, accion: string) => {
    try {
      await axios.post("http://localhost:5000/api/evento", {
        movie_id: movieId,
        accion
      }, { withCredentials: true });

      console.log(`Evento enviado: ${accion} para película ${movieId}`);
    } catch (err) {
      console.error("Error al enviar evento", err);
    }
  };

  const renderPeliculas = (peliculas: Pelicula[], mostrarDetalle = true) => {
    const elementos = [] as React.ReactElement[]

    for (const peli of peliculas) {
      elementos.push(
        <div
          key={peli.movieId}
          className="item"
          onClick={() => {
            if (mostrarDetalle) {
              setSeleccionada(peli.movieId === seleccionada ? null : peli.movieId);
            }
          }}
        >
          <img src={`/${peli.img_path}`} alt={peli.titulo} />
          <p>{peli.titulo}</p>
        </div>
      );

      if (mostrarDetalle && seleccionada === peli.movieId) {
        elementos.push(
          <div key={`detalle-${peli.movieId}`} className="detalle">
            <DetallePelicula
              pelicula={peli}
              onClose={() => setSeleccionada(null)}
              onEventoUsuario={(accion) => enviarEventoUsuario(peli.movieId, accion)}
            />
          </div>
        );
      }
    }

    return elementos;
  };

  return (
    <div>
      <h2 style={{ textAlign: "center", color: "gray" }}>Películas Ya Vistas</h2>
      {vistas.length > 0 ? (
        <div className="contenedor-principal">
          {renderPeliculas(vistas, false)}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "gray" }}>No has visto ninguna película aún.</p>
      )}

      <h1 style={{ textAlign: "center", color: "red" }}>Películas Recomendadas</h1>
      {loading ? (
        <div style={{ marginTop: "1rem" }}>
          <span style={{ fontSize: "1rem" }}>⏳</span> Buscando recomendaciones...
        </div>
      ) : (
        <div className="contenedor-principal">
          {renderPeliculas(recomendaciones)}
        </div>
      )}


      <style>{`
        .contenedor-principal {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          padding: 20px;
        }

        .item {
          border: 1px solid #050505;
          padding: 10px;
          text-align: center;
          background-color: #f9f9f9;
          cursor: pointer;
        }

        .item img {
          width: 80%;
          height: auto;
          max-height: 200px;
          object-fit: cover;
        }

        .detalle {
          grid-column: 1 / -1;
        }

        .detalle > div {
          background-color: #eee;
          padding: 20px;
          border: 2px solid #333;
          animation: fadeIn 0.3s ease-in-out;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          margin-top: -10px;
        }

        .detalle img {
          max-height: 200px;
          width: 10%;
          object-fit: cover;
        }

        .cerrar {
          float: right;
          cursor: pointer;
          font-weight: bold;
          color: red;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scaleY(0.9); }
          to { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default Pelis;
