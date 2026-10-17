import { NextResponse } from 'next/server';
import {
  disburseFaucetFunds,
  readDynamicProtocolState,
} from '@/layers/layer2-base-protocol/server/onchainEngine';
import type { Address } from 'viem';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const targetAddress = (body.recipientAddress || body.address) as Address | undefined;
    const ethAmount = String(body.ethAmount || '10');
    const usdcAmount = String(body.usdcAmount || '250000');

    if (!targetAddress || !/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      return NextResponse.json(
        { ok: false, error: 'Valid 0x wallet address required for Faucet disbursement' },
        { status: 400 }
      );
    }

    const receipt = await disburseFaucetFunds({
      recipientAddress: targetAddress,
      ethAmount,
      usdcAmount,
    });
    const state = await readDynamicProtocolState(targetAddress);

    return NextResponse.json({
      ok: true,
      faucet: receipt,
      faucetReceipt: receipt,
      state,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Faucet transaction failed',
      },
      { status: 500 }
    );
  }
}
