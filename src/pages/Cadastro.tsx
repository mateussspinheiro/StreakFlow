import AuthLayout from '../components/AuthLayout';
import { Link, useLocation } from 'react-router'
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from '../lib/useAuth';
import { authError, validPassword, passwordRequirements } from '../lib/authErrors';
function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, isLoading } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (nome.trim().length < 3) {
      setErro("O nome deve possuir pelo menos 3 caracteres.");
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email.trim())) {
      setErro("Digite um endereço de e-mail válido.");
      return;
    }

    if (!validPassword(senha)) {
      setErro(passwordRequirements);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (submitting.current || isLoading) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = await signUp({ name: nome.trim(), email: email.trim().toLowerCase() }, senha);
      navigate(result.nextStep.signUpStep === 'CONFIRM_SIGN_UP' ? '/confirmar-email' : '/login', { replace: true, state: { email: email.trim().toLowerCase(), from: location.state?.from, message: 'Conta criada. Faça login para continuar.' } });
    } catch (error) {
      setErro(authError(error));
      return;
    } finally { submitting.current = false; setBusy(false); }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">

        <Link to="/" className="text-sm">
          ← Voltar para o início
        </Link>

        <h1 className="text-3xl font-bold mt-6">
          Criar conta
        </h1>

        <p className="mt-2 text-gray-500">
          Comece a construir hábitos consistentes.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Confirme seu e-mail para ativar sua conta. Seus hábitos continuam salvos neste navegador.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          onChange={() => setErro("")}
          className="mt-8 space-y-5"
        >
          <fieldset disabled={busy || isLoading} className="space-y-5" aria-describedby={`password-requirements${erro ? ' cadastro-error' : ''}`}>
          <div>
            <label htmlFor="cadastro-nome">Nome</label>

            <input
              type="text"
              id="cadastro-nome"
              aria-describedby={erro ? 'cadastro-error' : undefined}
              autoComplete="name"
              required
              maxLength={80}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label htmlFor="cadastro-email">E-mail</label>

            <input
              type="email"
              id="cadastro-email"
              aria-describedby={erro ? 'cadastro-error' : undefined}
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label htmlFor="cadastro-senha">Senha</label>

            <input
              type={showPassword ? "text" : "password"}
              id="cadastro-senha"
              aria-describedby={`password-requirements${erro ? ' cadastro-error' : ''}`}
              required
              minLength={8}
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label htmlFor="cadastro-confirmar">Confirmar senha</label>

            <input
              type={showPassword ? "text" : "password"}
              id="cadastro-confirmar"
              aria-describedby={erro ? 'cadastro-error' : undefined}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) =>
                setConfirmarSenha(e.target.value)
              }
              placeholder="••••••••"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <button type="button" className="text-sm font-semibold text-violet-600" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Ocultar senha" : "Mostrar senha"}</button>
          <p id="password-requirements" className="muted text-sm">{passwordRequirements}</p>
          {erro && (
            <div id="cadastro-error" role="alert" className="border border-red-500 bg-red-50 text-red-700 p-3 rounded-lg">
              {erro}
            </div>
          )}

          <button
            type="submit" disabled={busy}
            className="primary w-full"
          >
            {busy ? 'Criando conta…' : 'Criar conta'}
          </button>
          </fieldset>
        </form>

        <p className="mt-6 text-center">
          Já possui uma conta?{" "}
          <Link
            to="/login" state={{ from: location.state?.from }}
            className="font-semibold underline"
          >
            Entrar
          </Link>
        </p>

      </div>
    </AuthLayout>
  );
}

export default Cadastro;
