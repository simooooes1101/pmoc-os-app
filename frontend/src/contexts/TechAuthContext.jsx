import React, { createContext, useContext, useState, useEffect } from 'react';

const TechAuthContext = createContext();

export function TechAuthProvider({ children }) {
  const loadSession = () => {
    try {
      const s = localStorage.getItem('pmoc_tech_session');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  };

  const [techSession, setTechSession] = useState(loadSession);

  useEffect(() => {
    if (techSession) {
      localStorage.setItem('pmoc_tech_session', JSON.stringify(techSession));
    } else {
      localStorage.removeItem('pmoc_tech_session');
    }
  }, [techSession]);

  const loginTech = (tecnico, pin) => {
    // Default PIN for all technicians in MVP: 1234
    const VALID_PIN = '1234';
    if (pin !== VALID_PIN) return { success: false, message: 'PIN incorreto' };
    setTechSession({ id: tecnico.id, nome: tecnico.nome, especialidade: tecnico.especialidade });
    return { success: true };
  };

  const logoutTech = () => setTechSession(null);

  return (
    <TechAuthContext.Provider value={{ techSession, loginTech, logoutTech }}>
      {children}
    </TechAuthContext.Provider>
  );
}

export function useTechAuth() {
  const ctx = useContext(TechAuthContext);
  if (!ctx) throw new Error('useTechAuth must be used within TechAuthProvider');
  return ctx;
}
