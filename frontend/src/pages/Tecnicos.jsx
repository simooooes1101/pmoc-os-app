import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Plus, Edit2, Trash2, Save } from 'lucide-react';
import './Tecnicos.css';

export function Tecnicos() {
  const { tecnicos, criarTecnico, atualizarTecnico, excluirTecnico } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // formMode: 'view' | 'edit' | 'new'
  const [formMode, setFormMode] = useState('view');
  
  const initialFormState = {
    id: '',
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    especialidade: '',
    status: 'Ativo'
  };

  const [formData, setFormData] = useState(initialFormState);

  // Set the first technician as selected on load
  useEffect(() => {
    if (tecnicos.length > 0 && !formData.id && formMode === 'view') {
      setFormData(tecnicos[0]);
    }
  }, [tecnicos, formData.id, formMode]);

  const filteredTecnicos = tecnicos.filter(t => 
    (t.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.especialidade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (tecnico) => {
    setFormMode('view');
    setFormData(tecnico);
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
    if (window.confirm(`Tem certeza que deseja excluir o técnico ${formData.nome}?`)) {
      excluirTecnico(formData.id);
      setFormData(initialFormState);
      setFormMode('view');
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'new') {
        const nextNum = tecnicos.length + 1;
        const novoId = `TEC${String(nextNum).padStart(3, '0')}`;
        const finalData = { ...formData, id: novoId };
        await criarTecnico(finalData);
        setFormData(finalData);
      } else if (formMode === 'edit') {
        await atualizarTecnico(formData.id, formData);
      }
      setFormMode('view');
    } catch (err) {
      console.error("Erro ao salvar técnico:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isReadOnly = formMode === 'view';

  return (
    <div className="tecnicos-container">
      <div className="os-header">
        <div className="os-header-title">
          <h1>Cadastro de Técnicos</h1>
          <p>Gerenciamento completo da equipe técnica, especialidades e disponibilidade de campo.</p>
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
            {formMode === 'new' ? 'Novo Cadastro' : formMode === 'edit' ? 'Editando Técnico' : 'Dados do Técnico'}
            {formData.id && <span className="badge info ml-2">{formData.id}</span>}
          </h3>
          {formMode !== 'view' && (
             <span className="status-indicator editing">Modo Edição</span>
          )}
        </div>
        
        <form onSubmit={handleSalvar} className="tecnico-form">
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label>Nome Completo</label>
              <input type="text" className="form-input" name="nome" value={formData.nome} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>CPF</label>
              <input type="text" className="form-input" name="cpf" value={formData.cpf} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input type="text" className="form-input" name="telefone" value={formData.telefone} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group col-span-2">
              <label>E-mail (Login de Acesso)</label>
              <input type="email" className="form-input" name="email" value={formData.email} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Especialidade</label>
              <input type="text" className="form-input" name="especialidade" value={formData.especialidade} onChange={handleChange} readOnly={isReadOnly} placeholder="Ex: Climatização, Eletromecânica" required />
            </div>
            <div className="form-group">
              <label>Status Operacional</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleChange} disabled={isReadOnly} required>
                <option value="Ativo">Ativo</option>
                <option value="Férias">Férias</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          {formMode !== 'view' && (
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setFormMode('view'); if (tecnicos.length > 0) setFormData(tecnicos[0]); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} /> Salvar
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Tabela de Técnicos Cadastrados */}
      <div className="card table-card">
        <div className="table-header-controls">
          <h3>Técnicos Cadastrados</h3>
          <div className="search-box table-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar técnico..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTecnicos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">Nenhum técnico encontrado.</td>
                </tr>
              ) : (
                filteredTecnicos.map(t => (
                  <tr 
                    key={t.id} 
                    onClick={() => handleRowClick(t)}
                    className={formData.id === t.id ? 'selected-row' : ''}
                  >
                    <td><strong>{t.id}</strong></td>
                    <td>{t.nome}</td>
                    <td>{t.especialidade}</td>
                    <td>{t.telefone}</td>
                    <td>{t.email}</td>
                    <td>
                      <span className={`badge ${t.status === 'Ativo' ? 'success' : t.status === 'Férias' ? 'warning' : 'danger'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
