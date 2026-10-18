import { BarChart3, FileText, Lightbulb, LogOut, Menu, Settings, Target, Users } from 'lucide-react'
import type { ReactNode } from 'react'

export type Page = 'dashboard' | 'audience' | 'pages' | 'results' | 'insights' | 'settings'

const nav = [
  ['dashboard', 'Início', BarChart3], ['audience', 'Público', Users], ['pages', 'Páginas', FileText],
  ['results', 'Resultados', Target], ['insights', 'Insights', Lightbulb],
] as const

export function AppShell({ page, setPage, children, onLogout }: { page: Page, setPage: (page: Page) => void, children: ReactNode, onLogout: () => void }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('dashboard')}><span className="brand-mark">a</span><span>analizi</span></button>
      <div className="workspace"><span className="workspace-dot" /> Clínica Horizonte <span className="chevron">⌄</span></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setPage(id)} className={page === id ? 'nav-item active' : 'nav-item'}><Icon size={19} />{label}</button>)}</nav>
      <div className="sidebar-bottom"><button onClick={() => setPage('settings')} className={page === 'settings' ? 'nav-item active' : 'nav-item'}><Settings size={19} />Configurações</button><button onClick={onLogout} className="nav-item"><LogOut size={19} />Sair</button></div>
    </aside>
    <header className="mobile-header"><button className="brand" onClick={() => setPage('dashboard')}><span className="brand-mark">a</span><span>analizi</span></button><Menu size={22} /></header>
    <main className="main-content">{children}</main>
    <nav className="mobile-nav">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setPage(id)} className={page === id ? 'active' : ''}><Icon size={20} /><span>{label}</span></button>)}</nav>
  </div>
}
