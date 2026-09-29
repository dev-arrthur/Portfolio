'use client';

import { useEffect, useRef, useState } from 'react';
const CONSENT = 'portfolio-analytics-consent';
const VISITOR = 'portfolio-visitor';
type Choice = 'granted' | 'denied' | null;

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState<Choice>(null);
  const [visible, setVisible] = useState(false);
  const [dnt, setDnt] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    const doNotTrack = navigator.doNotTrack === '1';
    setDnt(doNotTrack);
    try {
      const saved = localStorage.getItem(CONSENT) as Choice;
      if (doNotTrack) { setChoice('denied'); return; }
      setChoice(saved === 'granted' || saved === 'denied' ? saved : null);
      setVisible(!saved);
    } catch { setChoice('denied'); }
  }, []);

  useEffect(() => {
    if (choice !== 'granted' || dnt) return;
    let visitorId: string;
    try {
      const saved = JSON.parse(localStorage.getItem(VISITOR) || 'null') as { id: string; expires: number } | null;
      visitorId = saved && saved.expires > Date.now() ? saved.id : crypto.randomUUID();
      if (!saved || saved.expires <= Date.now()) localStorage.setItem(VISITOR, JSON.stringify({ id: visitorId, expires: Date.now() + 90 * 86400000 }));
    } catch { return; }
    function send(type: 'pageview' | 'click', target: string) {
      const body = JSON.stringify({ type, target, path: '/', visitorId, analyticsConsent: true, referrer: document.referrer });
      void fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
    if (!tracked.current) { send('pageview', 'home'); tracked.current = true; }
    function click(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-track]') : null;
      const target = element?.dataset.track;
      if (target && /^[a-z0-9][a-z0-9:_-]{0,79}$/.test(target)) send('click', target);
    }
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, [choice, dnt]);

  function choose(value: Exclude<Choice, null>) {
    try {
      localStorage.setItem(CONSENT, value);
      document.cookie = `portfolio_analytics=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
      if (value === 'denied') localStorage.removeItem(VISITOR);
    } catch { /* O site continua utilizável se o navegador bloquear armazenamento. */ }
    setChoice(value); setVisible(false);
  }

  return <>
    <button className="privacy-settings" onClick={() => setVisible(true)} aria-label="Gerenciar preferência de privacidade">Privacidade</button>
    {visible && <aside className="privacy-banner" aria-label="Preferência de privacidade">
      <strong>Posso entender o que te interessa?</strong>
      <p>{dnt ? 'Seu navegador pediu para não rastrear. A medição de visitas e cliques está desativada.' : 'Com sua permissão, uso métricas de visitas e cliques para melhorar o portfólio. A escolha é sua.'} <a href="/privacidade">Como funciona</a></p>
      <div className="privacy-banner-actions"><button onClick={() => choose('denied')}>{dnt ? 'Entendi' : 'Agora não'}</button>{!dnt && <button onClick={() => choose('granted')}>Permitir métricas</button>}</div>
    </aside>}
  </>;
}
