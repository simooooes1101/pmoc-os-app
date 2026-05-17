import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTechAuth } from '../../contexts/TechAuthContext';
import { LayoutGrid, ClipboardList, LogOut } from 'lucide-react';
import './TechLayout.css';

export function TechLayout() {
  const { techSession, logoutTech } = useTechAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutTech();
    navigate('/tech');
  };

  return (
    <div className="tech-shell">
      {/* Top bar */}
      <header className="tech-header">
        <div className="tech-header-left">
          <div className="tech-avatar-sm">
            {techSession?.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <p className="tech-header-name">{techSession?.nome.split(' ')[0]}</p>
            <p className="tech-header-role">{techSession?.especialidade}</p>
          </div>
        </div>
        <button className="tech-logout-btn" onClick={handleLogout} title="Sair">
          <LogOut size={20} />
        </button>
      </header>

      {/* Page content */}
      <main className="tech-main">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="tech-bottom-nav">
        <NavLink to="/tech/dashboard" className={({ isActive }) => `tech-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutGrid size={22} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/tech/os" className={({ isActive }) => `tech-nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList size={22} />
          <span>Minhas OS</span>
        </NavLink>
      </nav>
    </div>
  );
}
