import { create } from 'zustand';
import type { SaveState, GameEvent } from '../types';

const API_BASE = `http://${window.location.hostname}:3456`;
const WS_URL = `ws://${window.location.hostname}:3456/ws`;

interface GameStore {
  // Connection
  connected: boolean;
  ws: WebSocket | null;

  // Game state (mirrors server)
  state: SaveState;

  // UI state
  selectedAction: string | null;
  selectedTerritoryId: string | null;
  turnEvents: GameEvent[];
  isProcessingTurn: boolean;
  actionResult: { success: boolean; message: string } | null;
  showTurnModal: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  startGame: (familyId: string) => Promise<void>;
  nextTurn: () => Promise<void>;
  performAction: (action: string, params: Record<string, any>) => Promise<{ success: boolean; message: string }>;
  resetGame: () => Promise<void>;
  setSelectedAction: (action: string | null, territoryId?: string | null) => void;
  dismissActionResult: () => void;
  dismissTurnModal: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  ws: null,
  state: {
    turn: 0,
    phase: 'setup',
    playerFamily: null,
    playerActed: false,
    playerMessaged: false,
    winner: null,
    families: {},
    territories: [],
    diplomacy: [],
    events: [],
  },
  selectedAction: null,
  selectedTerritoryId: null,
  turnEvents: [],
  isProcessingTurn: false,
  actionResult: null,
  showTurnModal: false,

  connect: () => {
    // Guard against duplicate connections (React StrictMode calls effects twice)
    const existing = get().ws;
    if (existing && existing.readyState !== WebSocket.CLOSED) {
      return;
    }
    const ws = new WebSocket(WS_URL);
    // Store immediately to prevent duplicate connections from StrictMode
    set({ ws });
    ws.onopen = () => {
      console.log('[WS] Connected');
      set({ connected: true });
    };
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        switch (msg.type) {
          case 'state_update':
            set({ state: msg.state });
            break;
          case 'turn_start':
            set({ isProcessingTurn: true, turnEvents: [], showTurnModal: true });
            break;
          case 'turn_event':
            set((s) => ({ turnEvents: [...s.turnEvents, msg.event] }));
            break;
          case 'turn_complete':
            set({ isProcessingTurn: false });
            break;
        }
      } catch {}
    };
    ws.onclose = () => {
      console.log('[WS] Disconnected');
      set({ connected: false, ws: null });
      // Reconnect after 2s
      setTimeout(() => get().connect(), 2000);
    };
    ws.onerror = () => ws.close();
  },

  disconnect: () => {
    get().ws?.close();
    set({ connected: false, ws: null });
  },

  startGame: async (familyId) => {
    const res = await fetch(`${API_BASE}/api/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyId }),
    });
    const data = await res.json();
    if (data.state) set({ state: data.state });
  },

  nextTurn: async () => {
    set({ isProcessingTurn: true, turnEvents: [], showTurnModal: true });
    try {
      // Fire the API call — events stream in real-time via WebSocket
      // The response arrives when all AI families have acted (may take 30-60s)
      const res = await fetch(`${API_BASE}/api/next-turn`, { method: 'POST' });
      const data = await res.json();
      // HTTP response arrives after all processing; WebSocket already streamed events
      // Ensure final state is synced
      if (data.events) set({ turnEvents: data.events });
      if (!data.success) {
        console.error('[nextTurn] Error:', data.error);
      }
    } catch (e) {
      console.error('[nextTurn] Fetch error:', e);
    } finally {
      // Safety net: ensure modal closes even if WS turn_complete was missed
      setTimeout(() => {
        const s = get();
        if (s.isProcessingTurn) {
          set({ isProcessingTurn: false });
        }
      }, 5000);
    }
  },

  performAction: async (action, params) => {
    const res = await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });
    const data = await res.json();
    const result = { success: data.success ?? false, message: data.message || data.error || 'Unknown error' };
    set({ actionResult: result });
    return result;
  },

  resetGame: async () => {
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
  },

  setSelectedAction: (action, territoryId) => set({ selectedAction: action, selectedTerritoryId: territoryId ?? null, actionResult: null }),
  dismissActionResult: () => set({ actionResult: null }),
  dismissTurnModal: () => set({ showTurnModal: false, turnEvents: [] }),
}));
