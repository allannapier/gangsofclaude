import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkillCommand, Family, GameState, GameEvent } from '../types';
import { getCharacterById } from '../data/families';
import { FAMILIES } from '../data/families';

interface GameStore {
  // Connection state
  connected: boolean;
  cliConnected: boolean;
  connecting: boolean;
  sessionId: string;
  ws: WebSocket | null;

  // Game state
  gameState: GameState;
  families: Family[];
  player: {
    name: string;
    rank: string;
    family: string;
    wealth: number;
    respect: number;
    loyalty: number;
  };
  events: GameEvent[];

  // Turn browsing state
  viewingTurn: number;
  setViewingTurn: (turn: number) => void;

  // UI state
  selectedFamily: string | null;
  selectedCharacter: string | null;
  selectedTerritory: string | null;
  commandPaletteOpen: boolean;
  dialogSkill: string | null;
  claudeOutput: string;

  // Command response tracking
  currentCommand: string | null;
  commandResponse: string;
  isCommandLoading: boolean;
  commandResponseModalOpen: boolean;

  // Turn processing
  isProcessingTurn: boolean;
  processingTurnTarget: number | null;
  setIsProcessingTurn: (processing: boolean) => void;

  // Actions
  connect: () => void;
  disconnect: () => void;
  setSelectedFamily: (id: string | null) => void;
  setSelectedCharacter: (id: string | null) => void;
  setSelectedTerritory: (territory: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setDialogSkill: (skill: string | null) => void;
  executeSkill: (skill: SkillCommand, args?: Record<string, any>) => void;
  addEvent: (event: GameEvent) => void;
  setEvents: (events: GameEvent[]) => void;
  setClaudeOutput: (output: string) => void;
  appendClaudeOutput: (output: string) => void;
  sendToCli: (message: any) => void;
  setCommandResponse: (response: string) => void;
  setIsCommandLoading: (loading: boolean) => void;
  setCommandResponseModalOpen: (open: boolean) => void;

  // Tasks
  tasks: Array<{
    id: string;
    from: string;
    content: string;
    type: string;
    turn: number;
    completed: boolean;
    action?: { skill: string; args: Record<string, any>; };
  }>;
  setTasks: (tasks: any[]) => void;
  completeTask: (taskId: string) => void;
  executeTask: (taskId: string) => void;

  // Toast notifications
  toasts: Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; duration?: number }>;
  addToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      connected: false,
      cliConnected: false,
      connecting: false,
      sessionId: 'session_' + Math.random().toString(36).substring(7),
      ws: null,

      gameState: {
        phase: 'setup',
        turn: 0,
        winner: undefined,
      } as GameState,

      // Initialize with static families data
      // This ensures families are available for UI display
      // Game state updates can add dynamic data like territory ownership
      families: FAMILIES,

      player: {
        name: 'Player',
        rank: 'Outsider',
        family: 'None',
        wealth: 1000,
        respect: 50,
        loyalty: 100,
      },

      events: [],
      viewingTurn: 0,

      selectedFamily: null,
      selectedCharacter: null,
      selectedTerritory: null,
      commandPaletteOpen: false,
      dialogSkill: null,
      claudeOutput: '',

      // Command response tracking
      currentCommand: null,
      commandResponse: '',
      isCommandLoading: false,
      commandResponseModalOpen: false,

      // Turn processing
      isProcessingTurn: false,
      processingTurnTarget: null,

      // Tasks
      tasks: [],

      // Toast notifications
      toasts: [],

      setTasks: (tasks) => set({ tasks }),

      completeTask: (taskId) => set((state) => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        ),
      })),

      executeTask: (taskId) => {
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);
        if (task?.action) {
          // Execute the action via executeSkill
          get().executeSkill(task.action.skill as SkillCommand, task.action.args);
          // Mark task as completed
          get().completeTask(taskId);
        }
      },

      // Toast notifications
      addToast: (type, message, duration) => set(state => ({
        toasts: [...state.toasts, { id: Date.now().toString() + Math.random(), type, message, duration }],
      })),
      removeToast: (id) => set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      })),

      // Actions
      connect: () => {
        const state = get();

        // Close existing connection if any
        if (state.ws) {
          state.ws.close();
        }

        set({ connecting: true });

        // Use current page's hostname for WebSocket connection (supports remote access)
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname;
        const wsPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/ws?type=browser&session=${state.sessionId}`;

        console.log('[WebSocket] Connecting to:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected to server');
          set({ connected: true, connecting: false, ws });

          // Request current game state from server
          ws.send(JSON.stringify({
            type: 'request_state',
            sessionId: state.sessionId,
          }));
        };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle status updates
        if (data.type === 'status') {
          if (data.status === 'connected') {
            set({ cliConnected: true });
          } else if (data.status === 'connecting') {
            // CLI is being auto-started
          } else if (data.status === 'disconnected' || data.status === 'waiting_for_cli') {
            set({ cliConnected: false });
          }
        }

        // Handle content deltas from Claude
        if (data.type === 'content_delta') {
          set(state => ({
            claudeOutput: state.claudeOutput + (data.delta?.text || ''),
          }));

          // Route to command response modal when a command is loading
          if (get().isCommandLoading && data.delta?.text) {
            set(state => ({
              commandResponse: state.commandResponse + data.delta.text,
            }));
          }

          // Detect completion from _meta.completed flag
          if (data._meta?.completed) {
            if (get().isCommandLoading) {
              console.log('[WebSocket] Command completed via _meta.completed');
              set({ isCommandLoading: false });
            }
            if (get().isProcessingTurn) {
              console.log('[WebSocket] Turn processing completed via _meta.completed');
              set({ isProcessingTurn: false });
            }
          }

          // Try to extract player state updates from the text
          const text = data.delta?.text || '';

          // Look for family assignment
          const familyMatch = text.match(/joined the (\w+) Family/i) ||
                             text.match(/now an? (\w+) of the (\w+) Family/i) ||
                             text.match(/Family: (\w+)/i);
          if (familyMatch) {
            const family = familyMatch[1] || familyMatch[2];
            if (family) {
              set(state => ({
                player: { ...state.player, family: family.charAt(0).toUpperCase() + family.slice(1) }
              }));
            }
          }

          // Look for rank updates
          const rankMatch = text.match(/promoted to (\w+)/i) ||
                           text.match(/now an? (Associate|Soldier|Capo|Underboss)/i) ||
                           text.match(/Rank: (\w+)/i);
          if (rankMatch) {
            const rank = rankMatch[1];
            if (rank) {
              set(state => ({
                player: { ...state.player, rank: rank.charAt(0).toUpperCase() + rank.slice(1) }
              }));
            }
          }

          // Look for wealth updates
          const wealthMatch = text.match(/Wealth: \$(\d+)/) ||
                             text.match(/earned \$(\d+)/i) ||
                             text.match(/gained \$(\d+)/i);
          if (wealthMatch) {
            const wealth = parseInt(wealthMatch[1], 10);
            if (!isNaN(wealth)) {
              set(state => ({
                player: { ...state.player, wealth }
              }));
            }
          }

          // Look for respect updates
          const respectMatch = text.match(/Respect: (\d+)/) ||
                              text.match(/respect (\d+)/i);
          if (respectMatch) {
            const respect = parseInt(respectMatch[1], 10);
            if (!isNaN(respect)) {
              set(state => ({
                player: { ...state.player, respect }
              }));
            }
          }

          // Look for loyalty updates
          const loyaltyMatch = text.match(/Loyalty: (\d+)/) ||
                              text.match(/loyalty (\d+)/i);
          if (loyaltyMatch) {
            const loyalty = parseInt(loyaltyMatch[1], 10);
            if (!isNaN(loyalty)) {
              set(state => ({
                player: { ...state.player, loyalty }
              }));
            }
          }
        }

        // Handle player state updates from server (after command completes)
        if (data.type === 'player_state_update' && data.player) {
          const prev = get().player;
          set(state => ({
            player: {
              ...state.player,
              ...data.player,
            },
          }));

          // Show toast notifications for significant state changes
          const current = data.player;
          if (current.wealth !== undefined && current.wealth !== prev.wealth) {
            const diff = current.wealth - prev.wealth;
            if (diff > 0) {
              get().addToast('success', `+$${diff.toLocaleString()} wealth`);
            } else if (diff < 0) {
              get().addToast('warning', `-$${Math.abs(diff).toLocaleString()} wealth`);
            }
          }
          if (current.respect !== undefined && current.respect !== prev.respect) {
            const diff = current.respect - prev.respect;
            if (diff > 0) {
              get().addToast('success', `+${diff} respect earned`);
            } else if (diff < 0) {
              get().addToast('warning', `${diff} respect lost`);
            }
          }
          if (current.rank && current.rank !== prev.rank) {
            get().addToast('success', `Promoted to ${current.rank}!`);
          }
          if (current.family && current.family !== prev.family && current.family !== 'None') {
            get().addToast('success', `Joined the ${current.family} Family!`);
          }
        }

        // Handle events update from server (save.json polling)
        if (data.type === 'events_update' && data.events) {
          console.log('[WebSocket] Events update:', data.events.length, 'events');
          set({ events: data.events });
        }

        // Handle game state updates from server (turn, territory ownership, etc.)
        if (data.type === 'game_state_update' && data.gameState) {
          set(state => ({
            gameState: {
              ...state.gameState,
              ...data.gameState,
            },
          }));
        }

        // Handle tasks updates from server
        if (data.type === 'tasks_update' && data.tasks) {
          console.log('[WebSocket] Received tasks update:', data.tasks.length, 'tasks');
          set(state => {
            // Merge new tasks with existing ones, avoiding duplicates
            const existingIds = new Set(state.tasks.map(t => t.id));
            const newTasks = data.tasks.filter((t: any) => !existingIds.has(t.id));
            return {
              tasks: [...state.tasks, ...newTasks],
            };
          });
        }

        // Handle errors (but NOT tool calls - they're internal implementation details)
        if (data.type === 'error') {
          set(state => ({
            claudeOutput: state.claudeOutput + `\n[Error: ${data.message}]\n`,
          }));
        }

        // Handle turn complete - signal that turn processing is done
        if (data.type === 'turn_complete') {
          console.log('[WebSocket] Received turn_complete signal');
          set({
            isProcessingTurn: false,
            processingTurnTarget: null,
          });
        }

        // Handle command complete - signal that non-turn command is done
        if (data.type === 'command_complete') {
          console.log('[WebSocket] Received command_complete signal');
          if (get().isCommandLoading) {
            set({ isCommandLoading: false });
          }
        }
      } catch (e) {
        // Not JSON, append as text
        set(state => ({
          claudeOutput: state.claudeOutput + event.data,
        }));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected from server');
      set({ connected: false, cliConnected: false, connecting: false, ws: null });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ connected: false, connecting: false });
    };
  },

  disconnect: () => {
    const state = get();
    if (state.ws) {
      state.ws.close();
    }
    set({ connected: false, cliConnected: false, ws: null });
  },

  setSelectedFamily: (id) => set({ selectedFamily: id }),
  setSelectedCharacter: (id) => set({ selectedCharacter: id }),
  setSelectedTerritory: (territory) => set({ selectedTerritory: territory }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setDialogSkill: (skill) => set({ dialogSkill: skill }),

  sendToCli: (message) => {
    const state = get();
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify(message));
    }
  },

  executeSkill: (skill, args = {}) => {
    const state = get();
    const command = `/${skill}${Object.entries(args).map(([_, v]) => ` ${v}`).join(' ')}`;

    // Add event to log
    const character = getCharacterById(args.target || args.recipient || args.character);
    const target = character ? character.fullName : args.target || args.recipient || args.character || 'System';

    // Add local event for non-next-turn commands (next-turn events come from the engine)
    if (skill !== 'next-turn') {
      set(state => ({
        events: [...state.events, {
          id: Date.now().toString(),
          turn: state.gameState.turn,
          type: skill,
          actor: state.player.name,
          action: skill,
          target: target,
          description: `Executed /${skill}${target ? ' on ' + target : ''}`,
        }],
        claudeOutput: state.claudeOutput + `> ${command}\n`,
      }));
    } else {
      set(state => ({
        claudeOutput: state.claudeOutput + `> ${command}\n`,
      }));
    }

    // Send to CLI
    get().sendToCli({
      type: 'prompt',
      prompt: command,
      sessionId: state.sessionId,
    });

    // Log player action to server, except /next-turn.
    // /next-turn drives turn simulation and should not pollute turn action streams.
    if (skill !== 'next-turn') {
      get().sendToCli({
        type: 'log_player_action',
        actor: state.player.name,
        action: skill,
        target: target,
        description: `Player executed /${skill}${target ? ' on ' + target : ''}`,
        sessionId: state.sessionId,
      });
    }

    // For next-turn, show processing modal instead of command response modal
    if (skill === 'next-turn') {
      set({
        currentCommand: command,
        isProcessingTurn: true,
        processingTurnTarget: state.gameState.turn + 1,
        commandResponseModalOpen: false,
      });
    } else {
      // Open response modal for other commands
      set({
        currentCommand: command,
        commandResponse: '',
        isCommandLoading: true,
        commandResponseModalOpen: true,
      });
    }
  },

  addEvent: (event) => set(state => ({
    events: [...state.events, event],
  })),

  setEvents: (events) => set({ events }),

  setClaudeOutput: (output) => set({ claudeOutput: output }),

  setViewingTurn: (turn) => set({ viewingTurn: turn }),

  appendClaudeOutput: (output) => set(state => ({
    claudeOutput: state.claudeOutput + output,
  })),

  setCommandResponse: (response) => set({ commandResponse: response }),

  setIsCommandLoading: (loading) => set({ isCommandLoading: loading }),

  setCommandResponseModalOpen: (open) => set({ commandResponseModalOpen: open }),

      setIsProcessingTurn: (processing) => set((state) => ({
        isProcessingTurn: processing,
        processingTurnTarget: processing ? state.processingTurnTarget : null,
      })),
}),
    {
      name: 'la-cosa-nostra-storage',
      partialize: (state) => ({
        // Only persist game state, not connection/UI state
        player: state.player,
        gameState: state.gameState,
        events: state.events,
      }),
    }
  )
);
