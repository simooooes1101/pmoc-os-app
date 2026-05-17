import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import './Equipamentos.css';

export function Equipamentos() {
  const { equipamentos, clientes, criarEquipamento, atualizarEquipamento, excluirEquipamento } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // formMode: 'view' | 'edit' | 'new'
  const [formMode, setFormMode] = useState('view');
  
  const initialFormState = {
    id: '',
    clienteId: '',
    codigo: '',
    tipo: 'Split Hi-Wall',
    marca: '',
    modelo: '',
    capacidadeBTU: '',
    localizacaoExata: '',
    tensao: '220V',
    numeroSerie: '',
    dataInstalacao: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const filteredEquipamentos = equipamentos.filter(eq => 
    eq.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (equipamento) => {
    setFormMode('view');
    setFormData(equipamento);
  };

  const handleNovo = () => {
    setFormMode('new');
    setFormData(initialFormState);
  };

  const handleEditar = () => {
    if (!formData.id) return;
    setFormMode('edit');
  };

  const handleExcluir = () => {
    if (!formData.id) return;
    if (window.confirm(`Tem certeza que deseja excluir o equipamento ${formData.codigo}?`)) {
      excluirEquipamento(formData.id);
      setFormData(initialFormState);
      setFormMode('view');
    }
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    if (formMode === 'new') {
      criarEquipamento(formData);
      // O contexto já cria o ID, mas como queremos atualizar a tela, voltamos pra view
      setFormMode('view');
      // Seria ideal atualizar o formData com o novo ID retornado, mas simplificaremos limpando
      setFormData(initialFormState); 
    } else if (formMode === 'edit') {
      atualizarEquipamento(formData.id, formData);
      setFormMode('view');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isReadOnly = formMode === 'view';

  return (
    <div className="equipamentos-container">
      <div className="os-header">
        <div className="os-header-title">
          <h1>Inventário de Equipamentos</h1>
          <p>Gestão de ativos e máquinas alocadas nos clientes.</p>
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleNovo}>
            <Plus size={18} /> Novo
          </button>
          <button className="btn btn-secondary" onClick={handleEditar} disabled={!formData.id || formMode !== 'view'}>
            <Edit2 size={18} /> Editar
          </button>
          <button className="btn btn-danger" onClick={handleExcluir} disabled={!formData.id || formMode !== 'view'}>
            <Trash2 size={18} /> Excluir
          </button>
        </div>
      </div>

      {/* Formulário de Cadastro */}
      <div className="card form-card">
        <div className="form-header">
          <h3>
            {formMode === 'new' ? 'Novo Equipamento' : formMode === 'edit' ? 'Editando Equipamento' : 'Dados do Equipamento'}
            {formData.id && <span className="badge info ml-2">{formData.id}</span>}
          </h3>
          {formMode !== 'view' && (
             <span className="status-indicator editing">Modo Edição</span>
          )}
        </div>
        
        <form onSubmit={handleSalvar} className="equipamento-form">
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label>Cliente Associado</label>
              <select className="form-select" name="clienteId" value={formData.clienteId} onChange={handleChange} disabled={isReadOnly} required>
                <option value="">Selecione o Cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
              </select>
            </div>
            <div className="form-group col-span-2">
              <label>Código do Equipamento (TAG)</label>
              <input type="text" className="form-input" name="codigo" value={formData.codigo} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select className="form-select" name="tipo" value={formData.tipo} onChange={handleChange} disabled={isReadOnly} required>
                <option value="Split Hi-Wall">Split Hi-Wall</option>
                <option value="Split Cassete">Split Cassete</option>
                <option value="Piso Teto">Piso Teto</option>
                <option value="VRF">Unidade VRF / VRV</option>
                <option value="Chiller">Chiller</option>
                <option value="Fancoil">Fancoil</option>
                <option value="ACJ">ACJ</option>
                <option value="Exaustor">Exaustor</option>
              </select>
            </div>
            <div className="form-group">
              <label>Marca</label>
              <input type="text" className="form-input" name="marca" value={formData.marca} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group col-span-2">
              <label>Modelo</label>
              <input type="text" className="form-input" name="modelo" value={formData.modelo} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Capacidade (BTU ou TR)</label>
              <input type="text" className="form-input" name="capacidadeBTU" value={formData.capacidadeBTU} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Tensão</label>
              <select className="form-select" name="tensao" value={formData.tensao} onChange={handleChange} disabled={isReadOnly}>
                <option value="110V">110V</option>
                <option value="220V">220V</option>
                <option value="380V">380V</option>
              </select>
            </div>
            <div className="form-group col-span-2">
              <label>Número de Série</label>
              <input type="text" className="form-input" name="numeroSerie" value={formData.numeroSerie} onChange={handleChange} readOnly={isReadOnly} />
            </div>
            <div className="form-group col-span-3">
              <label>Localização Exata</label>
              <input type="text" className="form-input" name="localizacaoExata" value={formData.localizacaoExata} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Data de Instalação</label>
              <input type="date" className="form-input" name="dataInstalacao" value={formData.dataInstalacao} onChange={handleChange} readOnly={isReadOnly} />
            </div>
          </div>
          
          {(formMode === 'new' || formMode === 'edit') && (
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => {
                setFormMode('view');
                if (formMode === 'new') setFormData(initialFormState);
              }}>
                <X size={18} /> Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} /> Salvar Equipamento
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Tabela de Equipamentos */}
      <div className="card table-card">
        <div className="table-header-controls">
          <h3>Resumo de Equipamentos</h3>
          <div className="search-box table-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Pesquisar TAG, tipo ou marca..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>TAG</th>
                <th>Cliente Associado</th>
                <th>Tipo / Marca</th>
                <th>Capacidade</th>
                <th>Status</th>
                <th>Última Manut.</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipamentos.map(eq => {
                const cli = clientes.find(c => c.id === eq.clienteId);
                return (
                  <tr 
                    key={eq.id} 
                    onClick={() => handleRowClick(eq)}
                    className={formData.id === eq.id ? 'selected-row' : ''}
                  >
                    <td className="font-mono font-bold">{eq.codigo}</td>
                    <td>{cli ? cli.nomeFantasia : 'ND'}</td>
                    <td>{eq.tipo} - {eq.marca}</td>
                    <td>{eq.capacidadeBTU}</td>
                    <td>
                      <span className={`badge ${eq.status === 'Operacional' ? 'success' : 'warning'}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td>{eq.ultimaManutencao || 'N/A'}</td>
                  </tr>
                );
              })}
              {filteredEquipamentos.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">Nenhum equipamento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
