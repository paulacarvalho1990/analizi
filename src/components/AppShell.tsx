import { BarChart3, FileText, Flame, Lightbulb, LogOut, Menu, Moon, Settings, Sun, Target, Users } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'
import { WorkspaceSelector } from './WorkspaceSelector'

export type Page = 'dashboard' | 'audience' | 'pages' | 'results' | 'heatmap' | 'insights' | 'settings' | 'team' | 'data-sources' | 'ga4-setup' | 'tracker-setup'

export const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Visão Geral | Analizi',
  audience: 'Público | Analizi',
  pages: 'Páginas | Analizi',
  results: 'Resultados | Analizi',
  heatmap: 'Heatmap & Comportamento | Analizi',
  insights: 'Insights de IA | Analizi',
  settings: 'Configurações | Analizi',
  team: 'Acesso ao Negócio | Analizi',
  'data-sources': 'Fontes de Dados | Analizi',
  'ga4-setup': 'Conectar Google Analytics | Analizi',
  'tracker-setup': 'Instalar Rastreador | Analizi',
}

const nav = [
  ['dashboard', 'Início', BarChart3], ['audience', 'Público', Users], ['pages', 'Páginas', FileText],
  ['results', 'Resultados', Target], ['heatmap', 'Heatmap', Flame], ['insights', 'Insights', Lightbulb],
] as const

export function AppShell({ page, setPage, children, onLogout, theme, onToggleTheme }: { page: Page, setPage: (page: Page) => void, children: ReactNode, onLogout: () => void, theme: 'light' | 'dark', onToggleTheme: () => void }) {
  const paths: Partial<Record<Page, string>> = { dashboard: '/painel', audience: '/publico', pages: '/paginas', results: '/resultados', heatmap: '/heatmap', insights: '/insights', settings: '/configuracoes', team: '/configuracoes/negocio', 'data-sources': '/configuracoes/fontes-de-dados', 'tracker-setup': '/configuracoes/rastreador', 'ga4-setup': '/configuracoes/google-analytics' }
  const navigate = (next: Page) => { const path = paths[next]; if (path && window.location.pathname !== path) window.history.pushState({}, '', path); setPage(next) }
  useEffect(() => {
    const path = paths[page];
    if (path && window.location.pathname !== path) window.history.pushState({}, '', path);
    if (PAGE_TITLES[page]) {
      document.title = PAGE_TITLES[page];
    }
  }, [page])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" aria-label="Ir para o início" onClick={() => navigate('dashboard')}>
          <BrandLogo inverse />
        </button>
        <WorkspaceSelector onNavigateSettings={() => navigate('team')} />
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button key={id} onClick={() => navigate(id)} className={page === id ? 'nav-item active' : 'nav-item'}>
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={onToggleTheme} className="nav-item">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>
          <button onClick={() => navigate('settings')} className={page === 'settings' ? 'nav-item active' : 'nav-item'}>
            <Settings size={19} />
            Configurações
          </button>
          <button onClick={() => { window.history.pushState({}, '', '/'); onLogout() }} className="nav-item">
            <LogOut size={19} />
            Sair
          </button>
        </div>
      </aside>
      <header className="mobile-header">
        <button className="brand" aria-label="Ir para o início" onClick={() => navigate('dashboard')}>
          <BrandLogo />
        </button>
        <WorkspaceSelector compact onNavigateSettings={() => navigate('team')} />
        <Menu size={22} />
      </header>
      <main className="main-content">{children}</main>
      <nav className="mobile-nav">
        {nav.map(([id, label, Icon]) => (
          <button key={id} onClick={() => navigate(id)} className={page === id ? 'active' : ''}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
