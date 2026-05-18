import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Wrench, 
  CalendarClock, 
  FileCheck,
  Settings,
  HardHat,
  X
} from 'lucide-react';
import './Sidebar.css';

export function Sidebar({ closeSidebar }) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Ordens de Serviço', path: '/os' },
    { icon: FileCheck, label: 'PMOC', path: '/pmoc' },
    { icon: CalendarClock, label: 'Agenda', path: '/agenda' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: Wrench, label: 'Equipamentos', path: '/equipamentos' },
    { icon: HardHat, label: 'Técnicos', path: '/tecnicos' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">❄️</div>
        <h2>ClimaTech</h2>
        <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Fechar Menu">
          <X size={20} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink 
          to="/config" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={closeSidebar}
        >
          <Settings size={20} />
          <span>Configurações</span>
        </NavLink>
      </div>
    </aside>
  );
}
