import BrandLogo from './BrandLogo'
import Icon from './Icon'

function BrandPanel() {
  return (
    <section className="brand-panel relative hidden overflow-hidden bg-[#111827] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">

      <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-[430px] w-[430px] rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative z-10"><BrandLogo /></div>

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
            icon="target"
            value="Crie"
            label="Hábitos com intenção"
          />

          <MiniCard
            icon="check"
            value="Conclua"
            label="Um passo por dia"
          />

          <MiniCard
            icon="chart"
            value="Evolua"
            label="Acompanhe seu ritmo"
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
  icon: 'target' | 'check' | 'chart'
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">

      <div className="mb-3 text-2xl">
        <Icon name={icon} className="text-violet-300" />
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


export default BrandPanel
