import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../auth";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "1rem",
      background: "#282c34",
      color: "white"
    }}>
      <div style={{ display: "flex", gap: "1rem" }}>
        {isAuthenticated() ? (
          <>
            <Link to="/pelis" style={{ color: "white", textDecoration: "none" }}>Pelis</Link>
            <Link to="/recomendacion" style={{ color: "white", textDecoration: "none" }}>Recomendación</Link>
          </>
        ) : (
          <>
            <Link to="/" style={{ color: "white", textDecoration: "none" }}>Home</Link>
            <Link to="/datos" style={{ color: "white", textDecoration: "none" }}>Datos</Link>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        {isAuthenticated() ? (
          <button className="navbar-button" onClick={handleLogout}>Cerrar Sesión</button>
        ) : (
          <>
            <button className="navbar-button" onClick={() => navigate("/login")}>Iniciar Sesión</button>
            <button className="navbar-button" onClick={() => navigate("/registro")}>Registrarse</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
