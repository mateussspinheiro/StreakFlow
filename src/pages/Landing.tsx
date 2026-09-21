import { Link, NavLink } from 'react-router'
export default function Landing({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7">
        <Link to="/" className="text-xl font-bold">🔥 StreakFlow</Link>
        <nav aria-label="Navegação inicial" className="flex flex-wrap items-center gap-4 text-sm sm:gap-5">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'font-semibold text-violet-300' : 'text-slate-300 hover:text-white'}>
            Início
          </NavLink>
          <a href="#recursos" className="text-slate-300 hover:text-white">
            Recursos
          </a>
          <Link to={authenticated ? '/dashboard' : '/login'} className="font-semibold text-violet-300">
            {authenticated ? 'Meu dashboard' : 'Entrar'}
          </Link>
          {!authenticated && <Link to="/cadastro" className="primary">Criar conta</Link>}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="mb-6 text-sm font-semibold text-violet-300">TRANSFORME CONSISTÊNCIA EM PROGRESSO</p>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">
          Seus hábitos constroem o seu <span className="text-violet-400">futuro.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Organize sua rotina, acompanhe seus hábitos e mantenha a motivação para alcançar seus objetivos um dia de cada vez.
        </p>
        <Link to={authenticated ? '/dashboard' : '/cadastro'} className="primary mt-8 inline-block">
          {authenticated ? 'Continuar minha jornada →' : 'Começar agora →'}
        </Link>
        <section id="recursos" aria-label="Recursos do StreakFlow" className="mt-16 grid scroll-mt-8 gap-5 sm:grid-cols-3">
          {[
            ['🎯', 'Organize sua rotina', 'Crie e personalize hábitos para seus objetivos.'],
            ['✅', 'Registre suas conquistas', 'Marque suas atividades concluídas ao longo do dia.'],
            ['📈', 'Acompanhe seu progresso', 'Veja suas conclusões e mantenha a consistência.'],
          ].map(([icon, title, description]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="text-3xl" aria-hidden="true">{icon}</span>
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </section>
        <p className="mt-10 text-sm text-slate-500">Demonstração interativa. Os dados ficam nesta aba durante a sessão.</p>
      </main>
    </div>
  )
}
