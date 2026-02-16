import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../store';
import { SKILLS } from '../data/skills';

type CommandError = {
  message: string;
  type: 'error' | 'info';
};

// Action skills that count as the player's one action per turn
const ACTION_SKILLS = ['seek-patronage', 'recruit', 'attack', 'intel', 'expand', 'claim'];

export function CommandPalette() {
  const { setCommandPaletteOpen, executeSkill, setDialogSkill, events, gameState } = useGameStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submitError, setSubmitError] = useState<CommandError | null>(null);

  const playerActedThisTurn = useMemo(() => {
    return events.some(e => e.actor === 'Player' && e.turn === gameState.turn && e.action !== 'status' && e.action !== 'next-turn' && e.action !== 'message' && e.action !== 'promote');
  }, [events, gameState.turn]);

  // Skills that need the dialog for parameter input
  const needsDialog = ['seek-patronage', 'recruit', 'attack', 'intel', 'expand', 'message'];

  // Validate and parse a raw command string
  const validateCommand = (input: string): { valid: boolean; skillId?: string; error?: string } => {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
      return { valid: false, error: 'Commands must start with /' };
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const skillId = parts[0];

    // Check if it's a known skill
    const knownSkill = SKILLS.find(s => s.id === skillId);
    if (!knownSkill) {
      return { valid: false, error: `Unknown command: /${skillId}` };
    }

    // Check if player already acted this turn
    if (playerActedThisTurn && ACTION_SKILLS.includes(skillId)) {
      return { valid: false, error: `You've already taken an action this turn. Advance to the next turn first.` };
    }

    // Check if the skill requires more arguments
    if (needsDialog.includes(skillId) && parts.length < 2) {
      return {
        valid: false,
        error: `/${skillId} requires arguments. Use the dialog or type: /${skillId} <args>`
      };
    }

    return { valid: true, skillId };
  };

  // Handle raw command submission (typed directly)
  const handleRawCommandSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Clear previous errors
    setSubmitError(null);

    const validation = validateCommand(trimmed);

    if (!validation.valid) {
      setSubmitError({ message: validation.error!, type: 'error' });
      return;
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const skillId = parts[0];
    const args = parts.slice(1);

    // Skills that need dialog should use it even with raw input if incomplete
    if (needsDialog.includes(skillId) && args.length === 0) {
      setDialogSkill(skillId);
      setCommandPaletteOpen(false);
      return;
    }

    // Parse arguments based on skill
    const paramOrder: Record<string, string[]> = {
      'seek-patronage': ['target'],
      'recruit': ['target'],
      'attack': ['target', 'type'],
      'intel': ['target', 'type'],
      'expand': ['amount'],
      'message': ['recipient', 'content'],
    };

    const order = paramOrder[skillId] || [];
    const parsedArgs: Record<string, any> = {};

    // Map positional args to named parameters
    // For message, the content may contain spaces - join all remaining parts
    if (skillId === 'message') {
      if (args.length >= 2) {
        parsedArgs.recipient = args[0];
        parsedArgs.content = args.slice(1).join(' ');
      }
    } else {
      order.forEach((key, index) => {
        if (args[index] !== undefined) {
          parsedArgs[key] = args[index];
        }
      });
    }

    // If we have all required args, execute directly
    if (needsDialog.includes(skillId)) {
      const hasAllRequiredArgs = order.every((key, index) => {
        // message is special - content is optional
        if (skillId === 'message' && key === 'content' && index === 1) return true;
        return parsedArgs[key] !== undefined;
      });

      if (hasAllRequiredArgs) {
        // Execute directly with parsed args
        executeSkill(skillId as any, parsedArgs);
        setCommandPaletteOpen(false);
      } else {
        // Incomplete args, show dialog
        setDialogSkill(skillId);
        setCommandPaletteOpen(false);
      }
    } else {
      // Core command with possible extra args
      executeSkill(skillId as any, parsedArgs);
      setCommandPaletteOpen(false);
    }
  };

  const handleSkillSelect = (skillId: string) => {
    // Block action skills if player already acted this turn
    if (playerActedThisTurn && ACTION_SKILLS.includes(skillId)) {
      setSubmitError({ message: `You've already taken an action this turn. Advance to the next turn first.`, type: 'info' });
      return;
    }

    if (needsDialog.includes(skillId)) {
      // Close palette and open the parameter dialog
      setCommandPaletteOpen(false);
      setDialogSkill(skillId);
    } else {
      // Core commands execute directly
      executeSkill(skillId as any, {});
      setCommandPaletteOpen(false);
    }
  };

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
        // Check if query looks like a full command (has spaces or is a known skill with args)
        const trimmed = query.trim();
        const looksLikeRawCommand = trimmed.includes(' ') || trimmed.match(/^\/\w+\s/);

        if (looksLikeRawCommand) {
          handleRawCommandSubmit();
        } else {
          const skill = filteredSkills[selectedIndex];
          if (skill) {
            handleSkillSelect(skill.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSkills, selectedIndex, query, handleSkillSelect, setCommandPaletteOpen]);

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
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); setSubmitError(null); }}
            placeholder="Type a command or /skillname args..."
            className="flex-1 bg-transparent outline-none text-lg placeholder:text-zinc-600"
            autoFocus
          />
          {query.trim() && (
            <button
              onClick={handleRawCommandSubmit}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors"
            >
              Submit
            </button>
          )}
        </div>

        {/* Already acted this turn banner */}
        {playerActedThisTurn && (
          <div className="px-4 py-2 border-b bg-amber-900/20 border-amber-800/50">
            <p className="text-sm text-amber-400">✓ You've already taken an action this turn. Use /status, /message, or advance to the next turn.</p>
          </div>
        )}

        {/* Error or info message */}
        {submitError && (
          <div className={`px-4 py-2 border-b ${submitError.type === 'error' ? 'bg-red-900/30 border-red-800' : 'bg-blue-900/30 border-blue-800'}`}>
            <p className={`text-sm ${submitError.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
              {submitError.message}
            </p>
          </div>
        )}

        <div className="max-h-80 overflow-auto p-2">
          {filteredSkills.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">No commands found</div>
          ) : (
            <div className="space-y-1">
              {filteredSkills.map((skill, index) => {
                const isActionDisabled = playerActedThisTurn && ACTION_SKILLS.includes(skill.id);
                return (
                <button
                  key={skill.id}
                  onClick={() => handleSkillSelect(skill.id)}
                  disabled={isActionDisabled}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                    isActionDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : index === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className={`px-2 py-1 bg-zinc-800 rounded text-sm ${isActionDisabled ? 'text-zinc-600' : 'text-amber-400'}`}>
                        /{skill.id}
                      </code>
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-500">
                      {isActionDisabled ? '✓ acted' : skill.category}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 ml-14">{skill.description}</p>
                </button>
                );
              })}
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
            {query.trim().includes(' ') ? 'Submit command' : 'Select'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">/</kbd>
            Commands
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
