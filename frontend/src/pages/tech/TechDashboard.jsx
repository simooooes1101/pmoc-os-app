import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useTechAuth } from '../../contexts/TechAuthContext';
import { Clock, MapPin, ChevronRight, CheckCircle2, Bell, AlertCircle, X } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './TechDashboard.css';

export function TechDashboard() {
  const { 
    ordens, 
    clientes, 
    techNotifications, 
    lerNotificacaoTech, 
    limparNotificacoesTech 
  } = useApp();
  const { techSession } = useTechAuth();
  const navigate = useNavigate();
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const myOS = ordens.filter(os => os.tecnicoId === techSession?.id);
  const myNotifications = (techNotifications || []).filter(n => n.tecnicoId === techSession?.id);
  const unreadNotifications = myNotifications.filter(n => !n.lida);
  
  // Safe ISO parsing helper to prevent date-fns crashes on invalid/empty dates
  const parseSafeISO = (dateStr) => {
    if (!dateStr) return null;
    try {
      const parsed = parseISO(dateStr);
      // Check if it's a valid date object
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  const isOSToday = (os) => {
    if (!os.dataPrevista) return false;
    const parsed = parseSafeISO(os.dataPrevista);
    if (!parsed) return false;
    return isSameDay(parsed, new Date());
  };

  // Sort: pending first, then by priority/date
  const sortedOS = [...myOS].sort((a, b) => {
    if (a.status === 'Concluída' && b.status !== 'Concluída') return 1;
    if (a.status !== 'Concluída' && b.status === 'Concluída') return -1;
    
    const dateA = parseSafeISO(a.dataPrevista);
    const dateB = parseSafeISO(b.dataPrevista);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });

  const osDoDia = sortedOS.filter(isOSToday);
  const osPendentes = sortedOS.filter(os => os.status !== 'Concluída' && os.status !== 'Cancelada');

  const handleCardClick = (osId) => {
    navigate(`/tech/os/${osId}`);
  };

  return (
    <div className="tech-dashboard">
      {/* Notifications Area */}
      {unreadNotifications.length > 0 && (
        <div className="tech-notifications-banner">
          <div className="banner-header">
            <div className="banner-title">
              <Bell size={18} className="pulse-icon text-accent" />
              <span>Notificações ({unreadNotifications.length})</span>
            </div>
            <button className="clear-all-btn" onClick={() => limparNotificacoesTech(techSession?.id)}>
              Limpar tudo
            </button>
          </div>
          <div className="banner-body">
            {unreadNotifications.map(notif => (
              <div key={notif.id} className="notification-card animate-slide-in">
                <p>{notif.mensagem}</p>
                <button className="dismiss-btn" onClick={() => lerNotificacaoTech(notif.id)}>
                  Ciente
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tech-welcome">
        <h2>Olá, {techSession?.nome.split(' ')[0]}!</h2>
        <p>Você tem <strong>{osPendentes.length}</strong> ordens de serviço pendentes.</p>
      </div>

      <section className="tech-section">
        <div className="tech-section-header">
          <h3>Hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</h3>
        </div>
        
        {osDoDia.length === 0 ? (
          <div className="tech-empty-state">
            <CheckCircle2 size={40} className="text-success" />
            <p>Nenhuma OS agendada para hoje.</p>
          </div>
        ) : (
          <div className="tech-os-stack">
            {osDoDia.map(os => (
              <OSCard key={os.id} os={os} cliente={clientes.find(c => c.id === os.clienteId)} onClick={() => handleCardClick(os.id)} />
            ))}
          </div>
        )}
      </section>

      {osPendentes.length > 0 && (
        <section className="tech-section">
          <div className="tech-section-header">
            <h3>Próximas e Pendentes</h3>
          </div>
          <div className="tech-os-stack">
            {sortedOS.filter(os => !isOSToday(os)).map(os => (
              <OSCard key={os.id} os={os} cliente={clientes.find(c => c.id === os.clienteId)} onClick={() => handleCardClick(os.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OSCard({ os, cliente, onClick }) {
  const statusLabels = {
    'Aguardando': 'Pendente',
    'Em andamento': 'Em execução',
    'Concluída': 'Finalizada',
    'Cancelada': 'Cancelada'
  };

  const priorityColors = {
    'Urgente': 'danger',
    'Alta': 'warning',
    'Normal': 'info',
    'Baixa': 'success'
  };

  const formatOSDate = (dateStr) => {
    if (!dateStr) return 'Sem data agendada';
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) return 'Sem data agendada';
      return `Previsto: ${format(parsed, 'HH:mm')}`;
    } catch {
      return 'Sem data agendada';
    }
  };

  return (
    <div className={`tech-os-card status-${os.status.toLowerCase().replace(' ', '-')}`} onClick={onClick}>
      <div className="tech-os-card-header">
        <span className="tech-os-id">{os.id}</span>
        <span className={`badge ${priorityColors[os.prioridade]}`}>{os.prioridade}</span>
      </div>
      
      <div className="tech-os-card-body">
        <h4>{os.titulo}</h4>
        <div className="tech-os-meta">
          <div className="meta-item">
            <MapPin size={14} />
            <span>{cliente?.nomeFantasia || 'Cliente não definido'} - {cliente?.endereco ? cliente.endereco.split(',')[1] || cliente.endereco : 'Endereço Indisponível'}</span>
          </div>
          <div className="meta-item">
            <Clock size={14} />
            <span>{formatOSDate(os.dataPrevista)}</span>
          </div>
        </div>
      </div>

      <div className="tech-os-card-footer">
        <span className="tech-os-status">{statusLabels[os.status]}</span>
        <ChevronRight size={18} className="tech-chevron" />
      </div>
    </div>
  );
}
