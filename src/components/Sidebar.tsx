import { useState, useSyncExternalStore } from 'react'
import { NavLink } from 'react-router'
import type { Profile } from '../lib/types'
import Icon from './Icon'
import BrandLogo from './BrandLogo'
import Modal from './Modal'

const subscribe = (callback: () => void) => {
  const media = window.matchMedia('(max-width: 767px)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
const isMobile = () => window.matchMedia('(max-width: 767px)').matches
const mainLinks = [['/dashboard', 'Dashboard', 'dashboard'], ['/meus-habitos', 'Meus hábitos', 'check'], ['/historico', 'Histórico', 'history'], ['/progresso', 'Progresso', 'chart']] as const
const accountLinks = [['/dashboard/perfil', 'Meu perfil', 'profile'], ['/dashboard/configuracoes', 'Configurações', 'settings']] as const

export default function Sidebar({ onLogout, profile }: { onLogout: () => void; profile: Profile }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const mobile = useSyncExternalStore(subscribe, isMobile)
  const linkClass = ({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'nav-active' : ''}`
  const content = <div className="sidebar-content" onClick={event => { if ((event.target as HTMLElement).closest('a')) setMenuOpen(false) }}>
    <NavLink to="/dashboard" className="sidebar-brand"><BrandLogo /></NavLink>
    <p className="nav-section-label">MINHA ROTINA</p>
    <nav aria-label="Navegação principal">{mainLinks.map(([path, label, icon]) => <NavLink key={path} to={path} end={path === '/dashboard'} className={linkClass}><Icon name={icon} width={20} height={20} />{label}</NavLink>)}</nav>
    <p className="nav-section-label account-label">CONTA</p>
    <nav aria-label="Conta">{accountLinks.map(([path, label, icon]) => <NavLink key={path} to={path} className={linkClass}><Icon name={icon} width={20} height={20} />{label}</NavLink>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-profile"><span aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span><div><strong>{profile.name}</strong><p>{profile.email}</p></div></div><NavLink to="/" className="nav-item">Página inicial</NavLink><button className="nav-item danger-text" onClick={() => { onLogout(); setMenuOpen(false) }}>Sair da conta</button></div>
  </div>
  return mobile ? <><header className="mobile-header"><NavLink to="/dashboard"><BrandLogo /></NavLink><button className="secondary" aria-expanded={menuOpen} aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>Menu</button></header>{menuOpen && <Modal title="Navegação" className="drawer" onClose={() => setMenuOpen(false)}>{content}</Modal>}</> : <aside className="desktop-sidebar">{content}</aside>
}
