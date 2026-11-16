import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, TrendingUp, Eye, SlidersHorizontal, BookOpen, ArrowRight, BarChart3, Calendar, Check, ChevronDown, CircleCheck, AlertTriangle, Clock, Compass, Crown, FileText, Flame, Layers, Lightbulb, LogIn, MessageCircle, Copy, ExternalLink, Globe, Globe2, Info, Link2, MapPin, Monitor, MoreHorizontal, MousePointerClick, Plus, RefreshCw, Settings as SettingsIcon, ShieldCheck, Smartphone, Sparkles, Tablet, Target, Trash2, UserPlus, Users } from 'lucide-react'
import { AppShell, type Page } from './components/AppShell'
import { BrandLogo } from './components/BrandLogo'
import { MetricCard, DualMetricCard } from './components/Metrics'
import { Button } from './components/ui/Button'
import { AuthFlow, CONSENT_VERSION, type AuthFlowMode } from './components/AuthFlow'
import { LandingPage } from './components/LandingPage'
import { supabase } from './lib/supabase'
import { BusinessProvider, useBusiness, type BusinessItem, type SiteItem } from './lib/business-context'
import { BrazilGeoMap } from './components/BrazilMap'
import * as R from './components/report/kit'
import { Help } from './components/report/kit'

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
                  <b><Lightbulb size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4, color: '#fbbf24' }} /> Como melhorar:</b>
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
          <R.Card title={view === 'chart' ? `${metricInfo.label} ao longo do período` : 'Métricas dia a dia'}
            subtitle={view === 'chart' ? 'Passe o mouse para ver cada ponto. A linha tracejada é a média do período.' : 'Histórico de acessos, visitantes e contatos, do mais recente para o mais antigo'}
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
                  <R.Tabs label="Dias exibidos" value={dailyTab} onChange={(v) => { setDailyTab(v); setDailyPage(0); }} options={[{ value: 'all', label: 'Todos os dias' }, { value: 'conversions', label: 'Só dias com contato' }]} />
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
                ) : <R.Empty>{dailyTab === 'conversions' ? 'Nenhum dia com contatos no período.' : 'Ainda não recebemos acessos neste período.'}</R.Empty>}
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
      const isPaid = isPaidTraffic(item);
      const sess = Number(item.sessions || 0);
      const cont = Number(item.whatsappClicks || item.contactClicks || 0);

      if (isPaid) {
        paidSessions += sess;
        paidContacts += cont;
      } else {
        orgSessions += sess;
        orgContacts += cont;
      }

      if (hasCampaign(item.campaign) && cont > (topAd?.contacts || 0)) {
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
      bestAd: topAd || (hasCampaign(rawSm[0]?.campaign) ? {
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
      rawSm.filter(item => hasCampaign(item.campaign)).forEach(item => {
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
                  <div className="rp-mini"><span className="t">Espontâneo</span><b className="num">{R.fmt(organic.sessions)} visitas</b><small>{R.fmt(organic.contacts)} contatos · conversão {organic.convRate}</small></div>
                  <div className="rp-mini"><span className="t">Pago (anúncios)</span><b className="num">{R.fmt(paid.sessions)} visitas</b><small>{R.fmt(paid.contacts)} contatos · conversão {paid.convRate}</small></div>
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
                <thead><tr><th>Canal / campanha</th><th>Sessões</th><th className="r">Usuários</th><th className="r">Contatos</th><th className="r">Conversão <Help align="right" title="Conversão" what="Contatos ÷ sessões do canal." tip="Verde: acima de 3%. Laranja: abaixo de 1%." /></th></tr></thead>
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
  const [sourceTab, setSourceTab] = useState<'all' | 'top'>('top');
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
                    <thead><tr><th>Canal</th><th>Página de entrada</th><th className="r">Visualizações</th><th className="r">Usuários</th></tr></thead>
                    <tbody>{visibleSources.map(item => (
                      <tr key={`${item.source}-${item.path}`}><td><b>{normalizeOriginName(item.source)}</b></td><td><code>{item.path}</code></td><td className="r num"><b>{R.fmt(item.views)}</b></td><td className="r num">{R.fmt(item.users)}</td></tr>
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
  };
  return labels[type] || 'Outra conversão';
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
  const allClicks = analytics?.clickDetails ?? [];
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
    ? rawSmResults.filter(item => hasCampaign(item.campaign))
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
  const contacts = Number(t?.contacts || 0), whatsapp = Number(t?.whatsappContacts || 0), signups = Number(t?.signUps || 0);
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

  return (
    <>
      <PageHeader report title="Resultados" subtitle="Os contatos e oportunidades que o seu site gerou."
        guide={<><b>Como ler esta tela:</b> <b>contato iniciado</b> é quando alguém clica para falar com você (WhatsApp, telefone) ou envia um cadastro. Não quer dizer que virou venda, mas é o melhor sinal de interesse. Use as tabelas para descobrir <b>quais páginas, botões e canais</b> trazem esses contatos.</>} />
      <AnalyticsFilters analytics={analytics} />
      <div className="rp">
        <div className="rp-grid" style={{ gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)' }}>
          <R.Card title="Contatos iniciados" subtitle="Todas as formas de contato somadas" actions={<R.Delta value={R.change(t?.contacts, p?.contacts)} emptyLabel="sem comparação" />}
            help={{ what: 'Soma dos cliques em WhatsApp e telefone e dos cadastros enviados pelo site.', why: 'É o principal resultado do seu site: pessoas que levantaram a mão.' }}
            read={contacts ? <>De cada 100 visitas, <b>{R.fmtDec(contactRateNum)}</b> terminaram em contato. {whatsapp ? <>O WhatsApp responde por <b>{Math.round(R.share(whatsapp, contacts))}%</b> deles.</> : null}</> : undefined}
            tip={contacts ? (R.share(whatsapp, contacts) > 60 ? 'O WhatsApp é o seu canal principal. Responda rápido: a primeira hora é quando a pessoa está mais interessada.' : 'Os formulários têm peso grande. Confira se os e-mails de cadastro estão chegando e sendo respondidos.') : 'Adicione um botão de WhatsApp visível em todas as páginas para começar a receber contatos.'}>
            <div className="rp-big"><b className="num">{R.fmt(contacts)}</b><span>contatos · <b style={{ color: 'var(--rp-fg)' }}>{contactRate}</b> das visitas <Help title="Taxa de contato" what="Sessões com pelo menos um contato ÷ total de sessões." tip="Entre 2% e 5% é comum em sites de serviços." /></span></div>
            <div style={{ marginTop: 12 }}><R.StackBar height={16} segments={[{ value: whatsapp, color: '#FF3CAC', label: 'WhatsApp' }, { value: signups, color: '#FF8A3D', label: 'Cadastros' }, { value: otherContacts, color: '#7C5CF0', label: 'Outros' }]} /></div>
            <div className="rp-grid rp-g3" style={{ marginTop: 10, gap: 10 }}>
              <div className="rp-mini"><span className="t"><i style={{ width: 8, height: 8, borderRadius: 2, background: '#FF3CAC', display: 'inline-block' }} />WhatsApp</span><b className="num">{R.fmt(whatsapp)}</b><R.Delta value={R.change(t?.whatsappContacts, p?.whatsappContacts)} /></div>
              <div className="rp-mini"><span className="t"><i style={{ width: 8, height: 8, borderRadius: 2, background: '#FF8A3D', display: 'inline-block' }} />Cadastros</span><b className="num">{R.fmt(signups)}</b><R.Delta value={R.change(t?.signUps, p?.signUps)} /></div>
              <div className="rp-mini"><span className="t">Formulários enviados<Help title="Formulários enviados" what="Envios confirmados de formulários de contato, agendamento, orçamento ou newsletter." /></span><b className={`num ${formSubmits ? '' : 'empty'}`}>{formSubmits ? R.fmt(formSubmits) : '—'}</b><small>{formSubmits ? 'envios confirmados' : 'nenhum envio'}</small></div>
            </div>
          </R.Card>
          <R.Card title="Outras ações no site" subtitle="Sinais de interesse que ainda não são contato">
            <div className="rp-grid rp-g2e" style={{ marginTop: 0, gap: 10 }}>
              <div className="rp-mini"><span className="t">Intenções de compra<Help title="Intenções de compra" what="Pessoas que começaram um checkout, pagamento ou assinatura." /></span><b className={purchaseIntents ? '' : 'empty'}>{purchaseIntents ? R.fmt(purchaseIntents) : '—'}</b><small>checkout, pagamento ou assinatura</small></div>
              <div className="rp-mini"><span className="t">Downloads<Help title="Downloads" what="Arquivos baixados no site, como PDFs, cardápios e catálogos." /></span><b className={totalDownloads ? '' : 'empty'}>{totalDownloads ? R.fmt(totalDownloads) : '—'}</b><small>arquivos baixados</small></div>
              <div className="rp-mini"><span className="t">Cliques de saída<Help title="Cliques de saída" what="Cliques em links que levam para outros sites (Google Maps, redes sociais…)." /></span><b className={totalOutbound ? '' : 'empty'}>{totalOutbound ? R.fmt(totalOutbound) : '—'}</b><small>links para outros sites</small></div>
              {formStarts > 0 ? (
                <div className="rp-mini"><span className="t">Abandono de formulário<Help title="Abandono de formulário" what="Pessoas que começaram a preencher um formulário e desistiram." tip="Formulários longos espantam. Peça só o essencial." /></span><b>{formAbandonRate}%</b><small>{formAbandons} desistiram de {formStarts} iniciados</small></div>
              ) : (
                <div className="rp-mini"><span className="t">Logins<Help title="Logins" what="Acessos à área restrita do seu site, se houver." /></span><b className={Number(t?.logins || 0) ? '' : 'empty'}>{R.fmt(t?.logins)}</b><small>acessos à área restrita</small></div>
              )}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 12 }}><R.Tip>Se o seu site não tem loja, downloads ou área restrita, é normal estes números ficarem zerados.</R.Tip></div>
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
          <R.Card title="Histórico de conversões e intenções" subtitle="Envios confirmados de formulário e ações comerciais iniciadas"
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
            ) : <R.Empty>Ainda não há conversões ou intenções registradas neste período.</R.Empty>}
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

  const defaultInsights: GeneratedInsight[] = [
    {
      key: 'opp-precos',
      type: 'commercial',
      title: 'Página de Preços tem alto tráfego com pouca ação de WhatsApp',
      status: 'neutral',
      badge: 'Oportunidade Comercial',
      finding: `A página ${analytics?.pages?.[1]?.path || '/precos'} concentrou acessos relevantes com tempo médio de atenção acima da média, mas a taxa de cliques comerciais ainda pode dobrar.`,
      action: 'Adicione um botão flutuante ou chamada clara para tirar dúvidas no WhatsApp no meio e no final da página.',
      projection: 'Aumento estimado de 20% a 35% no volume de leads qualificados semanais.'
    },
    {
      key: 'warn-speed',
      type: 'performance',
      title: 'Velocidade de carregamento em mobile reduziu retenção de visitantes',
      status: 'warning',
      badge: 'Alerta de Performance',
      finding: 'O tempo médio de abertura em smartphones está acima de 1.4s, elevando a taxa de saída imediata nos primeiros 5 segundos.',
      action: 'Otimize o tamanho das imagens principais para WebP e reduza scripts pesados na primeira dobra.',
      projection: 'Queda de até 15% na taxa de rejeição e melhora na pontuação Core Web Vitals.'
    },
    {
      key: 'succ-ads',
      type: 'conversion',
      title: 'Criativo de Anúncio Pago tem conversão 2.5x superior à média',
      status: 'positive',
      badge: 'Otimização de Campanhas',
      finding: 'O tráfego de campanhas pagas com termos específicos gerou maior taxa de conversão em leads comerciais.',
      action: 'Realocar 30% do orçamento de campanhas estáticas para os criativos e públicos com maior engajamento comprovado.',
      projection: 'Redução do Custo por Aquisição (CPA) em até 22% mantendo o volume de contatos.'
    }
  ];

  const activeInsights = insights.length > 0 ? insights : defaultInsights;
  const isExample = insights.length === 0;
  const [insTab, setInsTab] = useState<'all' | 'neutral' | 'warning' | 'positive' | 'done'>('all');
  const keyOf = (item: GeneratedInsight) => item.key || item.title;
  const counts = {
    open: activeInsights.filter(i => !readKeys.includes(keyOf(i))).length,
    neutral: activeInsights.filter(i => i.status === 'neutral').length,
    warning: activeInsights.filter(i => i.status === 'warning').length,
    positive: activeInsights.filter(i => i.status === 'positive').length,
  };
  const shown = activeInsights.filter(i => insTab === 'all' ? true : insTab === 'done' ? readKeys.includes(keyOf(i)) : i.status === insTab);
  const tone = (s: GeneratedInsight['status']) => s === 'warning' ? { color: '#FF8A3D', chip: 'warn' as const, Icon: AlertTriangle, label: 'Alerta' } : s === 'positive' ? { color: '#15803D', chip: 'good' as const, Icon: CircleCheck, label: 'Ponto positivo' } : { color: '#3B82F6', chip: 'neutral' as const, Icon: Sparkles, label: 'Oportunidade' };

  return (
    <>
      <PageHeader report title="Insights" subtitle={`Descobertas sobre o seu site, com o que fazer a seguir. Análise ${scopeLabel} gerada por IA a partir dos seus dados.`}
        guide={<><b>Como usar:</b> leia cada cartão da esquerda para a direita: <b>o que os dados mostram</b>, <b>o que fazer</b> e <b>o resultado esperado</b>. Depois de aplicar a sugestão, clique em <b>Marcar como feito</b> para acompanhar o que já resolveu.</>} />
      <AnalyticsFilters analytics={analytics} />
      <div className="rp">
        {isExample && !loadingAI && (
          <div className="rp-guide" role="status" style={{ marginTop: 4 }}>
            <Info size={16} />
            <span><b>Estes são exemplos.</b> Ainda não conseguimos gerar a análise do seu site, normalmente porque há poucos dados no período. Tente um período maior (30D) ou clique em <b>Gerar nova análise</b>.</span>
          </div>
        )}
        <div className="rp-isum">
          <div><Sparkles size={20} style={{ color: 'var(--rp-primary)' }} /><b>{counts.open}</b><span>{counts.open === 1 ? 'insight em aberto' : 'insights em aberto'}</span></div>
          <div><Sparkles size={20} style={{ color: '#3B82F6' }} /><b>{counts.neutral}</b><span>{counts.neutral === 1 ? 'oportunidade' : 'oportunidades'}</span></div>
          <div><AlertTriangle size={20} style={{ color: '#FF8A3D' }} /><b>{counts.warning}</b><span>{counts.warning === 1 ? 'alerta' : 'alertas'}</span></div>
          <div><CircleCheck size={20} style={{ color: '#15803D' }} /><b>{counts.positive}</b><span>{counts.positive === 1 ? 'ponto positivo' : 'pontos positivos'}</span></div>
        </div>
        <div className="rp-fbar" style={{ marginTop: 14 }}>
          <R.Tabs label="Filtrar insights" value={insTab} onChange={setInsTab} options={[{ value: 'all', label: 'Todos' }, { value: 'neutral', label: 'Oportunidades' }, { value: 'warning', label: 'Alertas' }, { value: 'positive', label: 'Pontos positivos' }, { value: 'done', label: `Feitos (${activeInsights.filter(i => readKeys.includes(keyOf(i))).length})` }]} />
          <span className="rp-cmp">{modelLabel}{cachedNotice ? ' · análise salva desta semana' : ''} <Help align="right" title="De onde vêm os insights" what="A IA cruza os números do seu site com o seu segmento de negócio e aponta o que mais pode fazer diferença." tip="Os insights são sugestões. Use seu conhecimento do negócio para decidir o que aplicar." /></span>
          <button type="button" className="rp-btn" onClick={() => void fetchInsights()} disabled={loadingAI || !analytics}>
            <Sparkles size={15} className={loadingAI ? 'spin' : ''} />{loadingAI ? 'Analisando…' : 'Gerar nova análise'}
          </button>
        </div>

        {loadingAI && !insights.length ? (
          <div className="rp-card" style={{ marginTop: 14, alignItems: 'center', textAlign: 'center', padding: 40 }}>
            <Sparkles size={32} className="spin" style={{ color: 'var(--rp-pink)', marginBottom: 12 }} />
            <p style={{ margin: 0, color: 'var(--rp-muted)' }}>O Analizi está cruzando o comportamento do seu público com o seu segmento. Isso leva alguns segundos…</p>
          </div>
        ) : shown.length ? shown.map(item => {
          const done = readKeys.includes(keyOf(item));
          const tn = tone(item.status);
          return (
            <article className={`rp-ins ${done ? 'done' : ''}`} key={keyOf(item)}>
              <i style={{ background: tn.color }} />
              <div className="rp-ins-body">
                <div className="rp-ins-top">
                  <tn.Icon size={16} style={{ color: tn.color }} />
                  <R.Chip tone={tn.chip}>{item.badge || tn.label}</R.Chip>
                  {isExample && <R.Chip tone="brand">Exemplo</R.Chip>}
                  <span>avaliado em {date}</span>
                  {done && <R.Chip tone="good">✓ Feito</R.Chip>}
                </div>
                <h3>{item.title}</h3>
                <div className="rp-ins-cols">
                  <div><h4><Eye size={13} />O que os dados mostram</h4>{item.finding}</div>
                  <div><h4><Lightbulb size={13} />O que fazer</h4>{item.action}</div>
                  <div><h4><TrendingUp size={13} />Resultado esperado</h4><b>{item.projection}</b></div>
                </div>
                <div className="rp-ins-act">
                  <button type="button" className="rp-btn ghost" onClick={() => toggleRead(keyOf(item))}>
                    {done ? <><RefreshCw size={14} />Reabrir</> : <><Check size={14} />Marcar como feito</>}
                  </button>
                </div>
              </div>
            </article>
          );
        }) : <div className="rp-card" style={{ marginTop: 14 }}><R.Empty>{insTab === 'done' ? 'Você ainda não marcou nenhum insight como feito.' : 'Nenhum insight deste tipo no momento.'}</R.Empty></div>}
      </div>
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
      const source = supabase ? await supabase.from('data_sources').select('kind').eq('site_id', currentSite.id).limit(1) : null;
      const query = new URLSearchParams({ start: filter.start, end: filter.end, group: filter.group });
      if (filter.page) query.set('page', filter.page);
      if (filter.source) query.set('source', filter.source);
      if (filter.medium) query.set('medium', filter.medium);
      if (filter.campaign) query.set('campaign', filter.campaign);
      if (filter.device) query.set('device', filter.device);
      if (filter.browser) query.set('browser', filter.browser);
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
              <option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option>
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
  const [state, setState] = useState<'loading' | 'none' | 'pending' | 'warning_24h' | 'inactive_24h' | 'ready'>('loading');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let isMounted = true;
    setState('loading');
    const load = async () => {
      if (businessLoading) return;
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
  }, [currentSite, businessLoading]);

  if (compact && state === 'loading') {
    return <span className="rp-status" aria-busy="true"><i style={{ background: '#9CA3AF', boxShadow: 'none' }} />Verificando a conexão do seu site…</span>;
  }
  if (compact && state === 'ready') {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(y);
    return (
      <span className="rp-status" title={updatedAt ? `Última atividade recebida: ${updatedAt}` : undefined}>
        <i />Conectado · dados até <b>{yFmt}</b>
        <Help align="left" title="De quando são os dados" what="Os números são consolidados uma vez por dia. Por isso os relatórios vão até ontem." tip="Visitas de hoje aparecem amanhã." />
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
          <Button variant="secondary" onClick={() => setPage('ga4-setup')}>Configurar Google Analytics <ArrowRight size={17}/></Button>
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
        setMode(targetPublicPage);
      }
    };
    void routeAuthenticatedUser();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
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
