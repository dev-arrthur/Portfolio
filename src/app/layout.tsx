import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/allura/latin-400.css';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: { default: 'Arthur Ferreira — Desenvolvimento, automações e SaaS', template: '%s | Arthur Ferreira' },
  description: 'Desenvolvedor em Juiz de Fora. Back-end, integrações e produtos SaaS que conectam tecnologia a operações reais. Conheça meus projetos e a thynkXP.',
  icons: { icon: '/icon.svg' },
  ...(siteUrl ? { alternates: { canonical: '/' } } : {}),
  openGraph: { title: 'Arthur Ferreira — Tecnologia com propósito', description: 'Sistemas, automações e produtos que fazem parte de operações reais.', locale: 'pt_BR', type: 'website' },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#faf9f6' };

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
