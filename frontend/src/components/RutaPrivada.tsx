import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../auth';

type Props = {
  children: React.ReactNode;
};

const RutaPrivada = ({ children }: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3500);
      return () => clearTimeout(timer); // limpiar el temporizador si cambia de página antes
    }
  }, []);

  if (!isAuthenticated()) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p>No se ha iniciado sesión, redirigiendo a <strong>login</strong>...</p>
        <div className="spinner">⏳</div>
      </div>
    );
  }

  return children;
};

export default RutaPrivada;
