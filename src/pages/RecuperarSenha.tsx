import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import { useAuth } from '../lib/useAuth'
import { useAuthRequest } from '../lib/useAuthRequest'
import { passwordRequirements, validPassword } from '../lib/authErrors'

export default function RecuperarSenha() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const { resetPassword, confirmResetPassword, isLoading } = useAuth()
  const { busy, error, setError, run } = useAuthRequest()
  async function send() {
    const result = await resetPassword(email)
    if (result.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
      setSent(true)
      setMessage(`Confira o código enviado para ${result.nextStep.codeDeliveryDetails.destination ?? email}.`)
    } else navigate('/login', { replace: true, state: { email, from: location.state?.from } })
  }
  return <AuthLayout>
    <h1 className="text-3xl font-bold">Recuperar senha</h1>
    <p className="muted mt-3 mb-6">{sent ? 'Informe o código e escolha sua nova senha.' : 'Enviaremos um código para seu e-mail.'}</p>
    <form className="space-y-5" onSubmit={event => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      if (!sent) { void run(send); return }
      const password = String(data.get('password'))
      if (!validPassword(password)) { setError(passwordRequirements); return }
      if (password !== data.get('confirmation')) { setError('As senhas não coincidem.'); return }
      void run(async () => {
        await confirmResetPassword(email, String(data.get('code')), password)
        navigate('/login', { replace: true, state: { email, from: location.state?.from, message: 'Senha redefinida com sucesso. Faça login para continuar.' } })
      })
    }}>
      <fieldset disabled={busy || isLoading} className="space-y-5" aria-describedby={error ? 'reset-error' : undefined}>
        <Field label="E-mail" name="email" type="email" autoComplete="email" value={email} readOnly={sent} required onChange={event => setEmail(event.target.value)} />
        {sent && <>
          <Field label="Código de recuperação" name="code" autoComplete="one-time-code" inputMode="numeric" required autoFocus />
          <Field label="Nova senha" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="reset-requirements" />
          <Field label="Confirmar nova senha" name="confirmation" type="password" autoComplete="new-password" required minLength={8} />
          <p id="reset-requirements" className="muted text-sm">{passwordRequirements}</p>
        </>}
        {message && <p role="status" className="notice">{message}</p>}
        {error && <p id="reset-error" role="alert" className="notice notice-error">{error}</p>}
        <button className="primary w-full" type="submit">{busy ? 'Aguarde…' : sent ? 'Redefinir senha' : 'Enviar código'}</button>
        {sent && <><button type="button" className="secondary w-full" onClick={() => void run(send)}>Reenviar código</button><button type="button" className="text-link" onClick={() => { setSent(false); setMessage(''); setError('') }}>Usar outro e-mail</button></>}
      </fieldset>
    </form>
    <Link className="text-link" to="/login" state={{ email, from: location.state?.from }}>Voltar para entrar →</Link>
  </AuthLayout>
}
