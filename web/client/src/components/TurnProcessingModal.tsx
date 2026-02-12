import { useGameStore } from '../store';
import { useEffect, useState, useRef } from 'react';
import { Loader2, Swords, Shield, Crown, UserPlus, Eye, Scroll, MessageSquare, Sparkles } from 'lucide-react';

interface TurnProcessingModalProps {
  isOpen: boolean;
}

interface Action {
  actor: string;
  action: string;
  target: string;
  description: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  attack: <Swords className="w-5 h-5 text-red-400" />,
  plan_attack: <Swords className="w-5 h-5 text-red-400" />,
  recruit: <UserPlus className="w-5 h-5 text-green-400" />,
  train: <UserPlus className="w-5 h-5 text-green-400" />,
  scout: <Eye className="w-5 h-5 text-yellow-400" />,
  surveillance: <Eye className="w-5 h-5 text-yellow-400" />,
  gather_intel: <Eye className="w-5 h-5 text-yellow-400" />,
  guard: <Shield className="w-5 h-5 text-cyan-400" />,
  prepare_defense: <Shield className="w-5 h-5 text-cyan-400" />,
  advise: <Scroll className="w-5 h-5 text-amber-400" />,
  report: <Scroll className="w-5 h-5 text-amber-400" />,
  message: <MessageSquare className="w-5 h-5 text-blue-400" />,
  default: <Sparkles className="w-5 h-5 text-purple-400" />,
};

const backgrounds = [
  '/gangs1.png',
  '/gangs2.png',
];

export function TurnProcessingModal({ isOpen }: TurnProcessingModalProps) {
  const { gameState, events, processingTurnTarget } = useGameStore();
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [progress, setProgress] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [processingTurn, setProcessingTurn] = useState<number>(gameState.turn);
  const lastEventCountRef = useRef(0);
  const seenActionsRef = useRef<Set<string>>(new Set());
  const isFirstOpenRef = useRef(true);

  // Track which turn we're processing - capture it on first open
  useEffect(() => {
    if (isOpen && isFirstOpenRef.current) {
      // Use explicit store target if present, fallback to upcoming turn.
      let targetTurn = processingTurnTarget ?? (gameState.turn + 1);
      if (targetTurn < 1) targetTurn = 1;
      setProcessingTurn(targetTurn);
      isFirstOpenRef.current = false;
      console.log('[TurnProcessingModal] Processing turn:', targetTurn, { gameStateTurn: gameState.turn, processingTurnTarget });
    }

    if (!isOpen) {
      isFirstOpenRef.current = true;
    }
  }, [isOpen, gameState.turn, processingTurnTarget]);

  // Cycle background images
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Track new events as they arrive during turn processing
  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setCurrentAction(null);
      setProgress(0);
      setActionCount(0);
      lastEventCountRef.current = 0;
      seenActionsRef.current.clear();
      return;
    }

    // Get events for the turn we're processing
    const currentTurnEvents = events.filter(e => e.turn === processingTurn);

    // DEBUG logging
    console.log('[TurnProcessingModal] Debug:', {
      processingTurn,
      totalEvents: events.length,
      currentTurnEvents: currentTurnEvents.length,
      lastCount: lastEventCountRef.current,
      processingTurnTarget
    });

    // Check if we have new events
    if (currentTurnEvents.length > lastEventCountRef.current) {
      // Find the newest event (the one we haven't seen yet)
      const newEvents = currentTurnEvents.slice(lastEventCountRef.current);

      for (const evt of newEvents) {
        // Create unique key for this action
        const actionKey = `${evt.turn}-${evt.actor}-${evt.action}`;

        // Skip if we've already seen this action
        if (seenActionsRef.current.has(actionKey)) continue;
        seenActionsRef.current.add(actionKey);

        // Update current action - this replaces the previous one
        setCurrentAction({
          actor: evt.actor,
          action: evt.action,
          target: evt.target || 'none',
          description: evt.description || '',
        });
      }

      // Update counts
      lastEventCountRef.current = currentTurnEvents.length;
      setActionCount(currentTurnEvents.length);

      // Calculate progress (assume ~22 actions per turn)
      const progressPercent = Math.min((currentTurnEvents.length / 22) * 100, 95);
      setProgress(progressPercent);
    }
  }, [events, processingTurn, processingTurnTarget, isOpen]);

  if (!isOpen) return null;

  const actionIcon = currentAction ? (actionIcons[currentAction.action] || actionIcons.default) : actionIcons.default;
  const actionText = currentAction ? currentAction.action.replace(/_/g, ' ') : 'Initializing...';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 overflow-hidden">
      {/* Background Images */}
      {backgrounds.map((bg, index) => (
        <div
          key={bg}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: index === currentBgIndex ? 0.4 : 0,
          }}
        />
      ))}

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 bg-zinc-900/80 border border-zinc-600/50 rounded-2xl w-full max-w-md p-8 shadow-2xl text-center backdrop-blur-sm">
        {/* Animated Icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-zinc-700/50 border-t-amber-500 animate-spin" />
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 rounded-full border-4 border-zinc-700/50 border-t-red-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          {/* Inner static icon */}
          <div className="absolute inset-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <Crown className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">
          Processing Turn {processingTurn}
        </h2>
        <p className="text-zinc-400 mb-6">
          The families are making their moves...
        </p>

        {/* Progress Bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Action - Shows latest action, replaces previous */}
        <div className="bg-zinc-800/50 rounded-xl p-4 mb-4 min-h-[120px] flex flex-col justify-center border border-zinc-700/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Latest Action</p>

          {currentAction ? (
            <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                {actionIcon}
              </div>
              <div className="text-left">
                <p className="font-semibold text-zinc-200 capitalize text-lg">{actionText}</p>
                <p className="text-sm text-amber-400 font-medium">{currentAction.actor}</p>
                {currentAction.description && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 max-w-[200px]">
                    {currentAction.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Waiting for actions...</span>
            </div>
          )}
        </div>

        {/* Action counter */}
        <div className="flex items-center justify-center gap-2 text-zinc-400 mb-4">
          <span className="text-sm">{actionCount} actions processed</span>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Please wait...</span>
        </div>
      </div>
    </div>
  );
}
