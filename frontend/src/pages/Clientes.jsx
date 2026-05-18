import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import './Clientes.css';

export function Clientes() {
  const { clientes, criarCliente, atualizarCliente, excluirCliente } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // formMode: 'view' | 'edit' | 'new'
  const [formMode, setFormMode] = useState('view');
  
  const initialFormState = {
    id: '',
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    emailResponsavel: '',
    tipoAmbiente: 'Comercial',
    areaClimatizada: '',
    numeroOcupantes: '',
    horarioFuncionamento: '',
    sistemaRenovacaoAr: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const filteredClientes = clientes.filter(c => 
    c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj.includes(searchTerm)
  );

  const handleRowClick = (cliente) => {
    setFormMode('view');
    setFormData(cliente);
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
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${formData.nomeFantasia}?`)) {
      excluirCliente(formData.id);
      setFormData(initialFormState);
      setFormMode('view');
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'new') {
        const novoId = `CLI${String(clientes.length + 1).padStart(3, '0')}`;
        const finalData = { ...formData, id: novoId };
        await criarCliente(finalData);
        setFormData(finalData);
      } else if (formMode === 'edit') {
        await atualizarCliente(formData.id, formData);
      }
      setFormMode('view');
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isReadOnly = formMode === 'view';

  return (
    <div className="clientes-container">
      <div className="os-header">
        <div className="os-header-title">
          <h1>Cadastro de Clientes</h1>
          <p>Gerenciamento completo do portfólio de clientes e ambientes.</p>
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
            {formMode === 'new' ? 'Novo Cadastro' : formMode === 'edit' ? 'Editando Cliente' : 'Dados do Cliente'}
            {formData.id && <span className="badge info ml-2">{formData.id}</span>}
          </h3>
          {formMode !== 'view' && (
             <span className="status-indicator editing">Modo Edição</span>
          )}
        </div>
        
        <form onSubmit={handleSalvar} className="cliente-form">
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label>Razão Social</label>
              <input type="text" className="form-input" name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group col-span-2">
              <label>Nome Fantasia</label>
              <input type="text" className="form-input" name="nomeFantasia" value={formData.nomeFantasia} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>CNPJ</label>
              <input type="text" className="form-input" name="cnpj" value={formData.cnpj} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Tipo de Ambiente</label>
              <select className="form-select" name="tipoAmbiente" value={formData.tipoAmbiente} onChange={handleChange} disabled={isReadOnly} required>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Hospitalar">Hospitalar</option>
                <option value="Educacional">Educacional</option>
                <option value="Corporativo">Corporativo</option>
              </select>
            </div>
            <div className="form-group col-span-4">
              <label>Endereço Completo</label>
              <input type="text" className="form-input" name="endereco" value={formData.endereco} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input type="text" className="form-input" name="telefone" value={formData.telefone} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group col-span-2">
              <label>E-mail do Responsável</label>
              <input type="email" className="form-input" name="emailResponsavel" value={formData.emailResponsavel} onChange={handleChange} readOnly={isReadOnly} required />
            </div>
            <div className="form-group">
              <label>Área Climatizada (m²)</label>
              <input type="number" className="form-input" name="areaClimatizada" value={formData.areaClimatizada} onChange={handleChange} readOnly={isReadOnly} />
            </div>
            <div className="form-group">
              <label>Nº Ocupantes</label>
              <input type="number" className="form-input" name="numeroOcupantes" value={formData.numeroOcupantes} onChange={handleChange} readOnly={isReadOnly} />
            </div>
            <div className="form-group">
              <label>Horário de Funcionamento</label>
              <input type="text" className="form-input" name="horarioFuncionamento" value={formData.horarioFuncionamento} onChange={handleChange} readOnly={isReadOnly} />
            </div>
            <div className="form-group col-span-2">
              <label>Sistema de Renovação de Ar</label>
              <input type="text" className="form-input" name="sistemaRenovacaoAr" value={formData.sistemaRenovacaoAr} onChange={handleChange} readOnly={isReadOnly} />
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
                <Save size={18} /> Salvar Cliente
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Tabela de Clientes */}
      <div className="card table-card">
        <div className="table-header-controls">
          <h3>Resumo de Clientes</h3>
          <div className="search-box table-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou CNPJ..." 
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
                <th>Nome Fantasia</th>
                <th>CNPJ</th>
                <th>Tipo de Ambiente</th>
                <th>PMOC</th>
                <th>Cadastrado em</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(cliente => (
                <tr 
                  key={cliente.id} 
                  onClick={() => handleRowClick(cliente)}
                  className={formData.id === cliente.id ? 'selected-row' : ''}
                >
                  <td className="font-mono text-muted">{cliente.id}</td>
                  <td className="font-bold">{cliente.nomeFantasia}</td>
                  <td>{cliente.cnpj}</td>
                  <td>{cliente.tipoAmbiente}</td>
                  <td>
                    <span className={`badge ${cliente.pmocAtivo ? 'success' : 'danger'}`}>
                      {cliente.pmocAtivo ? 'Ativo' : 'Pendente'}
                    </span>
                  </td>
                  <td>{cliente.createdAt}</td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">Nenhum cliente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
