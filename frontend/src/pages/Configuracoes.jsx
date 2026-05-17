import React, { useState, useEffect } from 'react';
import {
  Building2, Users, FileCheck, ClipboardList, CheckSquare,
  HardHat, Calendar, MessageCircle, FileText, DollarSign,
  ShieldCheck, Plug, LayoutDashboard, Archive, Settings,
  Save, Eye, EyeOff, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Configuracoes.css';

const TABS = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'usuarios', label: 'Usuários e Permissões', icon: Users },
  { id: 'pmoc', label: 'PMOC', icon: FileCheck },
  { id: 'os', label: 'Ordens de Serviço', icon: ClipboardList },
  { id: 'checklist', label: 'Checklist Técnico', icon: CheckSquare },
  { id: 'tecnicos', label: 'Técnicos', icon: HardHat },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'comunicacao', label: 'Comunicação', icon: MessageCircle },
  { id: 'laudos', label: 'Laudos PDF', icon: FileText },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'seguranca', label: 'Segurança', icon: ShieldCheck },
  { id: 'integracoes', label: 'Integrações', icon: Plug },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'backup', label: 'Backup e LGPD', icon: Archive },
  { id: 'preferencias', label: 'Preferências do Sistema', icon: Settings },
];

// Generic toggle component
function Toggle({ value, onChange, label, description }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {description && <span className="setting-desc">{description}</span>}
      </div>
      <button className={`toggle-btn ${value ? 'active' : ''}`} onClick={() => onChange(!value)} type="button">
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div className="settings-section">
      <h4 className="section-title">{title}</h4>
      {children}
    </div>
  );
}

// ── Individual Tab Components ──────────────────────────────────

function TabEmpresa({ prefs, onSave }) {
  const [form, setForm] = useState(prefs.empresa || {
    razaoSocial: 'Empresa de Climatização Ltda.', nomeFantasia: 'ClimaPro',
    cnpj: '', crea: '', responsavelTecnico: '', email: '', telefone: '', endereco: ''
  });
  return (
    <div className="tab-content">
      <h2>Dados da Empresa</h2>
      <p className="tab-desc">Informações que aparecem nos laudos e documentos gerados pelo sistema.</p>
      <SettingsSection title="Dados Cadastrais">
        <div className="settings-form-grid">
          {[['Razão Social', 'razaoSocial'], ['Nome Fantasia', 'nomeFantasia'], ['CNPJ', 'cnpj'],
            ['CREA da Empresa', 'crea'], ['Responsável Técnico', 'responsavelTecnico'],
            ['E-mail', 'email'], ['Telefone', 'telefone']].map(([label, field]) => (
            <div className="form-group" key={field}>
              <label className="form-label">{label}</label>
              <input className="form-input" value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })} />
            </div>
          ))}
          <div className="form-group col-span-2">
            <label className="form-label">Endereço</label>
            <input className="form-input" value={form.endereco || ''} onChange={e => setForm({ ...form, endereco: e.target.value })} />
          </div>
        </div>
      </SettingsSection>
      <div className="save-row"><button className="btn btn-primary" onClick={() => onSave('empresa', form)}><Save size={16} /> Salvar</button></div>
    </div>
  );
}

function TabUsuarios({ prefs, onSave }) {
  const { users, addUser, updatePassword, currentUser } = useAuth();
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'technician' });
  const [changePwd, setChangePwd] = useState({ userId: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState('');

  const roles = { admin: 'Administrador', manager: 'Gestor', technician: 'Técnico', viewer: 'Visualizador' };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    addUser(newUser);
    setNewUser({ username: '', password: '', name: '', role: 'technician' });
    setMsg('Usuário criado com sucesso!');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleChangePwd = (e) => {
    e.preventDefault();
    if (changePwd.newPwd !== changePwd.confirm) { setMsg('As senhas não conferem!'); return; }
    if (!changePwd.newPwd || changePwd.newPwd.length < 4) { setMsg('A senha deve ter pelo menos 4 caracteres.'); return; }
    updatePassword(changePwd.userId || currentUser.id, changePwd.newPwd);
    setChangePwd({ userId: '', newPwd: '', confirm: '' });
    setMsg('Senha atualizada com sucesso!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="tab-content">
      <h2>Usuários e Permissões</h2>
      <p className="tab-desc">Gerencie quem tem acesso ao sistema e com quais privilégios.</p>
      {msg && <div className="config-msg success">{msg}</div>}

      <SettingsSection title="Usuários do Sistema">
        <table className="data-table">
          <thead><tr><th>Usuário</th><th>Nome</th><th>Perfil</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.id === currentUser?.id ? 'selected-row' : ''}>
                <td className="font-mono">{u.username}</td>
                <td>{u.name}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'Concluída' : 'info'}`}>{roles[u.role] || u.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsSection>

      <SettingsSection title="Adicionar Novo Usuário">
        <form onSubmit={handleAddUser} className="settings-form-grid">
          <div className="form-group"><label className="form-label">Login</label><input className="form-input" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Nome Completo</label><input className="form-input" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Senha Inicial</label><input className="form-input" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Perfil</label>
            <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group col-span-4 flex-end"><button type="submit" className="btn btn-primary"><Plus size={16} /> Criar Usuário</button></div>
        </form>
      </SettingsSection>

      <SettingsSection title="Alterar Minha Senha">
        <form onSubmit={handleChangePwd} className="settings-form-grid">
          <div className="form-group col-span-2">
            <label className="form-label">Nova Senha</label>
            <div className="input-with-icon">
              <input className="form-input" type={showPwd ? 'text' : 'password'} value={changePwd.newPwd} onChange={e => setChangePwd({ ...changePwd, newPwd: e.target.value })} style={{ paddingRight: '3rem' }} />
              <button type="button" className="icon-btn" style={{ position: 'absolute', right: '0.5rem' }} onClick={() => setShowPwd(!showPwd)}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Confirmar Senha</label>
            <input className="form-input" type={showPwd ? 'text' : 'password'} value={changePwd.confirm} onChange={e => setChangePwd({ ...changePwd, confirm: e.target.value })} />
          </div>
          <div className="form-group col-span-4 flex-end"><button type="submit" className="btn btn-secondary"><Save size={16} /> Salvar Nova Senha</button></div>
        </form>
      </SettingsSection>
    </div>
  );
}

function GenericTab({ title, desc, children, prefs, tabKey, onSave }) {
  return (
    <div className="tab-content">
      <h2>{title}</h2>
      <p className="tab-desc">{desc}</p>
      {children}
      <div className="save-row"><button className="btn btn-primary" onClick={() => onSave(tabKey, prefs[tabKey])}><Save size={16} /> Salvar Configurações</button></div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export function Configuracoes() {
  const [activeTab, setActiveTab] = useState('empresa');

  const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem('pmoc_config') || '{}'); } catch { return {}; }
  };

  const [prefs, setPrefs] = useState(loadPrefs);

  const saveSection = (key, data) => {
    const updated = { ...prefs, [key]: data };
    setPrefs(updated);
    localStorage.setItem('pmoc_config', JSON.stringify(updated));
    alert('Configurações salvas com sucesso!');
  };

  const toggle = (tabKey, field) => {
    const current = prefs[tabKey] || {};
    saveSection(tabKey, { ...current, [field]: !current[field] });
  };

  const val = (tabKey, field, def = false) => (prefs[tabKey] || {})[field] ?? def;

  const renderTab = () => {
    switch (activeTab) {
      case 'empresa': return <TabEmpresa prefs={prefs} onSave={saveSection} />;
      case 'usuarios': return <TabUsuarios prefs={prefs} onSave={saveSection} />;
      
      case 'pmoc': return (
        <GenericTab title="Configurações de PMOC" desc="Parâmetros de geração e controle dos Planos de Manutenção." prefs={prefs} tabKey="pmoc" onSave={saveSection}>
          <SettingsSection title="Geração Automática">
            <Toggle value={val('pmoc', 'autoGerarOS')} onChange={v => toggle('pmoc', 'autoGerarOS')} label="Gerar OS automaticamente" description="O sistema criará O.S. preventivas 7 dias antes do agendamento." />
            <Toggle value={val('pmoc', 'alertaVencimento')} onChange={v => toggle('pmoc', 'alertaVencimento')} label="Alertar sobre vencimento de vigência" description="Notificação 30 dias antes do término do plano." />
            <Toggle value={val('pmoc', 'exigirArt')} onChange={v => toggle('pmoc', 'exigirArt')} label="Exigir ART no PMOC" description="Bloqueará a ativação sem ART cadastrada." />
          </SettingsSection>
          <SettingsSection title="Prazos Padrão">
            <div className="settings-form-grid">
              <div className="form-group"><label className="form-label">SLA Preventiva (horas)</label><input className="form-input" type="number" defaultValue="72" /></div>
              <div className="form-group"><label className="form-label">SLA Corretiva (horas)</label><input className="form-input" type="number" defaultValue="8" /></div>
            </div>
          </SettingsSection>
        </GenericTab>
      );

      case 'os': return (
        <GenericTab title="Ordens de Serviço" desc="Fluxo de trabalho e comportamento das O.S." prefs={prefs} tabKey="os" onSave={saveSection}>
          <SettingsSection title="Fluxo de Aprovação">
            <Toggle value={val('os', 'aprovacaoGestor')} onChange={v => toggle('os', 'aprovacaoGestor')} label="Aprovação do Gestor para Corretivas" description="OS corretivas acima de R$ 1.000 requerem aprovação." />
            <Toggle value={val('os', 'checkInObrigatorio')} onChange={v => toggle('os', 'checkInObrigatorio')} label="Check-in com GPS obrigatório" description="Técnico precisa confirmar presença via GPS para iniciar." />
            <Toggle value={val('os', 'fotoObrigatoria')} onChange={v => toggle('os', 'fotoObrigatoria')} label="Foto obrigatória na conclusão" />
          </SettingsSection>
        </GenericTab>
      );

      case 'checklist': return (
        <GenericTab title="Checklist Técnico" desc="Itens padrão do checklist de inspeção." prefs={prefs} tabKey="checklist" onSave={saveSection}>
          <SettingsSection title="Itens Obrigatórios">
            {['Limpeza de Filtros', 'Verificação de Dreno', 'Inspeção Elétrica', 'Análise de Pressão', 'Verificação de Ruídos'].map(item => (
              <Toggle key={item} value={val('checklist', item, true)} onChange={v => toggle('checklist', item)} label={item} />
            ))}
          </SettingsSection>
        </GenericTab>
      );

      case 'tecnicos': return (
        <GenericTab title="Configurações de Técnicos" desc="Parâmetros de gestão da equipe." prefs={prefs} tabKey="tecnicos" onSave={saveSection}>
          <SettingsSection title="App Mobile">
            <Toggle value={val('tecnicos', 'appMobile')} onChange={v => toggle('tecnicos', 'appMobile')} label="Habilitar acesso via App" description="Técnicos poderão acessar e executar OS pelo celular." />
            <Toggle value={val('tecnicos', 'gpsTracking')} onChange={v => toggle('tecnicos', 'gpsTracking')} label="Rastreamento GPS em tempo real" />
          </SettingsSection>
          <SettingsSection title="Limites">
            <div className="settings-form-grid">
              <div className="form-group"><label className="form-label">Máx. OS simultâneas por técnico</label><input className="form-input" type="number" defaultValue="5" /></div>
              <div className="form-group"><label className="form-label">Intervalo mínimo entre OS (min)</label><input className="form-input" type="number" defaultValue="30" /></div>
            </div>
          </SettingsSection>
        </GenericTab>
      );

      case 'agenda': return (
        <GenericTab title="Configurações da Agenda" desc="Comportamento do calendário e bloqueios." prefs={prefs} tabKey="agenda" onSave={saveSection}>
          <SettingsSection title="Exibição">
            <Toggle value={val('agenda', 'mostrarPMOC')} onChange={v => toggle('agenda', 'mostrarPMOC')} label="Exibir agendamentos de PMOC" />
            <Toggle value={val('agenda', 'mostrarOSSemTecnico')} onChange={v => toggle('agenda', 'mostrarOSSemTecnico')} label="Exibir OS sem técnico atribuído" />
            <Toggle value={val('agenda', 'bloquearFeriados')} onChange={v => toggle('agenda', 'bloquearFeriados')} label="Bloquear datas de feriados" />
          </SettingsSection>
          <SettingsSection title="Horário Comercial">
            <div className="settings-form-grid">
              <div className="form-group"><label className="form-label">Início</label><input className="form-input" type="time" defaultValue="08:00" /></div>
              <div className="form-group"><label className="form-label">Fim</label><input className="form-input" type="time" defaultValue="18:00" /></div>
            </div>
          </SettingsSection>
        </GenericTab>
      );

      case 'comunicacao': return (
        <GenericTab title="Comunicação" desc="Notificações e alertas para clientes e equipe." prefs={prefs} tabKey="comunicacao" onSave={saveSection}>
          <SettingsSection title="WhatsApp Business">
            <Toggle value={val('comunicacao', 'whatsapp')} onChange={v => toggle('comunicacao', 'whatsapp')} label="Envio automático via WhatsApp" description="Requer integração com API do WhatsApp Business." />
            <div className="form-group"><label className="form-label">Número de Envio</label><input className="form-input" placeholder="+55 (11) 99999-9999" /></div>
          </SettingsSection>
          <SettingsSection title="E-mail">
            <Toggle value={val('comunicacao', 'emailConclusao')} onChange={v => toggle('comunicacao', 'emailConclusao')} label="E-mail ao cliente na conclusão da OS" />
            <Toggle value={val('comunicacao', 'emailRelatorio')} onChange={v => toggle('comunicacao', 'emailRelatorio')} label="Relatório semanal automático" />
          </SettingsSection>
        </GenericTab>
      );

      case 'laudos': return (
        <GenericTab title="Laudos e PDF" desc="Configuração dos documentos gerados automaticamente." prefs={prefs} tabKey="laudos" onSave={saveSection}>
          <SettingsSection title="Modelo de Laudo">
            <Toggle value={val('laudos', 'logoNoLaudo')} onChange={v => toggle('laudos', 'logoNoLaudo')} label="Incluir logo da empresa" />
            <Toggle value={val('laudos', 'assinatura')} onChange={v => toggle('laudos', 'assinatura')} label="Assinatura digital do RT" description="Requer ART cadastrada e assinatura digitalizada." />
            <Toggle value={val('laudos', 'fotos')} onChange={v => toggle('laudos', 'fotos')} label="Incluir fotos no laudo" />
          </SettingsSection>
        </GenericTab>
      );

      case 'financeiro': return (
        <GenericTab title="Financeiro" desc="Controle de valores e faturas." prefs={prefs} tabKey="financeiro" onSave={saveSection}>
          <SettingsSection title="Cobranças">
            <Toggle value={val('financeiro', 'faturamentoAuto')} onChange={v => toggle('financeiro', 'faturamentoAuto')} label="Faturamento automático ao concluir OS" />
            <Toggle value={val('financeiro', 'impostos')} onChange={v => toggle('financeiro', 'impostos')} label="Calcular impostos automaticamente" />
          </SettingsSection>
          <SettingsSection title="Valores Padrão">
            <div className="settings-form-grid">
              <div className="form-group"><label className="form-label">Hora Técnica (R$)</label><input className="form-input" type="number" defaultValue="150" /></div>
              <div className="form-group"><label className="form-label">Deslocamento (R$/km)</label><input className="form-input" type="number" defaultValue="2.50" /></div>
            </div>
          </SettingsSection>
        </GenericTab>
      );

      case 'seguranca': return (
        <GenericTab title="Segurança" desc="Políticas de acesso e proteção dos dados." prefs={prefs} tabKey="seguranca" onSave={saveSection}>
          <SettingsSection title="Acesso">
            <Toggle value={val('seguranca', 'duplo')} onChange={v => toggle('seguranca', 'duplo')} label="Autenticação em dois fatores (2FA)" description="Aumenta a segurança exigindo código adicional no login." />
            <Toggle value={val('seguranca', 'logAtividades')} onChange={v => toggle('seguranca', 'logAtividades')} label="Log de atividades do usuário" />
            <Toggle value={val('seguranca', 'timeoutSessao')} onChange={v => toggle('seguranca', 'timeoutSessao')} label="Timeout automático de sessão (30 min)" />
          </SettingsSection>
          <SettingsSection title="Senha">
            <Toggle value={val('seguranca', 'senhaForte')} onChange={v => toggle('seguranca', 'senhaForte')} label="Exigir senha forte" description="Mínimo 8 caracteres, letras e números." />
            <div className="form-group"><label className="form-label">Expiração de senha (dias)</label><input className="form-input" type="number" defaultValue="90" /></div>
          </SettingsSection>
        </GenericTab>
      );

      case 'integracoes': return (
        <GenericTab title="Integrações" desc="Conexões com sistemas externos." prefs={prefs} tabKey="integracoes" onSave={saveSection}>
          {[['Google Calendar', 'google'], ['ERP SAP', 'sap'], ['Nota Fiscal Eletrônica (NF-e)', 'nfe'], ['Mercado Livre Anúncios', 'ml']].map(([name, key]) => (
            <SettingsSection title={name} key={key}>
              <Toggle value={val('integracoes', key)} onChange={v => toggle('integracoes', key)} label={`Habilitar integração com ${name}`} />
              {val('integracoes', key) && (
                <div className="form-group"><label className="form-label">Chave de API / Token</label><input className="form-input" type="password" placeholder="sk-..." /></div>
              )}
            </SettingsSection>
          ))}
        </GenericTab>
      );

      case 'dashboard': return (
        <GenericTab title="Dashboard" desc="Personalize a tela principal do gestor." prefs={prefs} tabKey="dashboard" onSave={saveSection}>
          <SettingsSection title="Widgets Visíveis">
            {['KPIs Resumidos', 'Gráfico OS por Mês', 'Mapa de SLA', 'Alertas de PMOC', 'Agenda do Dia'].map(item => (
              <Toggle key={item} value={val('dashboard', item, true)} onChange={v => toggle('dashboard', item)} label={item} />
            ))}
          </SettingsSection>
        </GenericTab>
      );

      case 'backup': return (
        <GenericTab title="Backup e LGPD" desc="Gestão de dados e conformidade com a lei." prefs={prefs} tabKey="backup" onSave={saveSection}>
          <SettingsSection title="Backup">
            <Toggle value={val('backup', 'autoBackup')} onChange={v => toggle('backup', 'autoBackup')} label="Backup automático diário" />
            <button className="btn btn-secondary" onClick={() => {
              const data = { ...localStorage };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'pmoc-backup.json'; a.click();
            }}>Exportar dados agora (JSON)</button>
          </SettingsSection>
          <SettingsSection title="LGPD">
            <Toggle value={val('backup', 'consentimento')} onChange={v => toggle('backup', 'consentimento')} label="Coleta de dados com consentimento" />
            <Toggle value={val('backup', 'retencao')} onChange={v => toggle('backup', 'retencao')} label="Política de retenção de 5 anos" />
          </SettingsSection>
        </GenericTab>
      );

      case 'preferencias': return (
        <GenericTab title="Preferências do Sistema" desc="Personalização da interface." prefs={prefs} tabKey="preferencias" onSave={saveSection}>
          <SettingsSection title="Interface">
            <Toggle value={val('preferencias', 'modoEscuro', true)} onChange={v => toggle('preferencias', 'modoEscuro')} label="Modo Escuro" />
            <Toggle value={val('preferencias', 'animacoes', true)} onChange={v => toggle('preferencias', 'animacoes')} label="Animações e transições" />
            <Toggle value={val('preferencias', 'sidebar')} onChange={v => toggle('preferencias', 'sidebar')} label="Sidebar recolhida por padrão" />
          </SettingsSection>
          <SettingsSection title="Idioma e Formato">
            <div className="settings-form-grid">
              <div className="form-group"><label className="form-label">Idioma</label>
                <select className="form-select"><option value="pt-BR">Português (Brasil)</option></select>
              </div>
              <div className="form-group"><label className="form-label">Formato de Data</label>
                <select className="form-select"><option value="dd/mm/yyyy">DD/MM/AAAA</option></select>
              </div>
            </div>
          </SettingsSection>
        </GenericTab>
      );

      default: return <div className="tab-content"><h2>Em breve</h2></div>;
    }
  };

  return (
    <div className="config-container">
      <div className="os-header">
        <div className="os-header-title">
          <h1>Configurações do Sistema</h1>
          <p>Personalize o comportamento e os parâmetros da plataforma.</p>
        </div>
      </div>

      <div className="config-layout">
        <nav className="config-sidebar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`config-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="config-content card">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
