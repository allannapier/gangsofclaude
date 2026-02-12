import { useGameStore } from '../store';
import { getFamilyById } from '../data/families';

export function TerritoryMap() {
  const { families, gameState, selectedFamily, setSelectedFamily } = useGameStore();

  const territories = [
    'Little Italy', 'North End', 'The Docks',
    'Fishmarket', 'Warehouse District', 'East Harbor',
    'Southside Clubs', 'Downtown', 'Financial District',
    'East Side', 'Harbor', 'Old Town',
  ];

  const getTerritoryOwner = (territory: string) => {
    for (const family of families) {
      if (family.territory.includes(territory)) {
        return family.id;
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Territory Map</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Click on a family to view their controlled territories
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {territories.map((territory) => {
          const ownerId = getTerritoryOwner(territory);
          const owner = ownerId ? getFamilyById(ownerId) : null;

          return (
            <div
              key={territory}
              onClick={() => owner && setSelectedFamily(owner.id)}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                owner
                  ? 'border-transparent bg-opacity-20 hover:bg-opacity-30'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
              style={owner ? {
                backgroundColor: `${owner.color}20`,
                borderColor: selectedFamily === owner.id ? owner.color : 'transparent',
              } : {}}
            >
              <div className="text-xs text-zinc-500 mb-1">
                {owner?.name || 'Unclaimed'}
              </div>
              <div className="text-sm font-medium truncate">
                {territory}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {families.map((family) => (
          <div
            key={family.id}
            onClick={() => setSelectedFamily(family.id)}
            className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
              selectedFamily === family.id ? 'border-opacity-100' : 'border-opacity-30'
            }`}
            style={{
              borderColor: family.color,
              backgroundColor: `${family.color}10`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: family.color }}
                />
                <span className="font-semibold">{family.name}</span>
              </div>
              <span className="text-xs text-zinc-500">
                {family.members.filter(m => m.alive).length} members
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-zinc-500">Wealth</div>
                <div className="font-semibold text-green-400">
                  \${family.stats.wealth.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Territory</div>
                <div className="font-semibold text-blue-400">
                  {family.territory.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Respect</div>
                <div className="font-semibold text-amber-400">
                  {family.stats.respect}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Game Phase</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            gameState.phase === 'setup'
              ? 'bg-blue-900/50 text-blue-400'
              : gameState.phase === 'playing'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}>
            {gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)}
          </span>
        </div>
        {gameState.winner && (
          <div className="mt-3 text-center">
            <span className="text-lg font-bold" style={{ color: getFamilyById(gameState.winner)?.color }}>
              {getFamilyById(gameState.winner)?.fullName} Wins!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
