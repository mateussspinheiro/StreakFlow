import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { validateAccount } from '../lib/auth';
import type { Profile } from '../lib/types';

interface LoginProps {
  onEnter: (profile: Profile) => void;
}

function Login({ onEnter }: LoginProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

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

    try {
      const usuario = await validateAccount(email, senha);
      if (!usuario) {
        setErro("E-mail ou senha incorretos. Se ainda não tem conta nesta aba, faça seu cadastro.");
        return;
      }
      onEnter(usuario);
    } catch {
      setErro("Não foi possível validar o login. Tente novamente.");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">

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
              type="password"
              id="login-senha"
              autoComplete="current-password"
              value={senha}
              onChange={(e) =>
                setSenha(e.target.value)
              }
              placeholder="••••••••"
              className="w-full border rounded-lg p-3"
            />
          </div>

          {erro && (
            <div role="alert" className="border border-red-500 bg-red-50 text-red-700 p-3 rounded-lg">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded-lg"
          >
            Entrar
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
    </div>
  );
}

export default Login;
