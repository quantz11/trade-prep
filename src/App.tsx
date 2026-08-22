import { useState, useEffect, useRef } from 'react';
import { db, auth } from './lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { cleanObjectForFirestore, rehydrateImagesFromLocal } from './lib/imageStorage';
import { AuthScreen } from './components/AuthScreen';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  const isOfflineOrUnavailable =
    errStr.includes('unavailable') ||
    errStr.includes('offline') ||
    errStr.includes('Could not reach Cloud Firestore backend') ||
    errStr.includes('Failed to get document because the client is offline');

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isOfflineOrUnavailable) {
    console.warn(`[Firestore Offline Fallback] Operation: ${operationType} on ${path}. Firestore will sync when reconnected.`);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (errStr.includes('permission') || errStr.includes('PERMISSION_DENIED') || errStr.includes('Missing or insufficient permissions')) {
    throw new Error(JSON.stringify(errInfo));
  }
}
import { Header } from './components/Header';
import { StatusBanner } from './components/StatusBanner';
import { HTFSection } from './components/HTFSection';
import { LTFSection } from './components/LTFSection';
import { RiskCalculator } from './components/RiskCalculator';
import { GlossaryModal } from './components/GlossaryModal';
import { TradeSuccessModal } from './components/TradeSuccessModal';
import { SavedTradesView } from './components/SavedTradesView';
import { WorkFolderModal } from './components/WorkFolderModal';
import { MultiPairWatchlist, PairSession } from './components/MultiPairWatchlist';
import { HTFState, LTFState, LTFMode, TradeConfig, SavedTrade, TradeOutcome } from './types';
import {
  isFileSystemAccessSupported,
  isAIStudioEnvironment,
  saveTradeToWorkFolder,
  getPersistedDirHandle,
  persistDirHandle,
  scanAndImportWorkFolder,
  importTradesFromUploadedFiles,
  updateTradeOutcomeInWorkFolder,
  deleteTradeFromWorkFolder,
} from './lib/workFolder';

export default function App() {
  const [pairs, setPairs] = useState<Record<string, PairSession>>({
    'EURUSD': {
      instrument: 'EURUSD',
      config: {
        instrument: 'EURUSD',
        bias: 'LONG',
        accountBalance: 100000,
        riskPercentage: 1.0,
        entryPrice: 1.08500,
        stopLoss: 1.08350,
        takeProfit: 1.08800,
      },
      htf: { vc1: false, vc2: false, idm1: false, idm2: false, vc3: false },
      ltf: { trigger1: false, entry1: false, vc: false, vcEntry: false, trigger2: false, entry2: false },
      ltfMode: 'trigger_entry',
    },
    'GBPUSD': {
      instrument: 'GBPUSD',
      config: {
        instrument: 'GBPUSD',
        bias: 'SHORT',
        accountBalance: 100000,
        riskPercentage: 1.0,
        entryPrice: 1.27500,
        stopLoss: 1.27650,
        takeProfit: 1.27200,
      },
      htf: { vc1: false, vc2: false, idm1: false, idm2: false, vc3: false },
      ltf: { trigger1: false, entry1: false, vc: false, vcEntry: false, trigger2: false, entry2: false },
      ltfMode: 'trigger_entry',
    },
  });

  const [activeInstrument, setActiveInstrument] = useState<string>('EURUSD');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('trade_authenticated') === 'true';
  });
  const [savedTrades, setSavedTrades] = useState<SavedTrade[]>([]);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isSavedTradesOpen, setIsSavedTradesOpen] = useState(false);
  const [isWorkFolderOpen, setIsWorkFolderOpen] = useState(false);
  const [workDirHandle, setWorkDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [workFolderName, setWorkFolderName] = useState<string | null>(null);
  const [isVirtualFolder, setIsVirtualFolder] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const isRemoteUpdate = useRef(false);

  // Sync state with Firestore in real-time
  useEffect(() => {
    const docRef = doc(db, 'sessions', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.pairs) {
          try {
            const parsedPairs = JSON.parse(data.pairs);
            const rehydratedPairs = rehydrateImagesFromLocal(parsedPairs);
            isRemoteUpdate.current = true;
            setPairs(rehydratedPairs);
            if (data.activeInstrument && rehydratedPairs[data.activeInstrument]) {
              setActiveInstrument(data.activeInstrument);
            }
          } catch (e) {
            console.error('Error parsing pairs from Firestore', e);
          }
        }
        if (data.savedTrades) {
          try {
            const parsedTrades = JSON.parse(data.savedTrades);
            const rehydratedTrades = rehydrateImagesFromLocal(parsedTrades);
            setSavedTrades(rehydratedTrades);
          } catch (e) {
            console.error('Error parsing savedTrades from Firestore', e);
          }
        }
      } else {
        const cleanPairs = cleanObjectForFirestore(pairs);
        const cleanTrades = cleanObjectForFirestore(savedTrades);
        setDoc(
          docRef,
          {
            pairs: JSON.stringify(cleanPairs),
            savedTrades: JSON.stringify(cleanTrades),
            activeInstrument,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'sessions/main'));
      }
      setIsFirebaseLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sessions/main');
      setIsFirebaseLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedFolder = localStorage.getItem('trade_work_folder_name') || 'C:\\Trading\\TradeJournal';
    const virtualMode = localStorage.getItem('trade_work_folder_virtual') !== 'false';
    setWorkFolderName(savedFolder);
    setIsVirtualFolder(virtualMode);
    if (!localStorage.getItem('trade_work_folder_name')) {
      localStorage.setItem('trade_work_folder_name', 'C:\\Trading\\TradeJournal');
      localStorage.setItem('trade_work_folder_virtual', 'true');
    }
    if (!virtualMode && isFileSystemAccessSupported()) {
      getPersistedDirHandle().then((handle) => {
        if (handle) {
          setWorkDirHandle(handle);
        }
      });
    }
  }, []);

  // Save state updates to Firestore (without sending heavy image binaries)
  useEffect(() => {
    if (!isFirebaseLoaded) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const cleanPairs = cleanObjectForFirestore(pairs);
    const cleanTrades = cleanObjectForFirestore(savedTrades);

    const docRef = doc(db, 'sessions', 'main');
    setDoc(
      docRef,
      {
        pairs: JSON.stringify(cleanPairs),
        savedTrades: JSON.stringify(cleanTrades),
        activeInstrument,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, 'sessions/main');
    });
  }, [pairs, savedTrades, activeInstrument, isFirebaseLoaded]);

  const currentPair = pairs[activeInstrument] || pairs['EUR/USD'] || Object.values(pairs)[0];
  const htf = currentPair?.htf || { vc1: false, vc2: false, idm1: false, idm2: false, vc3: false };
  const ltf = currentPair?.ltf || { trigger1: false, entry1: false, vc: false, vcEntry: false, trigger2: false, entry2: false };
  const ltfMode = currentPair?.ltfMode || 'trigger_entry';
  const config = currentPair?.config || { instrument: activeInstrument, bias: 'LONG', accountBalance: 100000, riskPercentage: 1.0, entryPrice: 1.085, stopLoss: 1.0835, takeProfit: 1.088 };

  const updateCurrentPair = (updater: { htf?: Partial<HTFState>; ltf?: Partial<LTFState>; ltfMode?: LTFMode; config?: Partial<TradeConfig> }, targetInst?: string) => {
    const inst = targetInst || activeInstrument;
    setPairs((prev) => {
      const current = prev[inst];
      if (!current) return prev;
      return {
        ...prev,
        [inst]: {
          ...current,
          ...(updater.htf ? { htf: { ...current.htf, ...updater.htf } } : {}),
          ...(updater.ltf ? { ltf: { ...current.ltf, ...updater.ltf } } : {}),
          ...(updater.ltfMode ? { ltfMode: updater.ltfMode } : {}),
          ...(updater.config ? { config: { ...current.config, ...updater.config } } : {}),
        },
      };
    });
  };

  const handleUpdateHTF = (updater: Partial<HTFState>) => {
    const nextHtf = { ...htf, ...updater };
    const isUpdatingBranchA = 'vc1' in updater || 'vc2' in updater || 'idm1' in updater;
    const isUpdatingBranchB = 'idm2' in updater || 'vc3' in updater;

    if (isUpdatingBranchA && (nextHtf.vc1 || nextHtf.vc2 || nextHtf.idm1)) {
      nextHtf.idm2 = false;
      nextHtf.vc3 = false;
    } else if (isUpdatingBranchB && (nextHtf.idm2 || nextHtf.vc3)) {
      nextHtf.vc1 = false;
      nextHtf.vc2 = false;
      nextHtf.idm1 = false;
    }

    let nextMode = ltfMode;
    if (nextHtf.vc1 && nextHtf.idm1 && ltfMode === 'trigger_entry') {
      nextMode = 'vc_trigger_entry';
    }

    updateCurrentPair({ htf: nextHtf, ltfMode: nextMode });
  };

  const handleUpdateLTF = (updater: Partial<LTFState>) => {
    updateCurrentPair({ ltf: { ...ltf, ...updater } });
  };

  const handleReset = () => {
    updateCurrentPair({
      htf: {
        vc1: false, vc1Chips: [],
        vc2: false, vc2Chips: [],
        idm1: false, idm1Chips: [],
        idm2: false, idm2Chips: [],
        vc3: false, vc3Chips: []
      },
      ltf: {
        trigger1: false, trigger1Chips: [],
        entry1: false, entry1Chips: [],
        vc: false, vcChips: [],
        vcEntry: false, vcEntryChips: [],
        trigger2: false, trigger2Chips: [],
        entry2: false, entry2Chips: []
      },
    });
  };

  const handleAddPair = (inst: string) => {
    if (pairs[inst]) return;
    setPairs((prev) => ({
      ...prev,
      [inst]: {
        instrument: inst,
        config: {
          instrument: inst,
          bias: 'LONG',
          accountBalance: 100000,
          riskPercentage: 1.0,
          entryPrice: 1.08500,
          stopLoss: 1.08350,
          takeProfit: 1.08800,
        },
        htf: { vc1: false, vc2: false, idm1: false, idm2: false, vc3: false },
        ltf: { trigger1: false, entry1: false, vc: false, vcEntry: false, trigger2: false, entry2: false },
        ltfMode: 'trigger_entry',
      },
    }));
  };

  const handleRemovePair = (inst: string) => {
    const keys = Object.keys(pairs);
    if (keys.length <= 1) return; // Keep at least one
    const remaining = keys.filter((k) => k !== inst);
    const nextActive = remaining[0];
    const newPairs = { ...pairs };
    delete newPairs[inst];
    setPairs(newPairs);
    setActiveInstrument(nextActive);
  };

  const handleSelectPair = (inst: string) => {
    setActiveInstrument(inst);
    updateCurrentPair({ config: { instrument: inst } }, inst);
  };

  const generateTradeId = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `TR-${dateStr}-${rand}`;
  };

  const handleSetVirtualFolder = async (path?: string) => {
    const finalPath = (path && path.trim()) ? path.trim() : 'C:\\Trading\\TradeJournal';
    setWorkFolderName(finalPath);
    setIsVirtualFolder(true);
    setWorkDirHandle(null);
    localStorage.setItem('trade_work_folder_name', finalPath);
    localStorage.setItem('trade_work_folder_virtual', 'true');
    await persistDirHandle(null);
    setImportStatus(`Work folder path set to default "${finalPath}".`);
  };

  const handleSelectWorkFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      setImportStatus(`File System picker is restricted in this browser environment. Using path "${workFolderName || 'C:\\Trading\\TradeJournal'}".`);
      return;
    }
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker({
        id: 'TradeJournalWorkFolder',
        mode: 'readwrite',
      });
      setWorkDirHandle(handle);
      const chosenName = handle.name;
      const updatedPath = (workFolderName && workFolderName.endsWith(chosenName)) ? workFolderName : chosenName;
      setWorkFolderName(updatedPath);
      setIsVirtualFolder(false);
      localStorage.setItem('trade_work_folder_name', updatedPath);
      localStorage.setItem('trade_work_folder_virtual', 'false');
      await persistDirHandle(handle);
      setImportStatus(`Work folder connected to "${updatedPath}".`);
    } catch (e) {
      console.warn('Folder selection cancelled or restricted:', e);
      setImportStatus(`Work folder pointing to "${workFolderName || 'C:\\Trading\\TradeJournal'}".`);
    }
  };

  const handleImportReports = async (promptPicker: boolean = false) => {
    try {
      setImportStatus('Scanning work folder for trade reports...');
      const res = await scanAndImportWorkFolder(workDirHandle, promptPicker, isVirtualFolder);
      if (res.updatedDirHandle) {
        setWorkDirHandle(res.updatedDirHandle);
        setWorkFolderName(res.updatedDirHandle.name);
        setIsVirtualFolder(false);
        localStorage.setItem('trade_work_folder_name', res.updatedDirHandle.name);
        localStorage.setItem('trade_work_folder_virtual', 'false');
      }

      if (res.success) {
        if (res.trades.length > 0) {
          const sorted = [...res.trades].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setSavedTrades(sorted);
          setImportStatus(`Successfully scanned and imported ${res.count} trade report(s) from "${res.updatedDirHandle?.name || workFolderName || 'Work Folder'}" (replaced previous journal data).`);
        } else {
          setImportStatus(`No trade reports (report.json) found in folder "${res.updatedDirHandle?.name || workFolderName || 'selected folder'}".`);
        }
      } else {
        setImportStatus(res.error || 'Could not access work folder.');
      }
    } catch (e) {
      console.error(e);
      setImportStatus('Error scanning work folder.');
    }
  };

  const handleUploadReports = async (files: FileList) => {
    try {
      const fileArray = Array.from(files);
      const firstRelPath = fileArray[0]?.webkitRelativePath;
      const rootFolder = firstRelPath ? firstRelPath.split('/')[0] : null;

      setImportStatus(`Processing trade report(s) from ${rootFolder || workFolderName || 'folder'}...`);
      const imported = await importTradesFromUploadedFiles(files);

      if (imported.length > 0) {
        const sorted = [...imported].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSavedTrades(sorted);
        setImportStatus(`Successfully scanned and imported ${imported.length} trade report(s) from "${rootFolder || workFolderName || 'Work Folder'}" (replaced previous journal data).`);
      } else {
        setImportStatus(`No trade reports (report.json) found in selected files/folder "${rootFolder || workFolderName || 'Work Folder'}".`);
      }
    } catch (e) {
      console.error(e);
      setImportStatus('Error importing trade reports.');
    }
  };

  const helperSaveToWorkFolder = async (newTrade: SavedTrade) => {
    const res = await saveTradeToWorkFolder(workDirHandle, isVirtualFolder, workFolderName, newTrade);
    if (res.updatedDirHandle && !workDirHandle) {
      setWorkDirHandle(res.updatedDirHandle);
      setWorkFolderName(res.updatedDirHandle.name);
      setIsVirtualFolder(false);
      localStorage.setItem('trade_work_folder_name', res.updatedDirHandle.name);
      localStorage.setItem('trade_work_folder_virtual', 'false');
    }
    if (res.success) {
      newTrade.sync = {
        local: true,
        firebase: true,
        status: 'SYNCED',
        lastSyncedAt: new Date().toISOString(),
      };
      // If ZIP blob is generated (only in AI Studio sandbox mode), offer download
      if (res.zipBlob) {
        const url = URL.createObjectURL(res.zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${newTrade.config.instrument}-${newTrade.id}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } else {
      newTrade.sync = {
        local: false,
        firebase: true,
        status: 'LOCAL ERROR',
      };
    }
  };

  const handleExecuteTrade = async () => {
    const tradeId = generateTradeId();
    const newTrade: SavedTrade = {
      id: tradeId,
      createdAt: new Date().toISOString(),
      config: { ...config },
      htf: { ...htf },
      ltf: { ...ltf },
      ltfMode,
      status: 'EXECUTED',
      sync: {
        local: false,
        firebase: true,
        status: workFolderName || !isAIStudioEnvironment() ? 'PENDING LOCAL' : 'FIREBASE ONLY',
      },
    };

    if (workFolderName || (!isAIStudioEnvironment() && isFileSystemAccessSupported())) {
      await helperSaveToWorkFolder(newTrade);
    }

    setSavedTrades((prev) => [newTrade, ...prev]);
    setIsTradeModalOpen(true);
  };

  const handleSaveSetup = async () => {
    const tradeId = generateTradeId();
    const newTrade: SavedTrade = {
      id: tradeId,
      createdAt: new Date().toISOString(),
      config: { ...config },
      htf: { ...htf },
      ltf: { ...ltf },
      ltfMode,
      status: 'SAVED',
      sync: {
        local: false,
        firebase: true,
        status: workFolderName || !isAIStudioEnvironment() ? 'PENDING LOCAL' : 'FIREBASE ONLY',
      },
    };

    if (workFolderName || (!isAIStudioEnvironment() && isFileSystemAccessSupported())) {
      await helperSaveToWorkFolder(newTrade);
    }

    setSavedTrades((prev) => [newTrade, ...prev]);
    setIsSavedTradesOpen(true);
  };

  const handleDeleteTrade = (id: string) => {
    const tradeToDelete = savedTrades.find((t) => t.id === id);
    setSavedTrades((prev) => prev.filter((t) => t.id !== id));

    deleteTradeFromWorkFolder(id, tradeToDelete?.config.instrument, workDirHandle)
      .then((res) => {
        if (res.success) {
          console.log(`Deleted trade ${id} from local work folder`);
        } else if (res.error) {
          console.warn('Notice removing trade from work folder:', res.error);
        }
      })
      .catch((err) => {
        console.warn('Error deleting trade from work folder:', err);
      });
  };

  const handleUpdateTradeOutcome = (id: string, outcome: TradeOutcome | undefined) => {
    setSavedTrades((prev) => {
      const updatedTrades = prev.map((t) => (t.id === id ? { ...t, outcome } : t));
      const targetTrade = updatedTrades.find((t) => t.id === id);
      if (targetTrade) {
        updateTradeOutcomeInWorkFolder(targetTrade, workDirHandle)
          .then((res) => {
            if (res.success) {
              console.log(`result.json updated in local work folder for trade ${id}`);
            } else {
              console.warn('Could not update work folder result.json:', res.error);
            }
          })
          .catch((err) => {
            console.warn('Error updating work folder outcome:', err);
          });
      }
      return updatedTrades;
    });
  };

  const handleLoadTrade = (trade: SavedTrade) => {
    const inst = trade.config.instrument;
    if (!pairs[inst]) {
      handleAddPair(inst);
    }
    setActiveInstrument(inst);
    setPairs((prev) => ({
      ...prev,
      [inst]: {
        instrument: inst,
        config: { ...trade.config },
        htf: { ...trade.htf },
        ltf: { ...trade.ltf },
        ltfMode: trade.ltfMode,
      },
    }));
  };

  // Determine readiness for entry calculator highlight
  const isBranch1Complete = htf.vc1 && (htf.vc2 || htf.idm1);
  const isBranch2Complete = htf.idm2 && htf.vc3;
  const isHTFConfirmed = isBranch1Complete || isBranch2Complete;

  let isLTFConfirmed = false;
  if (ltfMode === 'trigger_entry') {
    isLTFConfirmed = ltf.trigger1 && ltf.entry1;
  } else if (ltfMode === 'vc_entry') {
    isLTFConfirmed = ltf.vc && ltf.vcEntry;
  } else if (ltfMode === 'vc_trigger_entry') {
    isLTFConfirmed = ltf.vc && ltf.trigger2 && ltf.entry2;
  }

  const isReadyForEntry = isHTFConfirmed && isLTFConfirmed;

  const handleLockWorkstation = () => {
    sessionStorage.removeItem('trade_authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        config={config}
        onUpdateConfig={(updater) => {
          if (updater.instrument && updater.instrument !== activeInstrument) {
            setActiveInstrument(updater.instrument);
            if (!pairs[updater.instrument]) {
              handleAddPair(updater.instrument);
            }
            updateCurrentPair({ config: updater }, updater.instrument);
          } else {
            updateCurrentPair({ config: updater });
          }
        }}
        onReset={handleReset}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenSavedTrades={() => setIsSavedTradesOpen(true)}
        onOpenWorkFolder={() => setIsWorkFolderOpen(true)}
        onLockWorkstation={handleLockWorkstation}
        savedTradesCount={savedTrades.length}
        workFolderName={workFolderName}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Multi-Pair Watchlist Bar */}
        <MultiPairWatchlist
          pairs={pairs}
          activeInstrument={activeInstrument}
          onSelectPair={handleSelectPair}
          onAddPair={handleAddPair}
          onRemovePair={handleRemovePair}
        />

        {/* Status Banner */}
        <StatusBanner
          htf={htf}
          ltf={ltf}
          ltfMode={ltfMode}
          onExecuteTrade={handleExecuteTrade}
          onSaveTrade={handleSaveSetup}
        />

        {/* Two Independent Columns for HTF and LTF */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* HTF Section */}
          <HTFSection htf={htf} onUpdateHTF={handleUpdateHTF} />

          {/* LTF Section */}
          <LTFSection
            ltf={ltf}
            ltfMode={ltfMode}
            htf={htf}
            onUpdateLTF={handleUpdateLTF}
            onUpdateMode={(mode) => updateCurrentPair({ ltfMode: mode })}
          />
        </div>

        {/* Risk Calculator Section */}
        <RiskCalculator
          config={config}
          onUpdateConfig={(updater) => updateCurrentPair({ config: updater })}
          isReady={isReadyForEntry}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-400">
        <p>Quantz • Multi-Pair Higher & Lower Time Frame Checklist System</p>
      </footer>

      {/* Glossary Modal */}
      <GlossaryModal isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />

      {/* Trade Success Modal */}
      <TradeSuccessModal isOpen={isTradeModalOpen} onClose={() => setIsTradeModalOpen(false)} config={config} />

      {/* Saved Trades View */}
      {isSavedTradesOpen && (
        <SavedTradesView
          trades={savedTrades}
          onDeleteTrade={handleDeleteTrade}
          onLoadTrade={handleLoadTrade}
          onUpdateOutcome={handleUpdateTradeOutcome}
          onClose={() => setIsSavedTradesOpen(false)}
          onScanWorkFolder={() => handleImportReports(false)}
          onOpenWorkFolderModal={() => setIsWorkFolderOpen(true)}
          onUploadFiles={handleUploadReports}
          workFolderName={workFolderName}
        />
      )}

      {/* Work Folder Modal */}
      <WorkFolderModal
        isOpen={isWorkFolderOpen}
        onClose={() => setIsWorkFolderOpen(false)}
        folderName={workFolderName}
        isWritable={Boolean(workDirHandle || isVirtualFolder)}
        isSupported={isFileSystemAccessSupported()}
        onSelectFolder={handleSelectWorkFolder}
        onSetVirtualFolder={handleSetVirtualFolder}
        onImportReports={handleImportReports}
        onUploadFiles={handleUploadReports}
        onOpenSavedTrades={() => setIsSavedTradesOpen(true)}
        savedTradesCount={savedTrades.length}
        importStatus={importStatus}
      />
    </div>
  );
}
