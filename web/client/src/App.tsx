import { useEffect, useState } from 'react';
import { useGameStore } from './store';
import { Header } from './components/Header';
import { PlayerStats } from './components/PlayerStats';
import { TurnHistoryBrowser } from './components/TurnHistoryBrowser';
import { GameTabs } from './components/GameTabs';
import { DetailsPanel } from './components/DetailsPanel';
import { CommandPalette } from './components/CommandPalette';
import { CommandResponseModal } from './components/CommandResponseModal';
import { TurnProcessingModal } from './components/TurnProcessingModal';
import { ToastContainer } from './components/Toast';
import { ClaudeOutput } from './components/ClaudeOutput';
import { ActionDialog } from './components/ActionDialog';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDebugger } from './components/MobileDebugger';

export default function App() {
  const {
    connected,
    cliConnected,
    connecting,
    connect,
    commandPaletteOpen,
    dialogSkill,
    events,
    gameState,
    setViewingTurn,
    ws,
    setEvents,
    commandResponseModalOpen,
    setCommandResponseModalOpen,
    isProcessingTurn,
    setIsProcessingTurn,
    setCommandPaletteOpen,
    setDialogSkill,
  } = useGameStore();

  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'game' | 'history' | 'details' | 'actions'>('game');
  const [showTurnModal, setShowTurnModal] = useState(false);

  // Show turn modal when processing starts, keep it open until user closes
  useEffect(() => {
    if (isProcessingTurn) {
      setShowTurnModal(true);
    }
  }, [isProcessingTurn]);
  useEffect(() => {
    connect();
  }, [connect]);

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
  const requestEvents = () => {
    const state = useGameStore.getState();
    if (state.ws?.readyState === WebSocket.OPEN) {
      console.log('[App] Requesting events...');
      state.ws.send(JSON.stringify({
        type: 'request_events',
        sessionId: state.sessionId,
      }));
    }
  };

  // Sync viewingTurn with current game turn when it changes
  useEffect(() => {
    setViewingTurn(gameState.turn);
  }, [gameState.turn]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return;

    const setState = useGameStore.setState;

    const handleMessage = (event: MessageEvent) => {
      const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      // Handle content delta from Claude
      if (msg.type === 'content_delta') {
        console.log('[App] Content delta:', msg.delta?.text);
        setState(state => ({
          claudeOutput: state.claudeOutput + (msg.delta?.text || ''),
        }));
      }

      // Handle assistant messages - update player state
      if (msg.type === 'assistant' && msg.message) {
        const message = msg.message;
        console.log('[App] Assistant message:', message);

        // Handle family assignment from game responses
        if (message.content && Array.isArray(message.content)) {
          const textParts = message.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');

          if (textParts) {
            const familyMatch = textParts.match(/joined the (\w+) Family/i) ||
                                 textParts.match(/now an? (\w+) of the (\w+) Family/i) ||
                                 textParts.match(/Family: (\w+)/i);
            if (familyMatch) {
              const family = familyMatch[1] || familyMatch[2];
              if (family) {
                setState(state => ({
                  player: { ...state.player, family: family.charAt(0).toUpperCase() + family.slice(1) }
                }));
              }
            }

            // Handle rank updates
            const rankMatch = textParts.match(/promoted to (\w+)/i);
            if (rankMatch) {
              const rank = rankMatch[1];
              if (rank) {
                setState(state => ({
                  player: { ...state.player, rank: rank.charAt(0).toUpperCase() + rank.slice(1) }
                }));
              }
            }

            // Handle wealth updates
            const wealthMatch = textParts.match(/Wealth: \$(\d+)/);
            if (wealthMatch) {
              const wealth = parseInt(wealthMatch[1], 10);
              if (!isNaN(wealth)) {
                setState(state => ({
                  player: { ...state.player, wealth }
                }));
              }
            }

            // Handle respect updates
            const respectMatch = textParts.match(/Respect: (\d+)/);
            if (respectMatch) {
              const respect = parseInt(respectMatch[1], 10);
              if (!isNaN(respect)) {
                setState(state => ({
                  player: { ...state.player, respect }
                }));
              }
            }

            // Handle loyalty updates
            const loyaltyMatch = textParts.match(/Loyalty: (\d+)/);
            if (loyaltyMatch) {
              const loyalty = parseInt(loyaltyMatch[1], 10);
              if (!isNaN(loyalty)) {
                setState(state => ({
                  player: { ...state.player, loyalty }
                }));
              }
            }
          }
        } else {
          setIsProcessingTurn(false);
        }
      }

      // Handle action started - show turn processing and update current action
      if (msg.type === 'action_started' && msg.action) {
        console.log('[App] Action started:', msg.action);
        setIsProcessingTurn(true);
        const target = msg.action?.target?.metadata?.task ? msg.action.target.metadata.task.id : null;
        setState({ processingTurnTarget: target });
      }

      // Handle turn complete - signal that turn processing is done
      if (msg.type === 'turn_complete') {
        console.log('[App] Turn complete');
        setIsProcessingTurn(false);
      }

      // Handle status updates
      if (msg.type === 'status') {
        console.log('[App] Status:', msg.status);

        if (msg.status === 'connected') {
          setState({ cliConnected: true });
        } else if (msg.status === 'disconnected' || msg.status === 'waiting_for_cli') {
          setState({ cliConnected: false });
        }
      }

      // Handle player state updates from server (after command completes)
      if (msg.type === 'player_state_update' && msg.player) {
        console.log('[App] Player state update:', msg.player);
        setState(state => ({
          player: {
            ...state.player,
            ...msg.player,
          },
        }));
      }

      // Handle game state updates from server (turn, territory ownership, etc.)
      if (msg.type === 'game_state_update' && msg.gameState) {
        console.log('[App] Game state update:', msg.gameState);
        setState(state => ({
          gameState: {
            ...state.gameState,
            ...msg.gameState,
          },
        }));
      }

      // Handle events update from server
      if (msg.type === 'events_update' && msg.events) {
        console.log('[App] Events update:', msg.events.length, 'events');
        setEvents(msg.events);
      }

      // Handle tasks update from server
      if (msg.type === 'tasks_update' && msg.tasks) {
        console.log('[App] Tasks update:', msg.tasks.length, 'tasks');
        setState({ tasks: msg.tasks });
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, setEvents, setIsProcessingTurn]);

  // Handle mobile tab changes
  const handleMobileTabChange = (tab: 'game' | 'history' | 'details' | 'actions') => {
    if (tab === 'actions') {
      setCommandPaletteOpen(true);
    } else {
      setMobileActiveTab(tab);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      <Header />

      {/* Desktop Layout - Three Columns */}
      <div className="hidden md:flex flex-1 overflow-hidden">
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

      {/* Mobile Layout - Single Column with Bottom Nav */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        {/* Mobile Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {/* Game Tab */}
          {mobileActiveTab === 'game' && (
            <div className="h-full flex flex-col overflow-hidden">
              <PlayerStats />
              <div className="flex-1 overflow-hidden">
                <GameTabs />
              </div>
              <div className={`bg-zinc-900/50 border-t border-zinc-800 flex flex-col transition-all duration-300 ${isOutputExpanded ? 'h-[200px]' : 'h-auto'}`}>
                <ClaudeOutput
                  isExpanded={isOutputExpanded}
                  onToggleExpand={() => setIsOutputExpanded(!isOutputExpanded)}
                />
              </div>
            </div>
          )}

          {/* History Tab */}
          {mobileActiveTab === 'history' && (
            <div className="h-full overflow-hidden">
              <TurnHistoryBrowser
                events={events}
                currentTurn={gameState.turn}
                onTurnChange={setViewingTurn}
                onRefresh={requestEvents}
              />
            </div>
          )}

          {/* Details Tab */}
          {mobileActiveTab === 'details' && (
            <div className="h-full overflow-auto p-4">
              <DetailsPanel />
            </div>
          )}
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav
          activeTab={mobileActiveTab}
          onTabChange={handleMobileTabChange}
        />
      </div>

      {/* Connection Status Indicator */}
      {dialogSkill && <ActionDialog skill={dialogSkill} onClose={() => setDialogSkill(null)} />}
      <MobileDebugger />
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
        </div>
      )}

      {/* Command Palette */}
      {commandPaletteOpen && <CommandPalette />}

      {commandResponseModalOpen && (
        <CommandResponseModal
          isOpen={commandResponseModalOpen}
          onClose={() => setCommandResponseModalOpen(false)}
        />
      )}

      {showTurnModal && (
        <TurnProcessingModal
          isOpen={showTurnModal}
          onClose={() => {
            setShowTurnModal(false);
            setIsProcessingTurn(false);
          }}
        />
      )}

      <ToastContainer />
    </div>
  );
}
