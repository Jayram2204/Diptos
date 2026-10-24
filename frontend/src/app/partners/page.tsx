import { Metadata } from 'next';
import { DiptosHeader } from '@/components/layout/DiptosHeader';
import { PartnersWorkspaceView } from '@/components/partners/PartnersWorkspaceView';

export const metadata: Metadata = {
  title: 'Partner API & Factoring Rails | Diptos Protocol',
  description:
    'REST API, e-invoicing parser, and UNCITRAL MLETR legal assignment generation for NBFCs, factoring institutions, and ERP networks.',
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      <DiptosHeader />
      <main className="flex-1">
        <PartnersWorkspaceView />
      </main>
    </div>
  );
}
