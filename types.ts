
export type GameStatus = 'IDLE' | 'STARTING' | 'FLYING' | 'CRASHED';

export interface RoundHistory {
  id: string;
  multiplier: number;
  timestamp: number;
}

export interface GameState {
  balance: number;
  currentBet: number;
  currentMultiplier: number;
  crashMultiplier: number;
  status: GameStatus;
  history: RoundHistory[];
  isCashedOut: boolean;
  cashOutMultiplier: number;
}
