import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from './store';
import { Header } from './components/Header';
import { PlayerStats } from './components/PlayerStats';
import { TurnHistoryBrowser } from './components/TurnHistoryBrowser';
import { GameTabs } from './components/GameTabs';
import { DetailsPanel } from './components/DetailsPanel';
import { CommandPalette } from './components/CommandPalette';
import { CommandResponseModal } from './components/CommandResponseModal';
import { TurnProcessingModal } from './components/TurnProcessingModal';
import { ClaudeOutput } from './components/ClaudeOutput';
import { ActionDialog } from './components/ActionDialog';

function App() {
  const {
    connected,
    cliConnected,
    connecting,
    connect,
    commandPaletteOpen,
    dialogSkill,
    setDialogSkill,
    events,
    gameState,
    setViewingTurn,
    ws,
    setEvents,
    commandResponseModalOpen,
    setCommandResponseModalOpen,
    setCommandResponse,
    setIsCommandLoading,
    isProcessingTurn,
    processingTurnTarget,
    setIsProcessingTurn,
  } = useGameStore();

  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const hasRequestedEvents = useRef(false);
  const previousTurnRef = useRef(gameState.turn);

  useEffect(() => {
    connect();
  }, [connect]);

  // Reset request flag when websocket reconnects
  useEffect(() => {
    if (ws) {
      hasRequestedEvents.current = false;
    }
  }, [ws]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useGameStore.getState().setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Request events data from server when connected
  const requestEvents = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      console.log('[App] Requesting events...');
      ws.send(JSON.stringify({
        type: 'request_events',
        sessionId: useGameStore.getState().sessionId,
      }));
    }
  }, [ws]);

  // Request tasks data from server when connected
  const requestTasks = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      console.log('[App] Requesting tasks...');
      ws.send(JSON.stringify({
        type: 'request_tasks',
        sessionId: useGameStore.getState().sessionId,
      }));
    }
  }, [ws]);

  // Sync viewingTurn with current game turn when it changes
  useEffect(() => {
    setViewingTurn(gameState.turn);

    // Detect when a new turn completes (turn number increased)
    if (gameState.turn > previousTurnRef.current) {
      previousTurnRef.current = gameState.turn;

      // Request fresh events after a short delay to get the new turn's events
      setTimeout(() => {
        requestEvents();
      }, 500);
    }
  }, [gameState.turn, setViewingTurn, requestEvents]);

  // Hide processing modal when we receive enough events for the turn being processed
  useEffect(() => {
    if (!isProcessingTurn || processingTurnTarget == null) {
      return;
    }

    const targetTurnEvents = events.filter((e) => e.turn === processingTurnTarget);
    if (targetTurnEvents.length >= 22) {
      // Give it a moment to show the last action
      const timer = setTimeout(() => {
        setIsProcessingTurn(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [events, isProcessingTurn, processingTurnTarget, setIsProcessingTurn]);

  useEffect(() => {
    if (connected && ws && !hasRequestedEvents.current) {
      hasRequestedEvents.current = true;
      requestEvents();
      requestTasks();
    }
  }, [connected, ws, requestEvents, requestTasks]);

  // Listen for events data from server
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received:', data.type);

        if (data.type === 'events_update' && data.events) {
          console.log('[WebSocket] Loading', data.events.length, 'events');
          // Convert server events to GameEvent format and set all at once
          const gameEvents = data.events.map((evt: any, idx: number) => ({
            id: `${evt.turn}-${evt.actor}-${evt.action}-${idx}`,
            turn: evt.turn,
            type: evt.type || 'action',
            actor: evt.actor,
            action: evt.action,
            target: evt.target,
            description: evt.description,
          }));
          setEvents(gameEvents);
        }

        if (data.type === 'tasks_update' && data.tasks) {
          console.log('[WebSocket] Loading', data.tasks.length, 'tasks');
          useGameStore.getState().setTasks(data.tasks);
        }

        // Handle action started - show turn processing and update current action
        if (data.type === 'action_started' && data.action) {
          console.log('[WebSocket] Action started:', data.action);
          // If we get an action_started, we're processing a turn
          setIsProcessingTurn(true);
          // Close command response modal if it's open
          if (commandResponseModalOpen) {
            setCommandResponseModalOpen(false);
          }
        }

        // Handle turn processing complete
        if (data.type === 'turn_complete') {
          console.log('[WebSocket] Turn complete');
          setIsProcessingTurn(false);
        }

        if (data.type === 'game_state_update' && data.gameState) {
          console.log('[WebSocket] Game state update:', data.gameState);
          // Update game state including current turn
          useGameStore.setState(state => ({
            gameState: {
              ...state.gameState,
              ...data.gameState,
            },
          }));
        }

        // Capture command responses (content deltas from Claude)
        if (data.type === 'content_delta') {
          const text = data.delta?.text || '';
          if (text) {
            const currentResponse = useGameStore.getState().commandResponse;
            setCommandResponse(currentResponse + text);
          }
        }

        // Check for response completion (when we get a stop signal or similar)
        if (data.type === 'response_complete' || data.type === 'stop') {
          setIsCommandLoading(false);
        }
      } catch (e) {
        // Not JSON, treat as plain text response
        if (event.data && typeof event.data === 'string') {
          const currentResponse = useGameStore.getState().commandResponse;
          setCommandResponse(currentResponse + event.data);
        }
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, setEvents, setCommandResponse, setIsCommandLoading]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Turn History */}
        <div className="w-[480px] bg-zinc-900/30 border-r border-zinc-800 flex flex-col">
          <TurnHistoryBrowser
            events={events}
            currentTurn={gameState.turn}
            onTurnChange={setViewingTurn}
            onRefresh={requestEvents}
          />
        </div>

        {/* Middle Column - Game Tabs (Territories/Families) */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <PlayerStats />

          <div className="flex-1 overflow-hidden">
            <GameTabs />
          </div>

          {/* Command Output - Collapsible */}
          <div className={`bg-zinc-900/50 border-t border-zinc-800 flex flex-col transition-all duration-300 ${isOutputExpanded ? 'h-[300px]' : 'h-auto'}`}>
            <ClaudeOutput
              isExpanded={isOutputExpanded}
              onToggleExpand={() => setIsOutputExpanded(!isOutputExpanded)}
            />
          </div>
        </main>

        {/* Right Column - Details Panel */}
        <aside className="w-80 bg-zinc-900/30 border-l border-zinc-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Details</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <DetailsPanel />
          </div>
        </aside>
      </div>

      {commandPaletteOpen && <CommandPalette />}

      <CommandResponseModal
        isOpen={commandResponseModalOpen}
        onClose={() => setCommandResponseModalOpen(false)}
      />

      <TurnProcessingModal
        isOpen={isProcessingTurn}
      />

      {dialogSkill && <ActionDialog skill={dialogSkill} onClose={() => setDialogSkill(null)} />}

      {(!connected || !cliConnected) && (
        <div className="fixed bottom-4 right-4 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 max-w-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              cliConnected ? 'bg-green-500' :
              connected ? 'bg-yellow-500 animate-pulse' :
              connecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-sm text-zinc-400">
              {cliConnected ? 'CLI Connected' :
               connected ? 'Starting CLI...' :
               connecting ? 'Connecting to server...' : 'Server disconnected'}
            </span>
          </div>
          {connected && !cliConnected && (
            <div className="text-xs text-zinc-500 border-t border-zinc-700 pt-2 mt-2">
              <p className="flex items-center gap-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Auto-starting Claude Code CLI...
              </p>
            </div>
          )}
          {!connected && !connecting && (
            <button
              onClick={connect}
              className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded mt-2 w-full"
            >
              Reconnect to Server
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
