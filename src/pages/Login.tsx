import AuthLayout from '../components/AuthLayout';
import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from '../lib/useAuth';
import { authError, returnDestination } from '../lib/authErrors';

function Login() {
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email ?? "");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submitting = useRef(false);

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

    if (submitting.current || isLoading) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = await signIn(email, senha);
      if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        navigate('/confirmar-email', { state: { email, from: location.state?.from } });
        return;
      }
      if (result.nextStep.signInStep === 'RESET_PASSWORD') {
        navigate('/recuperar', { state: { email, from: location.state?.from } });
        return;
      }
      if (!result.isSignedIn) {
        setErro('Esta conta exige uma etapa adicional de acesso. Entre em contato com o suporte.');
        return;
      }
    } catch (error) {
      if ((error as { name?: string })?.name === 'UserNotConfirmedException') {
        navigate('/confirmar-email', { state: { email, from: location.state?.from } });
      } else setErro(authError(error));
      return;
    } finally { submitting.current = false; setBusy(false); }

    const destination = returnDestination(location.state?.from);
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
        {location.state?.message && <p role="status" className="notice mt-5">{location.state.message}</p>}

        <form
          onSubmit={handleSubmit}
          noValidate
          onChange={() => setErro("")}
          className="space-y-5 mt-8"
        >

          <fieldset disabled={busy || isLoading} className="space-y-5" aria-describedby={erro ? "login-error" : undefined}>
          <div>
            <label htmlFor="login-email">E-mail</label>

            <input
              type="email"
              id="login-email"
              aria-describedby={erro ? 'login-error' : undefined}
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
              aria-describedby={erro ? 'login-error' : undefined}
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
            <div id="login-error" role="alert" className="border border-red-500 bg-red-50 text-red-700 p-3 rounded-lg">
              {erro}
            </div>
          )}

          <button
            type="submit" disabled={busy}
            className="primary w-full"
          >
            {busy ? 'Entrando…' : 'Entrar'}
          </button>

          </fieldset>
        </form>
        <Link to="/recuperar" state={{ email, from: location.state?.from }} className="text-link">Esqueci minha senha</Link>

        <p className="text-center mt-6">
          Ainda não possui uma conta?{" "}
          <Link
            to="/cadastro" state={{ from: location.state?.from }}
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
