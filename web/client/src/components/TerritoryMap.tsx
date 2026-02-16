import { useGameStore } from '../store';
import { FAMILIES, getFamilyById } from '../data/families';

// Map territories to their default controlling families for initial display
const DEFAULT_TERRITORY_OWNERSHIP: Record<string, string> = {
  'Little Italy': 'marinelli',
  'North End': 'rossetti',
  'The Docks': null as any,
  'Fishmarket': 'rossetti',
  'Warehouse District': 'marinelli',
  'East Harbor': null as any,
  'Southside Clubs': 'rossetti',
  'Downtown': 'falcone',
  'Financial District': 'falcone',
  'East Side': 'moretti',
  'Harbor': 'moretti',
  'Old Town': 'moretti',
};

export function TerritoryMap() {
  const { gameState, selectedFamily, selectedTerritory, setSelectedFamily, setDialogSkill, setSelectedTerritory, player } = useGameStore();

  const territories = [
    'Little Italy', 'North End', 'The Docks',
    'Fishmarket', 'Warehouse District', 'East Harbor',
    'Southside Clubs', 'Downtown', 'Financial District',
    'East Side', 'Harbor', 'Old Town',
  ];

  // Get territory ownership - check game state first, fall back to defaults
  const getTerritoryOwner = (territory: string): string | null => {
    // First check if game state has specific territory tracking
    if (gameState.territoryOwnership && gameState.territoryOwnership[territory]) {
      return gameState.territoryOwnership[territory];
    }
    // Fall back to default ownership
    return DEFAULT_TERRITORY_OWNERSHIP[territory] || null;
  };

  const handleTerritoryClick = (territory: string) => {
    const ownerId = getTerritoryOwner(territory);

    if (ownerId) {
      // Owned territory - select the family
      setSelectedFamily(ownerId);
    } else {
      // Unclaimed territory - open claim/expand dialog
      setSelectedTerritory(territory);
      setDialogSkill(player.family === 'None' ? 'expand' : 'claim');
    }
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
          const isUnclaimed = !owner;
          const canClaim = player.family !== 'None';

          return (
            <div
              key={territory}
              onClick={() => handleTerritoryClick(territory)}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isUnclaimed
                  ? canClaim
                    ? 'border-zinc-700 bg-zinc-900/50 hover:border-green-700 hover:bg-green-900/20'
                    : 'border-zinc-800 bg-zinc-900/50 cursor-not-allowed opacity-60'
                  : 'border-transparent bg-opacity-20 hover:bg-opacity-30'
              }`}
              style={owner ? {
                backgroundColor: `${owner.color}20`,
                borderColor: selectedFamily === owner.id ? owner.color : 'transparent',
              } : isUnclaimed && canClaim ? {
                borderColor: selectedTerritory === territory ? '#22c55e' : undefined,
              } : {}}
              title={isUnclaimed ? canClaim ? 'Click to claim this territory' : 'Join a family to claim territory' : `Owned by ${owner?.name}`}
            >
              <div className="text-xs text-zinc-500 mb-1">
                {isUnclaimed ? (canClaim ? '📍 Unclaimed' : '🔒 Unclaimed') : owner?.name}
              </div>
              <div className="text-sm font-medium truncate">
                {territory}
              </div>
              {isUnclaimed && canClaim && (
                <div className="text-xs text-green-500 mt-1">+ Click to claim</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {FAMILIES.map((family) => (
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
                  {gameState.territoryOwnership
                    ? Object.values(gameState.territoryOwnership).filter(owner => owner === family.id).length
                    : family.territory.length}
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
