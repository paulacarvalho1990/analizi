import { BarChart3, FileText, Lightbulb, LogOut, Menu, Moon, Settings, Sun, Target, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'

export type Page = 'dashboard' | 'audience' | 'pages' | 'results' | 'insights' | 'settings' | 'team' | 'data-sources' | 'ga4-setup' | 'tracker-setup'

const nav = [
  ['dashboard', 'Início', BarChart3], ['audience', 'Público', Users], ['pages', 'Páginas', FileText],
  ['results', 'Resultados', Target], ['insights', 'Insights', Lightbulb],
] as const

export function AppShell({ page, setPage, children, onLogout, theme, onToggleTheme }: { page: Page, setPage: (page: Page) => void, children: ReactNode, onLogout: () => void, theme: 'light' | 'dark', onToggleTheme: () => void }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" aria-label="Ir para o início" onClick={() => setPage('dashboard')}><BrandLogo inverse /></button>
      <div className="workspace"><span className="workspace-dot" /> Clínica Horizonte <span className="chevron">⌄</span></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setPage(id)} className={page === id ? 'nav-item active' : 'nav-item'}><Icon size={19} />{label}</button>)}</nav>
      <div className="sidebar-bottom"><button onClick={onToggleTheme} className="nav-item">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</button><button onClick={() => setPage('settings')} className={page === 'settings' ? 'nav-item active' : 'nav-item'}><Settings size={19} />Configurações</button><button onClick={onLogout} className="nav-item"><LogOut size={19} />Sair</button></div>
    </aside>
    <header className="mobile-header"><button className="brand" aria-label="Ir para o início" onClick={() => setPage('dashboard')}><BrandLogo /></button><Menu size={22} /></header>
    <main className="main-content">{children}</main>
    <nav className="mobile-nav">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setPage(id)} className={page === id ? 'active' : ''}><Icon size={20} /><span>{label}</span></button>)}</nav>
  </div>
}
