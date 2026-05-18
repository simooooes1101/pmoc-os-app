import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useTechAuth } from './TechAuthContext';
import {
  mockClientes,
  mockTecnicos,
  mockEquipamentos,
  mockOrdens,
  mockPMOC,
  mockResponsavelTecnico,
  mockKPIs,
} from '../data/mockData';

const AppContext = createContext();

// Verifica se as credenciais do Supabase estão configuradas no ambiente
const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  !import.meta.env.VITE_SUPABASE_URL.includes('seu-projeto-id') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY && 
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('cole-sua-chave');

// Mapeamentos para conversão camelCase <-> snake_case entre React e PostgreSQL
const CLIENTE_MAP = {
  razao_social: 'razaoSocial',
  nome_fantasia: 'nomeFantasia',
  email_responsavel: 'emailResponsavel',
  tipo_ambiente: 'tipoAmbiente',
  area_climatizada: 'areaClimatizada',
  numero_ocupantes: 'numeroOcupantes',
  horario_funcionamento: 'horarioFuncionamento',
  sistema_renovacao_ar: 'sistemaRenovacaoAr',
  pmoc_ativo: 'pmocAtivo',
  created_at: 'createdAt'
};

const TECNICO_MAP = {
  created_at: 'createdAt'
};

const EQUIPAMENTO_MAP = {
  cliente_id: 'clienteId',
  capacidade_btu: 'capacidadeBTU',
  localizacao_exata: 'localizacaoExata',
  numero_serie: 'numeroSerie',
  data_instalacao: 'dataInstalacao',
  ultima_manutencao: 'ultimaManutencao',
  proxima_manutencao: 'proximaManutencao'
};

const PMOC_MAP = {
  cliente_id: 'clienteId',
  responsavel_tecnico_id: 'responsavelTecnicoId',
  data_inicio: 'dataInicio',
  data_vigencia: 'dataVigencia'
};

const OS_MAP = {
  cliente_id: 'clienteId',
  equipamento_id: 'equipamentoId',
  tecnico_id: 'tecnicoId',
  data_abertura: 'dataAbertura',
  data_prevista: 'dataPrevista',
  data_conclusao: 'dataConclusao',
  check_in: 'checkIn',
  check_out: 'checkOut',
  sla_horas: 'slaHoras',
  valor_estimado: 'valorEstimado',
  valor_final: 'valorFinal',
  pecas_utilizadas: 'pecasUtilizadas'
};

const mapToFrontend = (obj, mapping) => {
  if (!obj) return obj;
  const newObj = { ...obj };
  Object.keys(mapping).forEach(pgKey => {
    if (pgKey in newObj) {
      newObj[mapping[pgKey]] = newObj[pgKey];
      delete newObj[pgKey];
    }
  });
  return newObj;
};

const mapToBackend = (obj, mapping) => {
  if (!obj) return obj;
  const newObj = { ...obj };
  
  // 1. Mapeia chaves do frontend para o backend (camelCase -> snake_case)
  Object.keys(mapping).forEach(pgKey => {
    const jsKey = mapping[pgKey];
    if (jsKey in newObj) {
      newObj[pgKey] = newObj[jsKey];
      delete newObj[jsKey];
    }
  });

  // 2. Converte qualquer string vazia ("") para NULL antes de enviar para o PostgreSQL
  // Isso evita violações de chave estrangeira (FK), datas inválidas e erros de tipo numérico.
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === '') {
      newObj[key] = null;
    }
  });

  return newObj;
};

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const { techSession } = useTechAuth();
  
  // Helper para carregar dados locais se não houver Supabase
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [pmocs, setPmocs] = useState([]);
  const [responsavelTecnico, setResponsavelTecnico] = useState(mockResponsavelTecnico);
  const [kpis, setKpis] = useState(mockKPIs);
  const [notification, setNotification] = useState(null);
  const [techNotifications, setTechNotifications] = useState(() => loadState('pmoc_tech_notifications', []));
  const [loadingDb, setLoadingDb] = useState(isSupabaseConfigured);

  const prevOrdensRef = useRef(ordens);

  // 1. CARREGAR DADOS DO SUPABASE
  const carregarDadosSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      setLoadingDb(true);
      
      // Sempre busca os técnicos de forma pública (para a tela de login do técnico)
      const resTec = await supabase.from('tecnicos').select('*');
      if (resTec.data) setTecnicos(resTec.data);

      // As outras tabelas exigem login de gestor ou técnico
      if (currentUser || techSession) {
        const [resCli, resEq, resOs, resPmoc, resRt] = await Promise.all([
          supabase.from('clientes').select('*'),
          supabase.from('equipamentos').select('*'),
          supabase.from('ordens_servico').select('*'),
          supabase.from('pmocs').select('*'),
          supabase.from('responsavel_tecnico').select('*').limit(1)
        ]);

        if (resCli.data) setClientes(resCli.data.map(c => mapToFrontend(c, CLIENTE_MAP)));
        if (resEq.data) setEquipamentos(resEq.data.map(e => mapToFrontend(e, EQUIPAMENTO_MAP)));
        if (resOs.data) setOrdens(resOs.data.map(o => mapToFrontend(o, OS_MAP)));
        if (resPmoc.data) setPmocs(resPmoc.data.map(p => mapToFrontend(p, PMOC_MAP)));
        if (resRt.data && resRt.data[0]) setResponsavelTecnico(resRt.data[0]);
      }
    } catch (err) {
      console.error("Erro ao sincronizar dados com o Supabase:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  // 2. INICIALIZAÇÃO E REAL-TIME SYNC
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Modo Local (Fallback)
      setClientes(loadState('pmoc_clientes', mockClientes));
      setTecnicos(loadState('pmoc_tecnicos', mockTecnicos));
      setEquipamentos(loadState('pmoc_equipamentos', mockEquipamentos));
      setOrdens(loadState('pmoc_ordens', mockOrdens));
      setPmocs(loadState('pmoc_pmocs', mockPMOC));
      return;
    }

    // Sempre busca técnicos para o PIN pad de login
    carregarDadosSupabase();

    if (!currentUser && !techSession) {
      // Limpa dados locais se totalmente deslogado
      setClientes([]);
      setEquipamentos([]);
      setOrdens([]);
      setPmocs([]);
      return;
    }

    // Sincronização em tempo real via Websockets do Supabase
    const canal = supabase
      .channel('schema-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => carregarDadosSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tecnicos' }, () => carregarDadosSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipamentos' }, () => carregarDadosSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_servico' }, () => carregarDadosSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pmocs' }, () => carregarDadosSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responsavel_tecnico' }, () => carregarDadosSupabase())
      .subscribe();

    return () => {
      canal.unsubscribe();
    };
  }, [currentUser, techSession]);

  // 3. PERSISTÊNCIA EM LOCALSTORAGE APENAS NO MODO LOCAL (Para evitar redundância)
  useEffect(() => {
    if (!isSupabaseConfigured && clientes.length > 0) localStorage.setItem('pmoc_clientes', JSON.stringify(clientes));
  }, [clientes]);
  useEffect(() => {
    if (!isSupabaseConfigured && tecnicos.length > 0) localStorage.setItem('pmoc_tecnicos', JSON.stringify(tecnicos));
  }, [tecnicos]);
  useEffect(() => {
    if (!isSupabaseConfigured && equipamentos.length > 0) localStorage.setItem('pmoc_equipamentos', JSON.stringify(equipamentos));
  }, [equipamentos]);
  useEffect(() => {
    if (!isSupabaseConfigured && ordens.length > 0) localStorage.setItem('pmoc_ordens', JSON.stringify(ordens));
  }, [ordens]);
  useEffect(() => {
    if (!isSupabaseConfigured && pmocs.length > 0) localStorage.setItem('pmoc_pmocs', JSON.stringify(pmocs));
  }, [pmocs]);

  useEffect(() => {
    localStorage.setItem('pmoc_tech_notifications', JSON.stringify(techNotifications));
  }, [techNotifications]);

  // Sincronização entre abas de navegador local (Apenas no Modo Fallback)
  useEffect(() => {
    if (isSupabaseConfigured) return;
    const handleStorageChange = (e) => {
      if (e.key === 'pmoc_ordens' && e.newValue) setOrdens(JSON.parse(e.newValue));
      if (e.key === 'pmoc_clientes' && e.newValue) setClientes(JSON.parse(e.newValue));
      if (e.key === 'pmoc_tecnicos' && e.newValue) setTecnicos(JSON.parse(e.newValue));
      if (e.key === 'pmoc_equipamentos' && e.newValue) setEquipamentos(JSON.parse(e.newValue));
      if (e.key === 'pmoc_pmocs' && e.newValue) setPmocs(JSON.parse(e.newValue));
      if (e.key === 'pmoc_tech_notifications' && e.newValue) setTechNotifications(JSON.parse(e.newValue));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Monitor de atribuição de O.S. (Gera notificações para os técnicos)
  useEffect(() => {
    const prevOrdens = prevOrdensRef.current;
    if (prevOrdens && prevOrdens !== ordens && Array.isArray(prevOrdens) && Array.isArray(ordens)) {
      const addedNotifications = [];

      ordens.forEach(os => {
        const oldOs = prevOrdens.find(o => o.id === os.id);
        if (!oldOs) {
          if (os.tecnicoId) {
            addedNotifications.push({
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              tecnicoId: os.tecnicoId,
              mensagem: `Nova OS ${os.id} atribuída: "${os.titulo}".`,
              lida: false,
              data: new Date().toISOString()
            });
          }
        } else {
          if (os.tecnicoId !== oldOs.tecnicoId) {
            if (oldOs.tecnicoId) {
              addedNotifications.push({
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                tecnicoId: oldOs.tecnicoId,
                mensagem: `Você não é mais o responsável pela OS ${os.id}.`,
                lida: false,
                data: new Date().toISOString()
              });
            }
            if (os.tecnicoId) {
              addedNotifications.push({
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                tecnicoId: os.tecnicoId,
                mensagem: `Nova OS ${os.id} foi atribuída a você por reagendamento.`,
                lida: false,
                data: new Date().toISOString()
              });
            }
          }
        }
      });

      if (addedNotifications.length > 0) {
        setTechNotifications(prev => [...addedNotifications, ...prev]);
        // Salva notificações na nuvem se conectado
        if (isSupabaseConfigured) {
          addedNotifications.forEach(async notif => {
            await supabase.from('notificacoes').insert({
              tecnico_id: notif.tecnicoId,
              mensagem: notif.mensagem,
              lida: false
            });
          });
        }
      }
    }
    prevOrdensRef.current = ordens;
  }, [ordens]);

  const lerNotificacaoTech = useCallback(async (notifId) => {
    setTechNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lida: true } : n));
    if (isSupabaseConfigured) {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', notifId);
    }
  }, []);

  const limparNotificacoesTech = useCallback(async (tecnicoId) => {
    setTechNotifications(prev => prev.filter(n => n.tecnicoId !== tecnicoId));
    if (isSupabaseConfigured) {
      await supabase.from('notificacoes').delete().eq('tecnico_id', tecnicoId);
    }
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── OPERAÇÕES DE ORDENS DE SERVIÇO (OS) ────────────────────────
  const criarOS = useCallback(async (novaOS) => {
    const defaultChecklist = [
      { id: '1', item: 'Limpeza e higienização dos filtros de ar', concluido: false, obrigatorio: true },
      { id: '2', item: 'Inspeção e limpeza da bandeja de condensado', concluido: false, obrigatorio: true },
      { id: '3', item: 'Verificação do dreno e desobstrução se necessário', concluido: false, obrigatorio: true },
      { id: '4', item: 'Inspeção visual e higienização da serpentina', concluido: false, obrigatorio: false },
      { id: '5', item: 'Verificação e reaperto das conexões elétricas', concluido: false, obrigatorio: true },
      { id: '6', item: 'Medição da corrente elétrica e carga de gás', concluido: false, obrigatorio: false }
    ];

    const os = {
      ...novaOS,
      id: `OS-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      dataAbertura: new Date().toISOString(),
      status: 'Aguardando',
      checklist: defaultChecklist,
      fotos: [],
      historico: [
        {
          data: new Date().toISOString(),
          acao: 'OS Aberta',
          usuario: 'Gestor Admin',
        },
      ],
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('ordens_servico').insert(mapToBackend(os, OS_MAP));
      if (error) {
        showNotification(`Erro ao criar OS: ${error.message}`, 'error');
        return null;
      }
      setOrdens((prev) => [os, ...prev]);
    } else {
      setOrdens((prev) => [os, ...prev]);
    }

    showNotification(`OS ${os.id} criada com sucesso!`);
    return os;
  }, [showNotification]);

  const atualizarStatusOS = useCallback(async (osId, novoStatus) => {
    const dataConclusao = novoStatus === 'Concluída' ? new Date().toISOString() : null;
    const entry = {
      data: new Date().toISOString(),
      acao: `Status alterado para: ${novoStatus}`,
      usuario: 'Gestor Admin',
    };

    if (isSupabaseConfigured) {
      // Busca OS para herdar o histórico
      const { data: osRaw } = await supabase.from('ordens_servico').select('historico').eq('id', osId).single();
      const historicoAtual = osRaw?.historico || [];
      const novoHistorico = [...historicoAtual, entry];
      
      const { error } = await supabase.from('ordens_servico').update({
        status: novoStatus,
        data_conclusao: dataConclusao,
        historico: novoHistorico
      }).eq('id', osId);

      if (error) {
        showNotification(`Erro ao atualizar status: ${error.message}`, 'error');
        return;
      }
      setOrdens((prev) =>
        prev.map((os) => {
          if (os.id !== osId) return os;
          return {
            ...os,
            status: novoStatus,
            dataConclusao: novoStatus === 'Concluída' ? new Date().toISOString() : os.dataConclusao,
            historico: novoHistorico,
          };
        })
      );
    } else {
      setOrdens((prev) =>
        prev.map((os) => {
          if (os.id !== osId) return os;
          return {
            ...os,
            status: novoStatus,
            dataConclusao: novoStatus === 'Concluída' ? new Date().toISOString() : os.dataConclusao,
            historico: [...(os.historico || []), entry],
          };
        })
      );
    }

    showNotification(`OS ${osId} atualizada para "${novoStatus}"`);
  }, [showNotification]);

  const atualizarOS = useCallback(async (osId, dados) => {
    if (isSupabaseConfigured) {
      let novoHistorico;
      if (dados.historico) {
        novoHistorico = dados.historico;
      } else {
        const entry = {
          data: new Date().toISOString(),
          acao: 'OS Editada',
          usuario: 'Gestor Admin',
        };
        const { data: osRaw } = await supabase.from('ordens_servico').select('historico').eq('id', osId).single();
        const historicoAtual = osRaw?.historico || [];
        novoHistorico = [...historicoAtual, entry];
      }

      const dadosBack = mapToBackend(dados, OS_MAP);
      const { error } = await supabase.from('ordens_servico').update({
        ...dadosBack,
        historico: novoHistorico
      }).eq('id', osId);

      if (error) {
        showNotification(`Erro ao editar OS: ${error.message}`, 'error');
        return;
      }
      setOrdens((prev) =>
        prev.map((os) => {
          if (os.id !== osId) return os;
          return {
            ...os,
            ...dados,
            historico: novoHistorico,
          };
        })
      );
    } else {
      setOrdens((prev) =>
        prev.map((os) => {
          if (os.id !== osId) return os;
          return {
            ...os,
            ...dados,
            historico: [...(os.historico || []), entry],
          };
        })
      );
    }

    showNotification(`OS ${osId} editada com sucesso!`);
  }, [showNotification]);

  const atribuirTecnico = useCallback(async (osId, tecnicoId) => {
    const tec = tecnicos.find((t) => t.id === tecnicoId);
    const entry = {
      data: new Date().toISOString(),
      acao: `Técnico Atribuído: ${tec?.nome || tecnicoId}`,
      usuario: 'Gestor Admin',
    };

    if (isSupabaseConfigured) {
      const { data: osRaw } = await supabase.from('ordens_servico').select('historico').eq('id', osId).single();
      const historicoAtual = osRaw?.historico || [];
      const novoHistorico = [...historicoAtual, entry];

      const { error } = await supabase.from('ordens_servico').update({
        tecnico_id: tecnicoId,
        historico: novoHistorico
      }).eq('id', osId);

      if (error) {
        showNotification(`Erro ao atribuir técnico: ${error.message}`, 'error');
        return;
      }
      setOrdens((prev) =>
        prev.map((os) => {
          if (os.id !== osId) return os;
          return {
            ...os,
            tecnicoId,
            historico: novoHistorico,
          };
        })
      );
    } else {
      setOrdens((prev) =>
        prev.map((os) => {
          if (os.id !== osId) return os;
          return {
            ...os,
            tecnicoId,
            historico: [...(os.historico || []), entry],
          };
        })
      );
    }

    showNotification(`Técnico ${tec?.nome} atribuído!`);
  }, [tecnicos, showNotification]);

  // ── OPERAÇÕES DE CLIENTES ──────────────────────────────────────
  const criarCliente = useCallback(async (dados) => {
    const nextId = `CLI${String(clientes.length + 1).padStart(3, '0')}`;
    const cliente = {
      ...dados,
      id: dados.id || nextId,
      pmocAtivo: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('clientes').insert(mapToBackend(cliente, CLIENTE_MAP));
      if (error) {
        showNotification(`Erro ao criar cliente: ${error.message}`, 'error');
        return null;
      }
      setClientes((prev) => [...prev, cliente]);
    } else {
      setClientes((prev) => [...prev, cliente]);
    }

    showNotification(`Cliente "${cliente.nomeFantasia}" cadastrado!`);
    return cliente;
  }, [clientes, showNotification]);

  const atualizarCliente = useCallback(async (id, dados) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('clientes').update(mapToBackend(dados, CLIENTE_MAP)).eq('id', id);
      if (error) {
        showNotification(`Erro ao atualizar: ${error.message}`, 'error');
        return;
      }
      setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...dados } : c)));
    } else {
      setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...dados } : c)));
    }
    showNotification('Cliente atualizado com sucesso!');
  }, [showNotification]);

  const excluirCliente = useCallback(async (id) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        showNotification(`Erro ao excluir: ${error.message}`, 'error');
        return;
      }
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } else {
      setClientes((prev) => prev.filter((c) => c.id !== id));
    }
    showNotification('Cliente excluído com sucesso!');
  }, [showNotification]);

  // ── OPERAÇÕES DE TÉCNICOS ──────────────────────────────────────
  const criarTecnico = useCallback(async (dados) => {
    const nextId = `TEC${String(tecnicos.length + 1).padStart(3, '0')}`;
    const tecnico = {
      ...dados,
      id: dados.id || nextId,
      status: dados.status || 'Ativo',
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tecnicos').insert(mapToBackend(tecnico, TECNICO_MAP));
      if (error) {
        showNotification(`Erro ao criar técnico: ${error.message}`, 'error');
        return null;
      }
      setTecnicos((prev) => [...prev, tecnico]);
    } else {
      setTecnicos((prev) => [...prev, tecnico]);
    }

    showNotification(`Técnico "${tecnico.nome}" cadastrado!`);
    return tecnico;
  }, [tecnicos, showNotification]);

  const atualizarTecnico = useCallback(async (id, dados) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tecnicos').update(mapToBackend(dados, TECNICO_MAP)).eq('id', id);
      if (error) {
        showNotification(`Erro ao atualizar técnico: ${error.message}`, 'error');
        return;
      }
      setTecnicos((prev) => prev.map((t) => (t.id === id ? { ...t, ...dados } : t)));
    } else {
      setTecnicos((prev) => prev.map((t) => (t.id === id ? { ...t, ...dados } : t)));
    }
    showNotification('Técnico atualizado com sucesso!');
  }, [showNotification]);

  const excluirTecnico = useCallback(async (id) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tecnicos').delete().eq('id', id);
      if (error) {
        showNotification(`Erro ao excluir técnico: ${error.message}`, 'error');
        return;
      }
      setTecnicos((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTecnicos((prev) => prev.filter((t) => t.id !== id));
    }
    showNotification('Técnico excluído com sucesso!');
  }, [showNotification]);

  // ── OPERAÇÕES DE EQUIPAMENTOS ──────────────────────────────────
  const criarEquipamento = useCallback(async (dados) => {
    const eq = {
      ...dados,
      id: `EQ${String(equipamentos.length + 1).padStart(3, '0')}`,
      status: 'Operacional',
      ultimaManutencao: null,
      proximaManutencao: null,
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('equipamentos').insert(mapToBackend(eq, EQUIPAMENTO_MAP));
      if (error) {
        showNotification(`Erro ao criar equipamento: ${error.message}`, 'error');
        return null;
      }
      setEquipamentos((prev) => [...prev, eq]);
    } else {
      setEquipamentos((prev) => [...prev, eq]);
    }

    showNotification(`Equipamento ${eq.codigo} cadastrado!`);
    return eq;
  }, [equipamentos, showNotification]);

  const atualizarEquipamento = useCallback(async (id, dados) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('equipamentos').update(mapToBackend(dados, EQUIPAMENTO_MAP)).eq('id', id);
      if (error) {
        showNotification(`Erro ao atualizar: ${error.message}`, 'error');
        return;
      }
      setEquipamentos((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...dados } : eq)));
    } else {
      setEquipamentos((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...dados } : eq)));
    }
    showNotification('Equipamento atualizado com sucesso!');
  }, [showNotification]);

  const excluirEquipamento = useCallback(async (id) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('equipamentos').delete().eq('id', id);
      if (error) {
        showNotification(`Erro ao excluir: ${error.message}`, 'error');
        return;
      }
      setEquipamentos((prev) => prev.filter((eq) => eq.id !== id));
    } else {
      setEquipamentos((prev) => prev.filter((eq) => eq.id !== id));
    }
    showNotification('Equipamento excluído com sucesso!');
  }, [showNotification]);

  // ── OPERAÇÕES DE PMOC ──────────────────────────────────────────
  const criarOuAtualizarPMOC = useCallback(async (dados) => {
    const novoAgendamento = {
      data: new Date(dados.dataInicio).toISOString().split('T')[0],
      tipo: 'Mensal',
      equipamentoId: 'Geral',
      status: 'Agendado'
    };

    if (isSupabaseConfigured) {
      try {
        const { data: pmocExistente } = await supabase
          .from('pmocs')
          .select('*')
          .eq('cliente_id', dados.clienteId)
          .maybeSingle();

        if (pmocExistente) {
          const pmoc = mapToFrontend(pmocExistente, PMOC_MAP);
          const agendamentosAtualizados = [...(pmoc.agendamentos || []), novoAgendamento].sort(
            (a, b) => new Date(a.data) - new Date(b.data)
          );

          await supabase
            .from('pmocs')
            .update({ agendamentos: agendamentosAtualizados })
            .eq('id', pmoc.id);

          setPmocs((prev) =>
            prev.map((p) => (p.id === pmoc.id ? { ...p, agendamentos: agendamentosAtualizados } : p))
          );
          showNotification('Nova data incluída no PMOC existente!', 'success');
        } else {
          const dataVigencia = new Date(dados.dataInicio);
          dataVigencia.setMonth(dataVigencia.getMonth() + parseInt(dados.vigencia, 10));

          const { data: todosPmocs } = await supabase.from('pmocs').select('id');
          const maxId = todosPmocs ? todosPmocs.reduce((max, p) => {
            const num = parseInt(p.id.replace('PMOC', ''), 10);
            return isNaN(num) ? max : (num > max ? num : max);
          }, 0) : 0;

          const novoPMOC = {
            id: `PMOC${String(maxId + 1).padStart(3, '0')}`,
            clienteId: dados.clienteId,
            responsavelTecnicoId: 'RT001',
            ativo: true,
            dataInicio: new Date(dados.dataInicio).toISOString().split('T')[0],
            dataVigencia: dataVigencia.toISOString().split('T')[0],
            periodicidades: {
              mensal: ['Limpeza de filtros', 'Inspeção elétrica', 'Limpeza de dreno'],
              semestral: ['Higienização completa', 'Análise microbiológica']
            },
            agendamentos: [novoAgendamento]
          };

          await supabase.from('pmocs').insert(mapToBackend(novoPMOC, PMOC_MAP));
          await supabase.from('clientes').update({ pmoc_ativo: true }).eq('id', dados.clienteId);
          
          setPmocs((prev) => [novoPMOC, ...prev]);
          setClientes((cliPrev) => cliPrev.map((c) => (c.id === dados.clienteId ? { ...c, pmocAtivo: true } : c)));
          showNotification('Novo PMOC criado com sucesso!', 'success');
        }
      } catch (err) {
        showNotification(`Erro ao salvar PMOC: ${err.message}`, 'error');
      }
    } else {
      // Modo Local (Fallback)
      setPmocs((prev) => {
        const pmocExistenteIdx = prev.findIndex(p => p.clienteId === dados.clienteId);

        if (pmocExistenteIdx >= 0) {
          const pmocExistente = prev[pmocExistenteIdx];
          const updatedPmoc = {
            ...pmocExistente,
            agendamentos: [...pmocExistente.agendamentos, novoAgendamento].sort((a, b) => new Date(a.data) - new Date(b.data))
          };
          const newPmocs = [...prev];
          newPmocs[pmocExistenteIdx] = updatedPmoc;
          showNotification('Nova data incluída no PMOC existente!', 'success');
          return newPmocs;
        } else {
          const dataVigencia = new Date(dados.dataInicio);
          dataVigencia.setMonth(dataVigencia.getMonth() + parseInt(dados.vigencia, 10));
          
          const maxId = prev.reduce((max, p) => {
            const num = parseInt(p.id.replace('PMOC', ''), 10);
            return isNaN(num) ? max : (num > max ? num : max);
          }, 0);

          const novoPMOC = {
            id: `PMOC${String(maxId + 1).padStart(3, '0')}`,
            clienteId: dados.clienteId,
            responsavelTecnicoId: 'RT001',
            ativo: true,
            dataInicio: new Date(dados.dataInicio).toISOString().split('T')[0],
            dataVigencia: dataVigencia.toISOString().split('T')[0],
            agendamentos: [novoAgendamento]
          };
          
          setClientes(cliPrev => cliPrev.map(c => c.id === dados.clienteId ? { ...c, pmocAtivo: true } : c));
          showNotification('Novo PMOC criado com sucesso!', 'success');
          return [novoPMOC, ...prev];
        }
      });
    }
  }, [clientes, showNotification]);

  // ── DADOS DERIVADOS (CÁLCULOS DINÂMICOS) ───────────────────────
  const clientesSemPMOC = clientes.filter(
    (c) => !pmocs.some((p) => p.clienteId === c.id && p.ativo)
  );

  const osSLACritico = ordens.filter((os) => {
    if (os.status === 'Concluída' || os.status === 'Cancelada') return false;
    if (!os.dataPrevista) return false;
    const diff = new Date(os.dataPrevista) - new Date();
    return diff < 4 * 60 * 60 * 1000 && diff > 0; // menos de 4h
  });

  const osAtrasadas = ordens.filter((os) => {
    if (os.status === 'Concluída' || os.status === 'Cancelada') return false;
    if (!os.dataPrevista) return false;
    return new Date(os.dataPrevista) < new Date();
  });

  // Atualização dinâmica dos KPIs baseada nos dados reais
  useEffect(() => {
    if (ordens.length === 0) return;
    const totalOsAbertas = ordens.filter(o => o.status !== 'Concluída' && o.status !== 'Cancelada').length;
    const totalOsConcluidas = ordens.filter(o => o.status === 'Concluída').length;
    
    setKpis(prev => ({
      ...prev,
      totalOsAbertas,
      totalOsConcluidas,
      clientesSemPMOC: clientesSemPMOC.map(c => c.id),
      alertasSLA: osSLACritico.length + osAtrasadas.length,
      alertasPMOC: clientesSemPMOC.length
    }));
  }, [ordens, clientes, pmocs]);

  return (
    <AppContext.Provider
      value={{
        // Estados
        clientes,
        tecnicos,
        equipamentos,
        ordens,
        pmocs,
        responsavelTecnico,
        kpis,
        notification,
        loadingDb,
        // Dados Derivados
        clientesSemPMOC,
        osSLACritico,
        osAtrasadas,
        // Operações
        criarOS,
        atualizarStatusOS,
        atualizarOS,
        atribuirTecnico,
        criarCliente,
        atualizarCliente,
        excluirCliente,
        criarTecnico,
        atualizarTecnico,
        excluirTecnico,
        criarEquipamento,
        atualizarEquipamento,
        excluirEquipamento,
        criarOuAtualizarPMOC,
        setEquipamentos,
        setClientes,
        setTecnicos,
        setPmocs,
        setResponsavelTecnico,
        techNotifications,
        lerNotificacaoTech,
        limparNotificacoesTech,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
