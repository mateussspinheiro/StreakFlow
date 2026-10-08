import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from 'react';
import { refreshState } from './lib/streakflow';
import { useStreakFlow } from './lib/useStreakFlow';
import { useAuth } from './lib/useAuth';
import { authError, returnDestination } from './lib/authErrors';
import ConfirmarEmail from './pages/ConfirmarEmail';
import RecuperarSenha from './pages/RecuperarSenha';
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
import NotFound from './pages/NotFound';

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function LegacyRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storageError, settings } = useStreakFlow();
  const { isAuthenticated: session, user, isLoading, error: authIssue, signOut, checkSession, oauthDestination, clearOAuthDestination } = useAuth();
  useTheme(settings.theme);
  const profile = user ?? { name: 'Visitante', email: '' };
  const [error, setError] = useState('');

  useEffect(() => {
    if (session && oauthDestination) {
      clearOAuthDestination();
      navigate(oauthDestination, { replace: true });
    }
  }, [session, oauthDestination, clearOAuthDestination, navigate]);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Um dia de cada vez', '/login': 'Entrar', '/cadastro': 'Criar conta', '/termos': 'Termos', '/privacidade': 'Privacidade', '/recuperar': 'Recuperar senha', '/confirmar-email': 'Confirmar e-mail' };
    if (titles[location.pathname]) document.title = `${titles[location.pathname]} | StreakFlow`;
  }, [location.pathname]);

  async function logout() {
    try {
      await signOut();
      setError('');
      navigate('/login', { replace: true });
    } catch (cause) {
      setError(authError(cause));
    }
  }

  return (
    <>
    {(storageError || error || authIssue) && <div role="alert" className="storage-alert">{storageError || error || authIssue}<button className="secondary" onClick={() => { setError(''); refreshState(); void checkSession(); }}>Tentar novamente</button></div>}
    <Routes>
      {/* PÁGINAS PÚBLICAS */}

      <Route
        path="/"
        element={<Landing authenticated={session} />}
      />

      <Route
        path="/login"
        element={session ? <Navigate to={returnDestination(location.state?.from)} replace /> : <Login />}
      />

      <Route
        path="/cadastro"
        element={session ? <Navigate to="/dashboard" replace /> : <Cadastro />}
      />

      {/* ÁREA LOGADA */}

      <Route
        element={
          <ProtectedRoute authenticated={session} isLoading={isLoading}>
            <DashboardLayout profile={profile} onLogout={logout} />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/meus-habitos"
          element={<MeusHabitos />}
        />

        <Route
          path="/historico"
          element={<Historico />}
        />

        <Route
          path="/progresso"
          element={<Progresso />}
        />

        <Route
          path="/dashboard/perfil"
          element={<Perfil />}
        />

        <Route
          path="/dashboard/configuracoes"
          element={<Configuracoes />}
        />
        <Route path="/dashboard/novo-habito" element={<DashboardContent key="novo-habito" route="novo-habito" />} />
        <Route path="/dashboard/editar-habito/:id" element={<DashboardContent key={location.pathname} route={location.pathname.slice('/dashboard/'.length)} />} />
        <Route path="/dashboard/*" element={<NotFound />} />
      </Route>

      <Route path="/confirmar-email" element={<ConfirmarEmail />} />
      <Route path="/recuperar" element={<RecuperarSenha />} />
      {['termos', 'privacidade'].map(page => (
        <Route key={page} path={`/${page}`} element={<AuthLayout><AuthForm key={page} route={page} /></AuthLayout>} />
      ))}
      {Object.entries({
        '/habitos': '/meus-habitos',
        '/dashboard/habitos': '/meus-habitos',
        '/dashboard/historico': '/historico',
        '/dashboard/progresso': '/progresso',
        '/perfil': '/dashboard/perfil',
        '/configuracoes': '/dashboard/configuracoes',
        '/novo-habito': '/dashboard/novo-habito',
      }).map(([from, to]) => (
        <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
      ))}

      {/* ROTA INVÁLIDA */}

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
    </>
  );
}

export default App;
