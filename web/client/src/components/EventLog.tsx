import { useGameStore } from '../store';
import { FAMILY_COLORS } from '../types';
import { ActionIcon, MuscleIcon, UpgradeIcon, MoveIcon, MessageIcon, ClaimIcon } from './Icons';

export function EventLog() {
  const { state } = useGameStore();

  // Show events from current and previous turn
  const recentEvents = state.events
    .filter((e) => e.turn >= Math.max(1, state.turn - 1))
    .reverse();

  return (
    <div className="flex-1 overflow-auto p-4">
      <h3 className="font-bold mb-2 text-sm text-zinc-400">Event Log</h3>
      {recentEvents.length === 0 ? (
        <div className="text-sm text-zinc-600">No events yet. Take an action or advance the turn.</div>
      ) : (
        <div className="space-y-2">
          {recentEvents.map((event, i) => {
            const familyId = Object.entries(state.families).find(([, f]) => f.name === event.actor)?.[0];
            const color = familyId ? FAMILY_COLORS[familyId] : '#888';
            const actionIcons: Record<string, any> = {
              attack: <ActionIcon size={14} />,
              hire: <MuscleIcon size={14} />,
              upgrade: <UpgradeIcon size={14} />,
              move: <MoveIcon size={14} />,
              claim: <ClaimIcon size={14} />,
              income: '💰',
              diplomacy: <MessageIcon size={14} />,
              eliminated: '💀',
              victory: '🏆',
              wait: '⏳',
            };
            return (
              <div key={i} className="text-sm border-l-2 pl-3 py-1" style={{ borderColor: color }}>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs">T{event.turn}</span>
                  <span className="inline-flex items-center justify-center w-5">{actionIcons[event.action] || '📌'}</span>
                  <span style={{ color }} className="font-medium">{event.actor}</span>
                </div>
                <div className="text-zinc-400 text-xs mt-0.5">{event.details}</div>
                {event.result && (
                  <div className="text-zinc-300 text-xs mt-0.5 font-medium">{event.result}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
