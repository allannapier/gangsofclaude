import { useGameStore } from '../store';
import { SKILLS } from '../data/skills';

export function QuickActions() {
  const { player, executeSkill, setDialogSkill } = useGameStore();
  const isOutsider = player.rank === 'Outsider' || player.family === 'None';

  // Core skills - simple buttons (no params needed)
  const coreSkills = SKILLS.filter(s => s.category === 'core');

  // Skills that need the dialog
  const needsDialog = ['seek-patronage', 'recruit', 'attack', 'intel', 'expand', 'claim', 'message'];

  const handleSkillClick = (skillId: string) => {
    if (needsDialog.includes(skillId)) {
      setDialogSkill(skillId);
    } else {
      executeSkill(skillId as any, {});
    }
  };

  return (
    <div className="space-y-4">
      {/* Core Commands */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Core Commands</h3>
        <div className="grid grid-cols-2 gap-2">
          {coreSkills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => handleSkillClick(skill.id)}
              className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-left"
            >
              <div className="font-medium">{skill.name}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{skill.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Join Gang (for outsiders) */}
      {isOutsider && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">Get Started</h3>
          <button
            onClick={() => handleSkillClick('seek-patronage')}
            className="w-full px-3 py-2 text-sm bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 rounded-md transition-colors border border-purple-800/50"
          >
            🤝 Join a Family
            <span className="block text-xs text-purple-400/70 mt-0.5">Seek patronage from a family member</span>
          </button>
        </div>
      )}

      {/* Actions */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {SKILLS.filter(s => s.category === 'action' && (s.id !== 'claim' || !isOutsider)).map((skill) => (
            <button
              key={skill.id}
              onClick={() => handleSkillClick(skill.id)}
              className="px-3 py-2 text-sm bg-zinc-800/50 hover:bg-zinc-700/50 rounded-md transition-colors text-left border border-zinc-800"
            >
              <div className="font-medium text-zinc-300">/{skill.id}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{skill.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Social */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Social</h3>
        {SKILLS.filter(s => s.category === 'social').map((skill) => (
          <button
            key={skill.id}
            onClick={() => handleSkillClick(skill.id)}
            className="w-full px-3 py-2 text-sm bg-zinc-800/50 hover:bg-zinc-700/50 rounded-md transition-colors text-left border border-zinc-800 mb-2"
          >
            <div className="font-medium text-zinc-300">/{skill.id}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{skill.name}</div>
          </button>
        ))}
      </div>

      {/* Help Text */}
      <div className="pt-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">
          💡 Select a character first, then actions will target them automatically
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          ⌨️ Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded">Ctrl+K</kbd> for command palette
        </p>
      </div>
    </div>
  );
}
