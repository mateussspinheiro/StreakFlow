import { Link } from 'react-router'
import { useState, type FormEvent } from 'react'
import type { Profile } from '../lib/types'
import Field from './Field'

export default function AuthForm({ route, profile, onEnter }: { route: string; profile: Profile; onEnter: (profile: Profile) => void }) {
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const signup = route === 'cadastro'
  if (['termos', 'privacidade'].includes(route)) return <section><h1 className="mb-5 text-3xl font-bold">{route === 'termos' ? 'Termos da demonstração' : 'Privacidade da demonstração'}</h1><p>Este protótipo permite explorar a navegação e gerenciar hábitos nesta aba. Não cria uma conta real, não armazena senhas e não envia e-mails. Os dados do perfil e dos hábitos são mantidos durante a sessão do navegador.</p><Link className="mt-6 inline-block text-violet-600" to="/cadastro">Voltar ao cadastro</Link></section>
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Informe um e-mail válido, como nome@exemplo.com.')
    if (route === 'recuperar') return setError('O envio de recuperação ainda não está disponível nesta demonstração. Nenhum e-mail foi enviado.')
    if (signup && name.length < 3) return setError('Informe seu nome com pelo menos 3 caracteres.')
    if (password.trim().length < 8) return setError('A senha deve ter pelo menos 8 caracteres e não pode conter apenas espaços.')
    if (signup && password !== data.get('confirm')) return setError('As senhas não coincidem. Confira a confirmação.')
    if (signup && !data.get('terms')) return setError('Aceite os termos para continuar.')
    onEnter({ name: signup ? name : profile.email === email ? profile.name : 'Visitante', email })
  }
  return <><p className="mb-2 text-sm font-semibold text-violet-600">{signup ? 'COMECE SUA JORNADA' : 'BEM-VINDO DE VOLTA'}</p><h1 className="text-4xl font-bold">{signup ? 'Crie sua conta' : route === 'recuperar' ? 'Recuperar senha' : 'Entre na sua conta'}</h1><p className="mb-6 mt-3 text-sm text-slate-500">{signup ? 'Comece hoje a construir hábitos melhores.' : 'Continue construindo seus hábitos.'}</p><p className="mb-5 rounded-xl bg-violet-50 p-3 text-sm text-violet-800">Modo demonstração: use dados fictícios. O acesso não autentica uma conta real.</p><form onSubmit={submit} className="space-y-4" onChange={() => setError('')}>
    {signup && <Field label="Nome completo" name="name" required minLength={3} maxLength={80} autoComplete="name" />}
    <Field label="E-mail" name="email" type="email" required autoComplete="email" />
    {route !== 'recuperar' && <><Field label="Senha" name="password" type={show ? 'text' : 'password'} required minLength={8} autoComplete={signup ? 'new-password' : 'current-password'} /><button type="button" aria-pressed={show} onClick={() => setShow(!show)} className="text-sm text-violet-600">{show ? 'Ocultar senha' : 'Mostrar senha'}</button>{signup ? <><Field label="Confirmar senha" name="confirm" type={show ? 'text' : 'password'} required minLength={8} autoComplete="new-password" /><label className="flex gap-3 text-sm text-slate-500"><input name="terms" type="checkbox" required className="accent-violet-600" /><span>Concordo com os <Link to="/termos" className="text-violet-600">Termos de Uso</Link> e a <Link to="/privacidade" className="text-violet-600">Política de Privacidade</Link>.</span></label></> : <Link to="/recuperar" className="block text-sm text-violet-600">Esqueceu a senha?</Link>}</>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button className="primary w-full" type="submit">{signup ? 'Criar minha conta →' : route === 'recuperar' ? 'Solicitar recuperação' : 'Entrar na minha conta →'}</button>
  </form>{route !== 'recuperar' && <><p className="my-5 text-center text-xs text-slate-400">OU CONTINUE COM</p><button type="button" onClick={() => setError('O acesso com Google ainda não está disponível. Use o formulário para explorar a demonstração.')} className="w-full rounded-xl border border-slate-200 bg-white p-3 font-semibold">G {signup ? 'Cadastrar' : 'Entrar'} com Google</button></>}<p className="mt-7 text-center text-sm text-slate-500">{signup || route === 'recuperar' ? <Link to="/login" className="font-bold text-violet-600">Voltar para entrar</Link> : <>Ainda não possui uma conta? <Link to="/cadastro" className="font-bold text-violet-600">Criar conta gratuitamente</Link></>}</p></>
}

