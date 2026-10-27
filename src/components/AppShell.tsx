import { BarChart3, Compass, FileText, Flame, Lightbulb, LogOut, Menu, Moon, Settings, Sun, Target, Users } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'
import { WorkspaceSelector, NewSiteModal } from './WorkspaceSelector'

export type Page = 'dashboard' | 'acquisition' | 'audience' | 'pages' | 'results' | 'heatmap' | 'insights' | 'settings' | 'team' | 'data-sources' | 'ga4-setup' | 'tracker-setup'

export const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Visão Geral | Analizi',
  acquisition: 'Aquisição & Campanhas | Analizi',
  audience: 'Público | Analizi',
  pages: 'Páginas | Analizi',
  results: 'Resultados | Analizi',
  heatmap: 'Heatmap e Rolagem | Analizi',
  insights: 'Insights | Analizi',
  settings: 'Configurações | Analizi',
  team: 'Meu Site | Analizi',
  'data-sources': 'Fontes de Dados | Analizi',
  'ga4-setup': 'Conectar Google Analytics | Analizi',
  'tracker-setup': 'Instalar Rastreador | Analizi',
}

const nav = [
  { id: 'dashboard', label: 'Início', shortLabel: 'Início', icon: BarChart3, badge: undefined },
  { id: 'acquisition', label: 'Aquisição & Campanhas', shortLabel: 'Aquisição', icon: Compass, badge: undefined },
  { id: 'audience', label: 'Público', shortLabel: 'Público', icon: Users, badge: undefined },
  { id: 'pages', label: 'Páginas', shortLabel: 'Páginas', icon: FileText, badge: undefined },
  { id: 'results', label: 'Resultados', shortLabel: 'Resultados', icon: Target, badge: undefined },
  { id: 'heatmap', label: 'Heatmap e Rolagem', shortLabel: 'Heatmap', icon: Flame, badge: undefined },
  { id: 'insights', label: 'Insights', shortLabel: 'Insights', icon: Lightbulb, badge: 'IA' },
] as const

export function AppShell({ page, setPage, children, onLogout, theme, onToggleTheme }: { page: Page, setPage: (page: Page) => void, children: ReactNode, onLogout: () => void, theme: 'light' | 'dark', onToggleTheme: () => void }) {
  const paths: Partial<Record<Page, string>> = { dashboard: '/painel', acquisition: '/aquisicao', audience: '/publico', pages: '/paginas', results: '/resultados', heatmap: '/heatmap', insights: '/insights', settings: '/configuracoes', team: '/configuracoes/negocio', 'data-sources': '/configuracoes/fontes-de-dados', 'tracker-setup': '/configuracoes/rastreador', 'ga4-setup': '/configuracoes/google-analytics' }
  const navigate = (next: Page) => {
    const path = paths[next];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', `${path}${window.location.search}`);
    }
    setPage(next);
  }
  useEffect(() => {
    const path = paths[page];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', `${path}${window.location.search}`);
    }
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
        <WorkspaceSelector onNavigateSettings={() => navigate('data-sources')} />
        <nav>
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => navigate(id)} className={page === id ? 'nav-item active' : 'nav-item'}>
              <Icon size={19} />
              <span>{label}</span>
              {badge && <span className="nav-badge ai">{badge}</span>}
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
        <WorkspaceSelector compact onNavigateSettings={() => navigate('settings')} />
        <button
          type="button"
          className="mobile-header-settings-btn"
          aria-label="Abrir configurações"
          title="Configurações"
          onClick={() => navigate('settings')}
        >
          <Settings size={20} />
        </button>
      </header>
      <main className="main-content">{children}</main>
      <NewSiteModal onSiteCreated={() => navigate('data-sources')} />
      <nav className="mobile-nav" aria-label="Menu de navegação mobile">
        {nav.map(({ id, shortLabel, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate(id)}
            className={page === id ? 'mobile-nav-btn active' : 'mobile-nav-btn'}
          >
            <div className="mobile-nav-icon-wrapper">
              <Icon size={19} />
              {badge && <span className="mobile-badge-ia">{badge}</span>}
            </div>
            <span>{shortLabel || label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
