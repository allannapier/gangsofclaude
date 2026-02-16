import { useState, useMemo } from 'react';
import { useGameStore } from '../store';

function getSuggestedAction(player: { rank: string; family: string; wealth: number; respect: number }, events: any[], turn: number) {
  const isOutsider = player.rank === 'Outsider' || player.family === 'None';
  const playerActedThisTurn = events.some(e => e.actor === 'Player' && e.turn === turn && e.action !== 'status' && e.action !== 'next-turn');

  if (isOutsider) return { text: '🤝 Join a family to get started!', action: 'seek-patronage' };
  if (!playerActedThisTurn && player.wealth >= 10) {
    if (player.respect < 10) return { text: '🕵️ Gather intel to build respect', action: 'intel' };
    if (player.wealth >= 50) return { text: '📍 Expand your territory', action: 'expand' };
    if (player.wealth >= 25) return { text: '📍 Claim unclaimed territory ($25)', action: 'claim' };
    return { text: '⚔️ Take action before ending turn', action: null };
  }
  if (player.wealth < 10) return { text: '💰 Low on funds — advance turns to earn income', action: null };
  return null;
}

export function PlayerStats() {
  const { player, events, gameState, executeSkill, setDialogSkill, setCommandPaletteOpen, isProcessingTurn, lastIncomeReport } = useGameStore();
  const [showNextTurnConfirm, setShowNextTurnConfirm] = useState(false);
  const isOutsider = player.rank === 'Outsider' || player.family === 'None';

  const playerActedThisTurn = useMemo(() => {
    return events.some(e => e.actor === 'Player' && e.turn === gameState.turn && e.action !== 'status' && e.action !== 'next-turn');
  }, [events, gameState.turn]);

  const suggestion = useMemo(() =>
    getSuggestedAction(player, events, gameState.turn),
    [player, events, gameState.turn]
  );

  const handleNextTurn = () => {
    if (!playerActedThisTurn && !isOutsider) {
      setShowNextTurnConfirm(true);
    } else {
      executeSkill('next-turn', {});
    }
  };

  const confirmNextTurn = () => {
    setShowNextTurnConfirm(false);
    executeSkill('next-turn', {});
  };

  return (
    <div className="bg-zinc-900/50 border-b border-zinc-800 px-3 md:px-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
        <div className="flex items-center gap-3 md:gap-6 overflow-x-auto scrollbar-hide">
          <div className="flex-shrink-0">
            <span className="text-[10px] md:text-xs text-zinc-500">Rank</span>
            <p className="text-sm md:text-base font-semibold">{player.rank}</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-[10px] md:text-xs text-zinc-500">Family</span>
            <p className="text-sm md:text-base font-semibold">{player.family}</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-[10px] md:text-xs text-zinc-500">Wealth</span>
            <p className="text-sm md:text-base font-semibold text-green-400">
              ${player.wealth.toLocaleString()}
              {lastIncomeReport && lastIncomeReport.total > 0 && (
                <span className="text-[10px] md:text-xs text-green-600 ml-1" title={lastIncomeReport.description}>
                  +${lastIncomeReport.total}/turn
                </span>
              )}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-[10px] md:text-xs text-zinc-500">Respect</span>
            <p className="text-sm md:text-base font-semibold text-amber-400">{player.respect}</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-[10px] md:text-xs text-zinc-500">Loyalty</span>
            <p className="text-sm md:text-base font-semibold text-blue-400">{player.loyalty}%</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {suggestion && (
            <button
              onClick={() => {
                if (suggestion.action) setDialogSkill(suggestion.action);
                else setCommandPaletteOpen(true);
              }}
              className="hidden md:flex items-center px-2.5 py-1.5 text-xs bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors border border-zinc-700/50"
            >
              {suggestion.text}
            </button>
          )}
          {isOutsider && (
            <button
              onClick={() => setDialogSkill('seek-patronage')}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 rounded-md transition-colors border border-purple-800/50"
            >
              <span className="hidden sm:inline">🤝 </span>Join Gang
            </button>
          )}
          <button
            onClick={handleNextTurn}
            disabled={isProcessingTurn}
            className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded-md transition-colors border border-blue-800/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">⏭️ </span>Next Turn
          </button>
        </div>
      </div>

      {/* Next Turn Confirmation */}
      {showNextTurnConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowNextTurnConfirm(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">⚠️ End Turn Without Acting?</h3>
            <p className="text-sm text-zinc-400 mb-4">
              You haven't taken any actions this turn. Each turn is a chance to grow your influence — consider attacking, gathering intel, or expanding territory first.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNextTurnConfirm(false); setCommandPaletteOpen(true); }}
                className="px-4 py-2 text-sm bg-amber-700/40 hover:bg-amber-700/60 text-amber-200 rounded-lg border border-amber-600/50 transition-colors"
              >
                Take Action
              </button>
              <button
                onClick={confirmNextTurn}
                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-600 transition-colors"
              >
                Skip &amp; Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
