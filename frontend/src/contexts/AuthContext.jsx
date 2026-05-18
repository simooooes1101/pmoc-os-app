import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

// Verifica se as credenciais do Supabase estão preenchidas no ambiente
const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  !import.meta.env.VITE_SUPABASE_URL.includes('seu-projeto-id') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY && 
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('cole-sua-chave');

export function AuthProvider({ children }) {
  // Usuário Admin Padrão (Fallback Local / Modo Protótipo)
  const defaultUsers = [
    {
      id: 'USR001',
      username: 'Admin',
      password: 'Admin',
      name: 'Gestor Principal',
      role: 'admin',
      status: 'Ativo',
      permissions: ['all']
    }
  ];

  const loadUsers = () => {
    try {
      const saved = localStorage.getItem('pmoc_users');
      return saved ? JSON.parse(saved) : defaultUsers;
    } catch (e) {
      return defaultUsers;
    }
  };

  const loadSession = () => {
    try {
      const session = localStorage.getItem('pmoc_session');
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  };

  const [users, setUsers] = useState(loadUsers);
  const [currentUser, setCurrentUser] = useState(loadSession);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Sincroniza todos os perfis de usuários se for Supabase
  const carregarPerfisSupabase = async () => {
    if (!isSupabaseConfigured || !currentUser) return;
    try {
      const { data, error } = await supabase.from('perfis').select('*');
      if (!error && data) {
        const mappedUsers = data.map(p => ({
          id: p.id,
          username: p.email,
          name: p.nome,
          role: p.role,
          tecnicoId: p.tecnico_id,
          status: p.status || 'Ativo',
          createdAt: p.created_at
        }));
        setUsers(mappedUsers);
      }
    } catch (e) {
      console.error("Erro ao carregar perfis de usuários:", e);
    }
  };

  useEffect(() => {
    carregarPerfisSupabase();
  }, [currentUser]);

  // 1. Escuta e Sincroniza a Sessão de Autenticação com o Supabase (se configurado)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Recupera sessão ativa inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        getProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Escuta mudanças de estado de login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Busca o perfil do usuário na tabela pública
  const getProfile = async (userId) => {
    try {
      const { data: perfil, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (perfil) {
        setCurrentUser({
          id: perfil.id,
          username: perfil.email,
          name: perfil.nome,
          role: perfil.role,
          tecnicoId: perfil.tecnico_id,
          permissions: perfil.role === 'admin' ? ['all'] : []
        });
      }
    } catch (e) {
      console.error('Erro ao carregar perfil do usuário no Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Persistência Fallback Local (Modo Protótipo)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('pmoc_users', JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pmoc_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pmoc_session');
    }
  }, [currentUser]);

  // 3. Operação de Login (Suporta Async para Nuvem)
  const login = async (username, password) => {
    if (isSupabaseConfigured) {
      try {
        // O Supabase usa e-mail. Se for digitado apenas o usuário "admin", convertemos para e-mail
        const email = username.includes('@') ? username : `${username.toLowerCase()}@climatiza.com.br`;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return { success: false, message: 'Usuário ou senha incorretos na nuvem' };
        }

        // Carrega o perfil associado ao UUID do Auth do Supabase
        const { data: perfil, error: profileError } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !perfil) {
          // Fallback se a tabela de perfis ainda não tiver o registro
          const sessionUser = {
            id: data.user.id,
            username: data.user.email,
            name: data.user.email.split('@')[0],
            role: 'admin',
            permissions: ['all']
          };
          setCurrentUser(sessionUser);
          return { success: true };
        }

        if (perfil.status === 'Inativo') {
          await supabase.auth.signOut();
          return { success: false, message: 'Este usuário foi inativado e não tem permissão para acessar o sistema.' };
        }

        const sessionUser = {
          id: perfil.id,
          username: perfil.email,
          name: perfil.nome,
          role: perfil.role,
          tecnicoId: perfil.tecnico_id,
          permissions: perfil.role === 'admin' ? ['all'] : []
        };
        setCurrentUser(sessionUser);
        return { success: true };

      } catch (e) {
        return { success: false, message: e.message || 'Erro ao conectar ao banco de dados em nuvem' };
      }
    } else {
      // Fallback Local (Modo Protótipo)
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );
      if (user) {
        if (user.status === 'Inativo') {
          return { success: false, message: 'Este usuário foi inativado e não tem permissão para acessar o sistema.' };
        }
        const { password: _, ...sessionUser } = user;
        setCurrentUser(sessionUser);
        return { success: true };
      }
      return { success: false, message: 'Usuário ou senha inválidos' };
    }
  };

  // 4. Operação de Logout
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  // ── AUDITORIA DE LOGS DE USUÁRIO ──────────────────────────────
  const registrarLogUsuario = async (acao, detalhes) => {
    const email = currentUser?.username || 'Sistema/Desconectado';
    const entry = {
      usuario_email: email,
      acao,
      detalhes
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('logs_usuario').insert(entry);
        if (error) console.error("Erro ao salvar log no Supabase:", error);
      } catch (e) {
        console.error("Erro ao salvar log no Supabase:", e);
      }
    } else {
      // Local storage fallback for logs
      try {
        const currentLogs = JSON.parse(localStorage.getItem('pmoc_user_logs') || '[]');
        const newLog = {
          id: `LOG-${Date.now()}`,
          ...entry,
          created_at: new Date().toISOString()
        };
        localStorage.setItem('pmoc_user_logs', JSON.stringify([newLog, ...currentLogs]));
      } catch (e) {
        console.error("Erro ao salvar log local:", e);
      }
    }
  };

  // 5. Atualização de Senha
  const updatePassword = async (userId, newPassword) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) {
        await registrarLogUsuario('Alteração de Senha', `Alterou a própria senha.`);
      }
      return { success: !error, message: error?.message };
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
      await registrarLogUsuario('Alteração de Senha', `Senha do usuário ID ${userId} atualizada.`);
      return { success: true };
    }
  };

  // 6. Adicionar Novo Usuário
  const addUser = async (userData) => {
    const defaultData = {
      status: 'Ativo',
      createdAt: new Date().toISOString().split('T')[0]
    };
    const finalData = { ...defaultData, ...userData };

    if (isSupabaseConfigured) {
      const randomUuid = crypto.randomUUID ? crypto.randomUUID() : `usr-${Math.random().toString(36).substr(2, 9)}`;
      let insertPayload = {
        id: randomUuid,
        nome: finalData.name,
        email: finalData.username,
        role: finalData.role,
        status: finalData.status,
        tecnico_id: finalData.tecnicoId || null
      };

      let { error } = await supabase.from('perfis').insert(insertPayload);

      // Fallback caso a restrição check constraint do papel (perfis_role_check) falhe
      if (error && error.message && error.message.includes('perfis_role_check')) {
        console.warn('Restrição check de perfil detectada. Mapeando papel para compatibilidade com banco legado...');
        const mappedRole = (finalData.role === 'admin' || finalData.role === 'manager') ? 'admin' : 'tecnico';
        insertPayload.role = mappedRole;
        const retry = await supabase.from('perfis').insert(insertPayload);
        error = retry.error;
      }

      // Fallback robusto caso a coluna status ainda não tenha sido criada no banco
      if (error && error.message && (error.message.includes('status') || error.message.includes('cache'))) {
        console.warn('Coluna status de perfis não encontrada. Tentando inserção sem status...');
        const retry = await supabase.from('perfis').insert({
          id: randomUuid,
          nome: finalData.name,
          email: finalData.username,
          role: insertPayload.role,
          tecnico_id: finalData.tecnicoId || null
        });
        error = retry.error;
      }

      if (error) {
        console.error('Erro ao adicionar perfil no Supabase:', error);
        return { success: false, message: error.message };
      }

      await registrarLogUsuario('Cadastro de Usuário', `Cadastrou o usuário ${finalData.username} (${finalData.name})`);
      await carregarPerfisSupabase();
      return { success: true };
    } else {
      const newUser = {
        ...finalData,
        id: `USR${String(users.length + 1).padStart(3, '0')}`
      };
      setUsers(prev => [...prev, newUser]);
      await registrarLogUsuario('Cadastro de Usuário', `Cadastrou o usuário ${newUser.username} (${newUser.name})`);
      return { success: true };
    }
  };

  // 7. Salvar/Atualizar Usuário Existente
  const saveUser = async (id, userData) => {
    if (isSupabaseConfigured) {
      let payload = {
        nome: userData.name,
        role: userData.role,
        status: userData.status || 'Ativo',
        tecnico_id: userData.tecnicoId || null
      };

      let { error } = await supabase.from('perfis').update(payload).eq('id', id);
      
      // Fallback caso a restrição check constraint do papel (perfis_role_check) falhe
      if (error && error.message && error.message.includes('perfis_role_check')) {
        console.warn('Restrição check de perfil detectada. Mapeando papel para compatibilidade com banco legado...');
        const mappedRole = (userData.role === 'admin' || userData.role === 'manager') ? 'admin' : 'tecnico';
        payload.role = mappedRole;
        const retry = await supabase.from('perfis').update(payload).eq('id', id);
        error = retry.error;
      }

      // Fallback robusto caso a coluna status ainda não tenha sido criada no banco
      if (error && error.message && (error.message.includes('status') || error.message.includes('cache'))) {
        console.warn('Coluna status de perfis não encontrada. Tentando atualização sem status...');
        const fallbackPayload = {
          nome: userData.name,
          role: payload.role,
          tecnico_id: userData.tecnicoId || null
        };
        const retry = await supabase.from('perfis').update(fallbackPayload).eq('id', id);
        error = retry.error;
      }

      if (error) {
        return { success: false, message: error.message };
      }

      await registrarLogUsuario('Edição de Usuário', `Atualizou dados do usuário ${userData.username || id}.`);
      await carregarPerfisSupabase();
      return { success: true };
    } else {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
      await registrarLogUsuario('Edição de Usuário', `Atualizou dados do usuário ${userData.username} (ID: ${id})`);
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, users, updatePassword, addUser, saveUser, registrarLogUsuario, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
