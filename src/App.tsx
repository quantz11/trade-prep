import { useState, useEffect, useRef } from 'react';
import { db } from './lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Header } from './components/Header';
import { StatusBanner } from './components/StatusBanner';
import { HTFSection } from './components/HTFSection';
import { LTFSection } from './components/LTFSection';
import { RiskCalculator } from './components/RiskCalculator';
import { GlossaryModal } from './components/GlossaryModal';
import { TradeSuccessModal } from './components/TradeSuccessModal';
import { MultiPairWatchlist, PairSession } from './components/MultiPairWatchlist';
import { HTFState, LTFState, LTFMode, TradeConfig } from './types';

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
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
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
            isRemoteUpdate.current = true;
            setPairs(parsedPairs);
            if (data.activeInstrument && parsedPairs[data.activeInstrument]) {
              setActiveInstrument(data.activeInstrument);
            }
          } catch (e) {
            console.error('Error parsing pairs from Firestore', e);
          }
        }
      } else {
        setDoc(docRef, {
          pairs: JSON.stringify(pairs),
          activeInstrument,
          updatedAt: new Date().toISOString()
        }).catch(err => console.error('Error initializing session in Firestore', err));
      }
      setIsFirebaseLoaded(true);
    }, (error) => {
      console.error('Firestore snapshot error:', error);
      setIsFirebaseLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  // Save state updates to Firestore
  useEffect(() => {
    if (!isFirebaseLoaded) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const docRef = doc(db, 'sessions', 'main');
    setDoc(docRef, {
      pairs: JSON.stringify(pairs),
      activeInstrument,
      updatedAt: new Date().toISOString()
    }).catch(err => {
      console.error('Error saving session to Firestore', err);
    });
  }, [pairs, activeInstrument, isFirebaseLoaded]);

  const currentPair = pairs[activeInstrument] || pairs['EUR/USD'] || Object.values(pairs)[0];
  const htf = currentPair?.htf || { vc1: false, vc2: false, idm1: false, idm2: false, vc3: false };
  const ltf = currentPair?.ltf || { trigger1: false, entry1: false, vc: false, vcEntry: false, trigger2: false, entry2: false };
  const ltfMode = currentPair?.ltfMode || 'trigger_entry';
  const config = currentPair?.config || { instrument: activeInstrument, bias: 'LONG', accountBalance: 100000, riskPercentage: 1.0, entryPrice: 1.085, stopLoss: 1.0835, takeProfit: 1.088 };

  const updateCurrentPair = (updater: { htf?: Partial<HTFState>; ltf?: Partial<LTFState>; ltfMode?: LTFMode; config?: Partial<TradeConfig> }) => {
    setPairs((prev) => {
      const current = prev[activeInstrument];
      if (!current) return prev;
      return {
        ...prev,
        [activeInstrument]: {
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
    updateCurrentPair({ config: { instrument: inst } });
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
          }
          updateCurrentPair({ config: updater });
        }}
        onReset={handleReset}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
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
        <StatusBanner htf={htf} ltf={ltf} ltfMode={ltfMode} onExecuteTrade={() => setIsTradeModalOpen(true)} />

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
    </div>
  );
}
