
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GameState, RoundHistory } from './types';
import { INITIAL_BALANCE, GROWTH_RATE, REFRESH_RATE, PRE_START_DELAY } from './constants';
import GameCanvas from './components/GameCanvas';
import BetPanel from './components/BetPanel';
import { getAIStrategyInsight, AIInsight } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    balance: INITIAL_BALANCE,
    currentBet: 100,
    currentMultiplier: 1.0,
    crashMultiplier: 0,
    status: 'IDLE',
    history: [],
    isCashedOut: false,
    cashOutMultiplier: 0
  });

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('skyhigh_balance');
    if (saved) {
      setState(prev => ({ ...prev, balance: parseFloat(saved) }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('skyhigh_balance', state.balance.toString());
  }, [state.balance]);

  // AI Strategy Update
  useEffect(() => {
    if (state.history.length > 0 && state.status === 'IDLE') {
      const fetchAI = async () => {
        const insight = await getAIStrategyInsight(state.history.map(h => h.multiplier));
        setAiInsight(insight);
      };
      fetchAI();
    }
  }, [state.history, state.status]);

  const generateCrashPoint = () => {
    // Standard Provably Fair-like distribution
    const p = Math.random() * 100;
    // 3% chance of instant crash at 1.00
    if (p < 3) return 1.00;
    // Higher multipliers are rarer
    return parseFloat((99 / (100 - p)).toFixed(2));
  };

  const handleBet = useCallback(() => {
    if (state.balance < state.currentBet) return;

    const crashAt = generateCrashPoint();
    setState(prev => ({
      ...prev,
      balance: prev.balance - prev.currentBet,
      status: 'STARTING',
      currentMultiplier: 1.0,
      crashMultiplier: crashAt,
      isCashedOut: false,
      cashOutMultiplier: 0
    }));

    setTimeout(() => {
      setState(prev => ({ ...prev, status: 'FLYING' }));
      startTimeRef.current = Date.now();
      startGameLoop();
    }, PRE_START_DELAY);
  }, [state.balance, state.currentBet]);

  const startGameLoop = () => {
    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth: 1.00 * e^(GROWTH_RATE * elapsed)
      const nextMultiplier = parseFloat(Math.exp(GROWTH_RATE * elapsed).toFixed(2));

      setState(prev => {
        if (nextMultiplier >= prev.crashMultiplier) {
          stopGameLoop();
          const newHistory: RoundHistory = {
            id: Date.now().toString(),
            multiplier: prev.crashMultiplier,
            timestamp: Date.now()
          };
          return {
            ...prev,
            status: 'CRASHED',
            currentMultiplier: prev.crashMultiplier,
            history: [newHistory, ...prev.history].slice(0, 20)
          };
        }
        return { ...prev, currentMultiplier: nextMultiplier };
      });

      gameLoopRef.current = requestAnimationFrame(tick);
    };
    gameLoopRef.current = requestAnimationFrame(tick);
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    // Auto reset to IDLE after a delay
    setTimeout(() => {
      setState(prev => ({ ...prev, status: 'IDLE' }));
    }, 4000);
  };

  const handleCashOut = useCallback(() => {
    if (state.status !== 'FLYING' || state.isCashedOut) return;

    const winnings = state.currentBet * state.currentMultiplier;
    setState(prev => ({
      ...prev,
      balance: prev.balance + winnings,
      isCashedOut: true,
      cashOutMultiplier: prev.currentMultiplier
    }));
  }, [state.status, state.isCashedOut, state.currentBet, state.currentMultiplier]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="w-full flex justify-between items-center py-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 p-2 rounded-lg rotate-12">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
             </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tighter italic">SKYHIGH <span className="text-red-600">SIM</span></h1>
        </div>
        
        <div className="flex items-center bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl shadow-lg">
          <span className="text-zinc-500 font-bold mr-3 text-xs uppercase">Wallet</span>
          <span className="text-xl font-black multiplier-font text-green-500">{state.balance.toFixed(2)}</span>
        </div>
      </header>

      {/* History Bar */}
      <div className="w-full flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {state.history.length === 0 ? (
          <span className="text-zinc-600 text-xs uppercase font-bold px-2">No history yet...</span>
        ) : (
          state.history.map(h => (
            <div 
              key={h.id} 
              className={`px-3 py-1 rounded-full text-xs font-black ${h.multiplier >= 2 ? 'bg-purple-900/30 text-purple-400 border border-purple-800' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
            >
              {h.multiplier.toFixed(2)}x
            </div>
          ))
        )}
      </div>

      {/* Main Game Stage */}
      <main className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 relative h-[350px] md:h-[500px]">
          <GameCanvas status={state.status} multiplier={state.currentMultiplier} />
          
          {/* Overlay Multiplier */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-transform duration-75 ${state.status === 'CRASHED' ? 'scale-110' : ''}`}>
            {state.status === 'STARTING' ? (
              <div className="text-center">
                <div className="text-red-500 font-black text-6xl md:text-8xl animate-bounce">READY?</div>
                <div className="text-zinc-500 font-bold uppercase tracking-widest mt-2">Flight in 3s...</div>
              </div>
            ) : (
              <div className={`multiplier-font text-7xl md:text-9xl font-black ${state.status === 'CRASHED' ? 'text-red-600 crash-anim glow-text' : 'text-white'}`}>
                {state.currentMultiplier.toFixed(2)}x
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / AI Insights */}
        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
             <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">AI Strategy (Gemini)</h3>
             </div>
             {aiInsight ? (
               <div className="space-y-4">
                 <div>
                   <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Sentiment</p>
                   <p className="text-sm font-semibold">{aiInsight.sentiment}</p>
                 </div>
                 <div>
                   <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Recommendation</p>
                   <p className="text-sm text-blue-100">{aiInsight.recommendation}</p>
                 </div>
                 <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                    <span className="text-xs font-bold text-zinc-400">Risk Level</span>
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                      aiInsight.riskLevel === 'High' ? 'bg-red-900/40 text-red-500' : 
                      aiInsight.riskLevel === 'Medium' ? 'bg-yellow-900/40 text-yellow-500' : 'bg-green-900/40 text-green-500'
                    }`}>
                      {aiInsight.riskLevel}
                    </span>
                 </div>
               </div>
             ) : (
               <div className="animate-pulse space-y-2">
                 <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                 <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
               </div>
             )}
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-black p-4 rounded-xl border border-zinc-800/50">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-3">Recent Big Wins</h4>
            <div className="space-y-2">
              {[ {u: 'Pilot_Alpha', x: 12.4, c: 450}, {u: 'SkyKing', x: 5.2, c: 1200} ].map((win, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">{win.u}</span>
                  <span className="text-green-500 font-bold">{win.x}x</span>
                  <span className="font-bold text-zinc-200">+{win.c * win.x}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Control Panel */}
      <footer className="w-full sticky bottom-4">
        <BetPanel 
          balance={state.balance}
          currentBet={state.currentBet}
          setCurrentBet={(val) => setState(prev => ({ ...prev, currentBet: val }))}
          status={state.status}
          onBet={handleBet}
          onCashOut={handleCashOut}
          multiplier={state.currentMultiplier}
          isCashedOut={state.isCashedOut}
        />
      </footer>

      {/* Disclaimer */}
      <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-8 px-4 opacity-50">
        Simulation Only — Strictly Educational — No Real Money Involved — Uses Virtual Coins Only
      </div>
    </div>
  );
};

export default App;
