import { useEffect } from 'react';
import { useGameStore } from './store';
import { FamilySelect } from './components/FamilySelect';
import { GameBoard } from './components/GameBoard';
import { AttackResultModal } from './components/AttackResultModal';
import { PinScreen } from './components/PinScreen';
import { FAMILY_COLORS } from './types';

export default function App() {
  const { connect, state, connected, authStatus, checkAuth, completeAuth } = useGameStore();

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => {
    if (authStatus === 'authenticated') {
      connect();
      return () => { /* cleanup handled by StrictMode guard in connect() */ };
    }
  }, [authStatus, connect]);

  // PIN screens (before game loads)
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }
  if (authStatus === 'setup-required') {
    return <PinScreen mode="setup" onSuccess={() => {}} onSetupComplete={completeAuth} onVerifyComplete={completeAuth} />;
  }
  if (authStatus === 'verify-required') {
    return <PinScreen mode="verify" onSuccess={() => {}} onSetupComplete={completeAuth} onVerifyComplete={completeAuth} />;
  }

  const playerColor = state.playerFamily ? FAMILY_COLORS[state.playerFamily] : '#888';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 opacity-[0.07] bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/gangs1.png)' }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src="/gangsofclaude_icon.png" alt="Gangs of Claude" className="w-14 h-8 object-contain rounded" />
          <h1 className="text-lg font-bold tracking-wide hidden sm:block">GANGS OF CLAUDE</h1>
          <h1 className="text-lg font-bold tracking-wide sm:hidden">GoC</h1>
          {state.phase === 'playing' && state.playerFamily && (
            <span
              className="px-2 py-0.5 rounded text-xs font-bold uppercase"
              style={{ backgroundColor: playerColor + '33', color: playerColor, border: `1px solid ${playerColor}` }}
            >
              {state.families[state.playerFamily]?.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {state.phase === 'playing' && (
            <span className="text-zinc-400">Turn {state.turn}</span>
          )}
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        {state.phase === 'setup' && <FamilySelect />}
        {(state.phase === 'playing' || state.phase === 'ended') && <GameBoard />}
      </main>

      {/* Attack Result Modal (cinematic overlay) */}
      <AttackResultModal />
    </div>
  );
}
