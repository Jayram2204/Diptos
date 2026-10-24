import type { Metadata } from 'next';
import { DiptosWeb3Provider } from '@/providers/DiptosWeb3Provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Diptos (diptos.xyz) — Global RWA Trade Receivables Protocol',
  description:
    'Short-duration, self-liquidating Real-World Asset (RWA) trade invoices on Base L2 (8453) secured by GLEIF vLEI, ONCHAINID, and Privado ID Zero-Knowledge Proofs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080C14] text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <DiptosWeb3Provider>{children}</DiptosWeb3Provider>
      </body>
    </html>
  );
}
