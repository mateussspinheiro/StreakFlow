import { Link } from 'react-router'

export default function AuthForm({ route }: { route: string }) {
  return <section>
    <h1 className="mb-5 text-3xl font-bold">{route === 'termos' ? 'Termos de uso' : 'Privacidade'}</h1>
    <p className="muted">O StreakFlow utiliza Amazon Cognito para cadastro, confirmação de e-mail, login e recuperação de senha. O serviço recebe os dados de conta necessários para essas operações.</p>
    <p className="muted mt-4">A biblioteca Amplify gerencia a sessão no navegador. O aplicativo não salva sua senha. Hábitos, check-ins e preferências continuam no armazenamento local, sem sincronização entre dispositivos ou separação por conta neste navegador.</p>
    <p className="muted mt-4">Sair encerra a sessão e preserva os registros. Você pode exportar seus dados em Configurações. Limpar os dados do site remove os registros locais, mas não exclui sua conta no Cognito.</p>
    <Link className="text-link" to="/">Voltar ao início →</Link>
  </section>
}
