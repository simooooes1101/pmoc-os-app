import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useTechAuth } from '../../contexts/TechAuthContext';
import { Search, MapPin, Clock, ChevronRight, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './TechOSList.css';

export function TechOSList() {
  const { ordens, clientes } = useApp();
  const { techSession } = useTechAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pendentes'); // 'pendentes' ou 'concluidas'

  // Filtra as ordens de serviço do técnico logado
  const myOS = ordens.filter(os => os.tecnicoId === techSession?.id);

  // Helper para parsing seguro de datas
  const parseSafeISO = (dateStr) => {
    if (!dateStr) return null;
    try {
      const parsed = parseISO(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  // Filtragem por busca e aba ativa
  const filteredOS = myOS.filter(os => {
    const cliente = clientes.find(c => c.id === os.clienteId);
    const matchesSearch = 
      os.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente?.nomeFantasia || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isConcluida = os.status === 'Concluída' || os.status === 'Cancelada';
    if (activeTab === 'pendentes') {
      return matchesSearch && !isConcluida;
    } else {
      return matchesSearch && isConcluida;
    }
  });

  // Ordenação das OS
  const sortedOS = [...filteredOS].sort((a, b) => {
    const dateA = parseSafeISO(a.dataPrevista || a.dataAbertura);
    const dateB = parseSafeISO(b.dataPrevista || b.dataAbertura);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return activeTab === 'pendentes' ? dateA - dateB : dateB - dateA;
  });

  const priorityColors = {
    'Urgente': 'danger',
    'Alta': 'warning',
    'Normal': 'info',
    'Baixa': 'success'
  };

  const statusLabels = {
    'Aguardando': 'Pendente',
    'Em andamento': 'Em execução',
    'Concluída': 'Finalizada',
    'Cancelada': 'Cancelada'
  };

  const formatOSDate = (dateStr) => {
    if (!dateStr) return 'Sem data agendada';
    const parsed = parseSafeISO(dateStr);
    if (!parsed) return 'Sem data agendada';
    return format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="tech-os-list-page">
      <div className="tech-list-header">
        <h1>Minhas O.S.</h1>
        <p>Histórico e ordens de serviço atribuídas.</p>
      </div>

      {/* Busca */}
      <div className="tech-search-container">
        <div className="tech-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por código, título ou cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tech-tabs">
        <button 
          className={`tech-tab-btn ${activeTab === 'pendentes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendentes')}
        >
          Pendentes
          <span className="tech-tab-badge bg-warning">
            {myOS.filter(o => o.status !== 'Concluída' && o.status !== 'Cancelada').length}
          </span>
        </button>
        <button 
          className={`tech-tab-btn ${activeTab === 'concluidas' ? 'active' : ''}`}
          onClick={() => setActiveTab('concluidas')}
        >
          Concluídas
          <span className="tech-tab-badge bg-success">
            {myOS.filter(o => o.status === 'Concluída' || o.status === 'Cancelada').length}
          </span>
        </button>
      </div>

      {/* Lista de OS */}
      <div className="tech-list-scroll">
        {sortedOS.length === 0 ? (
          <div className="tech-empty-state">
            <ClipboardList size={48} className="text-muted" />
            <p>Nenhuma ordem de serviço {activeTab === 'pendentes' ? 'pendente' : 'concluída'} encontrada.</p>
          </div>
        ) : (
          <div className="tech-os-stack">
            {sortedOS.map(os => {
              const cliente = clientes.find(c => c.id === os.clienteId);
              return (
                <div 
                  key={os.id} 
                  className={`tech-os-card status-${os.status.toLowerCase().replace(' ', '-')}`}
                  onClick={() => navigate(`/tech/os/${os.id}`)}
                >
                  <div className="tech-os-card-header">
                    <span className="tech-os-id">{os.id}</span>
                    <span className={`badge ${priorityColors[os.prioridade]}`}>{os.prioridade}</span>
                  </div>
                  
                  <div className="tech-os-card-body">
                    <h4>{os.titulo}</h4>
                    <div className="tech-os-meta">
                      <div className="meta-item">
                        <MapPin size={14} />
                        <span>
                          {cliente?.nomeFantasia || 'Cliente não definido'} 
                          {cliente?.endereco && ` - ${cliente.endereco.split(',')[1] || cliente.endereco}`}
                        </span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
