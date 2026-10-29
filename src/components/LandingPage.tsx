import { useState, useEffect } from 'react'
import {
  ArrowRight,
  Check,
  Sparkles,
  MousePointerClick,
  MessageCircle,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  Clock,
  Layers,
  Lock,
  Smartphone,
  Eye,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { Button } from './ui/Button'
import { APP_VERSION } from '../lib/version'
import './LandingPage.css'

interface LandingPageProps {
  onStartTrial: () => void
  onLogin: () => void
}

export function LandingPage({ onStartTrial, onLogin }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [simulatedFilter, setSimulatedFilter] = useState<'7d' | '30d'>('7d')

  useEffect(() => {
    document.title = 'Analizi — Analise seu site sem entender de tecnologia'
  }, [])

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => (prev === index ? null : index))
  }

  const faqItems = [
    {
      q: 'Preciso ter conhecimento de programação ou analytics para usar o Analizi?',
      a: 'Não. O Analizi foi desenvolvido especificamente para proprietários de empresas, gestores e profissionais que não são da área técnica. Todas as métricas, relatórios e telas são apresentados em português direto, sem jargões confusos e sem labirintos de configurações.',
    },
    {
      q: 'Já utilizo o Google Analytics no meu site. Posso usar o Analizi?',
      a: 'Sim! Você pode conectar sua conta do Google Analytics 4 existente com apenas um clique. O Analizi importa os dados automaticamente e os traduz para uma interface infinitamente mais limpa, compreensível e focada em resultados comerciais.',
    },
    {
      q: 'Como instalo o Analizi se eu não tiver o Google Analytics?',
      a: 'Disponibilizamos o Rastreador Analizi: uma única linha de código simples. Basta colar no cabeçalho do seu site (WordPress, Wix, Shopify, Nuvemshop ou código próprio). Se preferir, nossa equipe e tutoriais passo a passo ajudam você na configuração em menos de 2 minutos.',
    },
    {
      q: 'Preciso cadastrar meu cartão de crédito para fazer o teste gratuito?',
      a: 'Não. Você tem 7 dias completos para testar todas as funcionalidades do Analizi sem precisar cadastrar cartão de crédito. Sem cobranças automáticas e sem pegadinhas.',
    },
    {
      q: 'O Analizi deixa o meu site mais lento?',
      a: 'Não. O rastreador do Analizi é ultraleve (menos de 5 KB) e opera em modo assíncrono. Isso significa que ele não interfere na velocidade de abertura do seu site nem prejudica o carregamento das páginas para os seus visitantes.',
    },
    {
      q: 'O sistema está em conformidade com a LGPD?',
      a: 'Sim. O Analizi foi concebido com privacidade desde a sua raiz (Privacy by Design). Não coletamos nem armazenamos senhas, dados de formulários ou informações pessoais de terceiros, garantindo total conformidade com a legislação brasileira.',
    },
  ]

  return (
    <div className="landing-root">
      {/* ─── Top Navigation Bar ────────────────────────────── */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          <a href="#" className="landing-logo-link" aria-label="Analizi Página Inicial">
            <BrandLogo />
          </a>

          <nav className="landing-menu" aria-label="Navegação principal">
            <a href="#o-que-faz">O que o sistema faz</a>
            <a href="#comparativo">Comparativo</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#planos">Planos</a>
            <a href="#faq">Dúvidas comuns</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="landing-login-btn"
              onClick={onLogin}
            >
              Entrar
            </button>
            <button
              type="button"
              className="landing-cta-btn-sm"
              onClick={onStartTrial}
            >
              <span>Testar 7 dias grátis</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero Section ──────────────────────────────────── */}
        <section className="landing-hero-section">
          <div className="hero-glow-sphere sphere-1" />
          <div className="hero-glow-sphere sphere-2" />

          <div className="landing-container hero-content">
            <div className="hero-badge-pill">
              <span className="hero-badge-dot" />
              <span>Inteligência de site descomplicada</span>
            </div>

            <h1 className="hero-title">
              Analise seu site com clareza total.
              <span className="hero-title-gradient">
                Mesmo sem entender nada de analytics ou de tecnologia.
              </span>
            </h1>

            <p className="hero-subtitle">
              Chega de dashboards confusos com dezenas de termos em inglês. O Analizi
              traduz os acessos do seu site em respostas imediatas: saiba quem visita seu negócio,
              de onde essas pessoas vêm e quantas entram em contato com você pelo WhatsApp.
            </p>

            <div className="hero-action-group">
              <button
                type="button"
                className="landing-cta-primary"
                onClick={onStartTrial}
              >
                <span>Começar teste de 7 dias grátis</span>
                <ArrowRight size={20} />
              </button>
              <a href="#o-que-faz" className="landing-cta-secondary">
                <span>Ver demonstração do sistema</span>
              </a>
            </div>

            <div className="hero-guarantees">
              <div className="guarantee-item">
                <CheckCircle2 size={16} className="guarantee-icon" />
                <span>Sem necessidade de cartão de crédito</span>
              </div>
              <div className="guarantee-divider" />
              <div className="guarantee-item">
                <CheckCircle2 size={16} className="guarantee-icon" />
                <span>Instalação guiada em 2 minutos</span>
              </div>
              <div className="guarantee-divider" />
              <div className="guarantee-item">
                <CheckCircle2 size={16} className="guarantee-icon" />
                <span>Compatível com qualquer site</span>
              </div>
            </div>

            {/* ─── Hero Interactive Showcase Mockup ───────────── */}
            <div className="hero-mockup-wrapper" id="demonstracao">
              <div className="mockup-frame">
                <div className="mockup-header-bar">
                  <div className="mockup-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="mockup-address-bar">
                    <Lock size={12} />
                    <span>analizi.com.br/painel/clinica-horizonte</span>
                  </div>
                  <div className="mockup-live-status">
                    <span className="status-indicator-live" />
                    <span>Ao vivo • Dados em tempo real</span>
                  </div>
                </div>

                <div className="mockup-body">
                  {/* Mockup sub-header */}
                  <div className="mockup-app-bar">
                    <div>
                      <span className="mockup-business-name">Clínica Horizonte — Saúde Integrada</span>
                      <small className="mockup-business-url">https://clinicahorizonte.com.br</small>
                    </div>
                    <div className="mockup-filter-toggle">
                      <button
                        type="button"
                        className={simulatedFilter === '7d' ? 'active' : ''}
                        onClick={() => setSimulatedFilter('7d')}
                      >
                        Últimos 7 dias
                      </button>
                      <button
                        type="button"
                        className={simulatedFilter === '30d' ? 'active' : ''}
                        onClick={() => setSimulatedFilter('30d')}
                      >
                        Últimos 30 dias
                      </button>
                    </div>
                  </div>

                  {/* 4 Key Business Metric Cards */}
                  <div className="mockup-metrics-grid">
                    <div className="mockup-metric-card">
                      <div className="metric-header">
                        <span>Pessoas que visitaram o site</span>
                        <BarChart3 size={16} className="metric-icon blue" />
                      </div>
                      <div className="metric-number-row">
                        <strong>{simulatedFilter === '7d' ? '3.840' : '15.420'}</strong>
                        <span className="metric-badge positive">+22,4%</span>
                      </div>
                      <small className="metric-footnote">Visitantes únicos reais</small>
                    </div>

                    <div className="mockup-metric-card highlight-metric">
                      <div className="metric-header">
                        <span>Contatos via WhatsApp</span>
                        <MessageCircle size={16} className="metric-icon pink" />
                      </div>
                      <div className="metric-number-row">
                        <strong>{simulatedFilter === '7d' ? '164' : '628'}</strong>
                        <span className="metric-badge positive">+38,0%</span>
                      </div>
                      <small className="metric-footnote">Pessoas que clicaram para conversar</small>
                    </div>

                    <div className="mockup-metric-card">
                      <div className="metric-header">
                        <span>Página de maior interesse</span>
                        <Eye size={16} className="metric-icon orange" />
                      </div>
                      <div className="metric-number-row">
                        <strong className="text-truncate">/agendamento</strong>
                        <span className="metric-badge blue">61% contatos</span>
                      </div>
                      <small className="metric-footnote">{simulatedFilter === '7d' ? '2.410 acessos diretos' : '9.640 acessos'}</small>
                    </div>

                    <div className="mockup-metric-card">
                      <div className="metric-header">
                        <span>Tempo médio no site</span>
                        <Clock size={16} className="metric-icon navy" />
                      </div>
                      <div className="metric-number-row">
                        <strong>2m 45s</strong>
                        <span className="metric-badge green">Ótima retenção</span>
                      </div>
                      <small className="metric-footnote">Visitantes lêem seu conteúdo</small>
                    </div>
                  </div>

                  {/* Mockup Izi Insights Box (AI Assistant) */}
                  <div className="mockup-ai-insight">
                    <div className="ai-insight-icon-box">
                      <Sparkles size={20} />
                    </div>
                    <div className="ai-insight-text">
                      <div className="ai-insight-badge">
                        <span>Izi Insights • Diagnóstico Inteligente</span>
                      </div>
                      <p>
                        <strong>Seus anúncios no Instagram estão funcionando muito bem:</strong>{' '}
                        eles trouxeram 64% de todos os novos contatos de WhatsApp desta semana.
                        O melhor horário para atendimento rápido pelo WhatsApp tem sido entre 11h e 14h.
                      </p>
                    </div>
                  </div>

                  {/* Mockup Graphic & Traffic Origin Split */}
                  <div className="mockup-visual-row">
                    <div className="mockup-chart-box">
                      <div className="chart-box-header">
                        <span>Movimento diário de visitantes</span>
                        <small>Curva contínua de acessos</small>
                      </div>
                      <div className="mockup-chart-bars">
                        {[
                          { day: 'Seg', val: 45, cont: 18 },
                          { day: 'Ter', val: 68, cont: 24 },
                          { day: 'Qua', val: 56, cont: 20 },
                          { day: 'Qui', val: 89, cont: 32 },
                          { day: 'Sex', val: 94, cont: 38 },
                          { day: 'Sáb', val: 40, cont: 16 },
                          { day: 'Dom', val: 52, cont: 16 },
                        ].map((b, i) => (
                          <div key={i} className="chart-bar-col">
                            <div className="chart-bar-track">
                              <div
                                className="chart-bar-fill"
                                style={{ height: `${b.val}%` }}
                                title={`${b.day}: ${b.val * 10} visitas, ${b.cont} contatos`}
                              />
                            </div>
                            <span className="chart-bar-label">{b.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mockup-origins-box">
                      <div className="chart-box-header">
                        <span>De onde vêm os seus clientes?</span>
                        <small>Canais de atração</small>
                      </div>
                      <div className="origin-list">
                        <div className="origin-row">
                          <div className="origin-info">
                            <span className="origin-dot instagram" />
                            <span className="origin-name">Instagram & Meta Ads</span>
                          </div>
                          <div className="origin-bar-outer">
                            <div className="origin-bar-inner" style={{ width: '48%' }} />
                          </div>
                          <span className="origin-pct">48%</span>
                        </div>
                        <div className="origin-row">
                          <div className="origin-info">
                            <span className="origin-dot google" />
                            <span className="origin-name">Busca no Google</span>
                          </div>
                          <div className="origin-bar-outer">
                            <div className="origin-bar-inner" style={{ width: '34%' }} />
                          </div>
                          <span className="origin-pct">34%</span>
                        </div>
                        <div className="origin-row">
                          <div className="origin-info">
                            <span className="origin-dot direct" />
                            <span className="origin-name">Acesso Direto ao Site</span>
                          </div>
                          <div className="origin-bar-outer">
                            <div className="origin-bar-inner" style={{ width: '12%' }} />
                          </div>
                          <span className="origin-pct">12%</span>
                        </div>
                        <div className="origin-row">
                          <div className="origin-info">
                            <span className="origin-dot others" />
                            <span className="origin-name">Links & Outros Canais</span>
                          </div>
                          <div className="origin-bar-outer">
                            <div className="origin-bar-inner" style={{ width: '6%' }} />
                          </div>
                          <span className="origin-pct">6%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Segments Bar ──────────────────────────────────── */}
        <section className="landing-segments-bar">
          <div className="landing-container">
            <span className="segments-lead">
              A SOLUÇÃO IDEAL PARA NEGÓCIOS QUE QUEREM RESULTADOS SEM PERDER TEMPO COM PLANILHAS
            </span>
            <div className="segments-pill-row">
              <span className="seg-pill">Clínicas Médicas & Odontologia</span>
              <span className="seg-pill">Advocacia & Contabilidade</span>
              <span className="seg-pill">Lojas Virtuais & E-commerce</span>
              <span className="seg-pill">Prestadores de Serviços</span>
              <span className="seg-pill">Arquitetura & Engenharia</span>
              <span className="seg-pill">Consultorias & Educação</span>
            </div>
          </div>
        </section>

        {/* ─── Comparison Section (O que muda para você) ─────── */}
        <section id="comparativo" className="landing-comparison-section">
          <div className="landing-container">
            <div className="section-head text-center">
              <span className="section-eyebrow">A DIFERENÇA ANALIZI</span>
              <h2 className="section-title">
                Por que ferramentas tradicionais de analytics não funcionam na sua rotina?
              </h2>
              <p className="section-desc">
                Você não precisa de um diploma em ciência de dados apenas para saber se o seu site
                está gerando clientes ou onde você deve investir para crescer.
              </p>
            </div>

            <div className="comparison-cards-grid">
              {/* Card Tradicional */}
              <div className="comparison-card traditional">
                <div className="comparison-card-top">
                  <div className="card-badge red">Ferramentas Convencionais (ex.: GA4)</div>
                  <h3>Complexas, técnicas e confusas</h3>
                  <p>Projetadas para equipes técnicas e agências de dados, não para quem gerencia um negócio real.</p>
                </div>
                <ul className="comparison-list">
                  <li>
                    <XCircle size={18} className="list-icon-negative" />
                    <span>Mais de 100 menus e telas técnicas indecifráveis.</span>
                  </li>
                  <li>
                    <XCircle size={18} className="list-icon-negative" />
                    <span>Termos em inglês: <em>bounce rate</em>, <em>attribution</em>, <em>event triggers</em>.</span>
                  </li>
                  <li>
                    <XCircle size={18} className="list-icon-negative" />
                    <span>Não mostra quem clicou no WhatsApp sem códigos complexos e horas de programação.</span>
                  </li>
                  <li>
                    <XCircle size={18} className="list-icon-negative" />
                    <span>Exige contratação de especialistas ou cursos longos para extrair uma informação simples.</span>
                  </li>
                  <li>
                    <XCircle size={18} className="list-icon-negative" />
                    <span>Relatórios estáticos sem nenhuma explicação sobre o que você deve fazer a seguir.</span>
                  </li>
                </ul>
              </div>

              {/* Card Analizi */}
              <div className="comparison-card analizi-highlight">
                <div className="analizi-card-badge">CRIADO PARA O SEU DIA A DIA</div>
                <div className="comparison-card-top">
                  <div className="card-badge brand">Com o Analizi</div>
                  <h3>Direto ao ponto, visual e acionável</h3>
                  <p>Você abre o sistema e entende a situação em menos de 30 segundos, com respostas claras.</p>
                </div>
                <ul className="comparison-list">
                  <li>
                    <CheckCircle2 size={18} className="list-icon-positive" />
                    <span><strong>Uma única tela inteligente</strong> com os dados que realmente trazem faturamento.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="list-icon-positive" />
                    <span><strong>Linguagem 100% em português claro</strong>, pensada para quem toma decisões no negócio.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="list-icon-positive" />
                    <span><strong>Rastreamento automático de WhatsApp</strong>, chamadas telefônicas e contatos sem mexer em código.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="list-icon-positive" />
                    <span><strong>Instalação em 2 minutos</strong>: conecte seu Google Analytics existente ou adicione 1 linha de código.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="list-icon-positive" />
                    <span><strong>Izi Insights com Inteligência Artificial</strong> que resume os dados e dá sugestões práticas.</span>
                  </li>
                </ul>
                <div className="card-footer-cta">
                  <button type="button" className="landing-cta-primary full" onClick={onStartTrial}>
                    <span>Experimentar sem compromisso</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Section (O que o sistema faz) ────────── */}
        <section id="o-que-faz" className="landing-features-section">
          <div className="landing-container">
            <div className="section-head text-center">
              <span className="section-eyebrow">RECURSOS ESSENCIAIS</span>
              <h2 className="section-title">O que o Analizi faz pelo seu negócio</h2>
              <p className="section-desc">
                Tudo o que você precisa saber para transformar visitantes anônimos em clientes fiéis,
                sem complicações técnicas.
              </p>
            </div>

            <div className="features-grid-cards">
              {/* Feature 1 */}
              <div className="feature-item-card">
                <div className="feature-icon-wrapper blue">
                  <TrendingUp size={24} />
                </div>
                <h3>Origem Real dos Seus Visitantes</h3>
                <p>
                  Descubra exatamente se o seu retorno financeiro está vindo de anúncios no Instagram,
                  buscas no Google ou recomendações diretas. Pare de gastar dinheiro em canais que não funcionam.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-item-card">
                <div className="feature-icon-wrapper pink">
                  <MessageCircle size={24} />
                </div>
                <h3>Rastreamento Automático de WhatsApp</h3>
                <p>
                  A métrica que realmente importa: saiba quantas pessoas clicaram para conversar com você
                  e em qual página do site elas estavam quando tomaram a decisão de entrar em contato.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-item-card">
                <div className="feature-icon-wrapper orange">
                  <Sparkles size={24} />
                </div>
                <h3>Diagnósticos Automáticos com Izi Insights</h3>
                <p>
                  Nossa Inteligência Artificial analisa o comportamento do site e gera resumos em texto claro.
                  Você recebe avisos sobre aumento de tráfego, horários de pico e oportunidades de melhoria.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-item-card">
                <div className="feature-icon-wrapper navy">
                  <Zap size={24} />
                </div>
                <h3>Heatmap Visual de Cliques e Rolagem</h3>
                <p>
                  Veja um mapa visual de onde as pessoas mais clicam e até onde rolam a página. Descubra se
                  os seus botões principais estão sendo vistos ou se os visitantes desistem antes do final.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="feature-item-card">
                <div className="feature-icon-wrapper blue">
                  <Smartphone size={24} />
                </div>
                <h3>Aparelhos e Cidades de Acesso</h3>
                <p>
                  Entenda se seus clientes acessam mais pelo celular ou pelo computador e de quais estados
                  e cidades eles vêm. Garanta que a versão mobile do seu site seja rápida e fácil de usar.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="feature-item-card">
                <div className="feature-icon-wrapper pink">
                  <Clock size={24} />
                </div>
                <h3>Relatórios Executivos Semanais</h3>
                <p>
                  Receba um resumo objetivo e descomplicado do desempenho do seu site direto no seu e-mail
                  toda segunda-feira. Acompanhe a evolução do negócio sem precisar abrir relatórios todos os dias.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── How it works (Como funciona em 3 passos) ─────── */}
        <section id="como-funciona" className="landing-steps-section">
          <div className="landing-container">
            <div className="section-head text-center">
              <span className="section-eyebrow">SIMPLICIDADE NA PRÁTICA</span>
              <h2 className="section-title">Como começar em menos de 2 minutos</h2>
              <p className="section-desc">
                Sem burocracias ou configurações demoradas. O caminho mais rápido entre o seu site e respostas claras.
              </p>
            </div>

            <div className="steps-cards-row">
              <div className="step-card">
                <div className="step-number-badge">01</div>
                <h3>Acesse com sua conta Google</h3>
                <p>
                  Clique no botão de acesso seguro com o Google. Não é necessário preencher formulários longos nem memorizar senhas novas.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number-badge">02</div>
                <h3>Conecte seu site</h3>
                <p>
                  Se já possui Google Analytics, faça a conexão com apenas um clique. Se não possui, cole uma linha de código simples na sua página.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number-badge">03</div>
                <h3>Acompanhe e decida com segurança</h3>
                <p>
                  Em instantes, visualize de onde vêm suas visitas, quem clica no seu WhatsApp e o que fazer para atrair mais clientes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Pricing Section ───────────────────────────────── */}
        <section id="planos" className="landing-pricing-section">
          <div className="landing-container">
            <div className="section-head text-center">
              <span className="section-eyebrow">PLANOS TRANSPARENTES</span>
              <h2 className="section-title">Investimento acessível, retorno imediato</h2>
              <p className="section-desc">
                Os relatórios e a inteligência são completos em todos os planos. Você escolhe apenas a quantidade
                de sites e o volume de tráfego do seu negócio.
              </p>
            </div>

            <div className="pricing-cards-container">
              {/* Plano Essencial */}
              <div className="pricing-plan-card">
                <div className="plan-header">
                  <span className="plan-tier-name">PLANO ESSENCIAL</span>
                  <div className="plan-price-block">
                    <span className="currency">R$</span>
                    <span className="amount">39</span>
                    <span className="cents">,90</span>
                    <span className="recurrence">/mês</span>
                  </div>
                  <p className="plan-pitch-text">
                    Ideal para acompanhar um site com total clareza e sem complicação técnica.
                  </p>
                </div>

                <div className="plan-features-divider" />

                <ul className="plan-features-list">
                  <li>
                    <Check size={18} className="feature-check-icon" />
                    <span><strong>1 site</strong> monitorado</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon" />
                    <span>Até <strong>20 mil eventos</strong> mensais</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon" />
                    <span>Painel completo de métricas em português</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon" />
                    <span>Rastreamento automático de cliques em WhatsApp</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon" />
                    <span>Conexão direta com Google Analytics ou Rastreador Analizi</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon" />
                    <span>Relatório semanal executivo por e-mail</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="landing-plan-btn outline"
                  onClick={onStartTrial}
                >
                  Começar teste de 7 dias grátis
                </button>
                <small className="plan-footnote">Sem cartão de crédito • Cancele quando quiser</small>
              </div>

              {/* Plano Crescimento (Featured) */}
              <div className="pricing-plan-card featured-plan">
                <div className="featured-plan-ribbon">MAIS RECOMENDADO</div>
                <div className="plan-header">
                  <span className="plan-tier-name brand-color">PLANO CRESCIMENTO</span>
                  <div className="plan-price-block">
                    <span className="currency">R$</span>
                    <span className="amount">79</span>
                    <span className="cents">,00</span>
                    <span className="recurrence">/mês</span>
                  </div>
                  <p className="plan-pitch-text">
                    Perfeito para negócios que investem em anúncios, têm múltiplos sites ou maior tráfego.
                  </p>
                </div>

                <div className="plan-features-divider" />

                <ul className="plan-features-list">
                  <li>
                    <Check size={18} className="feature-check-icon brand-pink" />
                    <span><strong>Até 2 sites</strong> monitorados</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon brand-pink" />
                    <span>Até <strong>100 mil eventos</strong> mensais</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon brand-pink" />
                    <span><strong>Tudo do Plano Essencial</strong> incluído</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon brand-pink" />
                    <span><strong>Heatmap Visual</strong> de cliques e rolagem de página</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon brand-pink" />
                    <span><strong>Izi Insights com prioridade</strong> e diagnósticos avançados</span>
                  </li>
                  <li>
                    <Check size={18} className="feature-check-icon brand-pink" />
                    <span>Exportação completa de dados e relatórios</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="landing-plan-btn primary-gradient"
                  onClick={onStartTrial}
                >
                  Começar teste de 7 dias grátis
                </button>
                <small className="plan-footnote">Sem cartão de crédito • Acesso completo e imediato</small>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ Section ───────────────────────────────────── */}
        <section id="faq" className="landing-faq-section">
          <div className="landing-container">
            <div className="section-head text-center">
              <span className="section-eyebrow">DÚVIDAS FREQUENTES</span>
              <h2 className="section-title">Perguntas comuns sobre o Analizi</h2>
              <p className="section-desc">
                Respostas diretas para as principais dúvidas de quem deseja entender o próprio site.
              </p>
            </div>

            <div className="faq-accordion-list">
              {faqItems.map((item, idx) => {
                const isOpen = activeFaq === idx
                return (
                  <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-question-button"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <ChevronDown size={20} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="faq-answer-pane">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Final CTA Banner ──────────────────────────────── */}
        <section className="landing-final-cta-section">
          <div className="landing-container">
            <div className="final-cta-card">
              <div className="final-cta-badge">EXPERIMENTE NA PRÁTICA</div>
              <h2>Entenda o que acontece no seu site a partir de hoje.</h2>
              <p>
                Junte-se a empresários e gestores que deixaram planilhas complexas de lado
                e agora sabem exatamente como atrair mais clientes.
              </p>
              <div className="final-cta-btn-row">
                <button
                  type="button"
                  className="landing-cta-primary large"
                  onClick={onStartTrial}
                >
                  <span>Criar conta e testar por 7 dias grátis</span>
                  <ArrowRight size={20} />
                </button>
              </div>
              <div className="final-cta-badges">
                <span>✓ Sem cartão de crédito</span>
                <span>✓ Conexão em menos de 2 minutos</span>
                <span>✓ Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-brand-column">
            <BrandLogo />
            <p>
              Analytics descomplicado e direto ao ponto para negócios reais.
              Entenda seus visitantes e multiplique seus contatos.
            </p>
            <small>© 2026 Analizi Tecnologia. Todos os direitos reservados. · {APP_VERSION}</small>
          </div>

          <div className="footer-links-column">
            <h4>Navegação</h4>
            <a href="#o-que-faz">O que o sistema faz</a>
            <a href="#comparativo">Comparativo GA4</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#planos">Planos e preços</a>
            <a href="#faq">Perguntas frequentes</a>
          </div>

          <div className="footer-compliance-column">
            <h4>Privacidade & Segurança</h4>
            <div className="compliance-badge">
              <ShieldCheck size={18} />
              <span>Conforme com a Lei Geral de Proteção de Dados (LGPD)</span>
            </div>
            <p>Não coletamos senhas, dados de formulários ou informações pessoais de terceiros.</p>
            <div className="footer-action">
              <button type="button" className="footer-login-link" onClick={onLogin}>
                Já é cliente? Acessar o sistema →
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
