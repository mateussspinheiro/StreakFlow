import BrandLogo, { Mascot } from '../components/BrandLogo'
import Icon from '../components/Icon'
import { Link, NavLink } from 'react-router'
export default function Landing({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="landing-shell">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold"><BrandLogo /></Link>
        <nav aria-label="Navegação inicial" className="flex flex-wrap items-center gap-4 text-sm sm:gap-5">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'font-semibold brand-accent' : 'landing-nav-link'}>
            Início
          </NavLink>
          <a href="#recursos" className="landing-nav-link">
            Recursos
          </a>
          <Link to={authenticated ? '/dashboard' : '/login'} className="font-semibold brand-accent">
            {authenticated ? 'Meu dashboard' : 'Entrar'}
          </Link>
          {!authenticated && <Link to="/cadastro" className="primary">Criar conta</Link>}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="landing-hero-mark"><Mascot size={84} /></div>
        <p className="mb-6 text-sm font-semibold brand-accent">TRANSFORME CONSISTÊNCIA EM PROGRESSO</p>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">
          Seus hábitos constroem o seu <span className="brand-accent">futuro.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 muted">
          Organize sua rotina, acompanhe seus hábitos e mantenha a motivação para alcançar seus objetivos um dia de cada vez.
        </p>
        <Link to={authenticated ? '/dashboard' : '/cadastro'} className="primary mt-8 inline-block">
          {authenticated ? 'Continuar minha jornada →' : 'Começar agora →'}
        </Link>
        <section id="recursos" aria-label="Recursos do StreakFlow" className="mt-16 grid scroll-mt-8 gap-5 sm:grid-cols-3">
          {([
            ['target', 'Organize sua rotina', 'Crie e personalize hábitos para seus objetivos.'],
            ['check', 'Registre suas conquistas', 'Faça check-ins com esforço, duração e observações.'],
            ['chart', 'Acompanhe seu progresso', 'Veja suas conclusões e mantenha a consistência.'],
          ] as const).map(([icon, title, description]) => (
            <article key={title} className="panel">
              <Icon name={icon} width={30} height={30} className="brand-accent" />
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 muted">{description}</p>
            </article>
          ))}
        </section>
        <section className="panel mt-16" aria-labelledby="como-funciona"><p className="text-sm font-semibold brand-accent">SIMPLES DESDE O PRIMEIRO DIA</p><h2 id="como-funciona" className="mt-3 text-3xl font-bold">Uma rotina com mais intenção.</h2><div className="mt-8 grid gap-8 sm:grid-cols-3">{[['01', 'Escolha um hábito', 'Comece com uma ação pequena e uma categoria que faça sentido para você.'], ['02', 'Dê o primeiro passo', 'Registre suas atividades concluídas e acompanhe a meta de hoje.'], ['03', 'Veja sua evolução', 'Consulte seu histórico e descubra suas sequências de consistência.']].map(([step, title, text]) => <div key={step}><span className="text-sm font-bold brand-accent">{step}</span><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 muted">{text}</p></div>)}</div></section>
        <section className="mt-16 max-w-3xl" aria-labelledby="duvidas"><h2 id="duvidas" className="mb-6 text-2xl font-bold">Antes de começar</h2>{[['Preciso instalar alguma coisa?', 'Não. Você pode criar sua conta de demonstração e organizar seus hábitos diretamente no navegador.'], ['Onde meus dados ficam salvos?', 'Nesta versão, seus dados ficam salvos neste navegador, inclusive após fechar a aba. Você pode exportar uma cópia em Configurações. Não há sincronização entre dispositivos.'], ['Como funciona a sequência?', 'O streak conta os dias consecutivos em que um mesmo hábito foi concluído. Enquanto hoje estiver pendente, a sequência pode terminar ontem. O dashboard mostra a maior sequência atual entre seus hábitos.']].map(([question, answer]) => <details key={question} className="border-b landing-border py-5"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 text-sm leading-7 muted">{answer}</p></details>)}</section>
        <footer className="mt-16 flex flex-wrap justify-between gap-4 border-t landing-border pt-6 text-sm muted"><span>StreakFlow · Um dia de cada vez.</span><div className="flex gap-5"><Link to="/termos">Termos</Link><Link to="/privacidade">Privacidade</Link></div></footer>
        <p className="mt-10 text-sm muted">Demonstração interativa. Seus dados ficam salvos localmente neste navegador.</p>
      </main>
    </div>
  )
}
