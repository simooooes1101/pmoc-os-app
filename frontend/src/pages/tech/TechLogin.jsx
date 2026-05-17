import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useTechAuth } from '../../contexts/TechAuthContext';
import { Snowflake, ChevronRight, Delete } from 'lucide-react';
import './TechLogin.css';

export function TechLogin() {
  const { tecnicos } = useApp();
  const { loginTech } = useTechAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('select'); // 'select' | 'pin'
  const [selectedTec, setSelectedTec] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSelectTec = (tec) => {
    setSelectedTec(tec);
    setPin('');
    setError('');
    setStep('pin');
  };

  const handlePinPress = (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      // Auto-submit when 4 digits are entered
      setTimeout(() => {
        const result = loginTech(selectedTec, newPin);
        if (result.success) {
          navigate('/tech/dashboard');
        } else {
          setError(result.message);
          setPin('');
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const activeTechnicians = tecnicos.filter(t => t.status === 'Ativo');

  return (
    <div className="tech-login-wrapper">
      <div className="tech-login-header">
        <div className="tech-logo">
          <Snowflake size={32} />
        </div>
        <h1>ClimaTech</h1>
        <p>App do Técnico</p>
      </div>

      {step === 'select' && (
        <div className="tech-select-step">
          <h2>Quem é você?</h2>
          <div className="tech-list">
            {activeTechnicians.map(tec => (
              <button
                key={tec.id}
                className="tech-select-card"
                onClick={() => handleSelectTec(tec)}
              >
                <div className="tech-select-avatar">
                  {tec.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="tech-select-info">
                  <span className="tech-select-name">{tec.nome}</span>
                  <span className="tech-select-role">{tec.especialidade}</span>
                </div>
                <ChevronRight size={20} className="tech-chevron" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'pin' && (
        <div className="tech-pin-step">
          <div className="tech-selected-info">
            <div className="tech-select-avatar large">
              {selectedTec?.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <h2>{selectedTec?.nome.split(' ')[0]}</h2>
            <p>Digite seu PIN de acesso</p>
          </div>

          <div className="pin-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
            ))}
          </div>

          {error && <p className="pin-error">{error}</p>}

          <div className="pin-keypad">
            {['1','2','3','4','5','6','7','8','9','','0','del'].map((key, i) => (
              <button
                key={i}
                className={`pin-key ${key === '' ? 'empty' : ''} ${key === 'del' ? 'delete' : ''}`}
                onClick={() => key === 'del' ? handleDelete() : key !== '' ? handlePinPress(key) : null}
                disabled={key === ''}
              >
                {key === 'del' ? <Delete size={22} /> : key}
              </button>
            ))}
          </div>

          <button className="tech-back-btn" onClick={() => { setStep('select'); setError(''); setPin(''); }}>
            ← Trocar técnico
          </button>

          <p className="pin-hint">PIN padrão: 1234</p>
        </div>
      )}
    </div>
  );
}
