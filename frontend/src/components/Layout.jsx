import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ title, children }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(role === 'admin' ? '/admin/login' : '/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <h1>📚 {title || 'Envio de Trabalhos'}</h1>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
            {role === 'admin' ? '👨‍🏫 Admin' : '👩‍🎓 Aluno'}
          </span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
