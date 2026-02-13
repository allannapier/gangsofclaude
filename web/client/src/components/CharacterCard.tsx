import { useGameStore } from '../store';
import { getCharacterById, getFamilyById } from '../data/families';

export function CharacterCard() {
  const { selectedCharacter, setDialogSkill } = useGameStore();

  const character = selectedCharacter ? getCharacterById(selectedCharacter) : null;
  const family = character ? getFamilyById(character.family) : null;

  if (!character) {
    return (
      <div className="text-center text-zinc-500 py-12">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-zinc-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-sm">Select a character to view details</p>
      </div>
    );
  }

  if (!character.alive) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-2xl">💀</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-400">{character.fullName}</h3>
        <p className="text-sm text-red-400 mt-1">Deceased</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${family?.color}20`, color: family?.color }}
        >
          {character.firstName[0]}
        </div>
        <h3 className="text-lg font-semibold">{character.fullName}</h3>
        <p
          className="text-sm font-medium mt-1"
          style={{ color: family?.color }}
        >
          {family?.fullName} • {character.role}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-500">Loyalty</span>
            <span className="text-zinc-400">{character.loyalty}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${character.loyalty}%` }}
            />
          </div>
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
            <span
              key={trait}
              className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-md"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Actions</h4>
        <div className="space-y-2">
          <button
            onClick={() => setDialogSkill('message')}
            className="w-full px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-left flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Send Message
          </button>
          <button
            onClick={() => setDialogSkill('recruit')}
            className="w-full px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-left flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Recruit / Mentor
          </button>
          <button
            onClick={() => setDialogSkill('intel')}
            className="w-full px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-left flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Gather Intel
          </button>
          <button
            onClick={() => setDialogSkill('attack')}
            className="w-full px-3 py-2 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-md transition-colors text-left flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Attack
          </button>
        </div>
      </div>
    </div>
  );
}
