import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'

export function MetricCard({
  title,
  value,
  subtitle,
  variation,
  good = true,
  note,
}: {
  title: string
  value: React.ReactNode
  subtitle?: React.ReactNode
  variation?: string
  good?: boolean
  note?: string
}) {
  return (
    <article className="metric-card">
      <div className="metric-title">
        {title}
        <Info size={14} />
      </div>
      <strong className={subtitle ? 'has-subtitle' : ''} title={typeof value === 'string' ? value : undefined}>
        {value}
      </strong>
      {subtitle && (
        <span className="metric-subtitle" title={typeof subtitle === 'string' ? subtitle : undefined}>
          {subtitle}
        </span>
      )}
      {variation && (
        <span className={good ? 'variation positive' : 'variation negative'}>
          {good ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
          {variation} <em>vs. período anterior</em>
        </span>
      )}
      {note && <small>{note}</small>}
    </article>
  )
}
