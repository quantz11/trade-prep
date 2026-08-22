import React, { useState } from 'react';
import { SavedTrade, TradeOutcome } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  ExternalLink,
  Calendar,
  Search,
  Filter,
  Shield,
  Eye,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
  FolderOpen,
  RefreshCw,
  Trophy,
  XCircle,
  Scale,
  Ban,
  Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavedTradesViewProps {
  trades: SavedTrade[];
  onDeleteTrade: (id: string) => void;
  onLoadTrade: (trade: SavedTrade) => void;
  onUpdateOutcome?: (id: string, outcome: TradeOutcome | undefined) => void;
  onClose: () => void;
  onScanWorkFolder?: () => void;
  onOpenWorkFolderModal?: () => void;
  onUploadFiles?: (files: FileList) => void;
  workFolderName?: string | null;
}

const OUTCOME_CONFIG: Record<
  TradeOutcome,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    activeButtonClass: string;
    inactiveButtonClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  WIN: {
    label: 'Win',
    shortLabel: 'Win',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    activeButtonClass: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20',
    inactiveButtonClass: 'bg-slate-950/80 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 border-slate-800',
    icon: Trophy,
  },
  LOSE: {
    label: 'Lose',
    shortLabel: 'Lose',
    badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    activeButtonClass: 'bg-rose-500 text-white font-bold border-rose-400 shadow-md shadow-rose-500/20',
    inactiveButtonClass: 'bg-slate-950/80 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border-slate-800',
    icon: XCircle,
  },
  BREAKEVEN: {
    label: 'Breakeven',
    shortLabel: 'BE',
    badgeClass: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    activeButtonClass: 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20',
    inactiveButtonClass: 'bg-slate-950/80 text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 border-slate-800',
    icon: Scale,
  },
  NO_TRADE: {
    label: 'No Trade',
    shortLabel: 'No Trade',
    badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    activeButtonClass: 'bg-slate-700 text-white font-bold border-slate-600 shadow-md shadow-slate-700/20',
    inactiveButtonClass: 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-slate-800',
    icon: Ban,
  },
};

export function SavedTradesView({
  trades,
  onDeleteTrade,
  onLoadTrade,
  onUpdateOutcome,
  onClose,
  onScanWorkFolder,
  onOpenWorkFolderModal,
  onUploadFiles,
  workFolderName,
}: SavedTradesViewProps) {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingTrade, setViewingTrade] = useState<SavedTrade | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const folderInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleScan = async () => {
    // If running in sandbox/iframe or no native directory handle, trigger folder selection
    if (typeof window !== 'undefined' && window.self !== window.top) {
      folderInputRef.current?.click();
      return;
    }
    if (!onScanWorkFolder) {
      folderInputRef.current?.click();
      return;
    }
    setIsScanning(true);
    try {
      await onScanWorkFolder();
    } catch {
      folderInputRef.current?.click();
    } finally {
      setIsScanning(false);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
      onUploadFiles(e.target.files);
    }
  };

  const handleOutcomeChange = (tradeId: string, outcome: TradeOutcome) => {
    if (!onUpdateOutcome) return;
    const currentTrade = trades.find((t) => t.id === tradeId);
    // If clicking same outcome, allow unmarking or keep it
    const newOutcome = currentTrade?.outcome === outcome ? undefined : outcome;
    onUpdateOutcome(tradeId, newOutcome);

    if (viewingTrade && viewingTrade.id === tradeId) {
      setViewingTrade({
        ...viewingTrade,
        outcome: newOutcome,
      });
    }
  };

  // Outcome statistics
  const winCount = trades.filter((t) => t.outcome === 'WIN').length;
  const loseCount = trades.filter((t) => t.outcome === 'LOSE').length;
  const beCount = trades.filter((t) => t.outcome === 'BREAKEVEN').length;
  const noTradeCount = trades.filter((t) => t.outcome === 'NO_TRADE').length;
  const decidedTrades = winCount + loseCount;
  const winRate = decidedTrades > 0 ? Math.round((winCount / decidedTrades) * 100) : null;

  const filteredTrades = trades.filter((trade) => {
    const matchesInstrument = selectedInstrument === 'ALL' || trade.config.instrument === selectedInstrument;
    const matchesStatus = selectedStatus === 'ALL' || trade.status === selectedStatus;
    const matchesOutcome =
      selectedOutcome === 'ALL'
        ? true
        : selectedOutcome === 'UNMARKED'
        ? !trade.outcome
        : trade.outcome === selectedOutcome;
    const matchesSearch =
      trade.config.instrument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.config.bias.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesInstrument && matchesStatus && matchesOutcome && matchesSearch;
  });

  const instruments = ['ALL', ...Array.from(new Set(trades.map((t) => t.config.instrument)))];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Saved Trades Journal
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {trades.length} Total
              </span>
            </h2>
            <p className="text-xs text-slate-400">Review executed setups, notes, mark trade outcomes, and view screenshots</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderChange}
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
          />
          {onScanWorkFolder && (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Scan Work Folder to import saved trade reports"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : workFolderName ? `Scan (${workFolderName})` : 'Scan Work Folder'}</span>
            </button>
          )}

          {onOpenWorkFolderModal && (
            <button
              onClick={onOpenWorkFolderModal}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700"
              title="Configure Work Folder"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 border border-slate-700"
          >
            <X className="w-4 h-4" />
            <span>Back to Checklist</span>
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6 flex-1">
        {/* Outcome Stats Overview Strip */}
        {trades.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Win Rate</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {winRate !== null ? `${winRate}%` : '—'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Wins</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{winCount}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Losses</span>
                <span className="text-xl font-bold font-mono text-rose-400">{loseCount}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Breakeven</span>
                <span className="text-xl font-bold font-mono text-amber-400">{beCount}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">No Trade</span>
                <span className="text-xl font-bold font-mono text-slate-300">{noTradeCount}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Outcome:</span>
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Outcomes</option>
                <option value="WIN" className="bg-slate-900">Win ({winCount})</option>
                <option value="LOSE" className="bg-slate-900">Lose ({loseCount})</option>
                <option value="BREAKEVEN" className="bg-slate-900">Breakeven ({beCount})</option>
                <option value="NO_TRADE" className="bg-slate-900">No Trade ({noTradeCount})</option>
                <option value="UNMARKED" className="bg-slate-900">Unmarked</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-xs text-slate-400 font-medium">Instrument:</span>
              <select
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
              >
                {instruments.map((inst) => (
                  <option key={inst} value={inst} className="bg-slate-900">
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Statuses</option>
                <option value="EXECUTED" className="bg-slate-900">Executed</option>
                <option value="SAVED" className="bg-slate-900">Saved</option>
              </select>
            </div>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by instrument..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Trades Grid */}
        {filteredTrades.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4 max-w-md mx-auto p-6">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">No Saved Trades Found</h3>
              <p className="text-xs text-slate-400">
                Execute a trade or point to your Work Folder to scan and import existing trade archives.
              </p>
            </div>

            {onScanWorkFolder && (
              <div className="pt-2">
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning Work Folder...' : workFolderName ? `Scan Work Folder (${workFolderName})` : 'Scan & Import Work Folder'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrades.map((trade) => {
              const dateStr = new Date(trade.createdAt).toLocaleString();
              const outcomeInfo = trade.outcome ? OUTCOME_CONFIG[trade.outcome] : null;

              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Card Top: Pair, Bias & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{trade.config.instrument}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                            trade.config.bias === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {trade.config.bias === 'LONG' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {trade.config.bias}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {outcomeInfo && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${outcomeInfo.badgeClass}`}>
                            <outcomeInfo.icon className="w-3 h-3" />
                            <span>{outcomeInfo.label}</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {trade.status}
                        </span>
                      </div>
                    </div>

                    {/* Outcome Quick Marking Buttons */}
                    <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        <span>Trade Result</span>
                        {trade.outcome && (
                          <button
                            type="button"
                            onClick={() => onUpdateOutcome && onUpdateOutcome(trade.id, undefined)}
                            className="text-slate-500 hover:text-slate-300 transition-colors normal-case text-[10px]"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['WIN', 'LOSE', 'BREAKEVEN', 'NO_TRADE'] as TradeOutcome[]).map((oc) => {
                          const cfg = OUTCOME_CONFIG[oc];
                          const isSelected = trade.outcome === oc;
                          const IconComp = cfg.icon;
                          return (
                            <button
                              key={oc}
                              type="button"
                              onClick={() => handleOutcomeChange(trade.id, oc)}
                              className={`py-1.5 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                isSelected ? cfg.activeButtonClass : cfg.inactiveButtonClass
                              }`}
                              title={`Mark as ${cfg.label}`}
                            >
                              <IconComp className="w-3 h-3 shrink-0" />
                              <span className="truncate">{cfg.shortLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>

                    {/* Checklist Steps & Chips Preview */}
                    <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-1">
                      {[
                        { label: 'HTF VC1', checked: trade.htf.vc1, chips: trade.htf.vc1Chips, text: trade.htf.vc1Text, image: trade.htf.vc1Image },
                        { label: 'HTF VC2', checked: trade.htf.vc2, chips: trade.htf.vc2Chips, text: trade.htf.vc2Text, image: trade.htf.vc2Image },
                        { label: 'HTF IDM1', checked: trade.htf.idm1, chips: trade.htf.idm1Chips, text: trade.htf.idm1Text, image: trade.htf.idm1Image },
                        { label: 'HTF IDM2', checked: trade.htf.idm2, chips: trade.htf.idm2Chips, text: trade.htf.idm2Text, image: trade.htf.idm2Image },
                        { label: 'HTF VC3', checked: trade.htf.vc3, chips: trade.htf.vc3Chips, text: trade.htf.vc3Text, image: trade.htf.vc3Image },
                        { label: 'LTF Trigger 1', checked: trade.ltf.trigger1, chips: trade.ltf.trigger1Chips, text: trade.ltf.trigger1Text, image: trade.ltf.trigger1Image },
                        { label: 'LTF Entry 1', checked: trade.ltf.entry1, chips: trade.ltf.entry1Chips, text: trade.ltf.entry1Text, image: trade.ltf.entry1Image },
                        { label: 'LTF VC', checked: trade.ltf.vc, chips: trade.ltf.vcChips, text: trade.ltf.vcText, image: trade.ltf.vcImage },
                        { label: 'LTF VC Entry', checked: trade.ltf.vcEntry, chips: trade.ltf.vcEntryChips, text: trade.ltf.vcEntryText, image: trade.ltf.vcEntryImage },
                        { label: 'LTF Trigger 2', checked: trade.ltf.trigger2, chips: trade.ltf.trigger2Chips, text: trade.ltf.trigger2Text, image: trade.ltf.trigger2Image },
                        { label: 'LTF Entry 2', checked: trade.ltf.entry2, chips: trade.ltf.entry2Chips, text: trade.ltf.entry2Text, image: trade.ltf.entry2Image },
                      ]
                        .filter((item) => item.checked)
                        .map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-white tracking-wide">{item.label}</span>
                              </div>
                              {item.chips && item.chips.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  {item.chips.map((c) => (
                                    <span key={c} className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-900 text-blue-400 border border-slate-700/80">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {item.text && <p className="text-[11px] text-slate-300 line-clamp-2 pl-7">{item.text}</p>}
                            {item.image && (
                              <div className="pl-7 relative group">
                                <div
                                  onClick={() => setLightboxImage(item.image ?? null)}
                                  className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 h-20 flex items-center justify-center cursor-pointer relative"
                                >
                                  <img src={item.image} alt={item.label} className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxImage(item.image ?? null);
                                      }}
                                      className="p-1.5 rounded-full bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 transition-all shadow-md"
                                      title="Expand image full"
                                    >
                                      <Maximize2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      {!(
                        trade.htf.vc1 || trade.htf.vc2 || trade.htf.idm1 || trade.htf.idm2 || trade.htf.vc3 ||
                        trade.ltf.trigger1 || trade.ltf.entry1 || trade.ltf.vc || trade.ltf.vcEntry || trade.ltf.trigger2 || trade.ltf.entry2
                      ) && (
                        <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500 italic">
                          No checklist steps completed for this trade.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
                    <button
                      onClick={() => setViewingTrade(trade)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => {
                        onLoadTrade(trade);
                        onClose();
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Load Setup</span>
                    </button>
                    <button
                      onClick={() => onDeleteTrade(trade.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
                      title="Delete trade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {viewingTrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {viewingTrade.config.instrument} Trade Details
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        viewingTrade.config.bias === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {viewingTrade.config.bias}
                    </span>
                    {viewingTrade.outcome && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${OUTCOME_CONFIG[viewingTrade.outcome].badgeClass}`}>
                        {React.createElement(OUTCOME_CONFIG[viewingTrade.outcome].icon, { className: 'w-3 h-3' })}
                        <span>{OUTCOME_CONFIG[viewingTrade.outcome].label}</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">{new Date(viewingTrade.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setViewingTrade(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Result Marking in Modal */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                    Mark Trade Outcome
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['WIN', 'LOSE', 'BREAKEVEN', 'NO_TRADE'] as TradeOutcome[]).map((oc) => {
                      const cfg = OUTCOME_CONFIG[oc];
                      const isSelected = viewingTrade.outcome === oc;
                      const IconComp = cfg.icon;
                      return (
                        <button
                          key={oc}
                          type="button"
                          onClick={() => handleOutcomeChange(viewingTrade.id, oc)}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                            isSelected ? cfg.activeButtonClass : cfg.inactiveButtonClass
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5 shrink-0" />
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Entry Price</span>
                    <span className="text-sm font-mono font-bold text-white">{Number(viewingTrade.config.entryPrice).toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Stop Loss</span>
                    <span className="text-sm font-mono font-bold text-rose-400">{Number(viewingTrade.config.stopLoss).toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Take Profit</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{Number(viewingTrade.config.takeProfit).toFixed(5)}</span>
                  </div>
                </div>

                {/* Step Notes and Images Check */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Checklist Notes & Screenshots</h4>
                  {[
                    { label: 'HTF VC1', checked: viewingTrade.htf.vc1, text: viewingTrade.htf.vc1Text, image: viewingTrade.htf.vc1Image, chips: viewingTrade.htf.vc1Chips },
                    { label: 'HTF VC2', checked: viewingTrade.htf.vc2, text: viewingTrade.htf.vc2Text, image: viewingTrade.htf.vc2Image, chips: viewingTrade.htf.vc2Chips },
                    { label: 'HTF IDM1', checked: viewingTrade.htf.idm1, text: viewingTrade.htf.idm1Text, image: viewingTrade.htf.idm1Image, chips: viewingTrade.htf.idm1Chips },
                    { label: 'HTF IDM2', checked: viewingTrade.htf.idm2, text: viewingTrade.htf.idm2Text, image: viewingTrade.htf.idm2Image, chips: viewingTrade.htf.idm2Chips },
                    { label: 'HTF VC3', checked: viewingTrade.htf.vc3, text: viewingTrade.htf.vc3Text, image: viewingTrade.htf.vc3Image, chips: viewingTrade.htf.vc3Chips },
                    { label: 'LTF Trigger 1', checked: viewingTrade.ltf.trigger1, text: viewingTrade.ltf.trigger1Text, image: viewingTrade.ltf.trigger1Image, chips: viewingTrade.ltf.trigger1Chips },
                    { label: 'LTF Entry 1', checked: viewingTrade.ltf.entry1, text: viewingTrade.ltf.entry1Text, image: viewingTrade.ltf.entry1Image, chips: viewingTrade.ltf.entry1Chips },
                    { label: 'LTF VC', checked: viewingTrade.ltf.vc, text: viewingTrade.ltf.vcText, image: viewingTrade.ltf.vcImage, chips: viewingTrade.ltf.vcChips },
                    { label: 'LTF VC Entry', checked: viewingTrade.ltf.vcEntry, text: viewingTrade.ltf.vcEntryText, image: viewingTrade.ltf.vcEntryImage, chips: viewingTrade.ltf.vcEntryChips },
                    { label: 'LTF Trigger 2', checked: viewingTrade.ltf.trigger2, text: viewingTrade.ltf.trigger2Text, image: viewingTrade.ltf.trigger2Image, chips: viewingTrade.ltf.trigger2Chips },
                    { label: 'LTF Entry 2', checked: viewingTrade.ltf.entry2, text: viewingTrade.ltf.entry2Text, image: viewingTrade.ltf.entry2Image, chips: viewingTrade.ltf.entry2Chips },
                  ]
                    .filter((step) => step.checked && (step.text || step.image || (step.chips && step.chips.length > 0)))
                    .map((step) => (
                      <div key={step.label} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {step.label}
                          </span>
                          {step.chips && step.chips.length > 0 && (
                            <div className="flex items-center gap-1">
                              {step.chips.map((c) => (
                                <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {step.text && <p className="text-xs text-slate-300 leading-relaxed font-sans">{step.text}</p>}
                        {step.image && (
                          <div
                            onClick={() => setLightboxImage(step.image ?? null)}
                            className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-60 flex items-center justify-center relative group cursor-pointer"
                          >
                            <img src={step.image} alt={step.label} className="max-h-56 w-full object-contain rounded" />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImage(step.image ?? null);
                                }}
                                className="p-2 rounded-full bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 transition-all shadow-md"
                                title="Expand image full"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const idToDelete = viewingTrade.id;
                    setViewingTrade(null);
                    onDeleteTrade(idToDelete);
                  }}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Delete trade from journal & local work folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Trade</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onLoadTrade(viewingTrade);
                      setViewingTrade(null);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Load Setup into Checklist</span>
                  </button>
                  <button
                    onClick={() => setViewingTrade(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Full size screenshot"
                className="max-w-full max-h-[85vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 transition-all shadow-xl border border-slate-700"
                title="Close full view"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
