import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { HTFState, LTFState, LTFMode } from '../types';

interface StatusBannerProps {
  htf: HTFState;
  ltf: LTFState;
  ltfMode: LTFMode;
  onExecuteTrade?: () => void;
}

export function StatusBanner({ htf, ltf, ltfMode, onExecuteTrade }: StatusBannerProps) {
  // Determine if HTF is confirmed
  // Branch 1: vc1 -> vc2 & idm1
  // Branch 2: idm2 -> vc3
  const isBranch1Complete = htf.vc1 && (htf.vc2 || htf.idm1);
  const isBranch2Complete = htf.idm2 && htf.vc3;
  const isHTFConfirmed = isBranch1Complete || isBranch2Complete;

  // Determine if LTF is confirmed based on mode
  let isLTFConfirmed = false;
  if (ltfMode === 'trigger_entry') {
    isLTFConfirmed = ltf.trigger1 && ltf.entry1;
  } else if (ltfMode === 'vc_entry') {
    isLTFConfirmed = ltf.vc && ltf.vcEntry;
  } else if (ltfMode === 'vc_trigger_entry') {
    isLTFConfirmed = ltf.vc && ltf.trigger2 && ltf.entry2;
  }

  const isReadyForEntry = isHTFConfirmed && isLTFConfirmed;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 mt-6">
      <div
        className={`p-5 rounded-2xl border transition-all duration-300 shadow-lg ${
          isReadyForEntry
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/50'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Trade Readiness Status</span>
              {isReadyForEntry && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  Active Setup
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {isReadyForEntry ? (
                  <div className="flex flex-col">
                    <span className="text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      READY FOR ENTRY
                    </span>
                    {(() => {
                      const isBranchB = htf.idm2 || htf.vc3;
                      let chips: string[] = [];
                      if (isBranchB) {
                        if (htf.vc3) chips = htf.vc3Chips || [];
                        else if (htf.idm2) chips = htf.idm2Chips || [];
                      } else {
                        if (htf.idm1) chips = htf.idm1Chips || [];
                        else if (htf.vc2) chips = htf.vc2Chips || [];
                        else if (htf.vc1) chips = htf.vc1Chips || [];
                      }
                      if (chips.length === 0) return null;
                      return (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-300 font-mono">
                          <span className="text-slate-400">SL on</span>
                          {chips.map((chip) => (
                            <span
                              key={chip}
                              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10 select-none"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="text-slate-300 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Awaiting Confirmations
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">
            {/* HTF Status Pill */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                isHTFConfirmed
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800'
              }`}
            >
              {isHTFConfirmed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-slate-500" />}
              <span>HTF: {isHTFConfirmed ? 'Confirmed' : 'Pending'}</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />

            {/* LTF Status Pill */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                isLTFConfirmed
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800'
              }`}
            >
              {isLTFConfirmed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-slate-500" />}
              <span>LTF: {isLTFConfirmed ? 'Confirmed' : 'Pending'}</span>
            </div>

            <div className="ml-auto lg:ml-2">
              {isReadyForEntry ? (
                <button
                  onClick={onExecuteTrade}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>EXECUTE TRADE</span>
                </button>
              ) : (
                <div className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide bg-slate-800 text-slate-400 border border-slate-700/50">
                  HOLD POSITION
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
