import React, { useState, useRef } from 'react';
import { FolderOpen, CheckCircle2, AlertTriangle, Shield, X, RefreshCw, HardDrive, Upload, BookMarked, FolderSearch } from 'lucide-react';

interface WorkFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string | null;
  isWritable: boolean;
  isSupported: boolean;
  onSelectFolder: () => void;
  onSetVirtualFolder: (path: string) => void;
  onImportReports: (promptPicker?: boolean) => void;
  onUploadFiles?: (files: FileList) => void;
  onOpenSavedTrades?: () => void;
  savedTradesCount?: number;
  importStatus?: string | null;
}

export function WorkFolderModal({
  isOpen,
  onClose,
  folderName,
  isWritable,
  isSupported,
  onSelectFolder,
  onSetVirtualFolder,
  onImportReports,
  onUploadFiles,
  onOpenSavedTrades,
  savedTradesCount = 0,
  importStatus,
}: WorkFolderModalProps) {
  const [customPath, setCustomPath] = useState(folderName || 'C:\\Trading\\TradeJournal');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (folderName) {
      setCustomPath(folderName);
    }
  }, [folderName]);

  if (!isOpen) return null;

  const handleScanClick = async (promptPicker = false) => {
    if (!isSupported) {
      folderInputRef.current?.click();
      return;
    }
    setIsScanning(true);
    try {
      await onImportReports(promptPicker);
    } catch {
      folderInputRef.current?.click();
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
      onUploadFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Local Work Folder Storage</h3>
              <p className="text-xs text-slate-400">Archive trade reports, setup notes, and screenshots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {!isSupported && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <HardDrive className="w-4 h-4 shrink-0" />
                <span>Sandbox / Iframe Mode Active</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Browser `showDirectoryPicker` is restricted inside preview iframes. You can specify your local work folder path below to automatically bundle trade screenshots and reports into organized `.zip` downloads (`EURUSD/TR-YYYYMMDD-###/`).
              </p>
            </div>
          )}

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Target Folder Location</span>
              {folderName ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Active: {folderName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" /> No Folder Configured
                </span>
              )}
            </div>

            {/* Folder Path Input and Actions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300">Set Folder Path:</label>
                <button
                  type="button"
                  onClick={() => {
                    const defaultPath = 'C:\\Trading\\TradeJournal';
                    setCustomPath(defaultPath);
                    onSetVirtualFolder(defaultPath);
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-mono underline cursor-pointer"
                >
                  Set Default (C:\Trading\TradeJournal)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="C:\Trading\TradeJournal"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const targetPath = customPath.trim() || 'C:\\Trading\\TradeJournal';
                    setCustomPath(targetPath);
                    onSetVirtualFolder(targetPath);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm"
                >
                  Set Path
                </button>
                {isSupported && (
                  <button
                    type="button"
                    onClick={onSelectFolder}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors shrink-0 border border-slate-700"
                    title="Select folder via browser directory picker"
                  >
                    Browse Folder
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              When trades are saved or scanned, reports and charts are structured by currency pair (e.g. <code className="text-slate-300 font-mono text-[10px]">{folderName || customPath}\EURUSD\TR-YYYYMMDD-###\</code>).
            </p>
          </div>

          {/* Import / Scan Section */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FolderSearch className="w-3.5 h-3.5 text-blue-400" />
                <span>Scan & Import Trade Reports</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Points to your local work folder ({folderName || customPath}) to read all saved trade setups and images.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleScanClick(false)}
                disabled={isScanning}
                className="flex-1 min-w-[140px] px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning Work Folder...' : folderName ? `Scan Work Folder (${folderName})` : 'Point to Folder & Scan'}</span>
              </button>

              {isSupported && folderName && (
                <button
                  type="button"
                  onClick={() => handleScanClick(true)}
                  disabled={isScanning}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                  title="Pick a different folder location to scan and import"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Other Folder</span>
                </button>
              )}

              <input
                type="file"
                ref={folderInputRef}
                onChange={handleFileChange}
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".json,.zip"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                title="Upload .json or .zip trade reports directly"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload JSON / ZIP</span>
              </button>
            </div>
          </div>

          {importStatus && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between gap-2">
              <span className="leading-snug">{importStatus}</span>
              {onOpenSavedTrades && savedTradesCount > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSavedTrades();
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                >
                  <BookMarked className="w-3 h-3" />
                  <span>View Journal ({savedTradesCount})</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {onOpenSavedTrades && (
            <button
              onClick={() => {
                onClose();
                onOpenSavedTrades();
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Open Saved Trades ({savedTradesCount})</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
