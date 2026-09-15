import { useState, type FormEvent, type ReactNode } from 'react'

type Tela = 'login' | 'cadastro' | 'dashboard'

interface Habit {
  id: number
  title: string
  category: string
  icon: string
  streak: number
  completed: boolean
  color: string
}

function App() {
  const [tela, setTela] = useState<Tela>('login')

  if (tela === 'dashboard') {
    return <Dashboard onLogout={() => setTela('login')} />
  }

  if (tela === 'cadastro') {
    return <Cadastro onLogin={() => setTela('login')} />
  }

  return (
    <Login
      onCadastro={() => setTela('cadastro')}
      onEntrar={() => setTela('dashboard')}
    />
  )
}

/* ======================================================
   PAINEL DA MARCA
====================================================== */

function BrandPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-[#111827] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">

      <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-[430px] w-[430px] rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative z-10 flex items-center gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/30">
          <span className="text-2xl">🔥</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">
            StreakFlow
          </h1>

          <p className="text-xs text-slate-400">
            Construa hábitos. Evolua todos os dias.
          </p>
        </div>

      </div>

      <div className="relative z-10 max-w-xl">

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          Transforme consistência em progresso
        </div>

        <h2 className="text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">

          Seus hábitos constroem o seu

          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {' '}futuro.
          </span>

        </h2>

        <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">

          Organize sua rotina, acompanhe suas sequências e mantenha a
          motivação para alcançar seus objetivos um dia de cada vez.

        </p>

        <div className="mt-10 grid grid-cols-3 gap-4">

          <MiniCard
            icon="🔥"
            value="12"
            label="Dias de sequência"
          />

          <MiniCard
            icon="✓"
            value="84%"
            label="Taxa de conclusão"
          />

          <MiniCard
            icon="⚡"
            value="480"
            label="Pontos conquistados"
          />

        </div>

      </div>

      <p className="relative z-10 text-sm text-slate-500">
        © 2026 StreakFlow. Todos os direitos reservados.
      </p>

    </section>
  )
}

function MiniCard({
  icon,
  value,
  label,
}: {
  icon: string
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">

      <div className="mb-3 text-2xl">
        {icon}
      </div>

      <p className="text-2xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {label}
      </p>

    </div>
  )
}

function MobileLogo() {
  return (
    <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600">
        🔥
      </div>

      <span className="text-xl font-bold text-slate-900">
        StreakFlow
      </span>

    </div>
  )
}

/* ======================================================
   LOGIN
====================================================== */

function Login({
  onCadastro,
  onEntrar,
}: {
  onCadastro: () => void
  onEntrar: () => void
}) {

  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onEntrar()
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc]">

      <div className="min-h-screen lg:grid lg:grid-cols-2">

        <BrandPanel />

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-16">

          <div className="w-full max-w-md">

            <MobileLogo />

            <div className="mb-8">

              <p className="mb-2 text-sm font-semibold text-violet-600">
                BEM-VINDO DE VOLTA
              </p>

              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                Entre na sua conta
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                Continue construindo seus hábitos e mantenha sua sequência.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <InputEmail />

              <div>

                <div className="mb-2 flex justify-between">

                  <label className="text-sm font-semibold text-slate-700">
                    Senha
                  </label>

                  <button
                    type="button"
                    className="text-sm font-semibold text-violet-600"
                  >
                    Esqueceu a senha?
                  </button>

                </div>

                <PasswordInput
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  placeholder="Digite sua senha"
                />

              </div>

              <label className="flex items-center gap-3 text-sm text-slate-600">

                <input
                  type="checkbox"
                  className="h-4 w-4 accent-violet-600"
                />

                Lembrar de mim

              </label>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                Entrar na minha conta
                →
              </button>

            </form>

            <Divider />

            <GoogleButton text="Entrar com Google" />

            <p className="mt-8 text-center text-sm text-slate-500">

              Ainda não possui uma conta?{' '}

              <button
                type="button"
                onClick={onCadastro}
                className="font-bold text-violet-600"
              >
                Criar conta gratuitamente
              </button>

            </p>

          </div>

        </section>

      </div>

    </main>
  )
}

/* ======================================================
   CADASTRO
====================================================== */

function Cadastro({
  onLogin,
}: {
  onLogin: () => void
}) {

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault()

    if (password !== confirmPassword) {
      alert('As senhas não coincidem.')
      return
    }

    alert('Cadastro realizado com sucesso!')

  }

  return (
    <main className="min-h-screen bg-[#f8f9fc]">

      <div className="min-h-screen lg:grid lg:grid-cols-2">

        <BrandPanel />

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-16">

          <div className="w-full max-w-md">

            <MobileLogo />

            <div className="mb-7">

              <p className="mb-2 text-sm font-semibold text-violet-600">
                COMECE SUA JORNADA
              </p>

              <h2 className="text-4xl font-bold text-slate-900">
                Crie sua conta
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                Comece hoje a construir hábitos melhores.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome completo
                </label>

                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />

              </div>

              <InputEmail />

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Senha
                </label>

                <PasswordInput
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  placeholder="Crie uma senha"
                  value={password}
                  onChange={setPassword}
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirmar senha
                </label>

                <PasswordInput
                  showPassword={showConfirm}
                  setShowPassword={setShowConfirm}
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />

              </div>

              <label className="flex items-start gap-3 text-sm text-slate-500">

                <input
                  type="checkbox"
                  required
                  className="mt-1 accent-violet-600"
                />

                <span>
                  Eu concordo com os{' '}
                  <span className="font-semibold text-violet-600">
                    Termos de Uso
                  </span>{' '}
                  e a Política de Privacidade.
                </span>

              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-600 py-3.5 font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
              >
                Criar minha conta →
              </button>

            </form>

            <Divider />

            <GoogleButton text="Cadastrar com Google" />

            <p className="mt-7 text-center text-sm text-slate-500">

              Já possui uma conta?{' '}

              <button
                type="button"
                onClick={onLogin}
                className="font-bold text-violet-600"
              >
                Entrar
              </button>

            </p>

          </div>

        </section>

      </div>

    </main>
  )
}

/* ======================================================
   DASHBOARD
====================================================== */

function Dashboard({
  onLogout,
}: {
  onLogout: () => void
}) {

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [habits, setHabits] = useState<Habit[]>([
    {
      id: 1,
      title: 'Beber 2L de água',
      category: 'Saúde',
      icon: '💧',
      streak: 14,
      completed: true,
      color: 'bg-blue-50',
    },

    {
      id: 2,
      title: 'Estudar programação',
      category: 'Estudos',
      icon: '📚',
      streak: 9,
      completed: true,
      color: 'bg-violet-50',
    },

    {
      id: 3,
      title: 'Praticar exercícios',
      category: 'Fitness',
      icon: '🏋️',
      streak: 6,
      completed: false,
      color: 'bg-orange-50',
    },

    {
      id: 4,
      title: 'Ler por 30 minutos',
      category: 'Desenvolvimento',
      icon: '📖',
      streak: 21,
      completed: false,
      color: 'bg-emerald-50',
    },

    {
      id: 5,
      title: 'Meditar',
      category: 'Bem-estar',
      icon: '🧘',
      streak: 4,
      completed: true,
      color: 'bg-fuchsia-50',
    },
  ])

  const completed = habits.filter(
    (habit) => habit.completed
  ).length

  const progress =
    habits.length === 0
      ? 0
      : Math.round(
          (completed / habits.length) * 100
        )

  function toggleHabit(id: number) {

    setHabits((current) =>
      current.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completed: !habit.completed,
            }
          : habit
      )
    )

  }

  function deleteHabit(id: number) {

    const confirmed = window.confirm(
      'Deseja realmente excluir este hábito?'
    )

    if (confirmed) {
      setHabits((current) =>
        current.filter(
          (habit) => habit.id !== id
        )
      )
    }

  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">

      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          bg-[#111827]
          transition-transform
          lg:translate-x-0
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >

        <div className="flex h-24 items-center px-7">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600">
              🔥
            </div>

            <div>

              <h1 className="font-bold text-white">
                StreakFlow
              </h1>

              <p className="text-xs text-slate-500">
                Evolua todos os dias.
              </p>

            </div>

          </div>

        </div>

        <nav className="flex-1 px-4">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Menu principal
          </p>

          <div className="space-y-1">

            <SidebarItem
              icon="▦"
              text="Dashboard"
              active
            />

            <SidebarItem
              icon="✓"
              text="Meus hábitos"
              badge={String(habits.length)}
            />

            <SidebarItem
              icon="↻"
              text="Histórico"
            />

            <SidebarItem
              icon="▥"
              text="Progresso"
            />

          </div>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Conta
          </p>

          <div className="space-y-1">

            <SidebarItem
              icon="◯"
              text="Meu perfil"
            />

            <SidebarItem
              icon="⚙"
              text="Configurações"
            />

          </div>

        </nav>

        <div className="mx-4 mb-5 rounded-2xl border border-violet-400/10 bg-violet-600/10 p-4">

          <div className="mb-2 text-2xl">
            🔥
          </div>

          <p className="text-2xl font-bold text-white">
            21 dias
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Sua maior sequência até agora.
          </p>

        </div>

        <div className="border-t border-white/5 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold text-white">
              M
            </div>

            <div className="flex-1">

              <p className="text-sm font-semibold text-white">
                Mateus Pinheiro
              </p>

              <p className="text-xs text-slate-500">
                Nível Consistente
              </p>

            </div>

            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-white"
              title="Sair"
            >
              ↪
            </button>

          </div>

        </div>

      </aside>

      {/* CONTEÚDO */}

      <div className="lg:pl-72">

        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">

          <div className="flex h-20 items-center justify-between px-5 sm:px-8">

            <div className="flex items-center gap-4">

              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 p-2 lg:hidden"
              >
                ☰
              </button>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Domingo, 14 de setembro
                </p>

                <h2 className="text-xl font-bold text-slate-900">
                  Boa noite, Mateus! 👋
                </h2>

              </div>

            </div>

            <div className="flex gap-3">

              <button className="relative rounded-xl border border-slate-200 bg-white p-2.5">
                🔔
              </button>

              <button
                onClick={() =>
                  alert(
                    'Vamos criar a tela Novo Hábito em seguida.'
                  )
                }
                className="hidden rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 sm:block"
              >
                + Novo hábito
              </button>

            </div>

          </div>

        </header>

        <main className="mx-auto max-w-[1600px] p-5 sm:p-8">

          {/* HERO */}

          <section className="relative mb-8 overflow-hidden rounded-[28px] bg-[#111827] p-8">

            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-8 xl:flex-row xl:items-center">

              <div>

                <div className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300">
                  Seu progresso de hoje
                </div>

                <h3 className="max-w-2xl text-4xl font-bold text-white">

                  Você está construindo uma

                  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {' '}ótima sequência.
                  </span>

                </h3>

                <p className="mt-4 max-w-xl text-slate-400">
                  Complete seus hábitos de hoje para manter o ritmo.
                  Cada pequeno passo conta.
                </p>

              </div>

              <div className="flex items-center gap-6">

                <div className="relative flex h-28 w-28 items-center justify-center">

                  <svg className="h-28 w-28 -rotate-90">

                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="rgba(255,255,255,.08)"
                      strokeWidth="8"
                    />

                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="301"
                      strokeDashoffset={
                        301 -
                        (301 * progress) / 100
                      }
                    />

                  </svg>

                  <div className="absolute text-center">

                    <p className="text-2xl font-bold text-white">
                      {progress}%
                    </p>

                    <p className="text-[10px] text-slate-400">
                      concluído
                    </p>

                  </div>

                </div>

                <div>

                  <p className="text-sm text-slate-400">
                    Hoje
                  </p>

                  <p className="text-3xl font-bold text-white">
                    {completed}/{habits.length}
                  </p>

                  <p className="text-xs text-slate-500">
                    hábitos completos
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* CARDS */}

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon="🔥"
              title="Streak atual"
              value="12 dias"
              text="+2 dias esta semana"
            />

            <StatCard
              icon="🏆"
              title="Maior streak"
              value="21 dias"
              text="Seu recorde pessoal"
            />

            <StatCard
              icon="✅"
              title="Conclusão"
              value={`${progress}%`}
              text={`${completed} de ${habits.length} hoje`}
            />

            <StatCard
              icon="🎯"
              title="Hábitos ativos"
              value={String(habits.length)}
              text="Na sua rotina atual"
            />

          </section>

          <div className="grid gap-8 xl:grid-cols-[1.5fr_0.8fr]">

            {/* HÁBITOS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex justify-between">

                <div>

                  <h3 className="text-lg font-bold">
                    Hábitos de hoje
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Mantenha sua consistência.
                  </p>

                </div>

                <button className="text-sm font-bold text-violet-600">
                  Ver todos
                </button>

              </div>

              <div className="space-y-3">

                {habits.map((habit) => (

                  <div
                    key={habit.id}
                    className={`
                      group flex items-center gap-4
                      rounded-2xl border p-4
                      transition
                      ${
                        habit.completed
                          ? 'border-emerald-100 bg-emerald-50/40'
                          : 'border-slate-100 hover:border-violet-200'
                      }
                    `}
                  >

                    <button
                      onClick={() =>
                        toggleHabit(habit.id)
                      }
                      className={`
                        flex h-7 w-7 items-center justify-center
                        rounded-lg border-2
                        ${
                          habit.completed
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 text-transparent'
                        }
                      `}
                    >
                      ✓
                    </button>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${habit.color}`}
                    >
                      {habit.icon}
                    </div>

                    <div className="flex-1">

                      <p
                        className={`
                          font-semibold
                          ${
                            habit.completed
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800'
                          }
                        `}
                      >
                        {habit.title}
                      </p>

                      <div className="mt-1 flex gap-3 text-xs text-slate-400">

                        <span>
                          {habit.category}
                        </span>

                        <span>
                          •
                        </span>

                        <span className="font-semibold text-orange-500">
                          🔥 {habit.streak} dias
                        </span>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        alert(
                          `Editar ${habit.title}`
                        )
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                    >
                      ✎
                    </button>

                    <button
                      onClick={() =>
                        deleteHabit(habit.id)
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      🗑
                    </button>

                  </div>

                ))}

              </div>

              <button
                onClick={() =>
                  alert(
                    'Vamos criar o cadastro de hábito.'
                  )
                }
                className="mt-4 w-full rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
              >
                + Adicionar novo hábito
              </button>

            </section>

            {/* PROGRESSO SEMANAL */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-xs font-bold uppercase text-violet-600">
                Esta semana
              </p>

              <h3 className="mt-1 text-lg font-bold">
                Seu progresso
              </h3>

              <div className="mt-8 flex h-48 items-end justify-between gap-3">

                <WeekBar
                  day="Seg"
                  value={72}
                />

                <WeekBar
                  day="Ter"
                  value={86}
                />

                <WeekBar
                  day="Qua"
                  value={62}
                />

                <WeekBar
                  day="Qui"
                  value={100}
                />

                <WeekBar
                  day="Sex"
                  value={78}
                />

                <WeekBar
                  day="Sáb"
                  value={94}
                />

                <WeekBar
                  day="Dom"
                  value={progress}
                  active
                />

              </div>

              <div className="mt-7 rounded-2xl bg-violet-50 p-4">

                <p className="font-bold text-violet-950">
                  💡 Continue consistente
                </p>

                <p className="mt-1 text-xs leading-5 text-violet-700">
                  Você completou 84% dos seus hábitos nos últimos 7 dias.
                </p>

              </div>

            </section>

          </div>

          {/* PARTE INFERIOR */}

          <div className="mt-8 grid gap-8 lg:grid-cols-2">

            <section className="rounded-3xl border border-slate-200 bg-white p-6">

              <h3 className="text-lg font-bold">
                Histórico recente
              </h3>

              <p className="mb-6 mt-1 text-sm text-slate-500">
                Suas últimas atividades registradas.
              </p>

              <div className="space-y-5">

                <HistoryItem
                  icon="📚"
                  title="Estudar programação"
                  time="Hoje, 18:42"
                  streak="9 dias"
                />

                <HistoryItem
                  icon="💧"
                  title="Beber 2L de água"
                  time="Hoje, 16:15"
                  streak="14 dias"
                />

                <HistoryItem
                  icon="🧘"
                  title="Meditar"
                  time="Hoje, 08:30"
                  streak="4 dias"
                />

                <HistoryItem
                  icon="📖"
                  title="Ler por 30 minutos"
                  time="Ontem, 21:12"
                  streak="21 dias"
                />

              </div>

            </section>

            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white">

              <div className="text-3xl">
                🚀
              </div>

              <p className="mt-8 text-xs font-bold uppercase tracking-widest text-violet-200">
                Motivação diária
              </p>

              <h3 className="mt-3 text-2xl font-bold">
                A consistência transforma pequenas ações em grandes resultados.
              </h3>

              <p className="mt-4 text-sm leading-6 text-violet-100">
                Não precisa ser perfeito. Você só precisa continuar.
              </p>

              <div className="mt-8 flex items-center gap-3">

                <div className="h-2 flex-1 rounded-full bg-white/20">

                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                <span className="font-bold">
                  {progress}%
                </span>

              </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  )
}

/* ======================================================
   COMPONENTES
====================================================== */

function InputEmail() {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        E-mail
      </label>

      <input
        type="email"
        required
        placeholder="seunome@email.com"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
      />

    </div>
  )
}

function PasswordInput({
  showPassword,
  setShowPassword,
  placeholder,
  value,
  onChange,
}: {
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  placeholder: string
  value?: string
  onChange?: (value: string) => void
}) {

  return (
    <div className="relative">

      <input
        type={
          showPassword
            ? 'text'
            : 'password'
        }
        required
        minLength={8}
        placeholder={placeholder}
        value={value}
        onChange={
          onChange
            ? (event) =>
                onChange(
                  event.target.value
                )
            : undefined
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
      />

      <button
        type="button"
        onClick={() =>
          setShowPassword(
            !showPassword
          )
        }
        className="absolute inset-y-0 right-4 text-slate-400"
      >
        {showPassword
          ? '🙈'
          : '👁️'}
      </button>

    </div>
  )
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-4">

      <div className="h-px flex-1 bg-slate-200" />

      <span className="text-xs uppercase text-slate-400">
        ou continue com
      </span>

      <div className="h-px flex-1 bg-slate-200" />

    </div>
  )
}

function GoogleButton({
  text,
}: {
  text: string
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
    >
      <span className="text-lg">
        G
      </span>

      {text}

    </button>
  )
}

function SidebarItem({
  icon,
  text,
  active,
  badge,
}: {
  icon: ReactNode
  text: string
  active?: boolean
  badge?: string
}) {

  return (
    <button
      className={`
        flex w-full items-center gap-3
        rounded-xl px-3 py-2.5
        text-sm
        ${
          active
            ? 'bg-violet-600 font-semibold text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }
      `}
    >

      <span className="w-5 text-center">
        {icon}
      </span>

      <span className="flex-1 text-left">
        {text}
      </span>

      {badge && (
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">
          {badge}
        </span>
      )}

    </button>
  )
}

function StatCard({
  icon,
  title,
  value,
  text,
}: {
  icon: string
  title: string
  value: string
  text: string
}) {

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-xl">
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {text}
      </p>

    </div>
  )
}

function WeekBar({
  day,
  value,
  active,
}: {
  day: string
  value: number
  active?: boolean
}) {

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-end">

      <div className="flex h-full w-full max-w-8 items-end rounded-lg bg-slate-100">

        <div
          className={`
            w-full rounded-lg
            ${
              active
                ? 'bg-violet-600'
                : 'bg-violet-200'
            }
          `}
          style={{
            height: `${value}%`,
          }}
        />

      </div>

      <p
        className={`
          mt-3 text-xs
          ${
            active
              ? 'font-bold text-violet-600'
              : 'text-slate-400'
          }
        `}
      >
        {day}
      </p>

    </div>
  )
}

function HistoryItem({
  icon,
  title,
  time,
  streak,
}: {
  icon: string
  title: string
  time: string
  streak: string
}) {

  return (
    <div className="flex items-center gap-4">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="text-xs text-slate-400">
          {time}
        </p>

      </div>

      <div className="text-right">

        <p className="text-xs font-bold text-orange-500">
          🔥 {streak}
        </p>

        <p className="mt-1 text-[10px] font-semibold text-emerald-500">
          CONCLUÍDO
        </p>

      </div>

    </div>
  )
}

export default App