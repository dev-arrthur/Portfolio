import type { Metadata } from 'next';
import Admin from '@/components/admin';
import '@/components/admin.css';

export const metadata: Metadata = { title: 'Administração', robots: { index: false, follow: false }, alternates: { canonical: null } };
export default function AdminPage() { return <Admin />; }
