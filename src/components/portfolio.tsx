"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, Check, Code2, Download, Github, Globe2, Instagram, Layers3, Linkedin, LockKeyhole, Mail, Menu, MessageCircle, Plus, Scissors, UsersRound, Workflow, X } from "lucide-react";
import { contact, experience, integrations, projects, skills, type Project, type ProjectCategory } from "@/lib/content";
import "./portfolio.css";

type Filter = "all" | ProjectCategory;
type CV = { available: boolean; filename?: string; updatedAt?: string };
const filters: { id: Filter; label: string }[] = [{ id: "all", label: "Todos" }, { id: "online", label: "Online" }, { id: "internal", label: "Internos" }, { id: "development", label: "Em desenvolvimento" }];
const navigation = [{ label: "Projetos", href: "#projetos" }, { label: "Sobre", href: "#sobre" }, { label: "Comunidade", href: "#comunidade" }, { label: "Contato", href: "#contato" }];

function ProjectArtwork({ project }: { project: Project }) {
  return <div className={`pf-project-art pf-art-${project.visual}`} aria-hidden="true">
    <span className="pf-art-index">{project.categoryLabel}</span>
    <div className="pf-art-orbit pf-art-orbit-one" /><div className="pf-art-orbit pf-art-orbit-two" />
    <div className="pf-art-wordmark">{project.wordmark}</div>
    <span className="pf-art-subtitle">{project.subtitle}</span>
    <span className="pf-art-plus"><Plus size={21} strokeWidth={1.3} /></span>
  </div>;
}

function CVButton({ cv, source }: { cv: CV; source: "footer" | "floating" }) {
  const classes = source === "floating" ? "pf-cv-floating" : "pf-button pf-button-outline";
  if (!cv.available) return <button type="button" className={`${classes} pf-cv-unavailable`} disabled title="O currículo estará disponível assim que for publicado."><Download size={17} /><span>Currículo em breve</span></button>;
  return <a className={classes} href={`/api/cv/download?source=${source}`} data-track={`cv-${source}`}><Download size={17} /><span>Baixar currículo</span></a>;
}

export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [cv, setCV] = useState<CV>({ available: false });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cv", { signal: controller.signal, cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (data && typeof data.available === "boolean") setCV(data); }).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !selected) return;
    if (!dialog.open) dialog.showModal();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalOverflow; };
  }, [selected]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButtonRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver) return;
    const nodes = pageRef.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("pf-revealed"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    nodes?.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const filteredProjects = projects.filter(project => filter === "all" || project.category === filter);
  const featured = projects[0];

  return <div className="portfolio-page" ref={pageRef}>
    <a className="pf-skip" href="#principal">Pular para o conteúdo</a>
    <header className="pf-header">
      <div className="pf-container pf-nav-shell">
        <a className="pf-brand" href="#inicio" aria-label="Arthur Ferreira, início" data-track="nav-home">af<span>.</span></a>
        <span className="pf-header-caption">PORTFÓLIO / 2026</span>
        <nav className={`pf-nav ${menuOpen ? "is-open" : ""}`} id="main-navigation" aria-label="Navegação principal">
          {navigation.map(item => <a key={item.href} href={item.href} data-track={`nav-${item.href.slice(1)}`} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
        </nav>
        <a className="pf-header-contact" href={contact.whatsapp} target="_blank" rel="noopener noreferrer" data-track="header-whatsapp">Vamos conversar <ArrowUpRight size={16} /></a>
        <button className="pf-menu-toggle" ref={menuButtonRef} type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </header>

    <main id="principal">
      <section className="pf-hero pf-container" id="inicio" aria-labelledby="hero-title">
        <div className="pf-hero-copy">
          <div className="pf-eyebrow"><span className="pf-status-dot" /> DESENVOLVEDOR DE SISTEMAS</div>
          <h1 id="hero-title">Arthur<span>Ferreira<span className="pf-name-dot">.</span></span></h1>
          <p className="pf-hero-tagline">Código que resolve.<br /><span>Produtos que crescem.</span></p>
          <p className="pf-hero-description">Transformo processos complexos em sistemas que fazem sentido. Back-end, automações e produtos digitais feitos para a vida real.</p>
          <div className="pf-hero-actions">
            <a className="pf-button pf-button-lime" href="#projetos" data-track="hero-projects">Conheça meu trabalho <ArrowDown size={17} /></a>
            <a className="pf-text-link" href={contact.github} target="_blank" rel="noopener noreferrer" data-track="hero-github"><Github size={19} /> GitHub</a>
          </div>
          <div className="pf-hero-location"><Globe2 size={14} /> Juiz de Fora, MG · Conectando ideias a soluções</div>
        </div>
        <div className="pf-hero-visual">
          <div className="pf-portrait-note"><span>CRIATIVIDADE + ENGENHARIA</span><Plus size={17} /></div>
          <div className="pf-portrait-frame">
            {/* Local illustration from the original portfolio, never presented as a photograph. */}
            <Image className="pf-portrait" src="/images/arthur.webp" alt="Ilustração de Arthur Ferreira trabalhando em um notebook" width={800} height={1000} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1100px) 42vw, 470px" unoptimized loading="eager" fetchPriority="high" />
            <div className="pf-portrait-label"><span className="pf-status-dot" /> BACK-END FIRST</div>
          </div>
          <div className="pf-portrait-bottom"><span>IDEIAS → CÓDIGO → IMPACTO</span><span>01 / AF</span></div>
          <div className="pf-code-stamp" aria-hidden="true"><Code2 size={30} strokeWidth={1.4} /></div>
        </div>
      </section>

      <div className="pf-expertise-strip" aria-label="Áreas de atuação"><div className="pf-container"><span>BACK-END & APIs</span><Plus /><span>AUTOMAÇÕES RPA</span><Plus /><span>PRODUTOS SaaS</span><Plus /><span>INTEGRAÇÕES</span></div></div>

      <section className="pf-section pf-projects-section pf-container" id="projetos" aria-labelledby="projects-title">
        <div className="pf-section-heading" data-reveal>
          <div><span className="pf-section-kicker">01 / TRABALHOS SELECIONADOS</span><h2 id="projects-title">Do problema real<br />ao próximo nível<span>.</span></h2></div>
          <p>Produtos próprios, projetos de clientes e ferramentas internas. Cada projeto começa com uma pergunta: como isso pode funcionar melhor?</p>
        </div>

        <article className="pf-featured" data-reveal>
          <div className="pf-featured-copy">
            <div className="pf-featured-label"><span className="pf-status-dot" /> PRODUTO EM DESTAQUE</div>
            <h3>thynkBarber</h3>
            <p>O próximo horário é só o começo.</p>
            <div className="pf-featured-description">Um ecossistema para barbearias, da agenda à gestão. Em fase final de desenvolvimento e já fazendo parte de operações em Juiz de Fora e região.</div>
            <div className="pf-featured-actions"><a className="pf-button pf-button-lime" href={featured.url} target="_blank" rel="noopener noreferrer" data-track="featured-thynkbarber-visit">Conhecer o produto <ArrowUpRight size={17} /></a><button type="button" className="pf-text-link" data-track="featured-thynkbarber-details" onClick={() => setSelected(featured)}>Sobre o projeto</button></div>
          </div>
          <div className="pf-barber-visual" aria-hidden="true">
            <div className="pf-barber-circle pf-barber-circle-outer" /><div className="pf-barber-circle pf-barber-circle-inner" />
            <div className="pf-barber-emblem"><Scissors size={48} strokeWidth={1.25} /><span>thynkBarber</span><small>SUA BARBEARIA. OUTRO NÍVEL.</small></div>
            <span className="pf-barber-chip pf-barber-chip-top"><Check size={14} /> Mais organização</span>
            <span className="pf-barber-chip pf-barber-chip-bottom"><UsersRound size={14} /> Mais conexões</span>
          </div>
          <div className="pf-featured-metrics"><div><strong>Mais de 7</strong><span>barbearias em uso</span></div><div><strong>+1.500</strong><span>agendamentos realizados</span></div><div><strong>+3 mil</strong><span>usuários</span></div><div><strong>R$ 2.900<span>/mês</span></strong><span>faturamento médio mensal</span></div></div>
        </article>
        <p className="pf-metrics-note">Indicadores do thynkBarber informados por Arthur · setembro de 2026.</p>

        <div className="pf-projects-toolbar"><div className="pf-filters" aria-label="Filtrar projetos">{filters.map(item => <button type="button" key={item.id} className={filter === item.id ? "is-active" : ""} aria-pressed={filter === item.id} data-track={`filter-${item.id}`} onClick={() => setFilter(item.id)}>{item.label}<span>{projects.filter(project => item.id === "all" || project.category === item.id).length.toString().padStart(2, "0")}</span></button>)}</div><span className="pf-project-count" aria-live="polite">{filteredProjects.length} projetos</span></div>

        <div className="pf-project-grid">
          {filteredProjects.map(project => <article className="pf-project-card" key={project.id}>
            <button className="pf-art-button" type="button" aria-label={`Ver detalhes de ${project.name}`} onClick={() => setSelected(project)} data-track={`project-${project.id}-cover`}><ProjectArtwork project={project} /><span className="pf-art-open"><ArrowUpRight size={22} /></span></button>
            <div className="pf-project-meta"><span>{project.categoryLabel}</span><span className={`pf-project-status pf-status-${project.category}`}><span />{project.status}</span></div>
            <h3><button type="button" onClick={() => setSelected(project)} data-track={`project-${project.id}-title`}>{project.name}</button></h3>
            <p>{project.description}</p>
            <div className="pf-project-actions"><button type="button" className="pf-text-link" onClick={() => setSelected(project)} data-track={`project-${project.id}-details`}>Explorar projeto <Plus size={15} /></button>{project.url ? <a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`Visitar ${project.name} em uma nova aba`} data-track={`project-${project.id}-visit`}><ArrowUpRight size={20} /></a> : <span className="pf-access-note">{project.category === "internal" ? <><LockKeyhole size={13} /> Acesso restrito</> : <>Em construção</>}</span>}</div>
          </article>)}
        </div>
      </section>

      <section className="pf-community-section" id="comunidade" aria-labelledby="community-title">
        <div className="pf-container pf-community-inner" data-reveal>
          <div className="pf-community-art" aria-hidden="true"><span className="pf-community-ring pf-community-ring-one" /><span className="pf-community-ring pf-community-ring-two" /><span className="pf-community-ring pf-community-ring-three" /><div className="pf-community-code">&lt;/&gt;</div><div className="pf-community-node pf-node-one"><Code2 /></div><div className="pf-community-node pf-node-two"><UsersRound /></div><div className="pf-community-node pf-node-three"><Workflow /></div><span className="pf-community-art-caption">APRENDER. CONSTRUIR. COMPARTILHAR.</span></div>
          <div className="pf-community-copy"><span className="pf-section-kicker">02 / CONSTRUIR EM CONJUNTO</span><h2 id="community-title">Ninguém cresce<br />sozinho<span>.</span></h2><p className="pf-community-lead">Uma comunidade dev.<br />Muitas possibilidades.</p><p>Estou construindo uma iniciativa para aproximar pessoas que gostam de tecnologia, trocar experiências e transformar aprendizado em projetos reais.</p><div className="pf-community-tags"><span>Troca de conhecimento</span><span>Conexões</span><span>Projetos colaborativos</span></div><a className="pf-button pf-button-lime" href={contact.community} target="_blank" rel="noopener noreferrer" data-track="community-interest"><UsersRound size={18} /> Quero saber mais</a><small>Comunidade em criação. Fale comigo para demonstrar interesse.</small></div>
        </div>
      </section>

      <section className="pf-section pf-container pf-about" id="sobre" aria-labelledby="about-title">
        <div className="pf-about-intro" data-reveal>
          <div><span className="pf-section-kicker">03 / QUEM ESTÁ POR TRÁS DO CÓDIGO</span><h2 id="about-title">Curioso por natureza.<br />Construtor por escolha<span>.</span></h2></div>
          <div className="pf-about-copy"><p>Comecei na tecnologia aos 16 anos. De lá para cá, minha forma de aprender continua a mesma: entender o problema, construir uma solução e acompanhar o que acontece quando ela chega ao mundo real.</p><p>Hoje, atuo com back-end, automações e integrações na Maximum Assessoria Contábil e lidero a thynkXP. Conecto desenvolvimento e visão de negócio para criar produtos que tornam a rotina das pessoas mais simples.</p><a className="pf-text-link" href={contact.linkedin} target="_blank" rel="noopener noreferrer" data-track="about-linkedin">Minha trajetória no LinkedIn <ArrowUpRight size={17} /></a></div>
        </div>

        <div className="pf-capabilities" data-reveal><article><Code2 size={27} strokeWidth={1.4} /><h3>Estrutura para crescer</h3><p>Back-end, APIs e regras de negócio que dão sustentação ao produto.</p></article><article><Workflow size={27} strokeWidth={1.4} /><h3>Menos trabalho manual</h3><p>Automações e integrações que conectam sistemas e simplificam processos.</p></article><article><Layers3 size={27} strokeWidth={1.4} /><h3>Visão de ponta a ponta</h3><p>Da necessidade do negócio à experiência de quem usa todos os dias.</p></article></div>

        <div className="pf-career-layout">
          <div className="pf-career-heading"><span className="pf-section-kicker">PERCURSO PROFISSIONAL</span><h3>Aprender fazendo.<br />Evoluir entregando.</h3><p>Experiências que conectam código, pessoas e operação.</p></div>
          <div className="pf-timeline">{experience.map((item, index) => <article key={`${item.company}-${item.role}`} className="pf-timeline-item" data-reveal><div className="pf-timeline-top"><span>{item.period}</span><span className="pf-timeline-number">0{index + 1}</span></div><h4>{item.role}</h4><span className="pf-timeline-company">{item.company}</span><p>{item.detail}</p></article>)}</div>
        </div>

        <div className="pf-education" data-reveal><div><span className="pf-section-kicker">EM APRENDIZADO CONTÍNUO</span><h3>A prática encontra a base.</h3></div><div className="pf-education-items"><article><span>2025 — 2029 · Em andamento</span><h4>Engenharia de Software</h4><p>Estácio de Sá</p></article><article><span>2026 · Em andamento</span><h4>Desenvolvimento Full Stack Java</h4><p>EBAC</p></article><article><span>Especialização</span><h4>Inteligência Artificial</h4><p>EBAC</p></article></div></div>

        <div className="pf-toolbox" data-reveal><div><span className="pf-section-kicker">FERRAMENTAS & CONEXÕES</span><p>Tecnologia a serviço do problema.</p></div><div><div className="pf-skills" aria-label="Tecnologias com as quais trabalho">{skills.map(skill => <span key={skill}>{skill}</span>)}</div><div className="pf-integrations"><span>Integrações com que já trabalhei</span><p>{integrations.join(" / ")}</p></div></div></div>
      </section>

      <section className="pf-contact-section" id="contato" aria-labelledby="contact-title"><div className="pf-container">
        <div className="pf-contact-top" data-reveal><span className="pf-section-kicker">04 / VAMOS CONSTRUIR ALGO?</span><span className="pf-contact-location"><span className="pf-status-dot" /> JUIZ DE FORA, BRASIL</span></div>
        <div className="pf-contact-main" data-reveal><div><h2 id="contact-title">Sua próxima ideia<br />começa com um <span>oi.</span></h2><p>Um projeto, uma oportunidade ou uma boa conversa sobre tecnologia.<br className="pf-desktop-break" /> Me conte o que você tem em mente.</p></div><a className="pf-contact-circle" href={contact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Conversar com Arthur pelo WhatsApp" data-track="contact-whatsapp-circle"><ArrowUpRight size={48} strokeWidth={1.3} /></a></div>
        <div className="pf-contact-bottom"><a className="pf-contact-email" href={`mailto:${contact.email}`} data-track="contact-email"><Mail size={21} />{contact.email}</a><div className="pf-socials" aria-label="Redes sociais"><a href={contact.instagram} target="_blank" rel="noopener noreferrer" data-track="social-instagram"><Instagram size={18} /><span>Instagram</span></a><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" data-track="social-whatsapp"><MessageCircle size={18} /><span>WhatsApp</span></a><a href={contact.linkedin} target="_blank" rel="noopener noreferrer" data-track="social-linkedin"><Linkedin size={18} /><span>LinkedIn</span></a><a href={contact.github} target="_blank" rel="noopener noreferrer" data-track="social-github"><Github size={18} /><span>GitHub</span></a></div></div>
      </div></section>
    </main>

    <footer className="pf-footer pf-container"><div className="pf-footer-main"><div><a className="pf-brand" href="#inicio" aria-label="Voltar ao início">af<span>.</span></a><p>Ideias em movimento.<br />Código com propósito.</p></div><div className="pf-footer-cv"><span>Quer conhecer minha trajetória?</span><CVButton cv={cv} source="footer" /></div></div><div className="pf-footer-bottom"><span>© {new Date().getFullYear()} Arthur Ferreira</span><span>Feito com intenção. Em constante evolução.</span><a href="/admin" data-track="admin-access">Área administrativa</a></div></footer>

    <CVButton cv={cv} source="floating" />
    <dialog className="pf-project-dialog" ref={dialogRef} aria-labelledby="project-dialog-title" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialogRef.current?.close(); } }}>
      {selected && <><button className="pf-dialog-close" type="button" aria-label="Fechar detalhes do projeto" autoFocus onClick={() => dialogRef.current?.close()}><X size={22} /></button><ProjectArtwork project={selected} /><div className="pf-dialog-body"><div className={`pf-project-status pf-status-${selected.category}`}><span />{selected.status}</div><h2 id="project-dialog-title">{selected.name}</h2><p>{selected.detail}</p><h3>Foco do projeto</h3><div className="pf-dialog-focus">{selected.focus.map(item => <span key={item}><Check size={15} />{item}</span>)}</div>{selected.id === "thynkbarber" && <div className="pf-dialog-note">Mais de 7 barbearias, mais de 1.500 agendamentos, mais de 3 mil usuários e faturamento médio de R$ 2.900/mês. Indicadores informados por Arthur em setembro de 2026.</div>}<div className="pf-dialog-actions">{selected.url ? <a className="pf-button pf-button-lime" href={selected.url} target="_blank" rel="noopener noreferrer" data-track={`dialog-${selected.id}-visit`}>Visitar projeto <ArrowUpRight size={17} /></a> : <a className="pf-button pf-button-lime" href={contact.whatsapp} target="_blank" rel="noopener noreferrer" data-track={`dialog-${selected.id}-contact`}>Conversar sobre a solução <MessageCircle size={17} /></a>}<button type="button" className="pf-text-link" onClick={() => dialogRef.current?.close()}>Voltar aos projetos</button></div></div></>}
    </dialog>
  </div>;
}
