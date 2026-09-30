import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import { useAuth } from '../lib/useAuth'
import { useAuthRequest } from '../lib/useAuthRequest'

export default function ConfirmarEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [message, setMessage] = useState('')
  const { confirmSignUp, resendConfirmationCode, isLoading } = useAuth()
  const { busy, error, run } = useAuthRequest()
  return <AuthLayout>
    <h1 className="text-3xl font-bold">Confirme seu e-mail</h1>
    <p className="muted mt-3 mb-6">{email ? `Digite o código enviado para ${email}.` : 'Informe o e-mail do cadastro e o código recebido.'} Se precisar, solicite um novo código abaixo.</p>
    <form className="space-y-5" onSubmit={event => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      void run(async () => {
        const result = await confirmSignUp(email, String(data.get('code')))
        if (!result.isSignUpComplete) throw new Error('ConfirmationIncomplete')
        navigate('/login', { replace: true, state: { email, from: location.state?.from, message: 'Conta confirmada com sucesso. Faça login para continuar.' } })
      })
    }}>
      <fieldset disabled={busy || isLoading} className="space-y-5" aria-describedby={error ? 'confirmation-error' : undefined}>
        <Field label="E-mail" name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
        <Field label="Código de confirmação" name="code" autoComplete="one-time-code" inputMode="numeric" required autoFocus />
        {error && <p id="confirmation-error" role="alert" className="notice notice-error">{error}</p>}
        {message && <p role="status" className="notice">{message}</p>}
        <button type="submit" className="primary w-full">{busy ? 'Aguarde…' : 'Confirmar e-mail'}</button>
        <button type="button" className="secondary w-full" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onClick={() => void run(async () => {
          setMessage('')
          await resendConfirmationCode(email)
          setMessage('Novo código enviado. Confira sua caixa de entrada e spam.')
        })}>Reenviar código</button>
      </fieldset>
    </form>
    <Link to="/login" state={{ email, from: location.state?.from }} className="text-link">Voltar para entrar →</Link>
  </AuthLayout>
}
