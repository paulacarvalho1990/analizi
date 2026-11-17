import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useBusiness } from '../../lib/business-context'
import { normalizeOriginName } from '../../lib/origin'
import type { ReportData, ReportKind } from '../../reports/derive'
import type { ReportInsight } from '../../reports/insights'
import { WeeklyReport } from './WeeklyReport'

const API = 'https://analizi.carvalhopaula1990.workers.dev'

export const REPORT_GOALS: Array<{ kind: ReportKind, title: string, text: string }> = [
  { kind: 'geral', title: 'Visão geral', text: 'Um pouco de tudo: visitas, contatos e o que mais funcionou na semana.' },
  { kind: 'contatos', title: 'Mais contatos', text: 'Foco em quem pediu contato pelo site e no que fazer para receber mais.' },
  { kind: 'visitas', title: 'Mais visitas', text: 'Foco em quantas pessoas chegam ao site e por onde elas vêm.' },
  { kind: 'regiao', title: 'Público da região', text: 'Foco nas cidades de onde vêm seus visitantes e clientes.' },
]
const goalTitle = (k?: ReportKind | null) => REPORT_GOALS.find(g => g.kind === k)?.title ?? ''

type Settings = { report_kind: ReportKind, next_report_kind: ReportKind | null }
type Generated = { weekStart: string, weekEnd: string, data: ReportData, insights: ReportInsight[] }

function GoalPicker({ initial, onSave, onCancel, saving, first }: { initial?: ReportKind, onSave: (k: ReportKind) => void, onCancel?: () => void, saving: boolean, first: boolean }) {
  const [choice, setChoice] = useState<ReportKind | undefined>(initial)
  return (
    <div className="wr-setup">
      <span className="wr-izi">IZI INTELLIGENCE</span>
      <h1>{first ? 'Qual é o seu objetivo com o site?' : 'Mudar o objetivo do relatório'}</h1>
      <p>Toda segunda-feira você recebe um relatório da semana, com dicas criadas com IA para esse objetivo. {first ? 'Dá para mudar depois.' : 'A mudança vale a partir do próximo relatório.'}</p>
      <div className="wr-goals" role="radiogroup" aria-label="Objetivo do relatório">
        {REPORT_GOALS.map(g => (
          <button key={g.kind} type="button" role="radio" aria-checked={choice === g.kind} className={`wr-goal${choice === g.kind ? ' on' : ''}`} onClick={() => setChoice(g.kind)}>
            <strong>{g.title}</strong><span>{g.text}</span>
          </button>
        ))}
      </div>
      <div className="wr-setup-actions">
        {onCancel && <button type="button" className="wr-btn ghost" onClick={onCancel}>Cancelar</button>}
        <button type="button" className="wr-btn" disabled={!choice || saving || (!first && choice === initial)} onClick={() => choice && onSave(choice)}>
          {saving ? 'Salvando…' : first ? 'Salvar e ver relatório' : 'Salvar objetivo'}
        </button>
      </div>
    </div>
  )
}

export function WeeklyReportPage() {
  const { currentSite } = useBusiness()
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined)
  const [report, setReport] = useState<Generated | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabase || !currentSite) return
    let alive = true
    void (async () => {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!alive || !user) return
      setUserId(user.id)
      const { data } = await supabase!.from('report_settings').select('report_kind, next_report_kind').eq('user_id', user.id).eq('site_id', currentSite.id).maybeSingle()
      if (alive) setSettings((data as Settings | null) ?? null)
    })()
    return () => { alive = false }
  }, [currentSite?.id])

  const kind = settings?.report_kind
  useEffect(() => {
    if (!kind || !currentSite || !supabase) return
    let alive = true
    setReport(null); setError('')
    void (async () => {
      const { data: { session } } = await supabase!.auth.getSession()
      const q = new URLSearchParams({ siteId: currentSite.id, trackerSiteId: currentSite.tracker_site_id || '', kind })
      const res = await fetch(`${API}/v1/weekly-report?${q}`, { headers: session?.access_token ? { authorization: `Bearer ${session.access_token}` } : undefined })
      if (!alive) return
      if (res.ok) setReport(await res.json() as Generated)
      else setError(res.status === 404 ? 'Seu primeiro relatório fica pronto na próxima segunda-feira.' : 'Não foi possível carregar o relatório agora. Tente de novo em alguns minutos.')
    })()
    return () => { alive = false }
  }, [kind, currentSite?.id])

  const save = async (k: ReportKind) => {
    if (!supabase || !currentSite || !userId) return
    setSaving(true)
    const first = !settings
    const row = first
      ? { user_id: userId, site_id: currentSite.id, report_kind: k, next_report_kind: null }
      : { user_id: userId, site_id: currentSite.id, report_kind: settings!.report_kind, next_report_kind: k === settings!.report_kind ? null : k }
    const { error: err } = await supabase.from('report_settings').upsert(row, { onConflict: 'user_id,site_id' })
    setSaving(false)
    if (err) { setNotice('Não foi possível salvar. Tente de novo.'); return }
    setSettings({ report_kind: row.report_kind, next_report_kind: row.next_report_kind })
    setEditing(false)
    if (!first) setNotice(`Objetivo salvo. O próximo relatório, na segunda-feira, já vai considerar “${goalTitle(k)}”.`)
  }

  if (!currentSite) return <div className="wr"><div className="wr-empty">Cadastre um site para ver o relatório semanal.</div></div>
  if (settings === undefined) return <div className="wr"><div className="wr-empty">Carregando…</div></div>
  if (settings === null || editing) {
    return <div className="wr"><GoalPicker first={settings === null} initial={settings?.next_report_kind ?? settings?.report_kind} saving={saving} onSave={save} onCancel={settings ? () => setEditing(false) : undefined} /></div>
  }

  const pending = settings.next_report_kind
  return (
    <div className="wr-page">
      <div className="wr wr-banner">
        <span className="wr-izi">IZI INTELLIGENCE</span>
        <span>Relatório semanal criado com IA, toda segunda-feira. Objetivo: <b>{goalTitle(settings.report_kind)}</b>.</span>
      </div>
      {(notice || pending) && <div className="wr wr-notice" role="status">{notice || `O próximo relatório, na segunda-feira, já vai considerar “${goalTitle(pending)}”.`}</div>}
      {error ? <div className="wr"><div className="wr-empty">{error}</div></div> : (
        <WeeklyReport
          kind={settings.report_kind}
          data={report?.data ?? null}
          start={report?.weekStart ?? ''}
          end={report?.weekEnd ?? ''}
          insights={report?.insights}
          normalizeSource={normalizeOriginName}
          actions={<button type="button" className="wr-btn ghost" onClick={() => { setNotice(''); setEditing(true) }}>Configurar</button>}
        />
      )}
    </div>
  )
}
