import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useTechAuth } from '../../contexts/TechAuthContext';
import { 
  ArrowLeft, MapPin, Clock, Info, User, 
  Settings, CheckSquare, Play, CheckCircle2, 
  MessageSquare, Camera, History
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './TechOSDetail.css';

export function TechOSDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ordens, clientes, equipamentos, atualizarOS, showNotification } = useApp();
  const { techSession } = useTechAuth();

  const os = ordens.find(o => o.id === id);
  const cliente = clientes.find(c => c.id === os?.clienteId);
  const equipamento = equipamentos.find(e => e.id === os?.equipamentoId);

  const [loading, setLoading] = useState(false);

  if (!os) {
    return (
      <div className="tech-error-state">
        <p>Ordem de Serviço não encontrada.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/tech/dashboard')}>Voltar</button>
      </div>
    );
  }

  const handleCheckIn = () => {
    setLoading(true);
    // Simulate GPS and network delay
    setTimeout(() => {
      const now = new Date().toISOString();
      const updatedHistory = [
        ...(os.historico || []),
        { data: now, acao: 'Check-in realizado (GPS)', usuario: techSession.nome }
      ];
      
      atualizarOS(os.id, { 
        status: 'Em andamento', 
        checkIn: now,
        historico: updatedHistory 
      });
      
      setLoading(false);
      showNotification('Check-in realizado com sucesso!');
    }, 1000);
  };

  const handleGoToChecklist = () => {
    navigate(`/tech/os/${os.id}/checklist`);
  };

  return (
    <div className="tech-os-detail">
      <div className="tech-detail-header">
        <button className="icon-btn back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-titles">
          <h1>Detalhes da OS</h1>
          <span className="os-badge">{os.id}</span>
        </div>
        <div className={`status-pill ${os.status.toLowerCase().replace(' ', '-')}`}>
          {os.status}
        </div>
      </div>

      <div className="tech-detail-scroll">
        {/* Info Card */}
        <section className="detail-card main-info">
          <div className="card-row title-row">
            <h2>{os.titulo}</h2>
          </div>
          <div className="card-row">
            <MapPin size={18} className="text-accent" />
            <div className="row-content">
              <strong>{cliente?.nomeFantasia}</strong>
              <p>{cliente?.endereco}</p>
            </div>
          </div>
          <div className="card-row">
            <Clock size={18} className="text-accent" />
            <div className="row-content">
              <strong>Previsão de Término</strong>
              <p>
                {os.dataPrevista 
                  ? format(parseISO(os.dataPrevista), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
                  : 'Sem data agendada'}
              </p>
            </div>
          </div>
        </section>

        {/* Equipment Card */}
        <section className="detail-card">
          <div className="card-header">
            <Settings size={18} />
            <h3>Equipamento</h3>
          </div>
          <div className="equipment-info">
            <div className="eq-item">
              <span>TAG:</span>
              <strong>{equipamento?.codigo}</strong>
            </div>
            <div className="eq-item">
              <span>Local:</span>
              <strong>{equipamento?.localizacaoExata}</strong>
            </div>
            <div className="eq-item">
              <span>Modelo:</span>
              <strong>{equipamento?.tipo} - {equipamento?.marca}</strong>
            </div>
          </div>
        </section>

        {/* Description Card */}
        <section className="detail-card">
          <div className="card-header">
            <Info size={18} />
            <h3>Descrição do Serviço</h3>
          </div>
          <p className="os-description-text">{os.descricao}</p>
        </section>

        {/* History Card */}
        <section className="detail-card">
          <div className="card-header">
            <History size={18} />
            <h3>Histórico Recente</h3>
          </div>
          <div className="tech-timeline">
            {os.historico.slice(-3).reverse().map((h, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="time">
                    {h.data ? format(parseISO(h.data), 'HH:mm') : '--:--'}
                  </span>
                  <p>{h.acao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Action Footer */}
      <footer className="tech-detail-footer">
        {os.status === 'Aguardando' ? (
          <button 
            className="btn btn-primary tech-action-btn" 
            onClick={handleCheckIn}
            disabled={loading}
          >
            {loading ? 'Processando...' : <><Play size={20} /> Iniciar Serviço (Check-in)</>}
          </button>
        ) : os.status === 'Em andamento' ? (
          <div className="action-group">
            <button className="btn btn-secondary tech-action-btn-half" onClick={() => navigate('/tech/dashboard')}>
              Pausar
            </button>
            <button className="btn btn-primary tech-action-btn-half" onClick={handleGoToChecklist}>
              <CheckSquare size={20} /> Checklist
            </button>
          </div>
        ) : (
          <div className="concluded-msg">
            <CheckCircle2 size={24} />
            <span>Serviço Concluído</span>
          </div>
        )}
      </footer>
    </div>
  );
}
