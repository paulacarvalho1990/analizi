import { BarChart3, ClipboardList, Compass, FileText, Flame, Lightbulb, LogOut, Menu, Moon, Settings, Sun, Target, Users } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'
import { WorkspaceSelector, NewSiteModal } from './WorkspaceSelector'
import { APP_VERSION } from '../lib/version'
import { useBusiness } from '../lib/business-context'

export type Page = 'dashboard' | 'acquisition' | 'audience' | 'pages' | 'results' | 'heatmap' | 'insights' | 'settings' | 'team' | 'data-sources' | 'ga4-setup' | 'tracker-setup' | 'weekly-report' | 'reports-admin' | 'report-geral' | 'report-contatos' | 'report-visitas' | 'report-regiao'

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
  'weekly-report': 'Relatório semanal | Analizi',
  'reports-admin': 'Todos os relatórios (admin) | Analizi',
  'report-geral': 'Relatório da semana | Analizi',
  'report-contatos': 'Relatório de contatos | Analizi',
  'report-visitas': 'Relatório de visitas | Analizi',
  'report-regiao': 'Relatório por região | Analizi',
}

const nav = [
  { id: 'weekly-report', label: 'Relatório semanal', shortLabel: 'Relatório', icon: Lightbulb, badge: 'IA' },
  { id: 'dashboard', label: 'Visão Geral', shortLabel: 'Visão Geral', icon: BarChart3, badge: undefined },
  { id: 'acquisition', label: 'Aquisição & Campanhas', shortLabel: 'Aquisição', icon: Compass, badge: undefined },
  { id: 'audience', label: 'Público', shortLabel: 'Público', icon: Users, badge: undefined },
  { id: 'pages', label: 'Páginas', shortLabel: 'Páginas', icon: FileText, badge: undefined },
  { id: 'results', label: 'Resultados', shortLabel: 'Resultados', icon: Target, badge: undefined },
  { id: 'heatmap', label: 'Heatmap e Rolagem', shortLabel: 'Heatmap', icon: Flame, badge: undefined },
] as const

export function AppShell({ page, setPage, children, onLogout, theme, onToggleTheme }: { page: Page, setPage: (page: Page) => void, children: ReactNode, onLogout: () => void, theme: 'light' | 'dark', onToggleTheme: () => void }) {
  const paths: Partial<Record<Page, string>> = { dashboard: '/painel', acquisition: '/aquisicao', audience: '/publico', pages: '/paginas', results: '/resultados', heatmap: '/heatmap', insights: '/insights', settings: '/configuracoes', team: '/configuracoes/negocio', 'data-sources': '/configuracoes/fontes-de-dados', 'tracker-setup': '/configuracoes/rastreador', 'ga4-setup': '/configuracoes/google-analytics', 'weekly-report': '/relatorio-semanal', 'reports-admin': '/admin/relatorios', 'report-geral': '/relatorios/geral', 'report-contatos': '/relatorios/contatos', 'report-visitas': '/relatorios/visitas', 'report-regiao': '/relatorios/regiao' }
  const { userProfile } = useBusiness()
  const isAdmin = userProfile?.plan === 'admin'
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
        <button className="brand" aria-label="Ir para o Relatório semanal" onClick={() => navigate('weekly-report')}>
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
          {isAdmin && (
            <button onClick={() => navigate('reports-admin')} className={page === 'reports-admin' ? 'nav-item active' : 'nav-item'}>
              <ClipboardList size={19} />
              <span>Todos os relatórios</span>
              <span className="nav-badge">Admin</span>
            </button>
          )}
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
      <main className="main-content">
        {children}
        <footer className="app-footer" aria-label="Versão do Analizi">
          <span>Analizi</span>
          <span>{APP_VERSION}</span>
        </footer>
      </main>
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
