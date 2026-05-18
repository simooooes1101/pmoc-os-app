import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useTechAuth } from '../../contexts/TechAuthContext';
import { 
  ArrowLeft, CheckCircle2, Save, 
  Camera, MessageSquare, AlertTriangle, X
} from 'lucide-react';
import './TechChecklist.css';

export function TechChecklist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ordens, atualizarOS, showNotification } = useApp();
  const { techSession } = useTechAuth();

  const os = ordens.find(o => o.id === id);
  
  const [items, setItems] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (os) {
      const savedChecklist = os.checklist;
      // Safety: convert old object format to array if found, or use provided array
      if (savedChecklist && !Array.isArray(savedChecklist)) {
        const converted = Object.entries(savedChecklist).map(([key, val], idx) => ({
          id: String(idx + 1),
          item: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          concluido: !!val,
          obrigatorio: true
        }));
        setItems(converted);
      } else {
        setItems(savedChecklist || []);
      }
      setObservacoes(os.observacoesTecnicas || '');
      setFotos(os.fotos || []);
    }
  }, [os]);

  if (!os) return null;

  const handleToggleItem = (itemId) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, concluido: !item.concluido } : item
    ));
  };

  const progress = items.length > 0 
    ? Math.round((items.filter(i => i.concluido).length / items.length) * 100) 
    : 0;

  const allDone = items.length > 0 && items.every(i => i.concluido);

  const handleFinalize = () => {
    if (!allDone) {
      showNotification('Complete todos os itens do checklist antes de finalizar.', 'warning');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const updatedHistory = [
        ...(os.historico || []),
        { data: now, acao: 'OS Finalizada pelo técnico', usuario: techSession.nome }
      ];

      atualizarOS(os.id, {
        status: 'Concluída',
        dataConclusao: now,
        checklist: items,
        observacoesTecnicas: observacoes,
        fotos: fotos,
        historico: updatedHistory
      });

      setLoading(false);
      showNotification('Ordem de Serviço finalizada com sucesso!');
      navigate('/tech/dashboard');
    }, 1500);
  };

  const handleAddPhotoClick = () => {
    document.getElementById('tech-camera-input').click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="tech-checklist-page">
      <div className="tech-detail-header">
        <button className="icon-btn back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-titles">
          <h1>Checklist Técnico</h1>
          <span className="os-badge">{os.id}</span>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-header">
          <span>Progresso da Inspeção</span>
          <span className="progress-pct">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="checklist-scroll">
        <div className="checklist-items">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`checklist-item-card ${item.concluido ? 'done' : ''}`}
              onClick={() => handleToggleItem(item.id)}
            >
              <div className={`checkbox-custom ${item.concluido ? 'checked' : ''}`}>
                {item.concluido && <CheckCircle2 size={20} />}
              </div>
              <div className="item-text">
                <p>{item.item}</p>
                {item.obrigatorio && <span className="obrigatorio">Obrigatório</span>}
              </div>
            </div>
          ))}
        </div>

        <section className="checklist-notes">
          <div className="notes-header">
            <MessageSquare size={18} />
            <h3>Observações Técnicas</h3>
          </div>
          <textarea 
            className="form-input tech-textarea" 
            placeholder="Descreva detalhes da manutenção, peças trocadas ou recomendações..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </section>

        <section className="tech-photo-section">
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
            id="tech-camera-input" 
            onChange={handleFileChange} 
          />
          <button type="button" className="btn btn-secondary tech-photo-btn" onClick={handleAddPhotoClick}>
            <Camera size={20} /> Adicionar Fotos da OS
          </button>
          <p className="photo-hint">Mínimo de 2 fotos recomendado</p>

          {/* Grid de miniaturas das fotos */}
          {fotos.length > 0 && (
            <div className="tech-photo-grid animate-fade-in">
              {fotos.map((foto, idx) => (
                <div key={idx} className="tech-photo-thumb">
                  <img src={foto} alt={`Preview ${idx + 1}`} />
                  <button 
                    type="button" 
                    className="tech-photo-remove" 
                    onClick={(e) => { e.stopPropagation(); setFotos(prev => prev.filter((_, i) => i !== idx)); }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="tech-detail-footer">
        <button 
          className={`btn tech-action-btn ${allDone ? 'btn-primary' : 'btn-disabled'}`}
          onClick={handleFinalize}
          disabled={loading || !allDone}
        >
          {loading ? 'Finalizando...' : <><CheckCircle2 size={20} /> Finalizar Ordem de Serviço</>}
        </button>
        {!allDone && (
          <div className="checklist-warning">
            <AlertTriangle size={14} />
            <span>Pendências no checklist</span>
          </div>
        )}
      </footer>
    </div>
  );
}
