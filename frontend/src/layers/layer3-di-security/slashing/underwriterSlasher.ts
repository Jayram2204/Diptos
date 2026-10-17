import type { Address } from 'viem';

export interface UnderwriterBondNode {
  id: string;
  operatorName: string;
  role: 'ERP / Peppol Ingestion Relayer' | 'First-Loss Junior Pool Curator' | 'KYB / vLEI Attester';
  nodeAddress: Address;
  stakedBondUsd: number;
  invoicesVerifiedCount: number;
  slashEventsCount: number;
  status: 'ACTIVE_BONDED' | 'SLASHED';
}

export const ACTIVE_UNDERWRITER_NODES: UnderwriterBondNode[] = [
  {
    id: 'NODE-01',
    operatorName: 'MonetaGo × Peppol AS4 Ingestion Relayer #1',
    role: 'ERP / Peppol Ingestion Relayer',
    nodeAddress: '0x5555555555555555555555555555555555550101',
    stakedBondUsd: 500000,
    invoicesVerifiedCount: 1420,
    slashEventsCount: 0,
    status: 'ACTIVE_BONDED',
  },
  {
    id: 'NODE-02',
    operatorName: 'Aegis Trade Credit First-Loss Underwriter Syndicate',
    role: 'First-Loss Junior Pool Curator',
    nodeAddress: '0x5555555555555555555555555555555555550202',
    stakedBondUsd: 2250000,
    invoicesVerifiedCount: 684,
    slashEventsCount: 0,
    status: 'ACTIVE_BONDED',
  },
  {
    id: 'NODE-03',
    operatorName: 'NIC GSTN & SAT CFDI Cryptographic Stamp Verifier',
    role: 'ERP / Peppol Ingestion Relayer',
    nodeAddress: '0x5555555555555555555555555555555555550303',
    stakedBondUsd: 350000,
    invoicesVerifiedCount: 890,
    slashEventsCount: 0,
    status: 'ACTIVE_BONDED',
  },
];
