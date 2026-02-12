import { useGameStore } from '../store';
import { getFamilyById } from '../data/families';

export function FamilyPanel() {
  const { families, selectedFamily, setSelectedFamily, selectedCharacter, setSelectedCharacter } = useGameStore();

  return (
    <div className="flex-1 overflow-auto">
      {families.map((family) => {
        const isExpanded = selectedFamily === family.id;
        const aliveMembers = family.members.filter(m => m.alive);

        return (
          <div key={family.id} className="border-b border-zinc-800">
            <button
              onClick={() => setSelectedFamily(isExpanded ? null : family.id)}
              className="w-full p-3 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: family.color }}
              />
              <div className="flex-1 text-left">
                <div className="font-semibold">{family.name}</div>
                <div className="text-xs text-zinc-500">{aliveMembers.length} members</div>
              </div>
              <svg
                className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-1">
                {aliveMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedCharacter(member.id)}
                    className={`w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                      selectedCharacter === member.id
                        ? 'bg-zinc-700'
                        : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{member.fullName}</span>
                      <span className="text-xs text-zinc-500">{member.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
