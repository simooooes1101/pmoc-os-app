import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Default user database for MVP (In a real app, this would be in the backend database)
  const defaultUsers = [
    {
      id: 'USR001',
      username: 'Admin',
      password: 'Admin', // Storing raw password for frontend MVP simplicity only.
      name: 'Gestor Principal',
      role: 'admin',
      permissions: ['all']
    }
  ];

  // Load users from localStorage or fallback to default
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

  // Persist users list changes
  useEffect(() => {
    localStorage.setItem('pmoc_users', JSON.stringify(users));
  }, [users]);

  // Persist session changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pmoc_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pmoc_session');
    }
  }, [currentUser]);

  const login = (username, password) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      // Don't store password in session state
      const { password: _, ...sessionUser } = user;
      setCurrentUser(sessionUser);
      return { success: true };
    }
    return { success: false, message: 'Usuário ou senha inválidos' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updatePassword = (userId, newPassword) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    return { success: true };
  };

  const addUser = (userData) => {
    const newUser = {
      ...userData,
      id: `USR${String(users.length + 1).padStart(3, '0')}`
    };
    setUsers(prev => [...prev, newUser]);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, users, updatePassword, addUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
