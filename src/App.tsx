import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, ArrowRight, BarChart3, Check, ChevronDown, CircleCheck, AlertTriangle, Compass, FileText, Flame, Lightbulb, Copy, ExternalLink, Globe2, Info, Link2, MoreHorizontal, MousePointerClick, Settings as SettingsIcon, ShieldCheck, Sparkles, Target, Users } from 'lucide-react'
import { AppShell, type Page } from './components/AppShell'
import { BrandLogo } from './components/BrandLogo'
import { MetricCard } from './components/Metrics'
import { Button } from './components/ui/Button'
import { AuthFlow, CONSENT_VERSION, type AuthFlowMode } from './components/AuthFlow'
import { supabase } from './lib/supabase'
import { BusinessProvider, useBusiness } from './lib/business-context'

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
                  <p>Identifica os conteúdos que geram mais tração e revela quais páginas merecem botões de ação e conversão.</p>
                </div>
                <div className="metric-tooltip-section tip">
                  <b>💡 Como melhorar:</b>
                  <p>Se as páginas do topo tiverem pouca conversão, adicione chamadas para WhatsApp ou formulários curtos nelas.</p>
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
                  <b>💡 Como melhorar:</b>
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
                  <b>💡 Como melhorar:</b>
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
    </article>
  );
}

function Dashboard() { const analytics = useAnalytics(); const [dailyPage, setDailyPage] = useState(0); const t = analytics?.totals; const p = analytics?.previousTotals; const daily = analytics?.daily ?? []; const visibleDays = daily.slice(dailyPage * ITEMS_PER_PAGE, (dailyPage + 1) * ITEMS_PER_PAGE); const attention = t?.attentionSeconds ? `${Math.floor(t.attentionSeconds / 60)}min ${t.attentionSeconds % 60}s` : '—'; const badge = analytics?.sourceKind === 'ga4' ? 'GA4' : 'RASTREADOR ANALIZI'; return <><PageHeader title="Visão geral" subtitle={`Veja como seu site foi nos últimos ${analytics?.periodDays ?? selectedDays()} dias.`} /><AnalyticsFilters analytics={analytics}/><div className="period"><span className="source-badge"><span className="source-badge-dot" />{badge}</span></div><section className="metrics"><MetricCard title="Visualizações de páginas" value={String(t?.pageViews ?? '—')} {...comparison(t?.pageViews, p?.pageViews)} /><MetricCard title="Usuários" value={String(t?.users ?? '—')} {...comparison(t?.users, p?.users)} /><MetricCard title="Tempo de atenção" value={attention} note="média por visita" /><MetricCard title="Contatos iniciados" value={String(t?.contacts ?? '—')} {...comparison(t?.contacts, p?.contacts)} /><MetricCard title="Novos usuários" value={String(t?.newUsers ?? '—')} {...comparison(t?.newUsers, p?.newUsers)} /></section><div className="dashboard-split"><MetricChart analytics={analytics} /><article className="table-card compact-table daily-table"><div className="section-heading"><div><h3>Métricas por dia</h3><p>Atividade diária</p></div></div><div className="daily-head"><span>Data</span><span>Visualizações de páginas</span><span>Usuários</span><span>Contatos</span></div>{visibleDays.map(day => <div className="daily-row" key={day.date}><span><b>{day.date.slice(5).split('-').reverse().join('/')}</b></span><span>{day.pageViews}</span><span>{day.users}</span><span>{day.contacts}</span></div>)}{!daily.length && <p className="empty-state">Ainda não recebemos acessos neste período.</p>}<TablePagination page={dailyPage} total={daily.length} setPage={setDailyPage}/></article></div></> }

function Audience() {
  const analytics = useAnalytics();
  const [sourcePage, setSourcePage] = useState(0);
  const sourcePages = analytics?.sourcePages ?? [];
  const p = analytics?.previousTotals;
  const visibleSources = sourcePages.slice(sourcePage * ITEMS_PER_PAGE, (sourcePage + 1) * ITEMS_PER_PAGE);
  const topSource = analytics?.sources?.[0];
  const topShare = analytics?.totals?.pageViews && topSource ? `${Math.round((Number(topSource.value) / Number(analytics.totals.pageViews)) * 100)}%` : '—';

  return (
    <>
      <PageHeader title="Seu público" subtitle="Entenda de onde vêm as pessoas que chegam ao seu site." />
      <AnalyticsFilters analytics={analytics}/>
      <section className="metrics">
        <MetricCard title="Sessões" value={String(analytics?.totals.sessions ?? '—')} {...comparison(analytics?.totals.sessions, p?.sessions)} />
        <MetricCard title="Usuários" value={String(analytics?.totals.users ?? '—')} {...comparison(analytics?.totals.users, p?.users)} />
        <MetricCard title="Novos usuários" value={String(analytics?.totals.newUsers ?? '—')} {...comparison(analytics?.totals.newUsers, p?.newUsers)} />
        <MetricCard title="Origem principal" value={topSource?.name ? normalizeOriginName(topSource.name) : '—'} note={topSource ? `${topShare} do tráfego` : 'sem dados'} />
      </section>
      <div className="audience-split">
        <OriginChart analytics={analytics}/>
        <article className="table-card compact-table source-pages-table">
          <div className="section-heading">
            <div>
              <h3>Origem por página</h3>
              <p>Onde o tráfego de cada canal desembarcou</p>
            </div>
          </div>
          <div className="source-pages-head">
            <span>Canal</span>
            <span>Página de destino</span>
            <span>Visualizações de páginas</span>
            <span>Usuários</span>
          </div>
          {visibleSources.map(item => (
            <div className="source-pages-row" key={`${item.source}-${item.path}`}>
              <span><b>{normalizeOriginName(item.source)}</b></span>
              <span>{item.path}</span>
              <span>{item.views}</span>
              <span>{item.users}</span>
            </div>
          ))}
          {!sourcePages.length && <p className="empty-state">Ainda não recebemos dados de origens de tráfego.</p>}
          <TablePagination page={sourcePage} total={sourcePages.length} setPage={setSourcePage}/>
        </article>
      </div>
    </>
  );
}
function isLeadClick(item: { intent?: string, isContactLead?: number, label: string, destination?: string }): boolean {
  if (item.isContactLead === 1) return true;
  if (item.intent && item.intent !== 'geral' && item.intent !== 'outro') return true;
  const href = item.destination || '';
  if (/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|^tel:|^mailto:)/i.test(href)) return true;
  const label = item.label || '';
  return /\b(fale\s*(com|conosco)|entre\s*em\s*contato|contato|whats(?:app)?|agend[ea]|marc[ae]\s*(uma\s*)?(consulta|reuni[aã]o)|solicite|pedir|pe[cç]a\s*(um\s*)?or[cç]amento|or[cç]amento|quero\s*(saber|agendar|falar|receber)|ligue|telefone|enviar\s*(mensagem|formul[aá]rio)|tirar\s*d[uú]vidas|falar\s*com\s*(um\s*)?(especialista|consultor)|come[cç]ar\s*agora|teste\s*(gr[aá]tis)?|cadastre-se|inscreva-se)\b/i.test(label);
}

function Results() {
  const analytics = useAnalytics();
  const [contactPage, setContactPage] = useState(0);
  const [leadClickPage, setLeadClickPage] = useState(0);
  const [generalClickPage, setGeneralClickPage] = useState(0);
  const t = analytics?.totals;
  const p = analytics?.previousTotals;
  const contactDetails = analytics?.contactDetails ?? [];
  const allClicks = analytics?.clickDetails ?? [];
  const leadClicks = allClicks.filter(item => isLeadClick(item));
  const generalClicks = allClicks.filter(item => !isLeadClick(item));

  const visibleContacts = contactDetails.slice(contactPage * ITEMS_PER_PAGE, (contactPage + 1) * ITEMS_PER_PAGE);
  const visibleLeadClicks = leadClicks.slice(leadClickPage * ITEMS_PER_PAGE, (leadClickPage + 1) * ITEMS_PER_PAGE);
  const visibleGeneralClicks = generalClicks.slice(generalClickPage * ITEMS_PER_PAGE, (generalClickPage + 1) * ITEMS_PER_PAGE);
  const contactRate = t?.sessions ? `${((Number(t.contactSessions || 0) / Number(t.sessions)) * 100).toFixed(1).replace('.', ',')}%` : '—';

  return (
    <>
      <PageHeader title="Resultados" subtitle="Acompanhe as oportunidades e contatos gerados pelo seu site." />
      <AnalyticsFilters analytics={analytics} />
      <section className="metrics">
        <MetricCard title="Contatos iniciados" value={String(t?.contacts ?? '—')} {...comparison(t?.contacts, p?.contacts)} />
        <MetricCard title="WhatsApp" value={String(t?.whatsappContacts ?? '—')} {...comparison(t?.whatsappContacts, p?.whatsappContacts)} />
        <MetricCard title="Cadastros" value={String(t?.signUps ?? '—')} {...comparison(t?.signUps, p?.signUps)} />
        <MetricCard title="Logins" value={String(t?.logins ?? '—')} {...comparison(t?.logins, p?.logins)} />
        <MetricCard title="Taxa de contato" value={contactRate} note="sessões com ação" />
      </section>

      <div className="results-tables">
        <article className="table-card compact-table results-detail-table">
          <div className="section-heading">
            <div>
              <h3>Ações confirmadas</h3>
              <p>Contatos, cadastros e acessos registrados</p>
            </div>
          </div>
          <div className="contact-detail-head">
            <span>Data</span>
            <span>Tipo</span>
            <span>Página</span>
            <span>Total</span>
          </div>
          {visibleContacts.map((item, index) => (
            <div className="contact-detail-row" key={`${item.date}-${item.type}-${item.path}-${index}`}>
              <span><b>{item.date.slice(5).split('-').reverse().join('/')}</b></span>
              <span>{item.type === 'whatsapp_contact' ? 'WhatsApp' : item.type === 'sign_up' ? 'Cadastro' : item.type === 'login' ? 'Login' : item.type}</span>
              <span>{item.path}</span>
              <span>{item.contacts}</span>
            </div>
          ))}
          {!contactDetails.length && <p className="empty-state">Nenhuma ação foi registrada no período.</p>}
          <TablePagination page={contactPage} total={contactDetails.length} setPage={setContactPage} />
        </article>

        <article className="table-card compact-table click-detail-table">
          <div className="section-heading">
            <div>
              <h3>Cliques com intenção de contato</h3>
              <p>Cliques em botões de WhatsApp, telefone e formulários</p>
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
              <span>{item.path}</span>
              <span>{item.destination ? <small title={item.destination} className="click-destination">{item.destination}</small> : '—'}</span>
              <span>{item.clicks}</span>
            </div>
          ))}
          {!leadClicks.length && <p className="empty-state">Nenhum clique de contato foi identificado no período.</p>}
          <TablePagination page={leadClickPage} total={leadClicks.length} setPage={setLeadClickPage} />
        </article>
      </div>

      <article className="table-card general-clicks-table" style={{ marginTop: '24px' }}>
        <div className="section-heading">
          <div>
            <h3>Cliques em botões diversos</h3>
            <p>Todos os cliques capturados em botões e links navegacionais pelo rastreador</p>
          </div>
        </div>
        <div className="general-clicks-head">
          <span>Data</span>
          <span>Texto do botão</span>
          <span>ID do botão</span>
          <span>Destino / Href</span>
          <span>Cliques</span>
        </div>
        {visibleGeneralClicks.map((item, index) => (
          <div className="general-clicks-row" key={`${item.date}-${item.label}-${item.buttonId}-${item.destination}-${index}`}>
            <span><b>{item.date.slice(5).split('-').reverse().join('/')}</b></span>
            <span><b>{item.label}</b></span>
            <span>{item.buttonId ? <small>#{item.buttonId}</small> : '—'}</span>
            <span>{item.destination ? <small title={item.destination} className="click-destination">{item.destination}</small> : '—'}</span>
            <span>{item.clicks}</span>
          </div>
        ))}
        {!generalClicks.length && <p className="empty-state">Nenhum clique em botões diversos foi registrado no período.</p>}
        <TablePagination page={generalClickPage} total={generalClicks.length} setPage={setGeneralClickPage} />
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

function Insights() {
  const analytics = useAnalytics();
  const { currentBusiness, currentSite } = useBusiness();
  const date = new Intl.DateTimeFormat('pt-BR').format(new Date());

  const [insights, setInsights] = useState<GeneratedInsight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [modelLabel, setModelLabel] = useState<string>('IZI INTELLIGENCE');
  const [scopeLabel, setScopeLabel] = useState<string>('semanal');
  const [cachedNotice, setCachedNotice] = useState<boolean>(false);

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
        };
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
          if (data.model) setModelLabel(data.model);
          if (data.scope) setScopeLabel(data.scope);
          setCachedNotice(Boolean(data.cached));
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

  return (
    <>
      <div className="insights-header-bar">
        <PageHeader
          title="Insights & Recomendações"
          subtitle={`Diagnósticos inteligentes consolidados semanalmente para seu site (${scopeLabel}).`}
        />
        <div className="insights-actions">
          <span className="insights-model-badge" title="Inteligência do Analizi">
            <Sparkles size={13} /> {modelLabel || 'IZI INTELLIGENCE'}
          </span>
          <span className="insights-cycle-badge" title="Insights gerados a cada 7 dias às segundas-feiras">
            Ciclo de 7 dias
          </span>
        </div>
      </div>

      {loadingAI && !insights.length ? (
        <section className="insights-loading-state">
          <Sparkles size={28} className="spin" />
          <p>O Analizi está cruzando o comportamento do seu público com o seu segmento...</p>
        </section>
      ) : (
        <section className="insights-list">
          {insights.map((item) => {
            const read = readKeys.includes(item.key || item.title);
            const isPos = item.status === 'positive';
            const isWarn = item.status === 'warning';

            return (
              <article
                className={`insight-row-ai ${item.status} ${read ? 'viewed' : ''}`}
                key={item.key || item.title}
              >
                <div className={`icon-circle ${isWarn ? 'warning' : isPos ? 'positive' : 'neutral'}`}>
                  {isWarn ? (
                    <AlertTriangle size={20} />
                  ) : isPos ? (
                    <CircleCheck size={20} />
                  ) : (
                    <Lightbulb size={20} />
                  )}
                </div>

                <div className="insight-ai-content">
                  <div className="insight-ai-head">
                    <span className="insight-ai-badge">{item.badge}</span>
                    <span className="insight-ai-date">Avaliado em {date}</span>
                  </div>

                  <h3>{item.title}</h3>

                  <div className="insight-ai-block observation">
                    <strong>O que os dados mostram:</strong>
                    <p>{item.finding}</p>
                  </div>

                  <div className="insight-ai-grid">
                    <div className="insight-ai-box action">
                      <span className="box-title">O que fazer agora:</span>
                      <p>{item.action}</p>
                    </div>

                    <div className="insight-ai-box projection">
                      <span className="box-title">Projeção esperada:</span>
                      <p>{item.projection}</p>
                    </div>
                  </div>
                </div>

                <button
                  className="insight-read"
                  onClick={() => toggleRead(item.key || item.title)}
                  title={read ? 'Marcar como não lido' : 'Marcar como resolvido'}
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
interface AnalyticsTotals { pageViews?: number, users?: number, newUsers?: number, sessions?: number, contacts?: number, whatsappContacts?: number, signUps?: number, logins?: number, attentionSeconds?: number, contactSessions?: number }
interface AnalyticsData { totals: AnalyticsTotals, previousTotals?: AnalyticsTotals, sources: Array<{ name: string, value: string | number }>, pages: Array<{ path: string, views: string | number, title?: string, attentionSeconds?: number, exitRate?: number }>, daily: Array<{ date: string, pageViews: number, users: number, contacts: number, sessions?: number }>, sourcePages?: Array<{ source: string, path: string, views: number, users: number }>, contactDetails?: Array<{ date: string, type: string, path: string, contacts: number }>, clickDetails?: Array<{ date: string, path: string, label: string, buttonId?: string, destination?: string, intent?: string, isContactLead?: number, clicks: number, sessions: number }>, filterPages?: Array<{ path: string }>, filterSources?: Array<{ source: string }>, periodDays?: number, sourceKind?: string }
interface AnalyticsFilter { start: string, end: string, group: 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year', page: string, source: string }

function pageFromPath(): Page { const path = window.location.pathname; if (path === '/publico') return 'audience'; if (path === '/paginas') return 'pages'; if (path === '/resultados') return 'results'; if (path === '/insights') return 'insights'; if (path === '/configuracoes/negocio') return 'team'; if (path === '/configuracoes/fontes-de-dados') return 'data-sources'; if (path === '/configuracoes/rastreador') return 'tracker-setup'; if (path === '/configuracoes/google-analytics') return 'ga4-setup'; if (path.startsWith('/configuracoes')) return 'settings'; return 'dashboard' }
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
    source: params.get('source') || ''
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
      const source = supabase ? await supabase.from('data_sources').select('kind').eq('site_id', currentSite.id).limit(1) : null;
      const query = new URLSearchParams({ start: filter.start, end: filter.end, group: filter.group });
      if (filter.page) query.set('page', filter.page);
      if (filter.source) query.set('source', filter.source);
      try {
        const response = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/analytics/${currentSite.tracker_site_id}?${query}`);
        if (response.ok) {
          const payload = await response.json() as AnalyticsData;
          setData({ ...payload, sourceKind: source?.data?.[0]?.kind });
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

    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const preset = (days: number) => {
    const end = maxAvailableDate;
    apply({ ...filter, start: shiftDays(end, -days + 1), end });
  };

  return (
    <div className="analytics-filters">
      <label>
        De
        <input
          type="date"
          value={filter.start}
          max={filter.end}
          min={shiftDays(filter.end, -729)}
          onChange={(event) => apply({ ...filter, start: event.target.value })}
        />
      </label>
      <label>
        Até
        <input
          type="date"
          value={filter.end}
          max={maxAvailableDate}
          min={filter.start}
          onChange={(event) => apply({ ...filter, end: event.target.value })}
        />
      </label>
      <label>
        Agrupar por
        <select value={filter.group} onChange={(event) => apply({ ...filter, group: event.target.value as AnalyticsFilter['group'] })}>
          <option value="day">Dia</option>
          <option value="week">Semana</option>
          <option value="month">Mês</option>
          <option value="quarter">Trimestre</option>
          <option value="semester">Semestre</option>
          <option value="year">Ano</option>
        </select>
      </label>
      <label>
        Página
        <select value={filter.page} onChange={(event) => apply({ ...filter, page: event.target.value })}>
          <option value="">Todas as páginas</option>
          {(analytics?.filterPages ?? []).map(item => <option key={item.path} value={item.path}>{item.path}</option>)}
        </select>
      </label>
      <label>
        Origem
        <select value={filter.source} onChange={(event) => apply({ ...filter, source: event.target.value })}>
          <option value="">Todas as origens</option>
          {Array.from(new Set((analytics?.filterSources ?? []).map(item => normalizeOriginName(item.source))))
            .map(sourceName => <option key={sourceName} value={sourceName}>{sourceName}</option>)}
        </select>
      </label>
      <div className="filter-presets">
        <button onClick={() => preset(7)}>7 dias</button>
        <button onClick={() => preset(30)}>30 dias</button>
        <button onClick={() => preset(90)}>90 dias</button>
        <button onClick={() => preset(365)}>1 ano</button>
        <button onClick={() => preset(730)}>2 anos</button>
      </div>
    </div>
  );
}

function Landing({ setMode }: { setMode: (mode: AuthPage) => void }) {
  useEffect(() => {
    document.title = 'Analizi — Analytics Simples para Negócios Reais';
  }, []);
  return <div className="landing"><header className="landing-nav"><BrandLogo /><nav><a href="#funcionalidades">Funcionalidades</a><a href="#como-funciona">Como funciona</a><a href="#preco">Preço</a></nav><div><Button variant="ghost" onClick={() => setMode('login')}>Entrar</Button><Button onClick={() => setMode('signup')}>Teste grátis</Button></div></header><main><section className="landing-hero"><div><span className="eyebrow">ANALYTICS SIMPLES PARA NEGÓCIOS REAIS</span><h1>Seu site fala. O Analizi traduz.</h1><p>Descubra o que atrai pessoas, o que gera contatos e onde melhorar — sem precisar entender de analytics.</p><div className="hero-actions"><Button onClick={() => setMode('signup')}>Testar 7 dias grátis <ArrowRight size={18}/></Button><Button variant="secondary" onClick={() => setMode('login')}>Já tenho uma conta</Button></div><small>Sem cartão de crédito. Cancele quando quiser.</small></div><div className="hero-product"><div className="product-bar"><span/><span/><span/></div><div className="product-head"><span>Visão geral</span><b>Últimos 7 dias</b></div><div className="product-metrics"><div><small>Visualizações de páginas</small><b>852</b><i>+18%</i></div><div><small>Contatos iniciados</small><b>38</b><i>+6%</i></div><div><small>Taxa de saída</small><b>32,4%</b><em>quanto menor, melhor</em></div></div><div className="mini-chart"><span/><span/><span/><span/><span/><span/><span/></div><div className="product-insight"><Sparkles size={18}/><span><b>Seu site está crescendo</b><small>As visualizações aumentaram 18% nesta semana.</small></span></div></div></section><section className="landing-proof"><span>FEITO PARA QUEM QUER DECIDIR COM CLAREZA</span><div><b>Sites mais compreensíveis.</b><b>Decisões mais seguras.</b><b>Negócios mais próximos dos clientes.</b></div></section><section id="funcionalidades" className="landing-section"><div className="section-intro"><span className="eyebrow">TUDO O QUE IMPORTA</span><h2>Menos telas técnicas. Mais respostas úteis.</h2><p>O Analizi organiza as informações do seu site em uma visão que faz sentido para a rotina do seu negócio.</p></div><div className="feature-grid"><article><div className="feature-icon blue"><Globe2 size={22}/></div><h3>Entenda seus visitantes</h3><p>Veja de onde as pessoas chegam e quais páginas despertam mais interesse.</p></article><article><div className="feature-icon pink"><Sparkles size={22}/></div><h3>Receba insights claros</h3><p>Identifique mudanças importantes sem interpretar gráficos complexos.</p></article><article><div className="feature-icon orange"><MousePointerClick size={22}/></div><h3>Acompanhe os contatos</h3><p>Saiba quais páginas geram contatos pelo WhatsApp e novos cadastros.</p></article><article><div className="feature-icon blue"><CircleCheck size={22}/></div><h3>Melhore a experiência</h3><p>Use a Taxa de saída para encontrar páginas que precisam de atenção.</p></article></div></section><section id="como-funciona" className="steps-section"><div className="section-intro"><span className="eyebrow">COMECE EM MINUTOS</span><h2>Como funciona</h2></div><div className="steps-grid"><article><i>01</i><h3>Conecte seu site</h3><p>Use o Google Analytics que você já tem ou instale o rastreador Analizi.</p></article><article><i>02</i><h3>Acompanhe o essencial</h3><p>Veja usuários, origens, páginas e contatos em uma visão simples.</p></article><article><i>03</i><h3>Faça escolhas melhores</h3><p>Transforme dados em melhorias reais para o seu site e negócio.</p></article></div></section><section className="benefits-section"><div><span className="eyebrow">FEITO PARA PEQUENOS NEGÓCIOS</span><h2>Uma ferramenta que respeita seu tempo.</h2><ul><li><Check size={18}/>Em português e sem jargões técnicos</li><li><Check size={18}/>Acesse seus dados de qualquer lugar</li><li><Check size={18}/>Dados organizados e isolados por negócio</li><li><Check size={18}/>Relatório semanal direto no seu e-mail</li></ul></div><aside><span className="eyebrow">DESTAQUE</span><h3>Não espere uma planilha para saber como foi sua semana.</h3><p>Receba um resumo objetivo dos resultados e uma oportunidade para melhorar.</p><Sparkles size={34}/></aside></section><section id="preco" className="pricing-section"><span className="eyebrow">PLANOS SIMPLES PARA CRESCER COM VOCÊ</span><h2>Comece a entender seu site hoje.</h2><p className="pricing-subtitle">Os relatórios são os mesmos. Você escolhe a quantidade de sites, eventos e se precisa exportar os dados.</p><div className="pricing-grid"><article className="price-card"><div><span>ESSENCIAL</span><h3>R$ <b>79,90</b><small>/mês</small></h3><p>Para acompanhar um site com clareza.</p></div><ul><li><Check size={17}/>1 site</li><li><Check size={17}/>Até 20 mil eventos por mês</li><li><Check size={17}/>Dashboard e relatório semanal</li><li><Check size={17}/>Google Analytics ou Rastreador Analizi</li><li><Check size={17}/>Sem exportação de dados</li></ul><p className="plan-notice"><b>Mais de 20 mil eventos?</b> Conheça o Crescimento.</p><Button className="full" onClick={() => setMode('signup')}>Começar teste de 7 dias <ArrowRight size={18}/></Button><small>Sem cartão de crédito.</small></article><article className="price-card featured"><span className="plan-badge">PARA QUEM ESTÁ CRESCENDO</span><div><span>CRESCIMENTO</span><h3>R$ <b>149,90</b><small>/mês</small></h3><p>Para acompanhar mais sites e mais movimento.</p></div><ul><li><Check size={17}/>Até 3 sites</li><li><Check size={17}/>Até 100 mil eventos por mês</li><li><Check size={17}/>Dashboard e relatório semanal</li><li><Check size={17}/>Google Analytics ou Rastreador Analizi</li><li><Check size={17}/>Exportação de dados</li></ul><Button className="full" onClick={() => setMode('signup')}>Começar teste de 7 dias <ArrowRight size={18}/></Button><small>Sem cartão de crédito.</small></article></div></section><section className="landing-cta"><BrandLogo inverse/><h2>Conheça seu site. Conheça seu público.</h2><p>Comece agora e veja seu negócio com mais clareza.</p><Button onClick={() => setMode('signup')}>Testar 7 dias grátis <ArrowRight size={18}/></Button></section></main><footer className="landing-footer"><BrandLogo /><span>© 2026 Analizi. Feito para negócios que querem crescer.</span><button onClick={() => setMode('login')}>Entrar</button></footer></div> }

function ConnectionStatus() {
  const { currentSite } = useBusiness();
  const [state, setState] = useState<'loading' | 'none' | 'pending' | 'warning_24h' | 'inactive_24h' | 'ready'>('loading');
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
        if (!item) {
          if (isMounted) setState('none');
          return;
        }

        let hasEvents = item.status === 'connected' || Boolean(item.last_synced_at);
        let lastEventAt: string | null = item.last_synced_at || null;

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

          if (item.status === 'pending') {
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

        const createdAt = item.created_at ? new Date(item.created_at).getTime() : Date.now();
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
  const pages = analytics?.pages ?? [];
  const p = analytics?.previousTotals;
  const visiblePages = pages.slice(tablePage * ITEMS_PER_PAGE, (tablePage + 1) * ITEMS_PER_PAGE);
  const duration = (seconds?: number) => seconds ? `${Math.floor(seconds / 60)}min ${seconds % 60}s` : '—';
  const totalViews = pages.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const pagesWithExit = pages.filter(item => item.exitRate != null);
  const averageExit = pagesWithExit.length ? pagesWithExit.reduce((sum, item) => sum + Number(item.exitRate || 0), 0) / pagesWithExit.length : 0;
  const topPage = pages[0];
  const topTitle = topPage ? (topPage.title || topPage.path) : '—';
  const topPath = topPage ? topPage.path : undefined;

  return (
    <>
      <PageHeader title="Suas páginas" subtitle="Veja quais páginas atraem e mantêm mais pessoas no seu site."/>
      <AnalyticsFilters analytics={analytics}/>
      <section className="metrics page-metrics">
        <MetricCard title="Páginas acompanhadas" value={String(pages.length || '—')} note="páginas com atividade no período"/>
        <MetricCard title="Visualizações de páginas" value={String(totalViews || '—')} {...comparison(totalViews, p?.pageViews)}/>
        <MetricCard title="Página mais vista" value={topTitle} subtitle={topPath} note="mais visualizada no período"/>
        <MetricCard title="Taxa média de saída" value={averageExit ? `${averageExit.toFixed(1).replace('.', ',')}%` : '—'} note="saídas sem interação"/>
      </section>
      <section className="pages-split">
        <PageChart pages={pages}/>
        <article className="table-card compact-table pages-table">
          <div className="section-heading">
            <div>
              <h3>Desempenho das páginas</h3>
              <p>Período selecionado</p>
            </div>
            <button className="filter-button">Ordenado por visualizações <ChevronDown size={15}/></button>
          </div>
          <div className="table-head">
            <span>Página</span>
            <span>Visualizações de páginas</span>
            <span>Tempo de atenção</span>
            <span title="Porcentagem de visualizações que saíram sem interagir">Taxa de saída</span>
          </div>
          {visiblePages.map((item) => (
            <div className="page-row" key={item.path}>
              <span>
                <b>{item.title || item.path}</b>
                <small>{item.path}</small>
              </span>
              <span><b>{item.views}</b></span>
              <span>{duration(item.attentionSeconds)}</span>
              <span>{item.exitRate == null ? '—' : `${item.exitRate}%`}</span>
            </div>
          ))}
          {!pages.length && <p className="empty-state">Ainda não recebemos visualizações de páginas neste período.</p>}
          <TablePagination page={tablePage} total={pages.length} setPage={setTablePage}/>
        </article>
      </section>
    </>
  );
}

function TeamSettings({ setPage }: { setPage: (page: Page) => void }) {
  const { currentBusiness } = useBusiness();
  const businessId = currentBusiness?.id || '';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'admin'>('viewer');
  const [invites, setInvites] = useState<Array<{ id: string, email: string, role: string, status: string }>>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const load = async () => {
      if (!supabase || !businessId) return;
      const { data } = await supabase.from('business_invitations').select('id,email,role,status').eq('business_id', businessId).order('created_at', { ascending: false });
      setInvites(data ?? []);
    };
    void load();
  }, [businessId]);
  const invite = async () => {
    setMessage('');
    if (!businessId) { setMessage('Não foi possível identificar seu negócio.'); return; }
    const address = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(address)) { setMessage('Informe um e-mail válido.'); return; }
    setLoading(true);
    const { data: { user } } = await supabase!.auth.getUser();
    const { data, error } = await supabase!.from('business_invitations').upsert({ business_id: businessId, email: address, role, invited_by: user?.id }, { onConflict: 'business_id,email' }).select('id,email,role,status').single();
    if (error) setMessage(error.message);
    else if (data) {
      setInvites(current => [data, ...current.filter(item => item.id !== data.id)]);
      setEmail('');
      setMessage('Convite salvo. O envio por e-mail será ativado assim que o serviço de e-mail for conectado.');
    }
    setLoading(false);
  };
  return <>
    <div className="source-header">
      <button className="back-link" onClick={() => setPage('settings')}><ArrowLeft size={16}/> Configurações</button>
      <div>
        <span className="eyebrow">EQUIPE E PERMISSÕES</span>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={26} style={{ color: '#ff3cac' }} /> Acesso ao negócio: {currentBusiness?.name || 'Seu negócio'}
        </h1>
        <p className="subtitle">Convide pessoas para visualizar os painéis deste negócio.</p>
      </div>
    </div>
    <section className="team-card">
      <h2>Convidar uma pessoa</h2>
      <p>Quem for convidado poderá entrar com o Google usando este mesmo e-mail.</p>
      <div className="team-invite-form">
        <label>E-mail<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@empresa.com.br" type="email" /></label>
        <label>Nível de acesso<select value={role} onChange={(event) => setRole(event.target.value as 'viewer' | 'admin')}><option value="viewer">Visualizador</option><option value="admin">Administrador</option></select></label>
        <Button onClick={invite} disabled={loading}>{loading ? 'Salvando...' : 'Adicionar convite'}</Button>
      </div>
      {message && <p className="form-feedback">{message}</p>}
    </section>
    <section className="team-card">
      <h2>Convites</h2>
      {invites.length ? <div className="team-invites">{invites.map((invite) => <div key={invite.id}><span><b>{invite.email}</b><small>{invite.role === 'admin' ? 'Administrador' : 'Visualizador'}</small></span><em>{invite.status === 'pending' ? 'Pendente' : invite.status}</em></div>)}</div> : <p className="empty-team">Você ainda não convidou ninguém para este negócio.</p>}
    </section>
  </>;
}

function Settings({ setPage }: { setPage: (page: Page) => void }) {
  const { currentBusiness, currentSite } = useBusiness();
  const items = [
    [currentBusiness?.name ? `Negócio: ${currentBusiness.name}` : 'Seu negócio', 'Dados e membros deste negócio', 'team'],
    ['Fonte de dados', currentSite?.domain ? `Configurar Google Analytics ou Rastreador para ${currentSite.domain}` : 'Configure Google Analytics ou Rastreador Analizi', 'data-sources'],
    ['Relatório semanal', 'Ativado · enviado toda segunda-feira', undefined],
    ['Plano', 'Analizi · R$ 79,90/mês', undefined]
  ] as const;
  return <>
    <PageHeader title="Configurações" subtitle="Gerencie seu negócio, dados e preferências."/>
    <section className="settings-list">
      {items.map(([title, desc, target]) => (
        <button key={title} onClick={() => target && setPage(target)} className="setting-row">
          <span><b>{title}</b><small>{desc}</small></span>
          <ArrowRight size={18}/>
        </button>
      ))}
    </section>
  </>;
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
    <header className="source-header">
      <button className="back-link" onClick={() => setPage('data-sources')}>
        <ArrowLeft size={17}/>Fontes de dados
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
function DataSources({ setPage }: { setPage: (page: Page) => void }) { return <><PageHeader title="Fontes de dados" subtitle="Escolha de onde o Analizi vai trazer os dados do seu site."/><section className="source-intro"><div className="icon-circle"><Link2 size={22}/></div><div><h3>Uma fonte principal por site</h3><p>Isso evita números duplicados e mantém seus resultados fáceis de entender.</p></div></section><section className="source-options"><article className="source-config-card"><div className="source-card-heading"><span className="source-icon ga">G</span><div><span className="eyebrow">GOOGLE ANALYTICS 4</span><h2>Conecte uma propriedade existente</h2><p>Traga os dados que você já acompanha no Google Analytics.</p></div></div><ul><li><Check size={16}/>Importa o histórico disponível</li><li><Check size={16}/>Leitura segura, sem alterar sua conta Google</li></ul><Button onClick={() => setPage('ga4-setup')}>Configurar Google Analytics <ArrowRight size={17}/></Button></article><article className="source-config-card"><div className="source-card-heading"><span className="source-icon"><BrandLogo compact /></span><div><span className="eyebrow">RASTREADOR ANALIZI</span><h2>Instale um código no seu site</h2><p>Comece uma coleta nova, simples e focada no seu negócio.</p></div></div><ul><li><Check size={16}/>Leve e compatível com sites tradicionais</li><li><Check size={16}/>Não coleta conteúdo de formulários</li></ul><Button variant="secondary" onClick={() => setPage('tracker-setup')}>Ver código de instalação <ArrowRight size={17}/></Button></article></section><article className="source-note"><ShieldCheck size={21}/><div><b>Você poderá trocar a fonte depois.</b><p>Antes de mudar, vamos explicar exatamente o que acontece com seus dados.</p></div></article></> }
function GA4Setup({ setPage }: { setPage: (page: Page) => void }) {
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
          <div className="step-label">PASSO 1 DE 3</div>
          <span className="source-icon ga large">G</span>
          <h2>Conecte sua conta Google</h2>
          <p>Você será levado ao Google para autorizar o Analizi a <b>somente visualizar</b> os dados do Analytics.</p>
          <div className="permission-box">
            <ShieldCheck size={19}/>
            <span>Não teremos acesso para editar sua conta, criar campanhas ou fazer alterações.</span>
          </div>
          <Button className="full" onClick={() => {}}>Conectar conta Google <ExternalLink size={16}/></Button>
          <p className="setup-help">Esta é uma demonstração: a autorização real será ativada na Fase 2.</p>
        </article>
        <aside className="setup-sidebar">
          <span className="eyebrow">O QUE VEM DEPOIS</span>
          <ol>
            <li className="current"><i>1</i><span><b>Conectar sua conta</b><small>Autorize a leitura dos dados</small></span></li>
            <li><i>2</i><span><b>Escolher a propriedade</b><small>Encontre o seu site na lista</small></span></li>
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
  const snippet = siteId ? `<script async src="https://analizi.carvalhopaula1990.workers.dev/tracker.js" data-site="${siteId}"></script>` : '';
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
        <Button variant="ghost" onClick={() => setPage('data-sources')}>Escolher outra fonte</Button>
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
    'Seu público': { eyebrow: 'ORIGEM E PERFIL', icon: Users, iconColor: '#3b82f6' },
    'Suas páginas': { eyebrow: 'CONTEÚDO E ENGAJAMENTO', icon: FileText, iconColor: '#ff8a3d' },
    'Resultados': { eyebrow: 'CONVERSÃO E LEADS', icon: Target, iconColor: '#10b981' },
    'Insights & Recomendações': { eyebrow: 'INTELIGÊNCIA ARTIFICIAL', icon: Lightbulb, iconColor: '#eab308' },
    'Configurações': { eyebrow: 'PREFERÊNCIAS DO SISTEMA', icon: SettingsIcon, iconColor: '#8b5cf6' },
    'Fontes de dados': { eyebrow: 'INTEGRAÇÕES E CONEXÕES', icon: Link2, iconColor: '#3b82f6' },
    'Heatmap & Comportamento': { eyebrow: 'COMPORTAMENTO VISUAL', icon: Flame, iconColor: '#f97316' },
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
    if (!client) {
      setMode('landing');
      return;
    }
    const routeAuthenticatedUser = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!session) { setMode('landing'); return; }

        // Valida o usuário com a sessão atual
        const currentUser = session.user;
        if (!currentUser) { setMode('landing'); return; }

        // Verifica consentimentos obrigatórios
        const { data: consents, error: consentError } = await client
          .from('user_consents')
          .select('consent_key')
          .eq('version', CONSENT_VERSION)
          .in('consent_key', ['service_terms', 'site_data_processing']);

        if (!consentError && (consents?.length ?? 0) < 2) { setMode('consent'); return; }

        // Verifica se possui negócio cadastrado
        const { data: businesses, error: bizError } = await client.from('businesses').select('id').limit(1);
        if (!bizError && businesses && businesses.length > 0) {
          setMode('app');
        } else if (!bizError) {
          setMode('onboarding-business');
        } else {
          // Em caso de erro transitório de rede na consulta, mantém na app se já estava autenticado
          setMode('app');
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão do usuário:', err);
        setMode('landing');
      }
    };
    void routeAuthenticatedUser();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        void routeAuthenticatedUser();
      } else {
        setMode('landing');
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
