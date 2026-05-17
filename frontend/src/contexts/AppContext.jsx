import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

export function AppProvider({ children }) {
  // Helper to load from localStorage or fallback
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error(`Error loading ${key} from localStorage`, e);
      return fallback;
    }
  };

  const [clientes, setClientes] = useState(() => loadState('pmoc_clientes', mockClientes));
  const [tecnicos, setTecnicos] = useState(() => loadState('pmoc_tecnicos', mockTecnicos));
  const [equipamentos, setEquipamentos] = useState(() => loadState('pmoc_equipamentos', mockEquipamentos));
  const [ordens, setOrdens] = useState(() => loadState('pmoc_ordens', mockOrdens));
  const [pmocs, setPmocs] = useState(() => loadState('pmoc_pmocs', mockPMOC));
  const [responsavelTecnico, setResponsavelTecnico] = useState(mockResponsavelTecnico);
  const [kpis] = useState(mockKPIs);
  const [notification, setNotification] = useState(null);
  const [techNotifications, setTechNotifications] = useState(() => loadState('pmoc_tech_notifications', []));

  const prevOrdensRef = useRef(ordens);

  // Persist state changes to localStorage
  useEffect(() => { localStorage.setItem('pmoc_clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('pmoc_tecnicos', JSON.stringify(tecnicos)); }, [tecnicos]);
  useEffect(() => { localStorage.setItem('pmoc_equipamentos', JSON.stringify(equipamentos)); }, [equipamentos]);
  useEffect(() => { localStorage.setItem('pmoc_ordens', JSON.stringify(ordens)); }, [ordens]);
  useEffect(() => { localStorage.setItem('pmoc_pmocs', JSON.stringify(pmocs)); }, [pmocs]);
  useEffect(() => { localStorage.setItem('pmoc_tech_notifications', JSON.stringify(techNotifications)); }, [techNotifications]);

  // Sync across tabs/windows (Real-time Simulation)
  useEffect(() => {
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

  // Detector for technician notification events
  useEffect(() => {
    const prevOrdens = prevOrdensRef.current;
    if (prevOrdens && prevOrdens !== ordens && Array.isArray(prevOrdens) && Array.isArray(ordens)) {
      const addedNotifications = [];

      ordens.forEach(os => {
        const oldOs = prevOrdens.find(o => o.id === os.id);
        if (!oldOs) {
          // New OS
          if (os.tecnicoId) {
            addedNotifications.push({
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              tecnicoId: os.tecnicoId,
              mensagem: `Nova OS ${os.id} foi atribuída a você: "${os.titulo}".`,
              lida: false,
              data: new Date().toISOString()
            });
          }
        } else {
          // Existing OS modified or reassigned
          if (os.tecnicoId !== oldOs.tecnicoId) {
            if (oldOs.tecnicoId) {
              addedNotifications.push({
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                tecnicoId: oldOs.tecnicoId,
                mensagem: `Houve mudança de programação na OS ${os.id}. Você não é mais o responsável por este serviço.`,
                lida: false,
                data: new Date().toISOString()
              });
            }
            if (os.tecnicoId) {
              addedNotifications.push({
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                tecnicoId: os.tecnicoId,
                mensagem: `Nova OS ${os.id} foi atribuída a você devido a uma mudança de programação.`,
                lida: false,
                data: new Date().toISOString()
              });
            }
          }
        }
      });

      if (addedNotifications.length > 0) {
        setTechNotifications(prev => [...addedNotifications, ...prev]);
      }
    }
    prevOrdensRef.current = ordens;
  }, [ordens]);

  const lerNotificacaoTech = useCallback((notifId) => {
    setTechNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lida: true } : n));
  }, []);

  const limparNotificacoesTech = useCallback((tecnicoId) => {
    setTechNotifications(prev => prev.filter(n => n.tecnicoId !== tecnicoId));
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── OS Operations ──────────────────────────────────────────────
  const criarOS = useCallback((novaOS) => {
    const os = {
      ...novaOS,
      id: `OS-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      dataAbertura: new Date().toISOString(),
      status: 'Aguardando',
      historico: [
        {
          data: new Date().toISOString(),
          acao: 'OS Aberta',
          usuario: 'Gestor Admin',
        },
      ],
    };
    setOrdens((prev) => [os, ...prev]);
    showNotification(`OS ${os.id} criada com sucesso!`);
    return os;
  }, [showNotification]);

  const atualizarStatusOS = useCallback((osId, novoStatus) => {
    setOrdens((prev) =>
      prev.map((os) => {
        if (os.id !== osId) return os;
        const entry = {
          data: new Date().toISOString(),
          acao: `Status alterado para: ${novoStatus}`,
          usuario: 'Gestor Admin',
        };
        return {
          ...os,
          status: novoStatus,
          dataConclusao: novoStatus === 'Concluída' ? new Date().toISOString() : os.dataConclusao,
          historico: [...(os.historico || []), entry],
        };
      })
    );
    showNotification(`OS ${osId} atualizada para "${novoStatus}"`);
  }, [showNotification]);

  const atualizarOS = useCallback((osId, dados) => {
    setOrdens((prev) =>
      prev.map((os) => {
        if (os.id !== osId) return os;
        const entry = {
          data: new Date().toISOString(),
          acao: 'OS Editada',
          usuario: 'Gestor Admin',
        };
        return {
          ...os,
          ...dados,
          historico: [...(os.historico || []), entry],
        };
      })
    );
    showNotification(`OS ${osId} editada com sucesso!`);
  }, [showNotification]);

  const atribuirTecnico = useCallback((osId, tecnicoId) => {
    const tec = tecnicos.find((t) => t.id === tecnicoId);
    setOrdens((prev) =>
      prev.map((os) => {
        if (os.id !== osId) return os;
        return {
          ...os,
          tecnicoId,
          historico: [
            ...(os.historico || []),
            {
              data: new Date().toISOString(),
              acao: `Técnico Atribuído: ${tec?.nome || tecnicoId}`,
              usuario: 'Gestor Admin',
            },
          ],
        };
      })
    );
    showNotification(`Técnico ${tec?.nome} atribuído!`);
  }, [tecnicos, showNotification]);

  // ── Client Operations ──────────────────────────────────────────
  const criarCliente = useCallback((dados) => {
    const cliente = {
      ...dados,
      id: `CLI${String(clientes.length + 1).padStart(3, '0')}`,
      pmocAtivo: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClientes((prev) => [...prev, cliente]);
    showNotification(`Cliente "${cliente.nomeFantasia}" cadastrado!`);
    return cliente;
  }, [clientes, showNotification]);

  const atualizarCliente = useCallback((id, dados) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...dados } : c)));
    showNotification('Cliente atualizado com sucesso!');
  }, [showNotification]);

  const excluirCliente = useCallback((id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    showNotification('Cliente excluído com sucesso!');
  }, [showNotification]);

  // ── Equipment Operations ───────────────────────────────────────
  const criarEquipamento = useCallback((dados) => {
    const eq = {
      ...dados,
      id: `EQ${String(equipamentos.length + 1).padStart(3, '0')}`,
      status: 'Operacional',
      ultimaManutencao: null,
      proximaManutencao: null,
    };
    setEquipamentos((prev) => [...prev, eq]);
    showNotification(`Equipamento ${eq.codigo} cadastrado!`);
    return eq;
  }, [equipamentos, showNotification]);

  const atualizarEquipamento = useCallback((id, dados) => {
    setEquipamentos((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...dados } : eq)));
    showNotification('Equipamento atualizado com sucesso!');
  }, [showNotification]);

  const excluirEquipamento = useCallback((id) => {
    setEquipamentos((prev) => prev.filter((eq) => eq.id !== id));
    showNotification('Equipamento excluído com sucesso!');
  }, [showNotification]);

  // ── PMOC Operations ──────────────────────────────────────────
  const criarOuAtualizarPMOC = useCallback((dados) => {
    setPmocs(prev => {
      const pmocExistenteIdx = prev.findIndex(p => p.clienteId === dados.clienteId);
      
      // Criar agendamento inicial baseado na dataInicio
      const novoAgendamento = {
        data: new Date(dados.dataInicio).toISOString(),
        tipo: 'Mensal',
        equipamentoId: 'Geral',
        status: 'Agendado'
      };

      if (pmocExistenteIdx >= 0) {
        // Atualiza PMOC existente inserindo nova data
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
        // Cria um novo PMOC
        const dataVigencia = new Date(dados.dataInicio);
        dataVigencia.setMonth(dataVigencia.getMonth() + parseInt(dados.vigencia, 10));
        
        // Ensure unique ID
        const maxId = prev.reduce((max, p) => {
          const num = parseInt(p.id.replace('PMOC', ''), 10);
          return isNaN(num) ? max : (num > max ? num : max);
        }, 0);

        const novoPMOC = {
          id: `PMOC${String(maxId + 1).padStart(3, '0')}`,
          clienteId: dados.clienteId,
          ativo: true,
          dataInicio: new Date(dados.dataInicio).toISOString(),
          dataVigencia: dataVigencia.toISOString(),
          agendamentos: [novoAgendamento]
        };
        showNotification('Novo PMOC criado com sucesso!', 'success');
        return [novoPMOC, ...prev];
      }
    });
  }, [showNotification]);

  // ── Derived Data ───────────────────────────────────────────────
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

  return (
    <AppContext.Provider
      value={{
        // State
        clientes,
        tecnicos,
        equipamentos,
        ordens,
        pmocs,
        responsavelTecnico,
        kpis,
        notification,
        // Derived
        clientesSemPMOC,
        osSLACritico,
        osAtrasadas,
        // Operations
        criarOS,
        atualizarStatusOS,
        atualizarOS,
        atribuirTecnico,
        criarCliente,
        atualizarCliente,
        excluirCliente,
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
