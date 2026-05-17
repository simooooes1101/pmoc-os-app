import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, LogIn, KeyRound, User, AlertCircle } from 'lucide-react';
import './Login.css';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // OWASP: Basic input sanitization check (preventing obviously bad chars if needed)
    if (!username || !password) {
      setError('Por favor, preencha usuário e senha.');
      return;
    }

    const result = login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container card animate-fade-in">
        <div className="login-header">
          <div className="logo-icon-large">
            <ShieldCheck size={48} className="text-accent" />
          </div>
          <h1>PMOC Cloud</h1>
          <p>Gestão de Manutenção e O.S.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error"><AlertCircle size={16} /> {error}</div>}
          
          <div className="form-group">
            <label className="form-label">Usuário</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Admin"
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn">
            <LogIn size={20} /> Entrar no Sistema
          </button>
        </form>

        <div className="login-footer">
          <p>Ambiente Seguro & Criptografado</p>
          <span>v1.0.0-MVP</span>
        </div>
      </div>
    </div>
  );
}
