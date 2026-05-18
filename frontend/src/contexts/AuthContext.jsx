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

  // 5. Atualização de Senha
  const updatePassword = async (userId, newPassword) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { success: !error, message: error?.message };
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
      return { success: true };
    }
  };

  // 6. Adicionar Novo Usuário
  const addUser = async (userData) => {
    if (isSupabaseConfigured) {
      console.log('Adição de usuários em nuvem é gerenciada via painel do Supabase / schema SQL');
    } else {
      const newUser = {
        ...userData,
        id: `USR${String(users.length + 1).padStart(3, '0')}`
      };
      setUsers(prev => [...prev, newUser]);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, users, updatePassword, addUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
