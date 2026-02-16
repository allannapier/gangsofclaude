import { useMemo } from 'react';
import { useGameStore } from '../store';
import { Terminal, Zap, Check } from 'lucide-react';

export function Header() {
  const { connected, cliConnected, gameState, events, setCommandPaletteOpen } = useGameStore();

  const playerActedThisTurn = useMemo(() => {
    return events.some(e => e.actor === 'Player' && e.turn === gameState.turn && e.action !== 'status' && e.action !== 'next-turn' && e.action !== 'message' && e.action !== 'promote');
  }, [events, gameState.turn]);

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <img
          src="/gangsofclaude_icon.png"
          alt="Gangs of Claude"
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover"
        />
        <div>
          <h1 className="text-base md:text-lg font-bold">Gangs of Claude</h1>
          <p className="hidden md:block text-xs text-zinc-500">Mafia Strategy Game</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Connection Status - Desktop Only */}
        <div className="hidden md:flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cliConnected ? 'bg-green-500' : connected ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-500">
            {cliConnected ? 'CLI Connected' : connected ? 'Waiting for CLI' : 'Disconnected'}
          </span>
        </div>

        {/* Connection Status Dot - Mobile Only */}
        <div className="md:hidden">
          <div className={`w-2 h-2 rounded-full ${cliConnected ? 'bg-green-500' : connected ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>

        {/* Actions Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            playerActedThisTurn
              ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
              : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
          }`}
        >
          {playerActedThisTurn ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          <span className="hidden sm:inline">{playerActedThisTurn ? 'Acted' : 'Actions'}</span>
        </button>

        <div className="flex items-center gap-1.5 md:gap-2 text-sm text-zinc-400">
          <span className="hidden sm:inline">Turn</span>
          <span className="px-2 py-1 bg-zinc-800 rounded font-mono text-xs md:text-sm" id="turn-display">{gameState.turn}</span>
        </div>

        {/* Keyboard Hint - Desktop Only */}
        <div className="hidden md:flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          <kbd className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-500">
            Ctrl+K
          </kbd>
        </div>
      </div>
    </header>
  );
}
