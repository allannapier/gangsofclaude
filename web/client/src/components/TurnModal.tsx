import { useGameStore } from '../store';
import { FAMILY_COLORS } from '../types';
import { ActionIcon, MuscleIcon, UpgradeIcon, MoveIcon, MessageIcon, ClaimIcon } from './Icons';

export function TurnModal() {
  const { turnEvents, isProcessingTurn, state, dismissTurnModal } = useGameStore();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="font-bold text-lg">
            {isProcessingTurn ? '⏳ Processing Turn...' : `✅ Turn ${state.turn} Complete`}
          </h2>
          {!isProcessingTurn && (
            <button onClick={dismissTurnModal} className="text-zinc-400 hover:text-white text-lg">✕</button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {turnEvents.length === 0 && isProcessingTurn && (
            <div className="text-zinc-500 text-sm animate-pulse">Processing economy and AI decisions...</div>
          )}
          {turnEvents.map((event, i) => {
            const familyId = Object.entries(state.families).find(([, f]) => f.name === event.actor)?.[0];
            const color = familyId ? FAMILY_COLORS[familyId] : '#888';
            const actionIcons: Record<string, any> = {
              attack: <ActionIcon size={14} />,
              hire: <MuscleIcon size={14} />,
              business: <UpgradeIcon size={14} />,
              move: <MoveIcon size={14} />,
              claim: <ClaimIcon size={14} />,
              income: '💰',
              diplomacy: <MessageIcon size={14} />,
              eliminated: '💀',
              bounty: '💰',
              victory: '🏆',
              wait: '⏳',
            };
            return (
              <div key={i} className="text-sm border-l-2 pl-3 py-1 animate-fadeIn" style={{ borderColor: color }}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5">{actionIcons[event.action] || '📌'}</span>
                  <span style={{ color }} className="font-medium">{event.actor}</span>
                </div>
                <div className="text-zinc-400 text-xs">{event.details}</div>
                {event.result && <div className="text-zinc-300 text-xs font-medium">{event.result}</div>}
              </div>
            );
          })}
        </div>
        {!isProcessingTurn && (
          <div className="p-4 border-t border-zinc-700">
            <button onClick={dismissTurnModal} className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded font-bold">
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
