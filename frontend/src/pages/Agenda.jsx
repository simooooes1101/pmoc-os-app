import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, parseISO, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Agenda.css';

export function Agenda() {
  const { ordens, tecnicos, pmocs, clientes } = useApp();
  
  // Navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Create a weekly view based on currentDate
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Only consider active/in progress OS with dates
  const scheduledOS = ordens.filter(os => os.dataPrevista && os.status !== 'Concluída' && os.status !== 'Cancelada');

  // Map PMOC schedules into fake "OS" for visualization
  const pmocEvents = pmocs.flatMap(pmoc => {
    if (!pmoc.ativo) return [];
    const cliente = clientes.find(c => c.id === pmoc.clienteId);
    return pmoc.agendamentos.map((ag, idx) => ({
      id: `PMOC-${pmoc.id}-${idx}`,
      isPMOC: true,
      titulo: `Preventiva ${ag.tipo} - ${cliente?.nomeFantasia} (${ag.equipamentoId})`,
      dataPrevista: ag.data,
      tecnicoId: 'unassigned',
      prioridade: 'Normal'
    }));
  });

  // Combine OS and PMOCs
  const allEvents = [...scheduledOS, ...pmocEvents];

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="agenda-container">
      <div className="os-header" style={{ alignItems: 'center' }}>
        <div className="os-header-title">
          <h1>Agenda de Técnicos</h1>
          <p>Visão de alocação de equipe e mapa de serviços.</p>
        </div>
        <div className="agenda-nav-controls">
          <button className="btn btn-secondary" onClick={goToToday}>Hoje</button>
          <div className="week-nav">
            <button className="icon-btn" onClick={prevWeek}><ChevronLeft size={20} /></button>
            <span className="current-week-label">
              {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <button className="icon-btn" onClick={nextWeek}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="agenda-grid">
        <div className="agenda-sidebar">
          <h3>Equipe em Campo</h3>
          <div className="tecnicos-list">
            {tecnicos.map(tec => {
              const osDoTecnico = scheduledOS.filter(os => os.tecnicoId === tec.id);
              return (
                <div key={tec.id} className="tecnico-card">
                  <div className="tecnico-header">
                    <div className="avatar-md">
                      {tec.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="tecnico-info-basic">
                      <h4>{tec.nome}</h4>
                      <span>{tec.especialidade}</span>
                    </div>
                  </div>
                  <div className="tecnico-stats">
                    <div className="stat">
                      <strong>{osDoTecnico.length}</strong>
                      <span>O.S. Total</span>
                    </div>
                    <div className="stat">
                      <span className={`status-dot ${tec.status === 'Ativo' ? 'online' : 'offline'}`}></span>
                      <span>{tec.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="agenda-main">
          <div className="calendar-header">
            <div className="calendar-day-header time-col"></div>
            {weekDays.map((day, idx) => (
              <div key={idx} className={`calendar-day-header ${isSameDay(day, new Date()) ? 'today' : ''}`}>
                <span className="day-name">{format(day, 'EEEE', { locale: ptBR })}</span>
                <span className="day-number">{format(day, 'dd')}</span>
              </div>
            ))}
          </div>

          <div className="calendar-body">
            {/* Unassigned / PMOC Row */}
            <div className="calendar-row unassigned-row">
              <div className="calendar-cell time-col sticky-col">
                <div className="row-label">
                  <CalendarIcon size={16} />
                  <span>PMOC / Sist.</span>
                </div>
              </div>
              {weekDays.map((day, idx) => {
                const unassignedDia = allEvents.filter(
                  ev => (!ev.tecnicoId || ev.tecnicoId === 'unassigned') && ev.dataPrevista && isSameDay(parseISO(ev.dataPrevista), day)
                );
                return (
                  <div key={`unassigned-${idx}`} className={`calendar-cell ${isSameDay(day, new Date()) ? 'today-bg' : ''}`}>
                    {unassignedDia.map(ev => (
                      <div key={ev.id} className={`agenda-os-card ${ev.isPMOC ? 'is-pmoc' : `prioridade-${ev.prioridade.toLowerCase()}`}`} title={ev.titulo}>
                        <div className="agenda-os-header">
                          <span className="agenda-os-id">{ev.isPMOC ? 'PMOC' : ev.id}</span>
                          <span className="agenda-os-time">
                            <Clock size={10} /> {ev.dataPrevista ? format(parseISO(ev.dataPrevista), 'HH:mm') : '--:--'}
                          </span>
                        </div>
                        <p className="agenda-os-title">{ev.titulo}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Technicians Rows */}
            {tecnicos.map(tec => (
              <div key={`row-${tec.id}`} className="calendar-row">
                <div className="calendar-cell time-col sticky-col">
                  <div className="row-label">
                    <div className="avatar-xs">
                      {tec.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <span>{tec.nome.split(' ')[0]}</span>
                  </div>
                </div>
                {weekDays.map((day, idx) => {
                  const osDoDia = allEvents.filter(
                    ev => ev.tecnicoId === tec.id && ev.dataPrevista && isSameDay(parseISO(ev.dataPrevista), day)
                  );

                  return (
                    <div key={`cell-${tec.id}-${idx}`} className={`calendar-cell ${isSameDay(day, new Date()) ? 'today-bg' : ''}`}>
                      {osDoDia.map(ev => (
                        <div key={ev.id} className={`agenda-os-card prioridade-${ev.prioridade.toLowerCase()}`} title={ev.titulo}>
                          <div className="agenda-os-header">
                            <span className="agenda-os-id">{ev.id}</span>
                            <span className="agenda-os-time">
                              <Clock size={10} /> {ev.dataPrevista ? format(parseISO(ev.dataPrevista), 'HH:mm') : '--:--'}
                            </span>
                          </div>
                          <p className="agenda-os-title">{ev.titulo}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
