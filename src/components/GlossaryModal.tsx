import { X, BookOpen, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Smart Money Concepts (SMC) Glossary</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 font-mono text-xs font-bold rounded">VC</span>
                <h3 className="font-medium text-white">Volume Confirmation (VC)</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                A verified volume surge and institutional participation signal confirming order flow alignment and structural validity on the Higher Time Frame.
              </p>
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono text-xs font-bold rounded">IDM</span>
                <h3 className="font-medium text-white">Inducement (IDM)</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                A liquidity pool or minor structural liquidity inducement engineered by smart money before reaching the primary HTF POI. Must be factored or swept before entry.
              </p>
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 font-mono text-xs font-bold rounded">Trigger</span>
                <h3 className="font-medium text-white">LTF Trigger</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Lower timeframe execution signal (e.g. 1m/5m change of character or flip zone reaction) confirming institutional participation at the HTF POI.
              </p>
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded">Entry</span>
                <h3 className="font-medium text-white">Execution Entry</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The final limit order or market execution point placed at the mitigated order block or fair value gap (FVG) once all LTF criteria are satisfied.
              </p>
            </div>
          </div>

          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <h4 className="font-semibold text-rose-200 mb-1">Independence Rule (HTF vs LTF)</h4>
              <p className="text-rose-300/90 leading-relaxed text-xs">
                HTF confirmation purely establishes directional bias and structural context. It <strong>never</strong> automatically triggers or unlocks LTF execution triggers. Traders must independently confirm lower timeframe price action before hitting <em>Ready for Entry</em>.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
}
