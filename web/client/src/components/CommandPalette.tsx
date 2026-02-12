import { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { SKILLS, getSkillsByCategory } from '../data/skills';

export function CommandPalette() {
  const { setCommandPaletteOpen, executeSkill } = useGameStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredSkills = SKILLS.filter(skill =>
    skill.name.toLowerCase().includes(query.toLowerCase()) ||
    skill.id.includes(query.toLowerCase()) ||
    skill.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredSkills.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const skill = filteredSkills[selectedIndex];
        if (skill) {
          executeSkill(skill.id as any);
          setCommandPaletteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSkills, selectedIndex, executeSkill, setCommandPaletteOpen]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center pt-[20vh] z-50">
      <div className="w-full max-w-xl bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-lg placeholder:text-zinc-600"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-auto p-2">
          {filteredSkills.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">No commands found</div>
          ) : (
            <div className="space-y-1">
              {filteredSkills.map((skill, index) => (
                <button
                  key={skill.id}
                  onClick={() => { executeSkill(skill.id as any); setCommandPaletteOpen(false); }}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                    index === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className="px-2 py-1 bg-zinc-800 rounded text-sm text-amber-400">
                        /{skill.id}
                      </code>
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-500">
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 ml-14">{skill.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zinc-800 flex items-center gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
