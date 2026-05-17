import React, { useState } from 'react';
import { Plus, Search, FileCheck, Calendar, CheckCircle2, AlertTriangle, User, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './PMOCList.css';

export function PMOCList() {
  const { pmocs, clientes, responsavelTecnico, criarOuAtualizarPMOC } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isNovoPMOCModalOpen, setIsNovoPMOCModalOpen] = useState(false);
  const [novoPMOCForm, setNovoPMOCForm] = useState({ clienteId: '', dataInicio: '', vigencia: '12' });
  const [cronogramaPMOC, setCronogramaPMOC] = useState(null); // holds the pmoc object when editing schedule

  const handleNovoPMOC = (e) => {
    e.preventDefault();
    if (!novoPMOCForm.clienteId || !novoPMOCForm.dataInicio) return;
    
    criarOuAtualizarPMOC(novoPMOCForm);
    setIsNovoPMOCModalOpen(false);
    setNovoPMOCForm({ clienteId: '', dataInicio: '', vigencia: '12' });
  };

  const handleSalvarCronograma = (e) => {
    e.preventDefault();
    showNotification('Cronograma atualizado com sucesso! (Mock)', 'success');
    setCronogramaPMOC(null);
  };

  const pmocsCompletos = pmocs.map(pmoc => {
    const cliente = clientes.find(c => c.id === pmoc.clienteId);
    return {
      ...pmoc,
      cliente
    };
  }).filter(pmoc => 
    pmoc.cliente?.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmoc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pmoc-container">
      <div className="os-header">
        <div className="os-header-title">
          <h1>Motor de PMOC Digital</h1>
          <p>Gestão de Planos de Manutenção Operação e Controle.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNovoPMOCModalOpen(true)}>
          <Plus size={20} />
          Novo PMOC
        </button>
      </div>

      <div className="os-filters">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="pmoc-grid">
        {/* Card do Responsável Técnico Central */}
        <div className="card rt-card">
          <div className="rt-header">
            <h3>Responsabilidade Técnica</h3>
            <span className="badge-rt">Ativo</span>
          </div>
          <div className="rt-body">
            <div className="rt-avatar">
              <User size={32} />
            </div>
            <div className="rt-info">
              <h4>{responsavelTecnico.nome}</h4>
              <p>CREA: {responsavelTecnico.crea}</p>
              <p>ART Base: {responsavelTecnico.art}</p>
            </div>
          </div>
        </div>

        {pmocsCompletos.map(pmoc => {
          // Check for delayed schedules
          const hasAtraso = pmoc.agendamentos.some(
            ag => ag.status === 'Agendado' && isPast(parseISO(ag.data))
          );

          return (
            <div key={pmoc.id} className={`card pmoc-card ${hasAtraso ? 'border-danger' : ''}`}>
              <div className="card-header">
                <div className="pmoc-title-group">
                  <FileCheck size={20} className={pmoc.ativo ? 'text-success' : 'text-muted'} />
                  <h4>{pmoc.cliente?.nomeFantasia}</h4>
                </div>
                <span className={`badge ${pmoc.ativo ? 'Concluída' : 'Cancelada'}`}>
                  {pmoc.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              <div className="pmoc-details">
                <p><strong>ID:</strong> {pmoc.id}</p>
                <p><strong>Vigência:</strong> {format(parseISO(pmoc.dataInicio), 'dd/MM/yyyy')} a {format(parseISO(pmoc.dataVigencia), 'dd/MM/yyyy')}</p>
                <p><strong>Ambiente:</strong> {pmoc.cliente?.tipoAmbiente}</p>
              </div>

              <div className="pmoc-schedules">
                <h5>Próximos Agendamentos Automáticos</h5>
                <ul className="schedule-list">
                  {pmoc.agendamentos.slice(0, 3).map((ag, idx) => {
                    const isDelayed = ag.status === 'Agendado' && isPast(parseISO(ag.data));
                    return (
                      <li key={idx} className={`schedule-item ${isDelayed ? 'delayed' : ''}`}>
                        <Calendar size={14} />
                        <span>
                          {format(parseISO(ag.data), "dd/MMM", { locale: ptBR })} - {ag.tipo} ({ag.equipamentoId})
                        </span>
                        {isDelayed && <AlertTriangle size={14} className="text-danger ml-auto" />}
                        {!isDelayed && <CheckCircle2 size={14} className="text-success ml-auto" opacity={0.5} />}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="card-footer mt-auto">
                <button className="btn btn-secondary w-100" onClick={() => setCronogramaPMOC(pmoc)}>Gerenciar Cronograma</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo PMOC */}
      {isNovoPMOCModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>Novo PMOC</h2>
              <button className="icon-btn" onClick={() => setIsNovoPMOCModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleNovoPMOC} className="modal-body">
              <div className="form-group">
                <label className="form-label">Cliente Associado *</label>
                <select className="form-select" value={novoPMOCForm.clienteId} onChange={e => setNovoPMOCForm({...novoPMOCForm, clienteId: e.target.value})} required>
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data de Início *</label>
                <input type="date" className="form-input" value={novoPMOCForm.dataInicio} onChange={e => setNovoPMOCForm({...novoPMOCForm, dataInicio: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Duração de Vigência *</label>
                <select className="form-select" value={novoPMOCForm.vigencia} onChange={e => setNovoPMOCForm({...novoPMOCForm, vigencia: e.target.value})} required>
                  <option value="12">12 meses</option>
                  <option value="24">24 meses</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsNovoPMOCModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Ativar PMOC</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Cronograma */}
      {cronogramaPMOC && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Cronograma: {cronogramaPMOC.cliente?.nomeFantasia}</h2>
              <button className="icon-btn" onClick={() => setCronogramaPMOC(null)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSalvarCronograma} className="modal-body">
              <div className="pmoc-schedules" style={{ background: 'transparent', padding: 0 }}>
                <h5>Agendamentos do Plano</h5>
                <ul className="schedule-list">
                  {cronogramaPMOC.agendamentos.map((ag, idx) => {
                    const isDelayed = ag.status === 'Agendado' && isPast(parseISO(ag.data));
                    return (
                      <li key={idx} className={`schedule-item ${isDelayed ? 'delayed' : ''}`} style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} />
                          <span>{format(parseISO(ag.data), "dd/MMM/yyyy", { locale: ptBR })} - {ag.tipo}</span>
                        </div>
                        <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{ag.equipamentoId}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>O sistema irá gerar O.S. preventivas automaticamente 7 dias antes de cada agendamento.</p>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCronogramaPMOC(null)}>Fechar</button>
                <button type="submit" className="btn btn-primary">Forçar Geração de O.S.</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
