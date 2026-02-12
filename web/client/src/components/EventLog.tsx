import { useGameStore } from '../store';

export function EventLog() {
  const { events } = useGameStore();

  return (
    <div className="flex-1 overflow-auto p-4 space-y-2">
      {events.length === 0 ? (
        <div className="text-center text-zinc-600 py-8">
          <p className="text-sm">No events yet</p>
          <p className="text-xs mt-1">Use commands to start the game</p>
        </div>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">Turn {event.turn}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                event.type === 'attack' ? 'bg-red-900/50 text-red-400' :
                event.type === 'recruit' ? 'bg-green-900/50 text-green-400' :
                event.type === 'message' ? 'bg-blue-900/50 text-blue-400' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {event.type}
              </span>
            </div>
            <p className="text-sm">{event.description}</p>
          </div>
        ))
      )}
    </div>
  );
}
