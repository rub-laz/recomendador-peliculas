import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BotonAuth from "../components/BotonAuth";

const Registro = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/registro", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      alert("Registrado con éxito. Ahora inicia sesión.");
      navigate("/login");
    } else {
      alert("Error al registrarse");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h1>Registro</h1>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Registrarse</button>
      </form>
    </>
  );
};

export default Registro;
