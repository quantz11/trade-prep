import { Check, Sparkles, ShieldAlert, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { LTFState, LTFMode, HTFState } from '../types';
import { ChipSelector } from './ChipSelector';

interface LTFSectionProps {
  ltf: LTFState;
  ltfMode: LTFMode;
  htf: HTFState;
  onUpdateLTF: (updater: Partial<LTFState>) => void;
  onUpdateMode: (mode: LTFMode) => void;
}

const LTF_VC_OPTIONS = ['1H', '15m', '5m', '1m', 'OB', 'RB', 'FVG'];
const LTF_TRIGGER_OPTIONS = ['1H', '15m', '5m', '1m', 'FP', 'FVG'];
const LTF_EXECUTION_OPTIONS = ['1H', '15m', '5m', '1m', 'OB', 'FVG'];

export function LTFSection({ ltf, ltfMode, htf, onUpdateLTF, onUpdateMode }: LTFSectionProps) {
  // Determine if HTF Branch A Step 2 IDM is checked -> HTF VC to IDM sequence active
  const isHTFVCtoIDM = htf.vc1 && htf.idm1;

  // Determine if LTF is confirmed based on active mode
  let isLTFConfirmed = false;
  if (ltfMode === 'trigger_entry') {
    isLTFConfirmed = ltf.trigger1 && ltf.entry1;
  } else if (ltfMode === 'vc_entry') {
    isLTFConfirmed = ltf.vc && ltf.vcEntry;
  } else if (ltfMode === 'vc_trigger_entry') {
    isLTFConfirmed = ltf.vc && ltf.trigger2 && ltf.entry2;
  }

  return (
    <div className={`bg-slate-900 border rounded-2xl shadow-xl p-5 md:p-6 flex flex-col h-full relative overflow-hidden transition-all ${isLTFConfirmed ? 'border-purple-500/30' : 'border-slate-800'}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              LTF — Lower Time Frame
            </h3>
            <p className="text-xs text-slate-400">Execution Trigger & Entry Confirmation</p>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
            isLTFConfirmed
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLTFConfirmed ? 'LTF Confirmed' : 'Pending Trigger'}</span>
        </div>
      </div>

      {/* LTF Setup Mode Selector Tabs */}
      <div className="mb-4 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 grid grid-cols-3 gap-1">
        <button
          disabled={isHTFVCtoIDM}
          onClick={() => onUpdateMode('trigger_entry')}
          className={`py-2 px-2 text-xs font-medium rounded-lg transition-all text-center truncate ${
            isHTFVCtoIDM
              ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed border border-slate-800/50'
              : ltfMode === 'trigger_entry'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title={isHTFVCtoIDM ? 'Restricted: HTF VC → IDM sequence active' : ''}
        >
          Trigger → Entry
        </button>
        <button
          onClick={() => onUpdateMode('vc_trigger_entry')}
          className={`py-2 px-2 text-xs font-medium rounded-lg transition-all text-center truncate ${
            ltfMode === 'vc_trigger_entry'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          VC → Trg → Entry
        </button>
        <button
          onClick={() => onUpdateMode('vc_entry')}
          className={`py-2 px-2 text-xs font-medium rounded-lg transition-all text-center truncate ${
            ltfMode === 'vc_entry'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          VC → Entry
        </button>
      </div>

      {isHTFVCtoIDM && (
        <div className="mb-4 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>HTF VC → IDM active: "Trigger → Entry" LTF mode is restricted.</span>
        </div>
      )}

      {/* Independent State Warning Notice */}
      <div className="mb-4 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
        <span>HTF completion does not auto-unlock LTF. Confirm manually below.</span>
      </div>

      {/* Checklist Content based on Selected Mode */}
      <div className="space-y-4 flex-1">
        {/* Mode 1: Trigger -> Entry */}
        {ltfMode === 'trigger_entry' && (
          <div className="space-y-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold mb-2">
              Sequence 1: Direct Trigger
            </div>

            {/* Trigger 1 */}
            <div className="flex flex-col group">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={ltf.trigger1}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onUpdateLTF({ trigger1: true });
                        } else {
                          onUpdateLTF({ trigger1: false, trigger1Chips: [], entry1: false, entry1Chips: [] });
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                        ltf.trigger1
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                      }`}
                    >
                      {ltf.trigger1 && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <span className={`text-sm font-medium transition-colors ${ltf.trigger1 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                      LTF Trigger (ChoCH / Flip Zone)
                    </span>
                    <p className="text-xs text-slate-400">Immediate market reaction at POI</p>
                  </div>
                </label>
              </div>
              <ChipSelector
                options={LTF_TRIGGER_OPTIONS}
                selectedChips={ltf.trigger1Chips}
                onChange={(chips) => onUpdateLTF({ trigger1Chips: chips })}
                color="purple"
              />
            </div>

            {/* Entry 1 (Unlocked only if trigger1 is checked) */}
            {ltf.trigger1 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="pl-6 border-l-2 border-purple-500/30 pt-2 space-y-2">
                <div className="flex flex-col group">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={ltf.entry1}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onUpdateLTF({ entry1: true });
                            } else {
                              onUpdateLTF({ entry1: false, entry1Chips: [] });
                            }
                          }}
                          className="peer sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                            ltf.entry1
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                          }`}
                        >
                          {ltf.entry1 && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium transition-colors ${ltf.entry1 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                          Execution Entry (Limit / Market)
                        </span>
                        <p className="text-xs text-slate-400">Order placed with defined Stop Loss</p>
                      </div>
                    </label>
                  </div>
                  <ChipSelector
                    options={LTF_EXECUTION_OPTIONS}
                    selectedChips={ltf.entry1Chips}
                    onChange={(chips) => onUpdateLTF({ entry1Chips: chips })}
                    color="purple"
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Mode 2: VC -> Trigger -> Entry */}
        {ltfMode === 'vc_trigger_entry' && (
          <div className="space-y-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold mb-2">
              Sequence 2: Pullback & Trigger
            </div>

            {/* LTF VC */}
            <div className="flex flex-col group">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={ltf.vc}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onUpdateLTF({ vc: true });
                        } else {
                          onUpdateLTF({ vc: false, vcChips: [], vcEntry: false, vcEntryChips: [], trigger2: false, trigger2Chips: [], entry2: false, entry2Chips: [] });
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                        ltf.vc
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                      }`}
                    >
                      {ltf.vc && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <span className={`text-sm font-medium transition-colors ${ltf.vc ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                      LTF VC (Valid Pullback)
                    </span>
                    <p className="text-xs text-slate-400">Internal structure pullback confirmed</p>
                  </div>
                </label>
              </div>
              <ChipSelector
                options={LTF_VC_OPTIONS}
                selectedChips={ltf.vcChips}
                onChange={(chips) => onUpdateLTF({ vcChips: chips })}
                color="purple"
              />
            </div>

            {/* LTF Trigger 2 (Unlocked after LTF VC) */}
            {ltf.vc && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="pl-6 border-l-2 border-purple-500/30 space-y-4 pt-2">
                <div className="flex flex-col group">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={ltf.trigger2}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onUpdateLTF({ trigger2: true });
                            } else {
                              onUpdateLTF({ trigger2: false, trigger2Chips: [], entry2: false, entry2Chips: [] });
                            }
                          }}
                          className="peer sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                            ltf.trigger2
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                          }`}
                        >
                          {ltf.trigger2 && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium transition-colors ${ltf.trigger2 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                          LTF Trigger (Post-VC Confirmation)
                        </span>
                        <p className="text-xs text-slate-400">Secondary execution signal</p>
                      </div>
                    </label>
                  </div>
                  <ChipSelector
                    options={LTF_TRIGGER_OPTIONS}
                    selectedChips={ltf.trigger2Chips}
                    onChange={(chips) => onUpdateLTF({ trigger2Chips: chips })}
                    color="purple"
                  />
                </div>

                {/* Entry 2 (Unlocked after trigger2) */}
                {ltf.trigger2 && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="pl-6 border-l-2 border-purple-500/30 pt-1">
                    <div className="flex flex-col group">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={ltf.entry2}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  onUpdateLTF({ entry2: true });
                                } else {
                                  onUpdateLTF({ entry2: false, entry2Chips: [] });
                                }
                              }}
                              className="peer sr-only"
                            />
                            <div
                              className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                                ltf.entry2
                                  ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                  : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                              }`}
                            >
                              {ltf.entry2 && <Check className="w-4 h-4 stroke-[3]" />}
                            </div>
                          </div>
                          <div>
                            <span className={`text-sm font-medium transition-colors ${ltf.entry2 ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                              Execution Entry (Final)
                            </span>
                            <p className="text-xs text-slate-400">Order execution ready</p>
                          </div>
                        </label>
                      </div>
                      <ChipSelector
                        options={LTF_EXECUTION_OPTIONS}
                        selectedChips={ltf.entry2Chips}
                        onChange={(chips) => onUpdateLTF({ entry2Chips: chips })}
                        color="purple"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Mode 3: VC -> Entry */}
        {ltfMode === 'vc_entry' && (
          <div className="space-y-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold mb-2">
              Sequence 3: Direct VC Entry
            </div>

            {/* LTF VC */}
            <div className="flex flex-col group">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={ltf.vc}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onUpdateLTF({ vc: true });
                        } else {
                          onUpdateLTF({ vc: false, vcChips: [], vcEntry: false, vcEntryChips: [], trigger2: false, trigger2Chips: [], entry2: false, entry2Chips: [] });
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                        ltf.vc
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                      }`}
                    >
                      {ltf.vc && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <span className={`text-sm font-medium transition-colors ${ltf.vc ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                      LTF VC (Valid Pullback)
                    </span>
                    <p className="text-xs text-slate-400">Pullback validated at POI</p>
                  </div>
                </label>
              </div>
              <ChipSelector
                options={LTF_VC_OPTIONS}
                selectedChips={ltf.vcChips}
                onChange={(chips) => onUpdateLTF({ vcChips: chips })}
                color="purple"
              />
            </div>

            {/* VC Entry (Unlocked after LTF VC) */}
            {ltf.vc && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="pl-6 border-l-2 border-purple-500/30 pt-2">
                <div className="flex flex-col group">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={ltf.vcEntry}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onUpdateLTF({ vcEntry: true });
                            } else {
                              onUpdateLTF({ vcEntry: false, vcEntryChips: [] });
                            }
                          }}
                          className="peer sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                            ltf.vcEntry
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
                          }`}
                        >
                          {ltf.vcEntry && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium transition-colors ${ltf.vcEntry ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                          Execution Entry (Direct Pullback)
                        </span>
                        <p className="text-xs text-slate-400">Limit order at extreme zone</p>
                      </div>
                    </label>
                  </div>
                  <ChipSelector
                    options={LTF_EXECUTION_OPTIONS}
                    selectedChips={ltf.vcEntryChips}
                    onChange={(chips) => onUpdateLTF({ vcEntryChips: chips })}
                    color="purple"
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Note */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>LTF trigger requires manual confirmation</span>
        <span className="font-mono text-slate-400">Independent State</span>
      </div>
    </div>
  );
}
