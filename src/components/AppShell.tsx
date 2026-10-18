import { BarChart3, FileText, Lightbulb, LogOut, Menu, Moon, Settings, Sun, Target, Users } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'
import { supabase } from '../lib/supabase'

export type Page = 'dashboard' | 'audience' | 'pages' | 'results' | 'insights' | 'settings' | 'team' | 'data-sources' | 'ga4-setup' | 'tracker-setup'

const nav = [
  ['dashboard', 'Início', BarChart3], ['audience', 'Público', Users], ['pages', 'Páginas', FileText],
  ['results', 'Resultados', Target], ['insights', 'Insights', Lightbulb],
] as const

export function AppShell({ page, setPage, children, onLogout, theme, onToggleTheme }: { page: Page, setPage: (page: Page) => void, children: ReactNode, onLogout: () => void, theme: 'light' | 'dark', onToggleTheme: () => void }) {
  const [siteName, setSiteName] = useState('Seu site')
  const paths: Partial<Record<Page, string>> = { dashboard: '/painel', audience: '/publico', pages: '/paginas', results: '/resultados', insights: '/insights', settings: '/configuracoes', team: '/configuracoes/negocio', 'data-sources': '/configuracoes/fontes-de-dados', 'tracker-setup': '/configuracoes/rastreador', 'ga4-setup': '/configuracoes/google-analytics' }
  const navigate = (next: Page) => { const path = paths[next]; if (path && window.location.pathname !== path) window.history.pushState({}, '', path); setPage(next) }
  useEffect(() => { const path = paths[page]; if (path && window.location.pathname !== path) window.history.pushState({}, '', path) }, [page])
  useEffect(() => { const loadSite = async () => { const result = supabase ? await supabase.from('sites').select('name,domain').limit(1) : null; if (result?.data?.[0]) setSiteName(result.data[0].name || result.data[0].domain) }; void loadSite() }, [])
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" aria-label="Ir para o início" onClick={() => navigate('dashboard')}><BrandLogo inverse /></button>
      <div className="workspace"><span className="workspace-dot" /> {siteName} <span className="chevron">⌄</span></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} onClick={() => navigate(id)} className={page === id ? 'nav-item active' : 'nav-item'}><Icon size={19} />{label}</button>)}</nav>
      <div className="sidebar-bottom"><button onClick={onToggleTheme} className="nav-item">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</button><button onClick={() => navigate('settings')} className={page === 'settings' ? 'nav-item active' : 'nav-item'}><Settings size={19} />Configurações</button><button onClick={() => { window.history.pushState({}, '', '/'); onLogout() }} className="nav-item"><LogOut size={19} />Sair</button></div>
    </aside>
    <header className="mobile-header"><button className="brand" aria-label="Ir para o início" onClick={() => navigate('dashboard')}><BrandLogo /></button><Menu size={22} /></header>
    <main className="main-content">{children}</main>
    <nav className="mobile-nav">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => navigate(id)} className={page === id ? 'active' : ''}><Icon size={20} /><span>{label}</span></button>)}</nav>
  </div>
}
