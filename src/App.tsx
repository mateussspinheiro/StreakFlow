import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from 'react';
import { endSession, refreshState, startSession, updateProfile } from './lib/streakflow';
import { useStreakFlow } from './lib/useStreakFlow';
import { useTheme } from './lib/useTheme';
import DashboardContent from './components/DashboardContent';
import AuthLayout from './components/AuthLayout';
import AuthForm from './components/AuthForm';

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";

import Dashboard from "./pages/Dashboard";
import MeusHabitos from "./pages/MeusHabitos";
import Historico from "./pages/Historico";
import Progresso from "./pages/Progresso";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated: session, user, storageError, settings } = useStreakFlow();
  useTheme(settings.theme);
  const profile = user?.profile ?? { name: 'Visitante', email: '' };
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard')) {
      const titles: Record<string, string> = { '/login': 'Entrar', '/cadastro': 'Criar conta', '/termos': 'Termos', '/privacidade': 'Privacidade', '/recuperar': 'Recuperar senha' };
      document.title = `${titles[location.pathname] || 'Um dia de cada vez'} | StreakFlow`;
    }
  }, [location.pathname]);

  function logout() {
    try {
      endSession();
      setError('');
      navigate('/login', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível sair. Tente novamente.');
    }
  }

  return (
    <>
    {(storageError || error) && <div role="alert" className="storage-alert">{storageError || error}<button className="secondary" onClick={() => { setError(''); refreshState(); }}>Tentar novamente</button></div>}
    <Routes>
      {/* PÁGINAS PÚBLICAS */}

      <Route
        path="/"
        element={<Landing authenticated={session} />}
      />

      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <Login onEnter={startSession} />}
      />

      <Route
        path="/cadastro"
        element={session ? <Navigate to="/dashboard" replace /> : <Cadastro />}
      />

      {/* ÁREA LOGADA */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute authenticated={session}>
            <DashboardLayout profile={profile} onProfileChange={updateProfile} onLogout={logout} />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Dashboard />}
        />

        <Route
          path="habitos"
          element={<MeusHabitos />}
        />

        <Route
          path="historico"
          element={<Historico />}
        />

        <Route
          path="progresso"
          element={<Progresso />}
        />

        <Route
          path="perfil"
          element={<Perfil />}
        />

        <Route
          path="configuracoes"
          element={<Configuracoes />}
        />
        <Route path="novo-habito" element={<DashboardContent key="novo-habito" route="novo-habito" />} />
        <Route path="editar-habito/:id" element={<DashboardContent key={location.pathname} route={location.pathname.slice('/dashboard/'.length)} />} />
        <Route path="*" element={<DashboardContent route="nao-encontrado" />} />
      </Route>

      {['recuperar', 'termos', 'privacidade'].map(page => (
        <Route key={page} path={`/${page}`} element={<AuthLayout><AuthForm key={page} route={page} /></AuthLayout>} />
      ))}
      {['habitos', 'historico', 'progresso', 'perfil', 'configuracoes', 'novo-habito'].map(page => (
        <Route key={page} path={`/${page}`} element={<Navigate to={`/dashboard/${page}`} replace />} />
      ))}

      {/* ROTA INVÁLIDA */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
    </>
  );
}

export default App;
