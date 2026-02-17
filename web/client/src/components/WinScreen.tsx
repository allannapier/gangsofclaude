import { useGameStore } from '../store';
import { FAMILY_COLORS } from '../types';

export function WinScreen() {
  const { state, resetGame } = useGameStore();
  const winnerId = state.winner;
  const winnerName = winnerId ? state.families[winnerId]?.name : 'Unknown';
  const color = winnerId ? FAMILY_COLORS[winnerId] : '#888';
  const isPlayerWin = winnerId === state.playerFamily;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-8 text-center">
      <div className="text-6xl mb-6">{isPlayerWin ? '🏆' : '💀'}</div>
      <h2 className="text-4xl font-bold mb-4" style={{ color }}>
        {isPlayerWin ? 'VICTORY!' : 'DEFEAT'}
      </h2>
      <p className="text-xl text-zinc-400 mb-2">
        {isPlayerWin
          ? 'You have conquered all territories!'
          : `The ${winnerName} family has taken control of the city.`}
      </p>
      <p className="text-zinc-500 mb-8">Game ended on turn {state.turn}</p>
      <button
        onClick={resetGame}
        className="px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-lg"
      >
        Play Again
      </button>
    </div>
  );
}
