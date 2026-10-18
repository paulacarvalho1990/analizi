import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { Button } from './ui/Button'
import { supabase } from '../lib/supabase'

export type AuthFlowMode = 'login' | 'consent' | 'onboarding-business' | 'onboarding-source'
type Props = { mode: AuthFlowMode; setMode: (mode: AuthFlowMode | 'app') => void }
type Segment = 'products' | 'services' | 'health'
export const CONSENT_VERSION = '2026-10-18'

const segmentOptions: Record<Segment, string[]> = {
  products: ['Moda e acessórios', 'Beleza e cosméticos', 'Alimentos e bebidas', 'Casa e decoração', 'Eletrônicos', 'Saúde e bem-estar', 'Pet shop', 'Autopeças e acessórios', 'Livros e papelaria', 'Produtos infantis', 'Outros'],
  services: ['Advocacia', 'Contabilidade', 'Arquitetura e engenharia', 'Construção e reformas', 'Tecnologia', 'Educação', 'Consultoria', 'Fotografia e eventos', 'Beleza e estética', 'Serviços automotivos', 'Outros'],
  health: ['Clínica médica', 'Odontologia', 'Psicologia', 'Fisioterapia', 'Nutrição', 'Dermatologia', 'Exames e diagnóstico', 'Bem-estar e terapias', 'Outros'],
}
const segmentLabels: Record<Segment, string> = { products: 'Produtos', services: 'Serviços', health: 'Saúde' }
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const normalizeSite = (value: string) => {
  const url = new URL(/^https?:\/\//.test(value.trim()) ? value.trim() : `https://${value.trim()}`)
  const domain = url.hostname.replace(/^www\./, '').toLowerCase()
  return { domain, url: `https://${domain}` }
}

function GoogleMark() {
  return <svg aria-hidden="true" className="google-mark" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.805 10.023h-9.18v3.804h5.281c-.228 1.225-.914 2.264-1.944 2.962v2.494h3.145c1.841-1.695 2.903-4.188 2.903-7.153 0-.666-.06-1.307-.17-1.93z"/><path fill="#34A853" d="M12.625 21.5c2.625 0 4.825-.87 6.433-2.217l-3.145-2.494c-.87.584-1.985.93-3.288.93-2.532 0-4.678-1.71-5.446-4.01H3.93v2.575C5.53 19.45 8.81 21.5 12.625 21.5z"/><path fill="#FBBC05" d="M7.179 13.709a5.35 5.35 0 0 1 0-3.418V7.716H3.93a9.125 9.125 0 0 0 0 8.568l3.249-2.575z"/><path fill="#EA4335" d="M12.625 6.281c1.428 0 2.711.491 3.722 1.454l2.793-2.793C17.445 3.361 15.245 2.5 12.625 2.5 8.81 2.5 5.53 4.55 3.93 7.716l3.249 2.575c.768-2.3 2.914-4.01 5.446-4.01z"/></svg>
}

export function AuthFlow({ mode, setMode }: Props) {
  const [userName, setUserName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [site, setSite] = useState('')
  const [creatorRole, setCreatorRole] = useState('owner_partner')
  const [segment, setSegment] = useState<Segment>('services')
  const [subsegment, setSubsegment] = useState('')
  const [otherSubsegment, setOtherSubsegment] = useState('')
  const [source, setSource] = useState<'ga4' | 'tracker'>('tracker')
  const [serviceTermsAccepted, setServiceTermsAccepted] = useState(false)
  const [dataTermsAccepted, setDataTermsAccepted] = useState(false)
  const [siteId, setSiteId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const options = useMemo(() => segmentOptions[segment], [segment])
  const isOther = subsegment === 'Outros'

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
      if (userName.trim().length < 2) throw new Error('Informe seu nome.')
      if (businessName.trim().length < 2) throw new Error('Informe o nome do seu negócio.')
      if (!subsegment) throw new Error('Escolha o tipo do seu negócio.')
      if (isOther && otherSubsegment.trim().length < 2) throw new Error('Detalhe o tipo do seu negócio.')
      const normalized = normalizeSite(site)
      setLoading(true)
      const { data: { user }, error: userError } = await supabase!.auth.getUser()
      if (userError || !user) throw new Error('Sua sessão expirou. Entre novamente com Google.')
      const businessId = crypto.randomUUID()
      const createdSiteId = crypto.randomUUID()
      const segmentDetail = isOther ? otherSubsegment.trim() : null
      const { error: profileError } = await supabase!.from('profiles').update({ full_name: userName.trim() }).eq('id', user.id)
      if (profileError) throw new Error(profileError.message)
      const { error: businessError } = await supabase!.from('businesses').insert({ id: businessId, name: businessName.trim(), slug: `${slugify(businessName)}-${Math.random().toString(36).slice(2, 7)}`, website_url: normalized.url, segment, subsegment, segment_detail: segmentDetail })
      if (businessError) throw new Error(businessError.message)
      const { error: memberError } = await supabase!.from('business_members').update({ creator_role: creatorRole }).eq('business_id', businessId).eq('user_id', user.id)
      if (memberError) throw new Error(memberError.message)
      const { error: siteError } = await supabase!.from('sites').insert({ id: createdSiteId, business_id: businessId, name: businessName.trim(), domain: normalized.domain })
      if (siteError) throw new Error(siteError.message)
      setSiteId(createdSiteId)
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
    const { error: authError } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account consent' } } })
    if (authError) { setError('Não foi possível iniciar o acesso com Google.'); setLoading(false) }
  }

  const acceptConsents = async () => {
    setError('')
    if (!serviceTermsAccepted || !dataTermsAccepted) { setError('Você precisa aceitar os dois termos para continuar.'); return }
    if (!ready()) return
    setLoading(true)
    const { data: { user }, error: userError } = await supabase!.auth.getUser()
    if (userError || !user) { setError('Sua sessão expirou. Entre novamente com Google.'); setLoading(false); return }
    const { error: consentError } = await supabase!.from('user_consents').insert([
      { user_id: user.id, consent_key: 'service_terms', version: CONSENT_VERSION, source: 'web', terms_snapshot: { title: 'Uso do Analizi', version: CONSENT_VERSION } },
      { user_id: user.id, consent_key: 'site_data_processing', version: CONSENT_VERSION, source: 'web', terms_snapshot: { title: 'Dados do site e integrações', version: CONSENT_VERSION } },
    ])
    if (consentError) setError('Não foi possível registrar seus consentimentos. Tente novamente.')
    else setMode('onboarding-business')
    setLoading(false)
  }

  const declineConsents = async () => {
    setLoading(true)
    await supabase?.auth.signOut()
    setLoading(false)
    setMode('login')
  }

  if (mode === 'login') return <div className="auth-layout"><section className="auth-pitch"><BrandLogo inverse /><div><span className="eyebrow">ANALYTICS DESCOMPLICADO</span><h1>Entenda o que acontece no seu site.</h1><p>Transformamos os números do seu site em decisões simples para o seu negócio.</p></div><div className="testimonial">“Finalmente consigo acompanhar os resultados do meu site sem precisar entender de tecnologia.”<span>— Marina, Clínica Horizonte</span></div></section><section className="auth-form"><div className="form-box"><span className="eyebrow">BEM-VINDO(A)</span><h2>Entre ou crie sua conta.</h2><p>Use sua conta Google para acessar o Analizi com segurança.</p>{error && <p className="form-feedback error">{error}</p>}<button type="button" className="google-auth-button" disabled={loading} onClick={loginWithGoogle}><GoogleMark /><span>{loading ? 'Redirecionando...' : 'Continuar com o Google'}</span></button><p className="switch">Ainda não tem uma conta? Ela será criada no seu primeiro acesso.</p></div></section></div>

  if (mode === 'consent') return <div className="onboarding consent-page"><header><BrandLogo /><span>Antes de começar</span></header><section className="onboarding-card consent-card"><span className="eyebrow">SEUS CONSENTIMENTOS</span><h1>Vamos deixar tudo claro.</h1><p>Para usar o Analizi, precisamos do seu aceite nos dois termos abaixo. Você pode recusar; nesse caso, o cadastro será encerrado.</p><article className="consent-term"><h2>1. Uso do Analizi</h2><p>O Analizi é um serviço em evolução contínua. Podemos atualizar funcionalidades, interfaces, limites, integrações, planos e preços para melhorar ou manter o serviço. Quando uma mudança impactar seu plano ou cobrança, ela será comunicada antes de produzir efeito, conforme as condições aplicáveis.</p><p>As análises são apoio à decisão: não garantem resultados comerciais, disponibilidade ininterrupta ou compatibilidade permanente com serviços de terceiros.</p><label className="consent-check"><input type="checkbox" checked={serviceTermsAccepted} onChange={(event) => setServiceTermsAccepted(event.target.checked)} /> <span>Li e aceito os termos de uso do Analizi — versão {CONSENT_VERSION}.</span></label></article><article className="consent-term"><h2>2. Dados do site e integrações</h2><p>Você autoriza o Analizi a coletar, receber, organizar e armazenar métricas do site vinculado, necessárias para gerar relatórios e insights. Esses dados ficam armazenados em nossa infraestrutura enquanto sua conta estiver ativa ou pelo período exigido por lei.</p><p>Ao conectar o Google Analytics 4, você autoriza acesso somente de leitura aos dados permitidos. Ao instalar o Rastreador Analizi, você declara ter autorização para inserir o código no site e para tratar os dados de navegação conforme a LGPD e seus próprios avisos de privacidade.</p><p>Você declara ter poderes para vincular o negócio e acessar informações privadas e inteligência de negócio nele contidas. O Analizi não deve coletar conteúdo de formulários, senhas, e-mails ou telefones pelo rastreador.</p><label className="consent-check"><input type="checkbox" checked={dataTermsAccepted} onChange={(event) => setDataTermsAccepted(event.target.checked)} /> <span>Li e aceito o tratamento e armazenamento dos dados do site — versão {CONSENT_VERSION}.</span></label></article>{error && <p className="form-feedback error">{error}</p>}<div className="onboarding-actions"><Button type="button" variant="ghost" disabled={loading} onClick={declineConsents}>Não aceito</Button><Button type="button" disabled={loading || !serviceTermsAccepted || !dataTermsAccepted} onClick={acceptConsents}>{loading ? 'Registrando...' : 'Aceitar e continuar'}<ArrowRight size={18} /></Button></div><small className="consent-note">O aceite é registrado com a sua conta, a versão dos termos e data/hora.</small></section></div>

  if (mode === 'onboarding-business') return <div className="onboarding"><header><BrandLogo /><span>Passo 1 de 2</span></header><div className="steps"><i className="done" /> <i /></div><form className="onboarding-card onboarding-details" onSubmit={submitBusiness}><span className="eyebrow">VAMOS COMEÇAR</span><h1>Conte um pouco sobre você e seu negócio.</h1><p>Usaremos essas informações para deixar suas análises mais úteis para o seu tipo de site.</p><div className="two-fields"><label>Seu nome<input required value={userName} onChange={(event) => setUserName(event.target.value)} placeholder="Ex.: Paula Carvalho" autoComplete="name" /></label><label>Nome do negócio<input required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Ex.: Clínica Horizonte" /></label></div><div className="two-fields"><label>Endereço do site<input required value={site} onChange={(event) => setSite(event.target.value)} placeholder="seusite.com.br" inputMode="url" /><small>Vamos salvar apenas o domínio, sem páginas ou caminhos.</small></label><label>Sua função no negócio<select value={creatorRole} onChange={(event) => setCreatorRole(event.target.value)}><option value="owner_partner">Proprietário(a) ou sócio(a)</option><option value="developer">Desenvolvedor(a)</option><option value="employee">Funcionário(a)</option><option value="other">Outra função</option></select></label></div><div className="two-fields"><label>Segmento do negócio<select value={segment} onChange={(event) => { setSegment(event.target.value as Segment); setSubsegment(''); setOtherSubsegment('') }}><option value="products">Produtos</option><option value="services">Serviços</option><option value="health">Saúde</option></select></label><label>Tipo de {segmentLabels[segment].toLowerCase()}<select required value={subsegment} onChange={(event) => { setSubsegment(event.target.value); setOtherSubsegment('') }}><option value="" disabled>Selecione uma opção</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label></div>{isOther && <label>Descreva o tipo do negócio<input required value={otherSubsegment} onChange={(event) => setOtherSubsegment(event.target.value)} placeholder="Ex.: Equipamentos para agricultura" /></label>}{error && <p className="form-feedback error">{error}</p>}<div className="onboarding-actions"><span /><Button disabled={loading}>{loading ? 'Salvando...' : 'Continuar'}<ArrowRight size={18} /></Button></div></form></div>

  return <div className="onboarding"><header><BrandLogo /><span>Passo 2 de 2</span></header><div className="steps"><i className="done" /> <i className="done" /></div><section className="onboarding-card"><span className="eyebrow">CONECTE SEUS DADOS</span><h1>De onde vamos trazer os dados?</h1><p>Escolha a opção mais simples para você. Você poderá alterar isso depois.</p><button type="button" className={`source-card ${source === 'ga4' ? 'selected' : ''}`} onClick={() => setSource('ga4')}><span className="source-icon ga">G</span><span><b>Conectar Google Analytics</b><small>Use os dados que você já acompanha no Google.</small></span>{source === 'ga4' && <Check size={20} />}</button><button type="button" className={`source-card ${source === 'tracker' ? 'selected' : ''}`} onClick={() => setSource('tracker')}><span className="source-icon"><BrandLogo compact /></span><span><b>Usar o rastreador Analizi</b><small>Instale um código simples no seu site.</small></span>{source === 'tracker' && <Check size={20} />}</button>{error && <p className="form-feedback error">{error}</p>}<div className="onboarding-actions"><Button variant="ghost" onClick={() => setMode('onboarding-business')}>Voltar</Button><Button onClick={finishSource} disabled={loading}>{loading ? 'Salvando...' : 'Continuar'}<ArrowRight size={18} /></Button></div></section></div>
}
