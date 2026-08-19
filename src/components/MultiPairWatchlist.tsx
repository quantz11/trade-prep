import React, { useState } from 'react';
import { Plus, X, CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { TradeConfig, HTFState, LTFState, LTFMode } from '../types';

export interface PairSession {
  instrument: string;
  config: TradeConfig;
  htf: HTFState;
  ltf: LTFState;
  ltfMode: LTFMode;
}

interface MultiPairWatchlistProps {
  pairs: Record<string, PairSession>;
  activeInstrument: string;
  onSelectPair: (instrument: string) => void;
  onAddPair: (instrument: string) => void;
  onRemovePair: (instrument: string) => void;
}

const AVAILABLE_INSTRUMENTS = [
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

export function MultiPairWatchlist({
  pairs,
  activeInstrument,
  onSelectPair,
  onAddPair,
  onRemovePair,
}: MultiPairWatchlistProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNewInst, setSelectedNewInst] = useState('GBP/USD');

  const handleAdd = () => {
    if (!pairs[selectedNewInst]) {
      onAddPair(selectedNewInst);
    }
    onSelectPair(selectedNewInst);
    setShowAddModal(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Multi-Pair Preparation Watchlist
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono">
            {Object.keys(pairs).length} Active
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
        >
          <Plus className="w-3.5 h-3.5" /> Add Pair
        </button>
      </div>

      {/* Pair Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {Object.entries(pairs).map(([inst, session]) => {
          const isActive = inst === activeInstrument;
          const isHTF = (session.htf.vc1 && (session.htf.vc2 || session.htf.idm1)) || (session.htf.idm2 && session.htf.vc3);
          const isLTF = session.ltfMode === 'trigger_entry' 
            ? session.ltf.trigger1 && session.ltf.entry1 
            : session.ltfMode === 'vc_entry' 
            ? session.ltf.vc && session.ltf.vcEntry 
            : session.ltf.vc && session.ltf.trigger2 && session.ltf.entry2;
          const isReady = isHTF && isLTF;

          return (
            <div
              key={inst}
              onClick={() => onSelectPair(inst)}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-800 border-blue-500/50 shadow-md shadow-blue-500/10 text-white'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400/80'}`} />
                <span className="text-xs font-bold tracking-tight">{inst}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {session.config.bias === 'LONG' ? (
                  <span className="text-emerald-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> LONG</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> SHORT</span>
                )}
              </div>

              {isReady ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-400/70" />
              )}

              {Object.keys(pairs).length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePair(inst);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-opacity"
                  title="Close pair"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Pair Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add Currency Pair to Watchlist</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-300">Select Instrument</label>
              <select
                value={selectedNewInst}
                onChange={(e) => setSelectedNewInst(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {AVAILABLE_INSTRUMENTS.map((inst) => (
                  <option key={inst} value={inst} disabled={!!pairs[inst]}>
                    {inst} {pairs[inst] ? '(Already Added)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                Add & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
