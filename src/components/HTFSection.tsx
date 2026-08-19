import { Check, ArrowDownRight, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HTFState } from '../types';
import { ChipSelector } from './ChipSelector';

interface HTFSectionProps {
  htf: HTFState;
  onUpdateHTF: (updater: Partial<HTFState>) => void;
}

const VC_OPTIONS = ['D', '4H', '1H', 'OB', 'RB', 'FVG'];
const IDM_OPTIONS = ['D', '4H', '1H', 'FP'];

export function HTFSection({ htf, onUpdateHTF }: HTFSectionProps) {
  const showBranch1Next = htf.vc1;
  const showBranch2Next = htf.idm2;

  const isBranch1Complete = htf.vc1 && (htf.vc2 || htf.idm1);
  const isBranch2Complete = htf.idm2 && htf.vc3;
  const isHTFConfirmed = isBranch1Complete || isBranch2Complete;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 md:p-6 flex flex-col h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              HTF — Higher Time Frame
            </h3>
            <p className="text-xs text-slate-400">Structural Bias & Market Structure Confirmation</p>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
            isHTFConfirmed
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isHTFConfirmed ? 'HTF Confirmed' : 'In Progress'}</span>
        </div>
      </div>

      {/* Checklist Content with Progressive Disclosure */}
      <div className="space-y-6 flex-1">
        {/* Branch 1: VC -> VC & IDM */}
        <div className="space-y-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
          <div className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold mb-2 flex items-center gap-1.5">
            <span>Branch A: Volume Confirmation (VC) Sequence</span>
          </div>

          {/* 1. Initial VC */}
          <div className="flex flex-col group">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={htf.vc1}
                    onChange={(e) => onUpdateHTF({ vc1: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                      htf.vc1
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                    }`}
                  >
                    {htf.vc1 && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
                <div>
                  <span className={`text-sm font-medium transition-colors ${htf.vc1 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                    HTF VC (Volume Confirmation)
                  </span>
                  <p className="text-xs text-slate-400">Initial volume confirmation & order flow</p>
                </div>
              </label>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Step 1</span>
            </div>
            <ChipSelector
              options={VC_OPTIONS}
              selectedChips={htf.vc1Chips}
              onChange={(chips) => onUpdateHTF({ vc1Chips: chips })}
              color="blue"
            />
          </div>

          {/* Branching indicator */}
          <AnimatePresence>
            {showBranch1Next && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-6 border-l-2 border-blue-500/30 space-y-4 mt-3 pt-3"
              >
                {/* VC 2 */}
                <div className="flex flex-col group">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={htf.vc2}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onUpdateHTF({ vc2: true, idm1: false });
                            } else {
                              onUpdateHTF({ vc2: false });
                            }
                          }}
                          className="peer sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                            htf.vc2
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                          }`}
                        >
                          {htf.vc2 && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium transition-colors ${htf.vc2 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                          HTF VC (Continuation Volume Confirmation)
                        </span>
                        <p className="text-xs text-slate-400">Secondary volume confirmation reaction</p>
                      </div>
                    </label>
                    <ArrowRight className="w-4 h-4 text-blue-400/60 hidden sm:block" />
                  </div>
                  <ChipSelector
                    options={VC_OPTIONS}
                    selectedChips={htf.vc2Chips}
                    onChange={(chips) => onUpdateHTF({ vc2Chips: chips })}
                    color="blue"
                  />
                </div>

                {/* IDM 1 */}
                <div className="flex flex-col group">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={htf.idm1}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onUpdateHTF({ idm1: true, vc2: false });
                            } else {
                              onUpdateHTF({ idm1: false });
                            }
                          }}
                          className="peer sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                            htf.idm1
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                          }`}
                        >
                          {htf.idm1 && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium transition-colors ${htf.idm1 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                          HTF IDM (Inducement)
                        </span>
                        <p className="text-xs text-slate-400">Inducement sweep / liquidity grab</p>
                      </div>
                    </label>
                    <ArrowRight className="w-4 h-4 text-blue-400/60 hidden sm:block" />
                  </div>
                  <ChipSelector
                    options={IDM_OPTIONS}
                    selectedChips={htf.idm1Chips}
                    onChange={(chips) => onUpdateHTF({ idm1Chips: chips })}
                    color="blue"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Branch 2: IDM -> VC */}
        <div className="space-y-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
          <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
            <span>Branch B: Inducement (IDM) Sequence</span>
          </div>

          {/* 1. Initial IDM */}
          <div className="flex flex-col group">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={htf.idm2}
                    onChange={(e) => onUpdateHTF({ idm2: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                      htf.idm2
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                    }`}
                  >
                    {htf.idm2 && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
                <div>
                  <span className={`text-sm font-medium transition-colors ${htf.idm2 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                    HTF IDM (Inducement)
                  </span>
                  <p className="text-xs text-slate-400">Early inducement liquidity point</p>
                </div>
              </label>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Step 1</span>
            </div>
            <ChipSelector
              options={IDM_OPTIONS}
              selectedChips={htf.idm2Chips}
              onChange={(chips) => onUpdateHTF({ idm2Chips: chips })}
              color="amber"
            />
          </div>

          {/* Branching indicator */}
          <AnimatePresence>
            {showBranch2Next && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-6 border-l-2 border-amber-500/30 space-y-4 mt-3 pt-3"
              >
                {/* VC 3 */}
                <div className="flex flex-col group">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={htf.vc3}
                          onChange={(e) => onUpdateHTF({ vc3: e.target.checked })}
                          className="peer sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                            htf.vc3
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                          }`}
                        >
                          {htf.vc3 && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium transition-colors ${htf.vc3 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                          HTF VC (Volume Confirmation)
                        </span>
                        <p className="text-xs text-slate-400">Volume confirmation after inducement</p>
                      </div>
                    </label>
                    <ArrowRight className="w-4 h-4 text-amber-400/60 hidden sm:block" />
                  </div>
                  <ChipSelector
                    options={VC_OPTIONS}
                    selectedChips={htf.vc3Chips}
                    onChange={(chips) => onUpdateHTF({ vc3Chips: chips })}
                    color="amber"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Card Footer Note */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Either Branch A OR Branch B confirms HTF</span>
        <span className="font-mono text-slate-400">Independent State</span>
      </div>
    </div>
  );
}
