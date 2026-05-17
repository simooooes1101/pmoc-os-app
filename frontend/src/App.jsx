import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TechAuthProvider, useTechAuth } from './contexts/TechAuthContext';

import { Layout } from './pages/Layout';
import { Dashboard } from './pages/Dashboard';
import { OSList } from './pages/OSList';
import { PMOCList } from './pages/PMOCList';
import { Agenda } from './pages/Agenda';
import { Clientes } from './pages/Clientes';
import { Equipamentos } from './pages/Equipamentos';
import { Configuracoes } from './pages/Configuracoes';
import { Login } from './pages/Login';

// Tech App Pages
import { TechLayout } from './pages/tech/TechLayout';
import { TechLogin } from './pages/tech/TechLogin';
import { TechDashboard } from './pages/tech/TechDashboard';
import { TechOSDetail } from './pages/tech/TechOSDetail';
import { TechChecklist } from './pages/tech/TechChecklist';

// Protect Gestor routes
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Protect Tech routes
function TechProtectedRoute({ children }) {
  const { techSession } = useTechAuth();
  const location = useLocation();
  if (!techSession) {
    return <Navigate to="/tech" state={{ from: location }} replace />;
  }
  return children;
}

// Placeholder for unbuilt pages
const Placeholder = ({ title }) => (
  <div className="flex-center" style={{ height: '100%', flex: 1 }}>
    <h2 className="text-muted">{title} — Em Desenvolvimento</h2>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <TechAuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              {/* === Gestor Web Routes === */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="os" element={<OSList />} />
                <Route path="pmoc" element={<PMOCList />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="equipamentos" element={<Equipamentos />} />
                <Route path="config" element={<Configuracoes />} />
                <Route path="tecnicos" element={<Placeholder title="Técnicos" />} />
              </Route>

              {/* === Technician Mobile Routes === */}
              <Route path="/tech" element={<TechLogin />} />
              <Route
                path="/tech"
                element={
                  <TechProtectedRoute>
                    <TechLayout />
                  </TechProtectedRoute>
                }
              >
                <Route path="dashboard" element={<TechDashboard />} />
                <Route path="os" element={<Placeholder title="Minhas OS" />} />
                <Route path="os/:id" element={<TechOSDetail />} />
                <Route path="os/:id/checklist" element={<TechChecklist />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </TechAuthProvider>
    </AuthProvider>
  );
}

export default App;
