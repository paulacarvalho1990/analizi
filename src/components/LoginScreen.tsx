import { ArrowLeft, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import './LoginScreen.css'

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="ls-google" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.805 10.023h-9.18v3.804h5.281c-.228 1.225-.914 2.264-1.944 2.962v2.494h3.145c1.841-1.695 2.903-4.188 2.903-7.153 0-.666-.06-1.307-.17-1.93z" />
      <path fill="#34A853" d="M12.625 21.5c2.625 0 4.825-.87 6.433-2.217l-3.145-2.494c-.87.584-1.985.93-3.288.93-2.532 0-4.678-1.71-5.446-4.01H3.93v2.575C5.53 19.45 8.81 21.5 12.625 21.5z" />
      <path fill="#FBBC05" d="M7.179 13.709a5.35 5.35 0 0 1 0-3.418V7.716H3.93a9.125 9.125 0 0 0 0 8.568l3.249-2.575z" />
      <path fill="#EA4335" d="M12.625 6.281c1.428 0 2.711.491 3.722 1.454l2.793-2.793C17.445 3.361 15.245 2.5 12.625 2.5 8.81 2.5 5.53 4.55 3.93 7.716l3.249 2.575c.768-2.3 2.914-4.01 5.446-4.01z" />
    </svg>
  )
}

type Props = {
  loading?: boolean
  error?: string
  onGoogle?: () => void
  onBack?: () => void
  version?: string
}

export function LoginScreen({ loading = false, error, onGoogle, onBack, version = '' }: Props) {
  return (
    <div className="ls" data-theme="light">
      <div className="ls-bg" aria-hidden="true" />

      <header className="ls-bar">
        <button type="button" className="ls-logo" onClick={onBack} aria-label="Voltar para a página inicial">
          <BrandLogo />
        </button>
        <button type="button" className="ls-back" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para o site
        </button>
      </header>

      <main className="ls-main">
        <section className="ls-copy">
          <span className="ls-pill"><span className="ls-dot" /> Teste grátis por 7 dias</span>
          <h1>
            Seu painel está a um clique.{' '}
            <span className="ls-grad">Entre com sua conta Google.</span>
          </h1>
          <p className="ls-lead">
            Visitas, origens e cliques no WhatsApp em português simples, com uma IA que sugere o próximo passo.
          </p>

          {/* Prévia ilustrativa, no mesmo estilo do mockup da LP */}
          <div className="ls-preview" aria-hidden="true">
            <div className="ls-kpi">
              <span>Usuários</span>
              <strong>1.936</strong>
              <small>+12% vs. semana anterior</small>
            </div>
            <div className="ls-kpi is-hl">
              <span>Contatos iniciados</span>
              <strong>87</strong>
              <small>+24% vs. semana anterior</small>
            </div>
            <div className="ls-insight">
              <Sparkles size={18} />
              <p><strong>Insight da semana:</strong> o Instagram trouxe mais contatos que o Google. Vale manter a frequência dos posts.</p>
            </div>
            <small className="ls-note">Dados ilustrativos</small>
          </div>
        </section>

        <section className="ls-card">
          <div>
            <h2>Entrar no Analizi</h2>
            <p className="ls-sub">Primeira vez? É o mesmo botão: seu espaço é criado na hora.</p>
          </div>

          {error && <div className="ls-error" role="alert">{error}</div>}

          <button type="button" className="ls-google-btn" onClick={onGoogle} disabled={loading} aria-busy={loading}>
            {loading ? <span className="ls-spinner" aria-hidden="true" /> : <GoogleMark />}
            <span>{loading ? 'Abrindo o Google…' : 'Continuar com o Google'}</span>
          </button>

          <ul className="ls-checks">
            <li><Check size={16} /> Sem cartão de crédito</li>
            <li><Check size={16} /> Sem senha nova para lembrar</li>
            <li><ShieldCheck size={16} /> Não coletamos dados pessoais dos visitantes</li>
          </ul>

          <p className="ls-terms">No primeiro acesso você verá os termos de uso e a política de privacidade para aceitar.</p>
        </section>
      </main>

      <footer className="ls-foot">
        <span>© 2026 Analizi</span>
        {version && <span>{version}</span>}
      </footer>
    </div>
  )
}
