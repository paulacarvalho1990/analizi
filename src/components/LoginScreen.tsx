import { ArrowLeft, Check, Lightbulb, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react'
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
    <div className="ls">
      {/* ─── Lado da marca ─────────────────────────────── */}
      <aside className="ls-brand">
        <div className="ls-brand-bg" aria-hidden="true" />
        <button type="button" className="ls-brand-logo" onClick={onBack} aria-label="Voltar para a página inicial">
          <BrandLogo inverse />
        </button>

        <div className="ls-brand-body">
          <h1>
            Acompanhe os principais dados do seu site.
            <span>Cresça com base em dados, sem complicação.</span>
          </h1>

          <ul className="ls-benefits">
            <li>
              <i className="b"><Users size={16} /></i>
              <div><strong>Visitas e origens</strong><span>Quantas pessoas chegam e de onde vêm: Google, Instagram ou anúncios.</span></div>
            </li>
            <li>
              <i className="p"><MessageCircle size={16} /></i>
              <div><strong>Cliques no WhatsApp</strong><span>Contados automaticamente, sem configurar nada.</span></div>
            </li>
            <li>
              <i className="o"><Lightbulb size={16} /></i>
              <div><strong>Insights semanais com IA</strong><span>Sugestões do que fazer para decidir o próximo passo.</span></div>
            </li>
          </ul>

          {/* Prévia ilustrativa do produto (sem depoimentos) */}
          <div className="ls-preview" aria-hidden="true">
            <div className="ls-preview-kpi">
              <span>Contatos iniciados</span>
              <strong>87</strong>
              <small>+24% vs. período anterior</small>
            </div>
            <div className="ls-preview-insight">
              <em><Sparkles size={12} /> Insight da semana</em>
              <p>O Instagram trouxe mais contatos que o Google. Vale manter a frequência dos posts.</p>
            </div>
          </div>
        </div>

        <small className="ls-brand-foot">Dados ilustrativos</small>
      </aside>

      {/* ─── Formulário ────────────────────────────────── */}
      <main className="ls-form-side">
        <div className="ls-top">
          <button type="button" className="ls-back" onClick={onBack}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <span className="ls-mobile-logo"><BrandLogo /></span>
        </div>

        <div className="ls-card">
          <span className="ls-pill"><span className="ls-dot" /> Teste grátis por 7 dias</span>
          <h2>Entre no Analizi</h2>
          <p className="ls-lead">Use sua conta Google para acessar o painel ou começar seu teste.</p>

          {error && <div className="ls-error" role="alert">{error}</div>}

          <button type="button" className="ls-google-btn" onClick={onGoogle} disabled={loading} aria-busy={loading}>
            {loading ? <span className="ls-spinner" aria-hidden="true" /> : <GoogleMark />}
            <span>{loading ? 'Abrindo o Google…' : 'Continuar com o Google'}</span>
          </button>

          <div className="ls-first">
            <strong>Primeira vez por aqui?</strong>
            <p>É o mesmo botão. Seu espaço é criado na hora e o teste de 7 dias começa sem cartão de crédito.</p>
          </div>

          <ul className="ls-checks">
            <li><Check size={15} /> Sem cartão de crédito</li>
            <li><Check size={15} /> Sem senha nova para lembrar</li>
            <li><ShieldCheck size={15} /> Não coletamos dados pessoais dos seus visitantes</li>
          </ul>

          <p className="ls-terms">Antes de começar, você verá os termos de uso e de privacidade para aceitar.</p>
        </div>

        <footer className="ls-foot">
          <span>© 2026 Analizi</span>
          {version && <span>{version}</span>}
        </footer>
      </main>
    </div>
  )
}
