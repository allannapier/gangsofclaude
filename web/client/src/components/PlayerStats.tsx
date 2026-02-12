import { useGameStore } from '../store';

export function PlayerStats() {
  const { player, executeSkill, setDialogSkill } = useGameStore();
  const isOutsider = player.rank === 'Outsider' || player.family === 'None';

  return (
    <div className="h-16 bg-zinc-900/50 border-b border-zinc-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-xs text-zinc-500">Rank</span>
          <p className="font-semibold">{player.rank}</p>
        </div>
        <div>
          <span className="text-xs text-zinc-500">Family</span>
          <p className="font-semibold">{player.family}</p>
        </div>
        <div>
          <span className="text-xs text-zinc-500">Wealth</span>
          <p className="font-semibold text-green-400">\${player.wealth.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-xs text-zinc-500">Respect</span>
          <p className="font-semibold text-amber-400">{player.respect}</p>
        </div>
        <div>
          <span className="text-xs text-zinc-500">Loyalty</span>
          <p className="font-semibold text-blue-400">{player.loyalty}%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {isOutsider && (
          <button
            onClick={() => setDialogSkill('seek-patronage')}
            className="px-3 py-1.5 text-sm bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 rounded-md transition-colors border border-purple-800/50"
          >
            🤝 Join Gang
          </button>
        )}
        <button
          onClick={() => executeSkill('next-turn', {})}
          className="px-3 py-1.5 text-sm bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded-md transition-colors border border-blue-800/50 font-medium"
        >
          ⏭️ Next Turn
        </button>
      </div>
    </div>
  );
}
