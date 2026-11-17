import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Compass,
  FileText,
  Info,
  Flame,
  Lightbulb,
  Lock,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { APP_VERSION } from '../lib/version'
import './LandingPage.css'

interface LandingPageProps {
  onStartTrial: () => void
  onLogin: () => void
}

/* Dados ilustrativos do mockup — negócio fictício. */
const MOCK = {
  '7d': {
    kpis: [
      { label: 'Visualizações de páginas', value: '4.812', delta: '+18%' },
      { label: 'Usuários', value: '1.936', delta: '+12%' },
      { label: 'Tempo de atenção', value: '1m 52s', delta: '+9%' },
      { label: 'Contatos iniciados', value: '87', delta: '+24%', highlight: true },
    ],
    line: [38, 52, 47, 64, 71, 49, 58],
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  },
  '30d': {
    kpis: [
      { label: 'Visualizações de páginas', value: '19.340', delta: '+15%' },
      { label: 'Usuários', value: '7.802', delta: '+10%' },
      { label: 'Tempo de atenção', value: '1m 47s', delta: '+6%' },
      { label: 'Contatos iniciados', value: '341', delta: '+21%', highlight: true },
    ],
    line: [42, 48, 45, 55, 60, 58, 66, 63, 70, 74],
    labels: ['1', '4', '7', '10', '13', '16', '19', '22', '25', '28'],
  },
} as const

const APP_NAV = [
  { label: 'Início', icon: BarChart3, active: true },
  { label: 'Aquisição & Campanhas', icon: Compass },
  { label: 'Público', icon: Users },
  { label: 'Páginas', icon: FileText },
  { label: 'Resultados', icon: Target },
  { label: 'Heatmap e Rolagem', icon: Flame },
  { label: 'Insights', icon: Lightbulb, badge: 'IA' },
]

const SEGMENTS = [
  'Odontologia',
  'Clínicas médicas',
  'Psicologia',
  'Advocacia',
  'Contabilidade',
  'Serviços automotivos',
  'Construção e reformas',
  'Beleza e estética',
  'Lojas virtuais',
]

const PLATFORMS = ['WordPress', 'Wix', 'Shopify', 'Squarespace', 'HTML próprio', 'Outras plataformas']

const FAQ = [
  {
    q: 'Preciso entender de tecnologia ou programação?',
    a: 'Não. Cada tela usa português simples e traz dicas curtas explicando o que o número significa. Você só precisa colar uma linha de código no site — e o passo a passo para isso está dentro do sistema.',
  },
  {
    q: 'Já tenho Google Analytics. O Analizi serve para mim?',
    a: 'Sim. O Analizi funciona como o Google Analytics — coleta visitas, origens e contatos com o próprio rastreador — mas mostra tudo de forma simplificada e fácil de acompanhar. Os dois podem ficar instalados ao mesmo tempo.',
  },
  {
    q: 'Como instalo no meu site?',
    a: 'Depois de entrar, o Analizi gera o código do seu site. Cole antes de </head> em todas as páginas. Há instruções específicas para WordPress, Wix, Shopify, Squarespace e HTML próprio.',
  },
  {
    q: 'Vou ver os dados de antes de instalar o Analizi?',
    a: 'Não. Os dados são exibidos a partir do momento em que o rastreador é instalado no seu site. Por isso, quanto antes você instalar, mais rápido os relatórios e os insights ficam completos.',
  },
  {
    q: 'Preciso cadastrar cartão para testar?',
    a: 'Não. O teste dura 7 dias e você entra direto com sua conta Google, sem cartão de crédito.',
  },
  {
    q: 'O rastreador deixa meu site lento?',
    a: 'O código é carregado de forma assíncrona, ou seja, não trava a abertura das páginas para os seus visitantes.',
  },
  {
    q: 'E a privacidade dos meus visitantes (LGPD)?',
    a: 'O Analizi não coleta IP, conteúdo de formulários, senhas, e-mails ou telefones. A cidade e o estado são identificados de forma anônima, sem guardar o endereço IP.',
  },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Sparkline({ values }: { values: readonly number[] }) {
  const w = 560
  const h = 150
  const max = 80
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - (v / max) * h] as const)
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg className="lp-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="lpSparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lpSparkStroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="60%" stopColor="#FF3CAC" />
          <stop offset="100%" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} className="lp-spark-grid" />
      ))}
      <path d={area} fill="url(#lpSparkFill)" />
      <path d={line} fill="none" stroke="url(#lpSparkStroke)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function LandingPage({ onStartTrial, onLogin }: LandingPageProps) {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.title = 'Analizi — Entenda o seu site sem complicação'
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (id: string) => {
    setMenuOpen(false)
    scrollTo(id)
  }

  const data = MOCK[period]

  return (
    <div className="lp">
      {/* ─── Navbar ───────────────────────────────────────── */}
      <header className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="lp-wrap lp-nav-inner">
          <a href="#" className="lp-logo" aria-label="Analizi — início" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <BrandLogo />
          </a>

          <nav className={`lp-nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
            <button type="button" onClick={() => go('produto')}>Produto</button>
            <button type="button" onClick={() => go('como-funciona')}>Como funciona</button>
            <button type="button" onClick={() => go('planos')}>Planos</button>
            <button type="button" onClick={() => go('duvidas')}>Dúvidas</button>
            <div className="lp-nav-mobile-actions">
              <button type="button" className="lp-btn lp-btn-ghost" onClick={onLogin}>Entrar</button>
              <button type="button" className="lp-btn lp-btn-primary" onClick={onStartTrial}>Testar 7 dias grátis</button>
            </div>
          </nav>

          <div className="lp-nav-actions">
            <button type="button" className="lp-btn lp-btn-ghost" onClick={onLogin}>Entrar</button>
            <button type="button" className="lp-btn lp-btn-primary" onClick={onStartTrial}>
              Testar grátis <ArrowRight size={16} />
            </button>
          </div>

          <button type="button" className="lp-nav-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        {/* ─── Hero ─────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-hero-bg" aria-hidden="true" />
          <div className="lp-wrap lp-hero-copy">
            <span className="lp-eyebrow-pill">
              <span className="lp-dot" /> Relatórios do seu site em português simples
            </span>
            <h1>
              Acompanhe os principais dados de acesso ao seu site.{' '}
              <span className="lp-grad-text lp-h1-line">Cresça com base em dados, sem complicação.</span>
            </h1>
            <p className="lp-lead">
              Visitas, origens, páginas e cliques no WhatsApp num painel fácil, com explicação em cada tela.
              E uma IA que analisa seus números e ajuda você a decidir o próximo passo.
            </p>
            <div className="lp-hero-ctas">
              <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onStartTrial}>
                Começar teste grátis de 7 dias <ArrowRight size={18} />
              </button>
              <button type="button" className="lp-btn lp-btn-outline lp-btn-lg" onClick={() => go('produto')}>
                Ver o que ele mostra
              </button>
            </div>
            <ul className="lp-hero-checks">
              <li><Check size={15} /> Sem cartão de crédito</li>
              <li><Check size={15} /> Entre com sua conta Google</li>
              <li><Check size={15} /> Uma linha de código</li>
            </ul>
          </div>

          {/* Mockup do produto (espelha a navegação real do app) */}
          <div className="lp-wrap">
            <div className="lp-app" role="img" aria-label="Prévia do painel Visão geral do Analizi com dados ilustrativos">
              <aside className="lp-app-side">
                <div className="lp-app-brand"><BrandLogo inverse /></div>
                <div className="lp-app-site">
                  <span className="lp-app-site-dot" />
                  <div>
                    <strong>Clínica Sorriso</strong>
                    <small>clinicasorriso.com.br</small>
                  </div>
                </div>
                <ul>
                  {APP_NAV.map(({ label, icon: Icon, active, badge }) => (
                    <li key={label} className={active ? 'is-active' : ''}>
                      <Icon size={15} /> <span>{label}</span>
                      {badge && <em>{badge}</em>}
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="lp-app-main">
                <div className="lp-app-top">
                  <div>
                    <h3>Visão geral</h3>
                    <p>O resumo do seu site no período escolhido.</p>
                  </div>
                  <div className="lp-seg" role="tablist" aria-label="Período">
                    <button type="button" role="tab" aria-selected={period === '7d'} className={period === '7d' ? 'is-on' : ''} onClick={() => setPeriod('7d')}>7 dias</button>
                    <button type="button" role="tab" aria-selected={period === '30d'} className={period === '30d' ? 'is-on' : ''} onClick={() => setPeriod('30d')}>30 dias</button>
                  </div>
                </div>

                <div className="lp-kpis">
                  {data.kpis.map((k) => (
                    <div key={k.label} className={`lp-kpi ${'highlight' in k && k.highlight ? 'is-hl' : ''}`}>
                      <span>{k.label}</span>
                      <strong>{k.value}</strong>
                      <small className="lp-up">{k.delta} vs. período anterior</small>
                    </div>
                  ))}
                </div>

                <div className="lp-app-grid">
                  <div className="lp-panel">
                    <div className="lp-panel-head">
                      <span>Visualizações por dia</span>
                    </div>
                    <Sparkline values={data.line} />
                    <div className="lp-spark-labels">
                      {data.labels.map((l) => <span key={l}>{l}</span>)}
                    </div>
                  </div>
                  <div className="lp-panel">
                    <div className="lp-panel-head"><span>Origem principal</span></div>
                    <ul className="lp-bars">
                      {[
                        ['Google (orgânico)', 46],
                        ['Instagram', 27],
                        ['Acesso direto', 18],
                        ['Outros sites', 9],
                      ].map(([name, pct]) => (
                        <li key={name as string}>
                          <div><span>{name}</span><b>{pct}%</b></div>
                          <i><s style={{ width: `${pct}%` }} /></i>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="lp-app-note">Dados ilustrativos</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Segmentos ────────────────────────────────────── */}
        <section className="lp-segments" aria-label="Para quem é">
          <div className="lp-wrap">
            <p>Feito para quem tem um site e quer mais clientes — não mais planilhas.</p>
            <div className="lp-chips">
              {SEGMENTS.map((s) => <span key={s}>{s}</span>)}
              <span className="lp-chip-more">e muito mais</span>
            </div>
          </div>
        </section>

        {/* ─── Produto: uma tela para cada pergunta ─────────── */}
        <section id="produto" className="lp-section">
          <div className="lp-wrap">
            <header className="lp-head">
              <span className="lp-eyebrow">O produto</span>
              <h2>Uma tela para cada pergunta sobre o seu site.</h2>
              <p>Nada de 100 menus. São seis relatórios, cada um respondendo uma dúvida real de quem tem um negócio.</p>
            </header>

            <div className="lp-bento">
              {/* Aquisição */}
              <article className="lp-card lp-card-wide">
                <div className="lp-card-copy">
                  <span className="lp-tag"><Compass size={14} /> Aquisição & Campanhas</span>
                  <h3>De onde vêm as visitas?</h3>
                  <p>Google, Instagram, acesso direto ou anúncios. Veja o tráfego orgânico vs. pago e qual anúncio ou criativo trouxe mais contatos (via UTM).</p>
                </div>
                <div className="lp-viz lp-viz-split">
                  <div className="lp-split-bar">
                    <span style={{ width: '64%' }}>Orgânico 64%</span>
                    <span style={{ width: '36%' }}>Pago 36%</span>
                  </div>
                  <div className="lp-mini-table">
                    <div><span>Melhor criativo</span><b>video-implante</b></div>
                    <div><span>Campanha</span><b>maio-clareamento</b></div>
                    <div><span>Contatos gerados</span><b>23</b></div>
                  </div>
                </div>
              </article>

              {/* Resultados */}
              <article className="lp-card lp-card-tall lp-card-accent">
                <div className="lp-card-copy">
                  <span className="lp-tag"><Target size={14} /> Resultados</span>
                  <h3>Quantas visitas viraram contato?</h3>
                  <p>Cliques no WhatsApp são contados automaticamente. Também aparecem formulários enviados, cadastros, downloads, abandono de formulário e a taxa de contato.</p>
                </div>
                <div className="lp-viz lp-results">
                  <div className="lp-result-main">
                    <MessageCircle size={18} />
                    <div><strong>64</strong><span>Contatos pelo WhatsApp</span></div>
                  </div>
                  <div className="lp-result-row"><span>Formulários enviados</span><b>17</b></div>
                  <div className="lp-result-row"><span>Downloads de arquivos</span><b>6</b></div>
                  <div className="lp-result-row"><span>Taxa de contato</span><b>4,5%</b></div>
                </div>
              </article>

              {/* Público */}
              <article className="lp-card">
                <div className="lp-card-copy">
                  <span className="lp-tag"><Users size={14} /> Público</span>
                  <h3>Quem está visitando?</h3>
                  <p>Cidade e estado no mapa do Brasil, celular ou computador, navegador e quantos são novos usuários.</p>
                </div>
                <div className="lp-viz lp-devices">
                  <div><span>Celular</span><i><s style={{ width: '72%' }} /></i><b>72%</b></div>
                  <div><span>Computador</span><i><s style={{ width: '28%' }} /></i><b>28%</b></div>
                </div>
              </article>

              {/* Páginas */}
              <article className="lp-card">
                <div className="lp-card-copy">
                  <span className="lp-tag"><FileText size={14} /> Páginas</span>
                  <h3>Quais páginas funcionam?</h3>
                  <p>A página mais vista, a velocidade média de carregamento e a taxa de saída de cada uma.</p>
                </div>
                <div className="lp-viz lp-pages">
                  <div><code>/</code><span>1.204</span></div>
                  <div><code>/implantes</code><span>812</span></div>
                  <div><code>/contato</code><span>455</span></div>
                </div>
              </article>

              {/* Heatmap */}
              <article className="lp-card lp-card-wide lp-card-full">
                <div className="lp-card-copy">
                  <span className="lp-tag"><Flame size={14} /> Heatmap e Rolagem</span>
                  <h3>Onde clicam e até onde leem?</h3>
                  <p>Mapa de calor dos cliques e a profundidade de rolagem de cada página.</p>
                </div>
                <div className="lp-viz lp-heat" aria-hidden="true">
                  <div className="lp-heat-page">
                    <i className="l1" /><i className="l2" /><i className="btn" /><i className="l3" /><i className="l4" />
                    <b className="h1" /><b className="h2" /><b className="h3" />
                  </div>
                  <div className="lp-heat-scroll">
                    <span>100%</span><span>68%</span><span>41%</span><span>19%</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ─── Insights com IA ──────────────────────────────── */}
        <section className="lp-insights">
          <div className="lp-wrap lp-insights-grid">
            <div className="lp-insights-copy">
              <span className="lp-eyebrow lp-eyebrow-light"><Sparkles size={14} /> Insights com IA</span>
              <h2>Toda segunda-feira, insights novos para você decidir o próximo passo.</h2>
              <p>
                A IA analisa os números da semana, aponta o que mudou e sugere o que fazer — em frases curtas,
                reunidas na página de Insights. Você decide com segurança, sem precisar interpretar gráficos.
              </p>
              <button type="button" className="lp-btn lp-btn-white lp-btn-lg" onClick={onStartTrial}>
                Ver os insights do meu site <ArrowRight size={18} />
              </button>
            </div>
            <div className="lp-insight-stack" aria-label="Exemplos de insights (ilustrativos)">
              <div className="lp-insight">
                <span className="lp-insight-badge">Tendência semanal</span>
                <h4>O Instagram trouxe mais contatos que o Google</h4>
                <p>Visitas vindas do Instagram geraram 31 cliques no WhatsApp, contra 22 do Google. Vale manter a frequência dos posts.</p>
              </div>
              <div className="lp-insight">
                <span className="lp-insight-badge is-orange">Atenção</span>
                <h4>A página /implantes perde visitantes no meio</h4>
                <p>Metade das pessoas não rola até o botão de agendamento. Experimente subir o botão para o início da página.</p>
              </div>
              <div className="lp-insight is-faded">
                <span className="lp-insight-badge is-blue">Oportunidade</span>
                <h4>72% das visitas são pelo celular</h4>
                <p>Confira se o botão de WhatsApp aparece fácil na tela pequena.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Como funciona ────────────────────────────────── */}
        <section id="como-funciona" className="lp-section">
          <div className="lp-wrap">
            <header className="lp-head">
              <span className="lp-eyebrow">Como funciona</span>
              <h2>Do cadastro aos primeiros dados em poucos minutos.</h2>
            </header>

            <div className="lp-steps">
              <div className="lp-step">
                <span className="lp-step-n">1</span>
                <h3>Entre com o Google</h3>
                <p>Sem formulário longo e sem senha nova. Seu espaço é criado automaticamente.</p>
              </div>
              <div className="lp-step">
                <span className="lp-step-n">2</span>
                <h3>Cole o código no site</h3>
                <p>O Analizi gera o código do seu site e mostra o passo a passo para a sua plataforma.</p>
                <pre className="lp-code"><code><span className="t">&lt;script</span> <span className="a">async</span> <span className="a">src</span>=<span className="s">"…/izi.js"</span> <span className="a">data-site</span>=<span className="s">"ANLZ…"</span><span className="t">&gt;&lt;/script&gt;</span></code></pre>
              </div>
              <div className="lp-step">
                <span className="lp-step-n">3</span>
                <h3>Acompanhe</h3>
                <p>O sistema confirma quando o rastreador está funcionando e os relatórios começam a se preencher.</p>
              </div>
            </div>

            <div className="lp-notice" role="note">
              <Info size={18} />
              <p>
                <strong>Importante:</strong> os dados são exibidos a partir do momento em que o rastreador é instalado no seu site.
                Visitas anteriores à instalação não aparecem nos relatórios.
              </p>
            </div>

            <div className="lp-platforms">
              <span>Guias de instalação para</span>
              {PLATFORMS.map((p) => <b key={p}>{p}</b>)}
            </div>
          </div>
        </section>

        {/* ─── Comparativo curto ────────────────────────────── */}
        <section className="lp-section lp-section-tint">
          <div className="lp-wrap lp-compare-wrap">
            <header className="lp-head lp-head-left">
              <span className="lp-eyebrow">Por que não só o GA4?</span>
              <h2>Os mesmos dados essenciais, sem a complexidade.</h2>
              <p>O Analizi funciona como o Google Analytics, mas foi desenhado para quem não é da área.</p>
            </header>
            <div className="lp-compare" role="table" aria-label="Comparação entre Google Analytics 4 e Analizi">
              <div className="lp-compare-row lp-compare-head" role="row">
                <span role="columnheader" />
                <span role="columnheader">Google Analytics 4</span>
                <span role="columnheader" className="is-brand">Analizi</span>
              </div>
              {[
                ['Linguagem', 'Termos técnicos, muitos em inglês', 'Português simples, com dicas em cada tela'],
                ['Cliques no WhatsApp', 'Exige configurar eventos', 'Contados automaticamente'],
                ['Navegação', 'Dezenas de relatórios e menus', 'Seis telas, uma por pergunta'],
                ['Decisões', 'Você interpreta os gráficos sozinho', 'A IA sugere o que fazer toda semana'],
              ].map(([k, a, b]) => (
                <div className="lp-compare-row" role="row" key={k}>
                  <span role="rowheader">{k}</span>
                  <span role="cell" className="is-muted">{a}</span>
                  <span role="cell" className="is-brand"><Check size={15} /> {b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Planos ───────────────────────────────────────── */}
        <section id="planos" className="lp-section">
          <div className="lp-wrap">
            <header className="lp-head">
              <span className="lp-eyebrow">Planos</span>
              <h2>Preço simples. Teste 7 dias grátis.</h2>
              <p>Comece sem cartão e escolha o plano depois.</p>
            </header>

            <div className="lp-pricing">
              <div className="lp-plan">
                <h3>Essencial</h3>
                <p className="lp-plan-desc">Para acompanhar 1 site com clareza.</p>
                <div className="lp-price"><small>R$</small><strong>39</strong><span>,90</span><em>/mês</em></div>
                <button type="button" className="lp-btn lp-btn-outline lp-btn-block" onClick={onStartTrial}>Começar teste grátis</button>
                <ul>
                  <li><Check size={16} /> 1 site</li>
                  <li><Check size={16} /> Início, Aquisição, Público, Páginas e Resultados</li>
                  <li><Check size={16} /> Contagem automática de cliques no WhatsApp</li>
                  <li><Check size={16} /> Insights semanais com IA</li>
                </ul>
              </div>

              <div className="lp-plan is-featured">
                <span className="lp-plan-ribbon">Mais completo</span>
                <h3>Crescimento</h3>
                <p className="lp-plan-desc">Para até 2 sites e mais movimento.</p>
                <div className="lp-price"><small>R$</small><strong>79</strong><span>,00</span><em>/mês</em></div>
                <button type="button" className="lp-btn lp-btn-primary lp-btn-block" onClick={onStartTrial}>Começar teste grátis</button>
                <ul>
                  <li><Check size={16} /> Até 2 sites</li>
                  <li><Check size={16} /> Tudo do Essencial</li>
                  <li><Check size={16} /> Heatmap de cliques e profundidade de rolagem</li>
                  <li><Check size={16} /> Equipe com níveis de acesso (administrador e visualizador)</li>
                </ul>
              </div>
            </div>
            <p className="lp-pricing-note"><Lock size={14} /> Sem cartão no teste · Cancele quando quiser</p>
          </div>
        </section>

        {/* ─── Privacidade ──────────────────────────────────── */}
        <section className="lp-privacy">
          <div className="lp-wrap lp-privacy-inner">
            <ShieldCheck size={28} />
            <div>
              <h3>Privacidade desde o código</h3>
              <p>Não coletamos IP, conteúdo de formulários, senhas, e-mails ou telefones dos seus visitantes. A localização é identificada de forma anônima.</p>
            </div>
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────── */}
        <section id="duvidas" className="lp-section">
          <div className="lp-wrap lp-faq-wrap">
            <header className="lp-head lp-head-left">
              <span className="lp-eyebrow">Dúvidas</span>
              <h2>Perguntas frequentes</h2>
              <p>Não achou sua dúvida? Comece o teste — o passo a passo está dentro do sistema.</p>
            </header>
            <div className="lp-faq">
              {FAQ.map((item, i) => {
                const open = openFaq === i
                return (
                  <div key={item.q} className={`lp-faq-item ${open ? 'is-open' : ''}`}>
                    <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? null : i)}>
                      <span>{item.q}</span>
                      <ChevronDown size={18} />
                    </button>
                    {open && <p>{item.a}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── CTA final ────────────────────────────────────── */}
        <section className="lp-final">
          <div className="lp-wrap">
            <div className="lp-final-card">
              <h2>Descubra hoje de onde vêm seus clientes.</h2>
              <p>Entre com o Google, cole uma linha de código e acompanhe.</p>
              <button type="button" className="lp-btn lp-btn-white lp-btn-lg" onClick={onStartTrial}>
                Começar teste grátis de 7 dias <ArrowRight size={18} />
              </button>
              <small>Sem cartão de crédito</small>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Rodapé ───────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <div className="lp-footer-brand">
            <BrandLogo />
            <p>Relatórios simples do seu site, feitos para pequenos negócios.</p>
          </div>
          <nav aria-label="Rodapé">
            <button type="button" onClick={() => go('produto')}>Produto</button>
            <button type="button" onClick={() => go('como-funciona')}>Como funciona</button>
            <button type="button" onClick={() => go('planos')}>Planos</button>
            <button type="button" onClick={() => go('duvidas')}>Dúvidas</button>
            <button type="button" onClick={onLogin}>Entrar</button>
          </nav>
        </div>
        <div className="lp-wrap lp-footer-bottom">
          <small>© 2026 Analizi. Todos os direitos reservados.</small>
          <small>{APP_VERSION}</small>
        </div>
      </footer>
    </div>
  )
}
