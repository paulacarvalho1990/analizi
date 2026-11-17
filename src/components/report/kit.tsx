import { useId, useMemo, useState, type ReactNode } from 'react'
import { Eye, Info, Lightbulb } from 'lucide-react'
import './report.css'

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */
export const num = (v?: number | string | null) => Number(v || 0)
export const fmt = (v?: number | string | null) => Math.round(num(v)).toLocaleString('pt-BR')
export const fmtDec = (v: number, digits = 1) => v.toFixed(digits).replace('.', ',')
export const fmtPct = (v: number, digits = 1) => `${fmtDec(v, digits)}%`
export const share = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0)
export function dur(seconds?: number | null) {
  const s = Math.round(num(seconds))
  if (!s) return '—'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, '0')}s`
}
export function fmtMs(ms?: number | null) {
  const v = num(ms)
  if (!v) return '—'
  if (v < 1000) return `${v}ms`
  return `${fmtDec(v / 1000)}s`
}
/** variação percentual inteira, ou null quando não há base de comparação */
export function change(current?: number | null, previous?: number | null): number | null {
  const now = num(current)
  const before = num(previous)
  if (!before) return null
  return Math.round(((now - before) / before) * 100)
}
export const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
export const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const weekdayOf = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay()

/* ------------------------------------------------------------------ */
/* Ajuda (ⓘ) com "o que é / por que importa / dica"                   */
/* ------------------------------------------------------------------ */
export interface HelpContent { title?: string, what: ReactNode, why?: ReactNode, tip?: ReactNode }
export function Help({ title, what, why, tip, align = 'center', size = 13 }: HelpContent & { align?: 'center' | 'left' | 'right', size?: number }) {
  const id = useId()
  return (
    <span className="rp-help">
      <button type="button" aria-label={`O que significa ${title ?? 'este dado'}?`} aria-describedby={id}>
        <Info size={size} />
      </button>
      <span className={`rp-pop ${align === 'center' ? '' : align}`} role="tooltip" id={id}>
        {title && <b className="t">{title}</b>}
        <p>{what}</p>
        {why && <p><em>Por que importa:</em> {why}</p>}
        {tip && <p><em>Dica:</em> {tip}</p>}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Leitura (o que o dado mostra) e Dica (o que fazer)                  */
/* ------------------------------------------------------------------ */
export function Read({ children }: { children: ReactNode }) {
  return <p className="rp-read"><Eye size={14} /><span>{children}</span></p>
}
export function Tip({ children, label = 'Dica:' }: { children: ReactNode, label?: string }) {
  return <p className="rp-tip"><Lightbulb size={14} /><span><strong>{label}</strong> {children}</span></p>
}

/* ------------------------------------------------------------------ */
/* Estrutura                                                           */
/* ------------------------------------------------------------------ */
export function Card({ title, subtitle, icon, help, actions, children, read, tip, className = '', style }: {
  title: ReactNode, subtitle?: ReactNode, icon?: ReactNode, help?: HelpContent, actions?: ReactNode,
  children?: ReactNode, read?: ReactNode, tip?: ReactNode, className?: string, style?: React.CSSProperties
}) {
  return (
    <article className={`rp-card ${className}`} style={style}>
      <div className="rp-ch">
        <div>
          <h3>{icon}{title}{help && <Help title={typeof title === 'string' ? title : help.title} {...help} />}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="rp-ch-actions">{actions}</div>}
      </div>
      {children && <div className="rp-card-body">{children}</div>}
      {(read || tip) && <div className="rp-card-foot">{read && <Read>{read}</Read>}{tip && <Tip>{tip}</Tip>}</div>}
    </article>
  )
}

export function Section({ children }: { children: ReactNode }) {
  return <p className="rp-sec">{children}</p>
}

export function Tabs<T extends string>({ options, value, onChange, label }: { options: Array<{ value: T, label: ReactNode }>, value: T, onChange: (v: T) => void, label?: string }) {
  return (
    <div className="rp-tabs" role="tablist" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Pager({ page, total, perPage, setPage }: { page: number, total: number, perPage: number, setPage: (p: number) => void }) {
  if (total <= perPage) return null
  const pages = Math.ceil(total / perPage)
  return (
    <div className="rp-pager">
      <span>Mostrando {page * perPage + 1}–{Math.min((page + 1) * perPage, total)} de {total}</span>
      <div>
        <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
        <b>{page + 1} de {pages}</b>
        <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
      </div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rp-empty">{children}</p>
}

/* ------------------------------------------------------------------ */
/* Indicadores                                                         */
/* ------------------------------------------------------------------ */
export function Delta({ value, invert = false, suffix = '%', emptyLabel }: { value: number | null, invert?: boolean, suffix?: string, emptyLabel?: string }) {
  if (value === null) return emptyLabel ? <span className="rp-delta flat">{emptyLabel}</span> : null
  const good = invert ? value <= 0 : value >= 0
  return (
    <span className={`rp-delta ${good ? '' : 'bad'}`} title="Comparado ao período anterior de mesmo tamanho">
      {value >= 0 ? '↗' : '↘'} {Math.abs(value)}{suffix}
    </span>
  )
}

export function Chip({ tone = 'neutral', children, title }: { tone?: 'good' | 'warn' | 'bad' | 'neutral' | 'brand', children: ReactNode, title?: string }) {
  return <span className={`rp-chip ${tone}`} title={title}>{children}</span>
}

export function Kpi({ label, value, delta, invert, desc, help, spark, sparkColor, text, muted }: {
  label: string, value: ReactNode, delta?: number | null, invert?: boolean, desc?: ReactNode,
  help?: HelpContent, spark?: number[], sparkColor?: string, text?: boolean, muted?: boolean
}) {
  return (
    <div className={`rp-kpi ${muted ? 'muted' : ''}`}>
      <div className="kl">{label}{help && <Help title={label} {...help} />}</div>
      <div className="kv"><b className={`num ${text ? 'txt' : ''}`}>{value}</b>{delta !== undefined && <Delta value={delta} invert={invert} />}</div>
      {spark && spark.length > 1 && <Spark values={spark} color={sparkColor} />}
      {desc && <div className="kd">{desc}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Gráficos                                                            */
/* ------------------------------------------------------------------ */
function smoothPath(p: Array<[number, number]>) {
  if (!p.length) return ''
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], e = p[Math.min(i + 2, p.length - 1)]
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6]
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`
  }
  return d
}

export function Spark({ values, color = '#3B82F6' }: { values: number[], color?: string }) {
  const W = 120, H = 30
  const mx = Math.max(...values), mn = Math.min(...values)
  const pts = values.map((v, i) => [i * W / (values.length - 1), H - 3 - ((v - mn) / (mx - mn || 1)) * (H - 6)] as [number, number])
  return (
    <svg className="ks" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Linha com área, média tracejada, pico destacado e tooltip ao passar o mouse */
export function TrendChart({ labels, values, unit, height = 230, detail, colors = ['#3B82F6', '#7C5CF0', '#FF3CAC'] }: {
  labels: string[], values: number[], unit: string, height?: number,
  detail?: (i: number) => ReactNode, colors?: [string, string, string] | string[]
}) {
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  if (!values.length) return <Empty>Ainda não há dados neste período.</Empty>
  const W = 760, X0 = 42, X1 = W - 12, YT = 18, YB = height - 30
  const max = Math.max(...values, 1) * 1.15
  const n = values.length
  const step = n > 1 ? (X1 - X0) / (n - 1) : 0
  const x = (i: number) => (n > 1 ? X0 + i * step : (X0 + X1) / 2)
  const y = (v: number) => YB - (v / max) * (YB - YT)
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number])
  const line = smoothPath(pts)
  const avg = values.reduce((a, b) => a + b, 0) / n
  const peak = values.indexOf(Math.max(...values))
  const tickStep = Math.max(1, Math.ceil(n / 8))
  const ticks = [0, 0.33, 0.66, 1].map(f => Math.round(max * f))
  const hitW = n > 1 ? step : X1 - X0
  return (
    <div className="rp-chart-wrap" onMouseLeave={() => setHover(null)}>
      <svg className="rp-svg" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`Gráfico de ${unit} por período. Pico de ${values[peak]} em ${labels[peak]}.`}>
        <defs>
          <linearGradient id={`${uid}f`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={colors[0]} stopOpacity=".26" /><stop offset="1" stopColor={colors[0]} stopOpacity="0" /></linearGradient>
          <linearGradient id={`${uid}l`} x1="0" x2="1"><stop offset="0" stopColor={colors[0]} /><stop offset=".55" stopColor={colors[1]} /><stop offset="1" stopColor={colors[2]} /></linearGradient>
          <linearGradient id={`${uid}p`} x1="0" x2="1"><stop offset="0" stopColor="#D61F83" /><stop offset="1" stopColor="#FF8A3D" /></linearGradient>
        </defs>
        {ticks.map(t => <g key={t}><line className="gl" x1={X0} x2={X1} y1={y(t)} y2={y(t)} /><text x={X0 - 8} y={y(t) + 4} textAnchor="end">{t.toLocaleString('pt-BR')}</text></g>)}
        <line className="avg" x1={X0} x2={X1} y1={y(avg)} y2={y(avg)} />
        {n > 1 && <path d={`${line} L${X1},${YB} L${X0},${YB} Z`} fill={`url(#${uid}f)`} />}
        {n > 1 && <path d={line} fill="none" stroke={`url(#${uid}l)`} strokeWidth={3} strokeLinecap="round" />}
        {labels.map((l, i) => ((i % tickStep === 0 && i < n - Math.ceil(tickStep / 2)) || i === n - 1)
          ? <text key={i} x={x(i)} y={height - 8} textAnchor="middle">{l}</text> : null)}
        <g>
          <circle cx={x(peak)} cy={y(values[peak])} r={6} fill="#FF3CAC" stroke="var(--rp-surface)" strokeWidth={3} />
          {(() => {
            const label = `Pico: ${labels[peak]} · ${values[peak].toLocaleString('pt-BR')}`
            const w = label.length * 6.4 + 18
            const px = x(peak) + 12 + w > W ? x(peak) - 12 - w : x(peak) + 12
            return <g transform={`translate(${px},${Math.max(y(values[peak]) - 26, 2)})`}><rect width={w} height={22} rx={11} fill={`url(#${uid}p)`} /><text x={w / 2} y={15} textAnchor="middle" style={{ fill: '#fff', fontWeight: 700 }}>{label}</text></g>
          })()}
        </g>
        {hover !== null && <circle cx={x(hover)} cy={y(values[hover])} r={5} fill="var(--rp-surface)" stroke="#7C5CF0" strokeWidth={2.5} />}
        {values.map((_, i) => (
          <rect key={i} x={x(i) - hitW / 2} y={YT} width={hitW} height={YB - YT} fill="transparent"
            tabIndex={0} aria-label={`${labels[i]}: ${values[i]} ${unit}`}
            onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="rp-tt" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(values[hover]) / height) * 100}%` }}>
          <b>{labels[hover]}: {values[hover].toLocaleString('pt-BR')} {unit}</b>
          {detail && <span>{detail(hover)}</span>}
        </div>
      )}
    </div>
  )
}

/** Barras verticais empilhadas (ex.: contatos por tipo e por dia) */
export function StackedBars({ labels, series, height = 200, unit = '' }: {
  labels: string[], series: Array<{ name: string, color: string, values: number[] }>, height?: number, unit?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const n = labels.length
  if (!n) return <Empty>Ainda não há dados neste período.</Empty>
  const W = 760, X0 = 34, X1 = W - 8, YT = 10, YB = height - 28
  const totals = labels.map((_, i) => series.reduce((a, s) => a + num(s.values[i]), 0))
  const max = Math.max(...totals, 1) * 1.15
  const bw = (X1 - X0) / n
  const y = (v: number) => YB - (v / max) * (YB - YT)
  const ticks = [0, Math.round(max / 2), Math.round(max * 0.9)]
  const tickStep = Math.max(1, Math.ceil(n / 8))
  return (
    <div className="rp-chart-wrap" onMouseLeave={() => setHover(null)}>
      <svg className="rp-svg" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`Gráfico de barras de ${unit}`}>
        {ticks.map(t => <g key={t}><line className="gl" x1={X0} x2={X1} y1={y(t)} y2={y(t)} /><text x={X0 - 6} y={y(t) + 4} textAnchor="end">{t}</text></g>)}
        {labels.map((l, i) => {
          let acc = 0
          const bx = X0 + i * bw + bw * 0.18, ww = Math.max(bw * 0.64, 2)
          return (
            <g key={i} tabIndex={0} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`${l}: ${totals[i]} ${unit}`}>
              <rect x={X0 + i * bw} y={YT} width={bw} height={YB - YT} fill="transparent" />
              {series.map(s => {
                const v = num(s.values[i]); const y0 = y(acc); acc += v; const y1 = y(acc)
                return v > 0 ? <rect key={s.name} x={bx} y={y1} width={ww} height={Math.max(y0 - y1, 0)} rx={2} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.55} /> : null
              })}
              {(i % tickStep === 0) && <text x={bx + ww / 2} y={height - 8} textAnchor="middle">{l}</text>}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="rp-tt" style={{ left: `${((X0 + hover * bw + bw / 2) / W) * 100}%`, top: `${(y(totals[hover]) / height) * 100}%` }}>
          <b>{labels[hover]}: {totals[hover]} {unit}</b>
          <span>{series.map(s => `${num(s.values[hover])} ${s.name}`).join(' · ')}</span>
        </div>
      )}
    </div>
  )
}

export interface BarRow { key?: string, label: ReactNode, sub?: ReactNode, value: number, display?: ReactNode, tone?: 'pink' | 'blue' | 'green' | 'orange', title?: string }
export function HBars({ rows, tone = 'pink', max }: { rows: BarRow[], tone?: 'pink' | 'blue' | 'green' | 'orange', max?: number }) {
  if (!rows.length) return <Empty>Ainda não há dados neste período.</Empty>
  const mx = max ?? Math.max(...rows.map(r => r.value), 1)
  return (
    <div className="rp-hb">
      {rows.map((r, i) => (
        <div className="rp-hb-row" key={r.key ?? i} title={r.title}>
          <span className="nm">{r.label}{r.sub && <small> · {r.sub}</small>}</span>
          <b>{r.display ?? fmt(r.value)}</b>
          <span className="rp-trk"><i className={(r.tone ?? tone) === 'pink' ? '' : (r.tone ?? tone)} style={{ width: `${Math.max(0, Math.min(100, (r.value / mx) * 100))}%` }} /></span>
        </div>
      ))}
    </div>
  )
}

export function CellBar({ value, max, label, tone = 'blue' }: { value: number, max: number, label?: ReactNode, tone?: 'pink' | 'blue' | 'green' }) {
  return (
    <div className="rp-cbar">
      <b>{label ?? fmt(value)}</b>
      <span className="rp-trk"><i className={tone === 'pink' ? '' : tone} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} /></span>
    </div>
  )
}

export function Donut({ segments, center, centerLabel, size = 120 }: { segments: Array<{ value: number, color: string }>, center: ReactNode, centerLabel: ReactNode, size?: number }) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  let off = 0
  return (
    <div className="rp-dn-w" style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="16" fill="none" stroke="var(--rp-track)" strokeWidth="6" />
        {total > 0 && segments.map((s, i) => {
          const len = (s.value / total) * 100
          const el = len > 0 ? <circle key={i} cx="21" cy="21" r="16" fill="none" stroke={s.color} strokeWidth="6" pathLength={100} strokeDasharray={`${Math.max(len - (segments.length > 1 ? 1.2 : 0), 0.5)} 100`} strokeDashoffset={-off} /> : null
          off += len
          return el
        })}
      </svg>
      <div className="rp-dn-c"><b>{center}</b><span>{centerLabel}</span></div>
    </div>
  )
}

export function StackBar({ segments, height = 14 }: { segments: Array<{ value: number, color: string, label?: string }>, height?: number }) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  if (!total) return <span className="rp-trk" style={{ height }} />
  return (
    <div className="rp-stack" style={{ height }}>
      {segments.filter(s => s.value > 0).map((s, i) => <i key={i} title={s.label ? `${s.label}: ${fmtPct(share(s.value, total), 0)}` : undefined} style={{ width: `${share(s.value, total)}%`, background: s.color }} />)}
    </div>
  )
}

export function heatColor(f: number) {
  if (f <= 0) return 'var(--rp-track)'
  const st = [[255, 234, 220], [255, 190, 140], [255, 138, 61], [255, 60, 172]]
  const xx = Math.min(f, 1) * (st.length - 1)
  const i = Math.min(Math.floor(xx), st.length - 2)
  const t = xx - i
  const c = st[i].map((a, k) => Math.round(a + (st[i + 1][k] - a) * t))
  return `rgb(${c.join(',')})`
}

export type PeakCell = { dayOfWeek: number, hourOfDay: number, sessions: number, views: number, contacts: number }
export function PeakGrid({ peakHours }: { peakHours: PeakCell[] }) {
  const map = useMemo(() => {
    const m = new Map<string, PeakCell>()
    peakHours.forEach(p => m.set(`${p.dayOfWeek}-${p.hourOfDay}`, p))
    return m
  }, [peakHours])
  const max = Math.max(...peakHours.map(p => num(p.views || p.sessions)), 1)
  const order = [1, 2, 3, 4, 5, 6, 0]
  return (
    <>
      <div className="rp-hg" role="grid" aria-label="Acessos por dia da semana e hora do dia">
        <span />
        {Array.from({ length: 24 }, (_, h) => <span key={h} className="hh">{h % 3 === 0 ? `${h}h` : ''}</span>)}
        {order.map(d => (
          <div key={d} style={{ display: 'contents' }} role="row">
            <span>{WEEKDAYS_SHORT[d]}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const c = map.get(`${d}-${h}`)
              const v = num(c?.views || c?.sessions)
              return <i key={h} className="c" role="gridcell" tabIndex={-1} style={{ background: heatColor(v / max) }}
                title={`${WEEKDAYS_SHORT[d]}, ${h}h–${h + 1}h: ${v} acessos${c?.contacts ? ` · ${c.contacts} contatos` : ''}`} />
            })}
          </div>
        ))}
      </div>
      <div className="rp-hscale"><span>menos acessos</span><i /><span>mais acessos</span></div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Jornada do visitante (faixa de destaque da Visão Geral)                  */
/* ------------------------------------------------------------------ */
export function Journey({ period, users, usersDelta, newUsers, newUsersDelta, views, viewsDelta, attention, attentionDelta, contacts, contactsDelta, whatsapp, signups, exitRate }: {
  period: string, users: number, usersDelta: number | null, newUsers: number, newUsersDelta: number | null,
  views: number, viewsDelta: number | null, attention: number, attentionDelta: number | null,
  contacts: number, contactsDelta: number | null, whatsapp: number, signups: number, exitRate: number | null
}) {
  const uid = useId().replace(/:/g, '')
  const kept = exitRate !== null ? Math.max(0.15, 1 - exitRate / 100) : 0.7
  const conv = users > 0 ? contacts / users : 0
  const hs = [150, 150 * kept, Math.max(10, Math.min(150 * kept, 150 * conv * 4))]
  const c = 75
  const top = hs.map(h => c - h / 2), bot = hs.map(h => c + h / 2)
  const band = `M0,${top[0]} C250,${top[0]} 250,${top[1]} 500,${top[1]} C750,${top[1]} 750,${top[2]} 1000,${top[2]} L1000,${bot[2]} C750,${bot[2]} 750,${bot[1]} 500,${bot[1]} C250,${bot[1]} 250,${bot[0]} 0,${bot[0]} Z`
  return (
    <section className="rp-journey" aria-label="O caminho de quem visitou seu site">
      <div className="rp-jh">
        <h2>O caminho de quem visitou seu site
          <Help title="Como ler esta faixa" what="Da esquerda para a direita: quantas pessoas chegaram, quanto elas exploraram o site e quantas entraram em contato. A faixa afina conforme as pessoas vão saindo." tip="O objetivo é deixar a ponta direita mais grossa: mais contatos com o mesmo número de visitantes." />
        </h2>
        <span>{period}</span>
      </div>
      <div className="rp-stages">
        <div className="rp-stage">
          <div className="lbl">Chegaram<Help title="Usuários" what="Pessoas diferentes que abriram o seu site no período. Quem voltou várias vezes conta uma vez só." why="Mostra o tamanho do público que o seu site alcança." /></div>
          <div className="n num">{fmt(users)}<small>pessoas</small></div>
          <Delta value={usersDelta} emptyLabel="sem comparação" />
          <div className="sub"><span><b>{fmt(newUsers)}</b> vieram pela primeira vez</span><Delta value={newUsersDelta} /></div>
        </div>
        <div className="rp-stage">
          <div className="lbl">Se interessaram<Help title="Visualizações de páginas" what="Quantas páginas foram abertas no total. Uma pessoa que viu 3 páginas conta 3 visualizações." why="Quanto mais páginas por pessoa, maior o interesse pelo que você oferece." /></div>
          <div className="n num">{fmt(views)}<small>páginas vistas</small></div>
          <Delta value={viewsDelta} emptyLabel="sem comparação" />
          <div className="sub"><span><b>{dur(attention)}</b> de atenção</span><Help title="Tempo de atenção" what="Tempo médio em que a pessoa ficou com o site aberto e visível na tela." why="Mostra se o conteúdo está sendo realmente lido." tip="Acima de 1 minuto costuma ser bom para sites de serviços." /><Delta value={attentionDelta} /></div>
        </div>
        <div className="rp-stage">
          <div className="lbl">Entraram em contato<Help align="right" title="Contatos iniciados" what="Cliques em WhatsApp, telefone ou formulários de cadastro." why="É o resultado que mais se aproxima de um novo cliente." /></div>
          <div className="n num">{fmt(contacts)}<small>contatos</small></div>
          <Delta value={contactsDelta} emptyLabel="sem comparação" />
          <div className="sub"><span><b>{fmt(whatsapp)}</b> WhatsApp · <b>{fmt(signups)}</b> cadastros</span></div>
        </div>
      </div>
      <svg viewBox="0 0 1000 150" preserveAspectRatio="none" className="rp-band" aria-hidden="true">
        <defs><linearGradient id={`${uid}b`} x1="0" x2="1"><stop offset="0" stopColor="#3B82F6" /><stop offset=".52" stopColor="#FF3CAC" /><stop offset="1" stopColor="#FF8A3D" /></linearGradient></defs>
        <path d={band} fill={`url(#${uid}b)`} />
        <path d={band} fill="none" stroke="#fff" strokeOpacity=".18" />
      </svg>
      <div className="rp-jf">
        <span>{exitRate !== null ? <>↘ <b>{fmtPct(exitRate)}</b> das visitas terminaram sem interação </> : <>↘ Taxa de saída ainda indisponível </>}
          <Help title="Taxa de saída" what="De cada 100 visitas, quantas terminaram sem a pessoa interagir ou abrir outra página." why="Visitas que saem rápido não viram clientes." tip="Quanto menor, melhor. Veja em Páginas quais páginas mais espantam visitantes." />
        </span>
        <span><b>{users > 0 ? fmtPct(conv * 100) : '—'}</b> das pessoas viraram contato</span>
      </div>
    </section>
  )
}
