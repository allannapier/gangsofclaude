import { useGameStore } from '../store';
import { getCharacterById, getFamilyById } from '../data/families';
import { MapPin, Users, Crown, Skull, MessageSquare, UserPlus, Eye, Swords } from 'lucide-react';

export function DetailsPanel() {
  const {
    selectedCharacter,
    selectedFamily,
    selectedTerritory,
    setDialogSkill,
  } = useGameStore();

  const character = selectedCharacter ? getCharacterById(selectedCharacter) : null;
  const family = selectedFamily ? getFamilyById(selectedFamily) : null;

  // Priority: Character > Territory > Family > Empty state

  // Character Details
  if (character && family) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: `${family.color}20`,
              color: family.color,
              border: `2px solid ${family.color}40`,
            }}
          >
            {character.firstName[0]}{character.lastName[0]}
          </div>
          <h3 className="text-lg font-semibold">{character.fullName}</h3>
          <p className="text-sm mt-1" style={{ color: family.color }}>
            {family.fullName}
          </p>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-zinc-800 rounded text-zinc-400">
            {character.role}
          </span>
        </div>

        {!character.alive && (
          <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-center">
            <Skull className="w-5 h-5 mx-auto mb-1 text-red-400" />
            <span className="text-sm text-red-400">Deceased</span>
          </div>
        )}

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-500">Loyalty</span>
            <span className="text-zinc-400">{character.loyalty}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${character.loyalty}%` }} />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Personality</h4>
          <p className="text-sm text-zinc-400">{character.personality}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Traits</h4>
          <div className="flex flex-wrap gap-2">
            {character.traits.map((trait) => (
              <span key={trait} className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded">
                {trait}
              </span>
            ))}
          </div>
        </div>

        {character.alive && (
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase">Actions</h4>
            <button
              onClick={() => setDialogSkill('message')}
              className="w-full px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-zinc-500" />
              Send Message
            </button>
            <button
              onClick={() => setDialogSkill('recruit')}
              className="w-full px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-zinc-500" />
              Recruit / Mentor
            </button>
            <button
              onClick={() => setDialogSkill('intel')}
              className="w-full px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4 text-zinc-500" />
              Gather Intel
            </button>
            <button
              onClick={() => setDialogSkill('attack')}
              className="w-full px-3 py-2 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded flex items-center gap-2 transition-colors"
            >
              <Swords className="w-4 h-4" />
              Attack
            </button>
          </div>
        )}
      </div>
    );
  }

  // Territory Details
  if (selectedTerritory && family) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${family.color}20`,
              border: `2px solid ${family.color}40`,
            }}
          >
            <MapPin className="w-8 h-8" style={{ color: family.color }} />
          </div>
          <h3 className="text-lg font-semibold">{selectedTerritory}</h3>
          <p className="text-sm mt-1" style={{ color: family.color }}>
            Controlled by {family.name}
          </p>
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <Crown className="w-4 h-4 text-zinc-500" />
            <div>
              <div className="text-xs text-zinc-500">Controlling Family</div>
              <div className="font-medium" style={{ color: family.color }}>
                {family.fullName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-zinc-500" />
            <div>
              <div className="text-xs text-zinc-500">Family Members</div>
              <div className="font-medium">{family.members.filter(m => m.alive).length} active</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-3">
            {family.name} Holdings
          </h4>
          <div className="space-y-2">
            {family.territory.map((territory) => (
              <div
                key={territory}
                className={`flex items-center gap-2 p-2 rounded ${
                  territory === selectedTerritory ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-zinc-900/50'
                }`}
              >
                <MapPin className={`w-4 h-4 ${territory === selectedTerritory ? 'text-blue-400' : 'text-zinc-600'}`} />
                <span className={`text-sm ${territory === selectedTerritory ? 'text-zinc-200' : 'text-zinc-400'}`}>
                  {territory}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Family-only Details
  if (family) {
    const aliveMembers = family.members.filter(m => m.alive);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{
              backgroundColor: `${family.color}20`,
              color: family.color,
              border: `2px solid ${family.color}40`,
            }}
          >
            {family.name[0]}
          </div>
          <h3 className="text-lg font-semibold">{family.fullName}</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {aliveMembers.length} members • {family.territory.length} territories
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Wealth</div>
            <div className="font-semibold text-green-400">${family.stats.wealth.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Respect</div>
            <div className="font-semibold text-amber-400">{family.stats.respect}</div>
          </div>
          <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Territory</div>
            <div className="font-semibold text-blue-400">{family.stats.territory}</div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Territories</h4>
          <div className="space-y-2">
            {family.territory.map((territory) => (
              <div key={territory} className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded">
                <MapPin className="w-4 h-4 text-zinc-600" />
                <span className="text-sm text-zinc-400">{territory}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Members</h4>
          <div className="space-y-2">
            {aliveMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${family.color}30`, color: family.color }}
                >
                  {member.firstName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{member.fullName}</div>
                  <div className="text-xs text-zinc-500">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  return (
    <div className="text-center text-zinc-500 py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-zinc-700" />
      </div>
      <p className="text-sm mb-1">Select a territory, family, or character</p>
      <p className="text-xs text-zinc-600">Their details will appear here</p>
    </div>
  );
}
