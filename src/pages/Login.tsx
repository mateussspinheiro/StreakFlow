import AuthLayout from '../components/AuthLayout';
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { validateAccount } from '../lib/auth';
import type { Profile } from '../lib/types';

interface LoginProps {
  onEnter: (profile: Profile) => void;
}

function Login({ onEnter }: LoginProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email.trim())) {
      setErro("Digite um e-mail válido.");
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      const usuario = await validateAccount(email, senha);
      if (!usuario) {
        setErro("E-mail ou senha incorretos. Se ainda não tem conta neste navegador, faça seu cadastro.");
        return;
      }
      onEnter(usuario);
    } catch {
      setErro("Não foi possível validar o login. Tente novamente.");
      return;
    } finally { setBusy(false); }

    const from = location.state?.from;
    const destination = typeof from === 'string' && /^\/(?:dashboard(?:\/[^?#\\]*)?|meus-habitos\/?|historico\/?|progresso\/?)(?:[?#][^\\]*)?$/.test(from) ? from : '/dashboard';
    navigate(destination, { replace: true });
  }

  return (
    <AuthLayout>

      <div className="w-full max-w-md">

        <Link to="/">
          ← Voltar para o início
        </Link>

        <h1 className="text-3xl font-bold mt-6">
          Bem-vindo de volta
        </h1>

        <p className="text-gray-500 mt-2">
          Continue evoluindo um dia de cada vez.
        </p>
        {location.state?.registered === true && <p role="status" className="notice mt-5">Conta criada com sucesso! Entre com seu e-mail e senha.</p>}

        <form
          onSubmit={handleSubmit}
          noValidate
          onChange={() => setErro("")}
          className="space-y-5 mt-8"
        >

          <div>
            <label htmlFor="login-email">E-mail</label>

            <input
              type="email"
              id="login-email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="seu@email.com"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label htmlFor="login-senha">Senha</label>

            <input
              type={showPassword ? "text" : "password"}
              id="login-senha"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) =>
                setSenha(e.target.value)
              }
              placeholder="••••••••"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <button type="button" className="text-sm font-semibold text-violet-600" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Ocultar senha" : "Mostrar senha"}</button>
          {erro && (
            <div role="alert" className="border border-red-500 bg-red-50 text-red-700 p-3 rounded-lg">
              {erro}
            </div>
          )}

          <button
            type="submit" disabled={busy}
            className="primary w-full"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>

        </form>

        <p className="text-center mt-6">
          Ainda não possui uma conta?{" "}
          <Link
            to="/cadastro"
            className="font-semibold underline"
          >
            Cadastre-se
          </Link>
        </p>

      </div>
    </AuthLayout>
  );
}

export default Login;
