
import React from 'react';
import { GameStatus } from '../types';
import { MIN_BET, MAX_BET } from '../constants';

interface BetPanelProps {
  balance: number;
  currentBet: number;
  setCurrentBet: (val: number) => void;
  status: GameStatus;
  onBet: () => void;
  onCashOut: () => void;
  multiplier: number;
  isCashedOut: boolean;
}

const BetPanel: React.FC<BetPanelProps> = ({
  balance,
  currentBet,
  setCurrentBet,
  status,
  onBet,
  onCashOut,
  multiplier,
  isCashedOut
}) => {
  const isWaiting = status === 'STARTING';
  const isFlying = status === 'FLYING';
  const isIdle = status === 'IDLE' || status === 'CRASHED';

  const presets = [50, 100, 200, 500];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-2xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm font-semibold text-zinc-400 px-1">
          <span>Bet Amount</span>
          <span>Balance: {balance.toFixed(2)} coins</span>
        </div>
        
        <div className="relative group">
          <input
            type="number"
            value={currentBet}
            onChange={(e) => setCurrentBet(Math.min(MAX_BET, Math.max(0, parseInt(e.target.value) || 0)))}
            disabled={!isIdle}
            className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-4 text-xl font-bold focus:border-red-500 outline-none transition-all disabled:opacity-50"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">COINS</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => isIdle && setCurrentBet(p)}
              disabled={!isIdle}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              +{p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-end">
        {!isFlying && !isWaiting ? (
          <button
            onClick={onBet}
            disabled={currentBet < MIN_BET || currentBet > balance}
            className="h-full bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl text-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
          >
            {currentBet > balance ? 'Insufficient' : 'Bet'}
          </button>
        ) : isWaiting ? (
          <button
            disabled
            className="h-full bg-zinc-800 text-zinc-400 rounded-xl text-xl font-black uppercase tracking-widest animate-pulse"
          >
            Wait for Round...
          </button>
        ) : (
          <button
            onClick={onCashOut}
            disabled={isCashedOut}
            className={`h-full ${isCashedOut ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600 hover:bg-green-500 active:scale-[0.98]'} rounded-xl p-4 flex flex-col items-center justify-center transition-all shadow-lg shadow-green-900/20`}
          >
            {isCashedOut ? (
              <span className="text-xl font-black">CASHED OUT</span>
            ) : (
              <>
                <span className="text-sm font-bold opacity-80 uppercase">Cash Out</span>
                <span className="text-3xl font-black">{(currentBet * multiplier).toFixed(2)}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BetPanel;
