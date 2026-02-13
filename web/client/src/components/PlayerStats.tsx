import { useGameStore } from '../store';

export function PlayerStats() {
  const { player, executeSkill, setDialogSkill } = useGameStore();
  const isOutsider = player.rank === 'Outsider' || player.family === 'None';

  return (
    <div className="min-h-[64px] bg-zinc-900/50 border-b border-zinc-800 px-3 md:px-6 py-2 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
      <div className="flex items-center gap-3 md:gap-6 overflow-x-auto scrollbar-hide">
        <div className="flex-shrink-0">
          <span className="text-[10px] md:text-xs text-zinc-500">Rank</span>
          <p className="text-sm md:text-base font-semibold">{player.rank}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[10px] md:text-xs text-zinc-500">Family</span>
          <p className="text-sm md:text-base font-semibold">{player.family}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[10px] md:text-xs text-zinc-500">Wealth</span>
          <p className="text-sm md:text-base font-semibold text-green-400">${player.wealth.toLocaleString()}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[10px] md:text-xs text-zinc-500">Respect</span>
          <p className="text-sm md:text-base font-semibold text-amber-400">{player.respect}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[10px] md:text-xs text-zinc-500">Loyalty</span>
          <p className="text-sm md:text-base font-semibold text-blue-400">{player.loyalty}%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isOutsider && (
          <button
            onClick={() => setDialogSkill('seek-patronage')}
            className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 rounded-md transition-colors border border-purple-800/50"
          >
            <span className="hidden sm:inline">🤝 </span>Join Gang
          </button>
        )}
        <button
          onClick={() => executeSkill('next-turn', {})}
          className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded-md transition-colors border border-blue-800/50 font-medium"
        >
          <span className="hidden sm:inline">⏭️ </span>Next Turn
        </button>
      </div>
    </div>
  );
}
