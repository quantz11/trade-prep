export interface HTFState {
  vc1: boolean;
  vc1Chips?: string[];
  vc2: boolean;
  vc2Chips?: string[];
  idm1: boolean;
  idm1Chips?: string[];
  idm2: boolean;
  idm2Chips?: string[];
  vc3: boolean;
  vc3Chips?: string[];
}

export interface LTFState {
  // Path 1: Trigger -> Entry
  trigger1: boolean;
  trigger1Chips?: string[];
  entry1: boolean;
  entry1Chips?: string[];
  // Path 2: VC -> Entry / VC -> Trigger -> Entry
  vc: boolean;
  vcChips?: string[];
  vcEntry: boolean;
  vcEntryChips?: string[];
  trigger2: boolean;
  trigger2Chips?: string[];
  entry2: boolean;
  entry2Chips?: string[];
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
