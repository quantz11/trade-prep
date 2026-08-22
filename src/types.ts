export interface HTFState {
  vc1: boolean;
  vc1Chips?: string[];
  vc1Text?: string;
  vc1Image?: string;
  vc2: boolean;
  vc2Chips?: string[];
  vc2Text?: string;
  vc2Image?: string;
  idm1: boolean;
  idm1Chips?: string[];
  idm1Text?: string;
  idm1Image?: string;
  idm2: boolean;
  idm2Chips?: string[];
  idm2Text?: string;
  idm2Image?: string;
  vc3: boolean;
  vc3Chips?: string[];
  vc3Text?: string;
  vc3Image?: string;
}

export interface LTFState {
  // Path 1: Trigger -> Entry
  trigger1: boolean;
  trigger1Chips?: string[];
  trigger1Text?: string;
  trigger1Image?: string;
  entry1: boolean;
  entry1Chips?: string[];
  entry1Text?: string;
  entry1Image?: string;
  // Path 2: VC -> Entry / VC -> Trigger -> Entry
  vc: boolean;
  vcChips?: string[];
  vcText?: string;
  vcImage?: string;
  vcEntry: boolean;
  vcEntryChips?: string[];
  vcEntryText?: string;
  vcEntryImage?: string;
  trigger2: boolean;
  trigger2Chips?: string[];
  trigger2Text?: string;
  trigger2Image?: string;
  entry2: boolean;
  entry2Chips?: string[];
  entry2Text?: string;
  entry2Image?: string;
}

export type LTFMode = 'trigger_entry' | 'vc_trigger_entry' | 'vc_entry';

export interface TradeConfig {
  instrument: string;
  bias: 'LONG' | 'SHORT';
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

export interface SavedTrade {
  id: string;
  createdAt: string;
  config: TradeConfig;
  htf: HTFState;
  ltf: LTFState;
  ltfMode: LTFMode;
  status: 'EXECUTED' | 'SAVED';
  outcome?: TradeOutcome;
  sync?: {
    local: boolean;
    firebase: boolean;
    status: string;
    lastSyncedAt?: string;
  };
}

export type TradeOutcome = 'WIN' | 'LOSE' | 'BREAKEVEN' | 'NO_TRADE';

export interface PairSession {
  instrument: string;
  config: TradeConfig;
  htf: HTFState;
  ltf: LTFState;
  ltfMode: LTFMode;
}
