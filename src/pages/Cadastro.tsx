import { Link } from 'react-router'
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { registerAccount } from "../lib/auth";
import type { Profile } from "../lib/types";

interface CadastroProps {
  onRegister: (profile: Profile) => void;
}

function Cadastro({ onRegister }: CadastroProps) {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");

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

    if (senha.trim().length < 8) {
      setErro("A senha deve possuir pelo menos 8 caracteres e não pode conter apenas espaços.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      await registerAccount({ name: nome.trim(), email: email.trim().toLowerCase() }, senha);
    } catch {
      setErro("N?o foi poss?vel salvar o cadastro nesta aba. Tente novamente.");
      return;
    }

    onRegister({
      name: nome.trim(),
      email: email.trim().toLowerCase(),
    });

    navigate("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
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
          Modo demonstração: use dados fictícios. As senhas não são armazenadas.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          onChange={() => setErro("")}
          className="mt-8 space-y-5"
        >
          <div>
            <label htmlFor="cadastro-nome">Nome</label>

            <input
              type="text"
              id="cadastro-nome"
              autoComplete="name"
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
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label htmlFor="cadastro-senha">Senha</label>

            <input
              type="password"
              id="cadastro-senha"
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
              type="password"
              id="cadastro-confirmar"
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) =>
                setConfirmarSenha(e.target.value)
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
            className="w-full p-3 rounded-lg bg-black text-white"
          >
            Criar conta
          </button>
        </form>

        <p className="mt-6 text-center">
          Já possui uma conta?{" "}
          <Link
            to="/login"
            className="font-semibold underline"
          >
            Entrar
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Cadastro;
