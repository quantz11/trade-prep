import { CheckCircle2, X, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { TradeConfig } from '../types';

interface TradeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TradeConfig;
}

export function TradeSuccessModal({ isOpen, onClose, config }: TradeSuccessModalProps) {
  if (!isOpen) return null;

  const riskDollarNum = config.accountBalance * (config.riskPercentage / 100);
  const riskFormatted = riskDollarNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-emerald-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Trade Executed Successfully</h2>
              <p className="text-xs text-emerald-400">All HTF & LTF confirmation criteria satisfied</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Instrument & Bias</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{config.instrument}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    config.bias === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {config.bias === 'LONG' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {config.bias}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block mb-1">Risk Allocation</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                ${riskFormatted} ({config.riskPercentage}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Entry Price</span>
              <span className="text-sm font-mono font-bold text-white">
                {Number(config.entryPrice).toFixed(5)}
              </span>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Stop Loss</span>
              <span className="text-sm font-mono font-bold text-rose-400">
                {Number(config.stopLoss).toFixed(5)}
              </span>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Take Profit</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {Number(config.takeProfit).toFixed(5)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed">
              Checklist sequence locked and verified. Order submitted to broker gateway with strict risk management rules applied.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors text-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
