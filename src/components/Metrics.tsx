import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'

export function MetricCard({ title, value, variation, good = true, note }: { title: string, value: string, variation?: string, good?: boolean, note?: string }) {
  return <article className="metric-card"><div className="metric-title">{title}<Info size={14} /></div><strong>{value}</strong>{variation && <span className={good ? 'variation positive' : 'variation negative'}>{good ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{variation} <em>vs. período anterior</em></span>}{note && <small>{note}</small>}</article>
}
