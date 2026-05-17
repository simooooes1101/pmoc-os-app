import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import './OSList.css';

export function OSList() {
  const { ordens, clientes, equipamentos, tecnicos, atualizarStatusOS, criarOS, atualizarOS } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  const getTodayDateTimeString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  };

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novaOSForm, setNovaOSForm] = useState({
    clienteId: '',
    equipamentoId: '',
    tecnicoId: '',
    titulo: '',
    tipo: 'Preventiva',
    prioridade: 'Normal',
    dataPrevista: getTodayDateTimeString()
  });

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState(null);

  const handleNovaOS = (e) => {
    e.preventDefault();
    if (!novaOSForm.clienteId || !novaOSForm.titulo) {
      alert('Preencha os campos obrigatórios!');
      return;
    }

    const dataPrevistaISO = novaOSForm.dataPrevista 
      ? new Date(novaOSForm.dataPrevista).toISOString() 
      : new Date().toISOString();

    criarOS({
      ...novaOSForm,
      dataPrevista: dataPrevistaISO
    });

    setIsModalOpen(false);
    setNovaOSForm({ 
      clienteId: '', 
      equipamentoId: '', 
      tecnicoId: '', 
      titulo: '', 
      tipo: 'Preventiva', 
      prioridade: 'Normal',
      dataPrevista: getTodayDateTimeString()
    });
  };

  const handleSalvarEdicao = (e) => {
    e.preventDefault();
    if (!editingOS) return;
    
    // Convert input date back to ISO or keep it as is if unchanged
    atualizarOS(editingOS.id, editingOS);
    setIsEditModalOpen(false);
    setEditingOS(null);
  };

  const filteredOrdens = ordens.filter(os => 
    os.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.tecnicoId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colunas = [
    { id: 'Aguardando', titulo: 'Aguardando', cor: 'warning' },
    { id: 'Em andamento', titulo: 'Em Andamento', cor: 'info' },
    { id: 'Concluída', titulo: 'Concluídas', cor: 'success' },
    { id: 'Cancelada', titulo: 'Canceladas', cor: 'danger' }
  ];

  return (
    <div className="os-container">
      <div className="os-header">
        <div className="os-header-title">
          <h1>Ordens de Serviço</h1>
          <p>Gestão de manutenções preventivas e corretivas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Nova O.S.
        </button>
      </div>

      <div className="os-filters">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por ID, título, técnico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary"><Filter size={20} /> Filtros</button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>Nova Ordem de Serviço</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleNovaOS} className="modal-body">
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <select className="form-select" value={novaOSForm.clienteId} onChange={e => setNovaOSForm({...novaOSForm, clienteId: e.target.value})} required>
                  <option value="">Selecione um cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipamento</label>
                <select className="form-select" value={novaOSForm.equipamentoId} onChange={e => setNovaOSForm({...novaOSForm, equipamentoId: e.target.value})}>
                  <option value="">Nenhum / Geral</option>
                  {equipamentos.filter(eq => eq.clienteId === novaOSForm.clienteId).map(eq => <option key={eq.id} value={eq.id}>{eq.codigo} - {eq.tipo}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Título da O.S. *</label>
                <input type="text" className="form-input" placeholder="Ex: Preventiva Mensal" value={novaOSForm.titulo} onChange={e => setNovaOSForm({...novaOSForm, titulo: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Técnico Atribuído</label>
                <select className="form-select" value={novaOSForm.tecnicoId} onChange={e => setNovaOSForm({...novaOSForm, tecnicoId: e.target.value})}>
                  <option value="">Aguardando Atribuição</option>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data e Hora Programada</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={novaOSForm.dataPrevista} 
                  onChange={e => setNovaOSForm({...novaOSForm, dataPrevista: e.target.value})} 
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar O.S.</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="kanban-board">
        {colunas.map(col => {
          const osNaColuna = filteredOrdens.filter(os => os.status === col.id);
          
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <h3>{col.titulo}</h3>
                <span className={`badge-count ${col.cor}`}>{osNaColuna.length}</span>
              </div>
              
              <div className="kanban-cards">
                {osNaColuna.map(os => (
                  <div 
                    key={os.id} 
                    className="kanban-card card" 
                    onClick={() => {
                      setEditingOS({
                        ...os,
                        dataPrevistaInput: os.dataPrevista ? os.dataPrevista.substring(0, 16) : '' // format for datetime-local
                      });
                      setIsEditModalOpen(true);
                    }}
                  >
                    <div className="card-header">
                      <span className="os-id">{os.id}</span>
                      <span className={`badge ${os.status.replace(' ', '.')}`}>{os.prioridade}</span>
                    </div>
                    <h4 className="os-titulo">{os.titulo}</h4>
                    
                    <div className="os-meta">
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>Prev: {os.dataPrevista ? format(parseISO(os.dataPrevista), "dd/MM 'às' HH:mm", { locale: ptBR }) : '-'}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="tecnico-info">
                        {(() => {
                          const tec = tecnicos.find(t => t.id === os.tecnicoId);
                          return (
                            <>
                              <div className="avatar-sm">{tec ? tec.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ND'}</div>
                              <span className="tecnico-nome">{tec ? tec.nome : 'Aguardando Técnico'}</span>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Simple status mover for mockup purposes */}
                      {col.id === 'Aguardando' && (
                        <button className="btn-move" onClick={(e) => { e.stopPropagation(); atualizarStatusOS(os.id, 'Em andamento'); }}>
                          Iniciar
                        </button>
                      )}
                      {col.id === 'Em andamento' && (
                        <button className="btn-move success" onClick={(e) => { e.stopPropagation(); atualizarStatusOS(os.id, 'Concluída'); }}>
                          Concluir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {osNaColuna.length === 0 && (
                  <div className="kanban-empty">Nenhuma O.S.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit OS Modal */}
      {isEditModalOpen && editingOS && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>Editar O.S.: {editingOS.id}</h2>
              <button className="icon-btn" onClick={() => { setIsEditModalOpen(false); setEditingOS(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSalvarEdicao} className="modal-body">
              <div className="form-group">
                <label className="form-label">Título da O.S.</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingOS.titulo} 
                  onChange={e => setEditingOS({...editingOS, titulo: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Técnico Atribuído</label>
                <select 
                  className="form-select" 
                  value={editingOS.tecnicoId || ''} 
                  onChange={e => setEditingOS({...editingOS, tecnicoId: e.target.value})}
                >
                  <option value="">Aguardando Atribuição</option>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Previsão de Término</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={editingOS.dataPrevistaInput || ''} 
                  onChange={e => {
                    const newVal = e.target.value;
                    setEditingOS({
                      ...editingOS, 
                      dataPrevistaInput: newVal,
                      dataPrevista: newVal ? new Date(newVal).toISOString() : null
                    });
                  }} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prioridade</label>
                <select 
                  className="form-select" 
                  value={editingOS.prioridade} 
                  onChange={e => setEditingOS({...editingOS, prioridade: e.target.value})}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsEditModalOpen(false); setEditingOS(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
