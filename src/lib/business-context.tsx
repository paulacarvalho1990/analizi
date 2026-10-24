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
  createNewSite: (input: { name: string; domain: string; segment?: string }) => Promise<{ site: SiteItem; business: BusinessItem }>
  loading: boolean
  selectBusiness: (businessId: string) => void
  selectSite: (siteId: string) => void
  refreshBusinesses: () => Promise<void>
}

const DEMO_BUSINESSES: BusinessItem[] = [
  {
    id: 'biz-clinica-horizonte',
    name: 'Clínica Horizonte',
    slug: 'clinica-horizonte',
    website_url: 'www.clinicahorizonte.com.br',
    segment: 'Saúde',
    plan: 'admin',
    subscription_status: 'active',
    subscription_expires_at: '2099-12-31T23:59:59Z'
  },
  {
    id: 'biz-horizonte-odonto',
    name: 'Horizonte Odonto',
    slug: 'horizonte-odonto',
    website_url: 'www.horizonteodonto.com.br',
    segment: 'Saúde',
    plan: 'admin',
    subscription_status: 'active',
    subscription_expires_at: '2099-12-31T23:59:59Z'
  }
]

const DEMO_SITES: SiteItem[] = [
  {
    id: 'site-clinica-horizonte',
    business_id: 'biz-clinica-horizonte',
    name: 'Clínica Horizonte',
    domain: 'www.clinicahorizonte.com.br',
    tracker_site_id: 'ANLZ00001-A',
    is_active: true
  },
  {
    id: 'site-horizonte-odonto',
    business_id: 'biz-horizonte-odonto',
    name: 'Horizonte Odonto',
    domain: 'www.horizonteodonto.com.br',
    tracker_site_id: 'ANLZ00002-A',
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
      setBusinesses(DEMO_BUSINESSES)
      setSites(DEMO_SITES)

      const savedBizId = localStorage.getItem('analizi-selected-business-id')
      const activeBiz = DEMO_BUSINESSES.find(b => b.id === savedBizId) || DEMO_BUSINESSES[0]
      setCurrentBusiness(activeBiz)

      const bizSites = DEMO_SITES.filter(s => s.business_id === activeBiz.id)
      const savedSiteId = localStorage.getItem('analizi-selected-site-id')
      const activeSite = bizSites.find(s => s.id === savedSiteId) || bizSites[0] || DEMO_SITES[0]
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

  const createNewSite = useCallback(async (input: { name: string; domain: string; segment?: string }) => {
    if (!canAddMoreSites) {
      throw new Error(`Seu ${effectivePlan.name} permite até ${effectivePlan.maxSitesLabel}. Faça upgrade para adicionar mais sites.`)
    }
    const siteName = input.name.trim()
    if (siteName.length < 2) {
      throw new Error('Informe o nome do site (mínimo de 2 caracteres).')
    }
    const normalized = normalizeSiteDomain(input.domain)

    if (!supabase) {
      throw new Error('Conexão com o banco de dados não disponível.')
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      throw new Error('Sua sessão expirou. Faça login novamente.')
    }

    const businessId = crypto.randomUUID()
    const createdSiteId = crypto.randomUUID()
    const slug = `${slugify(siteName) || 'site'}-${Math.random().toString(36).slice(2, 7)}`

    // Cria um novo registro de business e site para manter o isolamento completo de equipe e permissões por site
    const { data: createdBiz, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        id: businessId,
        name: siteName,
        slug,
        website_url: normalized.url,
        segment: input.segment || currentBusiness?.segment || 'services',
        plan: effectivePlan.id,
        subscription_status: subscriptionStatus,
        subscription_expires_at: subscriptionExpiresAt || new Date(Date.now() + 30 * 86400000).toISOString()
      })
      .select('id, owner_id, name, slug, website_url, segment, subsegment, segment_detail, plan, subscription_status, subscription_expires_at')
      .single()

    if (bizErr || !createdBiz) {
      throw new Error(bizErr?.message || 'Não foi possível criar o novo site.')
    }

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
          businessId: createdBiz.id,
          plan: effectivePlan.id
        })
      })
    } catch {
      // ignora falha de rede
    }

    localStorage.setItem('analizi-selected-business-id', createdBiz.id)
    localStorage.setItem('analizi-selected-site-id', createdSite.id)
    await refreshBusinesses()

    return {
      site: createdSite as SiteItem,
      business: {
        ...createdBiz,
        plan: normalizePlanTier(createdBiz.plan),
        subscription_status: (createdBiz.subscription_status as SubscriptionStatus) || 'active'
      } as BusinessItem
    }
  }, [canAddMoreSites, effectivePlan, currentBusiness, subscriptionStatus, subscriptionExpiresAt, refreshBusinesses])

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
