import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, AlertTriangle, Clock, CalendarX, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export function Header({ toggleSidebar }) {
  const { osSLACritico, osAtrasadas, clientesSemPMOC, notification } = useApp();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const alertasTotal = osSLACritico.length + osAtrasadas.length + clientesSemPMOC.length;
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <button className="mobile-toggle-btn" onClick={toggleSidebar} aria-label="Menu Principal">
        <Menu size={24} />
      </button>

      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Buscar O.S., equipamento ou cliente..." 
          className="search-input"
        />
      </div>

      <div className="header-actions">
        {notification && (
          <div className={`notification-toast ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        <div className="notification-wrapper" ref={notificationRef}>
          <button 
            className="icon-btn notification-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {alertasTotal > 0 && <span className="notification-badge">{alertasTotal}</span>}
          </button>

          {showNotifications && (
            <div className="notification-dropdown animate-fade-in">
              <div className="notification-dropdown-header">
                <h3>Notificações</h3>
                <span className="badge-count danger">{alertasTotal}</span>
              </div>
              <div className="notification-dropdown-body">
                {alertasTotal === 0 ? (
                  <div className="notification-empty">Nenhuma notificação no momento.</div>
                ) : (
                  <>
                    {osAtrasadas.map(os => (
                      <div key={`atraso-${os.id}`} className="notification-item danger">
                        <Clock size={16} />
                        <div className="notification-content">
                          <p><strong>{os.id}</strong> atrasada!</p>
                          <span>{os.titulo}</span>
                        </div>
                      </div>
                    ))}
                    {osSLACritico.map(os => (
                      <div key={`sla-${os.id}`} className="notification-item warning">
                        <AlertTriangle size={16} />
                        <div className="notification-content">
                          <p><strong>{os.id}</strong> SLA Crítico</p>
                          <span>Vence em breve</span>
                        </div>
                      </div>
                    ))}
                    {clientesSemPMOC.map(cli => (
                      <div key={`pmoc-${cli.id}`} className="notification-item danger-outline">
                        <CalendarX size={16} />
                        <div className="notification-content">
                          <p><strong>{cli.nomeFantasia}</strong> sem PMOC!</p>
                          <span>Regularize para evitar multas.</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-profile">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser?.name || 'Admin'}</span>
            <span className="user-role">{currentUser?.role === 'admin' ? 'Administrador' : (currentUser?.role || 'Gestor')}</span>
          </div>
        </div>

        <button className="icon-btn logout-btn" onClick={handleLogout} title="Sair do Sistema">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
