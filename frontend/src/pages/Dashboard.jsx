import React from 'react';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarX 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useApp } from '../contexts/AppContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function Dashboard() {
  const { kpis, clientesSemPMOC, osSLACritico, osAtrasadas } = useApp();
  const [expandedAlert, setExpandedAlert] = React.useState(null);

  const toggleAlert = (alertName) => {
    if (expandedAlert === alertName) {
      setExpandedAlert(null);
    } else {
      setExpandedAlert(alertName);
    }
  };

  // Chart configs using modern premium colors
  const barData = {
    labels: ['Carlos E.', 'Ana Paula', 'Roberto S.', 'Fernanda O.'],
    datasets: [
      {
        label: 'O.S. Concluídas (Mês)',
        data: [14, 11, 9, 7],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const doughnutData = {
    labels: ['Aguardando', 'Em andamento', 'Concluída', 'Cancelada'],
    datasets: [
      {
        data: [3, 5, 47, 4],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // warning
          'rgba(14, 165, 233, 0.8)', // info
          'rgba(16, 185, 129, 0.8)', // success
          'rgba(239, 68, 68, 0.8)',  // danger
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1' }
      }
    },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#cbd5e1' } }
    },
    cutout: '75%',
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard Executivo</h1>
        <p>Visão geral da operação e indicadores de desempenho.</p>
      </div>

      {/* Alertas Críticos */}
      {(osSLACritico.length > 0 || osAtrasadas.length > 0 || clientesSemPMOC.length > 0) && (
        <div className="alerts-section">
          {osSLACritico.length > 0 && (
            <div className={`alert-card-wrapper ${expandedAlert === 'sla' ? 'expanded' : ''}`}>
              <div className="alert-card warning cursor-pointer" onClick={() => toggleAlert('sla')}>
                <AlertTriangle size={24} />
                <div className="alert-card-content">
                  <h4>Atenção ao SLA</h4>
                  <p>{osSLACritico.length} O.S. próximas do vencimento contratual.</p>
                </div>
              </div>
              {expandedAlert === 'sla' && (
                <div className="alert-details">
                  <ul>
                    {osSLACritico.map(os => <li key={os.id}><strong>{os.id}</strong>: {os.titulo} (Técnico: {os.tecnicoId || 'Não atribuído'})</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          {osAtrasadas.length > 0 && (
            <div className={`alert-card-wrapper ${expandedAlert === 'atraso' ? 'expanded' : ''}`}>
              <div className="alert-card danger cursor-pointer" onClick={() => toggleAlert('atraso')}>
                <Clock size={24} />
                <div className="alert-card-content">
                  <h4>SLA Rompido</h4>
                  <p>{osAtrasadas.length} O.S. em atraso!</p>
                </div>
              </div>
              {expandedAlert === 'atraso' && (
                <div className="alert-details">
                  <ul>
                    {osAtrasadas.map(os => <li key={os.id}><strong>{os.id}</strong>: {os.titulo}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          {clientesSemPMOC.length > 0 && (
            <div className={`alert-card-wrapper ${expandedAlert === 'pmoc' ? 'expanded' : ''}`}>
              <div className="alert-card danger-outline cursor-pointer" onClick={() => toggleAlert('pmoc')}>
                <CalendarX size={24} />
                <div className="alert-card-content">
                  <h4>Risco Legal (PMOC)</h4>
                  <p>{clientesSemPMOC.length} cliente(s) ativo(s) sem PMOC vigente.</p>
                </div>
              </div>
              {expandedAlert === 'pmoc' && (
                <div className="alert-details">
                  <ul>
                    {clientesSemPMOC.map(cli => <li key={cli.id}><strong>{cli.nomeFantasia}</strong> (ID: {cli.id})</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon info"><CheckCircle2 size={24} /></div>
          <div className="kpi-info">
            <span className="kpi-label">SLA (No Prazo)</span>
            <span className="kpi-value">{kpis.slaPercent}%</span>
          </div>
        </div>
        
        <div className="card kpi-card">
          <div className="kpi-icon warning"><AlertTriangle size={24} /></div>
          <div className="kpi-info">
            <span className="kpi-label">Taxa de Retorno</span>
            <span className="kpi-value">{kpis.taxaRetorno}%</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon primary"><Clock size={24} /></div>
          <div className="kpi-info">
            <span className="kpi-label">MTTR (Tempo Médio)</span>
            <span className="kpi-value">{kpis.mttrHoras}h</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon success"><Activity size={24} /></div>
          <div className="kpi-info">
            <span className="kpi-label">O.S. Concluídas (Mês)</span>
            <span className="kpi-value">{kpis.totalOsConcluidas}</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Produtividade por Técnico</h3>
          <div className="chart-container">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        
        <div className="card chart-card">
          <h3>Status das O.S. (Mês)</h3>
          <div className="chart-container">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
