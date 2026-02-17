import { useGameStore } from '../store';
import { FAMILY_COLORS, FAMILY_DESCRIPTIONS } from '../types';

const FAMILIES = ['marinelli', 'rossetti', 'falcone', 'moretti'] as const;

export function FamilySelect() {
  const startGame = useGameStore((s) => s.startGame);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 overflow-auto">
      <div className="text-center mb-6 sm:mb-10">
        <img src="/gangsofclaude_icon.png" alt="" className="w-16 h-16 mx-auto mb-3 rounded-lg" />
        <h2 className="text-2xl sm:text-4xl font-bold mb-2">Choose Your Family</h2>
        <p className="text-zinc-400 text-sm sm:text-base">Lead a crime family to dominate all 16 territories</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl w-full">
        {FAMILIES.map((fid) => {
          const color = FAMILY_COLORS[fid];
          const desc = FAMILY_DESCRIPTIONS[fid];
          return (
            <button
              key={fid}
              onClick={() => startGame(fid)}
              className="text-left p-6 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-xl bg-zinc-900"
              style={{ borderColor: color + '66' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = color + '66')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="text-xl font-bold capitalize">{fid}</h3>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: color + '22', color }}>
                  {desc.tagline}
                </span>
              </div>
              <p className="text-zinc-400 text-sm">{desc.personality}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
