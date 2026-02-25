import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ title, children }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate(role === 'admin' ? '/admin/login' : '/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="flex items-center gap-1">
          <h1>📚 {title || 'Envio de Trabalhos'}</h1>
          <div className="nav-links">
            {role === 'admin' && (
              <>
                <a
                  href="/admin"
                  className={`nav-link ${isActive('/admin') && !isActive('/admin/materiais') ? 'nav-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
                >
                  📋 Envios
                </a>
                <a
                  href="/admin/materiais"
                  className={`nav-link ${isActive('/admin/materiais') ? 'nav-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate('/admin/materiais'); }}
                >
                  📂 Materiais
                </a>
              </>
            )}
            {role === 'student' && (
              <>
                <a
                  href="/enviar"
                  className={`nav-link ${isActive('/enviar') ? 'nav-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate('/enviar'); }}
                >
                  📤 Enviar
                </a>
                <a
                  href="/materiais"
                  className={`nav-link ${isActive('/materiais') ? 'nav-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate('/materiais'); }}
                >
                  📂 Materiais
                </a>
              </>
            )}
          </div>
        </div>
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
