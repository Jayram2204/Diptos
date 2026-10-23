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
  const [defaultRateShock, setDefaultRateShock] = useState<number>(1.5); // Default shock percentage
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const totalPoolTvl = seniorDropTvl + juniorTinTvl;
  const juniorBufferRatio = (juniorTinTvl / totalPoolTvl) * 100; // e.g., 25%

  // Simulated total default loss in dollars
  const totalDefaultLossUsd = (totalPoolTvl * defaultRateShock) / 100;

  // Waterfall logic:
  // Junior absorbs up to 100% of its capital
  const juniorAbsorbedLossUsd = Math.min(totalDefaultLossUsd, juniorTinTvl);
  const remainingLossUsd = Math.max(0, totalDefaultLossUsd - juniorTinTvl);
  const seniorAbsorbedLossUsd = Math.min(remainingLossUsd, seniorDropTvl);

  const juniorCapitalRemaining = juniorTinTvl - juniorAbsorbedLossUsd;
  const seniorCapitalRemaining = seniorDropTvl - seniorAbsorbedLossUsd;

  const juniorLossPercentage = (juniorAbsorbedLossUsd / juniorTinTvl) * 100;
  const seniorLossPercentage = (seniorAbsorbedLossUsd / seniorDropTvl) * 100;

  // Realized net APY after default impact (annualized)
  const simulatedSeniorApy = Math.max(0, seniorDropApy - (seniorLossPercentage * 1.0));
  const simulatedJuniorApy = juniorLossPercentage >= 100
    ? -100
    : juniorTinApy - (juniorLossPercentage * 1.5);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-none">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
            Institutional Tranche Waterfall & Stress-Test Simulator
          </h3>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
            ERC-4626 / MLETR Legal Waterfall
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          {isOpen ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Slider Controls */}
          <div className="rounded-md border border-slate-100 bg-slate-50/75 p-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="default-shock-range" className="text-xs font-medium text-slate-800">
                  Simulated Portfolio Default Shock:
                </label>
                <p className="text-[11px] text-slate-500">
                  Historical global trade factoring default rate is &lt;0.25% for investment-grade corporate obligors.
                </p>
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                {defaultRateShock.toFixed(2)}%
                <span className="ml-1 text-[11px] font-normal text-slate-500">
                  (${totalDefaultLossUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} loss)
                </span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <input
                id="default-shock-range"
                type="range"
                min="0"
                max="30"
                step="0.25"
                value={defaultRateShock}
                onChange={(e) => setDefaultRateShock(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
              />
              <span className="font-mono text-[10px] text-slate-400">30% Max</span>
            </div>
          </div>

          {/* Side-by-Side Tranche Protection Cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Senior DROP Card */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                      dRWA-DROP
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      Senior Protected Tranche
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Protected by Junior First-Loss Subordination ({juniorBufferRatio.toFixed(1)}% buffer)
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[10px] text-slate-400">Net APY</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {simulatedSeniorApy.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 font-mono text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-slate-400">Principal Protected</span>
                  <div className="font-semibold text-slate-900">
                    ${seniorCapitalRemaining.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] font-normal text-slate-500">
                      ({((seniorCapitalRemaining / seniorDropTvl) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Tranche Impairment</span>
                  <div className={`font-semibold ${seniorAbsorbedLossUsd > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    ${seniorAbsorbedLossUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] font-normal">
                      ({seniorLossPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                  <span>Capital Preservation Status</span>
                  <span>{seniorAbsorbedLossUsd === 0 ? '100% Insulated' : 'Subordination Breached'}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      seniorAbsorbedLossUsd === 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(0, 100 - seniorLossPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Junior TIN Card */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                      dRWA-TIN
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      Junior First-Loss Tranche
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Absorbs initial defaults in exchange for premium yield & originator skin-in-the-game
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[10px] text-slate-400">Simulated Return</div>
                  <div className={`text-sm font-bold ${simulatedJuniorApy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {simulatedJuniorApy.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 font-mono text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-slate-400">Capital Remaining</span>
                  <div className="font-semibold text-slate-900">
                    ${juniorCapitalRemaining.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] font-normal text-slate-500">
                      ({((juniorCapitalRemaining / juniorTinTvl) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">First-Loss Absorbed</span>
                  <div className={`font-semibold ${juniorAbsorbedLossUsd > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                    ${juniorAbsorbedLossUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-[10px] font-normal">
                      ({juniorLossPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                  <span>First-Loss Buffer Utilization</span>
                  <span>{juniorLossPercentage.toFixed(1)}% Depleted</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, juniorLossPercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-[11px] text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">Institutional Assurance:</span>
              The Junior TIN tranche provides a <strong className="font-mono">${juniorTinTvl.toLocaleString()}</strong> first-loss shield. At {defaultRateShock.toFixed(2)}% default shock, Senior DROP investors experience <strong className="font-mono text-emerald-700">${seniorAbsorbedLossUsd === 0 ? '0.00 loss (100% principal protected)' : `${seniorAbsorbedLossUsd.toLocaleString()} loss`}</strong>.
            </span>
            <span className="font-mono text-[10px] text-emerald-700 font-medium">
              UNCITRAL MLETR True Sale
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
