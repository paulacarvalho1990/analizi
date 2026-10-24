import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Building2, Globe, ExternalLink, Settings } from 'lucide-react'
import { useBusiness } from '../lib/business-context'

interface WorkspaceSelectorProps {
  onNavigateSettings?: () => void
  compact?: boolean
}

export function WorkspaceSelector({ onNavigateSettings, compact = false }: WorkspaceSelectorProps) {
  const {
    businesses,
    currentBusiness,
    currentBusinessSites,
    currentSite,
    selectBusiness,
    selectSite,
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

  const displayName = currentBusiness?.name || currentSite?.name || 'Seu negócio'
  const displayDomain = currentSite?.domain || currentBusiness?.website_url || 'Nenhum site cadastrado'

  return (
    <div className={`workspace-selector-container ${compact ? 'compact' : ''}`} ref={menuRef}>
      <button
        type="button"
        className={`workspace workspace-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Negócio ativo: ${displayName}`}
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
            <span>SEUS NEGÓCIOS</span>
            <small>{businesses.length}</small>
          </div>

          <div className="workspace-list">
            {businesses.map((biz) => {
              const isSelected = biz.id === currentBusiness?.id
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
                    <Building2 size={16} />
                  </div>
                  <div className="workspace-option-info">
                    <b className="workspace-option-title">{biz.name}</b>
                    <span className="workspace-option-sub">
                      {biz.website_url || biz.slug}
                      {biz.segment ? ` · ${biz.segment}` : ''}
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
                <span>SITES DESTE NEGÓCIO</span>
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

          {onNavigateSettings && (
            <div className="workspace-dropdown-footer">
              <button
                type="button"
                className="workspace-footer-action"
                onClick={() => {
                  setIsOpen(false)
                  onNavigateSettings()
                }}
              >
                <Settings size={14} />
                <span>Gerenciar negócio e equipe</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
