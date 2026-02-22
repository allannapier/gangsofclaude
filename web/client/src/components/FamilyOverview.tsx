import { useGameStore } from '../store';
import { FAMILY_COLORS } from '../types';
import { territoryIncome } from './utils';
import { MuscleIcon } from './Icons';

export function FamilyOverview({ compact }: { compact?: boolean }) {
  const { state } = useGameStore();

  const familyIds = Object.keys(state.families || {});
  if (!state.territories) return null;

  // Compact mobile view: leaderboard strip
  if (compact) {
    // Sort by territory count descending for leaderboard feel
    const sorted = [...familyIds].sort((a, b) => {
      const aTerr = state.territories.filter((t) => t.owner === a).length;
      const bTerr = state.territories.filter((t) => t.owner === b).length;
      return bTerr - aTerr;
    });
    const maxTerritories = Math.max(...familyIds.map(fid => state.territories.filter(t => t.owner === fid).length), 1);

    return (
      <div className="flex flex-col gap-0 px-2 py-1.5 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
        {sorted.map((fid, idx) => {
          const f = state.families[fid];
          const color = FAMILY_COLORS[fid] || '#888';
          const isPlayer = fid === state.playerFamily;
          const territories = state.territories.filter((t) => t.owner === fid);
          const income = territories.reduce((s, t) => s + territoryIncome(t.business), 0);
          const muscle = territories.reduce((s, t) => s + t.muscle, 0);
          const upkeep = muscle * 10;
          const eliminated = territories.length === 0;
          const barWidth = eliminated ? 0 : (territories.length / maxTerritories) * 100;

          return (
            <div
              key={fid}
              className={`flex items-center gap-2 py-1 px-1 ${idx < sorted.length - 1 ? 'border-b border-zinc-800/50' : ''} ${eliminated ? 'opacity-40' : ''}`}
            >
              {/* Rank number */}
              <span className="text-[10px] text-zinc-600 w-3 text-center font-mono">{idx + 1}</span>
              {/* Color accent bar */}
              <div className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {/* Name */}
              <span className={`text-xs font-bold w-20 truncate ${isPlayer ? 'underline decoration-1 underline-offset-2' : ''}`} style={{ color }}>
                {f.name}{isPlayer ? ' ★' : ''}
              </span>
              {eliminated ? (
                <span className="text-[10px] text-red-400 font-bold">ELIMINATED</span>
              ) : (
                <>
                  {/* Territory strength bar */}
                  <div className="flex-1 h-2.5 bg-zinc-800/60 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: color + 'aa' }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/70">
                      {territories.length} turf
                    </span>
                  </div>
                  {/* Stats */}
                  <div className="flex gap-1.5 text-[10px] text-zinc-500 shrink-0 tabular-nums">
                    <span className="text-zinc-300">${f.wealth}</span>
                    <span className="inline-flex items-center gap-1"><MuscleIcon size={12} />{muscle}</span>
                    <span className="text-green-500">+{income - upkeep}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full desktop view
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {familyIds.map((fid) => {
        const f = state.families[fid];
        const color = FAMILY_COLORS[fid] || '#888';
        const isPlayer = fid === state.playerFamily;
        const territories = state.territories.filter((t) => t.owner === fid);
        const income = territories.reduce((s, t) => s + territoryIncome(t.business), 0);
        const muscle = territories.reduce((s, t) => s + t.muscle, 0);
        const upkeep = muscle * 10;
        const eliminated = territories.length === 0;

        return (
          <div
            key={fid}
            className={`p-3 rounded-lg border ${isPlayer ? 'ring-2 ring-white/30' : ''} ${eliminated ? 'opacity-40' : ''}`}
            style={{ borderColor: color + '66', backgroundColor: color + '10' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-bold text-sm" style={{ color }}>
                {f.name}
                {isPlayer && <span className="text-xs ml-1">(You)</span>}
              </span>
            </div>
            {eliminated ? (
              <div className="text-xs text-red-400 font-bold">ELIMINATED</div>
            ) : (
              <div className="space-y-1 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Wealth</span>
                  <span className="text-zinc-200">${f.wealth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Territories</span>
                  <span className="text-zinc-200">{territories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Muscle</span>
                  <span className="text-zinc-200">{muscle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Income</span>
                  <span className="text-green-400">+${income - upkeep}/turn</span>
                </div>
                {/* Alliance indicators */}
                {state.diplomacy
                  .filter(d => d.type === 'partnership' && d.status === 'accepted' && (d.from === fid || d.to === fid))
                  .filter(d => !state.diplomacy.some(w => w.type === 'war' && w.turn > d.turn && ((w.from === d.from && w.to === d.to) || (w.from === d.to && w.to === d.from))))
                  .map((d, i) => {
                    const partner = d.from === fid ? d.to : d.from;
                    return (
                      <div key={`alliance-${i}`} className="flex items-center gap-1 text-cyan-400">
                        <span>🤝</span>
                        <span>{state.families[partner]?.name}</span>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
