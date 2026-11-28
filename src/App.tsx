import { SITE_TYPE_OPTIONS, isSiteType, type SiteType } from './lib/siteTypes'
import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, BookOpen, SlidersHorizontal, Eye, ArrowRight, BarChart3, Calendar, Check, ChevronDown, CircleCheck, AlertTriangle, Clock, Compass, Crown, FileText, Flame, Layers, Lightbulb, LogIn, MessageCircle, Copy, ExternalLink, Globe, Globe2, Info, Link2, MapPin, Monitor, MoreHorizontal, MousePointerClick, Plus, RefreshCw, Settings as SettingsIcon, ShieldCheck, Smartphone, Sparkles, Tablet, Target, Trash2, UserPlus, Users, Activity, CreditCard, Mail, Search, Minus, UserMinus, TrendingDown, X } from 'lucide-react'
import { AppShell, type Page } from './components/AppShell'
import { normalizeOriginName } from './lib/origin'
import { WeeklyReport, type ReportKind, type ReportData } from './components/reports/WeeklyReport'
import { WeeklyReportPage, WeeklyReportsAdmin } from './components/reports/WeeklyReportPage'
import { BrandLogo } from './components/BrandLogo'
import { MetricCard, DualMetricCard } from './components/Metrics'
import { Button } from './components/ui/Button'
import { AuthFlow, CONSENT_VERSION, type AuthFlowMode } from './components/AuthFlow'
import { LandingPage } from './components/LandingPage'
import { authHeaders, supabase } from './lib/supabase'
import { BusinessProvider, useBusiness, PLAN_DEFINITIONS, type BusinessItem, type SiteItem, type PlanMetadata } from './lib/business-context'
import { BrazilGeoMap } from './components/BrazilMap'
import * as R from './components/report/kit'
import { ResultsByType } from './components/report/ResultsByType'
import { sampleAnalytics } from './components/report/resultsSample'
import { Help } from './components/report/kit'

const ITEMS_PER_PAGE = 25

// Protótipo da página Resultados por tipo de site: só em desenvolvimento, com ?prototipo=<tipo>.
const PROTOTYPE_TYPE: SiteType | null = (() => { if (!import.meta.env.DEV) return null; const v = new URLSearchParams(window.location.search).get('prototipo'); return isSiteType(v) ? v : null })()
function TablePagination({ page, total, setPage }: { page: number, total: number, setPage: (page: number) => void }) { const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)); if (total <= ITEMS_PER_PAGE) return null; return <div className="table-pagination"><span>Mostrando {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, total)} de {total}</span><div><button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button><b>{page + 1} de {pages}</b><button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Próxima</button></div></div> }
function PageChart({ pages }: { pages: AnalyticsData['pages'] }) {
  const rows = pages.slice(0, 8).map(item => ({
    name: item.path === '/' ? 'Início' : item.path,
    fullPath: item.path,
    title: item.title || (item.path === '/' ? 'Página Inicial' : item.path),
    views: Number(item.views || 0)
  }));

  const totalTopViews = rows.reduce((sum, r) => sum + r.views, 0);

  return (
    <article className="chart-card">
      <div className="section-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h3 style={{ margin: 0 }}>Visualizações por página</h3>
            <div className="metric-info-wrapper" tabIndex={0} role="button" aria-label="Informações sobre o gráfico de visualizações por página">
              <Info size={14} className="metric-info-icon" />
              <div className="metric-tooltip-popover">
                <div className="metric-tooltip-title">Visualizações por Página</div>
                <div className="metric-tooltip-section">
                  <b>O que representa</b>
                  <p>As páginas do seu site ordenadas pelo volume total de acessos que receberam no período selecionado.</p>
                </div>
                <div className="metric-tooltip-section">
                  <b>Por que é importante</b>
                  <p>Identifica os conteúdos que geram mais tração e revela quais páginas merecem botões claros para iniciar contato.</p>
                </div>
                <div className="metric-tooltip-section tip">
                  <b><Lightbulb size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4, color: '#fbbf24' }} /> Como melhorar:</b>
                  <p>Se as páginas do topo tiverem poucos contatos, adicione chamadas para WhatsApp ou formulários curtos nelas.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="chart-header-caption">Ranking das páginas com maior tráfego para entender quais conteúdos atraem mais visitantes</p>
        </div>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 20, right: 12, left: -10, bottom: 4 }}>
            <defs>
              <linearGradient id="pageBarGradient" x1="0" x2="1">
                <stop offset="0" stopColor="#ff3cac"/>
                <stop offset="1" stopColor="#ff8a3d"/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E8EFEC"/>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as { name: string; fullPath: string; title: string; views: number };
                  const share = totalTopViews > 0 ? Math.round((data.views / totalTopViews) * 100) : 0;
                  return (
                    <div className="chart-rich-tooltip">
                      <div className="tooltip-title">{data.title}</div>
                      <div className="tooltip-path">{data.fullPath}</div>
                      <div className="tooltip-stat highlight">
                        <span>Visualizações de páginas:</span>
                        <b>{data.views.toLocaleString('pt-BR')}</b>
                      </div>
                      <div className="tooltip-share">
                        <span>Participação no top 8:</span>
                        <b>{share}%</b>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="views" name="Visualizações de páginas" fill="url(#pageBarGradient)" radius={[6, 6, 0, 0]}>
              <LabelList
                dataKey="views"
                position="top"
                fill="var(--foreground, #21463e)"
                fontSize={11}
                fontWeight={700}
                formatter={(val?: any) => (Number(val) > 0 ? Number(val).toLocaleString('pt-BR') : '')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend-row" style={{ marginTop: 12, borderTop: '1px dashed var(--border, #e5e7eb)', paddingTop: 10 }}>
        <div className="chart-legend-item">
          <span className="legend-bullet" style={{ background: 'linear-gradient(90deg, #ff3cac, #ff8a3d)' }} />
          <span>Visualizações por página</span>
        </div>
      </div>
    </article>
  );
}

function MetricChart({ analytics }: { analytics: AnalyticsData | null }) {
  const usesMonthlyGranularity = analytics?.sourceKind === 'ga4' && analytics.granularity && analytics.granularity !== 'daily';
  const rows = (analytics?.daily ?? []).map(item => ({
    ...item,
    label: item.date.slice(5).split('-').reverse().join('/'),
    views: Number(item.pageViews || 0)
  }));

  const totalPeriodViews = rows.reduce((sum, r) => sum + r.views, 0);

  return (
    <article className="chart-card">
      <div className="section-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h3 style={{ margin: 0 }}>Visualizações ao longo do período</h3>
            <div className="metric-info-wrapper" tabIndex={0} role="button" aria-label="Informações sobre o gráfico de evolução do tráfego">
              <Info size={14} className="metric-info-icon" />
              <div className="metric-tooltip-popover">
                <div className="metric-tooltip-title">Visualizações no Período</div>
                <div className="metric-tooltip-section">
                  <b>O que representa</b>
                  <p>{usesMonthlyGranularity ? 'Volume de páginas visualizadas no intervalo selecionado, consolidado por mês quando o histórico excede seis meses.' : 'Volume dia a dia de páginas visualizadas pelos visitantes no intervalo de datas selecionado.'}</p>
                </div>
                <div className="metric-tooltip-section">
                  <b>Por que é importante</b>
                  <p>Permite detectar picos após campanhas, postagens ou anúncios, além de dias com menor tráfego.</p>
                </div>
                <div className="metric-tooltip-section tip">
                  <b><Lightbulb size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4, color: '#fbbf24' }} /> Como melhorar:</b>
                  <p>Observe em quais dias da semana seu tráfego é mais alto para agendar envios de e-mail e novas ofertas.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="chart-header-caption">{usesMonthlyGranularity ? 'Evolução dos acessos no período, com consolidação mensal quando necessário' : 'Fluxo diário de acessos para identificar dias de maior movimento e tendência de crescimento'}</p>
        </div>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 22, right: 16, left: 16, bottom: 4 }}>
            <defs>
              <linearGradient id="realVisits" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#ff3cac" stopOpacity=".38"/>
                <stop offset=".55" stopColor="#ff8a3d" stopOpacity=".16"/>
                <stop offset="1" stopColor="#ff8a3d" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E8EFEC"/>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis hide domain={['auto', 'dataMax + 4']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as { label: string; date: string; pageViews: number; users: number; contacts: number };
                  const share = totalPeriodViews > 0 ? Math.round((Number(data.pageViews || 0) / totalPeriodViews) * 100) : 0;
                  return (
                    <div className="chart-rich-tooltip">
                      <div className="tooltip-title">Data: {data.label}</div>
                      <div className="tooltip-path">{data.date}</div>
                      <div className="tooltip-stat highlight">
                        <span>Visualizações de páginas:</span>
                        <b>{Number(data.pageViews || 0).toLocaleString('pt-BR')}</b>
                      </div>
                      <div className="tooltip-stat">
                        <span>Usuários únicos:</span>
                        <b>{Number(data.users || 0).toLocaleString('pt-BR')}</b>
                      </div>
                      {Number(data.contacts || 0) > 0 && (
                        <div className="tooltip-stat">
                          <span>Contatos:</span>
                          <b>{Number(data.contacts || 0).toLocaleString('pt-BR')}</b>
                        </div>
                      )}
                      <div className="tooltip-share">
                        <span>% do total do período:</span>
                        <b>{share}%</b>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="pageViews"
              name="Visualizações de páginas"
              stroke="#ff3cac"
              strokeWidth={3}
              fill="url(#realVisits)"
              dot={{ r: 3, fill: '#ff3cac', stroke: '#fff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#ff3cac' }}
            >
              <LabelList
                dataKey="pageViews"
                position="top"
                offset={10}
                fill="#ff3cac"
                fontSize={10}
                fontWeight={700}
                formatter={(val?: any) => (Number(val) > 0 ? Number(val).toLocaleString('pt-BR') : '')}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend-row" style={{ marginTop: 12, borderTop: '1px dashed var(--border, #e5e7eb)', paddingTop: 10 }}>
        <div className="chart-legend-item">
          <span className="legend-line pink" />
          <span>Visualizações no período</span>
        </div>
        <div className="chart-legend-item">
          <span className="legend-bullet orange" />
          <span>Picos de tráfego & finais de semana</span>
        </div>
      </div>
    </article>
  );
}

export { normalizeOriginName } from './lib/origin';

function OriginChart({ analytics }: { analytics: AnalyticsData | null }) {
  const aggregatedSources = (analytics?.sources ?? []).reduce<Array<{ name: string; value: number }>>((acc, curr) => {
    const normName = normalizeOriginName(curr.name);
    const val = Number(curr.value || 0);
    const existing = acc.find(item => item.name === normName);
    if (existing) {
      existing.value += val;
    } else {
      acc.push({ name: normName, value: val });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 7);

  const totalOriginViews = aggregatedSources.reduce((sum, s) => sum + s.value, 0);

  return (
    <article className="chart-card">
      <div className="section-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h3 style={{ margin: 0 }}>Origens dos acessos</h3>
            <div className="metric-info-wrapper" tabIndex={0} role="button" aria-label="Informações sobre o gráfico de origens dos acessos">
              <Info size={14} className="metric-info-icon" />
              <div className="metric-tooltip-popover">
                <div className="metric-tooltip-title">Origens dos Acessos</div>
                <div className="metric-tooltip-section">
                  <b>O que representa</b>
                  <p>Canais e plataformas de onde vieram as pessoas que entraram no seu site (ex: WhatsApp, Google, Instagram, Direto).</p>
                </div>
                <div className="metric-tooltip-section">
                  <b>Por que é importante</b>
                  <p>Mostra quais canais de divulgação trazem mais retorno real para você concentrar tempo e investimento neles.</p>
                </div>
                <div className="metric-tooltip-section tip">
                  <b><Lightbulb size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4, color: '#fbbf24' }} /> Como melhorar:</b>
                  <p>Se o canal 'Direto' for o maior, as pessoas chegam por links diretos no chat, favoritos ou digitando o endereço.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="chart-header-caption">Canais e plataformas de onde seu público chegou ao site (Google, redes sociais, direto)</p>
        </div>
      </div>
      <div className="chart origin-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregatedSources} layout="vertical" margin={{ top: 8, right: 38, left: 8, bottom: 4 }}>
            <defs>
              <linearGradient id="originBarGradient" x1="0" x2="1">
                <stop offset="0" stopColor="#ff3cac"/>
                <stop offset="1" stopColor="#ff8a3d"/>
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} stroke="#E8EFEC"/>
            <XAxis type="number" hide/>
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={105}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground, #59766e)', fontWeight: 600 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as { name: string; value: number };
                  const share = totalOriginViews > 0 ? Math.round((data.value / totalOriginViews) * 100) : 0;
                  return (
                    <div className="chart-rich-tooltip">
                      <div className="tooltip-title">{data.name}</div>
                      <div className="tooltip-stat highlight">
                        <span>Acessos no período:</span>
                        <b>{data.value.toLocaleString('pt-BR')}</b>
                      </div>
                      <div className="tooltip-share">
                        <span>Participação no top canais:</span>
                        <b>{share}%</b>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" name="Acessos" fill="url(#originBarGradient)" radius={[0, 6, 6, 0]} barSize={16}>
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                fill="var(--foreground, #21463e)"
                fontSize={11}
                fontWeight={700}
                formatter={(val?: any) => (Number(val) > 0 ? Number(val).toLocaleString('pt-BR') : '')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend-row" style={{ marginTop: 12, borderTop: '1px dashed var(--border, #e5e7eb)', paddingTop: 10 }}>
        <div className="chart-legend-item">
          <span className="legend-bullet" style={{ background: 'linear-gradient(90deg, #ff3cac, #ff8a3d)' }} />
          <span>Acessos por canal</span>
        </div>
      </div>
    </article>
  );
}

function PeakHoursMatrix({ peakHours }: { peakHours?: Array<{ dayOfWeek: number, hourOfDay: number, sessions: number, views: number, contacts: number }> }) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const matrix = useMemo(() => {
    const map = new Map<string, { sessions: number; views: number; contacts: number }>();
    let maxViews = 1;
    (peakHours ?? []).forEach(p => {
      const key = `${p.dayOfWeek}-${p.hourOfDay}`;
      const v = Number(p.views || p.sessions || 0);
      map.set(key, { sessions: Number(p.sessions || 0), views: v, contacts: Number(p.contacts || 0) });
      if (v > maxViews) maxViews = v;
    });
    return { map, maxViews };
  }, [peakHours]);

  return (
    <article className="table-card" style={{ marginTop: 24 }}>
      <div className="section-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock size={17} style={{ color: '#FF8A3D' }} />
            <h3 style={{ margin: 0 }}>Horários de maior movimento no site</h3>
            <div className="metric-info-wrapper" tabIndex={0} role="button" aria-label="Informações sobre a matriz de horários de pico">
              <Info size={14} className="metric-info-icon" />
              <div className="metric-tooltip-popover">
                <div className="metric-tooltip-title">Matriz de Horários de Pico</div>
                <div className="metric-tooltip-section">
                  <b>O que representa:</b>
                  <p>Volume de acessos cruzando o dia da semana com a hora do dia (0h às 23h).</p>
                </div>
                <div className="metric-tooltip-section">
                  <b>Por que importa:</b>
                  <p>Identifica os momentos exatos em que seu público está online para ativar anúncios e atendimento.</p>
                </div>
                <div className="metric-tooltip-section tip">
                  <b><Lightbulb size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4, color: '#fbbf24' }} /> Dica de Negócio:</b>
                  <p>Programe postagens e campanhas pagas para os horários de maior concentração de visitantes.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="chart-header-caption">Mapa térmico de acessos cruzando dias da semana e horários para programar anúncios e atendimento</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 680 }}>
          <div className="peak-hours-header">
            <div />
            {hours.map(h => (
              <div key={h} className="peak-hour-label">
                {h % 2 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {days.map((dayName, dIdx) => (
            <div key={dayName} className="peak-hours-grid">
              <div className="peak-day-label">{dayName}</div>
              {hours.map(h => {
                const item = matrix.map.get(`${dIdx}-${h}`);
                const views = item?.views || 0;
                const contacts = item?.contacts || 0;
                const intensity = matrix.maxViews > 0 ? (views / matrix.maxViews) : 0;

                let bgColor = 'var(--surface-subtle, #F3F4F6)';
                if (intensity > 0.75) bgColor = '#FF3CAC';
                else if (intensity > 0.50) bgColor = '#FF6374';
                else if (intensity > 0.25) bgColor = '#FF8A3D';
                else if (intensity > 0.05 || views > 0) bgColor = 'rgba(255, 138, 61, 0.35)';

                return (
                  <div
                    key={h}
                    className="peak-cell"
                    style={{ background: bgColor }}
                    title={`${dayName} às ${h}h: ${views} visualizações${contacts > 0 ? ` · ${contacts} contatos` : ''}`}
                  />
                );
              })}
            </div>
          ))}

          <div className="peak-matrix-legend">
            <span>0 acessos</span>
            <div className="peak-gradient-bar" title="Escala de volume de acessos" />
            <span>Pico máximo de acessos</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- utilitários compartilhados pelas telas de relatório ---------- */
function weightedExitRate(pages: AnalyticsData['pages'] = []): number | null {
  const valid = pages.filter(item => item.exitRate != null && Number(item.views || 0) > 0);
  const total = valid.reduce((sum, item) => sum + Number(item.views || 0), 0);
  if (!total) return null;
  return valid.reduce((sum, item) => sum + Number(item.exitRate || 0) * Number(item.views || 0), 0) / total;
}
const DEVICE_LABEL: Record<string, string> = { mobile: 'Celular', desktop: 'Computador', tablet: 'Tablet' };
const DEVICE_COLOR: Record<string, string> = { mobile: '#3B82F6', desktop: '#7C5CF0', tablet: '#FF8A3D' };
function deviceKey(raw?: string) { const s = (raw || 'desktop').toLowerCase(); return s === 'mobile' || s === 'tablet' ? s : s === 'desktop' ? 'desktop' : s; }
function aggregateDevices(devices: DeviceRow[] = []) {
  const map = new Map<string, { key: string, label: string, sessions: number, views: number, users: number, newUsers: number, conversions: number }>();
  devices.forEach(d => {
    const k = deviceKey(d.device);
    const cur = map.get(k) || { key: k, label: DEVICE_LABEL[k] || formatDeviceName(d.device), sessions: 0, views: 0, users: 0, newUsers: 0, conversions: 0 };
    cur.sessions += Number(d.sessions || 0); cur.views += Number(d.views || 0); cur.users += Number(d.users || 0);
    cur.newUsers += Number(d.newUsers || 0); cur.conversions += Number(d.conversions || 0);
    map.set(k, cur);
  });
  return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions);
}
function bestPeakCell(peakHours: R.PeakCell[] = []) {
  if (!peakHours.length) return null;
  return [...peakHours].sort((a, b) => Number(b.views || b.sessions || 0) - Number(a.views || a.sessions || 0))[0];
}
/** média de visualizações por dia da semana (só faz sentido agrupando por dia) */
function weekdayPattern(daily: AnalyticsData['daily'] = []) {
  if (daily.length < 7) return null;
  const sums = Array(7).fill(0), counts = Array(7).fill(0);
  daily.forEach(d => { const w = R.weekdayOf(d.date); sums[w] += Number(d.pageViews || 0); counts[w] += 1; });
  const avg = sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
  const best = avg.indexOf(Math.max(...avg));
  const weekdays = (avg[1] + avg[2] + avg[3] + avg[4] + avg[5]) / 5;
  const weekend = (avg[0] + avg[6]) / 2;
  return { best, weekendDiff: weekdays > 0 ? Math.round(((weekend - weekdays) / weekdays) * 100) : 0 };
}
function isSearchSource(name: string) { return /google|bing|yahoo|duckduckgo/i.test(name); }

function Dashboard() {
  const analytics = useAnalytics();
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [metric, setMetric] = useState<'pageViews' | 'users' | 'contacts'>('pageViews');
  const [dailyPage, setDailyPage] = useState(0);
  const [dailyTab, setDailyTab] = useState<'all' | 'conversions'>('all');
  const t = analytics?.totals;
  const p = analytics?.previousTotals;
  const daily = analytics?.daily ?? [];
  const days = analytics?.periodDays ?? selectedDays();
  const filter = readAnalyticsFilter();
  const exitRate = weightedExitRate(analytics?.pages);
  const devices = aggregateDevices(analytics?.devices);
  const devTotal = devices.reduce((a, d) => a + d.sessions, 0);
  const sources = (analytics?.sources ?? []).map(s => ({ name: normalizeOriginName(s.name), value: Number(s.value || 0) }));
  const srcTotal = sources.reduce((a, s) => a + s.value, 0);
  const topPages = [...(analytics?.pages ?? [])].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 4);
  const regions = new Map<string, number>();
  (analytics?.locations ?? []).forEach(l => { const k = l.region || 'Não identificado'; regions.set(k, (regions.get(k) || 0) + Number(l.views || 0)); });
  const regionTotal = Array.from(regions.values()).reduce((a, b) => a + b, 0);
  const topRegion = Array.from(regions.entries()).sort((a, b) => b[1] - a[1])[0];
  const peak = bestPeakCell(analytics?.peakHours);
  const pattern = filter.group === 'day' ? weekdayPattern(daily) : null;
  const whatsapp = Number(t?.whatsappContacts || 0), signups = Number(t?.signUps || 0), contacts = Number(t?.contacts || 0);
  const otherContacts = Math.max(contacts - whatsapp - signups, 0);
  const contactRate = t?.sessions ? (Number(t.contactSessions || contacts) / Number(t.sessions)) * 100 : 0;
  const labels = daily.map(d => R.shortDate(d.date));
  const metricInfo = {
    pageViews: { label: 'Visualizações', unit: 'visualizações', colors: ['#3B82F6', '#7C5CF0', '#FF3CAC'] },
    users: { label: 'Usuários', unit: 'pessoas', colors: ['#3B82F6', '#3B82F6', '#7C5CF0'] },
    contacts: { label: 'Contatos', unit: 'contatos', colors: ['#FF3CAC', '#FF3CAC', '#FF8A3D'] },
  }[metric];
  const series = daily.map(d => Number(d[metric] || 0));
  const filteredDaily = (dailyTab === 'conversions' ? daily.filter(d => Number(d.contacts || 0) > 0) : daily).slice().reverse();
  const visibleDays = filteredDaily.slice(dailyPage * ITEMS_PER_PAGE, (dailyPage + 1) * ITEMS_PER_PAGE);
  const maxViews = Math.max(...daily.map(d => Number(d.pageViews || 0)), 1);
  const goTo = (page: Page, path: string) => { window.history.pushState({}, '', `${path}${window.location.search}`); window.dispatchEvent(new PopStateEvent('popstate')); void page; };
  const periodLabel = `${R.shortDate(filter.start)} a ${R.shortDate(filter.end)} · ${days} ${days === 1 ? 'dia' : 'dias'}`;
  const usesMonthlyGranularity = Boolean(analytics?.sourceKind === 'ga4' && analytics.granularity && analytics.granularity !== 'daily');
  const unitWord = usesMonthlyGranularity ? 'período' : 'dia';

  return (
    <>
      <PageHeader report title="Visão geral" subtitle="Como o seu site foi no período, em um só lugar. Cada bloco leva para a tela com mais detalhes."
        guide={<><b>Como ler esta tela:</b> comece pela faixa escura, que mostra o caminho das pessoas, da chegada até o contato. Passe o mouse no <b>ⓘ</b> para entender cada número. As setas comparam com o período anterior: <b>verde é melhora</b> e <b>rosa é piora</b>.</>} />
      <AnalyticsFilters analytics={analytics} />
      <div className="rp">
        <R.Journey period={periodLabel}
          users={Number(t?.users || 0)} usersDelta={R.change(t?.users, p?.users)}
          newUsers={Number(t?.newUsers || 0)} newUsersDelta={R.change(t?.newUsers, p?.newUsers)}
          views={Number(t?.pageViews || 0)} viewsDelta={R.change(t?.pageViews, p?.pageViews)}
          attention={Number(t?.attentionSeconds || 0)} attentionDelta={R.change(t?.attentionSeconds, p?.attentionSeconds)}
          contacts={contacts} contactsDelta={R.change(t?.contacts, p?.contacts)}
          whatsapp={whatsapp} signups={signups} exitRate={exitRate} />

        <div className="rp-grid rp-g5">
          <R.Kpi label="Visualizações de páginas" value={R.fmt(t?.pageViews)} delta={R.change(t?.pageViews, p?.pageViews)} spark={daily.map(d => Number(d.pageViews || 0))}
            desc="Páginas abertas pelos visitantes" help={{ what: 'Total de páginas abertas no período. Se uma pessoa vê 3 páginas, conta 3.', why: 'Mostra o volume de interesse pelo seu conteúdo.' }} />
          <R.Kpi label="Usuários" value={R.fmt(t?.users)} delta={R.change(t?.users, p?.users)} spark={daily.map(d => Number(d.users || 0))}
            desc="Pessoas diferentes no site" help={{ what: 'Pessoas diferentes que visitaram o site. Quem voltou várias vezes conta uma vez.', why: 'É o tamanho real do seu público no período.' }} />
          <R.Kpi label="Novos usuários" value={R.fmt(t?.newUsers)} delta={R.change(t?.newUsers, p?.newUsers)}
            desc={t?.users ? `${Math.round(R.share(Number(t.newUsers || 0), Number(t.users)))}% vieram pela primeira vez` : 'Primeira visita ao site'}
            help={{ what: 'Pessoas que entraram no seu site pela primeira vez.', why: 'Mostra se o site está alcançando gente nova.', tip: 'Se cair, revise anúncios, redes sociais e o Google Meu Negócio.' }} />
          <R.Kpi label="Tempo de atenção" value={R.dur(t?.attentionSeconds)} delta={R.change(t?.attentionSeconds, p?.attentionSeconds)}
            desc="Média por visitante ativo" help={{ what: 'Tempo médio em que o site ficou aberto e visível na tela da pessoa.', why: 'Indica se o conteúdo está sendo lido de verdade.', tip: 'Acima de 1 minuto costuma ser bom para sites de serviços.' }} />
          <R.Kpi label="Contatos iniciados" value={R.fmt(t?.contacts)} delta={R.change(t?.contacts, p?.contacts)} spark={daily.map(d => Number(d.contacts || 0))} sparkColor="#FF3CAC"
            desc="Cliques para falar ou se cadastrar" help={{ what: 'Cliques em WhatsApp, telefone e formulários de cadastro.', why: 'É o número que mais se aproxima de novos clientes.', tip: 'Veja em Resultados quais páginas e botões geram mais contatos.' }} />
        </div>

        <div className="rp-grid rp-g2">
          <R.Card title={view === 'chart' ? `${metricInfo.label} ao longo do período` : (usesMonthlyGranularity ? 'Métricas por período' : 'Métricas dia a dia')}
            subtitle={view === 'chart' ? `Passe o mouse para ver cada ponto. A linha tracejada é a média do período.${usesMonthlyGranularity ? ' Acima de 6 meses, os pontos são mensais.' : ''}` : 'Histórico de acessos, visitantes e contatos, do mais recente para o mais antigo'}
            actions={<R.Tabs label="Forma de exibição" value={view} onChange={(v) => { setView(v); setDailyPage(0); }} options={[{ value: 'chart', label: 'Gráfico' }, { value: 'table', label: 'Tabela' }]} />}
            read={pattern && view === 'chart' ? <>Em média, <b>{R.WEEKDAYS[pattern.best]}</b> é o dia mais forte. {pattern.weekendDiff < -10 ? <>Os fins de semana têm cerca de <b>{Math.abs(pattern.weekendDiff)}% menos</b> acessos.</> : pattern.weekendDiff > 10 ? <>Os fins de semana têm cerca de <b>{pattern.weekendDiff}% mais</b> acessos.</> : <>Os fins de semana têm movimento parecido com os dias úteis.</>}</> : undefined}
            tip={view === 'chart' ? 'Publique novidades e anúncios um dia antes do seu dia mais forte para aproveitar o pico.' : undefined}>
            {view === 'chart' ? (
              <>
                <div style={{ marginBottom: 6 }}>
                  <R.Tabs label="Métrica do gráfico" value={metric} onChange={setMetric} options={[{ value: 'pageViews', label: 'Visualizações' }, { value: 'users', label: 'Usuários' }, { value: 'contacts', label: 'Contatos' }]} />
                </div>
                <R.TrendChart labels={labels} values={series} unit={metricInfo.unit} colors={metricInfo.colors}
                  detail={(i) => `${R.fmt(daily[i].users)} pessoas · ${R.fmt(daily[i].contacts)} contatos`} />
              </>
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <R.Tabs label="Dias exibidos" value={dailyTab} onChange={(v) => { setDailyTab(v); setDailyPage(0); }} options={[{ value: 'all', label: usesMonthlyGranularity ? 'Todos os períodos' : 'Todos os dias' }, { value: 'conversions', label: `Só ${unitWord}s com contato` }]} />
                </div>
                {visibleDays.length ? (
                  <div className="rp-tw"><table className="rp-t">
                    <thead><tr><th>Data</th><th>Visualizações</th><th className="r">Usuários</th><th className="r">Contatos</th></tr></thead>
                    <tbody>{visibleDays.map(d => (
                      <tr key={d.date}>
                        <td><b>{R.shortDate(d.date)}</b> <small className="m">{R.WEEKDAYS_SHORT[R.weekdayOf(d.date)]}</small></td>
                        <td><R.CellBar value={Number(d.pageViews || 0)} max={maxViews} /></td>
                        <td className="r num">{R.fmt(d.users)}</td>
                        <td className="r"><R.Chip tone={Number(d.contacts || 0) > 0 ? 'good' : 'neutral'}>{R.fmt(d.contacts)}</R.Chip></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                ) : <R.Empty>{dailyTab === 'conversions' ? 'Nenhum dia com contatos registrado no período.' : 'Ainda não recebemos acessos neste período.'}</R.Empty>}
                <R.Pager page={dailyPage} total={filteredDaily.length} perPage={ITEMS_PER_PAGE} setPage={setDailyPage} />
              </>
            )}
          </R.Card>

          <R.Card title="Horários de maior movimento" subtitle="Dias da semana × horas do dia. Quanto mais forte a cor, mais acessos."
            help={{ what: 'Cada quadrado é uma hora de um dia da semana. A cor mostra quantos acessos aconteceram ali, somando todo o período.', why: 'Ajuda a decidir quando atender, postar e anunciar.' }}
            read={peak ? <>O horário mais movimentado é <b>{R.WEEKDAYS[peak.dayOfWeek]}, entre {peak.hourOfDay}h e {peak.hourOfDay + 1}h</b>.</> : undefined}
            tip={peak ? 'Deixe alguém pronto para responder o WhatsApp nesse horário e programe anúncios para começar um pouco antes.' : undefined}>
            {(analytics?.peakHours ?? []).length ? <R.PeakGrid peakHours={analytics!.peakHours!} /> : <R.Empty>Ainda não há acessos suficientes para montar o mapa de horários.</R.Empty>}
          </R.Card>
        </div>

        <R.Section>Resumo das outras telas</R.Section>
        <div className="rp-grid rp-g4">
          <R.Card title="Como chegaram" actions={<button type="button" className="rp-link" onClick={() => goTo('acquisition', '/aquisicao')} title="Abrir Aquisição & Campanhas">Ver mais <ArrowRight size={14} /></button>} icon={<Compass size={16} />} subtitle="Acessos por canal"
            read={sources[0] ? <><b>{sources[0].name}</b> traz {Math.round(R.share(sources[0].value, srcTotal))}% dos acessos.</> : undefined}>
            <R.HBars rows={sources.slice(0, 4).map(s => ({ key: s.name, label: s.name, value: s.value }))} />
          </R.Card>
          <R.Card title="Quem são" actions={<button type="button" className="rp-link" onClick={() => goTo('audience', '/publico')} title="Abrir Público">Ver mais <ArrowRight size={14} /></button>} icon={<Users size={16} />} subtitle="Aparelho e região"
            read={devices[0] && devTotal ? <><b>{Math.round(R.share(devices[0].sessions, devTotal))}%</b> acessam pelo {devices[0].label.toLowerCase()}.</> : undefined}>
            <R.StackBar segments={devices.map(d => ({ value: d.sessions, color: DEVICE_COLOR[d.key] || '#9CA3AF', label: d.label }))} />
            <ul className="rp-list" style={{ marginTop: 8 }}>
              {devices.slice(0, 3).map(d => <li key={d.key}><i style={{ background: DEVICE_COLOR[d.key] || '#9CA3AF' }} />{d.label}<b>{Math.round(R.share(d.sessions, devTotal))}%</b></li>)}
              {topRegion && <li><i style={{ background: 'var(--rp-primary)' }} />{topRegion[0]}<b>{Math.round(R.share(topRegion[1], regionTotal))}%</b></li>}
            </ul>
          </R.Card>
          <R.Card title="Páginas que mais atraem" actions={<button type="button" className="rp-link" onClick={() => goTo('pages', '/paginas')} title="Abrir Páginas">Ver mais <ArrowRight size={14} /></button>} icon={<FileText size={16} />} subtitle="Visualizações por página">
            <R.HBars tone="blue" rows={topPages.map(pg => ({ key: pg.path, label: pg.title || pg.path, value: Number(pg.views || 0), title: pg.path }))} />
          </R.Card>
          <R.Card title="Contatos" actions={<button type="button" className="rp-link" onClick={() => goTo('results', '/resultados')} title="Abrir Resultados">Ver mais <ArrowRight size={14} /></button>} icon={<Target size={16} />} subtitle="Por onde falaram com você">
            <div className="rp-dn" style={{ gap: 14 }}>
              <R.Donut size={84} center={R.fmt(contacts)} centerLabel="contatos" segments={[{ value: whatsapp, color: '#FF3CAC' }, { value: signups, color: '#FF8A3D' }, { value: otherContacts, color: '#7C5CF0' }]} />
              <ul className="rp-list" style={{ flex: 1, minWidth: 0 }}>
                <li><i style={{ background: '#FF3CAC' }} />WhatsApp<b>{R.fmt(whatsapp)}</b></li>
                <li><i style={{ background: '#FF8A3D' }} />Cadastros<b>{R.fmt(signups)}</b></li>
                {otherContacts > 0 && <li><i style={{ background: '#7C5CF0' }} />Outros<b>{R.fmt(otherContacts)}</b></li>}
                <li><i style={{ background: 'var(--rp-track)' }} />Taxa<b>{t?.sessions ? R.fmtPct(contactRate) : '—'}</b></li>
              </ul>
            </div>
          </R.Card>
        </div>
      </div>
    </>
  );
}

/** campanha válida: ignora vazio e os marcadores "(not set)" / "(none)" do GA4 */
function hasCampaign(campaign?: string) {
  const c = (campaign || '').trim().toLowerCase();
  return c.length > 0 && c !== '(not set)' && c !== '(none)' && c !== 'not set';
}
/** tráfego pago: mídia de anúncio ou link com campanha UTM */
function isPaidTraffic(item: { source?: string, medium?: string, campaign?: string }) {
  return /cpc|ppc|paid|ads|adwords|sponsored/i.test(item.medium || '') || /ads$|adwords/i.test(item.source || '') || hasCampaign(item.campaign);
}

function Acquisition() {
  const analytics = useAnalytics();
  const [acqTab, setAcqTab] = useState<'source' | 'campaign' | 'content' | 'term'>('source');
  const [acqPage, setAcqPage] = useState(0);

  const rawSm = analytics?.sourceMediumResults ?? [];
  const topSource = analytics?.sources?.[0];

  const { organic, paid, bestAd } = useMemo(() => {
    let orgSessions = 0;
    let orgContacts = 0;
    let paidSessions = 0;
    let paidContacts = 0;
    let topAd: { name: string; channel: string; contacts: number; convRate: number } | null = null;

    rawSm.forEach(item => {
      const isPaid = /cpc|ppc|paid|ads|adwords|meta|sponsored/i.test((item.medium || '') + (item.source || '')) || Boolean(item.campaign && item.campaign.trim().length > 0);
      const sess = Number(item.sessions || 0);
      const cont = Number(item.whatsappClicks || item.contactClicks || 0);

      if (isPaid) {
        paidSessions += sess;
        paidContacts += cont;
      } else {
        orgSessions += sess;
        orgContacts += cont;
      }

      if (item.campaign && cont > (topAd?.contacts || 0)) {
        topAd = {
          name: item.campaign,
          channel: `${item.source} / ${item.medium}`,
          contacts: cont,
          convRate: sess > 0 ? (cont / sess) * 100 : 0
        };
      }
    });

    const total = orgSessions + paidSessions;
    const orgShare = total > 0 ? `${Math.round((orgSessions / total) * 100)}%` : '—';
    const paidShare = total > 0 ? `${Math.round((paidSessions / total) * 100)}%` : '—';
    const orgConvRate = orgSessions > 0 ? `${((orgContacts / orgSessions) * 100).toFixed(1).replace('.', ',')}%` : '—';
    const paidConvRate = paidSessions > 0 ? `${((paidContacts / paidSessions) * 100).toFixed(1).replace('.', ',')}%` : '—';

    return {
      organic: { sessions: orgSessions, share: orgShare, contacts: orgContacts, convRate: orgConvRate },
      paid: { sessions: paidSessions, share: paidShare, contacts: paidContacts, convRate: paidConvRate },
      bestAd: topAd || (rawSm[0]?.campaign ? {
        name: rawSm[0].campaign,
        channel: `${rawSm[0].source} / ${rawSm[0].medium}`,
        contacts: Number(rawSm[0].whatsappClicks || 0),
        convRate: Number(rawSm[0].sessions || 0) > 0 ? (Number(rawSm[0].whatsappClicks || 0) / Number(rawSm[0].sessions)) * 100 : 0
      } : null)
    };
  }, [rawSm]);

  const tableItems = useMemo(() => {
    if (acqTab === 'source') {
      const map = new Map<string, { key: string; label: string; sub?: string; sessions: number; views: number; users: number; contacts: number }>();
      rawSm.forEach(item => {
        const k = `${item.source || '(direto)'} / ${item.medium || '(nenhum)'}`;
        const cur = map.get(k) || { key: k, label: k, sessions: 0, views: 0, users: 0, contacts: 0 };
        cur.sessions += Number(item.sessions || 0);
        cur.views += Number(item.views || item.pageViews || 0);
        cur.users += Number(item.users || 0);
        cur.contacts += Number(item.whatsappClicks || item.contactClicks || 0);
        map.set(k, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions || b.contacts - a.contacts);
    }
    if (acqTab === 'campaign') {
      const map = new Map<string, { key: string; label: string; sub?: string; sessions: number; views: number; users: number; contacts: number }>();
      rawSm.filter(item => Boolean(item.campaign && item.campaign.trim().length > 0)).forEach(item => {
        const k = item.campaign;
        const cur = map.get(k) || { key: k, label: k, sub: `${item.source} / ${item.medium}`, sessions: 0, views: 0, users: 0, contacts: 0 };
        cur.sessions += Number(item.sessions || 0);
        cur.views += Number(item.views || item.pageViews || 0);
        cur.users += Number(item.users || 0);
        cur.contacts += Number(item.whatsappClicks || item.contactClicks || 0);
        map.set(k, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.contacts - a.contacts || b.sessions - a.sessions);
    }
    return rawSm.map(item => ({
      key: `${item.source}-${item.medium}-${item.campaign}`,
      label: item.campaign || `${item.source} / ${item.medium}`,
      sub: `${item.source} / ${item.medium}`,
      sessions: Number(item.sessions || 0),
      views: Number(item.views || item.pageViews || 0),
      users: Number(item.users || 0),
      contacts: Number(item.whatsappClicks || item.contactClicks || 0)
    })).sort((a, b) => b.contacts - a.contacts || b.sessions - a.sessions);
  }, [rawSm, acqTab]);

  const visibleItems = tableItems.slice(acqPage * ITEMS_PER_PAGE, (acqPage + 1) * ITEMS_PER_PAGE);
  const maxSessions = Math.max(...tableItems.map(i => i.sessions), 1);
  const sources = (analytics?.sources ?? []).map(s => ({ name: normalizeOriginName(s.name), value: Number(s.value || 0) }));
  const srcTotal = sources.reduce((a, s) => a + s.value, 0);
  const totalSessions = organic.sessions + paid.sessions;
  const orgRate = organic.sessions ? (organic.contacts / organic.sessions) * 100 : 0;
  const paidRate = paid.sessions ? (paid.contacts / paid.sessions) * 100 : 0;
  const channelRates = useMemo(() => {
    const map = new Map<string, { key: string, label: string, sub: string, paid: boolean, sessions: number, contacts: number }>();
    rawSm.forEach(item => {
      const k = `${item.source || '(direto)'}|${item.medium || '(nenhum)'}`;
      const cur = map.get(k) || { key: k, label: normalizeOriginName(item.source), sub: formatMediumName(item.medium), paid: isPaidTraffic(item), sessions: 0, contacts: 0 };
      cur.sessions += Number(item.sessions || 0);
      cur.contacts += Number(item.whatsappClicks || item.contactClicks || 0);
      map.set(k, cur);
    });
    return Array.from(map.values()).filter(c => c.sessions >= 10).map(c => ({ ...c, rate: (c.contacts / c.sessions) * 100 })).sort((a, b) => b.rate - a.rate).slice(0, 7);
  }, [rawSm]);
  const avgRate = totalSessions ? ((organic.contacts + paid.contacts) / totalSessions) * 100 : 0;
  const bestChannel = channelRates[0];
  const tabHelp: Record<typeof acqTab, string> = {
    source: 'Cada linha é uma combinação de origem (de onde veio) e mídia (tipo de tráfego).',
    campaign: 'Só o tráfego que veio com nome de campanha no link (parâmetro utm_campaign).',
    content: 'Variações de anúncio ou criativo, quando o link tem o parâmetro utm_content.',
    term: 'Palavras-chave das campanhas, quando o link tem o parâmetro utm_term.',
  };

  return (
    <>
      <PageHeader report title="Aquisição & Campanhas" subtitle="Como as pessoas encontram o seu site e quais canais, anúncios e criativos trazem mais contatos."
        guide={<><b>Como ler esta tela:</b> <b>espontâneo</b> é quem chegou sozinho (pesquisa no Google, redes sociais sem anúncio, quem digitou o endereço). <b>Pago</b> é quem veio de anúncios. O que importa não é só o volume, mas <b>quantos viram contato</b>.</>} />
      <AnalyticsFilters analytics={analytics} />
      <div className="rp">
        <div className="rp-grid rp-g2">
          <R.Card title="Tráfego espontâneo × pago" subtitle="Visitas que chegaram sozinhas comparadas às que vieram de anúncios"
            help={{ what: 'Separa as visitas que vieram de anúncios (Google Ads, Meta Ads, links com campanha) das que chegaram de forma natural.', why: 'Mostra quanto o seu site depende de anúncio para ter movimento.' }}
            read={totalSessions ? (paid.sessions && organic.sessions
              ? <>Os anúncios trazem <b>{Math.round(R.share(paid.sessions, totalSessions))}%</b> das visitas e convertem <b>{R.fmtPct(paidRate)}</b>, contra <b>{R.fmtPct(orgRate)}</b> do tráfego espontâneo.</>
              : paid.sessions ? <>Todo o tráfego do período veio de anúncios.</> : <>Nenhuma visita veio de anúncios neste período. Todo o movimento foi espontâneo.</>) : undefined}
            tip={paid.sessions && organic.sessions ? (paidRate > orgRate * 1.2 ? 'Os anúncios trazem gente mais decidida. Vale manter as campanhas que mais convertem e pausar as que só trazem visitas.' : 'O tráfego espontâneo converte tão bem quanto o pago. Invista em conteúdo e no seu perfil do Google para crescer sem depender de anúncio.') : 'Para medir anúncios, use links com parâmetros UTM (utm_source, utm_medium e utm_campaign).'}>
            {totalSessions ? (
              <>
                <div className="rp-split">
                  {organic.sessions > 0 && <div style={{ width: `${R.share(organic.sessions, totalSessions)}%`, background: 'linear-gradient(100deg,#3B82F6,#7C5CF0)' }}>Espontâneo {Math.round(R.share(organic.sessions, totalSessions))}%</div>}
                  {paid.sessions > 0 && <div style={{ flex: 1, background: 'linear-gradient(100deg,#FF3CAC,#FF8A3D)' }}>Pago {Math.round(R.share(paid.sessions, totalSessions))}%</div>}
                </div>
                <div className="rp-grid rp-g2e" style={{ marginTop: 12, gap: 12 }}>
                  <div className="rp-mini"><span className="t">Espontâneo</span><b className="num">{R.fmt(organic.sessions)} visitas</b><small>{R.fmt(organic.contacts)} contatos · taxa de contato {organic.convRate}</small></div>
                  <div className="rp-mini"><span className="t">Pago (anúncios)</span><b className="num">{R.fmt(paid.sessions)} visitas</b><small>{R.fmt(paid.contacts)} contatos · taxa de contato {paid.convRate}</small></div>
                </div>
              </>
            ) : <R.Empty>Ainda não há visitas neste período.</R.Empty>}
          </R.Card>
          <div className="rp-grid rp-g2e" style={{ marginTop: 0 }}>
            <R.Kpi label="Origem principal" text value={topSource?.name ? normalizeOriginName(topSource.name) : '—'}
              desc={topSource && srcTotal ? `${Math.round(R.share(Number(topSource.value), srcTotal))}% dos acessos · ${R.fmt(topSource.value)} acessos` : 'Sem dados no período'}
              help={{ what: 'O canal que mais trouxe visitas no período.', tip: 'Se um único canal traz quase tudo, vale diversificar para não depender dele.' }} />
            <R.Kpi label="Melhor campanha" text value={bestAd?.name || '—'}
              desc={bestAd ? `${bestAd.channel} · ${bestAd.contacts} contatos (${R.fmtPct(bestAd.convRate)})` : 'Nenhuma campanha com UTM no período'}
              help={{ what: 'A campanha (utm_campaign) que mais gerou contatos.', why: 'Mostra onde o dinheiro de anúncio está rendendo mais.' }} />
            <R.Kpi label="Canais ativos" value={R.fmt(channelRates.length || new Set(rawSm.map(i => `${i.source}|${i.medium}`)).size)} desc="Combinações de origem e mídia com visitas"
              help={{ what: 'Quantas fontes diferentes (Google, Instagram, anúncios…) trouxeram visitas.' }} />
            <R.Kpi label="Contatos de anúncios" value={R.fmt(paid.contacts)}
              desc={organic.contacts + paid.contacts ? `${Math.round(R.share(paid.contacts, organic.contacts + paid.contacts))}% de todos os contatos` : 'Sem contatos no período'}
              help={{ what: 'Contatos (WhatsApp e formulários) de quem chegou por anúncio.' }} />
          </div>
        </div>

        <div className="rp-grid rp-g2e">
          <R.Card title="Origens dos acessos" subtitle="Quantos acessos vieram de cada canal"
            help={{ what: '"Direto" é quem digitou o endereço, usou um favorito ou abriu o link por um aplicativo que não informa a origem (como o WhatsApp).' }}
            read={sources[0] ? <><b>{sources[0].name}</b> responde por {Math.round(R.share(sources[0].value, srcTotal))}% dos acessos{sources[1] ? <>, seguido por <b>{sources[1].name}</b> ({Math.round(R.share(sources[1].value, srcTotal))}%)</> : null}.</> : undefined}>
            <R.HBars rows={sources.map(s => ({ key: s.name, label: s.name, value: s.value, display: <>{R.fmt(s.value)} <small style={{ color: 'var(--rp-muted)', fontWeight: 400 }}>{Math.round(R.share(s.value, srcTotal))}%</small></> }))} />
          </R.Card>
          <R.Card title="Qual canal converte melhor" subtitle="De cada 100 visitas de cada canal, quantas viraram contato"
            help={{ what: 'Taxa de conversão = contatos ÷ visitas de cada canal. Só mostramos canais com pelo menos 10 visitas, para evitar números enganosos.', why: 'Um canal com poucas visitas e muita conversão pode valer mais que um canal grande que não converte.' }}
            read={bestChannel ? <><b>{bestChannel.label}</b> ({bestChannel.sub}) converte <b>{R.fmtPct(bestChannel.rate)}</b>. A média do site é {R.fmtPct(avgRate)}.</> : undefined}
            tip={bestChannel ? 'Coloque mais energia nos canais do topo desta lista. São eles que trazem gente pronta para falar com você.' : undefined}>
            {channelRates.length ? (
              <R.HBars max={Math.max(...channelRates.map(c => c.rate), 0.1)} rows={channelRates.map(c => ({
                key: c.key, tone: c.paid ? 'pink' : 'blue', value: c.rate, display: R.fmtPct(c.rate),
                label: <>{c.label} <R.Chip tone={c.paid ? 'brand' : 'neutral'}>{c.paid ? 'anúncio' : 'espontâneo'}</R.Chip></>,
                sub: `${R.fmt(c.sessions)} visitas`,
              }))} />
            ) : <R.Empty>Ainda não há canais com visitas suficientes para comparar.</R.Empty>}
          </R.Card>
        </div>

        <div className="rp-grid">
          <R.Card title="Desempenho por canal e criativo" subtitle={tabHelp[acqTab]}
            help={{ what: 'UTM são etiquetas que você coloca no final dos links dos anúncios e posts (ex.: ?utm_source=instagram&utm_campaign=promo). Com elas, o Analizi sabe exatamente de onde veio cada visita.', tip: 'Use o mesmo padrão de nomes em todas as campanhas para comparar com facilidade.' }}
            actions={<R.Tabs label="Agrupar tabela" value={acqTab} onChange={(v) => { setAcqTab(v); setAcqPage(0); }} options={[{ value: 'source', label: 'Origem / Mídia' }, { value: 'campaign', label: 'Campanhas' }, { value: 'content', label: 'Criativos' }, { value: 'term', label: 'Termos' }]} />}>
            {visibleItems.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>Canal / campanha</th><th>Sessões</th><th className="r">Usuários</th><th className="r">Contatos</th><th className="r">Taxa de contato <Help align="right" title="Taxa de contato" what="Contatos ÷ sessões do canal." tip="Verde: acima de 3%. Laranja: abaixo de 1%." /></th></tr></thead>
                <tbody>{visibleItems.map(item => {
                  const conv = item.sessions > 0 ? (item.contacts / item.sessions) * 100 : 0;
                  return (
                    <tr key={item.key}>
                      <td className="pg"><b>{item.label}</b>{item.sub && <small>{item.sub}</small>}</td>
                      <td><R.CellBar value={item.sessions} max={maxSessions} /></td>
                      <td className="r num">{R.fmt(item.users)}</td>
                      <td className="r num"><b>{R.fmt(item.contacts)}</b></td>
                      <td className="r"><R.Chip tone={conv >= 3 ? 'good' : conv >= 1 ? 'neutral' : 'warn'}>{R.fmtPct(conv)}</R.Chip></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            ) : <R.Empty>{acqTab === 'campaign' ? 'Nenhuma campanha com UTM no período. Adicione utm_campaign nos links dos seus anúncios para vê-las aqui.' : 'Nenhum dado de aquisição para os filtros e a aba selecionados.'}</R.Empty>}
            <R.Pager page={acqPage} total={tableItems.length} perPage={ITEMS_PER_PAGE} setPage={setAcqPage} />
          </R.Card>
        </div>
      </div>
    </>
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil',
  US: 'Estados Unidos',
  PT: 'Portugal',
  AR: 'Argentina',
  UY: 'Uruguai',
  PY: 'Paraguai',
  CL: 'Chile',
  CO: 'Colômbia',
  MX: 'México',
  PE: 'Peru',
  ES: 'Espanha',
  FR: 'França',
  DE: 'Alemanha',
  IT: 'Itália',
  GB: 'Reino Unido',
  CA: 'Canadá',
  JP: 'Japão',
  AU: 'Austrália',
  AO: 'Angola',
  MZ: 'Moçambique',
  CH: 'Suíça',
  NL: 'Países Baixos',
  IE: 'Irlanda'
}

function formatCountryName(code?: string): string {
  if (!code) return 'Não identificado'
  const clean = code.trim().toUpperCase()
  if (COUNTRY_NAMES[clean]) return `${COUNTRY_NAMES[clean]} (${clean})`
  return clean
}

function formatDeviceName(raw?: string): string {
  if (!raw) return 'Desktop'
  const s = raw.trim().toLowerCase()
  if (s === 'mobile') return 'Mobile (Celular)'
  if (s === 'tablet') return 'Tablet'
  if (s === 'desktop') return 'Desktop (Computador)'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function formatMediumName(raw?: string): string {
  if (!raw) return 'direto'
  const s = raw.trim().toLowerCase()
  if (s === '' || s === 'none' || s === '(none)' || s === 'null') return 'direto'
  return s
}

function Audience() {
  const analytics = useAnalytics();
  const [sourcePage, setSourcePage] = useState(0);
  const [sourceTab, setSourceTab] = useState<'all' | 'top'>('all');
  const [devicePage, setDevicePage] = useState(0);
  const [deviceTab, setDeviceTab] = useState<'devices' | 'browsers'>('devices');
  const [locationPage, setLocationPage] = useState(0);
  const [locationTab, setLocationTab] = useState<'cities' | 'regions' | 'countries'>('cities');
  const sourcePages = analytics?.sourcePages ?? [];
  const rawDevices = analytics?.devices ?? [];
  const rawLocations = analytics?.locations ?? [];
  const p = analytics?.previousTotals;
  const filteredSources = sourceTab === 'top' ? sourcePages.slice(0, 10) : sourcePages;
  const visibleSources = filteredSources.slice(sourcePage * ITEMS_PER_PAGE, (sourcePage + 1) * ITEMS_PER_PAGE);
  const topSource = analytics?.sources?.[0];
  const topShare = analytics?.totals?.pageViews && topSource ? `${Math.round((Number(topSource.value) / Number(analytics.totals.pageViews)) * 100)}%` : '—';

  const aggregatedDevices = (() => {
    if (deviceTab === 'devices') {
      const map = new Map<string, { key: string; device: string; browser: string; sessions: number; views: number; users: number; newUsers: number; conversions: number }>();
      for (const d of rawDevices) {
        const devKey = (d.device || 'desktop').toLowerCase();
        const cur = map.get(devKey);
        if (cur) {
          cur.sessions += Number(d.sessions || 0);
          cur.views += Number(d.views || 0);
          cur.users += Number(d.users || 0);
          cur.newUsers += Number(d.newUsers || 0);
          cur.conversions += Number(d.conversions || 0);
        } else {
          map.set(devKey, {
            key: devKey,
            device: formatDeviceName(d.device),
            browser: 'Todos os navegadores',
            sessions: Number(d.sessions || 0),
            views: Number(d.views || 0),
            users: Number(d.users || 0),
            newUsers: Number(d.newUsers || 0),
            conversions: Number(d.conversions || 0)
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.views - a.views || b.sessions - a.sessions);
    }
    return rawDevices.map((d, i) => ({
      key: `${d.device}-${d.browser}-${i}`,
      device: formatDeviceName(d.device),
      browser: d.browser || 'Outro',
      sessions: Number(d.sessions || 0),
      views: Number(d.views || 0),
      users: Number(d.users || 0),
      newUsers: Number(d.newUsers || 0),
      conversions: Number(d.conversions || 0)
    }));
  })();

  const totalDeviceViews = aggregatedDevices.reduce((sum, item) => sum + item.views, 0);
  const visibleDevices = aggregatedDevices.slice(devicePage * ITEMS_PER_PAGE, (devicePage + 1) * ITEMS_PER_PAGE);

  const aggregatedLocations = (() => {
    if (locationTab === 'cities') {
      return rawLocations.map((loc) => ({
        key: `${loc.country}-${loc.region}-${loc.city}`,
        city: loc.city || 'Não identificada',
        region: loc.region || 'Não identificado',
        country: formatCountryName(loc.country),
        views: Number(loc.views || 0),
        users: Number(loc.users || 0),
        conversions: Number(loc.conversions || 0)
      }));
    }
    if (locationTab === 'regions') {
      const map = new Map<string, { key: string; city: string; region: string; country: string; views: number; users: number; conversions: number }>();
      for (const loc of rawLocations) {
        const reg = loc.region || 'Não identificado';
        const ctry = formatCountryName(loc.country);
        const k = `${loc.country}-${reg}`;
        const cur = map.get(k);
        if (cur) {
          cur.views += Number(loc.views || 0);
          cur.users += Number(loc.users || 0);
          cur.conversions += Number(loc.conversions || 0);
        } else {
          map.set(k, {
            key: k,
            city: 'Todos os municípios',
            region: reg,
            country: ctry,
            views: Number(loc.views || 0),
            users: Number(loc.users || 0),
            conversions: Number(loc.conversions || 0)
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.views - a.views);
    }
    const map = new Map<string, { key: string; city: string; region: string; country: string; views: number; users: number; conversions: number }>();
    for (const loc of rawLocations) {
      const ctry = formatCountryName(loc.country);
      const k = loc.country || 'XX';
      const cur = map.get(k);
      if (cur) {
        cur.views += Number(loc.views || 0);
        cur.users += Number(loc.users || 0);
        cur.conversions += Number(loc.conversions || 0);
      } else {
        map.set(k, {
          key: k,
          city: 'Todas as cidades',
          region: 'Todos os estados',
          country: ctry,
          views: Number(loc.views || 0),
          users: Number(loc.users || 0),
          conversions: Number(loc.conversions || 0)
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.views - a.views);
  })();

  const visibleLocations = aggregatedLocations.slice(locationPage * ITEMS_PER_PAGE, (locationPage + 1) * ITEMS_PER_PAGE);
  const topLocation = rawLocations[0];
  const topLocationLabel = topLocation
    ? topLocation.city && topLocation.city !== 'Não identificada'
      ? topLocation.city
      : topLocation.region && topLocation.region !== 'Não identificado'
      ? topLocation.region
      : formatCountryName(topLocation.country)
    : '—';
  const topLocationSub = topLocation
    ? `${topLocation.region && topLocation.region !== 'Não identificado' ? `${topLocation.region} · ` : ''}${formatCountryName(topLocation.country)}`
    : undefined;

  const totals = analytics?.totals;
  const users = Number(totals?.users || 0), newUsers = Number(totals?.newUsers || 0);
  const returning = Math.max(users - newUsers, 0);
  const devAgg = aggregateDevices(rawDevices);
  const devTotal = devAgg.reduce((a, d) => a + d.sessions, 0);
  const mobile = devAgg.find(d => d.key === 'mobile');
  const sources = (analytics?.sources ?? []).map(s => ({ name: normalizeOriginName(s.name), value: Number(s.value || 0) }));
  const srcTotal = sources.reduce((a, s) => a + s.value, 0);
  const locTotal = rawLocations.reduce((a, l) => a + Number(l.views || 0), 0);
  const regionsAgg = new Map<string, number>();
  rawLocations.forEach(l => { const k = l.region || 'Não identificado'; regionsAgg.set(k, (regionsAgg.get(k) || 0) + Number(l.views || 0)); });
  const topRegionEntry = Array.from(regionsAgg.entries()).sort((a, b) => b[1] - a[1])[0];
  // matriz canal × página (top 4 canais e top 5 páginas)
  const matrix = useMemo(() => {
    const byChannel = new Map<string, number>(), byPage = new Map<string, number>(), cell = new Map<string, number>();
    sourcePages.forEach(item => {
      const ch = normalizeOriginName(item.source); const v = Number(item.views || 0);
      byChannel.set(ch, (byChannel.get(ch) || 0) + v); byPage.set(item.path, (byPage.get(item.path) || 0) + v);
      cell.set(`${ch}|${item.path}`, (cell.get(`${ch}|${item.path}`) || 0) + v);
    });
    const channels = Array.from(byChannel.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
    const paths = Array.from(byPage.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const max = Math.max(...Array.from(cell.values()), 1);
    return { channels, paths, cell, max };
  }, [sourcePages]);
  const pageTitle = (path: string) => analytics?.pages?.find(pg => pg.path === path)?.title || (path === '/' ? 'Página inicial' : path);
  const maxDevSessions = Math.max(...aggregatedDevices.map(d => d.sessions), 1);
  const maxLocViews = Math.max(...aggregatedLocations.map(l => l.views), 1);
  const instagramTop = matrix.channels.includes('Instagram') ? matrix.paths.reduce<{ path: string, v: number } | null>((best, path) => { const v = matrix.cell.get(`Instagram|${path}`) || 0; return !best || v > best.v ? { path, v } : best; }, null) : null;

  return (
    <>
      <PageHeader report title="Seu público" subtitle="Quem são, de onde vêm e como acessam o seu site."
        guide={<><b>Como ler esta tela:</b> <b>sessões</b> são visitas e <b>usuários</b> são pessoas. Uma pessoa que entrou 3 vezes conta 1 usuário e 3 sessões. Use esta tela para saber <b>em qual aparelho testar o site</b> e <b>onde anunciar</b>.</>} />
      <AnalyticsFilters analytics={analytics}/>
      <div className="rp">
        <div className="rp-grid rp-g5">
          <R.Kpi label="Sessões" value={R.fmt(totals?.sessions)} delta={R.change(totals?.sessions, p?.sessions)} desc="Visitas recebidas no período"
            help={{ what: 'Cada vez que alguém abre o site conta uma sessão. A mesma pessoa pode ter várias.', why: 'Mede o movimento total do site.' }} />
          <R.Kpi label="Usuários" value={R.fmt(users)} delta={R.change(users, p?.users)} desc="Pessoas diferentes"
            help={{ what: 'Pessoas diferentes que visitaram o site no período.' }} />
          <R.Kpi label="Novos usuários" value={R.fmt(newUsers)} delta={R.change(newUsers, p?.newUsers)} desc="Primeira visita ao site"
            help={{ what: 'Pessoas que entraram no site pela primeira vez.', tip: 'Se a maioria é nova, foque em fazer o primeiro contato fácil (WhatsApp visível).' }} />
          <R.Kpi label="Origem principal" text value={topSource?.name ? normalizeOriginName(topSource.name) : '—'} desc={topSource ? `${topShare} do tráfego` : 'Sem dados'}
            help={{ what: 'Canal que mais trouxe visitas. Veja detalhes em Aquisição & Campanhas.' }} />
          <R.Kpi label="Localização principal" text value={topLocationLabel} desc={topLocation ? `${topLocationSub ?? ''} · ${R.fmt(topLocation.views)} visualizações` : 'Sem dados'}
            help={{ what: 'Cidade de onde vem a maior parte dos acessos, identificada pela conexão de internet.', why: 'Ajuda a escolher a região dos anúncios.' }} />
        </div>

        <div className="rp-grid rp-g3">
          <R.Card title="Novos × recorrentes" subtitle="Quem veio pela primeira vez e quem voltou"
            help={{ what: 'Recorrentes são pessoas que já tinham visitado o site antes deste período ou dentro dele.', why: 'Quem volta costuma estar mais perto de virar cliente.' }}
            read={users ? <>A cada 10 pessoas, <b>{Math.round(R.share(returning, users) / 10)}</b> já conheciam o site.</> : undefined}
            tip={users && R.share(returning, users) < 20 ? 'Poucos voltam. Ofereça um motivo para retornar: blog, novidades ou um lembrete pelo WhatsApp.' : users ? 'Boa lembrança de marca. Mantenha o site atualizado para quem volta encontrar novidades.' : undefined}>
            {users ? (
              <div className="rp-dn">
                <R.Donut center={R.fmt(users)} centerLabel="pessoas" segments={[{ value: newUsers, color: '#3B82F6' }, { value: returning, color: '#FF3CAC' }]} />
                <ul className="rp-list" style={{ flex: 1, minWidth: 0 }}>
                  <li><i style={{ background: '#3B82F6' }} />Novos<b>{R.fmt(newUsers)}</b><small>{Math.round(R.share(newUsers, users))}% · primeira visita</small></li>
                  <li><i style={{ background: '#FF3CAC' }} />Voltaram<b>{R.fmt(returning)}</b><small>{Math.round(R.share(returning, users))}% · já conheciam</small></li>
                </ul>
              </div>
            ) : <R.Empty>Ainda não há visitantes neste período.</R.Empty>}
          </R.Card>
          <R.Card title="Aparelhos" subtitle="Por onde as pessoas acessam"
            read={mobile && devTotal ? <><b>{Math.round(R.share(mobile.sessions, devTotal))}%</b> das visitas são pelo celular.</> : undefined}
            tip={mobile && R.share(mobile.sessions, devTotal) > 50 ? 'A maioria usa celular. Sempre teste o site no telefone e deixe o botão de WhatsApp fácil de tocar.' : devTotal ? 'Boa parte usa computador. Capriche em fotos e textos mais completos.' : undefined}>
            {devTotal ? (
              <>
                <R.StackBar height={18} segments={devAgg.map(d => ({ value: d.sessions, color: DEVICE_COLOR[d.key] || '#9CA3AF', label: d.label }))} />
                <ul className="rp-list" style={{ marginTop: 10 }}>
                  {devAgg.map(d => <li key={d.key}><i style={{ background: DEVICE_COLOR[d.key] || '#9CA3AF' }} />{d.label}<b>{Math.round(R.share(d.sessions, devTotal))}%</b><small>{R.fmt(d.sessions)} sessões · {R.fmt(d.conversions)} contatos</small></li>)}
                </ul>
              </>
            ) : <R.Empty>Ainda não há dados de aparelhos neste período.</R.Empty>}
          </R.Card>
          <R.Card title="Origens dos acessos" subtitle="Canais de onde seu público chegou"
            read={sources[0] ? <><b>{sources[0].name}</b> traz {Math.round(R.share(sources[0].value, srcTotal))}% dos acessos.</> : undefined}>
            <R.HBars rows={sources.slice(0, 6).map(s => ({ key: s.name, label: s.name, value: s.value }))} />
          </R.Card>
        </div>

        <div className="rp-grid rp-g2e">
          <R.Card title="Onde estão" subtitle="Acessos por estado no mapa e ranking ao lado"
            help={{ what: 'A localização vem da conexão de internet. Pode indicar a cidade da operadora em vez da cidade exata.', why: 'Mostra se você está alcançando a região onde atende.' }}
            read={topRegionEntry && locTotal ? <><b>{Math.round(R.share(topRegionEntry[1], locTotal))}%</b> dos acessos vêm de <b>{topRegionEntry[0]}</b>.</> : undefined}
            tip={topRegionEntry ? 'Se você atende só uma região, limite os anúncios a ela para não pagar por cliques de longe.' : undefined}>
            <BrazilGeoMap locations={analytics?.locations} />
          </R.Card>
          <R.Card title="Ranking de localização" subtitle="Cidades, estados e países com mais acessos"
            actions={<R.Tabs label="Agrupar localização" value={locationTab} onChange={(v) => { setLocationTab(v); setLocationPage(0); }} options={[{ value: 'cities', label: 'Cidades' }, { value: 'regions', label: 'Estados' }, { value: 'countries', label: 'Países' }]} />}>
            {visibleLocations.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>{locationTab === 'cities' ? 'Cidade' : locationTab === 'regions' ? 'Estado' : 'País'}</th><th>Visualizações</th><th className="r">Usuários</th><th className="r">Contatos</th></tr></thead>
                <tbody>{visibleLocations.map(loc => (
                  <tr key={loc.key}>
                    <td className="pg"><b>{locationTab === 'cities' ? loc.city : locationTab === 'regions' ? loc.region : loc.country}</b><small>{locationTab === 'cities' ? `${loc.region} · ${loc.country}` : locationTab === 'regions' ? loc.country : ''}</small></td>
                    <td><R.CellBar value={loc.views} max={maxLocViews} /></td>
                    <td className="r num">{R.fmt(loc.users)}</td>
                    <td className="r">{loc.conversions > 0 ? <R.Chip tone="good">{R.fmt(loc.conversions)}</R.Chip> : <span className="num">0</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <R.Empty>Ainda não há dados geográficos neste período. Os novos acessos já são registrados com cidade, estado e país.</R.Empty>}
            <R.Pager page={locationPage} total={aggregatedLocations.length} perPage={ITEMS_PER_PAGE} setPage={setLocationPage} />
          </R.Card>
        </div>

        <div className="rp-grid rp-g2e">
          <R.Card title="Origem por página" subtitle="Por qual página cada canal entra no site. Quanto mais forte a cor, mais visualizações."
            help={{ what: 'Cruza o canal de origem com a primeira página vista (página de entrada).', why: 'Mostra se cada canal está levando as pessoas para a página certa.' }}
            actions={<R.Tabs label="Formato" value={sourceTab} onChange={(v) => { setSourceTab(v); setSourcePage(0); }} options={[{ value: 'top', label: 'Mapa de calor' }, { value: 'all', label: 'Lista completa' }]} />}
            read={instagramTop && instagramTop.v > 0 ? <>Quem vem do <b>Instagram</b> entra mais por <b>{pageTitle(instagramTop.path)}</b>.</> : undefined}
            tip="Nos links de bio, anúncios e posts, aponte direto para a página do serviço anunciado, não só para a página inicial.">
            {sourceTab === 'top' ? (matrix.channels.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>Canal ↓ · Página →</th>{matrix.paths.map(path => <th key={path} className="r" title={path}>{pageTitle(path).length > 16 ? `${pageTitle(path).slice(0, 15)}…` : pageTitle(path)}</th>)}</tr></thead>
                <tbody>{matrix.channels.map(ch => (
                  <tr key={ch}><td><b>{ch}</b></td>{matrix.paths.map(path => {
                    const v = matrix.cell.get(`${ch}|${path}`) || 0; const f = v / matrix.max;
                    return <td key={path} className="r num heat" style={{ background: R.heatColor(f * 0.9), color: f > 0.5 ? '#fff' : undefined, fontWeight: f > 0.5 ? 700 : undefined }}>{R.fmt(v)}</td>;
                  })}</tr>
                ))}</tbody>
              </table></div>
            ) : <R.Empty>Ainda não recebemos dados de origem por página.</R.Empty>) : (
              <>
                {visibleSources.length ? (
                  <div className="rp-tw"><table className="rp-t">
                    <thead><tr><th>Canal</th><th>Página de entrada</th><th className="r">{analytics?.sourceKind === 'ga4' ? 'Sessões' : 'Visualizações'}</th><th className="r">Usuários</th></tr></thead>
                    <tbody>{visibleSources.map(item => (
                      <tr key={`${item.source}-${item.path}`}><td><b>{normalizeOriginName(item.source)}</b></td><td><code>{item.path}</code>{item.path === '/' && <span className="home-page-badge">Página inicial</span>}</td><td className="r num"><b>{R.fmt(item.views)}</b></td><td className="r num">{R.fmt(item.users)}</td></tr>
                    ))}</tbody>
                  </table></div>
                ) : <R.Empty>Ainda não recebemos dados de origem por página.</R.Empty>}
                <R.Pager page={sourcePage} total={filteredSources.length} perPage={ITEMS_PER_PAGE} setPage={setSourcePage} />
              </>
            )}
          </R.Card>
          <R.Card title="Dispositivos e navegadores" subtitle="Detalhe por aparelho e navegador"
            help={{ what: 'Navegador é o programa usado para abrir o site (Chrome, Safari…).', tip: 'Se um navegador tem muitas visitas e poucos contatos, teste o site nele: pode haver algo quebrado.' }}
            actions={<R.Tabs label="Agrupar aparelhos" value={deviceTab} onChange={(v) => { setDeviceTab(v); setDevicePage(0); }} options={[{ value: 'devices', label: 'Por aparelho' }, { value: 'browsers', label: 'Aparelho + navegador' }]} />}>
            {visibleDevices.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>Aparelho</th>{deviceTab === 'browsers' && <th>Navegador</th>}<th>Sessões</th><th className="r">Novos</th><th className="r">Participação</th></tr></thead>
                <tbody>{visibleDevices.map(dev => {
                  const isMobile = dev.device.toLowerCase().includes('mobile'); const isTablet = dev.device.toLowerCase().includes('tablet');
                  const DevIcon = isMobile ? Smartphone : isTablet ? Tablet : Monitor;
                  return (
                    <tr key={dev.key}>
                      <td><b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><DevIcon size={14} style={{ color: 'var(--rp-muted)' }} />{DEVICE_LABEL[deviceKey(dev.key.split('-')[0])] || dev.device}</b></td>
                      {deviceTab === 'browsers' && <td>{dev.browser}</td>}
                      <td><R.CellBar value={dev.sessions} max={maxDevSessions} /></td>
                      <td className="r num">{R.fmt(dev.newUsers)}</td>
                      <td className="r"><b>{totalDeviceViews > 0 ? `${Math.round((dev.views / totalDeviceViews) * 100)}%` : '0%'}</b></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            ) : <R.Empty>Ainda não recebemos dados de dispositivos para os filtros selecionados.</R.Empty>}
            <R.Pager page={devicePage} total={aggregatedDevices.length} perPage={ITEMS_PER_PAGE} setPage={setDevicePage} />
          </R.Card>
        </div>
      </div>
    </>
  );
}

function isLeadClick(item: { intent?: string, isContactLead?: number, label: string, destination?: string }): boolean {
  if (item.isContactLead === 1) return true;
  if (item.intent && item.intent !== 'geral' && item.intent !== 'outro' && item.intent !== 'download' && item.intent !== 'link_externo') return true;
  const href = item.destination || '';
  if (/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|^tel:|^mailto:)/i.test(href)) return true;
  const label = item.label || '';
  return /\b(fale\s*(com|conosco)|entre\s*em\s*contato|contato|whats(?:app)?|agend[ea]|marc[ae]\s*(uma\s*)?(consulta|reuni[aã]o)|solicite|pedir|pe[cç]a\s*(um\s*)?or[cç]amento|or[cç]amento|quero\s*(saber|agendar|falar|receber)|ligue|telefone|enviar\s*(mensagem|formul[aá]rio)|tirar\s*d[uú]vidas|falar\s*com\s*(um\s*)?(especialista|consultor)|come[cç]ar\s*agora|teste\s*(gr[aá]tis)?|cadastre-se|inscreva-se)\b/i.test(label);
}

function isDownloadClick(item: { intent?: string, destination?: string }): boolean {
  return item.intent === 'download' || /\.(pdf|xlsx?|docx?|pptx?|csv|zip|rar|tar|gz|mp3|mp4|dmg|exe|apk)(\?.*)?$/i.test(item.destination || '');
}

function isOutboundClick(item: { intent?: string }): boolean {
  return item.intent === 'link_externo';
}

function conversionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    cadastro: 'Cadastro',
    contato: 'Formulário de contato',
    agendamento: 'Agendamento',
    orcamento: 'Orçamento',
    newsletter: 'Newsletter',
    download: 'Download',
    checkout: 'Finalizar compra',
    pagamento: 'Pagamento',
    assinatura: 'Assinatura',
    compra: 'Compra',
    telefone: 'Ligação',
    carrinho: 'Adição ao carrinho',
    carrinho_visita: 'Visita ao carrinho',
    reserva: 'Reserva',
  };
  return labels[type] || 'Outro contato ou intenção';
}

// allTypes: página de admin "Todos os resultados", com abas para ver o relatório de cada tipo de site.
function Results({ allTypes = false }: { allTypes?: boolean }) {
  const { currentSite, userProfile } = useBusiness();
  const showTabs = Boolean(PROTOTYPE_TYPE) || (allTypes && userProfile?.plan === 'admin');
  const ownType: SiteType = isSiteType(currentSite?.site_type) ? currentSite.site_type : 'servicos';
  const [viewType, setViewType] = useState<SiteType | null>(PROTOTYPE_TYPE);
  const siteType: SiteType = showTabs ? (viewType ?? ownType) : ownType;
  const liveAnalytics = useAnalytics();
  const analytics = useMemo(() => (PROTOTYPE_TYPE ? sampleAnalytics(siteType) as unknown as AnalyticsData : liveAnalytics), [siteType, liveAnalytics]);
  const prototypeBar = showTabs ? (
    <nav className="rp-proto" aria-label="Tipo de site">
      <span>{PROTOTYPE_TYPE ? 'Protótipo' : 'Ver como'}</span>
      {SITE_TYPE_OPTIONS.map(([type, info]) => <button key={type} type="button" className={type === siteType ? 'on' : ''} onClick={() => { setViewType(type); if (PROTOTYPE_TYPE) window.history.replaceState(null, '', `?prototipo=${type}`) }}>{info.label}{type === ownType && !PROTOTYPE_TYPE ? ' (atual)' : ''}</button>)}
    </nav>
  ) : null;
  const [conversionTab, setConversionTab] = useState<'pages' | 'channels'>('pages');
  const [conversionPage, setConversionPage] = useState(0);
  const [conversionEventPage, setConversionEventPage] = useState(0);
  const [leadClickPage, setLeadClickPage] = useState(0);
  const [leadClickTab, setLeadClickTab] = useState<'all' | 'whatsapp' | 'forms'>('all');
  const [generalClickPage, setGeneralClickPage] = useState(0);
  const [generalClickTab, setGeneralClickTab] = useState<'top' | 'downloads' | 'outbound' | 'all'>('top');
  const [smPage, setSmPage] = useState(0);
  const [smTab, setSmTab] = useState<'all' | 'conversions' | 'campaigns'>('all');

  const t = analytics?.totals;
  const p = analytics?.previousTotals;
  const allClicks = (analytics?.clickDetails ?? []).filter(item => {
    const label = String(item.label || '').trim().toLocaleLowerCase('pt-BR')
    return !/^(?:fechar|feche|close|dismiss|×|x)$/.test(label)
  });
  const leadClicks = allClicks.filter(item => isLeadClick(item));
  const generalClicks = allClicks.filter(item => !isLeadClick(item));
  const rawSmResults = analytics?.sourceMediumResults ?? [];
  const conversionEvents = analytics?.conversionEvents ?? [];
  const contactDetails = analytics?.contactDetails ?? [];
  const formSubmits = analytics?.sourceKind === 'ga4'
    ? contactDetails.filter(item => item.type === 'form_submit').reduce((sum, item) => sum + Number(item.contacts || 0), 0)
    : conversionEvents.filter(item => ['contato', 'agendamento', 'orcamento', 'newsletter'].includes(item.type) && item.stage === 'confirmada').reduce((sum, item) => sum + Number(item.conversions || 0), 0);
  const phoneClicks = conversionEvents.filter(item => item.type === 'telefone').reduce((sum, item) => sum + Number(item.conversions || 0), 0);
  const quoteRequests = conversionEvents.filter(item => item.type === 'orcamento' && item.stage === 'confirmada').reduce((sum, item) => sum + Number(item.conversions || 0), 0);
  const visibleConversionEvents = conversionEvents.slice(conversionEventPage * ITEMS_PER_PAGE, (conversionEventPage + 1) * ITEMS_PER_PAGE);

  const totalDownloads = allClicks.filter(item => isDownloadClick(item)).reduce((sum, item) => sum + Number(item.clicks || 0), 0);
  const totalOutbound = allClicks.filter(item => isOutboundClick(item)).reduce((sum, item) => sum + Number(item.clicks || 0), 0);
  const totalWhatsApp = allClicks.filter(item => /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|whats)/i.test((item.destination || '') + (item.label || ''))).reduce((sum, item) => sum + Number(item.clicks || 0), 0);

  const formStarts = contactDetails
    .filter(c => c.type === 'form_start')
    .reduce((sum, c) => sum + Number(c.contacts || 0), 0);
  const formAbandons = contactDetails
    .filter(c => c.type === 'form_abandon')
    .reduce((sum, c) => sum + Number(c.contacts || 0), 0);
  const formAbandonRate = formStarts > 0 ? Math.round((formAbandons / formStarts) * 100) : 0;

  const filteredSmResults = smTab === 'conversions'
    ? rawSmResults.filter(item => Number(item.whatsappClicks || 0) > 0 || Number(item.contactClicks || 0) > 0)
    : smTab === 'campaigns'
    ? rawSmResults.filter(item => Boolean(item.campaign && item.campaign.trim().length > 0))
    : rawSmResults;

  const filteredLeadClicks = leadClickTab === 'whatsapp'
    ? leadClicks.filter(item => /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|whats)/i.test((item.destination || '') + (item.label || '')))
    : leadClickTab === 'forms'
    ? leadClicks.filter(item => !/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|whats)/i.test((item.destination || '') + (item.label || '')))
    : leadClicks;

  const filteredGeneralClicks = generalClickTab === 'downloads'
    ? generalClicks.filter(item => isDownloadClick(item))
    : generalClickTab === 'outbound'
    ? generalClicks.filter(item => isOutboundClick(item))
    : generalClicks;

  const sortedGeneralClicks = generalClickTab === 'top'
    ? [...filteredGeneralClicks].sort((a, b) => b.clicks - a.clicks)
    : filteredGeneralClicks;

  const pageConversions = useMemo(() => (
    (analytics?.pageConversionResults ?? [])
      .map(item => {
        const sessions = Number(item.sessions || 0);
        const contactSessions = Number(item.contactSessions || 0);
        return {
          path: item.path,
          sessions,
          whatsapp: Number(item.whatsappClicks || 0),
          signups: Number(item.signUps || 0),
          total: contactSessions,
          conversionRate: sessions > 0 ? (contactSessions / sessions) * 100 : 0,
        };
      })
      .filter(item => item.total > 0 || item.sessions > 0)
      .sort((a, b) => b.total - a.total || b.conversionRate - a.conversionRate || b.sessions - a.sessions)
  ), [analytics?.pageConversionResults]);

  const channelConversions = useMemo(() => {
    const map = new Map<string, {
      source: string;
      medium: string;
      sessions: number;
      whatsapp: number;
      others: number;
      total: number;
      conversionRate: number;
    }>();

    (analytics?.sourceMediumResults ?? []).forEach(item => {
      const source = item.source || '(direto)';
      const medium = item.medium || '(nenhum)';
      const key = `${source}|${medium}`;
      const sess = Number(item.sessions || 0);
      const wa = Number(item.whatsappClicks || 0);
      const cont = Number(item.conversions || 0);
      const others = Number(item.signUps || 0);

      const existing = map.get(key) || {
        source,
        medium,
        sessions: 0,
        whatsapp: 0,
        others: 0,
        total: 0,
        conversionRate: 0,
      };
      existing.sessions += sess;
      existing.whatsapp += wa;
      existing.others += others;
      existing.total += cont;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        conversionRate: item.sessions > 0 ? (item.total / item.sessions) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total || b.conversionRate - a.conversionRate || b.sessions - a.sessions);
  }, [analytics?.sourceMediumResults]);

  const currentConversionList = conversionTab === 'pages' ? pageConversions : channelConversions;
  const visibleConversions = currentConversionList.slice(conversionPage * ITEMS_PER_PAGE, (conversionPage + 1) * ITEMS_PER_PAGE);

  const visibleLeadClicks = filteredLeadClicks.slice(leadClickPage * ITEMS_PER_PAGE, (leadClickPage + 1) * ITEMS_PER_PAGE);
  const visibleGeneralClicks = sortedGeneralClicks.slice(generalClickPage * ITEMS_PER_PAGE, (generalClickPage + 1) * ITEMS_PER_PAGE);
  const visibleSmResults = filteredSmResults.slice(smPage * ITEMS_PER_PAGE, (smPage + 1) * ITEMS_PER_PAGE);
  const contactRate = t?.sessions ? `${((Number(t.contactSessions || 0) / Number(t.sessions)) * 100).toFixed(1).replace('.', ',')}%` : '—';

  const [leadView, setLeadView] = useState<'buttons' | 'days'>('buttons');
  const contacts = Number(t?.contacts || 0), signups = Number(t?.signUps || 0);
  const whatsapp = analytics?.sourceKind === 'ga4' ? totalWhatsApp : Number(t?.whatsappContacts || 0);
  const otherContacts = Math.max(contacts - whatsapp - signups, 0);
  const contactRateNum = t?.sessions ? (Number(t.contactSessions || 0) / Number(t.sessions)) * 100 : 0;
  const daily = analytics?.daily ?? [];
  const waByDate = new Map<string, number>();
  (analytics?.contactDetails ?? []).filter(c => c.type === 'whatsapp').forEach(c => waByDate.set(c.date, (waByDate.get(c.date) || 0) + Number(c.contacts || 0)));
  const hasWaDetail = waByDate.size > 0;
  const waSeries = daily.map(d => Math.min(waByDate.get(d.date) || 0, Number(d.contacts || 0)));
  const restSeries = daily.map((d, i) => Math.max(Number(d.contacts || 0) - (hasWaDetail ? waSeries[i] : 0), 0));
  const leadButtons = (() => {
    const map = new Map<string, { key: string, label: string, path: string, destination?: string, clicks: number, sessions: number }>();
    filteredLeadClicks.forEach(c => { const k = `${c.label}|${c.path}`; const cur = map.get(k) || { key: k, label: c.label, path: c.path, destination: c.destination, clicks: 0, sessions: 0 }; cur.clicks += Number(c.clicks || 0); cur.sessions += Number(c.sessions || 0); map.set(k, cur); });
    return Array.from(map.values()).sort((a, b) => b.clicks - a.clicks);
  })();
  const leadList = leadView === 'buttons' ? leadButtons : filteredLeadClicks;
  const visibleLead = leadList.slice(leadClickPage * ITEMS_PER_PAGE, (leadClickPage + 1) * ITEMS_PER_PAGE);
  const maxLeadClicks = Math.max(...leadButtons.map(b => b.clicks), 1);
  const maxConvTotal = Math.max(...currentConversionList.map(i => Number(i.total || 0)), 1);
  const maxSmWa = Math.max(...filteredSmResults.map(i => Number(i.whatsappClicks || 0)), 1);
  const bestPage = pageConversions.filter(pc => pc.sessions >= 20).sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const pageTitle = (path: string) => analytics?.pages?.find(pg => pg.path === path)?.title || (path === '/' ? 'Página inicial' : path);
  const shortDest = (d?: string) => (d ? d.replace(/^https?:\/\//, '').replace(/^www\./, '').slice(0, 32) : '—');

  if (siteType !== 'servicos') {
    return <>{prototypeBar}<ResultsByType siteType={siteType} data={analytics}
      header={(title, subtitle, guide) => <PageHeader report title={title} subtitle={subtitle} guide={guide} />}
      filters={<AnalyticsFilters analytics={analytics} />} /></>;
  }

  return (
    <>
      {prototypeBar}
      <PageHeader report title="Resultados" subtitle="Os contatos e oportunidades que o seu site gerou."
        guide={<><b>Como ler esta tela:</b> <b>contato iniciado</b> é quando alguém clica para falar com você (WhatsApp, telefone) ou envia um cadastro. Não quer dizer que virou venda, mas é o melhor sinal de interesse. Use as tabelas para descobrir <b>quais páginas, botões e canais</b> trazem esses contatos.</>} />
      <AnalyticsFilters analytics={analytics} />
      <div className="rp">
        <div className="rp-grid rp-g-main">
          <R.Card title="Contatos iniciados" subtitle="Todas as formas de contato somadas" actions={<R.Delta value={R.change(t?.contacts, p?.contacts)} emptyLabel="sem comparação" />}
            help={{ what: 'Soma dos cliques em WhatsApp e telefone e dos cadastros enviados pelo site.', why: 'É o principal resultado do seu site: pessoas que levantaram a mão.' }}
            read={contacts ? <>De cada 100 visitas, <b>{R.fmtDec(contactRateNum)}</b> terminaram em contato. {whatsapp ? <>O WhatsApp responde por <b>{Math.round(R.share(whatsapp, contacts))}%</b> deles.</> : null}</> : undefined}
            tip={contacts ? (R.share(whatsapp, contacts) > 60 ? 'O WhatsApp é o seu canal principal. Responda rápido: a primeira hora é quando a pessoa está mais interessada.' : 'Os formulários têm peso grande. Confira se os e-mails de cadastro estão chegando e sendo respondidos.') : 'Adicione um botão de WhatsApp visível em todas as páginas para começar a receber contatos.'}>
            <div className="rp-big"><b className="num">{R.fmt(contacts)}</b><span>contatos · <b style={{ color: 'var(--rp-fg)' }}>{contactRate}</b> das visitas <Help title="Taxa de contato" what="Sessões com pelo menos um contato ÷ total de sessões." tip="Entre 2% e 5% é comum em sites de serviços." /></span></div>
            <div style={{ marginTop: 12 }}><R.StackBar height={16} segments={[{ value: whatsapp, color: '#FF3CAC', label: 'WhatsApp' }, { value: signups, color: '#FF8A3D', label: 'Cadastros' }, { value: otherContacts, color: '#7C5CF0', label: 'Outros' }]} /></div>
            <div className="rp-grid rp-g3" style={{ marginTop: 10, gap: 10 }}>
              <div className="rp-mini"><span className="t"><i style={{ width: 8, height: 8, borderRadius: 2, background: '#FF3CAC', display: 'inline-block' }} />WhatsApp</span><b className="num">{R.fmt(whatsapp)}</b><R.Delta value={R.change(whatsapp, p?.whatsappContacts)} /></div>
              <div className="rp-mini"><span className="t"><i style={{ width: 8, height: 8, borderRadius: 2, background: '#FF8A3D', display: 'inline-block' }} />Cadastros</span><b className="num">{R.fmt(signups)}</b><R.Delta value={R.change(t?.signUps, p?.signUps)} /></div>
              <div className="rp-mini"><span className="t">Formulários enviados<Help title="Formulários enviados" what="Envios confirmados de formulários de contato, agendamento, orçamento ou newsletter." /></span><b className={`num ${formSubmits ? '' : 'empty'}`}>{formSubmits ? R.fmt(formSubmits) : '—'}</b><small>{formSubmits ? 'envios confirmados' : 'nenhum envio'}</small></div>
            </div>
          </R.Card>
          <R.Card title="Outras ações no site" subtitle="Sinais de interesse que ainda não são contato">
            <div className="rp-grid rp-g2e" style={{ marginTop: 0, gap: 10 }}>
              <div className="rp-mini"><span className="t">Cliques para ligar<Help title="Cliques para ligar" what="Cliques em números de telefone do site." /></span><b className={phoneClicks ? '' : 'empty'}>{phoneClicks ? R.fmt(phoneClicks) : '—'}</b><small>ligações iniciadas</small></div>
              <div className="rp-mini"><span className="t">Downloads<Help title="Downloads" what="Arquivos baixados no site, como PDFs, cardápios e catálogos." /></span><b className={totalDownloads ? '' : 'empty'}>{totalDownloads ? R.fmt(totalDownloads) : '—'}</b><small>arquivos baixados</small></div>
              <div className="rp-mini"><span className="t">Cliques de saída<Help title="Cliques de saída" what="Cliques em links que levam para outros sites (Google Maps, redes sociais…)." /></span><b className={totalOutbound ? '' : 'empty'}>{totalOutbound ? R.fmt(totalOutbound) : '—'}</b><small>links para outros sites</small></div>
              {formStarts > 0 ? (
                <div className="rp-mini"><span className="t">Abandono de formulário<Help title="Abandono de formulário" what="Pessoas que começaram a preencher um formulário e desistiram." tip="Formulários longos espantam. Peça só o essencial." /></span><b>{formAbandonRate}%</b><small>{formAbandons} desistiram de {formStarts} iniciados</small></div>
              ) : (
                <div className="rp-mini"><span className="t">Pedidos de orçamento<Help title="Pedidos de orçamento" what="Formulários de orçamento, proposta ou cotação enviados." /></span><b className={quoteRequests ? '' : 'empty'}>{quoteRequests ? R.fmt(quoteRequests) : '—'}</b><small>formulários de orçamento</small></div>
              )}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 12 }}><R.Tip>Se o seu site não tem telefone, downloads ou formulário de orçamento, é normal estes números ficarem zerados.</R.Tip></div>
          </R.Card>
        </div>

        <div className="rp-grid">
          <R.Card title="Contatos ao longo do período" subtitle="Passe o mouse em cada barra para ver os detalhes do dia"
            actions={<div className="rp-legend">{hasWaDetail ? <><span><i style={{ background: '#FF3CAC' }} />WhatsApp</span><span><i style={{ background: '#FF8A3D' }} />Outros contatos</span></> : <span><i style={{ background: '#FF3CAC' }} />Contatos</span>}</div>}
            read={daily.length ? (() => { const mx = Math.max(...daily.map(d => Number(d.contacts || 0))); const d = daily.find(x => Number(x.contacts || 0) === mx); return d && mx ? <>O melhor dia foi <b>{R.shortDate(d.date)} ({R.WEEKDAYS[R.weekdayOf(d.date)]})</b>, com {mx} contatos.</> : undefined; })() : undefined}>
            <R.StackedBars unit="contatos" labels={daily.map(d => R.shortDate(d.date))}
              series={hasWaDetail ? [{ name: 'WhatsApp', color: '#FF3CAC', values: waSeries }, { name: 'outros', color: '#FF8A3D', values: restSeries }] : [{ name: 'contatos', color: '#FF3CAC', values: restSeries }]} />
          </R.Card>
        </div>

        <div className="rp-grid rp-g2e">
          <R.Card title={conversionTab === 'pages' ? 'Páginas que mais convertem' : 'Canais que mais convertem'}
            subtitle={conversionTab === 'pages' ? 'Contatos gerados a partir de cada página' : 'Contatos gerados por canal de origem'}
            help={{ what: 'Taxa de contato = sessões que tiveram contato ÷ sessões que passaram pela página (ou vieram do canal).', tip: 'Divulgue mais as páginas e canais com taxa alta.' }}
            actions={<R.Tabs label="Ver por" value={conversionTab} onChange={(v) => { setConversionTab(v); setConversionPage(0); }} options={[{ value: 'pages', label: 'Por página' }, { value: 'channels', label: 'Por canal' }]} />}
            read={conversionTab === 'pages' && bestPage ? <><b>{pageTitle(bestPage.path)}</b> converte <b>{R.fmtPct(bestPage.conversionRate)}</b> das visitas. É a página que mais vale divulgar.</> : undefined}>
            {visibleConversions.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>{conversionTab === 'pages' ? 'Página' : 'Canal'}</th><th>Contatos</th><th className="r">WhatsApp</th><th className="r">{conversionTab === 'pages' ? 'Cadastros' : 'Outros'}</th><th className="r">Taxa</th></tr></thead>
                <tbody>{visibleConversions.map((raw, index) => {
                  const isPage = conversionTab === 'pages';
                  const item = raw as (typeof pageConversions)[number] & (typeof channelConversions)[number];
                  const extra = isPage ? (raw as (typeof pageConversions)[number]).signups : (raw as (typeof channelConversions)[number]).others;
                  return (
                    <tr key={index}>
                      <td className="pg">{isPage ? <><b>{pageTitle(item.path)}</b><code>{item.path}</code></> : <><b>{normalizeOriginName(item.source)}</b><small>{formatMediumName(item.medium)}</small></>}</td>
                      <td><R.CellBar tone="pink" value={Number(item.total || 0)} max={maxConvTotal} /></td>
                      <td className="r num">{item.whatsapp ? R.fmt(item.whatsapp) : '—'}</td>
                      <td className="r num">{extra ? R.fmt(extra) : '—'}</td>
                      <td className="r"><R.Chip tone={item.conversionRate >= 5 ? 'good' : item.conversionRate > 0 ? 'neutral' : 'warn'}>{R.fmtPct(item.conversionRate)}</R.Chip></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            ) : <R.Empty>Nenhuma página ou canal com sessões neste período.</R.Empty>}
            <R.Pager page={conversionPage} total={currentConversionList.length} perPage={ITEMS_PER_PAGE} setPage={setConversionPage} />
          </R.Card>

          <R.Card title="Botões de contato mais clicados" subtitle="Cliques em WhatsApp, telefone e formulários"
            help={{ what: 'Botões e links identificados como contato: WhatsApp, telefone, e-mail ou textos como "agende", "orçamento" e "fale conosco".', tip: 'Se um botão importante não aparece aqui, confira se o texto dele deixa claro que é para contato.' }}
            actions={<>
              <R.Tabs label="Tipo de contato" value={leadClickTab} onChange={(v) => { setLeadClickTab(v); setLeadClickPage(0); }} options={[{ value: 'all', label: 'Todos' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'forms', label: 'Outros' }]} />
              <R.Tabs label="Agrupar" value={leadView} onChange={(v) => { setLeadView(v); setLeadClickPage(0); }} options={[{ value: 'buttons', label: 'Por botão' }, { value: 'days', label: 'Por dia' }]} />
            </>}
            read={leadButtons[0] ? <>O botão <b>“{leadButtons[0].label}”</b> em <b>{pageTitle(leadButtons[0].path)}</b> gera a maior parte dos cliques de contato.</> : undefined}>
            {visibleLead.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr>{leadView === 'days' && <th>Data</th>}<th>Botão</th><th>{leadView === 'buttons' ? 'Cliques' : 'Página'}</th>{leadView === 'days' && <th className="r">Cliques</th>}</tr></thead>
                <tbody>{leadView === 'buttons'
                  ? (visibleLead as typeof leadButtons).map(b => (
                    <tr key={b.key}><td className="pg"><b>{b.label}</b><small>em <code>{b.path}</code> → {shortDest(b.destination)}</small></td><td><R.CellBar tone="pink" value={b.clicks} max={maxLeadClicks} /></td></tr>
                  ))
                  : (visibleLead as typeof filteredLeadClicks).map((item, index) => (
                    <tr key={`${item.date}-${item.label}-${index}`}><td><b>{R.shortDate(item.date)}</b></td><td className="pg"><b>{item.label}</b><small>{shortDest(item.destination)}</small></td><td><code>{item.path}</code></td><td className="r num"><b>{R.fmt(item.clicks)}</b></td></tr>
                  ))}
                </tbody>
              </table></div>
            ) : <R.Empty>Nenhum clique de contato identificado no período.</R.Empty>}
            <R.Pager page={leadClickPage} total={leadList.length} perPage={ITEMS_PER_PAGE} setPage={setLeadClickPage} />
          </R.Card>
        </div>

        <div className="rp-grid">
          <R.Card title="Origem, mídia e campanha" subtitle="Visitas, cliques e contatos de cada canal de tráfego"
            help={{ what: 'Cliques gerais são todos os cliques em botões e links. Cliques de contato são só os de WhatsApp, telefone e formulários.' }}
            actions={<R.Tabs label="Filtrar canais" value={smTab} onChange={(v) => { setSmTab(v); setSmPage(0); }} options={[{ value: 'all', label: 'Todos os canais' }, { value: 'conversions', label: 'Com contatos' }, { value: 'campaigns', label: 'Só campanhas' }]} />}>
            {visibleSmResults.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>Canal</th><th>Campanha</th><th className="r">Sessões</th><th className="r">Visualizações</th><th className="r">Usuários</th><th className="r">Cliques gerais</th><th className="r">Cliques de contato</th><th>WhatsApp</th></tr></thead>
                <tbody>{visibleSmResults.map((item, index) => (
                  <tr key={`${item.source}-${item.medium}-${item.campaign}-${index}`}>
                    <td className="pg"><b>{normalizeOriginName(item.source)}</b><small>{formatMediumName(item.medium)}</small></td>
                    <td>{hasCampaign(item.campaign) ? <code>{item.campaign}</code> : <small className="m">sem campanha</small>}</td>
                    <td className="r num">{R.fmt(item.sessions)}</td>
                    <td className="r num">{R.fmt(item.pageViews ?? item.views)}</td>
                    <td className="r num">{R.fmt(item.users)}</td>
                    <td className="r num">{R.fmt(item.generalClicks)}</td>
                    <td className="r num">{R.fmt(item.contactClicks)}</td>
                    <td><R.CellBar tone="pink" value={Number(item.whatsappClicks || 0)} max={maxSmWa} /></td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <R.Empty>Nenhum dado de origem e mídia para os filtros selecionados.</R.Empty>}
            <R.Pager page={smPage} total={filteredSmResults.length} perPage={ITEMS_PER_PAGE} setPage={setSmPage} />
          </R.Card>
        </div>

        <div className="rp-grid">
          <R.Card title="Histórico de contatos e intenções" subtitle="Envios confirmados de formulário e ações comerciais iniciadas"
            help={{ what: '"Confirmada" quer dizer que o envio foi concluído. "Iniciada" quer dizer que a pessoa começou, mas não sabemos se terminou.' }}>
            {visibleConversionEvents.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>Data</th><th>Tipo</th><th>Nome</th><th>Página</th><th>Status</th><th className="r">Total</th></tr></thead>
                <tbody>{visibleConversionEvents.map((item, index) => (
                  <tr key={`${item.date}-${item.type}-${item.name}-${index}`}>
                    <td><b>{R.shortDate(item.date)}</b></td><td>{conversionTypeLabel(item.type)}</td><td>{item.name || '—'}</td><td><code>{item.path}</code></td>
                    <td><R.Chip tone={item.stage === 'confirmada' ? 'good' : 'warn'}>{item.stage === 'confirmada' ? 'Confirmada' : 'Iniciada'}</R.Chip></td>
                    <td className="r num"><b>{R.fmt(item.conversions)}</b></td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <R.Empty>Ainda não há contatos ou intenções registrados neste período.</R.Empty>}
            <R.Pager page={conversionEventPage} total={conversionEvents.length} perPage={ITEMS_PER_PAGE} setPage={setConversionEventPage} />
          </R.Card>
        </div>

        <div className="rp-grid">
          <R.Card title="Outros cliques no site" subtitle="Botões e links que não são de contato: navegação, downloads e links externos"
            help={{ what: 'Ajuda a entender o que as pessoas procuram antes de falar com você.', tip: 'Se um botão de navegação é muito clicado, o assunto dele interessa: destaque-o mais.' }}
            actions={<R.Tabs label="Tipo de clique" value={generalClickTab} onChange={(v) => { setGeneralClickTab(v); setGeneralClickPage(0); }} options={[{ value: 'top', label: 'Mais clicados' }, { value: 'downloads', label: `Downloads${totalDownloads ? ` (${totalDownloads})` : ''}` }, { value: 'outbound', label: `Links externos${totalOutbound ? ` (${totalOutbound})` : ''}` }, { value: 'all', label: 'Histórico recente' }]} />}>
            {visibleGeneralClicks.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>Data</th><th>Texto do botão</th><th>ID do botão</th><th>Destino</th><th className="r">Cliques</th></tr></thead>
                <tbody>{visibleGeneralClicks.map((item, index) => (
                  <tr key={`${item.date}-${item.label}-${index}`}>
                    <td><b>{R.shortDate(item.date)}</b></td>
                    <td><b>{item.label}</b> {isDownloadClick(item) && <R.Chip tone="brand">Download</R.Chip>} {isOutboundClick(item) && <R.Chip tone="neutral">Externo</R.Chip>}</td>
                    <td>{item.buttonId ? <code>#{item.buttonId}</code> : '—'}</td>
                    <td title={item.destination}><small className="m">{shortDest(item.destination)}</small></td>
                    <td className="r num"><b>{R.fmt(item.clicks)}</b></td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <R.Empty>Nenhum clique desse tipo foi registrado no período.</R.Empty>}
            <R.Pager page={generalClickPage} total={sortedGeneralClicks.length} perPage={ITEMS_PER_PAGE} setPage={setGeneralClickPage} />
          </R.Card>
        </div>
      </div>
    </>
  );
}

interface GeneratedInsight {
  key: string
  type: string
  title: string
  status: 'positive' | 'warning' | 'neutral'
  badge: string
  finding: string
  action: string
  projection: string
}

const INSIGHT_GLOSSARY: Array<{ term: string; test: RegExp; text: string }> = [
  { term: 'CTA', test: /\bCTAs?\b/, text: 'Chamada para ação: botões ou links que levam a pessoa a entrar em contato, como “Fale no WhatsApp”.' },
  { term: 'tráfego orgânico', test: /tr[áa]fego org[âa]nico/i, text: 'Visitas que chegam sem anúncio pago, como pelo resultado normal do Google.' },
  { term: 'busca orgânica', test: /busca org[âa]nica/i, text: 'Visitas que chegam pelo resultado normal do Google, sem ser por anúncio pago.' },
  { term: 'remarketing', test: /remarketing/i, text: 'Anúncio mostrado para quem já visitou o seu site.' },
  { term: 'funil', test: /\bfunil\b/i, text: 'O caminho que a visita percorre até virar contato.' },
  { term: 'taxa de saída', test: /taxa de sa[íi]da/i, text: 'Percentual de visitas que deixam a página sem continuar no site.' },
  { term: 'taxa de rejeição', test: /taxa de rejei[çc][ãa]o|bounce/i, text: 'Percentual de visitas que saem do site sem interagir com nada.' },
  { term: 'UTM', test: /\bUTMs?\b/, text: 'Etiqueta colocada no link para mostrar de qual campanha a visita veio.' }
]

function formatInsightText(value: string) {
  return value
    .replace(/([“"'])\/([”"'])/g, '$1página inicial$2')
    .replace(/(^|[\s("'“”])\/(?=$|[\s,.;:!?'"“”])/g, '$1página inicial')
    .replace(/página\s+\/(?=[\s,.;:!?]|$)/gi, 'página inicial')
}

type InsightKind = 'warn' | 'opp' | 'good'
const INSIGHT_KIND_LABEL: Record<InsightKind, string> = { warn: 'Precisa de atenção', opp: 'Oportunidade', good: 'Indo bem' }
const INSIGHT_PRIORITY: Record<InsightKind, string> = { warn: 'Prioridade alta', opp: 'Prioridade média', good: 'Manter' }
const insightKind = (status: GeneratedInsight['status']): InsightKind => status === 'warning' ? 'warn' : status === 'positive' ? 'good' : 'opp'

function insightTarget(item: GeneratedInsight): { page: Page; label: string } | null {
  const text = `${item.type} ${item.badge} ${item.title}`.toLowerCase()
  if (/p[áa]gina|page|conte[úu]do|rolagem|scroll/.test(text)) return { page: 'pages', label: 'Ver em Páginas' }
  if (/whats|contato|convers|lead|formul|resultado/.test(text)) return { page: 'results', label: 'Ver em Resultados' }
  if (/origem|canal|campanha|instagram|google|tr[áa]fego|aquisi|source|utm|an[úu]ncio/.test(text)) return { page: 'acquisition', label: 'Ver em Aquisição' }
  if (/p[úu]blico|dispositivo|celular|hor[áa]rio|cidade|regi[ãa]o|audience/.test(text)) return { page: 'audience', label: 'Ver em Público' }
  return null
}

function nextMonday(from = new Date()) {
  const d = new Date(from)
  const diff = (8 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + diff)
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(d)
}

function sparkPath(values: number[], w = 120, h = 34) {
  if (values.length < 2) return { line: '', area: '' }
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const pts = values.map((v, i) => [Math.round((i / (values.length - 1)) * w * 10) / 10, Math.round((h - 3 - ((v - min) / span) * (h - 8)) * 10) / 10])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')
  return { line, area: `${line} L${w} ${h} L0 ${h} Z` }
}

function InsightKpi({ label, value, current, previous, series, color, invert }: { label: string; value: string; current?: number; previous?: number; series: number[]; color: string; invert?: boolean }) {
  const now = Number(current || 0)
  const before = Number(previous || 0)
  const pct = before ? Math.round(((now - before) / before) * 100) : null
  const up = pct !== null && pct >= 0
  const good = invert ? !up : up
  const sp = sparkPath(series)
  return (
    <div className="z-kpi">
      <small>{label}</small>
      <b>{value}</b>
      {pct === null
        ? <span className="z-delta neutral">Sem período anterior para comparar</span>
        : <span className={`z-delta ${good ? '' : 'dn'}`}>{up ? '▲' : '▼'} {Math.abs(pct)}% vs. período anterior</span>}
      {sp.line && (
        <svg className="z-spark" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
          <path d={sp.area} fill={color} fillOpacity=".14" />
          <path d={sp.line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function Insights({ setPage }: { setPage: (page: Page) => void }) {
  const analytics = useAnalytics();
  const { currentBusiness, currentSite } = useBusiness();
  const [insights, setInsights] = useState<GeneratedInsight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [awaitingWeeklyReport, setAwaitingWeeklyReport] = useState(false);
  const [filter, setFilter] = useState<'all' | InsightKind>('all');
  const [openGloss, setOpenGloss] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ text: string; undoKey?: string } | null>(null);

  const [doneKeys, setDoneKeys] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('analizi-viewed-insights') || '[]'); } catch { return []; }
  });
  const saveDone = (next: string[]) => {
    setDoneKeys(next);
    try { localStorage.setItem('analizi-viewed-insights', JSON.stringify(next)); } catch { /* armazenamento indisponível */ }
  };
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchInsights = async () => {
    if (!analytics || !currentSite) return;
    setLoadingAI(true);
    try {
      const res = await fetch('https://analizi.carvalhopaula1990.workers.dev/v1/ai-insights', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trackerSiteId: currentSite.tracker_site_id,
          business: {
            name: currentBusiness?.name,
            segment: currentBusiness?.segment,
            subsegment: currentBusiness?.subsegment,
            segmentDetail: currentBusiness?.segment_detail,
            websiteUrl: currentBusiness?.website_url || currentSite.domain
          },
          metrics: {
            periodDays: analytics.periodDays ?? 7,
            totals: analytics.totals,
            previousTotals: analytics.previousTotals,
            sources: analytics.sources,
            pages: analytics.pages,
            daily: analytics.daily
          }
        })
      });
      if (res.ok) {
        const data = await res.json() as { insights?: GeneratedInsight[]; generatedAt?: string };
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
          setGeneratedAt(data.generatedAt || null);
          setAwaitingWeeklyReport(false);
        } else {
          setInsights([]);
          setAwaitingWeeklyReport(res.status === 202);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar insights:', err);
    } finally {
      setLoadingAI(false);
      setLoadedOnce(true);
    }
  };

  useEffect(() => {
    if (analytics && currentSite) void fetchInsights();
  }, [currentSite?.id, analytics]);

  const order: Record<InsightKind, number> = { warn: 0, opp: 1, good: 2 };
  const all = insights
    .map((item) => ({ ...item, id: item.key || item.title, kind: insightKind(item.status) }))
    .sort((a, b) => order[a.kind] - order[b.kind]);
  const open = all.filter((item) => !doneKeys.includes(item.id));
  const done = all.filter((item) => doneKeys.includes(item.id));
  const visible = open.filter((item) => filter === 'all' || item.kind === filter);
  const count = (k: InsightKind) => open.filter((item) => item.kind === k).length;
  const total = all.length;
  const progress = total ? done.length / total : 0;

  const t = analytics?.totals;
  const p = analytics?.previousTotals;
  const daily = analytics?.daily ?? [];
  const rate = (c?: number, s?: number) => (s ? (Number(c || 0) / Number(s)) * 100 : 0);
  const contactRate = t?.sessions ? `${rate(t.contactSessions, t.sessions).toFixed(1).replace('.', ',')}%` : '—';
  const periodDays = analytics?.periodDays ?? selectedDays();
  const reportDate = generatedAt ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date(generatedAt)) : null;

  const headline = (() => {
    if (!total) return '';
    const parts: string[] = [];
    if (count('warn')) parts.push(`${count('warn')} ${count('warn') === 1 ? 'ponto de atenção' : 'pontos de atenção'}`);
    if (count('opp')) parts.push(`${count('opp')} ${count('opp') === 1 ? 'oportunidade' : 'oportunidades'}`);
    if (count('good')) parts.push(`${count('good')} ${count('good') === 1 ? 'coisa indo bem' : 'coisas indo bem'}`);
    if (!parts.length) return 'Você concluiu todas as recomendações desta semana.';
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}` : parts[0];
    return `Nesta semana, a IZI encontrou ${list} no seu site.`;
  })();

  const markDone = (id: string) => { saveDone([...doneKeys, id]); setToast({ text: 'Marcado como feito', undoKey: id }); };
  const undo = (id: string) => saveDone(doneKeys.filter((k) => k !== id));
  const C = 213.6;

  const chips: Array<{ id: 'all' | InsightKind; label: string; count: number }> = [
    { id: 'all', label: 'Todos', count: open.length },
    { id: 'warn', label: 'Atenção', count: count('warn') },
    { id: 'opp', label: 'Oportunidades', count: count('opp') },
    { id: 'good', label: 'Indo bem', count: count('good') }
  ];

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle="O que mudou no seu site e o que fazer a seguir, em ordem de prioridade."
        eyebrow="INTELIGÊNCIA ARTIFICIAL"
        icon={Sparkles}
        iconColor="#ff3cac"
      />

      {loadingAI && !insights.length ? (
        <section className="z-hero" aria-busy="true">
          <div className="z-hero-l">
            <span className="z-izi"><span className="z-pulse pink" />Gerando agora</span>
            <h2>Preparando o diagnóstico da semana</h2>
            <div className="z-hero-meta"><span>A IZI está comparando o comportamento do seu público com o seu segmento. Leva cerca de 1 minuto. Pode sair desta tela, o diagnóstico fica salvo.</span></div>
          </div>
          <div className="z-kpis">
            {[0, 1, 2].map((i) => <div className="z-kpi" key={i}><div className="z-skel dark" style={{ width: '60%' }} /><div className="z-skel dark" style={{ height: 26 }} /></div>)}
          </div>
        </section>
      ) : !total ? (
        <section className="z-card z-empty">
          <div className="z-empty-ic"><Clock size={26} /></div>
          <h3>{awaitingWeeklyReport ? 'Seu próximo diagnóstico fica pronto na segunda-feira' : loadedOnce ? 'Ainda não há insights para este site' : 'Carregando insights…'}</h3>
          <p>{awaitingWeeklyReport
            ? 'Os insights comparam semanas completas. Assim que a semana fechar, eles aparecem aqui sozinhos.'
            : 'Para comparar semanas, o Analizi precisa de pelo menos 7 dias de dados do seu site. Confira se o rastreador está recebendo visitas.'}</p>
          <Button variant="secondary" onClick={() => setPage('settings')}>Ver status do rastreador</Button>
        </section>
      ) : (
        <>
          <section className="z-hero" aria-label="Resumo da semana">
            <div className="z-hero-l">
              <span className="z-izi"><Sparkles size={13} />Resumo da IZI Intelligence</span>
              <h2>{headline}</h2>
              <div className="z-hero-meta">
                <span><Calendar size={14} />{reportDate ? `Diagnóstico gerado em ${reportDate}` : 'Diagnóstico semanal'}</span>
                <span><RefreshCw size={14} />Próximo: {nextMonday()}</span>
              </div>
            </div>
            <div className="z-kpis" aria-label={`Seus números nos últimos ${periodDays} dias`}>
              <InsightKpi label={`Usuários · ${periodDays} dias`} value={t?.users !== undefined ? Number(t.users).toLocaleString('pt-BR') : '—'} current={t?.users} previous={p?.users} series={daily.map((d) => Number(d.users || 0))} color="#8FB8FF" />
              <InsightKpi label="Contatos iniciados" value={t?.contacts !== undefined ? Number(t.contacts).toLocaleString('pt-BR') : '—'} current={t?.contacts} previous={p?.contacts} series={daily.map((d) => Number(d.contacts || 0))} color="#FF7AC6" />
              <InsightKpi label="Visitas que viram contato" value={contactRate} current={rate(t?.contactSessions, t?.sessions)} previous={rate(p?.contactSessions, p?.sessions)} series={daily.map((d) => rate(d.contacts, d.sessions))} color="#FFC48A" />
            </div>
          </section>

          <div className="z-ins-layout">
            <div className="z-ins-main">
              <div className="z-toolbar">
                <div className="z-seg" role="tablist" aria-label="Filtrar insights">
                  {chips.map((c) => (
                    <button key={c.id} type="button" role="tab" aria-selected={filter === c.id} className={`z-sg ${filter === c.id ? 'on' : ''}`} onClick={() => setFilter(c.id)}>
                      {c.id !== 'all' && <span className={`z-dot ${c.id}`} />}{c.label}<em>{c.count}</em>
                    </button>
                  ))}
                </div>
                <span className="z-muted-sm">Ordenado por prioridade</span>
              </div>

              <div className="z-list">
                {visible.map((item) => {
                  const terms = INSIGHT_GLOSSARY.filter((g) => g.test.test(`${item.title} ${item.finding} ${item.action} ${item.projection}`));
                  const target = insightTarget(item);
                  return (
                    <article className={`z-ins ${item.kind}`} key={item.id}>
                      <div className="z-ins-b">
                        <div>
                          <div className="z-ins-top">
                            <span className="z-kind">
                              {item.kind === 'warn' ? <AlertTriangle size={13} /> : item.kind === 'good' ? <CircleCheck size={13} /> : <Lightbulb size={13} />}
                              {INSIGHT_KIND_LABEL[item.kind]}
                            </span>
                            <span className="z-muted-sm">{INSIGHT_PRIORITY[item.kind]}</span>
                            {item.badge && <span className="z-mtag">{item.badge}</span>}
                          </div>
                          <h3>{formatInsightText(item.title)}</h3>
                          <p className="z-finding">{formatInsightText(item.finding)}</p>
                          {terms.length > 0 && (
                            <div className="z-gloss-row">
                              {terms.map((g) => {
                                const gk = `${item.id}:${g.term}`;
                                return (
                                  <div key={gk}>
                                    <button type="button" className="z-gl-btn" aria-expanded={!!openGloss[gk]} onClick={() => setOpenGloss({ ...openGloss, [gk]: !openGloss[gk] })}>O que é {g.term}?</button>
                                    {openGloss[gk] && <p className="z-gl">{g.text}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="z-todo">
                            <span className="z-todo-ic"><Check size={15} /></span>
                            <div><h4>O que fazer?</h4><p>{formatInsightText(item.action)}</p></div>
                          </div>
                        </div>
                        <div className="z-evi">
                          <span className="z-evi-h">O que esperar?</span>
                          <p>{formatInsightText(item.projection)}</p>
                        </div>
                      </div>
                      <div className="z-ins-f">
                        <small><BarChart3 size={13} />Baseado nos dados do Rastreador Analizi</small>
                        <div className="z-ins-f-r">
                          {target && <button type="button" className="z-lnk" onClick={() => setPage(target.page)}>{target.label}</button>}
                          <button type="button" className="z-btn sec sm" onClick={() => markDone(item.id)}><Check size={14} />Marcar como feito</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!visible.length && (
                  <div className="z-card z-empty">
                    <div className="z-empty-ic"><CircleCheck size={26} /></div>
                    <h3>{open.length ? 'Nada nesta categoria esta semana' : 'Tudo feito por esta semana'}</h3>
                    <p>{open.length ? 'Escolha “Todos” para ver as outras recomendações.' : `Você concluiu todas as recomendações. O próximo diagnóstico chega ${nextMonday()}.`}</p>
                  </div>
                )}
              </div>

              {done.length > 0 && (
                <details className="z-done" open={!open.length}>
                  <summary>Feitos nesta semana ({done.length})</summary>
                  {done.map((item) => (
                    <div className="z-done-row" key={item.id}>
                      <span><CircleCheck size={16} />{formatInsightText(item.title)}</span>
                      <button type="button" className="z-btn ghost sm" onClick={() => undo(item.id)}>Desfazer</button>
                    </div>
                  ))}
                </details>
              )}
            </div>

            <aside className="z-rail">
              <div className="z-card">
                <h3>Seu progresso</h3>
                <p className="z-sub" style={{ marginBottom: 14 }}>Recomendações desta semana</p>
                <div className="z-ring">
                  <svg width="78" height="78" viewBox="0 0 80 80" role="img" aria-label={`${done.length} de ${total} feitos`}>
                    <circle cx="40" cy="40" r="34" fill="none" className="z-ring-bg" strokeWidth="8" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#D61F83" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(progress * C).toFixed(1)} ${C}`} transform="rotate(-90 40 40)" />
                  </svg>
                  <div><b>{done.length} de {total}</b><p className="z-sub" style={{ margin: 0 }}>{!open.length ? 'Semana concluída' : done.length ? `Faltam ${open.length}` : 'Comece pelos pontos de atenção'}</p></div>
                </div>
              </div>
              {open.length > 0 && (
                <div className="z-card">
                  <h3>Comece por aqui</h3>
                  <ol className="z-rl">
                    {open.slice(0, 3).map((item, n) => <li key={item.id}><i>{n + 1}</i><span>{formatInsightText(item.title)}</span></li>)}
                  </ol>
                </div>
              )}
              <div className="z-card z-soft">
                <h3 className="z-h-ic"><Info size={16} />Como os insights funcionam</h3>
                <p className="z-sub" style={{ marginTop: 8 }}>Toda segunda, a IZI compara a semana que fechou com a anterior, considerando o segmento do seu negócio{currentBusiness?.subsegment ? ` (${currentBusiness.subsegment})` : ''}. Por isso eles não mudam quando você troca as datas em outras telas.</p>
              </div>
            </aside>
          </div>
        </>
      )}

      {toast && (
        <div className="z-toast" role="status">
          <CircleCheck size={16} />{toast.text}
          {toast.undoKey && <button type="button" className="z-btn ghost sm" onClick={() => { undo(toast.undoKey!); setToast(null); }}>Desfazer</button>}
        </div>
      )}
    </>
  );
}


type AuthPage = 'loading' | 'landing' | 'login' | 'signup' | 'consent' | 'onboarding-business' | 'onboarding-source' | 'app'
interface AnalyticsTotals { pageViews?: number, users?: number, newUsers?: number, sessions?: number, contacts?: number, whatsappContacts?: number, signUps?: number, formSubmits?: number, logins?: number, attentionSeconds?: number, contactSessions?: number }
interface LocationRow { country: string, region: string, city: string, views: number, users: number, sessions: number, conversions: number }
interface DeviceRow { device: string, browser: string, sessions: number, users: number, newUsers: number, views: number, conversions: number }
interface SourceMediumResultRow {
  source: string,
  medium: string,
  campaign: string,
  device?: string,
  browser?: string,
  page?: string,
  sessions: number,
  pageViews?: number,
  views?: number,
  users: number,
  newUsers?: number,
  generalClicks: number,
  contactClicks: number,
  whatsappClicks: number,
  conversions?: number,
  signUps?: number,
  logins?: number,
}
interface AnalyticsData {
  totals: AnalyticsTotals,
  previousTotals?: AnalyticsTotals,
  sources: Array<{ name: string, value: string | number }>,
  pages: Array<{ path: string, views: string | number, title?: string, attentionSeconds?: number, exitRate?: number, loadTimeMs?: number }>,
  daily: Array<{ date: string, pageViews: number, users: number, contacts: number, sessions?: number }>,
  sourcePages?: Array<{ source: string, path: string, views: number, users: number }>,
  locations?: LocationRow[],
  devices?: DeviceRow[],
  sourceMediumResults?: SourceMediumResultRow[],
  pageConversionResults?: Array<{ path: string, sessions: number, whatsappClicks: number, signUps: number, contactSessions: number }>,
  conversionEvents?: Array<{ date: string, type: string, name: string, stage: 'confirmada' | 'intencao', path: string, conversions: number, sessions: number }>,
  contactDetails?: Array<{ date: string, type: string, path: string, contacts: number }>,
  clickDetails?: Array<{ date: string, path: string, label: string, buttonId?: string, destination?: string, intent?: string, isContactLead?: number, clicks: number, sessions: number }>,
  filterPages?: Array<{ path: string }>,
  filterSources?: Array<{ source: string }>,
  filterMediums?: Array<{ medium: string }>,
  filterCampaigns?: Array<{ campaign: string }>,
  filterDevices?: Array<{ device: string }>,
  filterBrowsers?: Array<{ browser: string }>,
  peakHours?: Array<{ dayOfWeek: number, hourOfDay: number, sessions: number, views: number, contacts: number }>,
  periodDays?: number,
  sourceKind?: string,
  dataSource?: 'd1' | 'ga4' | string,
  granularity?: 'daily' | 'monthly' | 'mixed' | string,
  lastSyncedAt?: string | null,
  syncStatus?: string | null,
  lastSyncError?: string | null
}
interface AnalyticsFilter {
  start: string,
  end: string,
  group: 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year',
  page: string,
  source: string,
  medium?: string,
  campaign?: string,
  device?: string,
  browser?: string
}

function pageFromPath(): Page { const path = window.location.pathname; if (path === '/aquisicao') return 'acquisition'; if (path === '/publico') return 'audience'; if (path === '/paginas') return 'pages'; if (path === '/resultados') return 'results'; if (path === '/heatmap') return 'heatmap'; if (path === '/insights' || path === '/relatorio-semanal') return 'weekly-report'; if (path === '/admin/relatorios') return 'reports-admin'; if (path === '/admin/resultados') return 'results-admin'; if (path === '/relatorios/geral') return 'report-geral'; if (path === '/relatorios/contatos') return 'report-contatos'; if (path === '/relatorios/visitas') return 'report-visitas'; if (path === '/relatorios/regiao') return 'report-regiao'; if (path === '/configuracoes/negocio') return 'team'; if (path === '/configuracoes/fontes-de-dados') return 'data-sources'; if (path === '/configuracoes/rastreador') return 'tracker-setup'; if (path === '/configuracoes/google-analytics') return 'ga4-setup'; if (path.startsWith('/configuracoes')) return 'settings'; if (path === '/painel') return 'dashboard'; return 'weekly-report' }
function dateString(date: Date) { return date.toISOString().slice(0, 10) }
function shiftDays(base: string, offset: number) { const d = new Date(`${base}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return dateString(d) }
function shiftMonths(base: string, offset: number) { const d = new Date(`${base.slice(0, 7)}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + offset); return dateString(d) }
function comparison(current?: number, previous?: number) { const now = Number(current || 0); const before = Number(previous || 0); if (!before) return { variation: now ? 'novo no período' : 'sem dados', good: true }; const percent = Math.round(Math.abs(((now - before) / before) * 100)); return { variation: `${percent}%`, good: now >= before } }
function readAnalyticsFilter(): AnalyticsFilter {
  const params = new URLSearchParams(window.location.search);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const valid = (value: string | null) => Boolean(value && value.length === 10 && value[4] === '-' && value[7] === '-' && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));
  // Os relatórios vão até ontem (D-1): os dados são consolidados uma vez por dia, à meia-noite.
  const yesterday = shiftDays(today, -1);
  let end = valid(params.get('end')) ? params.get('end')! : yesterday;
  if (end > yesterday) end = yesterday;
  let start = valid(params.get('start')) ? params.get('start')! : shiftDays(end, -6);
  if (start > end) start = end;
  if (start < shiftDays(end, -729)) start = shiftDays(end, -729);
  const requestedGroup = params.get('group');
  const group = requestedGroup === 'week' || requestedGroup === 'month' || requestedGroup === 'quarter' || requestedGroup === 'semester' || requestedGroup === 'year' ? requestedGroup : 'day';
  const effectiveGroup = start < shiftMonths(today, -5) && (group === 'day' || group === 'week') ? 'month' : group;
  return {
    start,
    end,
    group: effectiveGroup,
    page: params.get('page') || '',
    source: params.get('source') || '',
    medium: params.get('medium') || '',
    campaign: params.get('campaign') || '',
    device: params.get('device') || '',
    browser: params.get('browser') || ''
  };
}
function selectedDays() { const filter = readAnalyticsFilter(); return Math.floor((Date.parse(`${filter.end}T00:00:00Z`) - Date.parse(`${filter.start}T00:00:00Z`)) / 86_400_000) + 1 }

// Relatórios semanais one-page (ainda fora do menu): /relatorios/geral|contatos|visitas|regiao
function Report({ kind }: { kind: ReportKind }) {
  const analytics = useAnalytics();
  const filter = readAnalyticsFilter();
  return <WeeklyReport kind={kind} data={analytics as unknown as ReportData | null} start={filter.start} end={filter.end} normalizeSource={normalizeOriginName} />;
}

function useAnalytics() {
  const { currentSite } = useBusiness();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [filter, setFilter] = useState<AnalyticsFilter>(readAnalyticsFilter);
  useEffect(() => {
    const onPop = () => setFilter(readAnalyticsFilter());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    const load = async () => {
      if (!currentSite) {
        setData(null);
        return;
      }
      const source = supabase ? await supabase.from('data_sources').select('kind,status').eq('site_id', currentSite.id) : null;
      const ga4Connected = GA4_ENABLED && currentSite.analytics_source === 'ga4' && (source?.data?.some(item => item.kind === 'ga4' && item.status === 'connected') || false);
      const activeSource = ga4Connected ? 'ga4' : 'tracker';

      // Um site conectado somente ao GA4 não precisa, nem deve depender, de
      // um identificador do Rastreador Analizi para abrir os painéis.
      if (activeSource === 'tracker' && !currentSite.tracker_site_id) {
        setData(null);
        return;
      }
      const query = new URLSearchParams({ start: filter.start, end: filter.end, group: filter.group });
      if (filter.page) query.set('page', filter.page);
      if (filter.source) query.set('source', filter.source);
      if (filter.medium) query.set('medium', filter.medium);
      if (filter.campaign) query.set('campaign', filter.campaign);
      if (filter.device) query.set('device', filter.device);
      if (filter.browser) query.set('browser', filter.browser);
      try {
        if (ga4Connected) query.set('siteId', currentSite.id);
        const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
        const response = await fetch(ga4Connected
          ? `https://analizi.carvalhopaula1990.workers.dev/v1/ga4/analytics?${query}`
          : `https://analizi.carvalhopaula1990.workers.dev/v1/analytics/${currentSite.tracker_site_id}?${query}`, {
          headers: session?.access_token ? { authorization: `Bearer ${session.access_token}` } : undefined
        });
        if (response.ok) {
          const payload = await response.json() as AnalyticsData;
          // Não use a primeira fonte retornada pelo banco: quando as duas
          // conexões existem, sua ordem não é garantida. O selo e todos os
          // painéis devem refletir a fonte que o usuário selecionou.
          setData({ ...payload, sourceKind: activeSource });
          if (activeSource === 'tracker' && supabase && currentSite.id && payload?.totals && (Number(payload.totals.pageViews || 0) > 0 || Number(payload.totals.users || 0) > 0)) {
            void supabase.from('data_sources').update({
              status: 'connected',
              last_synced_at: new Date().toISOString()
            }).eq('site_id', currentSite.id).eq('status', 'pending');
          }
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      }
    };
    void load();
  }, [filter, currentSite]);
  return data;
}

function AnalyticsFilters({ analytics }: { analytics: AnalyticsData | null }) {
  const [filter, setFilter] = useState<AnalyticsFilter>(readAnalyticsFilter);
  const maxAvailableDate = shiftDays(dateString(new Date()), -1);

  useEffect(() => {
    const onPop = () => setFilter(readAnalyticsFilter());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const apply = (next: AnalyticsFilter) => {
    const safeEnd = next.end > maxAvailableDate ? maxAvailableDate : next.end;
    let safeStart = next.start > safeEnd ? safeEnd : next.start;
    if (safeStart < shiftDays(safeEnd, -729)) safeStart = shiftDays(safeEnd, -729);
    const historicalCutoff = shiftMonths(maxAvailableDate, -5);
    const safeGroup = safeStart < historicalCutoff && (next.group === 'day' || next.group === 'week') ? 'month' : next.group;

    const url = new URL(window.location.href);
    url.searchParams.set('start', safeStart);
    url.searchParams.set('end', safeEnd);
    url.searchParams.set('group', safeGroup);
    if (next.page) url.searchParams.set('page', next.page);
    else url.searchParams.delete('page');
    if (next.source) url.searchParams.set('source', next.source);
    else url.searchParams.delete('source');
    if (next.medium) url.searchParams.set('medium', next.medium);
    else url.searchParams.delete('medium');
    if (next.campaign) url.searchParams.set('campaign', next.campaign);
    else url.searchParams.delete('campaign');
    if (next.device) url.searchParams.set('device', next.device);
    else url.searchParams.delete('device');
    if (next.browser) url.searchParams.set('browser', next.browser);
    else url.searchParams.delete('browser');

    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const preset = (days: number) => {
    const end = maxAvailableDate;
    apply({ ...filter, start: shiftDays(end, -days + 1), end });
  };

  const currentDays = Math.floor((Date.parse(`${filter.end}T00:00:00Z`) - Date.parse(`${filter.start}T00:00:00Z`)) / 86_400_000) + 1;
  const historicalRange = filter.start < shiftMonths(maxAvailableDate, -5);

  const uniqueSources = Array.from(new Set((analytics?.filterSources ?? []).map(item => normalizeOriginName(item.source))));
  const uniqueMediums = Array.from(new Set((analytics?.filterMediums ?? []).map(item => item.medium).filter(Boolean)));
  const uniqueCampaigns = Array.from(new Set((analytics?.filterCampaigns ?? []).map(item => item.campaign).filter(Boolean)));
  const uniqueDevices = Array.from(new Set((analytics?.filterDevices ?? []).map(item => item.device).filter(Boolean)));
  const uniqueBrowsers = Array.from(new Set((analytics?.filterBrowsers ?? []).map(item => item.browser).filter(Boolean)));

  const [open, setOpen] = useState(false);
  const activeFilters: Array<{ key: keyof AnalyticsFilter, label: string }> = [
    filter.page ? { key: 'page' as const, label: `Página: ${filter.page === '/' ? 'Página inicial' : filter.page}` } : null,
    filter.device ? { key: 'device' as const, label: `Aparelho: ${formatDeviceName(filter.device)}` } : null,
    filter.browser ? { key: 'browser' as const, label: `Navegador: ${filter.browser}` } : null,
    filter.source ? { key: 'source' as const, label: `Origem: ${filter.source}` } : null,
    filter.medium ? { key: 'medium' as const, label: `Mídia: ${formatMediumName(filter.medium)}` } : null,
    filter.campaign ? { key: 'campaign' as const, label: `Campanha: ${filter.campaign}` } : null,
  ].filter(Boolean) as Array<{ key: keyof AnalyticsFilter, label: string }>;
  const groupLabel: Record<AnalyticsFilter['group'], string> = { day: 'dia', week: 'semana', month: 'mês', quarter: 'trimestre', semester: 'semestre', year: 'ano' };
  const presets: Array<[number, string]> = [[7, '7D'], [14, '14D'], [30, '30D'], [90, '90D'], [365, '1A']];

  return (
    <div className="rp rp-filters">
      <div className="rp-fbar">
        <div className="rp-seg" role="group" aria-label="Período rápido">
          {presets.map(([days, label]) => (
            <button key={label} type="button" className={(days === 365 ? currentDays >= 360 : currentDays === days) ? 'on' : ''} onClick={() => preset(days)} title={`Últimos ${days === 365 ? '12 meses' : `${days} dias`}`}>{label}</button>
          ))}
        </div>
        <div className="rp-range">
          <Calendar size={14} />
          <input type="date" aria-label="Data inicial" value={filter.start} max={filter.end} min={shiftDays(filter.end, -729)} onChange={(event) => apply({ ...filter, start: event.target.value })} />
          <span>–</span>
          <input type="date" aria-label="Data final" value={filter.end} max={maxAvailableDate} min={filter.start} onChange={(event) => apply({ ...filter, end: event.target.value })} />
        </div>
        <button type="button" className="rp-fbtn" aria-expanded={open} onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={14} />Filtros {activeFilters.length > 0 && <em>{activeFilters.length}</em>}
          <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </button>
        <span className="rp-cmp">
          {currentDays} {currentDays === 1 ? 'dia' : 'dias'}, agrupado por {groupLabel[filter.group]} · comparado aos {currentDays} dias anteriores{' '}
          <Help align="right" title="Comparação" what="As setas verdes e rosas comparam este período com o mesmo número de dias logo antes dele." tip="Use 30D para ver tendências. Períodos curtos variam mais." />
        </span>
      </div>
      {activeFilters.length > 0 && !open && (
        <div className="rp-active-filters">
          {activeFilters.map(f => (
            <button key={f.key} type="button" title="Remover este filtro" onClick={() => apply({ ...filter, [f.key]: '' })}>{f.label} ×</button>
          ))}
        </div>
      )}
      {open && (
        <div className="rp-adv">
          <label>Agrupar por
            <select value={filter.group} onChange={(event) => apply({ ...filter, group: event.target.value as AnalyticsFilter['group'] })}>
              <option value="day" disabled={historicalRange}>Dia</option><option value="week" disabled={historicalRange}>Semana</option><option value="month">Mês</option>
              <option value="quarter">Trimestre</option><option value="semester">Semestre</option><option value="year">Ano</option>
            </select>
          </label>
          <label>Página
            <select value={filter.page} onChange={(event) => apply({ ...filter, page: event.target.value })}>
              <option value="">Todas as páginas</option>
              {(analytics?.filterPages ?? []).map(item => <option key={item.path} value={item.path}>{item.path === '/' ? '/ (Página inicial)' : item.path}</option>)}
            </select>
          </label>
          <label>Aparelho
            <select value={filter.device || ''} onChange={(event) => apply({ ...filter, device: event.target.value })}>
              <option value="">Todos</option>
              {uniqueDevices.map(dev => <option key={dev} value={dev}>{formatDeviceName(dev)}</option>)}
            </select>
          </label>
          <label>Navegador
            <select value={filter.browser || ''} onChange={(event) => apply({ ...filter, browser: event.target.value })}>
              <option value="">Todos</option>
              {uniqueBrowsers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label>Origem
            <select value={filter.source} onChange={(event) => apply({ ...filter, source: event.target.value })}>
              <option value="">Todas</option>
              {uniqueSources.map(sourceName => <option key={sourceName} value={sourceName}>{sourceName}</option>)}
            </select>
          </label>
          <label>Mídia
            <select value={filter.medium || ''} onChange={(event) => apply({ ...filter, medium: event.target.value })}>
              <option value="">Todas</option>
              {uniqueMediums.map(m => <option key={m} value={m}>{formatMediumName(m)}</option>)}
            </select>
          </label>
          <label>Campanha
            <select value={filter.campaign || ''} onChange={(event) => apply({ ...filter, campaign: event.target.value })}>
              <option value="">Todas</option>
              {uniqueCampaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div className="rp-adv-foot">
            <span>Os filtros valem para todas as telas de relatório. Origem é de onde a pessoa veio (Google, Instagram…). Mídia é o tipo de tráfego (orgânico, pago, social).</span>
            {activeFilters.length > 0 && <button type="button" className="rp-link" onClick={() => apply({ ...filter, page: '', device: '', browser: '', source: '', medium: '', campaign: '' })}>Limpar filtros</button>}
          </div>
        </div>
      )}
      {analytics?.sourceKind === 'ga4' && analytics.granularity && analytics.granularity !== 'daily' && (
        <div className="rp-guide" role="note" style={{ marginTop: 8 }}>
          <Info size={16} />
          <span><b>{analytics.granularity === 'monthly' ? 'Histórico mensal.' : 'Histórico com granularidade mista.'}</b> Acima de 6 meses, o GA4 é apresentado por mês. Usuários nesse período representam usuários-dia somados, não pessoas únicas no mês.</span>
        </div>
      )}
      {historicalRange && (
        <div className="rp-guide" role="note" style={{ marginTop: 8 }}>
          <Info size={16} />
          <span>Períodos acima de seis meses usam dados mensais. As opções <b>Dia</b> e <b>Semana</b> ficam bloqueadas porque essa granularidade não está disponível.</span>
        </div>
      )}
    </div>
  );
}

function Landing({ setMode }: { setMode: (mode: AuthPage) => void }) {
  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  return (
    <LandingPage
      onLogin={() => setMode('login')}
      onStartTrial={() => setMode('signup')}
    />
  );
}

function ConnectionStatus({ compact = false }: { compact?: boolean }) {
  const { currentSite, loading: businessLoading } = useBusiness();
  const [state, setState] = useState<'loading' | 'none' | 'configured' | 'pending' | 'warning_24h' | 'inactive_24h' | 'ready'>('loading');
  const [updatedAt, setUpdatedAt] = useState('');
  const [ga4SyncIssue, setGa4SyncIssue] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setState('loading');
    const load = async () => {
      if (businessLoading) return;
      if (!currentSite?.id) {
        if (isMounted) { setState('none'); setGa4SyncIssue(false); }
        return;
      }
      if (!supabase) {
        if (isMounted) { setState('ready'); setGa4SyncIssue(false); }
        return;
      }

      try {
        const source = await supabase
          .from('data_sources')
          .select('id,kind,status,connected_at,last_synced_at,last_error,created_at')
          .eq('site_id', currentSite.id)
          .order('created_at', { ascending: false });

        const ga4Mode = GA4_ENABLED && currentSite.analytics_source === 'ga4';
        const item = ga4Mode
          ? (source?.data ?? []).find(item => item.kind === 'ga4')
          : (source?.data ?? []).find(item => item.kind === 'tracker') || source?.data?.[0];
        // Sites criados antes da tabela de fontes existir podem não ter ainda
        // um registro em data_sources, embora já tenham um rastreador válido.
        // Nesse caso, o status do tracker é a fonte de verdade.
        const trackerConfigured = Boolean(currentSite.tracker_site_id);
        if (!item && !trackerConfigured) {
          // O site já foi selecionado, mas sua fonte ainda pode estar sendo
          // provisionada ou o registro pode estar incompleto. Não apresente
          // isso como “sem conexão”, que orienta o usuário para uma ação
          // incorreta e bloqueia a leitura do estado real do onboarding.
          if (isMounted) setState('configured');
          return;
        }
        const isLegacyTracker = !item && trackerConfigured;

        if (ga4Mode) {
          if (!item) {
            if (isMounted) { setState('none'); setGa4SyncIssue(false); }
            return;
          }
          let lastSync: string | null = item.last_synced_at || null;
          let syncError: string | null = item.last_error || null;
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/ga4/analytics?siteId=${encodeURIComponent(currentSite.id)}&start=${shiftDays(dateString(new Date()), -1)}&end=${shiftDays(dateString(new Date()), -1)}`, {
              headers: session?.access_token ? { authorization: `Bearer ${session.access_token}` } : undefined
            });
            if (response.ok) {
              const payload = await response.json() as { lastSyncedAt?: string | null; lastSyncError?: string | null };
              lastSync = payload.lastSyncedAt || null;
              syncError = payload.lastSyncError || null;
            }
          } catch {
            // o estado salvo no Supabase continua sendo um fallback visual
          }
          const connectedAt = item.connected_at ? new Date(item.connected_at).getTime() : Date.now();
          const hoursSinceConnection = (Date.now() - connectedAt) / (1000 * 60 * 60);
          const hoursSinceLastSync = lastSync ? (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60) : Infinity;
          const hasStaleSync = Boolean(lastSync && hoursSinceLastSync >= 48);
          if (syncError || hasStaleSync) {
            if (isMounted) {
              if (lastSync) setUpdatedAt(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lastSync)));
              setGa4SyncIssue(true);
              setState('warning_24h');
            }
            return;
          }
          if (lastSync && hoursSinceConnection >= 24) {
            if (isMounted) {
              setUpdatedAt(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lastSync)));
              setGa4SyncIssue(false);
              setState('ready');
            }
            return;
          }
          if (isMounted) { setGa4SyncIssue(false); setState(hoursSinceConnection >= 24 ? 'warning_24h' : 'pending'); }
          return;
        }

        // A fonte estar conectada apenas confirma a configuração. Dados só existem
        // depois de uma sincronização ou de um evento recebido pelo tracker.
        let hasEvents = Boolean(item?.last_synced_at);
        let lastEventAt: string | null = item?.last_synced_at || null;

        if (currentSite.tracker_site_id) {
          try {
            const check = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites/${currentSite.tracker_site_id}/status`, { headers: await authHeaders() });
            if (check.ok) {
              const checkData = await check.json() as { configured?: boolean; received?: boolean; lastEventAt?: string | null };
              if (checkData.received) {
                hasEvents = true;
                if (checkData.lastEventAt) lastEventAt = checkData.lastEventAt;
              }
            }
          } catch {
            // falha de rede silenciosa
          }
        }

        if (hasEvents && lastEventAt) {
          const lastEventTime = new Date(lastEventAt).getTime();
          const hoursSinceLastEvent = (Date.now() - lastEventTime) / (1000 * 60 * 60);

          if (item?.status === 'pending') {
            const nowIso = new Date().toISOString();
            void supabase
              .from('data_sources')
              .update({
                status: 'connected',
                connected_at: item.connected_at || nowIso,
                last_synced_at: lastEventAt
              })
              .eq('id', item.id);
          }

          if (isMounted) {
            setUpdatedAt(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lastEventAt)));
            if (hoursSinceLastEvent >= 24) {
              setState('inactive_24h');
            } else {
              setState('ready');
            }
          }
          return;
        }

        if (hasEvents && !lastEventAt) {
          if (isMounted) setState('ready');
          return;
        }

        if (isLegacyTracker) {
          if (isMounted) setState('configured');
          return;
        }

        const createdAt = item?.created_at ? new Date(item.created_at).getTime() : Date.now();
        const hoursSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60);

        if (isMounted) {
          if (hoursSinceCreation >= 24) {
            setState('warning_24h');
          } else {
            setState('pending');
          }
        }
      } catch {
        if (isMounted) { setState('none'); setGa4SyncIssue(false); }
      }
    };

    void load();
    return () => { isMounted = false; };
  }, [currentSite, businessLoading]);

  if (compact && state === 'loading') {
    return <span className="rp-status" aria-busy="true"><i style={{ background: '#9CA3AF', boxShadow: 'none' }} />Verificando a conexão do seu site…</span>;
  }
  if (compact && state === 'ready') {
    const ga4 = GA4_ENABLED && currentSite?.analytics_source === 'ga4';
    return (
      <span className="rp-status" title={updatedAt ? `Última sincronização: ${updatedAt}` : undefined}>
        <i />{ga4 ? <>GA4 conectado · dados até <b>ontem</b></> : <>Conectado · dados até <b>ontem</b>, atualizados à meia-noite</>}
        <Help align="left" title="De quando são os dados" what={ga4 ? 'Os dados do Google Analytics 4 são importados uma vez por dia, então os relatórios vão até ontem.' : 'O rastreador do Analizi consolida as visitas uma vez por dia, à meia-noite (horário de Brasília). Os relatórios mostram os dados até ontem.'} tip={updatedAt ? `Última sincronização: ${updatedAt}.` : undefined} />
      </span>
    );
  }
  if (state === 'loading') {
    return (
      <article className="connection-status loading" aria-busy="true">
        <b>CARREGANDO SEUS DADOS...</b>
        <p>Estamos verificando a conexão do seu site. Isso leva só alguns segundos.</p>
      </article>
    );
  }
  if (state === 'none') {
    return (
      <article className="connection-status danger">
        <b>SUA CONEXÃO NÃO ESTÁ CONFIGURADA.</b>
        <p>Escolha uma fonte de dados em Configurações para começar a acompanhar seu site.</p>
      </article>
    );
  }
  if (state === 'warning_24h') {
    return (
      <article className="connection-status danger">
        <b>{(GA4_ENABLED && currentSite?.analytics_source === 'ga4') ? (ga4SyncIssue ? 'A SINCRONIZAÇÃO DO GA4 PRECISA DE ATENÇÃO.' : 'DADOS DO GA4 AINDA NÃO CAPTURADOS.') : 'NENHUM EVENTO DETECTADO APÓS 24 HORAS.'}</b>
        <p>{currentSite?.analytics_source === 'ga4'
          ? (ga4SyncIssue ? `A última sincronização ${updatedAt ? `registrada em ${updatedAt} ` : ''}falhou ou está desatualizada. Verifique o erro do cron antes de considerar os dados atuais.` : 'A conexão foi autorizada, mas o cron ainda não confirmou dados persistidos. A primeira captura ocorre no próximo ciclo diário e a consulta fica disponível no dia seguinte.')
          : 'Seu site foi configurado há mais de 24 horas, mas ainda não recebemos visitas. Verifique se o código do rastreador foi publicado corretamente.'}</p>
      </article>
    );
  }
  if (state === 'inactive_24h') {
    return (
      <article className="connection-status warning">
        <b>SEM DADOS RECEBIDOS NAS ÚLTIMAS 24 HORAS.</b>
        <p>{updatedAt ? `A última atividade registrada foi em ${updatedAt}.` : 'Nenhuma atividade recente detectada.'} Verifique se o seu site continua no ar e com a tag do Analizi instalada.</p>
      </article>
    );
  }
  if (state === 'pending') {
    return (
      <article className="connection-status">
        <b>{(GA4_ENABLED && currentSite?.analytics_source === 'ga4') ? 'Google Analytics 4 conectado.' : 'Você acabou de conectar seu site.'}</b>
        <p>{(GA4_ENABLED && currentSite?.analytics_source === 'ga4') ? 'A conexão foi testada com sucesso. O próximo cron capturará os dados, que estarão disponíveis para consulta no dia seguinte.' : 'Seus dados serão coletados em até 24 horas.'}</p>
      </article>
    );
  }
  if (state === 'configured') {
    return (
      <article className="connection-status">
        <b>SEU RASTREADOR JÁ ESTÁ CONFIGURADO.</b>
        <p>Aguardamos novos eventos para confirmar a atividade mais recente deste site.</p>
      </article>
    );
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(yesterday);

  return (
    <article className="connection-status success">
      <b>{(GA4_ENABLED && currentSite?.analytics_source === 'ga4') ? `DADOS DO GA4 CAPTURADOS ATÉ ${yesterdayFormatted}.` : 'DADOS DE HOJE ATUALIZADOS A CADA 30 MINUTOS.'}</b>
      <p>{updatedAt ? `Última sincronização: ${updatedAt}.` : 'A próxima atualização será exibida aqui.'}</p>
    </article>
  );
}

function Pages() {
  const analytics = useAnalytics();
  const [tablePage, setTablePage] = useState(0);
  const [pageSortTab, setPageSortTab] = useState<'views' | 'attention' | 'exit' | 'speed'>('views');
  const pages = analytics?.pages ?? [];
  const p = analytics?.previousTotals;

  const sortedPages = [...pages].sort((a, b) => {
    if (pageSortTab === 'attention') {
      return Number(b.attentionSeconds || 0) - Number(a.attentionSeconds || 0);
    }
    if (pageSortTab === 'exit') {
      return Number(a.exitRate ?? 100) - Number(b.exitRate ?? 100);
    }
    if (pageSortTab === 'speed') {
      const aSpeed = a.loadTimeMs && a.loadTimeMs > 0 ? a.loadTimeMs : 999999;
      const bSpeed = b.loadTimeMs && b.loadTimeMs > 0 ? b.loadTimeMs : 999999;
      return aSpeed - bSpeed;
    }
    return Number(b.views || 0) - Number(a.views || 0);
  });

  const visiblePages = sortedPages.slice(tablePage * ITEMS_PER_PAGE, (tablePage + 1) * ITEMS_PER_PAGE);
  const duration = (seconds?: number) => seconds ? `${Math.floor(seconds / 60)}min ${seconds % 60}s` : '—';
  const formatSpeed = (ms?: number) => {
    if (!ms || ms <= 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1).replace('.', ',')}s`;
  };
  const totalViews = pages.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const pagesWithExit = pages.filter(item => item.exitRate != null && Number(item.views || 0) > 0);
  const totalExitViews = pagesWithExit.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const averageExit = totalExitViews > 0
    ? pagesWithExit.reduce((sum, item) => sum + Number(item.exitRate || 0) * Number(item.views || 0), 0) / totalExitViews
    : 0;

  const pagesWithLoad = pages.filter(item => item.loadTimeMs != null && item.loadTimeMs > 0 && Number(item.views || 0) > 0);
  const totalLoadViews = pagesWithLoad.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const averageLoadMs = totalLoadViews > 0
    ? Math.round(pagesWithLoad.reduce((sum, item) => sum + Number(item.loadTimeMs || 0) * Number(item.views || 0), 0) / totalLoadViews)
    : 0;

  const topPage = [...pages].sort((a, b) => Number(b.views || 0) - Number(a.views || 0))[0];
  const topTitle = topPage ? (topPage.title || topPage.path) : '—';
  const maxViews = Math.max(...pages.map(pg => Number(pg.views || 0)), 1);
  const conv = new Map((analytics?.pageConversionResults ?? []).map(c => [c.path, Number(c.contactSessions || 0)]));
  const avgAttention = (() => {
    const v = pages.filter(pg => Number(pg.attentionSeconds || 0) > 0);
    const w = v.reduce((a, pg) => a + Number(pg.views || 0), 0);
    return w ? v.reduce((a, pg) => a + Number(pg.attentionSeconds || 0) * Number(pg.views || 0), 0) / w : 0;
  })();
  const slowPages = pagesWithLoad.filter(pg => Number(pg.loadTimeMs) > 2500);
  // página que prende a leitura mas perde as pessoas depois
  const leaky = [...pages].filter(pg => Number(pg.views || 0) >= 20 && pg.exitRate != null && Number(pg.attentionSeconds || 0) > avgAttention).sort((a, b) => Number(b.exitRate) - Number(a.exitRate))[0];
  const speedTone = (ms?: number) => (!ms ? 'neutral' : ms <= 1800 ? 'good' : ms <= 2500 ? 'warn' : 'bad') as 'good' | 'warn' | 'bad' | 'neutral';
  const exitTone = (e?: number | null) => (e == null ? 'neutral' : e <= 30 ? 'good' : e <= 55 ? 'neutral' : 'bad') as 'good' | 'bad' | 'neutral';
  const bySpeed = [...pagesWithLoad].sort((a, b) => Number(b.loadTimeMs) - Number(a.loadTimeMs)).slice(0, 8);
  const maxLoad = Math.max(3000, ...bySpeed.map(pg => Number(pg.loadTimeMs || 0)));

  return (
    <>
      <PageHeader report title="Suas páginas" subtitle="Quais páginas atraem, prendem e convertem os visitantes."
        guide={<><b>Como ler esta tela:</b> cada linha é uma página do seu site. Os selos coloridos ajudam a achar problemas rápido: <b>verde está bom</b>, <b>laranja merece atenção</b> e <b>rosa precisa melhorar</b>. Clique nas abas para reordenar a tabela.</>} />
      <AnalyticsFilters analytics={analytics}/>
      <div className="rp">
        <div className="rp-grid rp-g5">
          <R.Kpi label="Páginas acompanhadas" value={R.fmt(pages.length)} desc="Endereços com visitas no período"
            help={{ what: 'Quantas páginas diferentes do seu site receberam visitas.' }} />
          <R.Kpi label="Visualizações de páginas" value={R.fmt(totalViews)} delta={R.change(totalViews, p?.pageViews)} desc="Páginas abertas pelos visitantes"
            help={{ what: 'Total de páginas abertas. Uma pessoa que viu 3 páginas conta 3.' }} />
          <R.Kpi label="Página mais vista" text value={topTitle} desc={topPage ? `${topPage.path} · ${Math.round(R.share(Number(topPage.views || 0), totalViews))}% das visualizações` : 'Sem dados'}
            help={{ what: 'A página com mais visualizações. Geralmente é a porta de entrada do site.', tip: 'Garanta que ela tenha um botão de contato visível logo no início.' }} />
          <R.Kpi label="Velocidade média" value={formatSpeed(averageLoadMs)} desc={averageLoadMs ? (averageLoadMs <= 2500 ? 'Dentro do recomendado (até 2,5s)' : 'Acima do recomendado (2,5s)') : 'Tempo para a página abrir'}
            help={{ what: 'Tempo médio para a página aparecer na tela, ponderado pelas visualizações.', why: 'Páginas lentas fazem as pessoas desistirem antes de ver o conteúdo, principalmente no celular.', tip: 'Até 2,5s é considerado bom pelo Google.' }} />
          <R.Kpi label="Taxa média de saída" value={averageExit ? R.fmtPct(averageExit) : '—'} desc="Visitas que terminaram sem interação"
            help={{ what: 'De cada 100 visitas, quantas duraram menos de 10 segundos, viram só 1 página e não geraram contato (padrão do Google Analytics).', tip: 'Quanto menor, melhor. Abaixo de 30% é ótimo.' }} />
        </div>

        <div className="rp-grid">
          <R.Card title="Desempenho das páginas" subtitle="Volume, atenção, velocidade, saída e contatos de cada página"
            actions={<R.Tabs label="Ordenar por" value={pageSortTab} onChange={(v) => { setPageSortTab(v); setTablePage(0); }} options={[{ value: 'views', label: 'Mais acessadas' }, { value: 'speed', label: 'Mais rápidas' }, { value: 'attention', label: 'Maior atenção' }, { value: 'exit', label: 'Menor saída' }]} />}
            read={leaky ? <><b>{leaky.title || leaky.path}</b> prende a leitura ({duration(leaky.attentionSeconds)}), mas {leaky.exitRate}% das visitas saem sem interagir depois dela.</> : undefined}
            tip={leaky ? 'No fim de páginas com bastante leitura, coloque um convite claro: "Fale com a gente no WhatsApp" ou "Agende sua visita".' : undefined}>
            {visiblePages.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr>
                  <th>Página</th><th>Visualizações</th>
                  <th className="r">Tempo de atenção <Help title="Tempo de atenção" what="Tempo médio com a página aberta e visível na tela." /></th>
                  <th className="r">Velocidade <Help title="Velocidade" what="Tempo médio para a página carregar." tip="Verde até 1,8s · laranja até 2,5s · rosa acima disso." /></th>
                  <th className="r">Taxa de saída <Help align="right" title="Taxa de saída" what="Visitas que terminaram sem interação nesta página." tip="Verde até 30% · rosa acima de 55%." /></th>
                  <th className="r">Contatos</th>
                </tr></thead>
                <tbody>{visiblePages.map(item => (
                  <tr key={item.path}>
                    <td className="pg"><b>{item.title || item.path}</b><code>{item.path}</code></td>
                    <td><R.CellBar value={Number(item.views || 0)} max={maxViews} /></td>
                    <td className="r num">{duration(item.attentionSeconds)}</td>
                    <td className="r"><R.Chip tone={speedTone(item.loadTimeMs)}>{formatSpeed(item.loadTimeMs)}</R.Chip></td>
                    <td className="r"><R.Chip tone={exitTone(item.exitRate)}>{item.exitRate == null ? '—' : `${item.exitRate}%`}</R.Chip></td>
                    <td className="r num"><b>{conv.has(item.path) ? R.fmt(conv.get(item.path)) : '—'}</b></td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <R.Empty>Ainda não recebemos visualizações de páginas neste período.</R.Empty>}
            <R.Pager page={tablePage} total={sortedPages.length} perPage={ITEMS_PER_PAGE} setPage={setTablePage} />
          </R.Card>
        </div>

        <div className="rp-grid rp-g2e">
          <R.Card title="Visualizações por página" subtitle="As páginas que mais atraem visitantes"
            read={topPage && totalViews ? <><b>{topTitle}</b> concentra {Math.round(R.share(Number(topPage.views || 0), totalViews))}% de todas as visualizações.</> : undefined}
            tip="Use as páginas mais vistas como vitrine: coloque nelas seus serviços principais e o botão de contato.">
            <R.HBars tone="blue" rows={[...pages].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 8).map(pg => ({ key: pg.path, label: pg.title || pg.path, sub: pg.path, value: Number(pg.views || 0) }))} />
          </R.Card>
          <R.Card title="Velocidade de carregamento" subtitle="Das mais lentas para as mais rápidas. O limite recomendado é 2,5s."
            help={{ what: 'Tempo para a página aparecer, medido nos aparelhos dos seus visitantes.', why: 'Cada segundo a mais aumenta a chance de a pessoa desistir.' }}
            read={bySpeed.length ? (slowPages.length ? <><b>{slowPages.length} {slowPages.length === 1 ? 'página está' : 'páginas estão'}</b> acima de 2,5s.</> : <>Todas as páginas abrem dentro do recomendado.</>) : undefined}
            tip={slowPages.length ? 'Comprima as imagens (formato WebP) e evite vídeos que tocam sozinhos no topo. Isso costuma resolver a maior parte da lentidão.' : undefined}>
            {bySpeed.length ? (
              <R.HBars max={maxLoad} rows={bySpeed.map(pg => ({ key: pg.path, label: pg.title || pg.path, value: Number(pg.loadTimeMs || 0), display: <R.Chip tone={speedTone(pg.loadTimeMs)}>{formatSpeed(pg.loadTimeMs)}</R.Chip>, tone: Number(pg.loadTimeMs) > 2500 ? 'pink' : Number(pg.loadTimeMs) > 1800 ? 'orange' : 'green' }))} />
            ) : <R.Empty>Ainda não medimos a velocidade das páginas neste período.</R.Empty>}
          </R.Card>
        </div>
      </div>
    </>
  );
}

interface SiteMember {
  user_id: string
  role: 'owner' | 'admin' | 'viewer'
  creator_role?: string | null
  created_at: string
  full_name: string
  email: string
}

interface SiteInvitation {
  id: string
  email: string
  role: 'admin' | 'viewer'
  status: string
  created_at?: string
  expires_at?: string
}

const ROLE_DESCRIPTIONS: Record<'owner' | 'admin' | 'viewer', { label: string; badgeClass: string; permissions: string }> = {
  owner: {
    label: 'Proprietário(a)',
    badgeClass: 'owner',
    permissions: 'Acesso total · Gerencia plano, sites, integrações e equipe'
  },
  admin: {
    label: 'Administrador(a)',
    badgeClass: 'admin',
    permissions: 'Acesso total · Visualiza painéis, edita configurações e gerencia equipe'
  },
  viewer: {
    label: 'Visualizador(a)',
    badgeClass: 'viewer',
    permissions: 'Somente leitura · Visualiza relatórios, métricas, páginas e insights'
  }
}

function formatExpirationDate(iso?: string | null, planId?: string): string {
  if (planId === 'admin') {
    if (!iso || iso.startsWith('2099')) return 'Vitalício · Sem expiração (Plano Admin)'
  }
  if (!iso) return 'Renovação automática mensal'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Renovação automática mensal'
  if (d.getUTCFullYear() >= 2090) return 'Vitalício · Sem expiração (Plano Admin)'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

function formatSubscriptionStatus(status?: string): { label: string; badgeClass: string } {
  switch (status) {
    case 'trialing':
      return { label: 'Período de teste', badgeClass: 'trial' }
    case 'past_due':
      return { label: 'Pagamento pendente', badgeClass: 'warning' }
    case 'canceled':
      return { label: 'Cancelada', badgeClass: 'danger' }
    default:
      return { label: 'Ativa', badgeClass: 'active' }
  }
}

type SettingsTab = 'coleta' | 'site' | 'pessoas' | 'plano' | 'avisos'
interface TrackerStatus { received: boolean; lastEventAt: string | null }

function relativeTime(iso?: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return '—'
  const min = Math.round(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}

function useTrackerStatus(trackerSiteId?: string) {
  const [status, setStatus] = useState<TrackerStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const check = async () => {
    if (!trackerSiteId) { setStatus({ received: false, lastEventAt: null }); return null }
    setChecking(true)
    try {
      const response = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites/${trackerSiteId}/status`, { headers: await authHeaders() })
      const data = response.ok ? await response.json() as { received?: boolean; lastEventAt?: string | null } : null
      const next = { received: Boolean(data?.received), lastEventAt: data?.lastEventAt || null }
      setStatus(next)
      return next
    } catch {
      setStatus((current) => current ?? { received: false, lastEventAt: null })
      return null
    } finally {
      setChecking(false)
    }
  }
  useEffect(() => { setStatus(null); void check() }, [trackerSiteId])
  return { status, checking, check }
}

function SettingsToast({ text, onClose }: { text: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!text) return
    const timer = window.setTimeout(onClose, 3500)
    return () => window.clearTimeout(timer)
  }, [text])
  if (!text) return null
  return <div className="z-toast" role="status"><CircleCheck size={16} />{text}</div>
}

function TeamSettings({ setPage }: { setPage: (page: Page) => void }) {
  return <Settings setPage={setPage} initialTab="pessoas" />
}

function DataSources({ setPage }: { setPage: (page: Page) => void }) {
  return <Settings setPage={setPage} initialTab="coleta" />
}

function Settings({ setPage, initialTab = 'coleta' }: { setPage: (page: Page) => void; initialTab?: SettingsTab }) {
  const { currentBusiness, currentSite, effectivePlan } = useBusiness()
  const [tab, setTab] = useState<SettingsTab>(initialTab)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => setTab(initialTab), [initialTab])
  const tracker = useTrackerStatus(currentSite?.tracker_site_id)
  const siteName = currentSite?.name || currentBusiness?.name || 'Meu site'
  const siteDomain = currentSite?.domain || currentBusiness?.website_url || ''
  const initials = siteName.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'S'
  const trackerOk = Boolean(tracker.status?.received)

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number }>; group?: string; dot?: 'ok' | 'warn' }> = [
    { id: 'coleta', label: 'Coleta de dados', icon: Activity, group: 'Site', dot: tracker.status ? (trackerOk ? 'ok' : 'warn') : undefined },
    { id: 'site', label: 'Dados do site', icon: Globe },
    { id: 'pessoas', label: 'Pessoas com acesso', icon: Users, group: 'Conta' },
    { id: 'plano', label: 'Plano e assinatura', icon: CreditCard },
    { id: 'avisos', label: 'E-mails e alertas', icon: Mail }
  ]

  return (
    <div className="z-settings">
      <header className="z-sitebar">
        <span className="z-sav">{initials}</span>
        <div>
          <span className="z-eyebrow">Configurações</span>
          <h1>{siteName}</h1>
          <div className="z-sd">
            {siteDomain && <span>{siteDomain}</span>}
            <span className="z-pill pink">{effectivePlan.name}</span>
            {tracker.status && (trackerOk
              ? <span className="z-pill ok"><span className="z-d" />Coletando dados</span>
              : <span className="z-pill warn"><span className="z-d" />Rastreador sem dados</span>)}
          </div>
        </div>
      </header>

      <div className="z-set">
        <nav className="z-tabs" aria-label="Seções das configurações">
          {tabs.map(({ id, label, icon: Icon, group, dot }) => (
            <div key={id} style={{ display: 'contents' }}>
              {group && <span className="z-grp">{group}</span>}
              <button type="button" className={`z-tab ${tab === id ? 'on' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
                <Icon size={18} />{label}{dot && <span className={`z-st ${dot}`} />}
              </button>
            </div>
          ))}
        </nav>
        <section className="z-pane">
          {tab === 'coleta' && <CollectionTab setPage={setPage} tracker={tracker} onToast={setToast} />}
          {tab === 'site' && <SiteTab onToast={setToast} />}
          {tab === 'pessoas' && <PeopleTab onToast={setToast} />}
          {tab === 'plano' && <PlanTab />}
          {tab === 'avisos' && <AlertsTab onToast={setToast} />}
        </section>
      </div>
      <SettingsToast text={toast} onClose={() => setToast(null)} />
    </div>
  )
}

function CollectionTab({ setPage, tracker, onToast }: { setPage: (page: Page) => void; tracker: ReturnType<typeof useTrackerStatus>; onToast: (t: string) => void }) {
  const { currentSite, refreshBusinesses } = useBusiness()
  const [ga4Connected, setGa4Connected] = useState(false)
  const [updating, setUpdating] = useState(false)
  const domain = currentSite?.domain || 'seu site'
  const status = tracker.status
  const ok = Boolean(status?.received)

  useEffect(() => {
    if (!supabase || !currentSite) return
    let active = true
    void supabase.from('data_sources').select('kind,status').eq('site_id', currentSite.id).then(({ data }) => {
      if (active) setGa4Connected(Boolean(data?.some((item) => item.kind === 'ga4' && item.status === 'connected')))
    })
    return () => { active = false }
  }, [currentSite?.id])

  const chooseSource = async (source: 'tracker' | 'ga4') => {
    if (!supabase || !currentSite || (source === 'ga4' && (!GA4_ENABLED || !ga4Connected))) return
    if ((currentSite.analytics_source || 'tracker') === source) return
    setUpdating(true)
    const { error } = await supabase.from('sites').update({ analytics_source: source }).eq('id', currentSite.id)
    if (error) onToast(error.message)
    else { await refreshBusinesses(); onToast(`Os relatórios agora usam ${source === 'ga4' ? 'Google Analytics 4' : 'Rastreador Analizi'}.`) }
    setUpdating(false)
  }

  const verify = async () => {
    const next = await tracker.check()
    if (next?.received) {
      onToast(`Tudo certo: último dado recebido ${relativeTime(next.lastEventAt)}`)
      if (supabase && currentSite?.id) {
        const nowIso = new Date().toISOString()
        void supabase.from('data_sources').update({ status: 'connected', connected_at: nowIso, last_synced_at: next.lastEventAt || nowIso }).eq('site_id', currentSite.id).eq('kind', 'tracker')
      }
    } else if (next) onToast(`Ainda não recebemos dados de ${domain}`)
  }

  const usingTracker = currentSite?.analytics_source !== 'ga4'

  return (
    <>
      <div className="z-pane-h"><h2>Coleta de dados</h2><p>Como o Analizi recebe as visitas do seu site.</p></div>
      <div className="z-card">
        {!status ? (
          <div className="z-live-l"><div className="z-skel" style={{ width: '30%' }} /><div className="z-skel" style={{ width: '70%' }} /></div>
        ) : ok ? (
          <>
            <div className="z-status-row">
              <span className="z-sicon ok"><Activity size={24} /></span>
              <div style={{ flex: '1 1 300px' }}>
                <span className="z-pill ok"><span className="z-pulse" />Funcionando</span>
                <h3 className="z-h-lg">O rastreador está recebendo dados</h3>
                <p className="z-sub">Visitas, cliques, mapa de calor e rolagem de {domain} estão sendo registrados.</p>
                <div className="z-acts">
                  <button type="button" className="z-btn sec" onClick={() => void verify()} disabled={tracker.checking}><RefreshCw size={15} />{tracker.checking ? 'Verificando…' : 'Verificar agora'}</button>
                  <button type="button" className="z-btn ghost" onClick={() => setPage('tracker-setup')}>Ver código de instalação</button>
                </div>
              </div>
            </div>
            <div className="z-stat-row">
              <div className="z-stat"><small>Último dado recebido</small><b>{relativeTime(status.lastEventAt)}</b></div>
              <div className="z-stat"><small>Data e hora</small><b className="z-b-sm">{status.lastEventAt ? new Date(status.lastEventAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</b></div>
              <div className="z-stat"><small>Fonte dos relatórios</small><b className="z-b-sm">{usingTracker ? 'Rastreador Analizi' : 'Google Analytics 4'}</b></div>
            </div>
          </>
        ) : (
          <div className="z-status-row">
            <span className="z-sicon warn"><AlertTriangle size={24} /></span>
            <div style={{ flex: '1 1 300px' }}>
              <span className="z-pill warn"><span className="z-d" />Sem dados</span>
              <h3 className="z-h-lg">Instale o rastreador para começar</h3>
              <p className="z-sub">Ainda não recebemos visitas de {domain}. É só colar um código no seu site. Leva uns 5 minutos.</p>
              <div className="z-acts">
                <button type="button" className="z-btn pri" onClick={() => setPage('tracker-setup')}>Instalar rastreador</button>
                <button type="button" className="z-btn sec" onClick={() => void verify()} disabled={tracker.checking}>{tracker.checking ? 'Verificando…' : 'Já instalei, verificar'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="z-card">
        <div className="z-card-h"><div><h3>De onde vêm os números</h3><p className="z-sub">A fonte usada em todos os relatórios. Mapa de calor e rolagem sempre vêm do rastreador.</p></div></div>
        <div className="z-opts" role="radiogroup" aria-label="Fonte dos números">
          <button type="button" role="radio" aria-checked={usingTracker} className={`z-opt ${usingTracker ? 'on' : ''}`} disabled={updating} onClick={() => void chooseSource('tracker')}>
            <span className="z-oi"><BrandLogo compact /></span>
            <span><b>Rastreador Analizi</b><small>Visitas, origens, cliques e contatos do seu site</small></span>
            <span className="z-radio" />
          </button>
          <button type="button" role="radio" aria-checked={!usingTracker} className={`z-opt ${!usingTracker && GA4_ENABLED ? 'on' : ''}`} disabled={!GA4_ENABLED || updating || !ga4Connected} onClick={() => void chooseSource('ga4')}>
            <span className="z-oi"><img src="/ga4-icon.png" alt="" width={22} height={22} /></span>
            <span><b className="z-row-8">Google Analytics 4 {!GA4_ENABLED && <span className="z-pill mute">Em breve</span>}</b><small>Use os dados que você já tem no Google</small></span>
            <span className="z-radio" />
          </button>
        </div>
      </div>

      <div className="z-card">
        <div className="z-card-h" style={{ marginBottom: 10 }}><div><h3>Detalhes técnicos</h3><p className="z-sub">Útil se o suporte pedir ou se outra pessoa cuidar do seu site.</p></div></div>
        <div className="z-kv">
          <div className="z-kv-r"><span>Código do site</span><span className="z-row-8"><code>{currentSite?.tracker_site_id || '—'}</code>{currentSite?.tracker_site_id && <button type="button" className="z-btn ghost sm" onClick={() => { void navigator.clipboard?.writeText(currentSite.tracker_site_id); onToast('Código do site copiado') }}>Copiar</button>}</span></div>
          <div className="z-kv-r"><span>Endereço monitorado</span><b>{currentSite?.domain || '—'}</b></div>
          <div className="z-kv-r"><span>Tamanho do script</span><b>menos de 2 KB</b></div>
        </div>
      </div>
    </>
  )
}

const SEGMENT_OPTIONS: Record<'products' | 'services' | 'health', string[]> = {
  products: ['Moda e acessórios', 'Beleza e cosméticos', 'Alimentos e bebidas', 'Casa e decoração', 'Eletrônicos', 'Saúde e bem-estar', 'Pet shop', 'Autopeças e acessórios', 'Livros e papelaria', 'Produtos infantis', 'Outros'],
  services: ['Advocacia', 'Contabilidade', 'Arquitetura e engenharia', 'Construção e reformas', 'Tecnologia', 'Educação', 'Consultoria', 'Fotografia e eventos', 'Beleza e estética', 'Serviços automotivos', 'Outros'],
  health: ['Clínica médica', 'Odontologia', 'Psicologia', 'Fisioterapia', 'Nutrição', 'Dermatologia', 'Exames e diagnóstico', 'Bem-estar e terapias', 'Outros']
}
const normalizeSegment = (value?: string | null): 'products' | 'services' | 'health' => {
  if (value === 'products' || value === 'Produtos') return 'products'
  if (value === 'health' || value === 'Saúde') return 'health'
  return 'services'
}

function SiteTab({ onToast }: { onToast: (t: string) => void }) {
  const { currentBusiness, currentSite, refreshBusinesses } = useBusiness()
  const initial = () => ({
    name: currentSite?.name || currentBusiness?.name || '',
    domain: currentSite?.domain || currentBusiness?.website_url || '',
    segment: normalizeSegment(currentBusiness?.segment),
    subsegment: currentBusiness?.subsegment || '',
    detail: currentBusiness?.segment_detail || '',
    siteType: (isSiteType(currentSite?.site_type) ? currentSite.site_type : 'servicos') as SiteType
  })
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { setForm(initial()); setError(null) }, [currentSite?.id, currentBusiness?.id])
  const base = initial()
  const dirty = JSON.stringify(form) !== JSON.stringify(base)
  const update = (patch: Partial<typeof form>) => { setForm({ ...form, ...patch }); setError(null) }

  const save = async () => {
    if (!currentSite || !currentBusiness) return
    if (form.name.trim().length < 2) { setError('Digite o nome do site.'); return }
    if (form.domain.trim().length < 4) { setError('Digite o endereço do site, como meusite.com.br.'); return }
    if (!form.subsegment) { setError('Escolha a área de atuação.'); return }
    if (form.subsegment === 'Outros' && form.detail.trim().length < 2) { setError('Descreva o seu negócio em uma frase.'); return }
    setSaving(true)
    try {
      const domain = form.domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
      if (supabase) {
        const [{ error: businessError }, { error: siteError }] = await Promise.all([
          supabase.from('businesses').update({ name: form.name.trim(), website_url: domain, segment: form.segment, subsegment: form.subsegment, segment_detail: form.detail.trim() || null }).eq('id', currentBusiness.id),
          supabase.from('sites').update({ name: form.name.trim(), domain, site_type: form.siteType }).eq('id', currentSite.id)
        ])
        if (businessError || siteError) throw new Error(businessError?.message || siteError?.message)
      }
      currentSite.name = form.name.trim()
      currentSite.domain = domain
      currentSite.site_type = form.siteType
      currentBusiness.name = form.name.trim()
      currentBusiness.website_url = domain
      currentBusiness.segment = form.segment
      currentBusiness.subsegment = form.subsegment
      currentBusiness.segment_detail = form.detail.trim() || null
      try {
        const prevB = JSON.parse(localStorage.getItem('analizi-custom-businesses') || '[]') as BusinessItem[]
        localStorage.setItem('analizi-custom-businesses', JSON.stringify(prevB.map((b) => b.id === currentBusiness.id ? { ...b, name: form.name.trim(), website_url: domain, segment: form.segment, subsegment: form.subsegment, segment_detail: form.detail.trim() || null } : b)))
        const prevS = JSON.parse(localStorage.getItem('analizi-custom-sites') || '[]') as SiteItem[]
        localStorage.setItem('analizi-custom-sites', JSON.stringify(prevS.map((s) => s.id === currentSite.id ? { ...s, name: form.name.trim(), domain, site_type: form.siteType } : s)))
      } catch { /* armazenamento indisponível */ }
      await refreshBusinesses()
      setForm({ ...form, domain })
      onToast('Alterações salvas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const segments: Array<{ id: 'services' | 'products' | 'health'; label: string; hint: string }> = [
    { id: 'services', label: 'Serviços', hint: 'Advocacia, consultoria, estética…' },
    { id: 'products', label: 'Produtos', hint: 'Loja virtual ou catálogo' },
    { id: 'health', label: 'Saúde', hint: 'Clínicas e consultórios' }
  ]
  const previewArea = form.subsegment && form.subsegment !== 'Outros' ? form.subsegment : (form.detail || 'seu segmento')

  return (
    <>
      <div className="z-pane-h"><h2>Dados do site</h2><p>Essas informações aparecem nos relatórios e deixam os insights mais específicos para o seu negócio.</p></div>
      <div className="z-two">
        <div className="z-grow">
          <div className="z-card">
            <div className="z-card-h"><div><h3>Identificação</h3><p className="z-sub">Como o site aparece no menu, nos relatórios e nos e-mails.</p></div></div>
            <div className="z-fields">
              <div className="z-fld"><label htmlFor="z-f-name">Nome do site</label><input id="z-f-name" value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ex.: Minha Loja" /></div>
              <div className="z-fld"><label htmlFor="z-f-url">Endereço do site</label><div className="z-pref"><span>https://</span><input id="z-f-url" value={form.domain} onChange={(e) => update({ domain: e.target.value })} placeholder="meusite.com.br" /></div></div>
            </div>
          </div>
          <div className="z-card">
            <div className="z-card-h"><div><h3>Seu negócio</h3><p className="z-sub">Usamos isso para comparar seus números com o que é comum no seu segmento.</p></div></div>
            <div className="z-fld" style={{ marginBottom: 18 }}>
              <span className="z-lbl" id="z-seg-l">O que o seu site oferece?</span>
              <div className="z-opts narrow" role="radiogroup" aria-labelledby="z-seg-l">
                {segments.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={form.segment === s.id} className={`z-opt ${form.segment === s.id ? 'on' : ''}`} onClick={() => update({ segment: s.id, subsegment: '', detail: '' })}>
                    <span><b>{s.label}</b><small>{s.hint}</small></span><span className="z-radio" />
                  </button>
                ))}
              </div>
            </div>
            <div className="z-fields">
              <div className="z-fld"><label htmlFor="z-f-area">Área de atuação</label>
                <select id="z-f-area" value={form.subsegment} onChange={(e) => update({ subsegment: e.target.value })}>
                  <option value="" disabled>Escolha uma opção</option>
                  {SEGMENT_OPTIONS[form.segment].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="z-fld"><span className="z-lbl">Fuso horário</span><div className="z-readonly">Horário de Brasília (São Paulo)</div></div>
              <div className="z-fld full"><label htmlFor="z-f-desc">Descreva seu negócio em uma frase <span className="z-opt-t">{form.subsegment === 'Outros' ? '(obrigatório)' : '(opcional)'}</span></label><textarea id="z-f-desc" value={form.detail} onChange={(e) => update({ detail: e.target.value })} placeholder="Ex.: Clínica odontológica especializada em implantes" /><span className="z-hint">Quanto mais específico, melhores as recomendações dos insights.</span></div>
            </div>
          </div>
          <div className="z-card">
            <div className="z-card-h"><div><h3>O que o seu site gera</h3><p className="z-sub">Define quais resultados aparecem na página Resultados. Todos os dados continuam sendo coletados, então você pode mudar quando quiser.</p></div></div>
            <div className="z-opts narrow" role="radiogroup" aria-label="O que o seu site gera">
              {SITE_TYPE_OPTIONS.map(([id, info]) => (
                <button key={id} type="button" role="radio" aria-checked={form.siteType === id} className={`z-opt ${form.siteType === id ? 'on' : ''}`} onClick={() => update({ siteType: id })}>
                  <span><b>{info.label}</b><small>{info.hint}</small></span><span className="z-radio" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="z-side">
          <div className="z-card">
            <h3>Como a IZI vai usar isso</h3>
            <p className="z-sub" style={{ marginBottom: 14 }}>Prévia com os dados do formulário.</p>
            <div className="z-prev">
              <div className="z-prev-ws"><span className="z-ws-av">{(form.name || 'S').slice(0, 2).toUpperCase()}</span><span><b>{form.name || 'Nome do site'}</b><small>{form.domain || 'meusite.com.br'}</small></span></div>
              <div className="z-prev-c">
                <span className="z-pill blue">Comparado com: {previewArea}</span>
                <p>“Sua taxa de contato está acima da média de sites de {previewArea}.”</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {error && <p className="z-err" role="alert">{error}</p>}
      {dirty && (
        <div className="z-savebar"><span>Você tem alterações não salvas.</span><span className="z-row-6"><button type="button" className="z-btn ghost sm" onClick={() => { setForm(base); setError(null) }}>Descartar</button><button type="button" className="z-btn pri sm" onClick={() => void save()} disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></span></div>
      )}
    </>
  )
}

const ROLE_LABEL: Record<'owner' | 'admin' | 'viewer', string> = { owner: 'Proprietário', admin: 'Administrador', viewer: 'Visualizador' }
const PERMISSIONS: Array<[string, boolean, boolean, boolean]> = [
  ['Ver relatórios, mapa de calor e insights', true, true, true],
  ['Mudar os dados do site e a coleta', true, true, false],
  ['Convidar e remover pessoas', true, true, false],
  ['Mudar plano e assinatura', true, false, false]
]

function PeopleTab({ onToast }: { onToast: (t: string) => void }) {
  const { currentBusiness, currentSite } = useBusiness()
  const businessId = currentBusiness?.id || ''
  const siteName = currentSite?.name || currentBusiness?.name || 'este site'
  const [currentUserId, setCurrentUserId] = useState('')
  const [members, setMembers] = useState<SiteMember[]>([])
  const [invites, setInvites] = useState<SiteInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<null | { kind: 'invite' } | { kind: 'remove-member'; member: SiteMember } | { kind: 'remove-invite'; invite: SiteInvitation }>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'admin'>('viewer')
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    if (!supabase || !businessId) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
      const { data: memberRows } = await supabase.from('business_members').select('user_id, role, creator_role, created_at').eq('business_id', businessId).order('created_at', { ascending: true })
      if (memberRows && memberRows.length > 0) {
        const { data: profileRows } = await supabase.from('profiles').select('id, full_name, email').in('id', memberRows.map((m) => m.user_id))
        const profileMap = new Map((profileRows || []).map((p) => [p.id, { full_name: p.full_name || '', email: p.email || '' }]))
        setMembers(memberRows.map((m) => {
          const prof = profileMap.get(m.user_id)
          const isSelf = user && m.user_id === user.id
          return {
            user_id: m.user_id,
            role: (m.role as 'owner' | 'admin' | 'viewer') || 'viewer',
            creator_role: m.creator_role,
            created_at: m.created_at,
            full_name: prof?.full_name || (isSelf ? user.user_metadata?.full_name || 'Você' : 'Membro da equipe'),
            email: prof?.email || (isSelf ? user.email || '' : '')
          }
        }))
      } else setMembers([])
      const { data: inviteRows } = await supabase.from('business_invitations').select('id, email, role, status, created_at, expires_at').eq('business_id', businessId).order('created_at', { ascending: false })
      setInvites((inviteRows || []).filter((inv) => inv.status !== 'accepted').map((inv) => ({ id: inv.id, email: inv.email, role: (inv.role as 'admin' | 'viewer') || 'viewer', status: inv.status, created_at: inv.created_at, expires_at: inv.expires_at })))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [businessId])

  const changeMemberRole = async (member: SiteMember, next: 'owner' | 'admin' | 'viewer') => {
    if (!supabase || !businessId) return
    if (member.role === 'owner' && next !== 'owner' && members.filter((m) => m.role === 'owner').length <= 1) { onToast('O site precisa ter pelo menos um proprietário.'); return }
    setBusyId(member.user_id)
    const { error } = await supabase.from('business_members').update({ role: next }).eq('business_id', businessId).eq('user_id', member.user_id)
    if (error) onToast(error.message || 'Não foi possível mudar o nível de acesso.')
    else { setMembers((prev) => prev.map((m) => m.user_id === member.user_id ? { ...m, role: next } : m)); onToast(`${member.full_name || member.email} agora é ${ROLE_LABEL[next]}`) }
    setBusyId(null)
  }
  const changeInviteRole = async (inv: SiteInvitation, next: 'admin' | 'viewer') => {
    if (!supabase) return
    setBusyId(inv.id)
    const { error } = await supabase.from('business_invitations').update({ role: next }).eq('id', inv.id)
    if (error) onToast(error.message || 'Não foi possível mudar o convite.')
    else { setInvites((prev) => prev.map((i) => i.id === inv.id ? { ...i, role: next } : i)); onToast('Nível de acesso do convite atualizado') }
    setBusyId(null)
  }
  const confirmRemove = async () => {
    if (!supabase || !modal || modal.kind === 'invite') return
    if (modal.kind === 'remove-member') {
      const member = modal.member
      if (member.role === 'owner' && members.filter((m) => m.role === 'owner').length <= 1) { onToast('O site precisa ter pelo menos um proprietário.'); setModal(null); return }
      setBusyId(member.user_id)
      const { error } = await supabase.from('business_members').delete().eq('business_id', businessId).eq('user_id', member.user_id)
      if (error) onToast(error.message || 'Não foi possível remover o acesso.')
      else { setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id)); onToast('Acesso removido') }
    } else {
      const inv = modal.invite
      setBusyId(inv.id)
      const { error } = await supabase.from('business_invitations').delete().eq('id', inv.id)
      if (error) onToast(error.message || 'Não foi possível cancelar o convite.')
      else { setInvites((prev) => prev.filter((i) => i.id !== inv.id)); onToast('Convite cancelado') }
    }
    setBusyId(null)
    setModal(null)
  }
  const sendInvite = async () => {
    setFormError('')
    const address = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(address)) { setFormError('Digite um e-mail válido, como nome@empresa.com.br.'); return }
    if (!supabase || !businessId) { setFormError('Não foi possível identificar o site selecionado.'); return }
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: existingProfile } = await supabase.from('profiles').select('id, full_name, email').eq('email', address).maybeSingle()
      if (existingProfile?.id) {
        const alreadyMember = 'Esta pessoa já tem acesso a este site. Para mudar o nível, use a lista da equipe.'
        const { data: currentMember, error: memberError } = await supabase.from('business_members').select('user_id').eq('business_id', businessId).eq('user_id', existingProfile.id).maybeSingle()
        if (memberError) { setFormError('Não foi possível conferir a equipe agora. Tente de novo.'); return }
        if (currentMember) { setFormError(alreadyMember); return }
        const { error } = await supabase.from('business_members').insert({ business_id: businessId, user_id: existingProfile.id, role })
        if (error) { setFormError(error.code === '23505' ? alreadyMember : error.message); return }
        // O acesso já foi dado: um convite anterior para este e-mail perde a função.
        await supabase.from('business_invitations').delete().eq('business_id', businessId).eq('email', address)
        onToast(`${existingProfile.full_name || address} já usa o Analizi e recebeu acesso na hora`)
        await load()
      } else {
        const { error } = await supabase.from('business_invitations').upsert({ business_id: businessId, email: address, role, invited_by: user?.id, status: 'pending' }, { onConflict: 'business_id,email' })
        if (error) { setFormError(error.message); return }
        onToast(`Convite enviado para ${address}`)
        await load()
      }
      setModal(null)
      setEmail('')
    } finally {
      setSending(false)
    }
  }

  const q = query.trim().toLowerCase()
  const shownMembers = members.filter((m) => !q || `${m.full_name} ${m.email}`.toLowerCase().includes(q))
  const shownInvites = invites.filter((i) => !q || i.email.toLowerCase().includes(q))
  const totalPeople = members.length + invites.length
  const avatarColors = ['c1', 'c2', 'c3']
  const fmtDate = (iso?: string) => iso ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—'

  return (
    <>
      <div className="z-pane-h z-pane-h-row">
        <div><h2>Pessoas com acesso</h2><p>Quem pode ver os dados de {siteName}. Cada pessoa entra com a própria conta Google.</p></div>
        <button type="button" className="z-btn pri" onClick={() => { setModal({ kind: 'invite' }); setFormError(''); setEmail(''); setRole('viewer') }}><UserPlus size={16} />Convidar pessoa</button>
      </div>
      <div className="z-tbl-w">
        <div className="z-tbl-top">
          <b>{totalPeople} {totalPeople === 1 ? 'pessoa' : 'pessoas'}</b>
          <label className="z-search"><Search size={16} /><input aria-label="Buscar pessoa" placeholder="Buscar por nome ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        </div>
        <table className="z-tbl">
          <thead><tr><th scope="col">Pessoa</th><th scope="col">Nível de acesso</th><th scope="col">Desde</th><th scope="col"><span className="z-sr">Ações</span></th></tr></thead>
          <tbody>
            {loading && !members.length && <tr><td colSpan={4} className="z-muted-sm">Carregando pessoas…</td></tr>}
            {shownMembers.map((m, i) => {
              const isSelf = m.user_id === currentUserId
              const initials = (m.full_name || m.email || 'U').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
              return (
                <tr key={m.user_id}>
                  <td><div className="z-who"><span className={`z-av ${avatarColors[i % 3]}`}>{initials}</span><div><b>{m.full_name || m.email}{isSelf && <span className="z-pill pink">Você</span>}</b><small>{m.email || 'Acesso pela conta Google'}</small></div></div></td>
                  <td>{isSelf
                    ? <span className="z-role-ro">{ROLE_LABEL[m.role]}</span>
                    : <select aria-label={`Nível de acesso de ${m.full_name || m.email}`} value={m.role} disabled={busyId === m.user_id} onChange={(e) => void changeMemberRole(m, e.target.value as 'owner' | 'admin' | 'viewer')}>
                        <option value="owner">Proprietário</option><option value="admin">Administrador</option><option value="viewer">Visualizador</option>
                      </select>}
                  </td>
                  <td className="z-muted-sm z-nowrap">{fmtDate(m.created_at)}</td>
                  <td className="z-right">{!isSelf && <button type="button" className="z-btn ghost sm" disabled={busyId === m.user_id} onClick={() => setModal({ kind: 'remove-member', member: m })}>Remover</button>}</td>
                </tr>
              )
            })}
            {shownInvites.map((inv) => {
              const revoked = inv.status === 'revoked'
              const expired = inv.status === 'expired' || (!!inv.expires_at && new Date(inv.expires_at).getTime() <= Date.now())
              return (
              <tr key={inv.id} className="pend">
                <td><div className="z-who"><span className="z-av inv">@</span><div><b>{inv.email}<span className="z-pill warn">{revoked ? 'Convite cancelado' : expired ? 'Convite vencido' : 'Convite pendente'}</span></b><small>{revoked || expired ? 'Convide de novo para liberar mais 7 dias' : 'Ainda não entrou no Analizi'}</small></div></div></td>
                <td><select aria-label={`Nível de acesso do convite para ${inv.email}`} value={inv.role} disabled={busyId === inv.id} onChange={(e) => void changeInviteRole(inv, e.target.value as 'admin' | 'viewer')}><option value="admin">Administrador</option><option value="viewer">Visualizador</option></select></td>
                <td className="z-muted-sm z-nowrap">{inv.expires_at && !revoked ? `${expired ? 'Venceu' : 'Vence'} em ${fmtDate(inv.expires_at)}` : `Convidado em ${fmtDate(inv.created_at)}`}</td>
                <td className="z-right"><button type="button" className="z-btn ghost sm" disabled={busyId === inv.id} onClick={() => setModal({ kind: 'remove-invite', invite: inv })}>Cancelar convite</button></td>
              </tr>
              )
            })}
            {!loading && !shownMembers.length && !shownInvites.length && <tr><td colSpan={4} className="z-muted-sm">{q ? 'Ninguém encontrado com essa busca.' : 'Nenhuma pessoa encontrada para este site.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="z-card z-flush">
        <div className="z-flush-h"><h3>O que cada nível pode fazer</h3></div>
        <table className="z-tbl z-ltab">
          <thead><tr><th scope="col">Pode…</th><th scope="col">Proprietário</th><th scope="col">Administrador</th><th scope="col">Visualizador</th></tr></thead>
          <tbody>
            {PERMISSIONS.map(([label, ...flags]) => (
              <tr key={label}><td>{label}</td>{flags.map((f, i) => <td key={i}>{f ? <Check size={18} className="z-yes" aria-label="Sim" /> : <Minus size={18} className="z-no" aria-label="Não" />}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === 'invite' && (
        <div className="z-ov" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="z-modal" role="dialog" aria-modal="true" aria-labelledby="z-inv-t">
            <span className="z-m-ic"><UserPlus size={22} /></span>
            <div><h2 id="z-inv-t">Convidar pessoa</h2><p className="z-mlead">Ela vai ver os dados de {siteName} depois de entrar com a conta Google deste e-mail.</p></div>
            <div className="z-fld"><label htmlFor="z-inv-mail">E-mail</label><input id="z-inv-mail" type="email" autoFocus placeholder="nome@empresa.com.br" value={email} onChange={(e) => { setEmail(e.target.value); setFormError('') }} onKeyDown={(e) => { if (e.key === 'Enter') void sendInvite() }} />{formError && <span className="z-err">{formError}</span>}</div>
            <div className="z-fld">
              <span className="z-lbl" id="z-inv-r">Nível de acesso</span>
              <div className="z-stack-8" role="radiogroup" aria-labelledby="z-inv-r">
                {([['viewer', 'Visualizador', 'Vê relatórios, mapa de calor e insights. Não muda nada.'], ['admin', 'Administrador', 'Também muda os dados do site, a coleta e convida pessoas.']] as const).map(([id, label, hint]) => (
                  <button key={id} type="button" role="radio" aria-checked={role === id} className={`z-opt ${role === id ? 'on' : ''}`} onClick={() => setRole(id)}><span><b>{label}</b><small>{hint}</small></span><span className="z-radio" /></button>
                ))}
              </div>
            </div>
            <div className="z-note"><Info size={16} /><span>Não precisa criar senha. Se a pessoa já usa o Analizi, o acesso é liberado na hora.</span></div>
            <div className="z-mfoot"><button type="button" className="z-btn sec" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="z-btn pri" onClick={() => void sendInvite()} disabled={sending}>{sending ? 'Enviando…' : 'Enviar convite'}</button></div>
          </div>
        </div>
      )}
      {(modal?.kind === 'remove-member' || modal?.kind === 'remove-invite') && (
        <div className="z-ov" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="z-modal narrow" role="alertdialog" aria-modal="true" aria-labelledby="z-rm-t">
            <span className="z-m-ic red"><UserMinus size={22} /></span>
            {modal.kind === 'remove-member'
              ? <div><h2 id="z-rm-t">Remover o acesso de {modal.member.full_name || modal.member.email}?</h2><p className="z-mlead">{modal.member.email ? `${modal.member.email} deixa` : 'Essa pessoa deixa'} de ver os dados de {siteName} na hora. Você pode convidar de novo quando quiser.</p></div>
              : <div><h2 id="z-rm-t">Cancelar o convite?</h2><p className="z-mlead">{modal.invite.email} não vai mais conseguir entrar com este convite. Você pode convidar de novo quando quiser.</p></div>}
            <div className="z-mfoot"><button type="button" className="z-btn sec" onClick={() => setModal(null)}>Voltar</button><button type="button" className="z-btn danger" onClick={() => void confirmRemove()} disabled={!!busyId}>{modal.kind === 'remove-member' ? 'Remover acesso' : 'Cancelar convite'}</button></div>
          </div>
        </div>
      )}
    </>
  )
}

function PlanTab() {
  const { effectivePlan, subscriptionStatus, subscriptionExpiresAt, totalSitesCount, setNewSiteModalOpen, canAddMoreSites } = useBusiness()
  const sub = formatSubscriptionStatus(subscriptionStatus)
  const exp = formatExpirationDate(subscriptionExpiresAt, effectivePlan.id)
  const unlimited = effectivePlan.id === 'admin'
  const usage = unlimited ? 12 : Math.min(100, Math.round((totalSitesCount / Math.max(1, effectivePlan.maxSites)) * 100))
  const [price, per] = effectivePlan.priceLabel.split('/')
  const pillClass = sub.badgeClass === 'active' ? 'ok' : sub.badgeClass === 'trial' ? 'blue' : 'warn'
  const compare: PlanMetadata[] = [PLAN_DEFINITIONS.essential, PLAN_DEFINITIONS.growth]

  return (
    <>
      <div className="z-pane-h"><h2>Plano e assinatura</h2><p>Seu plano, quanto dele você está usando e as opções para crescer.</p></div>
      <div className="z-plan-hero">
        <div className="z-plan-in">
          <div className="z-plan-l">
            <div className="z-row-8"><span className="z-pill pink">Seu plano</span><span className={`z-pill ${pillClass}`}><span className="z-d" />{sub.label}</span></div>
            <h3 className="z-plan-name">{effectivePlan.name}</h3>
            <div className="z-price">{price}{per && <small> /{per}</small>}</div>
            <p className="z-sub">{exp.includes('/') ? `Próxima renovação em ${exp}.` : exp}</p>
            <div className="z-acts">
              <button type="button" className="z-btn pri" onClick={() => setNewSiteModalOpen(true)}><Plus size={16} />Adicionar site</button>
              <a className="z-btn sec" href="mailto:suporte@analizi.com.br?subject=Mudan%C3%A7a%20de%20plano">Falar sobre mudança de plano</a>
            </div>
          </div>
          <div className="z-meters">
            <div className="z-meter">
              <div className="z-ml"><b>Sites</b><span>{totalSitesCount} de {unlimited ? 'ilimitados' : effectivePlan.maxSites}</span></div>
              <div className="z-bar"><i style={{ width: `${usage}%` }} /></div>
              <p className="z-sub" style={{ marginTop: 6 }}>{unlimited ? 'Seu plano não tem limite de sites.' : canAddMoreSites ? `Você ainda pode adicionar ${effectivePlan.maxSites - totalSitesCount} ${effectivePlan.maxSites - totalSitesCount === 1 ? 'site' : 'sites'}.` : 'Você está usando todos os sites do plano.'}</p>
            </div>
            <div className="z-meter">
              <div className="z-ml"><b>Recursos</b><span>{effectivePlan.allFeaturesUnlocked ? 'Todos liberados' : 'Essenciais'}</span></div>
              <div className="z-bar"><i className="green" style={{ width: effectivePlan.allFeaturesUnlocked ? '100%' : '70%' }} /></div>
            </div>
          </div>
        </div>
      </div>
      {!unlimited && (
        <div className="z-compare">
          {compare.map((plan) => {
            const current = plan.id === effectivePlan.id
            const [pp, pper] = plan.priceLabel.split('/')
            return (
              <div key={plan.id} className={`z-pcard ${current ? 'cur' : ''}`}>
                <div className="z-row-between"><b>{plan.name}</b>{current && <span className="z-pill pink">Atual</span>}</div>
                <div className="z-pp">{pp}{pper && <small> /{pper}</small>}</div>
                <ul className="z-feat">{plan.features.map((f) => <li key={f}><Check size={15} />{f}</li>)}</ul>
                {!current && <a className="z-btn sec sm" style={{ alignSelf: 'flex-start', marginTop: 6 }} href={`mailto:suporte@analizi.com.br?subject=${encodeURIComponent(`Quero mudar para o ${plan.name}`)}`}>Quero este plano</a>}
              </div>
            )
          })}
        </div>
      )}
      {unlimited && (
        <div className="z-card">
          <h3>Incluído no seu plano</h3>
          <ul className="z-feat">{effectivePlan.features.map((f) => <li key={f}><Check size={15} />{f}</li>)}</ul>
        </div>
      )}
    </>
  )
}

function AlertsTab({ onToast }: { onToast: (t: string) => void }) {
  const { currentSite } = useBusiness()
  const storageKey = `analizi-alert-prefs-${currentSite?.id || 'site'}`
  const read = () => {
    try { return { weekly: true, stopped: true, drop: false, mailTo: '', ...JSON.parse(localStorage.getItem(storageKey) || '{}') } as { weekly: boolean; stopped: boolean; drop: boolean; mailTo: string } }
    catch { return { weekly: true, stopped: true, drop: false, mailTo: '' } }
  }
  const [saved, setSaved] = useState(read)
  const [prefs, setPrefs] = useState(read)
  useEffect(() => {
    const load = async () => {
      const base = read()
      if (!base.mailTo && supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) base.mailTo = user.email
      }
      setSaved(base); setPrefs(base)
    }
    void load()
  }, [storageKey])
  const dirty = JSON.stringify(prefs) !== JSON.stringify(saved)
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(prefs)) } catch { /* armazenamento indisponível */ }
    setSaved(prefs)
    onToast('Preferências salvas')
  }
  const rows: Array<{ k: 'weekly' | 'stopped' | 'drop'; title: string; text: string; icon: React.ComponentType<{ size?: number }> }> = [
    { k: 'weekly', title: 'Resumo semanal', text: 'Toda segunda às 8h: visitas, contatos e os insights da semana. Veja o exemplo ao lado.', icon: Mail },
    { k: 'stopped', title: 'Aviso se o rastreador parar', text: 'Se o site ficar 24 horas sem enviar dados, avisamos para você conferir a instalação.', icon: Activity },
    { k: 'drop', title: 'Aviso de queda nas visitas', text: 'Quando as visitas de um dia ficarem 30% abaixo da média das últimas 4 semanas.', icon: TrendingDown }
  ]

  return (
    <>
      <div className="z-pane-h"><h2>E-mails e alertas</h2><p>O que o Analizi envia para você sem precisar abrir o painel.</p></div>
      <div className="z-note"><Info size={16} /><span>Os envios por e-mail estão chegando em breve. Suas escolhas ficam salvas e passam a valer assim que forem liberados.</span></div>
      <div className="z-two">
        <div className="z-grow">
          <div className="z-card">
            {rows.map(({ k, title, text, icon: Icon }) => (
              <div className="z-sw-row" key={k}>
                <span className="z-swi"><Icon size={18} /></span>
                <div className="z-swt"><b id={`z-sw-${k}`}>{title}</b><small>{text}</small></div>
                <button type="button" role="switch" aria-checked={prefs[k]} aria-labelledby={`z-sw-${k}`} className={`z-sw ${prefs[k] ? 'on' : ''}`} onClick={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />
              </div>
            ))}
          </div>
          <div className="z-card">
            <div className="z-fld"><label htmlFor="z-f-mail">Enviar para</label><input id="z-f-mail" value={prefs.mailTo} onChange={(e) => setPrefs({ ...prefs, mailTo: e.target.value })} placeholder="nome@empresa.com.br" /><span className="z-hint">Para mais de um e-mail, separe com vírgula.</span></div>
          </div>
        </div>
        <div className="z-side">
          <div className="z-mail" aria-label="Exemplo do resumo semanal">
            <div className="z-mail-h"><span className="z-ws-av sm">AZ</span><div><b>Resumo semanal · {currentSite?.name || 'Seu site'}</b>Exemplo · toda segunda às 8h</div></div>
            <div className="z-mail-b">
              <div className="z-mail-top"><b>Sua semana em 30 segundos</b><div>Visitas, contatos e o que fazer a seguir</div></div>
              <div className="z-mail-k"><div><small>Visitas</small><b>—</b></div><div><small>Contatos</small><b>—</b></div><div><small>Taxa</small><b>—</b></div></div>
              <div className="z-mail-l"><b>Pontos de atenção da semana</b><span>· Os insights da IZI aparecem aqui</span><span className="z-mail-cta">Ver todos os insights</span></div>
            </div>
          </div>
        </div>
      </div>
      {dirty && (
        <div className="z-savebar"><span>Você tem alterações não salvas.</span><span className="z-row-6"><button type="button" className="z-btn ghost sm" onClick={() => setPrefs(saved)}>Descartar</button><button type="button" className="z-btn pri sm" onClick={save}>Salvar preferências</button></span></div>
      )}
    </>
  )
}


function SourceHeader({
  title,
  subtitle,
  setPage,
  eyebrow,
  icon: Icon,
  iconColor,
  iconImage
}: {
  title: string;
  subtitle: string;
  setPage: (page: Page) => void;
  eyebrow?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  iconColor?: string;
  iconImage?: string;
}) {
  return (
    <header className="source-header" style={{ marginBottom: 24 }}>
      <button className="back-link" onClick={() => setPage('settings')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <ArrowLeft size={16}/> Voltar para Configurações
      </button>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {iconImage ? <img className="ga4-logo source-header-icon" src={iconImage} alt="Google Analytics 4" /> : Icon && <Icon size={26} style={iconColor ? { color: iconColor } : undefined} />}
          {title}
        </h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </header>
  );
}

function GA4ComingSoon({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <>
      <SourceHeader eyebrow="CONFIGURAÇÃO GOOGLE" iconImage="/ga4-icon.png" title="Google Analytics 4" subtitle="Integração com o Google Analytics 4." setPage={setPage} />
      <section className="setup-layout">
        <article className="setup-card" style={{ textAlign: 'center', padding: 48 }}>
          <h2>EM BREVE</h2>
          <p>A conexão com o Google Analytics 4 estará disponível em breve. Enquanto isso, use o Rastreador Analizi.</p>
          <Button variant="secondary" onClick={() => setPage('tracker-setup')}>Configurar rastreador <ArrowRight size={17}/></Button>
        </article>
      </section>
    </>
  );
}
function GA4Setup({ setPage }: { setPage: (page: Page) => void }) {
  const { currentSite } = useBusiness();
  const [properties, setProperties] = useState<Array<{ id: string, name: string, accountName: string, websiteUrl?: string }>>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionRestored, setSessionRestored] = useState(false);
  const [workspaceSite, setWorkspaceSite] = useState<SiteItem | null>(null);
  const [connectedProperty, setConnectedProperty] = useState<{ id: string, name: string | null } | null>(null);
  const providerToken = () => sessionStorage.getItem('analizi-ga4-provider-token') || '';
  const providerRefreshToken = () => sessionStorage.getItem('analizi-ga4-provider-refresh-token') || '';

  useEffect(() => {
    const restoreWorkspaceSession = async () => {
      const siteSnapshot = sessionStorage.getItem('analizi-ga4-workspace-site');
      if (siteSnapshot) {
        try { setWorkspaceSite(JSON.parse(siteSnapshot) as SiteItem); } catch { sessionStorage.removeItem('analizi-ga4-workspace-site'); }
      }
      const accessToken = sessionStorage.getItem('analizi-ga4-workspace-access-token');
      const refreshToken = sessionStorage.getItem('analizi-ga4-workspace-refresh-token');
      if (supabase && accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      setSessionRestored(true);
    };
    void restoreWorkspaceSession();
  }, []);

  const authorizationHeaders = async () => {
    const { data: { session } } = await supabase!.auth.getSession();
    if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente.');
    return { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` };
  };

  const loadProperties = async () => {
    const accessToken = providerToken();
    if (!accessToken || !supabase) return;
    setLoading(true); setMessage('');
    try {
      const response = await fetch('https://analizi.carvalhopaula1990.workers.dev/v1/ga4/properties', {
        method: 'POST', headers: await authorizationHeaders(), body: JSON.stringify({ accessToken })
      });
      const payload = await response.json() as { properties?: Array<{ id: string, name: string, accountName: string, websiteUrl?: string }>, error?: string };
      if (!response.ok) throw new Error(payload.error || 'Não foi possível listar suas propriedades.');
      setProperties(payload.properties || []);
      if (payload.properties?.length === 1) setSelectedProperty(payload.properties[0].id);
      if (!payload.properties?.length) setMessage('Nenhuma propriedade GA4 disponível nesta conta Google.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível listar suas propriedades.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (sessionRestored) void loadProperties(); }, [sessionRestored]);

  useEffect(() => {
    const selectedSite = workspaceSite || currentSite;
    if (!sessionRestored || !selectedSite || !supabase) return;
    let active = true;
    void supabase
      .from('data_sources')
      .select('ga4_property_id, ga4_property_name, status')
      .eq('site_id', selectedSite.id)
      .eq('kind', 'ga4')
      .eq('status', 'connected')
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data?.ga4_property_id) return;
        setConnectedProperty({ id: data.ga4_property_id, name: data.ga4_property_name });
        setSelectedProperty(data.ga4_property_id);
      });
    return () => { active = false; };
  }, [sessionRestored, workspaceSite, currentSite]);

  const authorize = async () => {
    if (!supabase) return;
    setLoading(true); setMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !currentSite) { setMessage('Sua sessão ou site atual expirou. Recarregue o painel.'); setLoading(false); return; }
    sessionStorage.setItem('analizi-ga4-workspace-access-token', session.access_token);
    sessionStorage.setItem('analizi-ga4-workspace-refresh-token', session.refresh_token);
    sessionStorage.setItem('analizi-ga4-workspace-site', JSON.stringify(currentSite));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/configuracoes/google-analytics`,
        scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (error) { setMessage('Não foi possível abrir a autorização do Google.'); setLoading(false); }
  };

  const connect = async () => {
    const selectedSite = workspaceSite || currentSite;
    if (!selectedSite || !selectedProperty || !supabase) return;
    const refreshToken = providerRefreshToken();
    if (!refreshToken) { setMessage('Autorize novamente para conceder acesso contínuo ao GA4.'); return; }
    setLoading(true); setMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://analizi.carvalhopaula1990.workers.dev/v1/ga4/connect', {
        method: 'POST', headers: await authorizationHeaders(), body: JSON.stringify({
          siteId: selectedSite.id, trackerSiteId: selectedSite.tracker_site_id, businessId: selectedSite.business_id, propertyId: selectedProperty, refreshToken, googleUserId: session?.user.id
        })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a conexão.');
      const property = properties.find(item => item.id === selectedProperty);
      const { error } = await supabase.from('data_sources').upsert({
        site_id: selectedSite.id, kind: 'ga4', status: 'connected', ga4_property_id: selectedProperty,
        ga4_property_name: property?.name || null, ga4_connected_google_email: session?.user.email || null,
        connected_at: new Date().toISOString(), last_synced_at: null, last_error: null
      }, { onConflict: 'site_id,kind' });
      if (error) throw new Error(error.message);
      // Mantém a autorização apenas nesta aba para que "Alterar propriedade"
      // possa voltar direto ao seletor; o token duradouro fica cifrado no Worker.
      sessionStorage.removeItem('analizi-ga4-workspace-access-token');
      sessionStorage.removeItem('analizi-ga4-workspace-refresh-token');
      sessionStorage.removeItem('analizi-ga4-workspace-site');
      setConnectedProperty({ id: selectedProperty, name: property?.name || null });
      setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a conexão.'); }
    finally { setLoading(false); }
  };

  const selectedPropertyInfo = properties.find(item => item.id === selectedProperty);
  const normalizedHost = (value?: string) => {
    if (!value) return '';
    try { return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.replace(/^www\./i, '').toLowerCase(); }
    catch { return ''; }
  };
  const propertyHost = normalizedHost(selectedPropertyInfo?.websiteUrl);
  const currentHost = normalizedHost((workspaceSite || currentSite)?.domain);
  const propertyMismatch = Boolean(propertyHost && currentHost && propertyHost !== currentHost);
  const changeProperty = () => {
    setConnectedProperty(null);
    setMessage('');
    if (properties.length) return;
    if (providerToken()) void loadProperties();
    else void authorize();
  };

  return (
    <>
      <SourceHeader
        eyebrow="CONFIGURAÇÃO GOOGLE"
        iconImage="/ga4-icon.png"
        title="Conectar Google Analytics"
        subtitle="Em poucos passos, vamos encontrar os dados do seu site."
        setPage={setPage}
      />
      <section className="setup-layout">
        <article className="setup-card">
          {connectedProperty ? (
            <div className="ga4-connected-state">
              <div className="step-label">PASSO 3 DE 3</div>
              <div className="ga4-connected-icon">
                <span className="source-icon ga large"><img className="ga4-logo" src="/ga4-icon.png" alt="Google Analytics 4" /></span>
                <CircleCheck aria-label="Conectado" />
              </div>
              <h2>Propriedade conectada</h2>
              <p><b>{connectedProperty.name || 'Sua propriedade GA4'}</b> foi configurada para este site.</p>
              <div className="ga4-sync-note">
                <Clock size={19}/>
                <span>A conexão foi testada com sucesso. Nenhum relatório é carregado agora: o próximo cron capturará D-1, D-2 e D-3, e os dados estarão disponíveis para consulta no dia seguinte.</span>
              </div>
              <Button className="full" variant="secondary" onClick={changeProperty} disabled={loading}>Alterar propriedade</Button>
            </div>
          ) : <>
            <div className="step-label">{properties.length ? 'PASSO 2 DE 3' : 'PASSO 1 DE 3'}</div>
            <span className="source-icon ga large"><img className="ga4-logo" src="/ga4-icon.png" alt="Google Analytics 4" /></span>
            <h2>{properties.length ? 'Escolha sua propriedade GA4' : 'Conecte sua conta Google'}</h2>
            <p>{properties.length ? 'Selecione qual propriedade deve fornecer os dados para este site.' : <>Você será levado ao Google para autorizar o Analizi a <b>somente visualizar</b> os dados do Analytics.</>}</p>
            <div className="permission-box">
              <ShieldCheck size={19}/>
              <span>Não teremos acesso para editar sua conta, criar campanhas ou fazer alterações.</span>
            </div>
            {!properties.length ? (
            <Button className="full" onClick={() => void authorize()} disabled={loading}>Conectar conta Google <ExternalLink size={16}/></Button>
          ) : (
            <>
              <label style={{ display: 'grid', gap: 7, marginTop: 18, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>
                Escolha a propriedade
                <select value={selectedProperty} onChange={event => setSelectedProperty(event.target.value)} style={{ padding: 11, borderRadius: 8, border: '1px solid #d5dfdb' }}>
                  <option value="">Selecione uma propriedade</option>
                  {properties.map(property => <option key={property.id} value={property.id}>{property.name} — {property.accountName}</option>)}
                </select>
              </label>
              <Button className="full" onClick={() => void connect()} disabled={loading || !selectedProperty || propertyMismatch} style={{ marginTop: 16 }}>Conectar propriedade</Button>
              {propertyMismatch && (
                <div className="permission-box" style={{ marginTop: 14, color: '#9a3412', background: '#fff7ed' }}>
                  <AlertTriangle size={19}/>
                  <span>Esta propriedade usa <b>{propertyHost}</b>, mas o site selecionado é <b>{currentHost}</b>. Troque o site no seletor do topo antes de conectar.</span>
                </div>
              )}
            </>
          )}
          </>}
          {message && <p className="setup-help" style={{ color: message.includes('sucesso') ? '#087f5b' : undefined }}>{message}</p>}
        </article>
        <aside className="setup-sidebar">
          <span className="eyebrow">O QUE VEM DEPOIS</span>
          <ol>
            <li className={!connectedProperty && !properties.length ? 'current' : ''}><i>1</i><span><b>Conectar sua conta</b><small>Autorize a leitura dos dados</small></span></li>
            <li className={!connectedProperty && properties.length ? 'current' : ''}><i>2</i><span><b>Escolher a propriedade</b><small>Encontre o seu site na lista</small></span></li>
            <li className={connectedProperty ? 'current' : ''}><i>3</i><span><b>Conexão confirmada</b><small>Seus dados estão a caminho</small></span></li>
          </ol>
        </aside>
      </section>
      <section className="faq-card">
        <h3>Não sabe se usa Google Analytics?</h3>
        <p>Entre em <b>analytics.google.com</b>. Se você vê dados do seu site por lá, pode usar esta opção.</p>
      </section>
    </>
  );
}

const TRACKER_GUIDES = {
    wordpress: ['WordPress', 'WP', ['Instale um plugin de código no cabeçalho, como o WPCode.', 'Abra a área “Cabeçalho” (Header) do plugin.', 'Cole o código e clique em Salvar.']],
    wix: ['Wix', 'Wx', ['Abra Configurações › Avançado › Código personalizado.', 'Escolha “Cabeçalho” e “Todas as páginas”.', 'Cole o código, salve e publique o site.']],
    shopify: ['Shopify', 'Sh', ['Abra Loja virtual › Temas › Editar código.', 'Abra o arquivo layout/theme.liquid.', 'Cole o código logo antes de </head> e salve.']],
    squarespace: ['Squarespace', 'Sq', ['Abra Configurações › Avançado › Injeção de código.', 'Cole o código no campo “Header”.', 'Salve as alterações.']],
    html: ['HTML próprio', '</>', ['Abra o arquivo que contém a tag <head> do site.', 'Cole o código logo antes de </head>.', 'Publique a alteração no servidor.']],
    other: ['Outra plataforma', '?', ['Procure por “código personalizado”, “cabeçalho” ou “scripts”.', 'Cole o código no cabeçalho de todas as páginas.', 'Se não encontrar, peça ajuda ao suporte da plataforma.']]
  } as const;

function TrackerSetup({ setPage }: { setPage: (page: Page) => void }) {
  const { currentSite } = useBusiness();
  const siteId = currentSite?.tracker_site_id || '';
  const domain = currentSite?.domain || '';
  const [platform, setPlatform] = useState<keyof typeof TRACKER_GUIDES>('wordpress');
  const [copied, setCopied] = useState(false);
  const [verify, setVerify] = useState<'idle' | 'wait' | 'ok' | 'fail' | 'error'>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const tracker = useTrackerStatus(siteId);
  const alreadyInstalled = Boolean(tracker.status?.received);

  useEffect(() => {
    if (!siteId || !domain || !currentSite?.id) return;
    void (async () => fetch('https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...await authHeaders() },
      body: JSON.stringify({ trackerSiteId: siteId, supabaseSiteId: currentSite.id })
    }))().catch(() => {});
  }, [siteId, domain, currentSite?.id]);

  const testInstallation = async () => {
    if (!siteId) return;
    setVerify('wait');
    const status = await tracker.check();
    if (!status) { setVerify('error'); return; }
    if (status.received) {
      setVerify('ok');
      if (supabase && currentSite?.id) {
        const nowIso = new Date().toISOString();
        void supabase.from('data_sources').update({ status: 'connected', connected_at: nowIso, last_synced_at: status.lastEventAt || nowIso }).eq('site_id', currentSite.id);
      }
    } else setVerify('fail');
  };

  const snippet = siteId ? `<script async src="https://analizi.carvalhopaula1990.workers.dev/izi.js" data-site="${siteId}"></script>` : '';
  const guides = TRACKER_GUIDES;

  const copyCode = () => {
    if (!snippet) return;
    void navigator.clipboard?.writeText(snippet);
    setCopied(true);
  };
  const copyInstructions = () => {
    const [name, , steps] = guides[platform];
    const text = `Instalar o Analizi no site ${domain || ''} (${name}):\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nCódigo para colar no cabeçalho de todas as páginas:\n${snippet}`;
    void navigator.clipboard?.writeText(text);
    setToast('Instruções copiadas. Cole no e-mail ou WhatsApp para quem cuida do site.');
  };
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const isOk = verify === 'ok';
  const step1 = copied || isOk ? 'ok' : 'cur';
  const step2 = isOk ? 'ok' : copied ? 'cur' : '';
  const step3 = isOk ? 'ok' : verify !== 'idle' ? 'cur' : '';

  return (
    <div className="z-install">
      <header className="z-ph">
        <div>
          <button type="button" className="z-lnk" onClick={() => setPage('settings')}><ArrowLeft size={15} />Voltar para Coleta de dados</button>
          <h1>Instalar o rastreador</h1>
          <p>Leva uns 5 minutos. Você só precisa colar um código no seu site e confirmar aqui.</p>
        </div>
      </header>

      {alreadyInstalled && verify === 'idle' && (
        <div className="z-res ok" role="status" style={{ marginTop: 0, marginBottom: 18 }}>
          <CircleCheck size={20} />
          <div><b>O rastreador já está funcionando em {domain || 'seu site'}.</b><div className="z-res-sub">Último dado recebido {relativeTime(tracker.status?.lastEventAt)}. Use esta página só se precisar reinstalar o código.</div></div>
        </div>
      )}

      <div className="z-stepper" aria-label="Etapas da instalação">
        <div className={`z-stp ${step1}`}><span className="z-n">{step1 === 'ok' ? <Check size={15} /> : 1}</span>Copiar o código</div><span className={`z-stp-l ${copied || isOk ? 'ok' : ''}`} />
        <div className={`z-stp ${step2}`}><span className="z-n">{step2 === 'ok' ? <Check size={15} /> : 2}</span>Colar no site</div><span className={`z-stp-l ${isOk ? 'ok' : ''}`} />
        <div className={`z-stp ${step3}`}><span className="z-n">{step3 === 'ok' ? <Check size={15} /> : 3}</span>Confirmar</div>
      </div>

      <div className="z-inst">
        <div className="z-steps">
          <div className="z-card">
            <div className="z-sh"><span className={`z-n ${copied ? 'ok' : ''}`}>1</span><div><h3>Copie o código</h3><p className="z-sub">Este código é só do seu site{domain ? `, ${domain}` : ''}.</p></div></div>
            <div className="z-editor">
              <div className="z-ed-top"><span className="z-dots"><i /><i /><i /></span><span>cabeçalho do site</span><button type="button" className="z-btn sm" onClick={copyCode} disabled={!snippet}><Copy size={14} />{copied ? 'Copiado' : 'Copiar código'}</button></div>
              {snippet ? (
                <div className="z-ed-code"><span className="z-ln">1<br />2<br />3</span><code><span className="tk-t">&lt;script</span> <span className="tk-a">async</span>{'\n  '}<span className="tk-a">src</span>=<span className="tk-s">"https://analizi.carvalhopaula1990.workers.dev/izi.js"</span>{'\n  '}<span className="tk-a">data-site</span>=<span className="tk-s">"{siteId}"</span><span className="tk-t">&gt;&lt;/script&gt;</span></code></div>
              ) : <div className="z-ed-code"><code>Carregando o código do seu site…</code></div>}
            </div>
          </div>

          <div className="z-card">
            <div className="z-sh"><span className="z-n">2</span><div><h3>Cole no seu site</h3><p className="z-sub">Onde o seu site foi feito? Mostramos o caminho exato.</p></div></div>
            <div className="z-plats" role="tablist" aria-label="Plataforma do site">
              {(Object.keys(guides) as Array<keyof typeof guides>).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={platform === key} className={`z-plat ${platform === key ? 'on' : ''}`} onClick={() => setPlatform(key)}><span className="z-mono">{guides[key][1]}</span>{guides[key][0]}</button>
              ))}
            </div>
            <ol className="z-olist">{guides[platform][2].map((step) => <li key={step}>{step}</li>)}</ol>
            <div className="z-note pink" style={{ marginTop: 14 }}><Users size={16} /><span>Outra pessoa cuida do seu site? <button type="button" className="z-lnk inline" onClick={copyInstructions} disabled={!snippet}>Copiar instruções para enviar a ela</button></span></div>
          </div>

          <div className="z-card">
            <div className="z-sh"><span className={`z-n ${isOk ? 'ok' : ''}`}>3</span><div><h3>Confirme a instalação</h3><p className="z-sub">Depois de publicar o código, abra o seu site em outra aba e clique em verificar.</p></div></div>
            <button type="button" className="z-btn pri" onClick={() => void testInstallation()} disabled={!siteId || verify === 'wait'}>{verify === 'wait' ? 'Verificando…' : verify === 'fail' || verify === 'error' ? 'Verificar de novo' : 'Verificar instalação'}</button>
            {verify === 'wait' && <div className="z-res wait" role="status"><span className="z-pulse pink" />Procurando dados de {domain || 'seu site'}…</div>}
            {verify === 'ok' && (
              <div className="z-res ok" role="status"><CircleCheck size={20} /><div><b>Pronto, recebemos dados do seu site.</b><div className="z-res-sub">Os relatórios começam a aparecer nos próximos minutos.</div><div style={{ marginTop: 10 }} className="z-row-8"><button type="button" className="z-btn sec sm" onClick={() => setPage('dashboard')}>Ir para a Visão Geral</button><button type="button" className="z-btn ghost sm" onClick={() => setPage('heatmap')}>Ver heatmap e rolagem</button></div></div></div>
            )}
            {verify === 'fail' && (
              <div className="z-res fail" role="status"><AlertTriangle size={20} /><div><b>Ainda não recebemos dados de {domain || 'seu site'}.</b> Confira:<ul><li>se o código foi salvo e o site publicado;</li><li>se você abriu o site depois de publicar;</li><li>se algum bloqueador de anúncios está ligado no seu navegador.</li></ul></div></div>
            )}
            {verify === 'error' && <div className="z-res fail" role="status"><AlertTriangle size={20} /><div><b>Não foi possível verificar agora.</b> Tente de novo em alguns instantes.</div></div>}
          </div>
        </div>

        <aside className="z-aside">
          <div className="z-card">
            <h3>O que o rastreador coleta</h3>
            <ul className="z-chk">
              <li><Check size={16} className="z-yes" />Páginas visitadas e de onde a visita veio</li>
              <li><Check size={16} className="z-yes" />Cliques em botões, como WhatsApp</li>
              <li><Check size={16} className="z-yes" />Até onde a pessoa rolou a página</li>
            </ul>
            <h3 style={{ marginTop: 18 }}>O que ele nunca coleta</h3>
            <ul className="z-chk">
              <li><X size={16} className="z-x" />O que é digitado em formulários</li>
              <li><X size={16} className="z-x" />Nomes, e-mails ou senhas</li>
            </ul>
            <p className="z-sub" style={{ marginTop: 14 }}>Funciona de acordo com a LGPD.</p>
          </div>
          <div className="z-card">
            <h3>Precisa de ajuda?</h3>
            <p className="z-sub" style={{ marginBottom: 10 }}>Mande o endereço do seu site e a plataforma que você usa.</p>
            <a href="mailto:suporte@analizi.com.br" className="z-strong-link">suporte@analizi.com.br</a>
          </div>
          <button type="button" className="z-btn ghost" onClick={() => setPage('dashboard')}>Continuar e instalar depois</button>
        </aside>
      </div>
      {toast && <div className="z-toast" role="status"><CircleCheck size={16} />{toast}</div>}
    </div>
  );
}


function ReportGuide({ id, children }: { id: string, children: React.ReactNode }) {
  const key = `analizi-guide-hidden:${id}`;
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === '1'; } catch { return false; } });
  if (hidden) return null;
  return (
    <div className="rp-guide" role="note">
      <BookOpen size={16} />
      <span>{children}</span>
      <button type="button" aria-label="Esconder esta explicação" title="Esconder esta explicação" onClick={() => { try { localStorage.setItem(key, '1'); } catch { /* sem armazenamento */ } setHidden(true); }}>×</button>
    </div>
  );
}

function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon: Icon,
  iconColor,
  report = false,
  guide
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  iconColor?: string;
  report?: boolean;
  guide?: React.ReactNode;
}) {
  const { currentBusiness, currentSite } = useBusiness();
  const [name, setName] = useState('Sua conta');
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
      if (!user) return;
      const { data } = await supabase?.from('profiles').select('full_name').eq('id', user.id).maybeSingle() ?? {};
      setName(data?.full_name || user.user_metadata?.full_name || user.email || 'Sua conta');
    };
    void load();
  }, []);
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const hasDataStatus = !['Configurações', 'Fontes de dados', 'Acesso ao negócio'].includes(title);
  const contextHint = currentBusiness ? `${currentBusiness.name}${currentSite?.domain ? ` · ${currentSite.domain}` : ''}` : '';

  // Metadados padrão caso não sejam passados explicitamente
  const defaultMeta: Record<string, { eyebrow: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>; iconColor: string }> = {
    'Visão geral': { eyebrow: 'RESUMO DE DESEMPENHO', icon: BarChart3, iconColor: '#ff3cac' },
    'Aquisição & Campanhas': { eyebrow: 'CANAL E CRIATIVOS', icon: Compass, iconColor: '#3b82f6' },
    'Seu público': { eyebrow: 'ORIGEM E PERFIL', icon: Users, iconColor: '#3b82f6' },
    'Suas páginas': { eyebrow: 'CONTEÚDO E ENGAJAMENTO', icon: FileText, iconColor: '#ff8a3d' },
    'Resultados': { eyebrow: 'CONVERSÃO E LEADS', icon: Target, iconColor: '#10b981' },
    'Insights & Recomendações': { eyebrow: 'INTELIGÊNCIA ARTIFICIAL', icon: Lightbulb, iconColor: '#eab308' },
    'INSIGHTS (IA)': { eyebrow: 'INTELIGÊNCIA ARTIFICIAL', icon: Lightbulb, iconColor: '#eab308' },
    'Insights': { eyebrow: 'INTELIGÊNCIA ARTIFICIAL', icon: Lightbulb, iconColor: '#eab308' },
    'Configurações': { eyebrow: 'PREFERÊNCIAS DO SISTEMA', icon: SettingsIcon, iconColor: '#8b5cf6' },
    'Fontes de dados': { eyebrow: 'INTEGRAÇÕES E CONEXÕES', icon: Link2, iconColor: '#3b82f6' },
    'Heatmap & Comportamento': { eyebrow: 'COMPORTAMENTO VISUAL', icon: Flame, iconColor: '#f97316' },
    'Heatmap e Rolagem': { eyebrow: 'COMPORTAMENTO VISUAL', icon: Flame, iconColor: '#f97316' },
  };

  const meta = defaultMeta[title];
  const resolvedEyebrow = eyebrow ?? meta?.eyebrow;
  const ResolvedIcon = Icon ?? meta?.icon;
  const resolvedIconColor = iconColor ?? meta?.iconColor;

  if (report) {
    return (
      <div className="rp">
        <header className="rp-head">
          <div>
            <h1>{ResolvedIcon && <ResolvedIcon size={24} />}{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="rp-head-right">
            <button className="profile" title={`Perfil: ${name}`}>
              <span>{initials}</span>
              <b>{name}</b>
              <ChevronDown size={16}/>
            </button>
          </div>
        </header>
        <div style={{ marginTop: 10 }}><ConnectionStatus compact /></div>
        {guide && <ReportGuide id={title}>{guide}</ReportGuide>}
      </div>
    );
  }

  return <>
    <header className="page-header">
      <div>
        {resolvedEyebrow && <span className="eyebrow">{resolvedEyebrow}</span>}
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {ResolvedIcon && <ResolvedIcon size={26} style={resolvedIconColor ? { color: resolvedIconColor } : undefined} />}
          {title}
        </h1>
        <p className="subtitle">{subtitle} {contextHint ? `(${contextHint})` : ''}</p>
      </div>
      <button className="profile" title={`Perfil: ${name}`}>
        <span>{initials}</span>
        <b>{name}</b>
        <ChevronDown size={16}/>
      </button>
    </header>
    {hasDataStatus && <ConnectionStatus/>}
  </>;
}

import { Heatmap } from './components/Heatmap';
// Integração GA4 temporariamente desativada (EM BREVE).
const GA4_ENABLED = false;


/** Convidado sem negócio: aceita o convite e diz qual é a próxima tela. Chamar só depois dos termos aceitos. */
async function nextScreenAfterConsent(): Promise<AuthPage> {
  if (!supabase) return 'onboarding-business';
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 'login';
  const { error } = await supabase.rpc('accept_pending_invitations_for_user', { p_user_id: session.user.id, p_email: session.user.email ?? '' });
  if (error) return 'onboarding-business';
  const { data: businesses } = await supabase.from('businesses').select('id').limit(1);
  return businesses?.length ? 'app' : 'onboarding-business';
}

export function App() {
  const [mode, setMode] = useState<AuthPage>(() => {
    if (PROTOTYPE_TYPE) return 'app';
    if (window.location.pathname === '/entrar') return 'login';
    // Se há cliente supabase configurado, inicia em 'loading' para verificar a sessão salva sem piscar a Landing
    return supabase ? 'loading' : 'landing';
  });
  const [page, setPage] = useState<Page>(() => (PROTOTYPE_TYPE ? 'results' : pageFromPath()));
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('analizi-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => setPage(pageFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const client = supabase;
    const targetPublicPage: AuthPage = window.location.pathname === '/entrar' ? 'login' : 'landing';
    if (PROTOTYPE_TYPE) return;
    if (!client) {
      setMode(targetPublicPage);
      return;
    }
    const routeAuthenticatedUser = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!session) { setMode(targetPublicPage); return; }

        // Valida o usuário com a sessão atual
        const currentUser = session.user;
        if (!currentUser) { setMode(targetPublicPage); return; }

        // Verifica se possui negócio cadastrado
        const { data: businesses, error: bizError } = await client.from('businesses').select('id').limit(1);
        if (!bizError && businesses && businesses.length > 0) {
          // Usuários já cadastrados não devem voltar ao consentimento a cada login.
          setMode('app');
        } else if (!bizError) {
          // Quem ainda não tem negócio aceita os termos antes de se cadastrar ou de entrar por convite.
          const { data: consents, error: consentError } = await client
            .from('user_consents')
            .select('consent_key')
            .eq('version', CONSENT_VERSION)
            .in('consent_key', ['service_terms', 'site_data_processing']);

          if (!consentError && (consents?.length ?? 0) < 2) setMode('consent');
          else setMode(consentError ? 'onboarding-business' : await nextScreenAfterConsent());
        } else {
          // Em caso de erro transitório de rede na consulta, mantém na app se já estava autenticado
          setMode('app');
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão do usuário:', err);
        setMode(targetPublicPage);
      }
    };
    void routeAuthenticatedUser();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        // Os tokens do provedor só existem neste retorno após o redirect OAuth.
        // Mantemos-os apenas até a conexão GA4 ser finalizada nesta aba.
        if (newSession.provider_token) sessionStorage.setItem('analizi-ga4-provider-token', newSession.provider_token);
        if (newSession.provider_refresh_token) sessionStorage.setItem('analizi-ga4-provider-refresh-token', newSession.provider_refresh_token);
        // A autorização GA4 pode usar outra conta Google. Não deixe esse
        // callback substituir o workspace Analizi enquanto restauramos a
        // sessão original preservada pela tela de conexão.
        if (sessionStorage.getItem('analizi-ga4-workspace-access-token')) return;
        void routeAuthenticatedUser();
      } else {
        setMode(window.location.pathname === '/entrar' ? 'login' : 'landing');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => setTheme(current => current === 'light' ? 'dark' : 'light');

  if (mode === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background, #f5f8f7)' }}>
        <BrandLogo />
      </div>
    );
  }
  if (mode === 'landing') return <Landing setMode={setMode} />;
  if (mode === 'login' || mode === 'signup' || mode === 'consent' || mode.startsWith('onboarding')) {
    return (
      <AuthFlow
        mode={(mode === 'signup' ? 'login' : mode) as AuthFlowMode}
        setMode={(next) => {
          if (mode !== 'consent' || next !== 'onboarding-business') { setMode(next); return; }
          setMode('loading');
          nextScreenAfterConsent().then(setMode, () => setMode('onboarding-business'));
        }}
        onSourceCreated={(source) => {
          setMode('app');
          setPage(source === 'ga4' ? 'ga4-setup' : 'tracker-setup');
        }}
      />
    );
  }

  const screens = {
    dashboard: <Dashboard/>,
    acquisition: <Acquisition/>,
    audience: <Audience/>,
    pages: <Pages/>,
    results: <Results/>,
    heatmap: <Heatmap/>,
    insights: <Insights setPage={setPage}/>,
    'weekly-report': <WeeklyReportPage/>,
    'reports-admin': <WeeklyReportsAdmin/>,
    'results-admin': <Results allTypes/>,
    settings: <Settings setPage={setPage}/>,
    team: <TeamSettings setPage={setPage}/>,
    'data-sources': <DataSources setPage={setPage}/>,
    'ga4-setup': GA4_ENABLED ? <GA4Setup setPage={setPage}/> : <GA4ComingSoon setPage={setPage}/>,
    'tracker-setup': <TrackerSetup setPage={setPage}/>,
    'report-geral': <Report kind="geral"/>,
    'report-contatos': <Report kind="contatos"/>,
    'report-visitas': <Report kind="visitas"/>,
    'report-regiao': <Report kind="regiao"/>
  };

  return (
    <BusinessProvider>
      <AppShell
        page={page}
        setPage={setPage}
        onLogout={() => { void supabase?.auth.signOut(); setMode('landing'); }}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        {screens[page]}
      </AppShell>
    </BusinessProvider>
  );
}
