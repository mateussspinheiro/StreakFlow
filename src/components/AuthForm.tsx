import { Link } from 'react-router'
import { useState, type FormEvent } from 'react'
import Field from './Field'

// As rotas de login e cadastro usam suas páginas e o único serviço em lib/auth.
export default function AuthForm({ route }: { route: string }) {
  const [message, setMessage] = useState('')
  if (route === 'termos' || route === 'privacidade') return <section>
    <h1 className="mb-5 text-3xl font-bold">{route === 'termos' ? 'Termos da demonstração' : 'Privacidade da demonstração'}</h1>
    <p className="muted">O StreakFlow é uma demonstração acadêmica com autenticação simulada. O perfil, os hábitos, as conclusões e as preferências são mantidos no armazenamento local deste navegador, inclusive após fechar a aba. Use dados fictícios.</p>
    <p className="muted mt-4">A senha não é salva em texto puro: o navegador mantém um verificador derivado dela para validar o acesso local. Isso não substitui uma autenticação segura com backend. Não há sincronização entre dispositivos, recuperação por e-mail ou envio de notificações.</p>
    <p className="muted mt-4">Sair encerra apenas a sessão. Você pode exportar seus dados em Configurações. Limpar os dados deste site no navegador remove a conta e os registros locais.</p>
    <Link className="text-link" to="/">Voltar ao início →</Link>
  </section>
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('A recuperação por e-mail depende de um serviço de autenticação e ainda não está disponível. Nenhum e-mail foi enviado.')
  }
  return <>
    <h1 className="text-3xl font-bold">Recuperar senha</h1>
    <p className="muted mt-3 mb-6">O envio de recuperação ainda não está disponível nesta versão local.</p>
    <form onSubmit={submit} className="space-y-4" onChange={() => setMessage('')}>
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      {message && <p role="status" className="notice">{message}</p>}
      <button className="primary w-full" type="submit">Consultar recuperação</button>
    </form>
    <Link className="text-link" to="/login">Voltar para entrar →</Link>
  </>
}
