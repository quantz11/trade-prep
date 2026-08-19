import { useState } from 'react';
import { Calculator, Target, Shield, DollarSign, Layers, PieChart, RefreshCw, CheckCircle } from 'lucide-react';
import { TradeConfig } from '../types';

interface RiskCalculatorProps {
  config: TradeConfig;
  onUpdateConfig: (updater: Partial<TradeConfig>) => void;
  isReady: boolean;
}

export function RiskCalculator({ config, onUpdateConfig, isReady }: RiskCalculatorProps) {
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchedRate, setLastFetchedRate] = useState<number | null>(null);

  // Calculate Risk / Reward
  const entry = config.entryPrice || 1.0;
  const sl = config.stopLoss || 0.99;
  const tp = config.takeProfit || 1.02;

  const riskAmount = Math.abs(entry - sl);
  const rewardAmount = Math.abs(tp - entry);
  const rrRatio = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : '0.00';

  const riskDollarNum = config.accountBalance * (config.riskPercentage / 100);
  const riskDollarFormatted = riskDollarNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rewardDollarFormatted = (riskDollarNum * parseFloat(rrRatio)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Lot Size calculation (Standard lot = 100,000 units)
  const standardLotSize = riskAmount > 0 ? (riskDollarNum / (riskAmount * 100000)).toFixed(2) : '0.00';
  const miniLotSize = riskAmount > 0 ? (riskDollarNum / (riskAmount * 10000)).toFixed(1) : '0.0';
  const units = riskAmount > 0 ? Math.round(riskDollarNum / riskAmount) : 0;

  const handleRRChange = (newRR: number) => {
    if (riskAmount <= 0) return;
    const calculatedTP = config.bias === 'LONG'
      ? Number((entry + (newRR * riskAmount)).toFixed(5))
      : Number((entry - (newRR * riskAmount)).toFixed(5));
    onUpdateConfig({ takeProfit: calculatedTP });
  };

  const handleFetchLivePrice = async () => {
    const inst = config.instrument.replace('/', '');
    if (inst.length !== 6) {
      setFetchError('Invalid instrument format');
      return;
    }
    const base = inst.slice(0, 3);
    const quote = inst.slice(3, 6);

    setIsFetchingPrice(true);
    setFetchError(null);

    try {
      const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quote}`);
      if (!res.ok) throw new Error('Failed to fetch market rate');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && typeof data[0].rate === 'number') {
        const liveRate = data[0].rate;
        setLastFetchedRate(liveRate);
        const pip15 = 0.00150;
        const pip30 = 0.00300;
        const newSL = config.bias === 'LONG' ? liveRate - pip15 : liveRate + pip15;
        const newTP = config.bias === 'LONG' ? liveRate + pip30 : liveRate - pip30;

        onUpdateConfig({
          entryPrice: Number(liveRate.toFixed(5)),
          stopLoss: Number(newSL.toFixed(5)),
          takeProfit: Number(newTP.toFixed(5)),
        });
      } else {
        throw new Error('Invalid rate data received');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error fetching live price');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  return (
    <div className={`bg-slate-900 border rounded-2xl p-5 md:p-6 shadow-xl transition-all ${isReady ? 'border-emerald-500/30' : 'border-slate-800'}`}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Trade Parameters & Risk Calculator</h3>
            <p className="text-xs text-slate-400">Calculate pipette-precision position sizing & live market rates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fetchError && (
            <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {fetchError}
            </span>
          )}
          <button
            onClick={handleFetchLivePrice}
            disabled={isFetchingPrice}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
            title="Fetch live market price from Frankfurter API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPrice ? 'animate-spin' : ''}`} />
            {isFetchingPrice ? 'Fetching...' : 'Get Live Price'}
          </button>

          <div className="px-3 py-1 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>RR {parseFloat(rrRatio)}:1</span>
          </div>
        </div>
      </div>

      {/* API Rate Indicator Banner */}
      {lastFetchedRate !== null && (
        <div className="mb-4 px-4 py-2 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-blue-300">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span>Exact API Rate ({config.instrument}):</span>
            <strong className="text-white text-sm">{lastFetchedRate.toFixed(5)}</strong>
          </div>
          <span className="text-[10px] text-blue-400/80">Source: api.frankfurter.dev/v2/rates</span>
        </div>
      )}

      {/* Lot Size & Position Sizing Summary Banner */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-400" /> Lot Size (Standard)
          </span>
          <div className="text-lg font-bold font-mono text-white">
            {standardLotSize} <span className="text-xs font-normal text-slate-400">Lots</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <PieChart className="w-3 h-3 text-blue-400" /> Position Units
          </span>
          <div className="text-lg font-bold font-mono text-white">
            {units.toLocaleString()} <span className="text-xs font-normal text-slate-400">Units</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-rose-400" /> Risk Amount ($)
          </span>
          <div className="text-lg font-bold font-mono text-rose-400">
            -${riskDollarFormatted}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" /> Target Profit ($)
          </span>
          <div className="text-lg font-bold font-mono text-emerald-400">
            +${rewardDollarFormatted}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Account Balance */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Account Balance ($)
          </label>
          <input
            type="number"
            value={config.accountBalance}
            onChange={(e) => onUpdateConfig({ accountBalance: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 font-mono"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            ${Number(config.accountBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Risk Percentage */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" /> Risk (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={config.riskPercentage}
            onChange={(e) => onUpdateConfig({ riskPercentage: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
          <p className="text-[10px] text-slate-400">Mini lots: {miniLotSize} lots</p>
        </div>

        {/* Entry Price */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Entry Price</span>
            <span className="text-[10px] text-blue-400 font-mono">Live</span>
          </label>
          <input
            type="number"
            step="0.00001"
            value={config.entryPrice}
            onChange={(e) => onUpdateConfig({ entryPrice: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 font-mono"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            5-digit: {Number(config.entryPrice || 0).toFixed(5)}
          </p>
        </div>

        {/* Stop Loss */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Stop Loss (SL)</label>
          <input
            type="number"
            step="0.00001"
            value={config.stopLoss}
            onChange={(e) => onUpdateConfig({ stopLoss: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50 font-mono"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            5-digit: {Number(config.stopLoss || 0).toFixed(5)}
          </p>
        </div>

        {/* RR Ratio (Editable) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-slate-400" /> Target R:R Ratio
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={rrRatio}
            onChange={(e) => handleRRChange(parseFloat(e.target.value) || 1.0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 font-mono"
          />
        </div>

        {/* Take Profit */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-5">
          <label className="text-xs font-medium text-slate-300">Take Profit (TP)</label>
          <input
            type="number"
            step="0.00001"
            value={config.takeProfit}
            onChange={(e) => onUpdateConfig({ takeProfit: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 font-mono"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            5-digit: {Number(config.takeProfit || 0).toFixed(5)}
          </p>
        </div>
      </div>
    </div>
  );
}
