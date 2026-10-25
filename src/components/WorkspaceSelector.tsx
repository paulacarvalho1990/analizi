import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react'
import { Check, ChevronDown, Globe, Settings, Plus, X, Sparkles, Lock } from 'lucide-react'
import { useBusiness } from '../lib/business-context'
import { Button } from './ui/Button'

type SegmentKey = 'products' | 'services' | 'health'

const SEGMENT_SUBOPTIONS: Record<SegmentKey, string[]> = {
  products: [
    'Moda e acessórios',
    'Beleza e cosméticos',
    'Alimentos e bebidas',
    'Casa e decoração',
    'Eletrônicos',
    'Saúde e bem-estar',
    'Pet shop',
    'Autopeças e acessórios',
    'Livros e papelaria',
    'Produtos infantis',
    'Outros'
  ],
  services: [
    'Advocacia',
    'Contabilidade',
    'Arquitetura e engenharia',
    'Construção e reformas',
    'Tecnologia',
    'Educação',
    'Consultoria',
    'Fotografia e eventos',
    'Beleza e estética',
    'Serviços automotivos',
    'Outros'
  ],
  health: [
    'Clínica médica',
    'Odontologia',
    'Psicologia',
    'Fisioterapia',
    'Nutrição',
    'Dermatologia',
    'Exames e diagnóstico',
    'Bem-estar e terapias',
    'Outros'
  ]
}

interface WorkspaceSelectorProps {
  onNavigateSettings?: () => void
  onSiteCreated?: () => void
  compact?: boolean
}

export function NewSiteModal({ onSiteCreated }: { onSiteCreated?: () => void }) {
  const {
    isNewSiteModalOpen,
    setNewSiteModalOpen,
    canAddMoreSites,
    effectivePlan,
    totalSitesCount,
    createNewSite
  } = useBusiness()

  const [siteName, setSiteName] = useState('')
  const [domain, setDomain] = useState('')
  const [segment, setSegment] = useState<SegmentKey>('services')
  const [subsegment, setSubsegment] = useState('')
  const [segmentDetail, setSegmentDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subsegmentOptions = useMemo(() => SEGMENT_SUBOPTIONS[segment] || [], [segment])
  const isOtherSubsegment = subsegment === 'Outros'

  useEffect(() => {
    if (isNewSiteModalOpen) {
      setSiteName('')
      setDomain('')
      setSegment('services')
      setSubsegment('')
      setSegmentDetail('')
      setError('')
    }
  }, [isNewSiteModalOpen])

  if (!isNewSiteModalOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!canAddMoreSites) {
      setError(`Seu ${effectivePlan.name} permite até ${effectivePlan.maxSitesLabel}.`)
      return
    }
    if (!subsegment) {
      setError('Selecione o segmento secundário do site.')
      return
    }
    if (isOtherSubsegment && segmentDetail.trim().length < 2) {
      setError('Descreva os detalhes do segmento do seu negócio.')
      return
    }
    setLoading(true)
    try {
      await createNewSite({
        name: siteName,
        domain,
        segment,
        subsegment,
        segment_detail: segmentDetail.trim() || null
      })
      setNewSiteModalOpen(false)
      if (onSiteCreated) onSiteCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar novo site.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => setNewSiteModalOpen(false)}>
      <div className="utm-modal new-site-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          aria-label="Fechar modal"
          onClick={() => setNewSiteModalOpen(false)}
        >
          <X size={18} />
        </button>

        <span className="eyebrow">ADICIONAR NOVO SITE</span>
        <h2>Cadastrar novo site</h2>
        <p>
          Adicione um novo site para acompanhar visitas, páginas, cliques, mapa de calor e insights de IA de forma independente.
        </p>

        <div className="new-site-plan-banner">
          <div className="new-site-plan-info">
            <Sparkles size={16} />
            <span>
              <b>{effectivePlan.name}</b> ({effectivePlan.priceLabel}) · Uso atual:{' '}
              <b>
                {totalSitesCount} de {effectivePlan.id === 'admin' ? 'Ilimitados (N)' : effectivePlan.maxSites} site(s)
              </b>
            </span>
          </div>
        </div>

        {!canAddMoreSites ? (
          <div className="new-site-limit-reached">
            <Lock size={22} />
            <div>
              <b>Limite de sites atingido no {effectivePlan.name}</b>
              <p>
                O Plano de R$ 39,90 permite 1 site, o Plano de R$ 79,00 permite até 2 sites e o Plano Admin permite N sites. Faça upgrade da sua assinatura para liberar novos sites.
              </p>
            </div>
          </div>
        ) : (
          <form className="new-site-form" onSubmit={handleSubmit}>
            <label>
              Nome do site ou projeto
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Ex.: Minha Loja Online"
              />
            </label>
            <label>
              Domínio / Endereço do site
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Ex.: minhaloja.com.br"
              />
            </label>
            <div className="two-fields">
              <label>
                Segmento principal
                <select
                  value={segment}
                  onChange={(e) => {
                    setSegment(e.target.value as SegmentKey)
                    setSubsegment('')
                  }}
                >
                  <option value="services">Serviços</option>
                  <option value="products">Produtos / E-commerce</option>
                  <option value="health">Saúde e Bem-estar</option>
                </select>
              </label>

              <label>
                Segmento secundário
                <select
                  required
                  value={subsegment}
                  onChange={(e) => setSubsegment(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione uma opção
                  </option>
                  {subsegmentOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              {isOtherSubsegment ? 'Detalhes do segmento (obrigatório)' : 'Detalhes do segmento (opcional)'}
              <input
                type="text"
                required={isOtherSubsegment}
                value={segmentDetail}
                onChange={(e) => setSegmentDetail(e.target.value)}
                placeholder="Ex.: Clínica odontológica especializada em implantes e estética"
              />
            </label>

            {error && <p className="form-feedback error">{error}</p>}

            <div className="new-site-modal-actions">
              <Button type="button" variant="ghost" onClick={() => setNewSiteModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Plus size={17} />
                {loading ? 'Criando site...' : 'Criar site e ver código'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function WorkspaceSelector({ onNavigateSettings, compact = false }: WorkspaceSelectorProps) {
  const {
    businesses,
    currentBusiness,
    currentBusinessSites,
    currentSite,
    selectBusiness,
    selectSite,
    setNewSiteModalOpen,
    loading
  } = useBusiness()

  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fecha ao pressionar Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const displayName = currentSite?.name || currentBusiness?.name || 'Meu site'
  const displayDomain = currentSite?.domain || currentBusiness?.website_url || 'Nenhum site cadastrado'

  return (
    <div className={`workspace-selector-container ${compact ? 'compact' : ''}`} ref={menuRef}>
      <button
        type="button"
        className={`workspace workspace-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Site ativo: ${displayName}`}
      >
        <span className="workspace-dot" />
        <div className="workspace-details">
          <span className="workspace-name">{loading ? 'Carregando...' : displayName}</span>
          {!compact && (
            <span className="workspace-domain">{displayDomain}</span>
          )}
        </div>
        <ChevronDown size={15} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="workspace-dropdown" role="menu">
          <div className="workspace-dropdown-header">
            <span>MEUS SITES</span>
            <small>{businesses.length}</small>
          </div>

          <div className="workspace-list">
            {businesses.map((biz) => {
              const isSelected = biz.id === currentBusiness?.id
              const cleanDomain = (biz.website_url || biz.slug).replace(/^https?:\/\//, '')
              return (
                <button
                  key={biz.id}
                  type="button"
                  className={`workspace-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    selectBusiness(biz.id)
                    setIsOpen(false)
                  }}
                  role="menuitem"
                >
                  <div className="workspace-option-icon">
                    <Globe size={16} />
                  </div>
                  <div className="workspace-option-info">
                    <b className="workspace-option-title">{biz.name}</b>
                    <span className="workspace-option-sub">
                      {cleanDomain}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className="workspace-check" />}
                </button>
              )
            })}
          </div>

          {currentBusinessSites.length > 1 && (
            <>
              <div className="workspace-dropdown-header mt">
                <span>DOMÍNIOS DESTE SITE</span>
                <small>{currentBusinessSites.length}</small>
              </div>
              <div className="workspace-list">
                {currentBusinessSites.map((site) => {
                  const isSiteSelected = site.id === currentSite?.id
                  return (
                    <button
                      key={site.id}
                      type="button"
                      className={`workspace-option site-option ${isSiteSelected ? 'selected' : ''}`}
                      onClick={() => {
                        selectSite(site.id)
                        setIsOpen(false)
                      }}
                      role="menuitem"
                    >
                      <div className="workspace-option-icon">
                        <Globe size={15} />
                      </div>
                      <div className="workspace-option-info">
                        <b className="workspace-option-title">{site.name || site.domain}</b>
                        <span className="workspace-option-sub">{site.domain}</span>
                      </div>
                      {isSiteSelected && <Check size={15} className="workspace-check" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="workspace-dropdown-footer">
            <button
              type="button"
              className="workspace-footer-action add-site"
              onClick={() => {
                setIsOpen(false)
                setNewSiteModalOpen(true)
              }}
            >
              <Plus size={14} />
              <span>Adicionar novo site</span>
            </button>

            {onNavigateSettings && (
              <button
                type="button"
                className="workspace-footer-action"
                onClick={() => {
                  setIsOpen(false)
                  onNavigateSettings()
                }}
              >
                <Settings size={14} />
                <span>Meu site, plano e acessos</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
