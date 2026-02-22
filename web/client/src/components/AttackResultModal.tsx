import { useState, useEffect } from 'react';
import { useGameStore, type AttackModalData } from '../store';
import { FAMILY_COLORS } from '../types';
import { MuscleIcon } from './Icons';

function getFamilyColor(name: string | null): string {
  if (!name) return '#71717a';
  const key = name.toLowerCase().replace(/\s*family$/i, '');
  return FAMILY_COLORS[key] || '#71717a';
}

export function AttackResultModal() {
  const { attackModal, dismissAttackModal } = useGameStore();
  const [phase, setPhase] = useState<'attacking' | 'result'>('attacking');

  useEffect(() => {
    if (attackModal) {
      setPhase('attacking');
      const timer = setTimeout(() => setPhase('result'), 1500);
      return () => clearTimeout(timer);
    }
  }, [attackModal]);

  if (!attackModal) return null;

  const d = attackModal;
  const attackerColor = getFamilyColor(d.attackerFamily);
  const defenderColor = getFamilyColor(d.defenderFamily);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-[420px] overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-3 text-center text-xs font-bold uppercase tracking-widest ${
          phase === 'attacking' ? 'bg-amber-900/60 text-amber-300' :
          d.victory ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
        } transition-colors duration-500`}>
          {phase === 'attacking' ? '⚔️ Attack In Progress...' :
           d.victory ? '🏆 Victory!' : '💀 Defeated!'}
        </div>

        {/* Territory target */}
        <div className="px-6 pt-4 pb-2 text-center">
          <div className="text-zinc-500 text-xs uppercase tracking-wide">Target</div>
          <div className="text-lg font-bold text-white">{d.targetName}</div>
        </div>

        {/* VS Layout */}
        <div className="px-6 py-4 flex items-center gap-4">
          {/* Attacker */}
          <div className="flex-1 text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Attacker</div>
            <div className="font-bold text-sm" style={{ color: attackerColor }}>{d.attackerFamily}</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-zinc-300">
              <MuscleIcon size={16} />
              <span className="text-lg font-bold">{d.attackerMuscle}</span>
            </div>
          </div>

          {/* VS divider */}
          <div className={`text-2xl font-black ${
            phase === 'attacking' ? 'text-amber-500 animate-pulse' : 'text-zinc-600'
          } transition-colors duration-500`}>
            VS
          </div>

          {/* Defender */}
          <div className="flex-1 text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Defender</div>
            <div className="font-bold text-sm" style={{ color: defenderColor }}>
              {d.defenderFamily || 'Unclaimed'}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2 text-zinc-300">
              <MuscleIcon size={16} />
              <span className="text-lg font-bold">{d.defenderMuscle}</span>
            </div>
          </div>
        </div>

        {/* Result details — revealed after phase change */}
        <div className={`px-6 overflow-hidden transition-all duration-500 ${
          phase === 'result' ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-zinc-700 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Your losses:</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <MuscleIcon size={14} /> -{d.attackerLosses}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Enemy losses:</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <MuscleIcon size={14} /> -{d.defenderLosses}
              </span>
            </div>
            {d.victory && (
              <div className="text-center text-green-400 text-sm font-bold pt-1">
                🏴 {d.targetName} is now yours!
              </div>
            )}
          </div>
        </div>

        {/* Dismiss button — only after result revealed */}
        {phase === 'result' && (
          <div className="px-6 pb-4">
            <button
              onClick={dismissAttackModal}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-sm font-bold text-zinc-300 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
