import { useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../auth';

const BotonAuth = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isAuthenticated()) {
    return <button onClick={handleLogout}>Cerrar Sesión</button>;
  } else {
    return <button onClick={() => navigate('/login')}>Iniciar Sesión</button>;
  }
};

export default BotonAuth;
