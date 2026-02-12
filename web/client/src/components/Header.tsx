import { useGameStore } from '../store';
import { Terminal, Zap } from 'lucide-react';

export function Header() {
  const { connected, cliConnected, gameState, setCommandPaletteOpen } = useGameStore();

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <img
          src="/gangsofclaude_icon.png"
          alt="Gangs of Claude"
          className="w-10 h-10 rounded-lg object-cover"
        />
        <div>
          <h1 className="text-lg font-bold">Gangs of Claude</h1>
          <p className="text-xs text-zinc-500">Mafia Strategy Game</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cliConnected ? 'bg-green-500' : connected ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-500">
            {cliConnected ? 'CLI Connected' : connected ? 'Waiting for CLI' : 'Disconnected'}
          </span>
        </div>

        {/* Actions Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Actions
        </button>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Turn</span>
          <span className="px-2 py-1 bg-zinc-800 rounded font-mono" id="turn-display">{gameState.turn}</span>
        </div>

        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          <kbd className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-500">
            Ctrl+K
          </kbd>
        </div>
      </div>
    </header>
  );
}
