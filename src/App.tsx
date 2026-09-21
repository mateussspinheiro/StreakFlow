import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from 'react';
import { read, save } from './lib/storage';
import type { Profile } from './lib/types';
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
  const [session, setSession] = useState(() => read('session', false));
  const [profile, setProfile] = useState<Profile>(() => read('profile', { name: 'Visitante', email: '' }));

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  function updateProfile(next: Profile) {
    setProfile(next);
    save('profile', next);
  }

  function enter(next: Profile) {
    updateProfile(next);
    setSession(true);
    save('session', true);
  }

  function logout() {
    setSession(false);
    sessionStorage.removeItem('streakflow:session');
    localStorage.removeItem('streakflow_logged');
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      {/* PÁGINAS PÚBLICAS */}

      <Route
        path="/"
        element={<Landing authenticated={session} />}
      />

      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <Login onEnter={enter} />}
      />

      <Route
        path="/cadastro"
        element={session ? <Navigate to="/dashboard" replace /> : <Cadastro onRegister={updateProfile} />}
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
        <Route key={page} path={`/${page}`} element={<AuthLayout><AuthForm key={page} route={page} profile={profile} onEnter={enter} /></AuthLayout>} />
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
  );
}

export default App;
