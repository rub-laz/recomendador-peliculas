import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NoEncontrado = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <p><span>❓</span>Página no existe, redirigiendo al <strong>inicio</strong>...</p>
      <div className="spinner">⏳</div>
    </div>
  );
};

export default NoEncontrado;
