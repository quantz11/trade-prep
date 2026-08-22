import { Shield, RotateCcw, HelpCircle, TrendingUp, TrendingDown, BookMarked, FolderOpen, Lock } from 'lucide-react';
import { TradeConfig } from '../types';

interface HeaderProps {
  config: TradeConfig;
  onUpdateConfig: (updater: Partial<TradeConfig>) => void;
  onReset: () => void;
  onOpenGlossary: () => void;
  onOpenSavedTrades: () => void;
  onOpenWorkFolder: () => void;
  onLockWorkstation?: () => void;
  savedTradesCount: number;
  workFolderName: string | null;
}

const INSTRUMENTS = [
  'EURUSD',
  'EURAUD',
  'EURJPY',
  'GBPUSD',
  'EURCAD',
  'GBPJPY',
  'GBPAUD',
  'USDJPY',
  'USDCHF',
  'AUDUSD',
  'USDCAD',
  'NZDUSD',
  'EURNZD'
];

export function Header({
  config,
  onUpdateConfig,
  onReset,
  onOpenGlossary,
  onOpenSavedTrades,
  onOpenWorkFolder,
  onLockWorkstation,
  savedTradesCount,
  workFolderName,
}: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                TradePrep Pro
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Quantz</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Higher & Lower Time Frame Pre-Entry Confirmation Workflow</p>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSavedTrades}
              className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Saved Trades Journal"
            >
              <BookMarked className="w-4 h-4" />
              <span>{savedTradesCount}</span>
            </button>
            <button
              onClick={onOpenGlossary}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
              title="SMC Glossary"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {onLockWorkstation && (
              <button
                onClick={onLockWorkstation}
                className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
                title="Lock Workstation"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onReset}
              className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Reset Checklist"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instrument & Bias Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <select
              value={config.instrument}
              onChange={(e) => onUpdateConfig({ instrument: e.target.value })}
              className="bg-transparent text-slate-200 text-xs font-medium px-2.5 py-1.5 outline-none cursor-pointer"
            >
              {INSTRUMENTS.map((inst) => (
                <option key={inst} value={inst} className="bg-slate-900 text-slate-200">
                  {inst}
                </option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-800 mx-0.5" />

            <button
              onClick={() => onUpdateConfig({ bias: config.bias === 'LONG' ? 'SHORT' : 'LONG' })}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                config.bias === 'LONG'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {config.bias === 'LONG' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {config.bias}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenWorkFolder}
              className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border shadow-sm ${
                workFolderName
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-800'
              }`}
              title="Configure Local Work Folder"
            >
              <FolderOpen className={`w-4 h-4 ${workFolderName ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="truncate max-w-[120px]">{workFolderName ? workFolderName : 'Work Folder'}</span>
            </button>
            <button
              onClick={onOpenSavedTrades}
              className="px-3 py-2 text-blue-300 hover:text-white bg-blue-600/20 hover:bg-blue-600/30 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-blue-500/40 shadow-sm"
            >
              <BookMarked className="w-4 h-4 text-blue-400" />
              <span>Saved Trades</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-slate-950 text-[10px] font-bold">
                {savedTradesCount}
              </span>
            </button>
            <button
              onClick={onOpenGlossary}
              className="px-3 py-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-700/50"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Glossary</span>
            </button>
            {onLockWorkstation && (
              <button
                onClick={onLockWorkstation}
                className="px-3 py-2 text-slate-300 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-700/50"
                title="Lock Workstation"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Lock</span>
              </button>
            )}
            <button
              onClick={onReset}
              className="px-3.5 py-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border border-rose-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Checklist</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
