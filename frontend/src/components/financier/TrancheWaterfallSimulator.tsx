'use client';

import React, { useState } from 'react';

export interface TrancheWaterfallSimulatorProps {
  seniorDropTvl?: number;
  juniorTinTvl?: number;
  seniorDropApy?: number;
  juniorTinApy?: number;
}

export function TrancheWaterfallSimulator({
  seniorDropTvl = 750000,
  juniorTinTvl = 250000,
  seniorDropApy = 8.85,
  juniorTinApy = 14.20,
}: TrancheWaterfallSimulatorProps) {
  const [defaultRateShock, setDefaultRateShock] = useState<number>(1.5);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const totalPoolTvl = (seniorDropTvl || 0) + (juniorTinTvl || 0);
  const juniorBufferRatio = totalPoolTvl > 0 ? ((juniorTinTvl || 0) / totalPoolTvl) * 100 : 25;

  // Simulated total default loss in dollars
  const totalDefaultLossUsd = (totalPoolTvl * defaultRateShock) / 100;

  // Waterfall logic: Junior absorbs 100% of first-loss capital
  const juniorAbsorbedLossUsd = Math.min(totalDefaultLossUsd, juniorTinTvl || 0);
  const remainingLossUsd = Math.max(0, totalDefaultLossUsd - (juniorTinTvl || 0));
  const seniorAbsorbedLossUsd = Math.min(remainingLossUsd, seniorDropTvl || 0);

  const juniorCapitalRemaining = Math.max(0, (juniorTinTvl || 0) - juniorAbsorbedLossUsd);
  const seniorCapitalRemaining = Math.max(0, (seniorDropTvl || 0) - seniorAbsorbedLossUsd);

  const juniorLossPercentage = juniorTinTvl > 0 ? (juniorAbsorbedLossUsd / juniorTinTvl) * 100 : 0;
  const seniorLossPercentage = seniorDropTvl > 0 ? (seniorAbsorbedLossUsd / seniorDropTvl) * 100 : 0;

  // Realized net APY after default impact
  const simulatedSeniorApy = Math.max(0, seniorDropApy - (seniorLossPercentage * 1.0));
  const simulatedJuniorApy = juniorLossPercentage >= 100
    ? -100
    : juniorTinApy - (juniorLossPercentage * 1.5);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Institutional Tranche Waterfall &amp; Stress-Test Simulator
          </h3>
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
            ERC-4626 / MLETR Legal Waterfall
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] font-mono text-slate-400 hover:text-white transition cursor-pointer"
        >
          {isOpen ? '[Collapse]' : '[Expand Simulator]'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Slider Controls */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label htmlFor="default-shock-range" className="text-xs font-semibold text-white">
                  Simulated Portfolio Default Shock:
                </label>
                <p className="text-[11px] text-slate-400">
                  Historical global trade factoring default rate is &lt;0.25% for investment-grade obligors.
                </p>
              </div>
              <div className="font-mono text-sm font-bold text-white tabular-nums">
                {defaultRateShock.toFixed(2)}%
                <span className="ml-1.5 text-xs font-normal text-rose-400">
                  (-${totalDefaultLossUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} portfolio loss)
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <input
                id="default-shock-range"
                type="range"
                min="0"
                max="30"
                step="0.25"
                value={defaultRateShock}
                onChange={(e) => setDefaultRateShock(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
              <span className="font-mono text-[10px] text-slate-500">30% Max</span>
            </div>
          </div>

          {/* Side-by-Side Tranche Protection Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Senior DROP Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-400">
                      dRWA-DROP
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Senior Protected Tranche
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Protected by Junior First-Loss Subordination ({juniorBufferRatio.toFixed(1)}% buffer)
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[10px] uppercase text-slate-500">Realized APY</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {simulatedSeniorApy.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 font-mono text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Principal Protected</span>
                  <div className="font-semibold text-white">
                    ${seniorCapitalRemaining.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] text-emerald-400 font-normal">
                      ({seniorDropTvl > 0 ? ((seniorCapitalRemaining / seniorDropTvl) * 100).toFixed(1) : 100}%)
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Tranche Impairment</span>
                  <div className={`font-semibold ${seniorAbsorbedLossUsd > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    ${seniorAbsorbedLossUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] font-normal">
                      ({seniorLossPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1">
                  <span>Capital Preservation Status</span>
                  <span className={seniorAbsorbedLossUsd === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {seniorAbsorbedLossUsd === 0 ? '100% Insulated' : 'Subordination Breached'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      seniorAbsorbedLossUsd === 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(0, 100 - seniorLossPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Junior TIN Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                      dRWA-TIN
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Junior First-Loss Tranche
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Absorbs initial portfolio losses in exchange for premium return &amp; skin-in-the-game
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[10px] uppercase text-slate-500">Realized Return</div>
                  <div className={`text-sm font-bold ${simulatedJuniorApy >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {simulatedJuniorApy.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 font-mono text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Capital Remaining</span>
                  <div className="font-semibold text-white">
                    ${juniorCapitalRemaining.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] text-slate-400 font-normal">
                      ({juniorTinTvl > 0 ? ((juniorCapitalRemaining / juniorTinTvl) * 100).toFixed(1) : 100}%)
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">First-Loss Absorbed</span>
                  <div className={`font-semibold ${juniorAbsorbedLossUsd > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    ${juniorAbsorbedLossUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] font-normal">
                      ({juniorLossPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1">
                  <span>First-Loss Buffer Utilization</span>
                  <span className="text-amber-400">{juniorLossPercentage.toFixed(1)}% Depleted</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, juniorLossPercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3.5 py-2.5 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <strong className="font-semibold text-white">Institutional Assurance:</strong>
              The Junior TIN tranche provides a <span className="font-mono font-semibold">${juniorTinTvl.toLocaleString()}</span> first-loss cushion. At a {defaultRateShock.toFixed(2)}% default shock, Senior DROP investors experience <span className="font-mono text-emerald-400 font-bold">${seniorAbsorbedLossUsd === 0 ? '0.00 loss (100% principal protected)' : `${seniorAbsorbedLossUsd.toLocaleString()} loss`}</span>.
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-semibold uppercase tracking-wider shrink-0">
              UNCITRAL MLETR True Sale
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
