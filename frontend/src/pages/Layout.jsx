import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Overlay desfocado para fechar ao clicar fora no celular */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      
      <Sidebar closeSidebar={closeSidebar} />
      <main className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
