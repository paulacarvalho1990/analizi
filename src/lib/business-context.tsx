import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from './supabase'

export interface BusinessItem {
  id: string
  name: string
  slug: string
  website_url?: string | null
  segment?: string | null
}

export interface SiteItem {
  id: string
  business_id: string
  name: string
  domain: string
  tracker_site_id: string
  is_active: boolean
}

export interface BusinessContextValue {
  businesses: BusinessItem[]
  currentBusiness: BusinessItem | null
  sites: SiteItem[]
  currentBusinessSites: SiteItem[]
  currentSite: SiteItem | null
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
    segment: 'Saúde'
  },
  {
    id: 'biz-horizonte-odonto',
    name: 'Horizonte Odonto',
    slug: 'horizonte-odonto',
    website_url: 'www.horizonteodonto.com.br',
    segment: 'Saúde'
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

const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([])
  const [sites, setSites] = useState<SiteItem[]>([])
  const [currentBusiness, setCurrentBusiness] = useState<BusinessItem | null>(null)
  const [currentSite, setCurrentSite] = useState<SiteItem | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      if (supabase) {
        // Busca todos os businesses aos quais o usuário tem acesso (RLS ativa)
        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .select('id, name, slug, website_url, segment')
          .order('name', { ascending: true })

        if (!bizError && bizData && bizData.length > 0) {
          setBusinesses(bizData)

          // Busca todos os sites vinculados a esses businesses
          const bizIds = bizData.map(b => b.id)
          const { data: sitesData, error: sitesError } = await supabase
            .from('sites')
            .select('id, business_id, name, domain, tracker_site_id, is_active')
            .in('business_id', bizIds)
            .order('name', { ascending: true })

          const loadedSites = (!sitesError && sitesData) ? (sitesData as SiteItem[]) : []
          setSites(loadedSites)

          // Restaura business selecionado ou seleciona o primeiro
          const savedBizId = localStorage.getItem('analizi-selected-business-id')
          const activeBiz = bizData.find(b => b.id === savedBizId) || bizData[0]
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

  const value = useMemo<BusinessContextValue>(() => ({
    businesses,
    currentBusiness,
    sites,
    currentBusinessSites,
    currentSite,
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
