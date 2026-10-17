import type { Address } from 'viem';

export interface UnderwriterBondNode {
  id: string;
  operatorName: string;
  role: string;
  nodeAddress: Address;
  stakedBondUsd: number;
  invoicesVerifiedCount: number;
  slashEventsCount: number;
  status: 'ACTIVE_BONDED' | 'SLASHED';
}
