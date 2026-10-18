import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { Button } from './ui/Button'
import { supabase } from '../lib/supabase'

export type AuthFlowMode = 'login' | 'onboarding-business' | 'onboarding-source'
type Props = { mode: AuthFlowMode; setMode: (mode: AuthFlowMode | 'app') => void }

const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const normalizeSite = (value: string) => {
  const url = new URL(/^https?:\/\//.test(value.trim()) ? value.trim() : `https://${value.trim()}`)
  return { domain: url.hostname.replace(/^www\./, '').toLowerCase(), url: `https://${url.hostname}` }
}

export function AuthFlow({ mode, setMode }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [site, setSite] = useState('')
  const [segment, setSegment] = useState('Saúde')
  const [source, setSource] = useState<'ga4' | 'tracker'>('tracker')
  const [siteId, setSiteId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ready = () => {
    if (supabase) return true
    setError('A conexão com o Supabase ainda não foi configurada neste ambiente.')
    return false
  }

  const submitBusiness = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!ready()) return
    try {
      if (businessName.trim().length < 2) throw new Error('Informe o nome do seu negócio.')
      const normalized = normalizeSite(site)
      setLoading(true)
      const { data: business, error: businessError } = await supabase!.from('businesses').insert({ name: businessName.trim(), slug: `${slugify(businessName)}-${Math.random().toString(36).slice(2, 7)}`, website_url: normalized.url, segment }).select('id').single()
      if (businessError || !business) throw businessError || new Error('Não foi possível criar o negócio.')
      const { data: createdSite, error: siteError } = await supabase!.from('sites').insert({ business_id: business.id, name: businessName.trim(), domain: normalized.domain }).select('id').single()
      if (siteError || !createdSite) throw siteError || new Error('Não foi possível cadastrar o site.')
      setSiteId(createdSite.id)
      setMode('onboarding-source')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar seus dados.')
    } finally {
      setLoading(false)
    }
  }

  const finishSource = async () => {
    setError('')
    if (!ready()) return
    if (!siteId) { setMode('onboarding-business'); return }
    setLoading(true)
    const { error: sourceError } = await supabase!.from('data_sources').insert({ site_id: siteId, kind: source })
    if (sourceError) setError('Não foi possível salvar sua fonte de dados. Tente novamente.')
    else setMode('app')
    setLoading(false)
  }

  const loginWithGoogle = async () => {
    setError('')
    if (!ready()) return
    setLoading(true)
    const { error: authError } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (authError) {
      setError('Não foi possível iniciar o acesso com Google.')
      setLoading(false)
    }
  }

  if (mode === 'login') return <div className="auth-layout"><section className="auth-pitch"><BrandLogo inverse /><div><span className="eyebrow">ANALYTICS DESCOMPLICADO</span><h1>Entenda o que acontece no seu site.</h1><p>Transformamos os números do seu site em decisões simples para o seu negócio.</p></div><div className="testimonial">“Finalmente consigo acompanhar os resultados do meu site sem precisar entender de tecnologia.”<span>— Marina, Clínica Horizonte</span></div></section><section className="auth-form"><div className="form-box"><span className="eyebrow">BEM-VINDO(A)</span><h2>Entre ou crie sua conta.</h2><p>Use sua conta Google para acessar o Analizi com segurança.</p>{error && <p className="form-feedback error">{error}</p>}<Button type="button" variant="secondary" className="full" disabled={loading} onClick={loginWithGoogle}>{loading ? 'Redirecionando...' : 'Continuar com Google'} <ExternalLink size={16}/></Button><p className="switch">Ainda não tem uma conta? Ela será criada no seu primeiro acesso.</p></div></section></div>

  if (mode === 'onboarding-business') return <div className="onboarding"><header><BrandLogo /><span>Passo 1 de 2</span></header><div className="steps"><i className="done" /> <i /></div><form className="onboarding-card" onSubmit={submitBusiness}><span className="eyebrow">VAMOS COMEÇAR</span><h1>Conte um pouco sobre seu negócio.</h1><p>Assim podemos explicar seus resultados de um jeito que faça sentido para você.</p><div className="two-fields"><label>Nome do negócio<input required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Ex.: Clínica Horizonte" /></label><label>Site<input required value={site} onChange={(event) => setSite(event.target.value)} placeholder="www.seusite.com.br" /></label></div><label>Seu segmento<select value={segment} onChange={(event) => setSegment(event.target.value)}><option>Saúde</option><option>Serviços</option><option>Comércio</option><option>Outro</option></select></label>{error && <p className="form-feedback error">{error}</p>}<div className="onboarding-actions"><span /><Button disabled={loading}>{loading ? 'Salvando...' : 'Continuar'}<ArrowRight size={18} /></Button></div></form></div>

  return <div className="onboarding"><header><BrandLogo /><span>Passo 2 de 2</span></header><div className="steps"><i className="done" /> <i className="done" /></div><section className="onboarding-card"><span className="eyebrow">CONECTE SEUS DADOS</span><h1>De onde vamos trazer os dados?</h1><p>Escolha a opção mais simples para você. Você poderá alterar isso depois.</p><button type="button" className={`source-card ${source === 'ga4' ? 'selected' : ''}`} onClick={() => setSource('ga4')}><span className="source-icon ga">G</span><span><b>Conectar Google Analytics</b><small>Use os dados que você já acompanha no Google.</small></span>{source === 'ga4' && <Check size={20} />}</button><button type="button" className={`source-card ${source === 'tracker' ? 'selected' : ''}`} onClick={() => setSource('tracker')}><span className="source-icon"><BrandLogo compact /></span><span><b>Usar o rastreador Analizi</b><small>Instale um código simples no seu site.</small></span>{source === 'tracker' && <Check size={20} />}</button>{error && <p className="form-feedback error">{error}</p>}<div className="onboarding-actions"><Button variant="ghost" onClick={() => setMode('onboarding-business')}>Voltar</Button><Button onClick={finishSource} disabled={loading}>{loading ? 'Salvando...' : 'Continuar'}<ArrowRight size={18} /></Button></div></section></div>
}
