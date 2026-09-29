"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Activity, ArrowDownToLine, ArrowLeft, ArrowUpRight, BarChart3, Check, ChevronRight, CircleAlert, Clock3, Download, ExternalLink, FileText, Globe2, LayoutDashboard, LoaderCircle, LockKeyhole, LogOut, MapPin, Monitor, MousePointer2, RefreshCw, ShieldCheck, Trash2, Upload, Users, X, type LucideIcon } from "lucide-react";

type Section = "overview" | "interactions" | "cv";
type ChartMetric = "pageviews" | "clicks" | "downloads";
type Cv = { available: boolean; filename?: string; updatedAt?: string; size?: number };
type Stats = {
  periodDays: number;
  generatedAt: string;
  totals: { pageviews: number; visitors: number; clicks: number; downloads: number };
  daily: Array<{ date: string; pageviews: number; visitors: number; clicks: number; downloads: number }>;
  topClicks: Array<{ target: string; count: number }>;
  locations: Array<{ country: string; city: string; count: number }>;
  referrers: Array<{ name: string; count: number }>;
  devices: Array<{ name: string; count: number }>;
  recentEvents: Array<{ id: string; type: string; target?: string; path: string; createdAt: string; country?: string; city?: string; device?: string }>;
  cv: Cv;
  setup: { storage: string; ready: boolean; adminConfigured: boolean; analyticsRetentionDays: number };
};
type ApiBody = { error?: string; message?: string; configured?: boolean; authenticated?: boolean; cv?: Cv };
const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const metricNames: Record<ChartMetric, string> = { pageviews: "Visitas", clicks: "Cliques", downloads: "Downloads" };
const eventNames: Record<string, string> = { pageview: "Visita", page_view: "Visita", click: "Clique", download: "Download de currículo", cv_download: "Download de currículo" };

function formatDate(value?: string, time = false) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", time ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" } : { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).format(date);
}

function labelTarget(target: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram", whatsapp: "WhatsApp", linkedin: "LinkedIn", github: "GitHub", email: "E-mail",
    "cv-download": "Currículo", "cv_download": "Currículo", "download-cv": "Currículo", community: "Comunidade Dev", contact: "Contato",
    "hero-projects": "Projetos · apresentação", "hero-contact": "Contato · apresentação", "community-whatsapp": "Comunidade Dev · WhatsApp",
  };
  return labels[target] ?? target.replace(/^(project|projeto)[:\-]/, "Projeto · ").replace(/^social[:\-]/, "Rede · ");
}

async function readBody(response: Response): Promise<ApiBody> {
  try { return await response.json(); } catch { return {}; }
}

function Notice({ children, kind = "error" }: { children: React.ReactNode; kind?: "error" | "success" | "info" }) {
  const Icon = kind === "success" ? Check : CircleAlert;
  return <div className={`admin-notice admin-notice--${kind}`} role={kind === "error" ? "alert" : "status"}><Icon size={18} aria-hidden="true" /><div>{children}</div></div>;
}

function EmptyState({ icon: Icon = Activity, title, children }: { icon?: LucideIcon; title: string; children: React.ReactNode }) {
  return <div className="admin-empty"><span className="admin-empty-icon"><Icon size={23} aria-hidden="true" /></span><strong>{title}</strong><p>{children}</p></div>;
}

function MetricCard({ icon: Icon, label, value, detail, accent }: { icon: LucideIcon; label: string; value: number; detail: string; accent?: boolean }) {
  return <article className={`admin-metric${accent ? " admin-metric--accent" : ""}`}><div className="admin-metric-heading"><span>{label}</span><Icon size={18} aria-hidden="true" /></div><strong>{formatNumber(value)}</strong><small>{detail}</small></article>;
}

function ActivityChart({ daily }: { daily: Stats["daily"] }) {
  const [metric, setMetric] = useState<ChartMetric>("pageviews");
  const max = Math.max(1, ...daily.map((day) => day[metric]));
  const total = daily.reduce((sum, day) => sum + day[metric], 0);
  const width = 720;
  const height = 184;
  const plotWidth = width - 36;
  const gap = daily.length > 45 ? 2 : daily.length > 14 ? 4 : 12;
  const step = plotWidth / Math.max(1, daily.length);
  return <article className="admin-panel admin-chart-panel">
    <div className="admin-panel-heading"><div><span className="admin-eyebrow">Evolução no período</span><h2>O movimento por aqui.</h2></div><div className="admin-chart-toggles" aria-label="Métrica do gráfico">{(Object.keys(metricNames) as ChartMetric[]).map((key) => <button type="button" key={key} aria-pressed={metric === key} onClick={() => setMetric(key)}>{metricNames[key]}</button>)}</div></div>
    {total === 0 ? <EmptyState icon={BarChart3} title="Os primeiros números vêm com as visitas.">Nenhum registro de {metricNames[metric].toLowerCase()} neste período. Os dados reais aparecerão aqui conforme o site for utilizado.</EmptyState> : <>
      <div className="admin-chart-summary"><strong>{formatNumber(total)}</strong><span>{metricNames[metric].toLowerCase()} no período selecionado · Dias em UTC</span></div>
      <div className="admin-chart-wrap"><svg viewBox={`0 0 ${width} ${height + 30}`} role="img" aria-labelledby="admin-chart-title admin-chart-desc"><title id="admin-chart-title">{metricNames[metric]} por dia</title><desc id="admin-chart-desc">{daily.map(day => `${formatDate(day.date)}: ${day[metric]}`).join("; ")}</desc>
        {[0, 0.5, 1].map((ratio) => <g key={ratio}><line x1="32" y1={height - ratio * (height - 12)} x2={width} y2={height - ratio * (height - 12)} className="admin-chart-grid" /><text x="24" y={height - ratio * (height - 12) + 4} textAnchor="end" className="admin-chart-axis">{formatNumber(Math.round(max * ratio))}</text></g>)}
        {daily.map((day, index) => { const barHeight = (day[metric] / max) * (height - 12); return <rect key={day.date} x={36 + index * step + gap / 2} y={height - barHeight} width={Math.max(1, step - gap)} height={barHeight} rx={Math.min(4, step / 5)} className="admin-chart-bar"><title>{formatDate(day.date)}: {formatNumber(day[metric])} {metricNames[metric].toLowerCase()}</title></rect>; })}
        {daily.length > 0 && <><text x="36" y={height + 24} className="admin-chart-axis">{formatDate(daily[0].date)}</text><text x={width} y={height + 24} textAnchor="end" className="admin-chart-axis">{formatDate(daily[daily.length - 1].date)}</text></>}
      </svg></div>
    </>}
  </article>;
}

function Ranking({ items, empty, numbered = false }: { items: Array<{ name: string; count: number }>; empty: string; numbered?: boolean }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  if (!items.length) return <p className="admin-inline-empty">{empty}</p>;
  return <ol className="admin-ranking">{items.slice(0, 8).map((item, index) => <li key={`${item.name}-${index}`}><div className="admin-ranking-row">{numbered && <span className="admin-ranking-index">{String(index + 1).padStart(2, "0")}</span>}<span className="admin-ranking-name" title={item.name}>{item.name}</span><strong>{formatNumber(item.count)}</strong></div><span className="admin-ranking-track" aria-hidden="true"><span style={{ width: `${(item.count / max) * 100}%` }} /></span></li>)}</ol>;
}

export default function Admin() {
  const [session, setSession] = useState<{ authenticated: boolean; configured: boolean } | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cvError, setCvError] = useState("");
  const [cvSuccess, setCvSuccess] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const expireSession = useCallback(() => { setSession((previous) => ({ authenticated: false, configured: previous?.configured ?? true })); setStats(null); setLoginError("Sua sessão expirou. Entre novamente para continuar."); }, []);

  const checkSession = useCallback(async () => {
    setSessionError("");
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const body = await readBody(response);
      if (!response.ok) throw new Error(body.error || "Não foi possível verificar seu acesso.");
      setSession({ authenticated: body.authenticated === true, configured: body.configured === true });
    } catch (error) { setSessionError(error instanceof Error ? error.message : "Não foi possível verificar seu acesso."); }
  }, []);

  useEffect(() => { void checkSession(); }, [checkSession]);

  useEffect(() => {
    if (!session?.authenticated) return;
    const controller = new AbortController();
    setLoading(true);
    setStatsError("");
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/admin/stats?days=${days}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { expireSession(); return; }
        if (!response.ok) { const body = await readBody(response); throw new Error(body.error || "Não foi possível carregar os indicadores."); }
        const body = await response.json() as Stats;
        if (!body.totals || !Array.isArray(body.daily) || !body.setup) throw new Error("Os indicadores retornaram um formato inesperado. Tente atualizar.");
        setStats(body);
      } catch (error) {
        if (!controller.signal.aborted) setStatsError(error instanceof Error ? error.message : "Não foi possível carregar os indicadores.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void fetchStats();
    return () => controller.abort();
  }, [session?.authenticated, days, refresh, expireSession]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (loggingIn) return;
    setLoggingIn(true); setLoginError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const body = await readBody(response);
      if (!response.ok) throw new Error(body.error || (response.status === 429 ? "Muitas tentativas. Aguarde um pouco antes de tentar novamente." : "Não foi possível entrar. Confira sua senha."));
      setPassword(""); setSession({ authenticated: true, configured: true });
    } catch (error) { setLoginError(error instanceof Error ? error.message : "Não foi possível entrar."); }
    finally { setLoggingIn(false); }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Não foi possível sair. Tente novamente.");
      setSession({ authenticated: false, configured: true }); setStats(null); setPassword(""); setLoginError("");
    } catch (error) { setStatsError(error instanceof Error ? error.message : "Não foi possível sair."); }
    finally { setLoggingOut(false); }
  }

  async function exportCsv() {
    setExporting(true); setStatsError("");
    try {
      const response = await fetch(`/api/admin/export?days=${days}`, { cache: "no-store" });
      if (response.status === 401) { expireSession(); return; }
      if (!response.ok) { const body = await readBody(response); throw new Error(body.error || "Não foi possível exportar os dados."); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `portfolio-indicadores-${days}-dias.csv`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setStatsError(error instanceof Error ? error.message : "Não foi possível exportar os dados."); }
    finally { setExporting(false); }
  }

  function selectFile(selected?: File) {
    setCvError(""); setCvSuccess("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pdf") || (selected.type && selected.type !== "application/pdf")) { setCvError("Selecione um arquivo PDF para o currículo."); setFile(null); return; }
    if (selected.size > 3 * 1024 * 1024) { setCvError("O PDF deve ter no máximo 3 MB. Reduza o tamanho do arquivo e tente novamente."); setFile(null); return; }
    if (selected.size === 0) { setCvError("O arquivo está vazio. Selecione um PDF válido."); setFile(null); return; }
    setFile(selected);
  }

  async function uploadCv(event: FormEvent) {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true); setCvError(""); setCvSuccess("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/admin/cv", { method: "POST", body: form });
      if (response.status === 401) { expireSession(); return; }
      const body = await readBody(response);
      if (!response.ok) throw new Error(body.error || "Não foi possível publicar o currículo.");
      if (body.cv) setStats((previous) => previous ? { ...previous, cv: body.cv! } : previous);
      setFile(null); if (fileInput.current) fileInput.current.value = "";
      setCvSuccess("Currículo publicado! O download já está disponível no portfólio."); setRefresh((previous) => previous + 1);
    } catch (error) { setCvError(error instanceof Error ? error.message : "Não foi possível publicar o currículo."); }
    finally { setUploading(false); }
  }

  async function deleteCv() {
    setDeleting(true); setCvError(""); setCvSuccess("");
    try {
      const response = await fetch("/api/admin/cv", { method: "DELETE" });
      if (response.status === 401) { expireSession(); return; }
      const body = await readBody(response);
      if (!response.ok) throw new Error(body.error || "Não foi possível remover o currículo.");
      setStats((previous) => previous ? { ...previous, cv: { available: false } } : previous); setConfirmDelete(false);
      setCvSuccess("Currículo removido. O portfólio informará que uma nova versão estará disponível em breve."); setRefresh((previous) => previous + 1);
    } catch (error) { setCvError(error instanceof Error ? error.message : "Não foi possível remover o currículo."); }
    finally { setDeleting(false); }
  }

  if (!session || !session.authenticated) return <main className="login-page">
    <a href="/" className="admin-back"><ArrowLeft size={17} aria-hidden="true" /> Voltar ao portfólio</a>
    <div className="admin-login-layout"><section className="admin-login-intro"><a href="/" className="admin-brand" aria-label="Arthur Ferreira, página inicial">arthur<span>.</span></a><span className="admin-eyebrow">Bastidores do portfólio</span><h1>O seu trabalho.<br />Os seus <em>resultados.</em></h1><p>Um lugar para acompanhar quem chega, entender o que desperta interesse e manter seu próximo passo sempre à mão.</p><div className="admin-login-note"><span className="admin-status-dot" /> Área exclusiva de administração</div></section>
    <section className="admin-login-card" aria-labelledby="login-title"><span className="admin-login-lock"><LockKeyhole size={25} aria-hidden="true" /></span><span className="admin-eyebrow">Acesso restrito</span><h2 id="login-title">Bem-vindo de volta.</h2><p>Entre para cuidar do seu portfólio.</p>
      {!session && !sessionError ? <div className="admin-loading" role="status"><LoaderCircle className="admin-spin" size={22} aria-hidden="true" /> Verificando acesso…</div> : <>
        {sessionError && <Notice>{sessionError}<button type="button" className="admin-text-button" onClick={() => void checkSession()}>Tentar novamente</button></Notice>}
        {session?.configured === false && <Notice kind="info"><strong>O acesso ainda precisa ser configurado.</strong><p>Configure <code>ADMIN_PASSWORD_HASH</code> e <code>SESSION_SECRET</code> nas variáveis do projeto na Vercel. Para armazenar indicadores e currículo, adicione <code>MONGODB_URI</code>. Depois, faça um novo deploy.</p><button type="button" className="admin-text-button" onClick={() => void checkSession()}>Verificar configuração</button></Notice>}
        <form onSubmit={login}><label htmlFor="admin-password">Sua senha</label><div className="admin-password-field"><LockKeyhole size={17} aria-hidden="true" /><input id="admin-password" name="password" type="password" autoComplete="current-password" placeholder="Digite sua senha de acesso" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={256} disabled={loggingIn || session?.configured === false || !session} /></div>{loginError && <Notice>{loginError}</Notice>}<button type="submit" className="admin-button admin-button--primary admin-login-submit" disabled={loggingIn || !password || !session?.configured}>{loggingIn ? <><LoaderCircle size={18} className="admin-spin" aria-hidden="true" /> Entrando…</> : <>Acessar painel <ArrowUpRight size={19} aria-hidden="true" /></>}</button></form>
      </>}<div className="admin-login-security"><ShieldCheck size={15} aria-hidden="true" /> Acesso protegido por sessão segura</div></section></div><footer className="admin-login-footer">Arthur Ferreira <span>Design, código e intenção.</span></footer>
  </main>;

  const cv = stats?.cv;
  const titles = { overview: { eyebrow: "Uma visão do todo", title: "Seu portfólio, em números.", description: "Acompanhe o alcance do seu trabalho e o interesse de quem chega." }, interactions: { eyebrow: "Além da primeira visita", title: "Entenda cada conexão.", description: "Descubra os caminhos, os interesses e as interações no seu portfólio." }, cv: { eyebrow: "Seu próximo capítulo", title: "Currículo sempre em dia.", description: "Publique seu PDF e acompanhe os downloads pelo portfólio." } };

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a href="/" className="admin-brand" aria-label="Arthur Ferreira, página inicial">arthur<span>.</span></a><div className="admin-sidebar-label">Painel de controle <span>PRIVADO</span></div><nav aria-label="Navegação do painel">{([{ key: "overview", label: "Visão geral", icon: LayoutDashboard }, { key: "interactions", label: "Interações", icon: MousePointer2 }, { key: "cv", label: "Currículo", icon: FileText }] as const).map((item) => <button type="button" key={item.key} aria-current={section === item.key ? "page" : undefined} onClick={() => setSection(item.key)}><item.icon size={18} aria-hidden="true" /><span>{item.label}</span>{section === item.key && <ChevronRight size={15} aria-hidden="true" />}</button>)}</nav><div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noopener noreferrer"><Globe2 size={17} aria-hidden="true" /> Ver portfólio <ExternalLink size={14} aria-hidden="true" /></a><button type="button" onClick={() => void logout()} disabled={loggingOut}>{loggingOut ? <LoaderCircle size={17} className="admin-spin" aria-hidden="true" /> : <LogOut size={17} aria-hidden="true" />}{loggingOut ? "Saindo…" : "Sair da conta"}</button><div className="admin-owner"><span>AF</span><div><strong>Arthur Ferreira</strong><small>Administrador</small></div><ShieldCheck size={16} aria-hidden="true" /></div></div></aside>
    <div className="admin-workspace"><header className="admin-topbar"><span><span className="admin-status-dot" /> Espaço de administração</span><a href="/" target="_blank" rel="noopener noreferrer">Abrir site <ArrowUpRight size={15} aria-hidden="true" /></a></header>
      <main className="admin-main"><div className="admin-page-heading"><div><span className="admin-eyebrow">{titles[section].eyebrow}</span><h1>{titles[section].title}</h1><p>{titles[section].description}</p></div><button type="button" className="admin-icon-button" title="Atualizar dados" aria-label="Atualizar dados" disabled={loading} onClick={() => setRefresh((previous) => previous + 1)}><RefreshCw size={18} className={loading ? "admin-spin" : ""} aria-hidden="true" /></button></div>
        {statsError && <Notice>{statsError}<button type="button" className="admin-text-button" onClick={() => setRefresh((previous) => previous + 1)}>Tentar carregar novamente</button></Notice>}
        {stats && !stats.setup.ready && <Notice kind="info"><strong>Conecte o armazenamento para começar.</strong><p>Configure <code>MONGODB_URI</code> na Vercel e faça um novo deploy para salvar visitas, interações e seu currículo.</p></Notice>}
        {section !== "cv" && <div className="admin-toolbar"><div className="admin-period" aria-label="Período dos indicadores">{[7, 30, 90].map((period) => <button type="button" key={period} aria-pressed={days === period} onClick={() => setDays(period)}>Últimos {period} dias</button>)}</div><button type="button" className="admin-button admin-button--secondary" onClick={() => void exportCsv()} disabled={exporting || loading || !stats?.setup.ready}>{exporting ? <LoaderCircle size={16} className="admin-spin" aria-hidden="true" /> : <ArrowDownToLine size={16} aria-hidden="true" />}{exporting ? "Exportando…" : "Exportar CSV"}</button></div>}
        {loading && !stats ? <div className="admin-loading admin-loading--page" role="status"><LoaderCircle size={26} className="admin-spin" aria-hidden="true" /><span>Carregando os dados do seu portfólio…</span></div> : !stats ? <div className="admin-panel"><EmptyState title="Vamos conectar seus indicadores.">Configure MONGODB_URI, ADMIN_PASSWORD_HASH e SESSION_SECRET na Vercel. Se já estiver tudo configurado, atualize os dados.</EmptyState></div> : <div className={loading ? "admin-data admin-data--loading" : "admin-data"} aria-busy={loading}>
          {section === "overview" && <>
            <section className="admin-metrics" aria-label="Indicadores do período"><MetricCard icon={Globe2} label="Visitas ao site" value={stats.totals.pageviews} detail="Visualizações registradas" accent /><MetricCard icon={Users} label="Visitantes" value={stats.totals.visitors} detail="Identificadores únicos no período" /><MetricCard icon={MousePointer2} label="Cliques" value={stats.totals.clicks} detail="Interações com links e botões" /><MetricCard icon={Download} label="Downloads do CV" value={stats.totals.downloads} detail="Respostas de download registradas" /></section>
            <ActivityChart daily={stats.daily} />
            <div className="admin-grid-two"><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">O que desperta interesse</span><h2>Mais clicados</h2></div><MousePointer2 size={20} aria-hidden="true" /></div><Ranking items={stats.topClicks.map(item => ({ name: labelTarget(item.target), count: item.count }))} empty="Os links e botões mais acessados aparecerão aqui após as primeiras interações." numbered /></article><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">De onde chegam</span><h2>Localizações</h2></div><MapPin size={20} aria-hidden="true" /></div><Ranking items={stats.locations.map(item => ({ name: [item.city, item.country].filter(Boolean).join(", ") || "Localização indisponível", count: item.count }))} empty="A localização aproximada aparecerá quando disponibilizada pela hospedagem." /><p className="admin-panel-footnote">Localização aproximada informada pela Vercel.</p></article></div>
            <button type="button" className="admin-section-link" onClick={() => setSection("interactions")}>Explorar origens, dispositivos e atividade <ArrowUpRight size={17} aria-hidden="true" /></button>
          </>}
          {section === "interactions" && <>
            <div className="admin-grid-three"><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">Pontos de interesse</span><h2>Principais cliques</h2></div><MousePointer2 size={19} aria-hidden="true" /></div><Ranking items={stats.topClicks.map(item => ({ name: labelTarget(item.target), count: item.count }))} empty="Ainda não há cliques registrados neste período." numbered /></article><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">Canais de chegada</span><h2>Origens</h2></div><Globe2 size={19} aria-hidden="true" /></div><Ranking items={stats.referrers.map(item => ({ name: item.name === "direct" || item.name === "Direto" ? "Acesso direto" : item.name, count: item.count }))} empty="As origens serão mostradas após as primeiras visitas registradas." /></article><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">Como navegam</span><h2>Dispositivos</h2></div><Monitor size={19} aria-hidden="true" /></div><Ranking items={stats.devices.map(item => ({ name: ({ desktop: "Computador", mobile: "Celular", tablet: "Tablet", unknown: "Não identificado" } as Record<string, string>)[item.name] ?? item.name, count: item.count }))} empty="Os dispositivos aparecerão conforme o portfólio receber visitas." /></article></div>
            <article className="admin-panel admin-events"><div className="admin-panel-heading"><div><span className="admin-eyebrow">Acompanhamento</span><h2>Atividade recente</h2></div><Clock3 size={20} aria-hidden="true" /></div>{!stats.recentEvents.length ? <EmptyState title="Tudo pronto para as primeiras conexões.">As visitas, os cliques e os downloads registrados aparecerão aqui.</EmptyState> : <div className="admin-table-scroll"><table><caption className="admin-sr-only">Eventos recentes no período selecionado</caption><thead><tr><th scope="col">Interação</th><th scope="col">Destino</th><th scope="col">Localização</th><th scope="col">Data e hora</th></tr></thead><tbody>{stats.recentEvents.map((event, index) => <tr key={event.id || `${event.createdAt}-${index}`}><td><span className={`admin-event-type admin-event-type--${event.type === "click" ? "click" : event.type.includes("download") ? "download" : "view"}`}><span />{eventNames[event.type] ?? event.type}</span></td><td title={event.target || event.path}>{event.target ? labelTarget(event.target) : event.path || "/"}</td><td>{[event.city, event.country].filter(Boolean).join(", ") || "Não disponível"}</td><td>{formatDate(event.createdAt, true)}</td></tr>)}</tbody></table></div>}<p className="admin-panel-footnote">Horários de Brasília. São exibidos os eventos mais recentes do período.</p></article>
          </>}
          {section === "cv" && <>
            <div className="admin-cv-layout"><article className="admin-panel admin-cv-upload"><div className="admin-panel-heading"><div><span className="admin-eyebrow">Uma nova versão</span><h2>Publique seu currículo</h2></div><Upload size={20} aria-hidden="true" /></div><p className="admin-cv-intro">Seu PDF fica disponível nos botões de download do portfólio assim que for publicado.</p>{cvError && <Notice>{cvError}</Notice>}{cvSuccess && <Notice kind="success">{cvSuccess}</Notice>}<form onSubmit={uploadCv}><label htmlFor="cv-file" className={`admin-dropzone${dragging ? " admin-dropzone--active" : ""}${uploading || deleting || !stats.setup.ready ? " admin-dropzone--disabled" : ""}`} onDragOver={(event) => { event.preventDefault(); if (!uploading && !deleting && stats.setup.ready) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!uploading && !deleting && stats.setup.ready) selectFile(event.dataTransfer.files[0]); }}><span className="admin-upload-icon"><Upload size={25} aria-hidden="true" /></span><strong>{file ? file.name : "Selecione ou arraste seu PDF"}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(2).replace(".", ",")} MB · Pronto para publicar` : "Um arquivo PDF, com até 3 MB"}</span><span className="admin-file-picker">{file ? "Escolher outro arquivo" : "Escolher arquivo"}<ArrowUpRight size={16} aria-hidden="true" /></span><input ref={fileInput} id="cv-file" name="file" type="file" accept="application/pdf,.pdf" onChange={(event) => selectFile(event.target.files?.[0])} disabled={uploading || deleting || !stats.setup.ready} /></label><button type="submit" className="admin-button admin-button--primary" disabled={!file || uploading || deleting || !stats.setup.ready}>{uploading ? <><LoaderCircle size={18} className="admin-spin" aria-hidden="true" /> Publicando…</> : <><Upload size={17} aria-hidden="true" />{cv?.available ? "Substituir currículo" : "Publicar currículo"}</>}</button><p className="admin-panel-footnote">Ao publicar uma nova versão, o arquivo anterior é substituído.</p></form></article>
              <article className="admin-panel admin-cv-current"><div className="admin-panel-heading"><div><span className="admin-eyebrow">No portfólio agora</span><h2>Versão publicada</h2></div><span className={`admin-cv-status${cv?.available ? " admin-cv-status--live" : ""}`}>{cv?.available ? "Disponível" : "Em breve"}</span></div>{cv?.available ? <><div className="admin-document-icon"><FileText size={42} strokeWidth={1.3} aria-hidden="true" /><span>PDF</span></div><h3>{cv.filename || "Currículo de Arthur Ferreira.pdf"}</h3><p>Atualizado em {formatDate(cv.updatedAt, true)}{typeof cv.size === "number" && <> · {(cv.size / 1024 / 1024).toFixed(2).replace(".", ",")} MB</>}</p><a className="admin-button admin-button--secondary" href="/api/cv/download?source=admin" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Conferir arquivo</a><button type="button" className="admin-remove-cv" onClick={() => setConfirmDelete(true)} disabled={deleting || uploading}><Trash2 size={15} aria-hidden="true" /> Remover currículo</button>{confirmDelete && <div className="admin-delete-confirm" role="alert"><strong>Remover o currículo publicado?</strong><p>O download ficará indisponível até você publicar outro PDF.</p><div><button type="button" className="admin-button admin-button--danger" onClick={() => void deleteCv()} disabled={deleting}>{deleting ? <LoaderCircle size={15} className="admin-spin" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}{deleting ? "Removendo…" : "Sim, remover"}</button><button type="button" className="admin-button admin-button--secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}><X size={15} aria-hidden="true" /> Cancelar</button></div></div>}</> : <EmptyState icon={FileText} title="Seu próximo passo começa aqui.">Nenhum currículo publicado. Envie seu PDF para ativar os downloads no site.</EmptyState>}<div className="admin-cv-detail"><Download size={18} aria-hidden="true" /><strong>{formatNumber(stats.totals.downloads)}</strong><span>downloads nos últimos {stats.periodDays} dias</span></div><p className="admin-panel-footnote">A conferência do arquivo pelo painel não entra na contagem de downloads.</p></article></div>
          </>}
        </div>}
        <footer className="admin-data-footer"><p><ShieldCheck size={15} aria-hidden="true" /><span>Visitas e cliques consideram o consentimento dos visitantes. Downloads registram respostas do servidor; não confirmam o salvamento do arquivo. Dados mantidos por 90 dias.</span></p>{stats?.generatedAt && <small>Atualizado em {formatDate(stats.generatedAt, true)}</small>}</footer>
      </main>
    </div>
  </div>;
}
