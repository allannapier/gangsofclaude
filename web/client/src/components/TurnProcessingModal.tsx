import { useGameStore } from '../store';
import { useEffect, useState, useRef } from 'react';
import { Loader2, Swords, Shield, Crown, UserPlus, Eye, Scroll, MessageSquare, Sparkles } from 'lucide-react';

interface TurnProcessingModalProps {
  isOpen: boolean;
  onClose?: () => void;
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

export function TurnProcessingModal({ isOpen, onClose }: TurnProcessingModalProps) {
  const { gameState, events, processingTurnTarget, isProcessingTurn } = useGameStore();
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [progress, setProgress] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [processingTurn, setProcessingTurn] = useState<number>(gameState.turn);
  const [isComplete, setIsComplete] = useState(false);
  const [completedActions, setCompletedActions] = useState<Action[]>([]);
  const baselineEventCountRef = useRef(0);
  const lastProcessedCountRef = useRef(0);
  const seenActionsRef = useRef<Set<string>>(new Set());
  const isFirstOpenRef = useRef(true);
  const hasShownCompletionRef = useRef(false);

  // Track which turn we're processing - capture baseline on first open
  useEffect(() => {
    if (isOpen && isFirstOpenRef.current) {
      const targetTurn = processingTurnTarget ?? gameState.turn;
      setProcessingTurn(Math.max(targetTurn, 1));
      setIsComplete(false);
      setCompletedActions([]);
      // Capture baseline: any events beyond this count are "new" for this turn
      baselineEventCountRef.current = events.length;
      lastProcessedCountRef.current = 0;
      seenActionsRef.current.clear();
      isFirstOpenRef.current = false;
      console.log('[TurnProcessingModal] Processing turn:', targetTurn, { baseline: events.length, gameStateTurn: gameState.turn, processingTurnTarget });
    }

    if (!isOpen) {
      isFirstOpenRef.current = true;
      setIsComplete(false);
      setCompletedActions([]);
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

  // Detect turn completion - when isProcessingTurn becomes false, the turn is done
  useEffect(() => {
    if (isOpen && isProcessingTurn === false && processingTurnTarget !== null && !hasShownCompletionRef.current) {
      // Turn has completed - gather all new events since modal opened
      const newEvents = events.slice(baselineEventCountRef.current);
      const actions: Action[] = newEvents.map(evt => ({
        actor: evt.actor,
        action: typeof evt.action === 'string' ? evt.action : (evt.action && typeof evt.action === 'object' ? (evt.action as any).skill || 'unknown' : String(evt.action || 'unknown')),
        target: evt.target || 'none',
        description: evt.description || '',
      }));

      setIsComplete(true);
      setCompletedActions(actions);
      setProgress(100);
      hasShownCompletionRef.current = true;

      console.log('[TurnProcessingModal] Turn complete:', { processingTurn, actionsCount: actions.length });
    }

    // Reset completion state if modal reopens for a new turn
    if (isOpen && isProcessingTurn) {
      setIsComplete(false);
      setCompletedActions([]);
      setProgress(0);
      hasShownCompletionRef.current = false;
    }
  }, [isOpen, isProcessingTurn, processingTurnTarget, processingTurn, events]);

  // Track new events as they arrive during turn processing
  useEffect(() => {
    if (!isOpen) {
      setCurrentAction(null);
      setProgress(0);
      setActionCount(0);
      lastProcessedCountRef.current = 0;
      seenActionsRef.current.clear();
      return;
    }

    // Get events that arrived since the modal opened (baseline tracking)
    const newEvents = events.slice(baselineEventCountRef.current);
    const newCount = newEvents.length;

    console.log('[TurnProcessingModal] Debug:', {
      processingTurn,
      totalEvents: events.length,
      baseline: baselineEventCountRef.current,
      newEventsThisTurn: newCount,
      lastProcessed: lastProcessedCountRef.current,
      processingTurnTarget,
      isComplete,
    });

    // Check if we have new events beyond what we've already processed
    if (newCount > lastProcessedCountRef.current && !isComplete) {
      const unprocessed = newEvents.slice(lastProcessedCountRef.current);

      for (const evt of unprocessed) {
        const actionStr = typeof evt.action === 'string' ? evt.action : (evt.action && typeof evt.action === 'object' ? (evt.action as any).skill || 'unknown' : String(evt.action || 'unknown'));
        const actionKey = `${evt.turn}-${evt.actor}-${actionStr}`;

        if (seenActionsRef.current.has(actionKey)) continue;
        seenActionsRef.current.add(actionKey);

        setCurrentAction({
          actor: evt.actor,
          action: actionStr,
          target: evt.target || 'none',
          description: evt.description || '',
        });
      }

      lastProcessedCountRef.current = newCount;
      setActionCount(newCount);

      // Calculate progress (assume ~22 actions per turn, cap at 95% until complete)
      const progressPercent = Math.min((newCount / 22) * 100, 95);
      setProgress(progressPercent);
    }
  }, [events, processingTurn, processingTurnTarget, isOpen, isComplete]);

  if (!isOpen) return null;

  const actionIcon = currentAction ? (actionIcons[currentAction.action] || actionIcons.default) : actionIcons.default;
  const actionText = currentAction ? currentAction.action.replace(/_/g, ' ') : 'Initializing...';

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 overflow-hidden"
      onClick={() => isComplete && onClose?.()}
    >
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
          {isComplete ? `Turn ${processingTurn} Complete` : `Processing Turn ${processingTurn}`}
        </h2>
        <p className="text-zinc-400 mb-6">
          {isComplete
            ? 'All families have made their moves.'
            : 'The families are making their moves...'}
        </p>

        {/* Progress Bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-500 ${isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 via-red-500 to-amber-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {!isComplete ? (
          <>
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
          </>
        ) : (
          <>
            {/* Completion Summary */}
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-4 min-h-[120px] flex flex-col justify-center border border-zinc-700/50">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Turn Summary</p>

              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-green-400 mb-1">{completedActions.length}</p>
                <p className="text-sm text-zinc-400">actions completed</p>
              </div>

              {/* Action breakdown by type */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(() => {
                  const actionCounts = completedActions.reduce((acc, a) => {
                    const type = a.action.split('_')[0]; // Get base action type
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const topActions = Object.entries(actionCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6);

                  return topActions.map(([type, count]) => (
                    <div key={type} className="bg-zinc-900/50 rounded px-2 py-1 text-center">
                      <span className="text-amber-400 font-medium">{count}</span>
                      <span className="text-zinc-500 ml-1">{type}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Success message */}
            <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Turn complete!</span>
            </div>

            {/* Close instruction */}
            <p className="text-sm text-zinc-300 flex items-center justify-center gap-2 cursor-pointer hover:text-zinc-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7M15 5l-7 7 7-7" />
              </svg>
              Click anywhere to close
            </p>
          </>
        )}
      </div>
    </div>
  );
}
