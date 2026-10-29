import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, ArrowRight, BarChart3, Calendar, Check, ChevronDown, CircleCheck, AlertTriangle, Clock, Compass, Crown, FileText, Flame, Layers, Lightbulb, LogIn, MessageCircle, Copy, ExternalLink, Globe, Globe2, Info, Link2, MapPin, Monitor, MoreHorizontal, MousePointerClick, Plus, RefreshCw, Settings as SettingsIcon, ShieldCheck, Smartphone, Sparkles, Tablet, Target, Trash2, UserPlus, Users } from 'lucide-react'
import { AppShell, type Page } from './components/AppShell'
import { BrandLogo } from './components/BrandLogo'
import { MetricCard, DualMetricCard } from './components/Metrics'
import { Button } from './components/ui/Button'
import { AuthFlow, CONSENT_VERSION, type AuthFlowMode } from './components/AuthFlow'
import { LandingPage } from './components/LandingPage'
import { supabase } from './lib/supabase'
import { BusinessProvider, useBusiness, type BusinessItem, type SiteItem } from './lib/business-context'
import { BrazilGeoMap } from './components/BrazilMap'

const ITEMS_PER_PAGE = 25
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
                  <p>Volume dia a dia de páginas visualizadas pelos visitantes no intervalo de datas selecionado.</p>
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
          <p className="chart-header-caption">Fluxo diário de acessos para identificar dias de maior movimento e tendência de crescimento</p>
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

export function normalizeOriginName(raw?: string): string {
  if (!raw) return 'Direto';
  const s = raw.toLowerCase().trim().replace(/^www\./, '');
  if (s === 'direto' || s === '(direct)' || s === 'direct' || s === 'none' || s === 'null' || s === '') return 'Direto';

  // 1. WhatsApp
  if (s === 'l.wl.co' || s === 'wl.co' || s === 'wa.me' || s === 'whatsapp' || /(?:^|\.)whatsapp\.com$/i.test(s)) return 'WhatsApp';
  // 2. Facebook
  if (s === 'facebook' || s === 'fb.me' || s === 'fb.com' || /(?:^|\.)facebook\.com$/i.test(s)) return 'Facebook';
  // 3. Instagram
  if (s === 'instagram' || s === 'ig' || s === 'ig.me' || /(?:^|\.)instagram\.com$/i.test(s)) return 'Instagram';
  // 4. Google
  if (s === 'google' || s === 'google-play' || /(?:^|\.)google\.(?:com|com\.br|co\.[a-z]+|[a-z]{2})$/i.test(s)) return 'Google';
  // 5. TikTok
  if (s === 'tiktok' || /(?:^|\.)tiktok\.com$/i.test(s)) return 'TikTok';
  // 6. YouTube
  if (s === 'youtube' || s === 'youtu.be' || /(?:^|\.)youtube\.com$/i.test(s)) return 'YouTube';
  // 7. X (Twitter)
  if (s === 'twitter' || s === 'x' || s === 't.co' || /(?:^|\.)twitter\.com$/i.test(s) || s === 'x.com') return 'X (Twitter)';
  // 8. LinkedIn
  if (s === 'linkedin' || s === 'lnkd.in' || /(?:^|\.)linkedin\.com$/i.test(s)) return 'LinkedIn';
  // 9. Pinterest
  if (s === 'pinterest' || s === 'pin.it' || /(?:^|\.)pinterest\.com$/i.test(s)) return 'Pinterest';
  // 10. Telegram
  if (s === 'telegram' || s === 't.me' || /(?:^|\.)telegram\.(?:org|me)$/i.test(s)) return 'Telegram';
  // 11. Threads
  if (s === 'threads' || /(?:^|\.)threads\.net$/i.test(s)) return 'Threads';
  // 12. Mercado Livre
  if (s === 'mercadolivre' || /(?:^|\.)mercadolivre\.com(?:\.br)?$/i.test(s) || /(?:^|\.)mercadolibre\.com$/i.test(s)) return 'Mercado Livre';
  // 13. Shopee
  if (s === 'shopee' || s === 'shp.ee' || /(?:^|\.)shopee\.com(?:\.br)?$/i.test(s)) return 'Shopee';
  // 14. Bing
  if (s === 'bing' || /(?:^|\.)bing\.com$/i.test(s)) return 'Bing';
  // 15. Yahoo
  if (s === 'yahoo' || /(?:^|\.)yahoo\.com(?:\.br)?$/i.test(s)) return 'Yahoo';
  // 16. DuckDuckGo
  if (s === 'duckduckgo' || /(?:^|\.)duckduckgo\.com$/i.test(s)) return 'DuckDuckGo';
  // 17. Kwai
  if (s === 'kwai' || /(?:^|\.)kwai\.(?:com|app)$/i.test(s)) return 'Kwai';
  // 18. Reddit
  if (s === 'reddit' || s === 'redd.it' || /(?:^|\.)reddit\.com$/i.test(s)) return 'Reddit';
  // 19. Globo
  if (s === 'globo' || /(?:^|\.)globo\.com$/i.test(s)) return 'Globo';
  // 20. UOL
  if (s === 'uol' || /(?:^|\.)uol\.com\.br$/i.test(s)) return 'UOL';

  return raw;
}

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

function Dashboard() {
  const analytics = useAnalytics();
  const [dailyPage, setDailyPage] = useState(0);
  const [dailyTab, setDailyTab] = useState<'all' | 'conversions'>('all');
  const t = analytics?.totals;
  const p = analytics?.previousTotals;
  const daily = analytics?.daily ?? [];
  const filteredDaily = dailyTab === 'conversions' ? daily.filter(d => Number(d.contacts || 0) > 0) : daily;
  const visibleDays = filteredDaily.slice(dailyPage * ITEMS_PER_PAGE, (dailyPage + 1) * ITEMS_PER_PAGE);
  const attention = t?.attentionSeconds ? `${Math.floor(t.attentionSeconds / 60)}min ${t.attentionSeconds % 60}s` : '—';
  const badge = analytics?.sourceKind === 'ga4' ? 'GA4' : 'RASTREADOR ANALIZI ATIVO';

  return (
    <>
      <PageHeader title="Visão geral" subtitle={`Veja como seu site foi nos últimos ${analytics?.periodDays ?? selectedDays()} dias.`} />
      <AnalyticsFilters analytics={analytics} />
      <div className="period">
        <span className="source-badge"><span className="source-badge-dot" />{badge}</span>
      </div>
      <section className="metrics">
        <MetricCard title="Visualizações de páginas" value={String(t?.pageViews ?? '—')} {...comparison(t?.pageViews, p?.pageViews)} />
        <MetricCard title="Usuários" value={String(t?.users ?? '—')} {...comparison(t?.users, p?.users)} />
        <MetricCard title="Tempo de atenção" value={attention} note="média por usuário ativo" />
        <MetricCard title="Contatos iniciados" value={String(t?.contacts ?? '—')} {...comparison(t?.contacts, p?.contacts)} />
        <MetricCard title="Novos usuários" value={String(t?.newUsers ?? '—')} {...comparison(t?.newUsers, p?.newUsers)} />
      </section>
      <div className="dashboard-split">
        <MetricChart analytics={analytics} />
        <article className="table-card compact-table daily-table">
          <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Calendar size={17} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0 }}>Métricas por dia</h3>
              </div>
              <p>Histórico diário de acessos, visitantes e contatos</p>
            </div>
            <div className="heatmap-segmented-control">
              <button
                type="button"
                className={dailyTab === 'all' ? 'active' : ''}
                onClick={() => { setDailyTab('all'); setDailyPage(0); }}
              >
                Todos os dias
              </button>
              <button
                type="button"
                className={dailyTab === 'conversions' ? 'active' : ''}
                onClick={() => { setDailyTab('conversions'); setDailyPage(0); }}
              >
                Com contatos
              </button>
            </div>
          </div>
          <div className="daily-head">
            <span>Data</span>
            <span>Visualizações</span>
            <span>Usuários</span>
            <span>Contatos</span>
          </div>
          {visibleDays.map(day => (
            <div className="daily-row" key={day.date}>
              <span><b>{day.date.slice(5).split('-').reverse().join('/')}</b></span>
              <span><b>{Number(day.pageViews || 0).toLocaleString('pt-BR')}</b></span>
              <span>{Number(day.users || 0).toLocaleString('pt-BR')}</span>
              <span>
                <b style={{ color: Number(day.contacts || 0) > 0 ? '#10b981' : undefined }}>
                  {Number(day.contacts || 0).toLocaleString('pt-BR')}
                </b>
              </span>
            </div>
          ))}
          {!filteredDaily.length && (
            <p className="empty-state">
              {dailyTab === 'conversions'
                ? 'Nenhum dia com contatos registrado no período.'
                : 'Ainda não recebemos acessos neste período.'}
            </p>
          )}
          <TablePagination page={dailyPage} total={filteredDaily.length} setPage={setDailyPage} />
        </article>
      </div>
      <PeakHoursMatrix peakHours={analytics?.peakHours} />
    </>
  );
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

  return (
    <>
      <PageHeader
        title="Aquisição & Campanhas"
        subtitle="Descubra como os visitantes encontram o seu site e quais anúncios, criativos e canais geram mais contatos."
      />
      <AnalyticsFilters analytics={analytics} />
      <div className="period">
        <span className="source-badge"><span className="source-badge-dot" />RASTREADOR ANALIZI ATIVO</span>
      </div>

      <section className="metrics">
        <DualMetricCard
          title="Tráfego Orgânico vs. Pago"
          organicSessions={organic.sessions.toLocaleString('pt-BR')}
          organicShare={`${organic.share} do tráfego`}
          organicContacts={organic.contacts}
          organicConvRate={organic.convRate}
          paidSessions={paid.sessions.toLocaleString('pt-BR')}
          paidShare={`${paid.share} do tráfego`}
          paidContacts={paid.contacts}
          paidConvRate={paid.convRate}
        />
        <MetricCard
          title="Origem principal"
          value={topSource?.name ? normalizeOriginName(topSource.name) : '—'}
          note={topSource ? `${topSource.value} acessos` : 'sem dados'}
        />
        <MetricCard
          title="Melhor anúncio / criativo"
          value={bestAd?.name || '—'}
          subtitle={bestAd ? bestAd.channel : 'nenhuma campanha ativa'}
          compactText={Boolean(bestAd?.name)}
          note={bestAd ? `${bestAd.contacts} contatos (${bestAd.convRate.toFixed(1).replace('.', ',')}%)` : undefined}
        />
      </section>

      <div className="dashboard-split" style={{ marginTop: 24 }}>
        <OriginChart analytics={analytics} />

        <article className="table-card compact-table acquisition-performance-table">
          <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Layers size={17} style={{ color: '#FF3CAC' }} />
                <h3 style={{ margin: 0 }}>Desempenho por canal e criativo</h3>
              </div>
              <p className="chart-header-caption">Sessões, cliques e contatos por parâmetro de aquisição</p>
            </div>
            <div className="heatmap-segmented-control">
              <button
                type="button"
                className={acqTab === 'source' ? 'active' : ''}
                onClick={() => { setAcqTab('source'); setAcqPage(0); }}
              >
                Source / Medium
              </button>
              <button
                type="button"
                className={acqTab === 'campaign' ? 'active' : ''}
                onClick={() => { setAcqTab('campaign'); setAcqPage(0); }}
              >
                Campanhas
              </button>
              <button
                type="button"
                className={acqTab === 'content' ? 'active' : ''}
                onClick={() => { setAcqTab('content'); setAcqPage(0); }}
              >
                Criativos
              </button>
              <button
                type="button"
                className={acqTab === 'term' ? 'active' : ''}
                onClick={() => { setAcqTab('term'); setAcqPage(0); }}
              >
                Termos
              </button>
            </div>
          </div>

          <div className="table-head" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) 72px 72px 82px 74px' }}>
            <span>Origem / Dimensão</span>
            <span>Sessões</span>
            <span>Usuários</span>
            <span>WhatsApp</span>
            <span>Taxa contato</span>
          </div>

          {visibleItems.map(item => {
            const conv = item.sessions > 0 ? ((item.contacts / item.sessions) * 100).toFixed(1).replace('.', ',') : '0,0';
            return (
              <div className="page-row" key={item.key} style={{ gridTemplateColumns: 'minmax(0, 1.4fr) 72px 72px 82px 74px' }}>
                <span>
                  <b>{item.label}</b>
                  {item.sub && <small style={{ color: 'var(--muted-foreground)' }}>{item.sub}</small>}
                </span>
                <span>{item.sessions.toLocaleString('pt-BR')}</span>
                <span>{item.users.toLocaleString('pt-BR')}</span>
                <span>
                  <b style={{ color: item.contacts > 0 ? '#10b981' : undefined }}>
                    {item.contacts.toLocaleString('pt-BR')}
                  </b>
                </span>
                <span>
                  <span className={`badge-pill ${Number(conv.replace(',', '.')) >= 3 ? 'good' : 'brand'}`}>
                    {conv}%
                  </span>
                </span>
              </div>
            );
          })}

          {!visibleItems.length && (
            <p className="empty-state">
              Nenhum dado de aquisição registrado para o filtro e aba selecionados.
            </p>
          )}

          <TablePagination page={acqPage} total={tableItems.length} setPage={setAcqPage} />
        </article>
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

  return (
    <>
      <PageHeader title="Seu público" subtitle="Entenda de onde vêm as pessoas que chegam ao seu site." />
      <AnalyticsFilters analytics={analytics}/>
      <div className="period">
        <span className="source-badge"><span className="source-badge-dot" />{analytics?.sourceKind === 'ga4' ? 'GA4' : 'RASTREADOR ANALIZI ATIVO'}</span>
      </div>
      <section className="metrics">
        <MetricCard title="Sessões" value={String(analytics?.totals.sessions ?? '—')} {...comparison(analytics?.totals.sessions, p?.sessions)} />
        <MetricCard title="Usuários" value={String(analytics?.totals.users ?? '—')} {...comparison(analytics?.totals.users, p?.users)} />
        <MetricCard title="Novos usuários" value={String(analytics?.totals.newUsers ?? '—')} {...comparison(analytics?.totals.newUsers, p?.newUsers)} />
        <MetricCard title="Origem principal" value={topSource?.name ? normalizeOriginName(topSource.name) : '—'} note={topSource ? `${topShare} do tráfego` : 'sem dados'} />
        <MetricCard title="Localização principal" value={topLocationLabel} subtitle={topLocationSub} note={topLocation ? `${topLocation.views} visualizações` : 'sem dados'} />
      </section>
      <div className="audience-split">
        <OriginChart analytics={analytics}/>
        <article className="table-card compact-table source-pages-table">
          <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Compass size={17} style={{ color: '#ff3cac' }} />
                <h3 style={{ margin: 0 }}>Origem por página</h3>
              </div>
              <p>Onde o tráfego de cada canal desembarcou</p>
            </div>
            <div className="heatmap-segmented-control">
              <button
                type="button"
                className={sourceTab === 'all' ? 'active' : ''}
                onClick={() => { setSourceTab('all'); setSourcePage(0); }}
              >
                Todos os canais
              </button>
              <button
                type="button"
                className={sourceTab === 'top' ? 'active' : ''}
                onClick={() => { setSourceTab('top'); setSourcePage(0); }}
              >
                Top 10 páginas
              </button>
            </div>
          </div>
          <div className="source-pages-head">
            <span>Canal</span>
            <span>Página de destino</span>
            <span>Visualizações</span>
            <span>Usuários</span>
          </div>
          {visibleSources.map(item => (
            <div className="source-pages-row" key={`${item.source}-${item.path}`}>
              <span><b>{normalizeOriginName(item.source)}</b></span>
              <span><code className="path-code">{item.path}</code></span>
              <span><b>{Number(item.views || 0).toLocaleString('pt-BR')}</b></span>
              <span>{Number(item.users || 0).toLocaleString('pt-BR')}</span>
            </div>
          ))}
          {!filteredSources.length && <p className="empty-state">Ainda não recebemos dados de origens de tráfego.</p>}
          <TablePagination page={sourcePage} total={filteredSources.length} setPage={setSourcePage}/>
        </article>
      </div>

      <article className="table-card compact-table devices-table" style={{ marginTop: 18 }}>
        <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Monitor size={17} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0 }}>Dispositivos e navegadores</h3>
            </div>
            <p>Quais aparelhos e navegadores as pessoas utilizam para acessar o seu site</p>
          </div>
          <div className="heatmap-segmented-control">
            <button
              type="button"
              className={deviceTab === 'devices' ? 'active' : ''}
              onClick={() => { setDeviceTab('devices'); setDevicePage(0); }}
            >
              Por Dispositivo
            </button>
            <button
              type="button"
              className={deviceTab === 'browsers' ? 'active' : ''}
              onClick={() => { setDeviceTab('browsers'); setDevicePage(0); }}
            >
              Dispositivo + Navegador
            </button>
          </div>
        </div>
        <div className="devices-head">
          <span>Dispositivo</span>
          <span>Navegador</span>
          <span>Sessões</span>
          <span>Visualizações</span>
          <span>Usuários</span>
          <span>Novos usuários</span>
          <span>Participação</span>
        </div>
        {visibleDevices.map((dev) => {
          const share = totalDeviceViews > 0 ? `${Math.round((dev.views / totalDeviceViews) * 100)}%` : '0%';
          const isMobile = dev.device.toLowerCase().includes('mobile');
          const isTablet = dev.device.toLowerCase().includes('tablet');
          const DevIcon = isMobile ? Smartphone : isTablet ? Tablet : Monitor;
          return (
            <div className="devices-row" key={dev.key}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <DevIcon size={14} style={{ color: isMobile ? '#ff3cac' : '#3b82f6', flexShrink: 0 }} />
                <b>{dev.device}</b>
              </span>
              <span>{dev.browser}</span>
              <span>{Number(dev.sessions || 0).toLocaleString('pt-BR')}</span>
              <span><b>{Number(dev.views || 0).toLocaleString('pt-BR')}</b></span>
              <span>{Number(dev.users || 0).toLocaleString('pt-BR')}</span>
              <span>{Number(dev.newUsers || 0).toLocaleString('pt-BR')}</span>
              <span><b>{share}</b></span>
            </div>
          );
        })}
        {!aggregatedDevices.length && (
          <p className="empty-state">
            Ainda não recebemos dados de dispositivos para os filtros selecionados neste período.
          </p>
        )}
        <TablePagination page={devicePage} total={aggregatedDevices.length} setPage={setDevicePage} />
      </article>

      <div className="geo-map-split" style={{ marginTop: 18 }}>
        <BrazilGeoMap locations={analytics?.locations} />

        <article className="table-card compact-table geo-locations-table" style={{ margin: 0 }}>
          <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={17} style={{ color: '#ff3cac' }} />
                <h3 style={{ margin: 0 }}>Localização geográfica (Cidade, Estado e País)</h3>
              </div>
              <p>De quais cidades, estados e países seus visitantes estão acessando o site</p>
            </div>
            <div className="heatmap-segmented-control">
              <button
                type="button"
                className={locationTab === 'cities' ? 'active' : ''}
                onClick={() => { setLocationTab('cities'); setLocationPage(0); }}
              >
                Cidades
              </button>
              <button
                type="button"
                className={locationTab === 'regions' ? 'active' : ''}
                onClick={() => { setLocationTab('regions'); setLocationPage(0); }}
              >
                Estados / Regiões
              </button>
              <button
                type="button"
                className={locationTab === 'countries' ? 'active' : ''}
                onClick={() => { setLocationTab('countries'); setLocationPage(0); }}
              >
                Países
              </button>
            </div>
          </div>
          <div className="geo-locations-head">
            <span>Cidade</span>
            <span>Estado / Região</span>
            <span>País</span>
            <span>Visualizações</span>
            <span>Usuários</span>
            <span>Contatos</span>
          </div>
          {visibleLocations.map((loc) => (
            <div className="geo-locations-row" key={loc.key}>
              <span><b>{loc.city}</b></span>
              <span>{loc.region}</span>
              <span>{loc.country}</span>
              <span><b>{Number(loc.views || 0).toLocaleString('pt-BR')}</b></span>
              <span>{Number(loc.users || 0).toLocaleString('pt-BR')}</span>
              <span>
                <b style={{ color: Number(loc.conversions || 0) > 0 ? '#10b981' : undefined }}>
                  {Number(loc.conversions || 0).toLocaleString('pt-BR')}
                </b>
              </span>
            </div>
          ))}
          {!aggregatedLocations.length && (
            <p className="empty-state">
              Ainda não há dados geográficos consolidados neste período. Novos acessos já estão sendo registrados com Cidade, Estado e País.
            </p>
          )}
          <TablePagination page={locationPage} total={aggregatedLocations.length} setPage={setLocationPage} />
        </article>
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
  };
  return labels[type] || 'Outro contato ou intenção';
}

function Results() {
  const analytics = useAnalytics();
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
  const formSubmits = conversionEvents.filter(item => ['contato', 'agendamento', 'orcamento', 'newsletter'].includes(item.type) && item.stage === 'confirmada').reduce((sum, item) => sum + Number(item.conversions || 0), 0);
  const purchaseIntents = conversionEvents.filter(item => ['checkout', 'pagamento', 'assinatura'].includes(item.type) && item.stage === 'intencao').reduce((sum, item) => sum + Number(item.conversions || 0), 0);
  const visibleConversionEvents = conversionEvents.slice(conversionEventPage * ITEMS_PER_PAGE, (conversionEventPage + 1) * ITEMS_PER_PAGE);

  const totalDownloads = allClicks.filter(item => isDownloadClick(item)).reduce((sum, item) => sum + Number(item.clicks || 0), 0);
  const totalOutbound = allClicks.filter(item => isOutboundClick(item)).reduce((sum, item) => sum + Number(item.clicks || 0), 0);

  const formStarts = (analytics?.contactDetails ?? [])
    .filter(c => c.type === 'form_start')
    .reduce((sum, c) => sum + Number(c.contacts || 0), 0);
  const formAbandons = (analytics?.contactDetails ?? [])
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

  return (
    <>
      <PageHeader title="Resultados" subtitle="Acompanhe as oportunidades e contatos gerados pelo seu site." />
      <AnalyticsFilters analytics={analytics} />
      <div className="period">
        <span className="source-badge"><span className="source-badge-dot" />{analytics?.sourceKind === 'ga4' ? 'GA4' : 'RASTREADOR ANALIZI ATIVO'}</span>
      </div>
      <section className="metrics">
        <MetricCard title="Contatos iniciados" value={String(t?.contacts ?? '—')} {...comparison(t?.contacts, p?.contacts)} />
        <MetricCard title="WhatsApp" value={String(t?.whatsappContacts ?? '—')} {...comparison(t?.whatsappContacts, p?.whatsappContacts)} />
        <MetricCard title="Cadastros" value={String(t?.signUps ?? '—')} {...comparison(t?.signUps, p?.signUps)} />
        <MetricCard title="Formulários enviados" value={String(formSubmits || '—')} note="envios confirmados" />
        <MetricCard title="Intenções de compra" value={String(purchaseIntents || '—')} note="checkout, pagamento ou assinatura" />
        <MetricCard title="Downloads de arquivos" value={String(totalDownloads || '—')} note="arquivos baixados no site" />
        <MetricCard title="Cliques de saída" value={String(totalOutbound || '—')} note="links externos clicados" />
        {formStarts > 0 ? (
          <MetricCard
            title="Abandono de formulário"
            value={`${formAbandonRate}%`}
            note={`${formAbandons} saíram de ${formStarts} iniciados`}
          />
        ) : (
          <MetricCard title="Logins" value={String(t?.logins ?? '—')} {...comparison(t?.logins, p?.logins)} />
        )}
        <MetricCard title="Taxa de contato" value={contactRate} note="sessões com ação" />
      </section>

      <article className="table-card compact-table source-medium-table" style={{ marginTop: '24px' }}>
        <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Layers size={17} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0 }}>Origem, Mídia e Campanha</h3>
            </div>
            <p>Sessões, visualizações de páginas, usuários e cliques divididos por canal de tráfego</p>
          </div>
          <div className="heatmap-segmented-control">
            <button
              type="button"
              className={smTab === 'all' ? 'active' : ''}
              onClick={() => { setSmTab('all'); setSmPage(0); }}
            >
              Todos os canais
            </button>
            <button
              type="button"
              className={smTab === 'conversions' ? 'active' : ''}
              onClick={() => { setSmTab('conversions'); setSmPage(0); }}
            >
              Com contatos
            </button>
            <button
              type="button"
              className={smTab === 'campaigns' ? 'active' : ''}
              onClick={() => { setSmTab('campaigns'); setSmPage(0); }}
            >
              Apenas campanhas
            </button>
          </div>
        </div>
        <div className="source-medium-head">
          <span>Origem / Mídia</span>
          <span>Campanha</span>
          <span>Sessões</span>
          <span>Visualizações</span>
          <span>Usuários</span>
          <span>Cliques gerais</span>
          <span>Cliques contatos</span>
          <span>Cliques WhatsApp</span>
        </div>
        {visibleSmResults.map((item, index) => {
          const sourceDisplay = normalizeOriginName(item.source);
          const mediumDisplay = formatMediumName(item.medium);
          const campaignDisplay = item.campaign && item.campaign.trim().length > 0 ? item.campaign : '—';
          return (
            <div className="source-medium-row" key={`${item.source}-${item.medium}-${item.campaign}-${index}`}>
              <span>
                <b>{sourceDisplay}</b> <small style={{ color: 'var(--muted-foreground, #64748b)' }}>/ {mediumDisplay}</small>
              </span>
              <span>{campaignDisplay !== '—' ? <b>{campaignDisplay}</b> : '—'}</span>
              <span>{Number(item.sessions || 0).toLocaleString('pt-BR')}</span>
              <span><b>{Number(item.pageViews ?? item.views ?? 0).toLocaleString('pt-BR')}</b></span>
              <span>{Number(item.users || 0).toLocaleString('pt-BR')}</span>
              <span>{Number(item.generalClicks || 0).toLocaleString('pt-BR')}</span>
              <span>{Number(item.contactClicks || 0).toLocaleString('pt-BR')}</span>
              <span><b style={{ color: Number(item.whatsappClicks || 0) > 0 ? '#10b981' : undefined }}>{Number(item.whatsappClicks || 0).toLocaleString('pt-BR')}</b></span>
            </div>
          );
        })}
        {!filteredSmResults.length && <p className="empty-state">Nenhum dado de origem e mídia registrado no período para os filtros selecionados.</p>}
        <TablePagination page={smPage} total={filteredSmResults.length} setPage={setSmPage} />
      </article>

      <div className="results-tables" style={{ marginTop: '24px' }}>
        <article className="table-card compact-table results-conversion-table">
          <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Target size={17} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0 }}>Desempenho de contatos</h3>
              </div>
              <p>
                {conversionTab === 'pages'
                  ? 'Páginas do site com mais contatos iniciados pelos visitantes'
                  : 'Canais e fontes de tráfego com maior taxa de contato'}
              </p>
            </div>
            <div className="heatmap-segmented-control">
              <button
                type="button"
                className={conversionTab === 'pages' ? 'active' : ''}
                onClick={() => { setConversionTab('pages'); setConversionPage(0); }}
              >
                Por Página
              </button>
              <button
                type="button"
                className={conversionTab === 'channels' ? 'active' : ''}
                onClick={() => { setConversionTab('channels'); setConversionPage(0); }}
              >
                Por Canal
              </button>
            </div>
          </div>

          {conversionTab === 'pages' ? (
            <>
              <div className="conversion-detail-head">
                <span>Página</span>
                <span>Sessões</span>
                <span>WhatsApp</span>
                <span>Cadastros</span>
                <span>Com contato</span>
                <span>Taxa de contato</span>
              </div>
              {visibleConversions.map((rawItem, index) => {
                const item = rawItem as typeof pageConversions[number];
                const hasConv = item.total > 0;
                return (
                  <div className="conversion-detail-row" key={`${item.path}-${index}`}>
                    <span title={item.path} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <code className="path-code">{item.path}</code>
                    </span>
                    <span>{Number(item.sessions || 0).toLocaleString('pt-BR')}</span>
                    <span>
                      <b style={{ color: item.whatsapp > 0 ? '#10b981' : undefined }}>
                        {item.whatsapp > 0 ? Number(item.whatsapp).toLocaleString('pt-BR') : '—'}
                      </b>
                    </span>
                    <span>
                      {item.signups > 0 ? Number(item.signups).toLocaleString('pt-BR') : '—'}
                    </span>
                    <span>
                      <b style={{ color: hasConv ? '#10b981' : undefined }}>
                        {Number(item.total).toLocaleString('pt-BR')}
                      </b>
                    </span>
                    <span>
                      <span className={`conversion-rate-badge ${item.conversionRate > 0 ? 'active' : 'empty'}`}>
                        {item.conversionRate > 0 ? `${item.conversionRate.toFixed(1).replace('.', ',')}%` : '0%'}
                      </span>
                    </span>
                  </div>
                );
              })}
              {!pageConversions.length && (
                <p className="empty-state">Nenhuma página com sessões ou contatos no período selecionado.</p>
              )}
            </>
          ) : (
            <>
              <div className="conversion-detail-head">
                <span>Canal</span>
                <span>Sessões</span>
                <span>WhatsApp</span>
                <span>Outros</span>
                <span>Com contato</span>
                <span>Taxa de contato</span>
              </div>
              {visibleConversions.map((rawItem, index) => {
                const item = rawItem as typeof channelConversions[number];
                const sourceDisplay = normalizeOriginName(item.source);
                const mediumDisplay = formatMediumName(item.medium);
                const hasConv = item.total > 0;
                return (
                  <div className="conversion-detail-row" key={`${item.source}-${item.medium}-${index}`}>
                    <span title={`${sourceDisplay} / ${mediumDisplay}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <b>{sourceDisplay}</b> <small style={{ color: 'var(--muted-foreground, #64748b)' }}>/ {mediumDisplay}</small>
                    </span>
                    <span>{Number(item.sessions || 0).toLocaleString('pt-BR')}</span>
                    <span>
                      <b style={{ color: item.whatsapp > 0 ? '#10b981' : undefined }}>
                        {item.whatsapp > 0 ? Number(item.whatsapp).toLocaleString('pt-BR') : '—'}
                      </b>
                    </span>
                    <span>
                      {item.others > 0 ? Number(item.others).toLocaleString('pt-BR') : '—'}
                    </span>
                    <span>
                      <b style={{ color: hasConv ? '#10b981' : undefined }}>
                        {Number(item.total).toLocaleString('pt-BR')}
                      </b>
                    </span>
                    <span>
                      <span className={`conversion-rate-badge ${item.conversionRate > 0 ? 'active' : 'empty'}`}>
                        {item.conversionRate > 0 ? `${item.conversionRate.toFixed(1).replace('.', ',')}%` : '0%'}
                      </span>
                    </span>
                  </div>
                );
              })}
              {!channelConversions.length && (
                <p className="empty-state">Nenhum canal com tráfego registrado no período selecionado.</p>
              )}
            </>
          )}

          <TablePagination page={conversionPage} total={currentConversionList.length} setPage={setConversionPage} />
        </article>

        <article className="table-card compact-table click-detail-table">
          <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MousePointerClick size={17} style={{ color: '#ff3cac' }} />
                <h3 style={{ margin: 0 }}>Cliques com intenção de contato</h3>
              </div>
              <p>Cliques em botões de WhatsApp, telefone e formulários</p>
            </div>
            <div className="heatmap-segmented-control">
              <button
                type="button"
                className={leadClickTab === 'all' ? 'active' : ''}
                onClick={() => { setLeadClickTab('all'); setLeadClickPage(0); }}
              >
                Todos
              </button>
              <button
                type="button"
                className={leadClickTab === 'whatsapp' ? 'active' : ''}
                onClick={() => { setLeadClickTab('whatsapp'); setLeadClickPage(0); }}
              >
                WhatsApp
              </button>
              <button
                type="button"
                className={leadClickTab === 'forms' ? 'active' : ''}
                onClick={() => { setLeadClickTab('forms'); setLeadClickPage(0); }}
              >
                Formulários
              </button>
            </div>
          </div>
          <div className="click-detail-head">
            <span>Data</span>
            <span>Botão</span>
            <span>Página</span>
            <span>Destino</span>
            <span>Cliques</span>
          </div>
          {visibleLeadClicks.map((item, index) => (
            <div className="click-detail-row" key={`${item.date}-${item.label}-${item.path}-${index}`}>
              <span><b>{item.date.slice(5).split('-').reverse().join('/')}</b></span>
              <span><b>{item.label}</b>{item.buttonId ? <small>#{item.buttonId}</small> : null}</span>
              <span><code className="path-code">{item.path}</code></span>
              <span>{item.destination ? <small title={item.destination} className="click-destination">{item.destination}</small> : '—'}</span>
              <span><b>{Number(item.clicks || 0).toLocaleString('pt-BR')}</b></span>
            </div>
          ))}
          {!filteredLeadClicks.length && <p className="empty-state">Nenhum clique de contato foi identificado no período.</p>}
          <TablePagination page={leadClickPage} total={filteredLeadClicks.length} setPage={setLeadClickPage} />
        </article>
      </div>

      <article className="table-card compact-table conversion-events-table" style={{ marginTop: '24px' }}>
        <div className="section-heading">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Target size={17} style={{ color: '#10b981' }} />
              <h3 style={{ margin: 0 }}>Contatos e intenções</h3>
            </div>
            <p>Envios confirmados de formulário e ações comerciais iniciadas</p>
          </div>
        </div>
        <div className="conversion-event-head">
          <span>Data</span>
          <span>Tipo</span>
          <span>Nome</span>
          <span>Página</span>
          <span>Status</span>
          <span>Total</span>
        </div>
        {visibleConversionEvents.map((item, index) => (
          <div className="conversion-event-row" key={`${item.date}-${item.type}-${item.name}-${item.path}-${index}`}>
            <span>{item.date.slice(5).split('-').reverse().join('/')}</span>
            <span><b>{conversionTypeLabel(item.type)}</b></span>
            <span>{item.name || '—'}</span>
            <span><code className="path-code">{item.path}</code></span>
            <span>{item.stage === 'confirmada' ? 'Confirmada' : 'Iniciada'}</span>
            <span><b>{Number(item.conversions || 0).toLocaleString('pt-BR')}</b></span>
          </div>
        ))}
        {!conversionEvents.length && <p className="empty-state">Ainda não há contatos ou intenções registrados neste período.</p>}
        <TablePagination page={conversionEventPage} total={conversionEvents.length} setPage={setConversionEventPage} />
      </article>

      <article className="table-card general-clicks-table" style={{ marginTop: '24px' }}>
        <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Target size={17} style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0 }}>Cliques em botões diversos</h3>
            </div>
            <p>Todos os cliques capturados em botões e links navegacionais pelo rastreador</p>
          </div>
          <div className="heatmap-segmented-control">
            <button
              type="button"
              className={generalClickTab === 'top' ? 'active' : ''}
              onClick={() => { setGeneralClickTab('top'); setGeneralClickPage(0); }}
            >
              Mais clicados
            </button>
            <button
              type="button"
              className={generalClickTab === 'downloads' ? 'active' : ''}
              onClick={() => { setGeneralClickTab('downloads'); setGeneralClickPage(0); }}
            >
              Downloads {totalDownloads > 0 ? `(${totalDownloads})` : ''}
            </button>
            <button
              type="button"
              className={generalClickTab === 'outbound' ? 'active' : ''}
              onClick={() => { setGeneralClickTab('outbound'); setGeneralClickPage(0); }}
            >
              Links externos {totalOutbound > 0 ? `(${totalOutbound})` : ''}
            </button>
            <button
              type="button"
              className={generalClickTab === 'all' ? 'active' : ''}
              onClick={() => { setGeneralClickTab('all'); setGeneralClickPage(0); }}
            >
              Histórico recente
            </button>
          </div>
        </div>
        <div className="general-clicks-head">
          <span>Data</span>
          <span>Texto do botão</span>
          <span>ID do botão</span>
          <span>Destino / Href</span>
          <span>Cliques</span>
        </div>
        {visibleGeneralClicks.map((item, index) => {
          const isDownload = isDownloadClick(item);
          const isOutbound = isOutboundClick(item);
          return (
            <div className="general-clicks-row" key={`${item.date}-${item.label}-${item.buttonId}-${item.destination}-${index}`}>
              <span><b>{item.date.slice(5).split('-').reverse().join('/')}</b></span>
              <span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <b>{item.label}</b>
                  {isDownload && <span className="action-badge download">Download</span>}
                  {isOutbound && <span className="action-badge outbound">Externo</span>}
                </div>
              </span>
              <span>{item.buttonId ? <small>#{item.buttonId}</small> : '—'}</span>
              <span>{item.destination ? <small title={item.destination} className="click-destination">{item.destination}</small> : '—'}</span>
              <span><b>{Number(item.clicks || 0).toLocaleString('pt-BR')}</b></span>
            </div>
          );
        })}
        {!sortedGeneralClicks.length && <p className="empty-state">Nenhum clique em botões diversos foi registrado no período.</p>}
        <TablePagination page={generalClickPage} total={sortedGeneralClicks.length} setPage={setGeneralClickPage} />
      </article>
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

function formatInsightText(value: string) {
  return value
    .replace(/([“"'])\/([”"'])/g, '$1PÁGINA INICIAL$2')
    .replace(/(^|[\s("'“”])\/(?=$|[\s,.;:!?'"“”])/g, '$1PÁGINA INICIAL')
    .replace(/página\s+\/(?=[\s,.;:!?]|$)/gi, 'PÁGINA INICIAL')
    .replace(/\bCTA\b(?!\s*\()/g, 'CTA (chamada para ação, como botões de contato ou links de formulário)')
    .replace(/\btráfego orgânico\b(?!\s*\()/gi, 'tráfego orgânico (visitas que chegam sem anúncio pago)')
    .replace(/\bremarketing\b(?!\s*\()/gi, 'remarketing (anúncio para quem já visitou seu site)')
    .replace(/\bfunil\b(?!\s*\()/gi, 'funil (caminho da visita até o contato)')
    .replace(/\btaxa de saída\b(?!\s*\()/gi, 'taxa de saída (percentual de visitas que deixam a página sem continuar)')
}

function Insights() {
  const analytics = useAnalytics();
  const { currentBusiness, currentSite } = useBusiness();
  const [insights, setInsights] = useState<GeneratedInsight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [modelLabel, setModelLabel] = useState<string>('IZI INTELLIGENCE');
  const [scopeLabel, setScopeLabel] = useState<string>('semanal');
  const [cachedNotice, setCachedNotice] = useState<boolean>(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [awaitingWeeklyReport, setAwaitingWeeklyReport] = useState(false);

  const [readKeys, setReadKeys] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('analizi-viewed-insights') || '[]');
    } catch {
      return [];
    }
  });

  const toggleRead = (key: string) => {
    setReadKeys((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      localStorage.setItem('analizi-viewed-insights', JSON.stringify(next));
      return next;
    });
  };

  const fetchInsights = async () => {
    if (!analytics || !currentSite) return;
    setLoadingAI(true);
    try {
      const res = await fetch('/v1/ai-insights', {
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
        const data = await res.json() as {
          insights?: GeneratedInsight[];
          model?: string;
          scope?: string;
          cached?: boolean;
          generatedAt?: string;
        };
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
          if (data.model) setModelLabel(data.model);
          if (data.scope) setScopeLabel(data.scope);
          setCachedNotice(Boolean(data.cached));
          setGeneratedAt(data.generatedAt || null);
          setAwaitingWeeklyReport(false);
        } else if (res.status === 202) {
          setInsights([]);
          setAwaitingWeeklyReport(true);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar insights:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (analytics && currentSite) {
      fetchInsights();
    }
  }, [currentSite?.id, analytics]);

  const activeInsights = insights;
  const reportDate = generatedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(generatedAt))
    : null;

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle={`Diagnósticos inteligentes consolidados para o seu site (${scopeLabel}).`}
        eyebrow="INTELIGÊNCIA ARTIFICIAL"
        icon={Sparkles}
        iconColor="#ff3cac"
      />
      <div className="insights-context-row">
        <span className="badge-ia">
          <Sparkles size={13} /> IZI INTELLIGENCE
        </span>
        <span className="source-badge">
          <span className="source-badge-dot"></span>
          RASTREADOR ANALIZI ATIVO
        </span>
      </div>

      <AnalyticsFilters analytics={analytics} />

      {loadingAI && !insights.length ? (
        <section className="insights-loading-state" style={{ padding: 40, textAlign: 'center' }}>
          <Sparkles size={32} className="spin" style={{ color: '#ff3cac', marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>O Analizi está cruzando o comportamento do seu público com o seu segmento...</p>
        </section>
      ) : (
        <section className="insights-modern-grid">
          {awaitingWeeklyReport && !activeInsights.length && (
            <article className="empty-tip" style={{ gridColumn: '1 / -1' }}>
              <Sparkles size={22} />
              <div>
                <b>Seu próximo diagnóstico será preparado na segunda-feira.</b>
                <p>Os insights são fechados semanalmente para comparar períodos completos, sem alterar a análise cada vez que a tela é aberta.</p>
              </div>
            </article>
          )}
          {activeInsights.map((item) => {
            const read = readKeys.includes(item.key || item.title);
            const isPos = item.status === 'positive';
            const isWarn = item.status === 'warning';
            const badgeType = isWarn ? 'warning' : isPos ? 'success' : 'opportunity';

            return (
              <article
                className={`insight-card-system ${read ? 'viewed' : ''}`}
                key={item.key || item.title}
              >
                <div className={`insight-icon-box ${badgeType}`}>
                  {isWarn ? (
                    <AlertTriangle size={22} />
                  ) : isPos ? (
                    <CircleCheck size={22} />
                  ) : (
                    <Sparkles size={22} />
                  )}
                </div>

                <div className="insight-content-system">
                  <div className="insight-meta-row">
                    <span className={`insight-badge-pill ${badgeType}`}>{item.badge}</span>
                    <span className="insight-date-stamp">{reportDate ? `Atualizado em ${reportDate}` : 'Atualização semanal: segunda-feira'}</span>
                  </div>

                  <h3>{formatInsightText(item.title)}</h3>

                  <div className="insight-box-block">
                    <strong style={{ display: 'block', marginBottom: 4, color: 'var(--foreground)' }}>O que os dados mostram:</strong>
                    <span>{formatInsightText(item.finding)}</span>
                  </div>

                  <div className="insight-action-grid">
                    <div className="insight-sub-box">
                      <span className="insight-sub-box-title">Recomendação prática:</span>
                      <p>{formatInsightText(item.action)}</p>
                    </div>

                    <div className="insight-sub-box">
                      <span className="insight-sub-box-title">Projeção esperada:</span>
                      <p>{formatInsightText(item.projection)}</p>
                    </div>
                  </div>
                </div>

                <button
                  className="insight-read"
                  onClick={() => toggleRead(item.key || item.title)}
                  title={read ? 'Marcar como não lido' : 'Marcar como resolvido'}
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                >
                  <span />
                </button>
              </article>
            );
          })}
        </section>
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
  sourceKind?: string
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

function pageFromPath(): Page { const path = window.location.pathname; if (path === '/aquisicao') return 'acquisition'; if (path === '/publico') return 'audience'; if (path === '/paginas') return 'pages'; if (path === '/resultados') return 'results'; if (path === '/heatmap') return 'heatmap'; if (path === '/insights') return 'insights'; if (path === '/configuracoes/negocio') return 'team'; if (path === '/configuracoes/fontes-de-dados') return 'data-sources'; if (path === '/configuracoes/rastreador') return 'tracker-setup'; if (path === '/configuracoes/google-analytics') return 'ga4-setup'; if (path.startsWith('/configuracoes')) return 'settings'; return 'dashboard' }
function dateString(date: Date) { return date.toISOString().slice(0, 10) }
function shiftDays(base: string, offset: number) { const d = new Date(`${base}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return dateString(d) }
function comparison(current?: number, previous?: number) { const now = Number(current || 0); const before = Number(previous || 0); if (!before) return { variation: now ? 'novo no período' : 'sem dados', good: true }; const percent = Math.round(Math.abs(((now - before) / before) * 100)); return { variation: `${percent}%`, good: now >= before } }
function readAnalyticsFilter(): AnalyticsFilter {
  const params = new URLSearchParams(window.location.search);
  const yesterday = shiftDays(dateString(new Date()), -1);
  const valid = (value: string | null) => Boolean(value && value.length === 10 && value[4] === '-' && value[7] === '-' && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));
  let end = valid(params.get('end')) ? params.get('end')! : yesterday;
  if (end > yesterday) end = yesterday;
  let start = valid(params.get('start')) ? params.get('start')! : shiftDays(end, -6);
  if (start > end) start = end;
  if (start < shiftDays(end, -729)) start = shiftDays(end, -729);
  const group = params.get('group');
  return {
    start,
    end,
    group: group === 'week' || group === 'month' || group === 'quarter' || group === 'semester' || group === 'year' ? group : 'day',
    page: params.get('page') || '',
    source: params.get('source') || '',
    medium: params.get('medium') || '',
    campaign: params.get('campaign') || '',
    device: params.get('device') || '',
    browser: params.get('browser') || ''
  };
}
function selectedDays() { const filter = readAnalyticsFilter(); return Math.floor((Date.parse(`${filter.end}T00:00:00Z`) - Date.parse(`${filter.start}T00:00:00Z`)) / 86_400_000) + 1 }

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
      if (!currentSite?.tracker_site_id) {
        setData(null);
        return;
      }
      const source = supabase ? await supabase.from('data_sources').select('kind,status').eq('site_id', currentSite.id) : null;
      const ga4Connected = currentSite.analytics_source === 'ga4' && (source?.data?.some(item => item.kind === 'ga4' && item.status === 'connected') || false);
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
          headers: ga4Connected && session?.access_token ? { authorization: `Bearer ${session.access_token}` } : undefined
        });
        if (response.ok) {
          const payload = await response.json() as AnalyticsData;
          setData({ ...payload, sourceKind: ga4Connected ? 'ga4' : source?.data?.[0]?.kind });
          if (supabase && currentSite.id && payload?.totals && (Number(payload.totals.pageViews || 0) > 0 || Number(payload.totals.users || 0) > 0)) {
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

    const url = new URL(window.location.href);
    url.searchParams.set('start', safeStart);
    url.searchParams.set('end', safeEnd);
    url.searchParams.set('group', next.group);
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

  const uniqueSources = Array.from(new Set((analytics?.filterSources ?? []).map(item => normalizeOriginName(item.source))));
  const uniqueMediums = Array.from(new Set((analytics?.filterMediums ?? []).map(item => item.medium).filter(Boolean)));
  const uniqueCampaigns = Array.from(new Set((analytics?.filterCampaigns ?? []).map(item => item.campaign).filter(Boolean)));
  const uniqueDevices = Array.from(new Set((analytics?.filterDevices ?? []).map(item => item.device).filter(Boolean)));
  const uniqueBrowsers = Array.from(new Set((analytics?.filterBrowsers ?? []).map(item => item.browser).filter(Boolean)));

  return (
    <div className="analytics-filters">
      <div className="filters-main-row">
        {/* Date Picker Range */}
        <div className="filter-group-date">
          <Calendar size={14} className="filter-field-icon" />
          <label className="filter-date-label">
            <span>De</span>
            <input
              type="date"
              className="filter-date-input"
              value={filter.start}
              max={filter.end}
              min={shiftDays(filter.end, -729)}
              onChange={(event) => apply({ ...filter, start: event.target.value })}
            />
          </label>
          <span className="filter-date-sep">–</span>
          <label className="filter-date-label">
            <span>Até</span>
            <input
              type="date"
              className="filter-date-input"
              value={filter.end}
              max={maxAvailableDate}
              min={filter.start}
              onChange={(event) => apply({ ...filter, end: event.target.value })}
            />
          </label>
        </div>

        {/* Quick Period Presets */}
        <div className="filter-quick-pills">
          <button
            type="button"
            className={`filter-pill-btn ${currentDays === 7 ? 'active' : ''}`}
            onClick={() => preset(7)}
          >
            7D
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${currentDays === 14 ? 'active' : ''}`}
            onClick={() => preset(14)}
          >
            14D
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${currentDays === 30 ? 'active' : ''}`}
            onClick={() => preset(30)}
          >
            30D
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${currentDays === 90 ? 'active' : ''}`}
            onClick={() => preset(90)}
          >
            90D
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${currentDays >= 360 ? 'active' : ''}`}
            onClick={() => preset(365)}
          >
            1A
          </button>
        </div>
      </div>

      <div className="filters-dim-row">
        {/* Agrupar por */}
        <div className="filter-item-field">
          <span className="filter-field-label">Agrupar:</span>
          <select value={filter.group} onChange={(event) => apply({ ...filter, group: event.target.value as AnalyticsFilter['group'] })}>
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="quarter">Trimestre</option>
            <option value="semester">Semestre</option>
            <option value="year">Ano</option>
          </select>
        </div>

        {/* Filtro de Página */}
        <div className="filter-item-field">
          <FileText size={13} className="filter-field-icon" />
          <span className="filter-field-label">Página:</span>
          <select value={filter.page} onChange={(event) => apply({ ...filter, page: event.target.value })}>
            <option value="">Todas as páginas</option>
            {(analytics?.filterPages ?? []).map(item => (
              <option key={item.path} value={item.path}>
                {item.path === '/' ? '/ (Página Inicial)' : item.path}
              </option>
            ))}
          </select>
        </div>

        {/* Dispositivo */}
        <div className="filter-item-field">
          <Monitor size={13} className="filter-field-icon" />
          <span className="filter-field-label">Aparelho:</span>
          <select value={filter.device || ''} onChange={(event) => apply({ ...filter, device: event.target.value })}>
            <option value="">Todos</option>
            {uniqueDevices.map(dev => <option key={dev} value={dev}>{formatDeviceName(dev)}</option>)}
          </select>
        </div>

        {/* Navegador */}
        <div className="filter-item-field">
          <Globe size={13} className="filter-field-icon" />
          <span className="filter-field-label">Navegador:</span>
          <select value={filter.browser || ''} onChange={(event) => apply({ ...filter, browser: event.target.value })}>
            <option value="">Todos</option>
            {uniqueBrowsers.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Origem */}
        <div className="filter-item-field">
          <Compass size={13} className="filter-field-icon" />
          <span className="filter-field-label">Origem:</span>
          <select value={filter.source} onChange={(event) => apply({ ...filter, source: event.target.value })}>
            <option value="">Todas</option>
            {uniqueSources.map(sourceName => <option key={sourceName} value={sourceName}>{sourceName}</option>)}
          </select>
        </div>

        {/* Mídia */}
        <div className="filter-item-field">
          <Layers size={13} className="filter-field-icon" />
          <span className="filter-field-label">Mídia:</span>
          <select value={filter.medium || ''} onChange={(event) => apply({ ...filter, medium: event.target.value })}>
            <option value="">Todas</option>
            {uniqueMediums.map(m => <option key={m} value={m}>{formatMediumName(m)}</option>)}
          </select>
        </div>

        {/* Campanha */}
        <div className="filter-item-field">
          <Target size={13} className="filter-field-icon" />
          <span className="filter-field-label">Campanha:</span>
          <select value={filter.campaign || ''} onChange={(event) => apply({ ...filter, campaign: event.target.value })}>
            <option value="">Todas</option>
            {uniqueCampaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
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

function ConnectionStatus() {
  const { currentSite } = useBusiness();
  const [state, setState] = useState<'loading' | 'none' | 'configured' | 'pending' | 'warning_24h' | 'inactive_24h' | 'ready'>('loading');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!currentSite?.id) {
        if (isMounted) setState('none');
        return;
      }
      if (!supabase) {
        if (isMounted) setState('ready');
        return;
      }

      try {
        const source = await supabase
          .from('data_sources')
          .select('id,status,connected_at,last_synced_at,created_at')
          .eq('site_id', currentSite.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const item = source?.data?.[0];
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

        // A fonte estar conectada apenas confirma a configuração. Dados só existem
        // depois de uma sincronização ou de um evento recebido pelo tracker.
        let hasEvents = Boolean(item?.last_synced_at);
        let lastEventAt: string | null = item?.last_synced_at || null;

        if (currentSite.tracker_site_id) {
          try {
            const check = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites/${currentSite.tracker_site_id}/status`);
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
        if (isMounted) setState('none');
      }
    };

    void load();
    return () => { isMounted = false; };
  }, [currentSite]);

  if (state === 'loading') return null;
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
        <b>NENHUM EVENTO DETECTADO APÓS 24 HORAS.</b>
        <p>Seu site foi configurado há mais de 24 horas, mas ainda não recebemos visitas. Verifique se o código do rastreador foi publicado corretamente.</p>
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
        <b>Você acabou de conectar seu site.</b>
        <p>Seus dados serão coletados em até 24 horas.</p>
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
      <b>DADOS COLETADOS ATÉ {yesterdayFormatted}.</b>
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

  const topPage = pages[0];
  const topTitle = topPage ? (topPage.title || topPage.path) : '—';
  const topPath = topPage ? topPage.path : undefined;

  return (
    <>
      <PageHeader title="Suas páginas" subtitle="Veja quais páginas atraem e mantêm mais pessoas no seu site."/>
      <AnalyticsFilters analytics={analytics}/>
      <div className="period">
        <span className="source-badge"><span className="source-badge-dot" />{analytics?.sourceKind === 'ga4' ? 'GA4' : 'RASTREADOR ANALIZI ATIVO'}</span>
      </div>
      <section className="metrics page-metrics">
        <MetricCard title="Páginas acompanhadas" value={String(pages.length || '—')} note="páginas com atividade no período"/>
        <MetricCard title="Visualizações de páginas" value={String(totalViews || '—')} {...comparison(totalViews, p?.pageViews)}/>
        <MetricCard title="Página mais vista" value={topTitle} subtitle={topPath} note="mais visualizada no período"/>
        <MetricCard title="Velocidade média de carregamento" value={formatSpeed(averageLoadMs)} note="carregamento das páginas"/>
        <MetricCard title="Taxa média de saída" value={averageExit ? `${averageExit.toFixed(1).replace('.', ',')}%` : '—'} note="sessões não engajadas"/>
      </section>
      <section className="pages-split">
        <PageChart pages={pages}/>
        <article className="table-card compact-table pages-table">
          <div className="section-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <FileText size={17} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0 }}>Desempenho das páginas</h3>
              </div>
              <p>Visualizações, velocidade, tempo de atenção e taxa de saída por URL</p>
            </div>
            <div className="heatmap-segmented-control">
              <button
                type="button"
                className={pageSortTab === 'views' ? 'active' : ''}
                onClick={() => { setPageSortTab('views'); setTablePage(0); }}
              >
                Mais acessadas
              </button>
              <button
                type="button"
                className={pageSortTab === 'speed' ? 'active' : ''}
                onClick={() => { setPageSortTab('speed'); setTablePage(0); }}
              >
                Mais rápidas
              </button>
              <button
                type="button"
                className={pageSortTab === 'attention' ? 'active' : ''}
                onClick={() => { setPageSortTab('attention'); setTablePage(0); }}
              >
                Maior atenção
              </button>
              <button
                type="button"
                className={pageSortTab === 'exit' ? 'active' : ''}
                onClick={() => { setPageSortTab('exit'); setTablePage(0); }}
              >
                Menor saída
              </button>
            </div>
          </div>
          <div className="table-head">
            <span>Página</span>
            <span>Visualizações</span>
            <span>Tempo de atenção</span>
            <span title="Duração média de carregamento da página">Velocidade</span>
            <span title="Porcentagem de sessões que duraram menos de 10s, viram apenas 1 página e não converteram (padrão GA4)">Taxa de saída</span>
          </div>
          {visiblePages.map((item) => {
            const exit = item.exitRate;
            const exitColor = exit != null ? (exit <= 30 ? '#10b981' : exit <= 55 ? 'inherit' : '#f59e0b') : undefined;
            const speedColor = item.loadTimeMs ? (item.loadTimeMs <= 1800 ? '#10b981' : item.loadTimeMs <= 3000 ? 'inherit' : '#f59e0b') : undefined;
            return (
              <div className="page-row" key={item.path}>
                <span>
                  <b>{item.title || item.path}</b>
                  <code className="path-code" style={{ marginTop: 3 }}>{item.path}</code>
                </span>
                <span><b>{Number(item.views || 0).toLocaleString('pt-BR')}</b></span>
                <span>{duration(item.attentionSeconds)}</span>
                <span>
                  <b style={{ color: speedColor }}>
                    {formatSpeed(item.loadTimeMs)}
                  </b>
                </span>
                <span>
                  <b style={{ color: exitColor }}>
                    {item.exitRate == null ? '—' : `${item.exitRate}%`}
                  </b>
                </span>
              </div>
            );
          })}
          {!pages.length && <p className="empty-state">Ainda não recebemos visualizações de páginas neste período.</p>}
          <TablePagination page={tablePage} total={sortedPages.length} setPage={setTablePage}/>
        </article>
      </section>
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

function TeamSettings({ setPage }: { setPage: (page: Page) => void }) {
  const {
    currentBusiness,
    currentSite,
    effectivePlan,
    subscriptionStatus,
    subscriptionExpiresAt,
    totalSitesCount,
    setNewSiteModalOpen
  } = useBusiness()

  const businessId = currentBusiness?.id || ''
  const siteDisplayName = currentSite?.name || currentBusiness?.name || 'Meu site'
  const siteDomain = currentSite?.domain || currentBusiness?.website_url || ''

  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [members, setMembers] = useState<SiteMember[]>([])
  const [invites, setInvites] = useState<SiteInvitation[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'admin'>('viewer')
  const [message, setMessage] = useState('')
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success')
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadPeopleAndAccess = async () => {
    if (!supabase || !businessId) return
    setLoadingMembers(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // 1. Busca membros vinculados ao negócio/site atual
      const { data: memberRows } = await supabase
        .from('business_members')
        .select('user_id, role, creator_role, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true })

      if (memberRows && memberRows.length > 0) {
        const userIds = memberRows.map((m) => m.user_id)
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        const profileMap = new Map(
          (profileRows || []).map((p) => [p.id, { full_name: p.full_name || '', email: p.email || '' }])
        )

        const enriched: SiteMember[] = memberRows.map((m) => {
          const prof = profileMap.get(m.user_id)
          const isCurrentUser = user && m.user_id === user.id
          return {
            user_id: m.user_id,
            role: (m.role as 'owner' | 'admin' | 'viewer') || 'viewer',
            creator_role: m.creator_role,
            created_at: m.created_at,
            full_name: prof?.full_name || (isCurrentUser ? user.user_metadata?.full_name || 'Você' : 'Membro da equipe'),
            email: prof?.email || (isCurrentUser ? user.email || '' : '')
          }
        })
        setMembers(enriched)
      } else {
        setMembers([])
      }

      // 2. Busca convites pendentes ou enviados para este site
      const { data: inviteRows } = await supabase
        .from('business_invitations')
        .select('id, email, role, status, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      setInvites(
        (inviteRows || [])
          .filter((inv) => inv.status !== 'accepted')
          .map((inv) => ({
            id: inv.id,
            email: inv.email,
            role: (inv.role as 'admin' | 'viewer') || 'viewer',
            status: inv.status,
            created_at: inv.created_at
          }))
      )
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    void loadPeopleAndAccess()
  }, [businessId])

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text)
    setFeedbackType(type)
  }

  const handleUpdateMemberRole = async (targetUserId: string, nextRole: 'owner' | 'admin' | 'viewer') => {
    if (!supabase || !businessId) return
    setUpdatingId(targetUserId)
    setMessage('')
    try {
      const { error } = await supabase
        .from('business_members')
        .update({ role: nextRole })
        .eq('business_id', businessId)
        .eq('user_id', targetUserId)

      if (error) {
        showFeedback(error.message || 'Não foi possível atualizar a permissão.', 'error')
      } else {
        setMembers((prev) =>
          prev.map((m) => (m.user_id === targetUserId ? { ...m, role: nextRole } : m))
        )
        showFeedback('Permissão da pessoa atualizada com sucesso.')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveMember = async (member: SiteMember) => {
    if (!supabase || !businessId) return
    const ownersCount = members.filter((m) => m.role === 'owner').length
    if (member.role === 'owner' && ownersCount <= 1) {
      showFeedback('O site precisa ter pelo menos um proprietário ativo.', 'error')
      return
    }
    if (!window.confirm(`Deseja realmente remover o acesso de ${member.full_name || member.email} a este site?`)) {
      return
    }
    setUpdatingId(member.user_id)
    setMessage('')
    try {
      const { error } = await supabase
        .from('business_members')
        .delete()
        .eq('business_id', businessId)
        .eq('user_id', member.user_id)

      if (error) {
        showFeedback(error.message || 'Não foi possível remover o acesso.', 'error')
      } else {
        setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id))
        showFeedback(`Acesso de ${member.full_name || member.email} removido.`)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdateInviteRole = async (inviteId: string, nextRole: 'admin' | 'viewer') => {
    if (!supabase) return
    setUpdatingId(inviteId)
    setMessage('')
    try {
      const { error } = await supabase
        .from('business_invitations')
        .update({ role: nextRole })
        .eq('id', inviteId)

      if (error) {
        showFeedback(error.message || 'Não foi possível alterar a permissão do convite.', 'error')
      } else {
        setInvites((prev) => prev.map((inv) => (inv.id === inviteId ? { ...inv, role: nextRole } : inv)))
        showFeedback('Permissão do convite atualizada.')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveInvite = async (inv: SiteInvitation) => {
    if (!supabase) return
    if (!window.confirm(`Deseja cancelar e excluir o convite enviado para ${inv.email}?`)) {
      return
    }
    setUpdatingId(inv.id)
    setMessage('')
    try {
      const { error } = await supabase
        .from('business_invitations')
        .delete()
        .eq('id', inv.id)

      if (error) {
        showFeedback(error.message || 'Não foi possível excluir o convite.', 'error')
      } else {
        setInvites((prev) => prev.filter((item) => item.id !== inv.id))
        showFeedback(`Convite para ${inv.email} excluído.`)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const invite = async () => {
    setMessage('')
    if (!businessId) {
      showFeedback('Não foi possível identificar o site selecionado.', 'error')
      return
    }
    const address = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      showFeedback('Informe um e-mail válido.', 'error')
      return
    }
    setLoadingInvite(true)
    try {
      const { data: { user } } = await supabase!.auth.getUser()

      // Verifica se já existe um perfil cadastrado com esse e-mail para vinculá-lo imediatamente ao site
      const { data: existingProfile } = await supabase!
        .from('profiles')
        .select('id, full_name, email')
        .ilike('email', address)
        .maybeSingle()

      if (existingProfile?.id) {
        const { error: memberErr } = await supabase!
          .from('business_members')
          .upsert(
            { business_id: businessId, user_id: existingProfile.id, role },
            { onConflict: 'business_id,user_id' }
          )

        if (memberErr) {
          showFeedback(memberErr.message, 'error')
        } else {
          setEmail('')
          showFeedback(`${existingProfile.full_name || address} já possui conta no Analizi e foi adicionado(a) diretamente com acesso a este site!`)
          await loadPeopleAndAccess()
        }
        return
      }

      const { data, error } = await supabase!
        .from('business_invitations')
        .upsert(
          { business_id: businessId, email: address, role, invited_by: user?.id, status: 'pending' },
          { onConflict: 'business_id,email' }
        )
        .select('id,email,role,status,created_at')
        .single()

      if (error) {
        showFeedback(error.message, 'error')
      } else if (data) {
        setInvites((current) => [
          {
            id: data.id,
            email: data.email,
            role: (data.role as 'admin' | 'viewer') || 'viewer',
            status: data.status,
            created_at: data.created_at
          },
          ...current.filter((item) => item.id !== data.id)
        ])
        setEmail('')
        showFeedback('Convite salvo! Assim que a pessoa entrar com este e-mail Google, o acesso ao site será liberado automaticamente.')
      }
    } finally {
      setLoadingInvite(false)
    }
  }

  const subBadge = formatSubscriptionStatus(subscriptionStatus)
  const expText = formatExpirationDate(subscriptionExpiresAt, effectivePlan.id)

  return (
    <>
      <div className="source-header meu-site-header">
        <div>
          <button className="back-link" onClick={() => setPage('settings')}>
            <ArrowLeft size={16} /> Configurações
          </button>
          <span className="eyebrow">MEU SITE · EQUIPE & ASSINATURA</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={27} style={{ color: '#ff3cac' }} /> Meu Site: {siteDisplayName}
          </h1>
          <p className="subtitle">
            Gerencie as pessoas com acesso a <b>{siteDomain || siteDisplayName}</b>, suas permissões no Analizi e os detalhes do seu plano.
          </p>
        </div>

        <Button onClick={() => setNewSiteModalOpen(true)}>
          <Plus size={17} /> Adicionar novo site
        </Button>
      </div>

      {/* Seção 1: Plano, Assinatura, Expiração e Botão de Novos Sites */}
      <section className="team-card plan-subscription-card">
        <div className="plan-card-top">
          <div className="plan-card-title-group">
            <div className="plan-icon-badge">
              <Crown size={22} />
            </div>
            <div>
              <div className="plan-title-row">
                <h2>Plano & Assinatura</h2>
                <span className={`sub-status-pill ${subBadge.badgeClass}`}>{subBadge.label}</span>
                {effectivePlan.id === 'admin' && (
                  <span className="sub-status-pill admin-pill">
                    <Sparkles size={12} /> Todas as funções liberadas
                  </span>
                )}
              </div>
              <p>{effectivePlan.description}</p>
            </div>
          </div>

          <div className="plan-card-actions">
            <Button onClick={() => setNewSiteModalOpen(true)}>
              <Plus size={17} /> Adicionar novo site
            </Button>
          </div>
        </div>

        <div className="plan-metrics-grid">
          <div className="plan-metric-item">
            <span className="plan-metric-label">PLANO ATUAL</span>
            <strong className="plan-metric-value highlight">{effectivePlan.name}</strong>
            <small>{effectivePlan.priceLabel}</small>
          </div>

          <div className="plan-metric-item">
            <span className="plan-metric-label">STATUS DA ASSINATURA</span>
            <strong className="plan-metric-value">{subBadge.label}</strong>
            <small>
              {effectivePlan.allFeaturesUnlocked
                ? 'Acesso completo a todos os recursos'
                : 'Recursos essenciais ativos'}
            </small>
          </div>

          <div className="plan-metric-item">
            <span className="plan-metric-label">EXPIRAÇÃO DA ASSINATURA ATUAL</span>
            <strong className="plan-metric-value">
              <Calendar size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom', color: '#ff8a3d' }} />
              {expText}
            </strong>
            <small>Ciclo vigente da conta</small>
          </div>

          <div className="plan-metric-item">
            <span className="plan-metric-label">LIMITE DE SITES DO PLANO</span>
            <strong className="plan-metric-value">
              {totalSitesCount} / {effectivePlan.id === 'admin' ? 'N sites (Ilimitado)' : `${effectivePlan.maxSites} site(s)`}
            </strong>
            <small>
              Plano R$ 39,90 (1 site) · R$ 79 (2 sites) · Admin (N sites)
            </small>
          </div>
        </div>

        <div className="plan-features-strip">
          {effectivePlan.features.map((feat) => (
            <span key={feat} className="plan-feature-tag">
              <Check size={14} /> {feat}
            </span>
          ))}
        </div>
      </section>

      {/* Seção 2: Pessoas relacionadas a este site e suas permissões */}
      <section className="team-card">
        <div className="section-heading">
          <div>
            <h2>Pessoas relacionadas a este site</h2>
            <p>
              Veja quem tem acesso a <b>{siteDisplayName}</b> ({siteDomain}), consulte suas permissões no Analizi, edite o nível de acesso ou remova a pessoa.
            </p>
          </div>
          <span className="members-count-badge">
            {members.length + invites.length} {members.length + invites.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>

        {message && (
          <p className={`form-feedback ${feedbackType === 'error' ? 'error' : ''}`} style={{ marginTop: 14 }}>
            {message}
          </p>
        )}

        <div className="site-people-list">
          <div className="site-people-head">
            <span>Pessoa</span>
            <span>Permissões no Analizi</span>
            <span>Nível de acesso</span>
            <span>Ações</span>
          </div>

          {loadingMembers && members.length === 0 ? (
            <p className="empty-team">Carregando pessoas vinculadas a este site...</p>
          ) : (
            members.map((member) => {
              const roleMeta = ROLE_DESCRIPTIONS[member.role] || ROLE_DESCRIPTIONS.viewer
              const isSelf = member.user_id === currentUserId
              const isBusy = updatingId === member.user_id
              const initials = (member.full_name || member.email || 'U')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()

              return (
                <div className="site-person-row" key={member.user_id}>
                  <div className="site-person-identity">
                    <span className="site-person-avatar">{initials}</span>
                    <div>
                      <b>
                        {member.full_name || member.email}
                        {isSelf && <em className="you-tag">Você</em>}
                      </b>
                      <small>{member.email || 'Acesso autenticado via Google'}</small>
                    </div>
                  </div>

                  <div className="site-person-permissions">
                    <span className={`role-badge ${roleMeta.badgeClass}`}>{roleMeta.label}</span>
                    <small>{roleMeta.permissions}</small>
                  </div>

                  <div className="site-person-role-edit">
                    <select
                      aria-label={`Editar permissão de ${member.full_name || member.email}`}
                      value={member.role}
                      disabled={isBusy}
                      onChange={(e) =>
                        handleUpdateMemberRole(member.user_id, e.target.value as 'owner' | 'admin' | 'viewer')
                      }
                    >
                      <option value="owner">Proprietário(a)</option>
                      <option value="admin">Administrador(a)</option>
                      <option value="viewer">Visualizador(a)</option>
                    </select>
                  </div>

                  <div className="site-person-actions">
                    <button
                      type="button"
                      className="person-remove-btn"
                      disabled={isBusy}
                      onClick={() => handleRemoveMember(member)}
                      title="Excluir acesso desta pessoa"
                    >
                      <Trash2 size={15} />
                      <span>Excluir acesso</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}

          {/* Convites pendentes exibidos na mesma relação com opção de editar permissão ou excluir */}
          {invites.map((inv) => {
            const roleMeta = ROLE_DESCRIPTIONS[inv.role] || ROLE_DESCRIPTIONS.viewer
            const isBusy = updatingId === inv.id
            return (
              <div className="site-person-row pending-invite" key={inv.id}>
                <div className="site-person-identity">
                  <span className="site-person-avatar invite">@</span>
                  <div>
                    <b>
                      {inv.email}
                      <em className="invite-status-tag">Convite pendente</em>
                    </b>
                    <small>Aguardando primeiro acesso com este e-mail Google</small>
                  </div>
                </div>

                <div className="site-person-permissions">
                  <span className={`role-badge ${roleMeta.badgeClass}`}>{roleMeta.label}</span>
                  <small>{roleMeta.permissions}</small>
                </div>

                <div className="site-person-role-edit">
                  <select
                    aria-label={`Editar permissão do convite para ${inv.email}`}
                    value={inv.role}
                    disabled={isBusy}
                    onChange={(e) =>
                      handleUpdateInviteRole(inv.id, e.target.value as 'admin' | 'viewer')
                    }
                  >
                    <option value="admin">Administrador(a)</option>
                    <option value="viewer">Visualizador(a)</option>
                  </select>
                </div>

                <div className="site-person-actions">
                  <button
                    type="button"
                    className="person-remove-btn"
                    disabled={isBusy}
                    onClick={() => handleRemoveInvite(inv)}
                    title="Cancelar e excluir acesso convidado"
                  >
                    <Trash2 size={15} />
                    <span>Excluir acesso</span>
                  </button>
                </div>
              </div>
            )
          })}

          {!loadingMembers && members.length === 0 && invites.length === 0 && (
            <p className="empty-team">Nenhuma pessoa encontrada para este site.</p>
          )}
        </div>
      </section>

      {/* Seção 3: Slot mantido de Convidar uma pessoa */}
      <section className="team-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <UserPlus size={19} style={{ color: '#ff3cac' }} />
          <h2 style={{ margin: 0 }}>Convidar uma pessoa</h2>
        </div>
        <p>Quem for convidado poderá entrar com o Google usando este mesmo e-mail para acessar os dados de <b>{siteDisplayName}</b>.</p>
        <div className="team-invite-form">
          <label>
            E-mail
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@empresa.com.br"
              type="email"
            />
          </label>
          <label>
            Permissão no Analizi
            <select value={role} onChange={(event) => setRole(event.target.value as 'viewer' | 'admin')}>
              <option value="viewer">Visualizador (Somente leitura)</option>
              <option value="admin">Administrador (Acesso total)</option>
            </select>
          </label>
          <Button onClick={invite} disabled={loadingInvite}>
            {loadingInvite ? 'Salvando...' : 'Convidar pessoa'}
          </Button>
        </div>
      </section>
    </>
  )
}

function Settings({ setPage }: { setPage: (page: Page) => void }) {
  const {
    currentBusiness,
    currentSite,
    effectivePlan,
    subscriptionStatus,
    totalSitesCount,
    setNewSiteModalOpen
  } = useBusiness()

  const [activeTab, setActiveTab] = useState<'general' | 'tracker' | 'sources' | 'plan' | 'team' | 'notifications'>('general')

  // Geral form
  const [siteName, setSiteName] = useState(currentSite?.name || currentBusiness?.name || '')
  const [siteDomain, setSiteDomain] = useState(currentSite?.domain || currentBusiness?.website_url || '')
  const [segment, setSegment] = useState(currentBusiness?.segment || 'Serviços')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [generalFeedback, setGeneralFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (currentSite) {
      setSiteName(currentSite.name || currentBusiness?.name || '')
      setSiteDomain(currentSite.domain || currentBusiness?.website_url || '')
    }
  }, [currentSite?.id])

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentSite) {
      currentSite.name = siteName
      currentSite.domain = siteDomain
      if (currentBusiness) {
        currentBusiness.name = siteName
        currentBusiness.website_url = siteDomain
        currentBusiness.segment = segment
      }
      try {
        const prevB = JSON.parse(localStorage.getItem('analizi-custom-businesses') || '[]') as BusinessItem[]
        const updatedB = prevB.map(b => b.id === currentBusiness?.id ? { ...b, name: siteName, website_url: siteDomain, segment } : b)
        localStorage.setItem('analizi-custom-businesses', JSON.stringify(updatedB))

        const prevS = JSON.parse(localStorage.getItem('analizi-custom-sites') || '[]') as SiteItem[]
        const updatedS = prevS.map(s => s.id === currentSite.id ? { ...s, name: siteName, domain: siteDomain } : s)
        localStorage.setItem('analizi-custom-sites', JSON.stringify(updatedS))
      } catch {}
      setGeneralFeedback('Configurações do site salvas com sucesso!')
      setTimeout(() => setGeneralFeedback(null), 4000)
    }
  }

  // Rastreador
  const siteId = currentSite?.tracker_site_id || ''
  const snippet = siteId ? `<script async src="https://analizi.carvalhopaula1990.workers.dev/izi.js" data-site="${siteId}"></script>` : ''
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ received?: boolean; lastEventAt?: string | null } | null>(null)

  const handleCopySnippet = () => {
    if (!snippet) return
    void navigator.clipboard.writeText(snippet)
    setCopiedSnippet(true)
    setTimeout(() => setCopiedSnippet(false), 3000)
  }

  const handleTestConnection = async () => {
    if (!siteId) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites/${siteId}/status`)
      if (res.ok) {
        const status = await res.json() as { received?: boolean; lastEventAt?: string | null }
        setTestResult(status)
      } else {
        setTestResult({ received: false })
      }
    } catch {
      setTestResult({ received: false })
    } finally {
      setIsTesting(false)
    }
  }

  // Equipe & Membros
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Administrador Principal', email: 'contato@analizi.com.br', role: 'owner', date: 'Proprietário da conta' },
    { id: '2', name: 'Equipe de Tráfego', email: 'trafego@empresa.com.br', role: 'admin', date: 'Adicionado há 10 dias' }
  ])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'admin'>('viewer')
  const [teamFeedback, setTeamFeedback] = useState<string | null>(null)

  const handleInviteTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return
    setTeamMembers(prev => [
      ...prev,
      {
        id: String(Date.now()),
        name: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        date: 'Convite enviado agora'
      }
    ])
    setTeamFeedback(`Convite enviado com sucesso para ${inviteEmail}!`)
    setInviteEmail('')
    setTimeout(() => setTeamFeedback(null), 4000)
  }

  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id))
    setTeamFeedback('Acesso do membro revogado.')
    setTimeout(() => setTeamFeedback(null), 3000)
  }

  // Notificações
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [anomalyAlert, setAnomalyAlert] = useState(true)
  const [notifEmail, setNotifEmail] = useState('contato@empresa.com.br')
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null)

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    setNotifFeedback('Preferências de relatórios e alertas salvas com sucesso!')
    setTimeout(() => setNotifFeedback(null), 4000)
  }

  return (
    <div className="settings-hub">
      <PageHeader
        title="Configurações"
        subtitle={`Gerencie preferências, código de rastreamento, acessos e plano do site ${currentSite?.name || 'ativo'}.`}
      />

      {/* Barra de Abas de Navegação Interna */}
      <div className="settings-tab-bar">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Globe size={16} /> Meu Site & Geral
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          <Compass size={16} /> Rastreador & Código
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          <Link2 size={16} /> Fontes de Dados
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          <Crown size={16} /> Plano & Assinatura
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <Users size={16} /> Equipe & Acessos
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Calendar size={16} /> Relatórios & Alertas
        </button>
      </div>

      {/* ABA 1: GERAL */}
      {activeTab === 'general' && (
        <section className="settings-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0 }}>Informações do Site Ativo</h3>
            <span className="settings-connection-status-pill active">
              ● RASTREADOR ATIVO ({currentSite?.tracker_site_id})
            </span>
          </div>
          <p className="section-desc">Altere o nome exibido, o domínio e as preferências regionais do site selecionado.</p>

          {generalFeedback && (
            <div className="settings-feedback-banner">
              <CircleCheck size={16} /> {generalFeedback}
            </div>
          )}

          <form onSubmit={handleSaveGeneral}>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Nome do Site ou Projeto</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Ex.: Meu E-commerce Principal"
                />
              </div>

              <div className="settings-field">
                <label>Endereço / Domínio do Site</label>
                <input
                  type="text"
                  required
                  value={siteDomain}
                  onChange={(e) => setSiteDomain(e.target.value)}
                  placeholder="Ex.: meusite.com.br"
                />
              </div>

              <div className="settings-field">
                <label>Segmento de Atuação</label>
                <select value={segment} onChange={(e) => setSegment(e.target.value)}>
                  <option value="Serviços">Prestação de Serviços / B2B</option>
                  <option value="Produtos">Produtos / E-commerce / Varejo</option>
                  <option value="Saúde">Saúde, Clínicas e Bem-estar</option>
                  <option value="Tecnologia">Tecnologia, SaaS e Startups</option>
                  <option value="Educação">Educação, Cursos e Treinamentos</option>
                </select>
              </div>

              <div className="settings-field">
                <label>Fuso Horário Padrão</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option value="America/Sao_Paulo">Horário de Brasília (GMT-3)</option>
                  <option value="America/Manaus">Horário de Manaus (GMT-4)</option>
                  <option value="America/Belem">Horário de Belém (GMT-3)</option>
                  <option value="UTC">UTC (Universal Time)</option>
                </select>
              </div>
            </div>

            <div className="settings-actions">
              <Button type="submit">
                <Check size={16} /> Salvar Alterações
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* ABA 2: RASTREADOR & CÓDIGO */}
      {activeTab === 'tracker' && (
        <section className="settings-section-card">
          <h3>Código de Instalação do Rastreador</h3>
          <p className="section-desc">
            Instale o script oficial do Analizi no cabeçalho (antes da tag <code>&lt;/head&gt;</code>) do seu site para coletar visitas, cliques em botões, WhatsApp e profundidade de rolagem.
          </p>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)' }}>IDENTIFICADOR ÚNICO DO SITE:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <code style={{ fontSize: 14, fontWeight: 800, color: '#ff3cac', background: 'rgba(255, 60, 172, 0.1)', padding: '4px 10px', borderRadius: 6 }}>
                {siteId || 'Nenhum site configurado'}
              </code>
            </div>
          </div>

          <div className="settings-code-box">
            <code>{snippet || 'Carregando script de rastreamento...'}</code>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopySnippet}
              disabled={!snippet}
              style={{ flexShrink: 0 }}
            >
              <Copy size={15} /> {copiedSnippet ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 18 }}>
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={!siteId || isTesting}
            >
              <RefreshCw size={15} className={isTesting ? 'spin' : ''} />
              {isTesting ? 'Verificando eventos...' : 'Testar Conexão em Tempo Real'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setPage('tracker-setup')}
            >
              Ver tutorial passo a passo por CMS <ArrowRight size={15} />
            </Button>
          </div>

          {testResult && (
            <div
              className="settings-feedback-banner"
              style={{
                marginTop: 18,
                background: testResult.received ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                borderColor: testResult.received ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                color: testResult.received ? '#059669' : '#D97706'
              }}
            >
              {testResult.received ? (
                <>
                  <CircleCheck size={18} />
                  <span>
                    <b>Conexão Ativa!</b> O Analizi confirmou o recebimento de eventos recentes do seu domínio.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} />
                  <span>
                    <b>Aguardando eventos:</b> Publique o código no seu site, abra a página em outra aba e clique novamente em Testar.
                  </span>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* ABA 3: FONTES DE DADOS */}
      {activeTab === 'sources' && (
        <section className="settings-section-card">
          <h3>Fontes de Dados Conectadas</h3>
          <p className="section-desc">Acompanhe as integrações ativas de coleta de dados do seu site.</p>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <article style={{ background: 'var(--surface-subtle, #F9FAFB)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
                  <BrandLogo compact /> Rastreador Analizi
                </span>
                <span className="settings-connection-status-pill active">Ativo</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                Script nativo ultra rápido (&lt; 2 KB). Rastreia visualizações, cliques de WhatsApp, chamadas, rolagem e métricas Core Web Vitals.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={() => setPage('tracker-setup')}>
                  Ver Código & Guias
                </Button>
                <Button variant="ghost" onClick={handleTestConnection}>
                  Testar Status
                </Button>
              </div>
            </article>

            <article style={{ background: 'var(--surface-subtle, #F9FAFB)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
                  <Globe2 size={20} style={{ color: '#F59E0B' }} /> Google Analytics 4
                </span>
                <span className="settings-connection-status-pill pending">Opcional</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                Conecte sua propriedade do Google Analytics 4 para sincronizar dados históricos e visitas registradas pelo GA4.
              </p>
              <Button onClick={() => setPage('ga4-setup')}>
                Conectar Google Analytics <ArrowRight size={15} />
              </Button>
            </article>
          </div>
        </section>
      )}

      {/* ABA 4: PLANO & ASSINATURA */}
      {activeTab === 'plan' && (
        <section className="settings-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0 }}>Plano Atual: {effectivePlan.name}</h3>
            <span style={{ background: 'rgba(255, 60, 172, 0.12)', color: '#ff3cac', border: '1px solid rgba(255, 60, 172, 0.3)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
              {effectivePlan.priceLabel}
            </span>
          </div>
          <p className="section-desc">{effectivePlan.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, margin: '20px 0' }}>
            <div style={{ background: 'var(--surface-subtle, #F9FAFB)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700 }}>SITES CADASTRADOS</span>
              <h2 style={{ margin: '6px 0 2px', fontSize: 24, fontWeight: 800 }}>
                {totalSitesCount} / {effectivePlan.id === 'admin' ? 'Ilimitados' : effectivePlan.maxSites}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Limite de sites ativos simultaneamente.</p>
            </div>

            <div style={{ background: 'var(--surface-subtle, #F9FAFB)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700 }}>STATUS DA ASSINATURA</span>
              <h2 style={{ margin: '6px 0 2px', fontSize: 24, fontWeight: 800, color: '#059669' }}>
                Ativa e Regular
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Todos os recursos e métricas desbloqueados.</p>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
              RECURSOS INCLUSOS NO SEU PLANO:
            </span>
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {effectivePlan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--foreground)' }}>
                  <CircleCheck size={16} style={{ color: '#059669', flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button type="button" onClick={() => setNewSiteModalOpen(true)}>
              <Plus size={16} /> Cadastrar Novo Site
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPage('team')}>
              Gerenciar Membros & Permissões
            </Button>
          </div>
        </section>
      )}

      {/* ABA 5: EQUIPE & ACESSOS */}
      {activeTab === 'team' && (
        <section className="settings-section-card">
          <h3>Pessoas e Permissões de Acesso</h3>
          <p className="section-desc">Gerencie quem pode visualizar ou administrar os dados deste site no Analizi.</p>

          {teamFeedback && (
            <div className="settings-feedback-banner">
              <CircleCheck size={16} /> {teamFeedback}
            </div>
          )}

          {/* Lista de Membros */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {teamMembers.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--surface-subtle, #F9FAFB)',
                  border: '1px solid var(--border)',
                  borderRadius: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <b style={{ fontSize: 13, display: 'block', color: 'var(--foreground)' }}>{m.name}</b>
                    <small style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{m.email} · {m.date}</small>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, background: m.role === 'owner' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: m.role === 'owner' ? '#2563EB' : '#059669', padding: '3px 8px', borderRadius: 6 }}>
                    {m.role === 'owner' ? 'Proprietário' : m.role === 'admin' ? 'Administrador' : 'Visualizador'}
                  </span>
                  {m.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      style={{ background: 'transparent', border: 0, color: '#EF4444', cursor: 'pointer', padding: 4 }}
                      title="Revogar acesso"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Convidar nova pessoa */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 750, margin: '0 0 6px' }}>Convidar novo membro</h4>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 14px' }}>
              O convidado receberá acesso aos painéis de relatórios deste site.
            </p>

            <form onSubmit={handleInviteTeam} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="email"
                required
                placeholder="email@empresa.com.br"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ flex: 1, minWidth: 220, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'admin')}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
              >
                <option value="viewer">Visualizador (Somente Leitura)</option>
                <option value="admin">Administrador (Acesso Total)</option>
              </select>
              <Button type="submit">
                <UserPlus size={16} /> Convidar Membro
              </Button>
            </form>
          </div>
        </section>
      )}

      {/* ABA 6: NOTIFICAÇÕES & RELATÓRIOS */}
      {activeTab === 'notifications' && (
        <section className="settings-section-card">
          <h3>Relatório Semanal & Alertas Automáticos</h3>
          <p className="section-desc">Defina como e quando você deseja ser notificado sobre as métricas do seu site.</p>

          {notifFeedback && (
            <div className="settings-feedback-banner">
              <CircleCheck size={16} /> {notifFeedback}
            </div>
          )}

          <form onSubmit={handleSaveNotifications}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 600 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, background: 'var(--surface-subtle, #F9FAFB)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <input
                  type="checkbox"
                  id="weekly-check"
                  checked={weeklyReport}
                  onChange={(e) => setWeeklyReport(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <label htmlFor="weekly-check" style={{ cursor: 'pointer' }}>
                  <b style={{ fontSize: 13, display: 'block', color: 'var(--foreground)' }}>Relatório Semanal Consolidado</b>
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    Receba toda segunda-feira às 08h um resumo com visitantes, páginas mais acessadas e contatos pelo WhatsApp.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, background: 'var(--surface-subtle, #F9FAFB)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <input
                  type="checkbox"
                  id="anomaly-check"
                  checked={anomalyAlert}
                  onChange={(e) => setAnomalyAlert(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <label htmlFor="anomaly-check" style={{ cursor: 'pointer' }}>
                  <b style={{ fontSize: 13, display: 'block', color: 'var(--foreground)' }}>Alertas de Picos ou Queda de Tráfego</b>
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    Notificação imediata caso o site registre aumento anormal de taxa de saída ou perda de conexão.
                  </span>
                </label>
              </div>

              <div className="settings-field">
                <label>E-mail Destinatário dos Relatórios</label>
                <input
                  type="email"
                  required
                  value={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="settings-actions">
              <Button type="submit">
                <Check size={16} /> Salvar Preferências
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

function SourceHeader({
  title,
  subtitle,
  setPage,
  eyebrow,
  icon: Icon,
  iconColor
}: {
  title: string;
  subtitle: string;
  setPage: (page: Page) => void;
  eyebrow?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  iconColor?: string;
}) {
  return (
    <header className="source-header" style={{ marginBottom: 24 }}>
      <button className="back-link" onClick={() => setPage('settings')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <ArrowLeft size={16}/> Voltar para Configurações
      </button>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon && <Icon size={26} style={iconColor ? { color: iconColor } : undefined} />}
          {title}
        </h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </header>
  );
}

function DataSources({ setPage }: { setPage: (page: Page) => void }) {
  const { currentSite, refreshBusinesses } = useBusiness();
  const [ga4Connected, setGa4Connected] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!supabase || !currentSite) return;
    void supabase.from('data_sources').select('kind,status').eq('site_id', currentSite.id).then(({ data }) => {
      setGa4Connected(Boolean(data?.some(item => item.kind === 'ga4' && item.status === 'connected')));
    });
  }, [currentSite?.id]);
  const chooseSource = async (source: 'tracker' | 'ga4') => {
    if (!supabase || !currentSite || (source === 'ga4' && !ga4Connected)) return;
    setUpdating(true); setMessage('');
    const { error } = await supabase.from('sites').update({ analytics_source: source }).eq('id', currentSite.id);
    if (error) setMessage(error.message);
    else { await refreshBusinesses(); setMessage(`Os painéis agora usam ${source === 'ga4' ? 'Google Analytics 4' : 'Rastreador Analizi'}.`); }
    setUpdating(false);
  };
  return (
    <>
      <SourceHeader
        eyebrow="INTEGRAÇÕES DE DADOS"
        icon={Link2}
        iconColor="#2563EB"
        title="Fontes de Dados"
        subtitle="Escolha de onde o Analizi vai receber os eventos e métricas do seu site."
        setPage={setPage}
      />
      <section className="source-note" style={{ marginBottom: 20 }}>
        <ShieldCheck size={21}/>
        <div>
          <b>Fonte usada nos painéis</b>
          <p>Escolha qual fonte deve alimentar os números do site selecionado. O rastreador pode continuar instalado para heatmap e cliques, mesmo com GA4 selecionado.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <Button variant={currentSite?.analytics_source !== 'ga4' ? 'primary' : 'secondary'} disabled={updating} onClick={() => void chooseSource('tracker')}>Usar Rastreador Analizi</Button>
            <Button variant={currentSite?.analytics_source === 'ga4' ? 'primary' : 'secondary'} disabled={updating || !ga4Connected} onClick={() => void chooseSource('ga4')}>Usar Google Analytics 4{!ga4Connected ? ' (conecte primeiro)' : ''}</Button>
          </div>
          {message && <p style={{ marginTop: 10, color: message.includes('agora usam') ? '#087f5b' : '#b42318' }}>{message}</p>}
        </div>
      </section>
      <section className="source-options">
        <article className="source-config-card">
          <div className="source-card-heading">
            <span className="source-icon"><BrandLogo compact /></span>
            <div>
              <span className="eyebrow">RECOMENDADO · NATIVO</span>
              <h2>Rastreador Analizi</h2>
              <p>Comece uma coleta nova, focada no seu negócio e sem cookies intrusivos.</p>
            </div>
          </div>
          <ul>
            <li><Check size={16}/>Script leve (&lt; 2 KB), compatível com qualquer site</li>
            <li><Check size={16}/>Captura automática de WhatsApp, cliques e rolagem</li>
            <li><Check size={16}/>Privacidade total conforme LGPD/GDPR</li>
          </ul>
          <Button onClick={() => setPage('tracker-setup')}>Ver código de instalação <ArrowRight size={17}/></Button>
        </article>

        <article className="source-config-card">
          <div className="source-card-heading">
            <span className="source-icon ga">G</span>
            <div>
              <span className="eyebrow">GOOGLE ANALYTICS 4</span>
              <h2>Conectar propriedade existente</h2>
              <p>Traga os dados que você já acompanha no Google Analytics.</p>
            </div>
          </div>
          <ul>
            <li><Check size={16}/>Importa histórico disponível de sessões e acessos</li>
            <li><Check size={16}/>Leitura segura, sem alterar sua conta Google</li>
          </ul>
          <Button variant="secondary" onClick={() => setPage('ga4-setup')}>{ga4Connected ? 'Gerenciar Google Analytics' : 'Configurar Google Analytics'} <ArrowRight size={17}/></Button>
        </article>
      </section>
      <article className="source-note">
        <ShieldCheck size={21}/>
        <div>
          <b>Você pode manter o rastreador ativo como fonte principal.</b>
          <p>Isso garante que cliques comerciais e mapa de calor continuem gravando perfeitamente.</p>
        </div>
      </article>
    </>
  );
}
function GA4Setup({ setPage }: { setPage: (page: Page) => void }) {
  const { currentSite } = useBusiness();
  const [properties, setProperties] = useState<Array<{ id: string, name: string, accountName: string }>>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const providerToken = () => sessionStorage.getItem('analizi-ga4-provider-token') || '';
  const providerRefreshToken = () => sessionStorage.getItem('analizi-ga4-provider-refresh-token') || '';

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
      const payload = await response.json() as { properties?: Array<{ id: string, name: string, accountName: string }>, error?: string };
      if (!response.ok) throw new Error(payload.error || 'Não foi possível listar suas propriedades.');
      setProperties(payload.properties || []);
      if (payload.properties?.length === 1) setSelectedProperty(payload.properties[0].id);
      if (!payload.properties?.length) setMessage('Nenhuma propriedade GA4 disponível nesta conta Google.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível listar suas propriedades.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadProperties(); }, []);

  const authorize = async () => {
    if (!supabase) return;
    setLoading(true); setMessage('');
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
    if (!currentSite || !selectedProperty || !supabase) return;
    const refreshToken = providerRefreshToken();
    if (!refreshToken) { setMessage('Autorize novamente para conceder acesso contínuo ao GA4.'); return; }
    setLoading(true); setMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://analizi.carvalhopaula1990.workers.dev/v1/ga4/connect', {
        method: 'POST', headers: await authorizationHeaders(), body: JSON.stringify({
          siteId: currentSite.id, trackerSiteId: currentSite.tracker_site_id, businessId: currentSite.business_id, propertyId: selectedProperty, refreshToken, googleUserId: session?.user.id
        })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a conexão.');
      const property = properties.find(item => item.id === selectedProperty);
      const { error } = await supabase.from('data_sources').upsert({
        site_id: currentSite.id, kind: 'ga4', status: 'connected', ga4_property_id: selectedProperty,
        ga4_property_name: property?.name || null, ga4_connected_google_email: session?.user.email || null,
        connected_at: new Date().toISOString(), last_synced_at: new Date().toISOString(), last_error: null
      }, { onConflict: 'site_id,kind' });
      if (error) throw new Error(error.message);
      sessionStorage.removeItem('analizi-ga4-provider-token');
      sessionStorage.removeItem('analizi-ga4-provider-refresh-token');
      setMessage('Google Analytics conectado com sucesso. A sincronização inicial será iniciada em seguida.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a conexão.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <SourceHeader
        eyebrow="CONFIGURAÇÃO GOOGLE"
        icon={Globe2}
        iconColor="#f59e0b"
        title="Conectar Google Analytics"
        subtitle="Em poucos passos, vamos encontrar os dados do seu site."
        setPage={setPage}
      />
      <section className="setup-layout">
        <article className="setup-card">
          <div className="step-label">{properties.length ? 'PASSO 2 DE 3' : 'PASSO 1 DE 3'}</div>
          <span className="source-icon ga large">G</span>
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
              <Button className="full" onClick={() => void connect()} disabled={loading || !selectedProperty} style={{ marginTop: 16 }}>Conectar propriedade</Button>
            </>
          )}
          {message && <p className="setup-help" style={{ color: message.includes('sucesso') ? '#087f5b' : undefined }}>{message}</p>}
        </article>
        <aside className="setup-sidebar">
          <span className="eyebrow">O QUE VEM DEPOIS</span>
          <ol>
            <li className={!properties.length ? 'current' : ''}><i>1</i><span><b>Conectar sua conta</b><small>Autorize a leitura dos dados</small></span></li>
            <li className={properties.length ? 'current' : ''}><i>2</i><span><b>Escolher a propriedade</b><small>Encontre o seu site na lista</small></span></li>
            <li><i>3</i><span><b>Validar conexão</b><small>Confirmaremos que está tudo certo</small></span></li>
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

function TrackerSetup({ setPage }: { setPage: (page: Page) => void }) {
  const { currentSite } = useBusiness();
  const siteId = currentSite?.tracker_site_id || '';
  const domain = currentSite?.domain || '';
  const [open, setOpen] = useState('html');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  useEffect(() => {
    const init = async () => {
      if (!siteId || !domain) return;
      await fetch('https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ trackerSiteId: siteId, domain })
      }).catch(() => {});
    };
    void init();
  }, [siteId, domain]);
  const testInstallation = async () => {
    if (!siteId) return;
    setTesting(true);
    setTestResult('Verificando se o seu site enviou um evento...');
    try {
      const response = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/tracker-sites/${siteId}/status`);
      const status = await response.json() as { received?: boolean; lastEventAt?: string | null };
      if (status.received) {
        setTestResult('Instalação confirmada. Recebemos um evento do seu site.');
        if (supabase && currentSite?.id) {
          const nowIso = new Date().toISOString();
          void supabase.from('data_sources').update({
            status: 'connected',
            connected_at: nowIso,
            last_synced_at: status.lastEventAt || nowIso
          }).eq('site_id', currentSite.id);
        }
      } else {
        setTestResult(`Ainda não recebemos um evento de ${domain || 'seu site'}. Publique o código, abra o site em outra aba e tente novamente.`);
      }
    } catch {
      setTestResult('Não foi possível verificar agora. Tente novamente em alguns instantes.');
    } finally {
      setTesting(false);
    }
  };
  const snippet = siteId ? `<script async src="https://analizi.carvalhopaula1990.workers.dev/izi.js" data-site="${siteId}"></script>` : '';
  const guides = {
    html: ['Sites próprios em HTML', 'Abra o arquivo que contém a tag <head> do seu site.', 'Cole o código logo antes de </head>.', 'Publique a alteração no seu servidor.'],
    wordpress: ['WordPress', 'Instale um plugin de inserção de código no cabeçalho.', 'Abra a área Header / Cabeçalho do plugin.', 'Cole o código e salve.'],
    wix: ['Wix', 'Abra Configurações → Avançado → Código personalizado.', 'Escolha Cabeçalho e todas as páginas.', 'Cole o código, salve e publique.'],
    shopify: ['Shopify', 'Abra Temas → Editar código e o arquivo layout/theme.liquid.', 'Cole o código antes de </head>.', 'Salve a alteração.'],
    squarespace: ['Squarespace', 'Abra Configurações → Avançado → Injeção de código.', 'Cole o código no campo Header.', 'Salve as alterações.'],
    other: ['Outra plataforma', 'Procure por código personalizado, cabeçalho ou scripts.', 'Cole o código antes de </head>.', 'Peça ajuda à plataforma, se necessário.']
  } as const;
  return <>
    <SourceHeader
      eyebrow="INSTALAÇÃO RÁPIDA"
      icon={Compass}
      iconColor="#10b981"
      title="Instalar o Rastreador Analizi"
      subtitle="Meça visitas e ações importantes no seu site sem coletar conteúdo de formulários."
      setPage={setPage}
    />
    <section className="setup-layout">
      <article className="setup-card tracker-card">
        <div className="step-label">PASSO 1 DE 2</div>
        <span className="source-icon large"><BrandLogo compact /></span>
        <h2>Instale o código do Analizi</h2>
        <p>Copie este código para o cabeçalho do seu site.</p>
        <div className="account-id">
          <span>IDENTIFICAÇÃO DA SUA CONTA ANALIZI</span>
          <code>{siteId || 'Carregando identificação...'}</code>
          <small>Esta identificação liga as métricas ao seu negócio ({currentSite?.name || domain || 'Seu site'}).</small>
        </div>
        <div className="code-block">
          <code>{snippet || 'Carregando código de instalação...'}</code>
          <button aria-label="Copiar código" disabled={!snippet} onClick={() => { void navigator.clipboard.writeText(snippet); setCopied(true) }}><Copy size={17}/></button>
        </div>
        {copied && <p className="form-feedback">Código copiado.</p>}
        <h3>Passo a passo por plataforma</h3>
        <div className="install-accordion">
          {Object.entries(guides).map(([key, [title, ...steps]]) => (
            <div key={key}>
              <button type="button" onClick={() => setOpen(open === key ? '' : key)}>{title}<ChevronDown size={17}/></button>
              {open === key && <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol>}
            </div>
          ))}
        </div>
        <Button className="full" onClick={testInstallation} disabled={!siteId || testing}>{testing ? 'Testando instalação...' : 'Testar instalação'} <ArrowRight size={17}/></Button>
        {testResult && <p className="form-feedback">{testResult}</p>}
        <Button variant="ghost" className="full" onClick={() => setPage('dashboard')}>Continuar e configurar depois</Button>
      </article>
      <aside className="setup-sidebar">
        <span className="eyebrow">PRECISA DE AJUDA?</span>
        <div className="install-help"><Globe2 size={20}/><div><b>Ficou com dúvida?</b><small>Fale com nosso suporte.</small></div></div>
        <a className="support-link" href="mailto:suporte@analizi.com.br">suporte@analizi.com.br</a>
        <p className="setup-help">Depois de publicar o código, abra o seu site em outra aba e clique em testar.</p>
        <Button variant="ghost" onClick={() => setPage('settings')}>Voltar para Configurações</Button>
      </aside>
    </section>
  </>;
}

function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon: Icon,
  iconColor
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  iconColor?: string;
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
    'Configurações': { eyebrow: 'PREFERÊNCIAS DO SISTEMA', icon: SettingsIcon, iconColor: '#8b5cf6' },
    'Fontes de dados': { eyebrow: 'INTEGRAÇÕES E CONEXÕES', icon: Link2, iconColor: '#3b82f6' },
    'Heatmap & Comportamento': { eyebrow: 'COMPORTAMENTO VISUAL', icon: Flame, iconColor: '#f97316' },
    'Heatmap e Rolagem': { eyebrow: 'COMPORTAMENTO VISUAL', icon: Flame, iconColor: '#f97316' },
  };

  const meta = defaultMeta[title];
  const resolvedEyebrow = eyebrow ?? meta?.eyebrow;
  const ResolvedIcon = Icon ?? meta?.icon;
  const resolvedIconColor = iconColor ?? meta?.iconColor;

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

export function App() {
  const [mode, setMode] = useState<AuthPage>(() => {
    if (window.location.pathname === '/entrar') return 'login';
    // Se há cliente supabase configurado, inicia em 'loading' para verificar a sessão salva sem piscar a Landing
    return supabase ? 'loading' : 'landing';
  });
  const [page, setPage] = useState<Page>(() => pageFromPath());
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
          // O aceite faz parte apenas do cadastro de um novo usuário.
          const { data: consents, error: consentError } = await client
            .from('user_consents')
            .select('consent_key')
            .eq('version', CONSENT_VERSION)
            .in('consent_key', ['service_terms', 'site_data_processing']);

          if (!consentError && (consents?.length ?? 0) < 2) setMode('consent');
          else setMode('onboarding-business');
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
        setMode={(next) => setMode(next)}
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
    insights: <Insights/>,
    settings: <Settings setPage={setPage}/>,
    team: <TeamSettings setPage={setPage}/>,
    'data-sources': <DataSources setPage={setPage}/>,
    'ga4-setup': <GA4Setup setPage={setPage}/>,
    'tracker-setup': <TrackerSetup setPage={setPage}/>
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
