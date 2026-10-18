export function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const asset = compact
    ? '/brand/logos/analizi-symbol-transparent.png'
    : `/brand/logos/analizi-logo-${inverse ? 'dark' : 'light'}.png`

  return <img className={compact ? 'brand-symbol' : 'brand-logo'} src={asset} alt="Analizi" />
}
