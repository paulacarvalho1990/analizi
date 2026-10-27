import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from './supabase'

export type PlanTier = 'essential' | 'growth' | 'admin'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export interface PlanMetadata {
  id: PlanTier
  name: string
  priceLabel: string
  maxSites: number
  maxSitesLabel: string
  allFeaturesUnlocked: boolean
  description: string
  features: string[]
}

export const PLAN_DEFINITIONS: Record<PlanTier, PlanMetadata> = {
  essential: {
    id: 'essential',
    name: 'Plano Essencial',
    priceLabel: 'R$ 39,90/mês',
    maxSites: 1,
    maxSitesLabel: '1 site',
    allFeaturesUnlocked: false,
    description: 'Para acompanhar 1 site com clareza.',
    features: [
      '1 site conectado',
      'Painel completo e relatório semanal',
      'Google Analytics ou Rastreador Analizi',
      'Insights semanais de IA'
    ]
  },
  growth: {
    id: 'growth',
    name: 'Plano Crescimento',
    priceLabel: 'R$ 79,00/mês',
    maxSites: 2,
    maxSitesLabel: 'Até 2 sites',
    allFeaturesUnlocked: true,
    description: 'Para acompanhar até 2 sites e mais movimento.',
    features: [
      'Até 2 sites conectados',
      'Painel completo e relatório semanal',
      'Heatmap visual e profundidade de rolagem',
      'Exportação de dados e gestão de equipe'
    ]
  },
  admin: {
    id: 'admin',
    name: 'Plano Admin',
    priceLabel: 'Ilimitado · Acesso Total',
    maxSites: 999999,
    maxSitesLabel: 'Ilimitados (N sites)',
    allFeaturesUnlocked: true,
    description: 'Acesso administrativo completo sem limite de sites e com todas as funções liberadas.',
    features: [
      'Sites ilimitados (N sites)',
      'Todas as funções e recursos liberados',
      'Gestão completa de permissões e acessos',
      'Heatmap visual, IA e relatórios sem restrições'
    ]
  }
}

export function normalizePlanTier(raw?: string | null): PlanTier {
  if (raw === 'admin') return 'admin'
  if (raw === 'growth') return 'growth'
  return 'essential'
}

export interface BusinessItem {
  id: string
  owner_id?: string
  name: string
  slug: string
  website_url?: string | null
  segment?: string | null
  subsegment?: string | null
  segment_detail?: string | null
  plan?: PlanTier
  subscription_status?: SubscriptionStatus
  subscription_expires_at?: string | null
}

export interface SiteItem {
  id: string
  business_id: string
  name: string
  domain: string
  tracker_site_id: string
  is_active: boolean
}

export interface UserProfilePlan {
  id: string
  full_name?: string | null
  email?: string | null
  plan: PlanTier
  subscription_status: SubscriptionStatus
  subscription_expires_at: string | null
}

export interface BusinessContextValue {
  businesses: BusinessItem[]
  currentBusiness: BusinessItem | null
  sites: SiteItem[]
  currentBusinessSites: SiteItem[]
  currentSite: SiteItem | null
  userProfile: UserProfilePlan | null
  effectivePlan: PlanMetadata
  subscriptionStatus: SubscriptionStatus
  subscriptionExpiresAt: string | null
  canAddMoreSites: boolean
  totalSitesCount: number
  isNewSiteModalOpen: boolean
  setNewSiteModalOpen: (open: boolean) => void
  createNewSite: (input: { name: string; domain: string; segment?: string; subsegment?: string | null; segment_detail?: string | null }) => Promise<{ site: SiteItem; business: BusinessItem }>
  loading: boolean
  selectBusiness: (businessId: string) => void
  selectSite: (siteId: string) => void
  refreshBusinesses: () => Promise<void>
}

const DEMO_BUSINESSES: BusinessItem[] = [
  {
    id: 'biz-analizi',
    name: 'Analizi Demo',
    slug: 'analizi-demo',
    website_url: 'analizi.carvalhopaula1990.workers.dev',
    segment: 'Tecnologia',
    plan: 'admin',
    subscription_status: 'active',
    subscription_expires_at: '2099-12-31T23:59:59Z'
  },
  {
    id: 'biz-magia-tarot',
    name: 'Magia Tarot',
    slug: 'magia-tarot',
    website_url: 'magia.mih-tarot.workers.dev',
    segment: 'Serviços',
    plan: 'admin',
    subscription_status: 'active',
    subscription_expires_at: '2099-12-31T23:59:59Z'
  }
]

const DEMO_SITES: SiteItem[] = [
  {
    id: 'site-analizi',
    business_id: 'biz-analizi',
    name: 'Analizi Demo',
    domain: 'analizi.carvalhopaula1990.workers.dev',
    tracker_site_id: 'ANLZ4A484-A',
    is_active: true
  },
  {
    id: 'site-magia-tarot',
    business_id: 'biz-magia-tarot',
    name: 'Magia Tarot',
    domain: 'magia.mih-tarot.workers.dev',
    tracker_site_id: 'ANLZ104D5-A',
    is_active: true
  }
]

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const normalizeSiteDomain = (value: string) => {
  const clean = value.trim()
  const url = new URL(/^https?:\/\//.test(clean) ? clean : `https://${clean}`)
  const domain = url.hostname.replace(/^www\./, '').toLowerCase()
  if (!domain || !domain.includes('.')) {
    throw new Error('Informe um domínio válido (ex: meusite.com.br).')
  }
  return { domain, url: `https://${domain}` }
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([])
  const [sites, setSites] = useState<SiteItem[]>([])
  const [currentBusiness, setCurrentBusiness] = useState<BusinessItem | null>(null)
  const [currentSite, setCurrentSite] = useState<SiteItem | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfilePlan | null>(null)
  const [isNewSiteModalOpen, setNewSiteModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Processa eventuais convites pendentes para o e-mail do usuário logado
          if (user.email) {
            try {
              await supabase.rpc('accept_pending_invitations_for_user', {
                p_user_id: user.id,
                p_email: user.email
              })
            } catch {
              // Ignora caso a RPC ainda não esteja disponível
            }
          }

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, email, plan, subscription_status, subscription_expires_at')
            .eq('id', user.id)
            .maybeSingle()

          if (profileData) {
            setUserProfile({
              id: profileData.id,
              full_name: profileData.full_name,
              email: profileData.email || user.email,
              plan: normalizePlanTier(profileData.plan),
              subscription_status: (profileData.subscription_status as SubscriptionStatus) || 'active',
              subscription_expires_at: profileData.subscription_expires_at || null
            })
          }
        }

        // Busca todos os businesses aos quais o usuário tem acesso (RLS ativa)
        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .select('id, owner_id, name, slug, website_url, segment, subsegment, segment_detail, plan, subscription_status, subscription_expires_at')
          .order('name', { ascending: true })

        if (!bizError && bizData && bizData.length > 0) {
          const normalizedBusinesses: BusinessItem[] = bizData.map((b) => ({
            ...b,
            plan: normalizePlanTier(b.plan),
            subscription_status: (b.subscription_status as SubscriptionStatus) || 'active',
            subscription_expires_at: b.subscription_expires_at || null
          }))
          setBusinesses(normalizedBusinesses)

          // Busca todos os sites vinculados a esses businesses
          const bizIds = normalizedBusinesses.map(b => b.id)
          const { data: sitesData, error: sitesError } = await supabase
            .from('sites')
            .select('id, business_id, name, domain, tracker_site_id, is_active')
            .in('business_id', bizIds)
            .order('name', { ascending: true })

          const loadedSites = (!sitesError && sitesData) ? (sitesData as SiteItem[]) : []
          setSites(loadedSites)

          // Restaura business selecionado ou seleciona o primeiro
          const savedBizId = localStorage.getItem('analizi-selected-business-id')
          const activeBiz = normalizedBusinesses.find(b => b.id === savedBizId) || normalizedBusinesses[0]
          setCurrentBusiness(activeBiz)
          localStorage.setItem('analizi-selected-business-id', activeBiz.id)

          // Restaura site selecionado para esse business
          const bizSites = loadedSites.filter(s => s.business_id === activeBiz.id)
          const savedSiteId = localStorage.getItem('analizi-selected-site-id')
          const activeSite = bizSites.find(s => s.id === savedSiteId) || bizSites[0] || {
            id: `site-${activeBiz.id}`,
            business_id: activeBiz.id,
            name: activeBiz.name,
            domain: activeBiz.website_url || 'seu-site.com.br',
            tracker_site_id: '',
            is_active: true
          }
          setCurrentSite(activeSite)
          localStorage.setItem('analizi-selected-site-id', activeSite.id)
          return
        }
      }

      // Fallback para modo demo / sem supabase
      let customBusinesses: BusinessItem[] = []
      let customSites: SiteItem[] = []
      try {
        const savedBiz = localStorage.getItem('analizi-custom-businesses')
        if (savedBiz) customBusinesses = JSON.parse(savedBiz)
        const savedS = localStorage.getItem('analizi-custom-sites')
        if (savedS) customSites = JSON.parse(savedS)
      } catch {}

      // Busca sites reais da API Cloudflare D1
      let d1Sites: SiteItem[] = []
      try {
        const d1Res = await fetch('https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites')
        if (d1Res.ok) {
          const d1Data = await d1Res.json() as { sites?: Array<{ tracker_site_id: string; domain: string; is_active: number; plan: string }> }
          if (d1Data?.sites) {
            d1Sites = d1Data.sites.map(s => {
              const cleanHost = s.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
              const siteTitle = cleanHost.split('.')[0]
              const formattedName = siteTitle.charAt(0).toUpperCase() + siteTitle.slice(1)
              return {
                id: `site-${s.tracker_site_id}`,
                business_id: `biz-${s.tracker_site_id}`,
                name: formattedName,
                domain: s.domain,
                tracker_site_id: s.tracker_site_id,
                is_active: Boolean(s.is_active)
              }
            })
          }
        }
      } catch {}

      const allBusinessesMap = new Map<string, BusinessItem>()
      DEMO_BUSINESSES.forEach(b => allBusinessesMap.set(b.id, b))
      customBusinesses.forEach(b => allBusinessesMap.set(b.id, b))
      d1Sites.forEach(s => {
        if (!allBusinessesMap.has(s.business_id)) {
          allBusinessesMap.set(s.business_id, {
            id: s.business_id,
            name: s.name,
            slug: slugify(s.name),
            website_url: s.domain,
            segment: 'Serviços',
            plan: 'admin',
            subscription_status: 'active',
            subscription_expires_at: '2099-12-31T23:59:59Z'
          })
        }
      })

      const allSitesMap = new Map<string, SiteItem>()
      DEMO_SITES.forEach(s => allSitesMap.set(s.id, s))
      customSites.forEach(s => allSitesMap.set(s.id, s))
      d1Sites.forEach(s => allSitesMap.set(s.id, s))

      const mergedBusinesses = Array.from(allBusinessesMap.values())
      const mergedSites = Array.from(allSitesMap.values())

      setBusinesses(mergedBusinesses)
      setSites(mergedSites)

      const savedBizId = localStorage.getItem('analizi-selected-business-id')
      const activeBiz = mergedBusinesses.find(b => b.id === savedBizId) || mergedBusinesses[0]
      setCurrentBusiness(activeBiz)

      const bizSites = mergedSites.filter(s => s.business_id === activeBiz.id)
      const savedSiteId = localStorage.getItem('analizi-selected-site-id')
      const activeSite = bizSites.find(s => s.id === savedSiteId) || bizSites[0] || mergedSites[0]
      setCurrentSite(activeSite)
    } catch (err) {
      console.error('Falha ao carregar negócios e sites:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshBusinesses()
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        void refreshBusinesses()
      })
      return () => subscription.unsubscribe()
    }
  }, [refreshBusinesses])

  const selectBusiness = useCallback((businessId: string) => {
    const biz = businesses.find(b => b.id === businessId)
    if (!biz) return
    setCurrentBusiness(biz)
    localStorage.setItem('analizi-selected-business-id', biz.id)

    // Seleciona o primeiro site disponível para este business
    const bizSites = sites.filter(s => s.business_id === biz.id)
    if (bizSites.length > 0) {
      setCurrentSite(bizSites[0])
      localStorage.setItem('analizi-selected-site-id', bizSites[0].id)
    } else {
      const fallbackSite: SiteItem = {
        id: `site-${biz.id}`,
        business_id: biz.id,
        name: biz.name,
        domain: biz.website_url || 'seu-site.com.br',
        tracker_site_id: '',
        is_active: true
      }
      setCurrentSite(fallbackSite)
      localStorage.setItem('analizi-selected-site-id', fallbackSite.id)
    }
  }, [businesses, sites])

  const selectSite = useCallback((siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    if (!site) return
    setCurrentSite(site)
    localStorage.setItem('analizi-selected-site-id', site.id)

    // Sincroniza o business caso o site seja de outro business
    const biz = businesses.find(b => b.id === site.business_id)
    if (biz && biz.id !== currentBusiness?.id) {
      setCurrentBusiness(biz)
      localStorage.setItem('analizi-selected-business-id', biz.id)
    }
  }, [sites, businesses, currentBusiness])

  const currentBusinessSites = useMemo(() => {
    if (!currentBusiness) return []
    return sites.filter(s => s.business_id === currentBusiness.id)
  }, [sites, currentBusiness])

  // Plano efetivo: se o usuário ou o negócio atual for admin, prevalece admin; caso contrário o maior entre usuário e negócio
  const effectivePlan = useMemo<PlanMetadata>(() => {
    const uPlan = userProfile?.plan || 'essential'
    const bPlan = currentBusiness?.plan || 'essential'
    if (uPlan === 'admin' || bPlan === 'admin') return PLAN_DEFINITIONS.admin
    if (uPlan === 'growth' || bPlan === 'growth') return PLAN_DEFINITIONS.growth
    return PLAN_DEFINITIONS.essential
  }, [userProfile, currentBusiness])

  const subscriptionStatus = useMemo<SubscriptionStatus>(() => {
    return currentBusiness?.subscription_status || userProfile?.subscription_status || 'active'
  }, [currentBusiness, userProfile])

  const subscriptionExpiresAt = useMemo<string | null>(() => {
    return currentBusiness?.subscription_expires_at || userProfile?.subscription_expires_at || null
  }, [currentBusiness, userProfile])

  const totalSitesCount = useMemo(() => {
    return Math.max(sites.length, businesses.length)
  }, [sites, businesses])

  const canAddMoreSites = useMemo(() => {
    if (effectivePlan.id === 'admin') return true
    return totalSitesCount < effectivePlan.maxSites
  }, [effectivePlan, totalSitesCount])

  const createNewSite = useCallback(async (input: { name: string; domain: string; segment?: string; subsegment?: string | null; segment_detail?: string | null }) => {
    if (!canAddMoreSites) {
      throw new Error(`Seu ${effectivePlan.name} permite até ${effectivePlan.maxSitesLabel}. Faça upgrade para adicionar mais sites.`)
    }
    const siteName = input.name.trim()
    if (siteName.length < 2) {
      throw new Error('Informe o nome do site (mínimo de 2 caracteres).')
    }
    const normalized = normalizeSiteDomain(input.domain)
    const resolvedSegment = input.segment || currentBusiness?.segment || 'services'
    const resolvedSubsegment = input.subsegment?.trim() || null
    const resolvedDetail = input.segment_detail?.trim() || null

    const createLocalFallbackSite = () => {
      const businessId = crypto.randomUUID()
      const createdSiteId = crypto.randomUUID()
      const slug = `${slugify(siteName) || 'site'}-${Math.random().toString(36).slice(2, 7)}`
      const randomCode = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5).padEnd(5, 'X')
      const trackerSiteId = `ANLZ${randomCode}-A`

      const fallbackBiz: BusinessItem = {
        id: businessId,
        name: siteName,
        slug,
        website_url: normalized.url,
        segment: resolvedSegment,
        subsegment: resolvedSubsegment,
        segment_detail: resolvedDetail,
        plan: effectivePlan.id,
        subscription_status: subscriptionStatus,
        subscription_expires_at: subscriptionExpiresAt || new Date(Date.now() + 30 * 86400000).toISOString()
      }

      const fallbackSite: SiteItem = {
        id: createdSiteId,
        business_id: businessId,
        name: siteName,
        domain: normalized.domain,
        tracker_site_id: trackerSiteId,
        is_active: true
      }

      setBusinesses(prev => [...prev, fallbackBiz])
      setSites(prev => [...prev, fallbackSite])
      setCurrentBusiness(fallbackBiz)
      setCurrentSite(fallbackSite)
      localStorage.setItem('analizi-selected-business-id', fallbackBiz.id)
      localStorage.setItem('analizi-selected-site-id', fallbackSite.id)

      try {
        const prevB = JSON.parse(localStorage.getItem('analizi-custom-businesses') || '[]')
        localStorage.setItem('analizi-custom-businesses', JSON.stringify([...prevB, fallbackBiz]))
        const prevS = JSON.parse(localStorage.getItem('analizi-custom-sites') || '[]')
        localStorage.setItem('analizi-custom-sites', JSON.stringify([...prevS, fallbackSite]))
      } catch {}

      void fetch('https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trackerSiteId: fallbackSite.tracker_site_id,
          domain: fallbackSite.domain,
          supabaseSiteId: fallbackSite.id,
          businessId: fallbackBiz.id,
          plan: effectivePlan.id
        })
      }).catch(() => {})

      return { site: fallbackSite, business: fallbackBiz }
    }

    if (!supabase) {
      return createLocalFallbackSite()
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      // Se estiver em modo demonstração sem sessão ativa, permite criar localmente
      if (businesses.some(b => b.id.startsWith('biz-'))) {
        return createLocalFallbackSite()
      }
      throw new Error('Sua sessão expirou. Faça login novamente.')
    }

    const businessId = crypto.randomUUID()
    const createdSiteId = crypto.randomUUID()
    const slug = `${slugify(siteName) || 'site'}-${Math.random().toString(36).slice(2, 7)}`

    // Cria um novo registro de business e site para manter o isolamento completo de equipe e permissões por site
    const { data: createdBiz, error: bizErr } = await supabase
      .rpc('create_business_for_current_user', {
        p_business_id: businessId,
        p_name: siteName,
        p_slug: slug,
        p_website_url: normalized.url,
        p_segment: resolvedSegment,
        p_subsegment: resolvedSubsegment,
        p_segment_detail: resolvedDetail,
        p_plan: effectivePlan.id,
        p_subscription_status: subscriptionStatus,
        p_subscription_expires_at: subscriptionExpiresAt || new Date(Date.now() + 30 * 86400000).toISOString()
      })
      .single()

    if (bizErr || !createdBiz) {
      throw new Error(bizErr?.message || 'Não foi possível criar o novo site.')
    }
    const createdBusiness = createdBiz as BusinessItem

    const { data: createdSite, error: siteErr } = await supabase
      .from('sites')
      .insert({
        id: createdSiteId,
        business_id: businessId,
        name: siteName,
        domain: normalized.domain
      })
      .select('id, business_id, name, domain, tracker_site_id, is_active')
      .single()

    if (siteErr || !createdSite) {
      throw new Error(siteErr?.message || 'Não foi possível registrar o domínio do site.')
    }

    // Cria a fonte de dados padrão (tracker) e provisiona no D1 do Worker
    try {
      await supabase.rpc('create_data_source', { p_site_id: createdSite.id, p_kind: 'tracker' })
    } catch {
      // ignora falha secundária
    }

    try {
      await fetch('/v1/tracker-sites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trackerSiteId: createdSite.tracker_site_id,
          domain: createdSite.domain,
          supabaseSiteId: createdSite.id,
          businessId: createdBusiness.id,
          plan: effectivePlan.id
        })
      })
    } catch {
      // ignora falha de rede
    }

    const normalizedBiz: BusinessItem = {
      ...createdBusiness,
      plan: normalizePlanTier(createdBusiness.plan),
      subscription_status: (createdBusiness.subscription_status as SubscriptionStatus) || 'active'
    }
    const typedSite = createdSite as SiteItem

    // Atualiza o estado imediatamente para evitar race condition antes do refreshBusinesses
    setBusinesses(prev => [...prev.filter(b => b.id !== normalizedBiz.id), normalizedBiz])
    setSites(prev => [...prev.filter(s => s.id !== typedSite.id), typedSite])
    setCurrentBusiness(normalizedBiz)
    setCurrentSite(typedSite)

    localStorage.setItem('analizi-selected-business-id', createdBusiness.id)
    localStorage.setItem('analizi-selected-site-id', createdSite.id)
    await refreshBusinesses()

    return {
      site: typedSite,
      business: normalizedBiz
    }
  }, [canAddMoreSites, effectivePlan, currentBusiness, businesses, subscriptionStatus, subscriptionExpiresAt, refreshBusinesses])

  const value = useMemo<BusinessContextValue>(() => ({
    businesses,
    currentBusiness,
    sites,
    currentBusinessSites,
    currentSite,
    userProfile,
    effectivePlan,
    subscriptionStatus,
    subscriptionExpiresAt,
    canAddMoreSites,
    totalSitesCount,
    isNewSiteModalOpen,
    setNewSiteModalOpen,
    createNewSite,
    loading,
    selectBusiness,
    selectSite,
    refreshBusinesses
  }), [
    businesses,
    currentBusiness,
    sites,
    currentBusinessSites,
    currentSite,
    userProfile,
    effectivePlan,
    subscriptionStatus,
    subscriptionExpiresAt,
    canAddMoreSites,
    totalSitesCount,
    isNewSiteModalOpen,
    createNewSite,
    loading,
    selectBusiness,
    selectSite,
    refreshBusinesses
  ])

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) {
    throw new Error('useBusiness deve ser usado dentro de BusinessProvider')
  }
  return ctx
}
