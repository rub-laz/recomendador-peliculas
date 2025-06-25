import { useEffect, useState } from 'react';
import BotonAuth from '../components/BotonAuth';

type User = {
  id: number;
  username: string;
  hashed_password: string;
  created_at: string; // Ej: "2025-05-21T14:34:00Z"
};

const Datos = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then((data: User[]) => setUsers(data))
      .catch(err => console.error('Error al obtener usuarios:', err));
  }, []);

  return (
    <div>
      <h1>Usuarios</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Contraseña (hash)</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.hashed_password}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Datos;
