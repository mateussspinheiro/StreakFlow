import { useEffect } from 'react'
import { Link } from 'react-router'
import BrandLogo from '../components/BrandLogo'

export default function NotFound() {
  useEffect(() => { document.title = 'Página não encontrada | StreakFlow' }, [])
  return <div className="page-content">
    <Link to="/" aria-label="StreakFlow — início"><BrandLogo /></Link>
    <section className="panel">
      <header className="page-heading"><div><p className="eyebrow">404</p><h1>Página não encontrada</h1><p className="muted">Essa página não existe ou foi movida.</p></div></header>
      <Link className="primary mt-5" to="/">Voltar para o início</Link>
    </section>
  </div>
}
