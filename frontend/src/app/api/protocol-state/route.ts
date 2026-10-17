import { NextResponse } from 'next/server';
import {
  executeDynamicOnchainAction,
  readDynamicProtocolState,
} from '@/layers/layer2-base-protocol/server/onchainEngine';
import type { Address, Hex } from 'viem';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const state = await readDynamicProtocolState(address);
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to read on-chain state',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const txReceipt = await executeDynamicOnchainAction({
      action: body.action,
      callerAddress: body.callerAddress as Address | undefined,
      data: body.data,
      rawCallData: body.rawCallData as
        | { to: Address; data: Hex; value?: string }
        | undefined,
    });
    const state = await readDynamicProtocolState(body.callerAddress);
    return NextResponse.json({
      ok: true,
      txReceipt,
      state,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'On-chain transaction reverted',
      },
      { status: 400 }
    );
  }
}
