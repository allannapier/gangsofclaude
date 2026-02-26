import { create } from 'zustand';
import type { SaveState, GameEvent } from '../types';

const API_BASE = `http://${window.location.hostname}:3456`;
const TOKEN_KEY = 'gangs-of-claude-token';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

function buildWsUrl(): string {
  const token = getStoredToken();
  const base = `ws://${window.location.hostname}:3456/ws`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

// Handle 401 errors by clearing token and requiring re-authentication
function handleAuthError() {
  localStorage.removeItem(TOKEN_KEY);
  // Force page reload to trigger PIN entry screen
  window.location.reload();
}

export interface AttackModalData {
  attackerFamily: string;
  defenderFamily: string | null;
  targetName: string;
  attackerMuscle: number;
  defenderMuscle: number;
  attackerLosses: number;
  defenderLosses: number;
  victory: boolean;
}

interface GameStore {
  // Auth
  authStatus: 'checking' | 'setup-required' | 'verify-required' | 'authenticated';
  checkAuth: () => Promise<void>;
  completeAuth: (token: string) => void;

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
  attackModal: AttackModalData | null;

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
  dismissAttackModal: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  authStatus: 'checking',
  connected: false,
  ws: null,
  state: {
    turn: 0,
    phase: 'setup',
    playerFamily: null,
    playerActed: false,
    playerMessaged: false,
    playerCovertUsed: false,
    winner: null,
    families: {},
    territories: [],
    diplomacy: [],
    events: [],
    activeEffects: [],
    intel: [],
    fortifications: [],
  },
  selectedAction: null,
  selectedTerritoryId: null,
  turnEvents: [],
  isProcessingTurn: false,
  actionResult: null,
  showTurnModal: false,
  attackModal: null,

  checkAuth: async () => {
    const token = getStoredToken();
    if (token) {
      // Validate stored token is still accepted (server may have restarted)
      try {
        const res = await fetch(`${API_BASE}/api/state`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          set({ authStatus: 'authenticated' });
          return;
        }
      } catch {
        // Server unreachable — keep token and try authenticated anyway
        set({ authStatus: 'authenticated' });
        return;
      }
      // Token rejected — clear it and ask for PIN
      localStorage.removeItem(TOKEN_KEY);
    }
    // No token — check whether a PIN has been configured yet
    try {
      const res = await fetch(`${API_BASE}/api/auth/status`);
      const data = await res.json();
      set({ authStatus: data.pinSet ? 'verify-required' : 'setup-required' });
    } catch {
      set({ authStatus: 'verify-required' });
    }
  },

  completeAuth: (token: string) => {
    storeToken(token);
    set({ authStatus: 'authenticated' });
  },

  connect: () => {
    // Guard against duplicate connections (React StrictMode calls effects twice)
    const existing = get().ws;
    if (existing && existing.readyState !== WebSocket.CLOSED) {
      return;
    }
    const ws = new WebSocket(buildWsUrl());
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
    ws.onclose = (event) => {
      console.log('[WS] Disconnected', event.code, event.reason);
      set({ connected: false, ws: null });
      // Only reload on explicit auth rejection codes (3401/4401), not on network drops (1006)
      if ((event.code === 3401 || event.code === 4401) && get().authStatus === 'authenticated') {
        console.log('[WS] Auth rejected by server, reloading to trigger PIN entry');
        handleAuthError();
        return;
      }
      // Reconnect on network drops (1006) or normal close while still authenticated
      if (get().authStatus === 'authenticated') {
        setTimeout(() => get().connect(), 2000);
      }
    };
    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };
  },

  disconnect: () => {
    get().ws?.close();
    set({ connected: false, ws: null });
  },

  startGame: async (familyId) => {
    const res = await fetch(`${API_BASE}/api/start`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ familyId }),
    });
    if (res.status === 401) {
      handleAuthError();
      return;
    }
    const data = await res.json();
    if (data.state) set({ state: data.state });
  },

  nextTurn: async () => {
    set({ isProcessingTurn: true, turnEvents: [], showTurnModal: true });
    try {
      // Fire the API call — events stream in real-time via WebSocket
      // The response arrives when all AI families have acted (may take 30-60s)
      const res = await fetch(`${API_BASE}/api/next-turn`, { method: 'POST', headers: authHeaders() });
      if (res.status === 401) {
        handleAuthError();
        return;
      }
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
      headers: authHeaders(),
      body: JSON.stringify({ action, ...params }),
    });
    if (res.status === 401) {
      handleAuthError();
      return { success: false, message: 'Session expired. Please re-enter your PIN.' };
    }
    const data = await res.json();
    const result = { success: data.success ?? false, message: data.message || data.error || 'Unknown error' };
    // Show cinematic modal for attacks, toast for everything else
    if (action === 'attack' && data.combatData) {
      set({ attackModal: data.combatData, actionResult: null });
    } else {
      set({ actionResult: result });
    }
    return result;
  },

  resetGame: async () => {
    const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST', headers: authHeaders() });
    if (res.status === 401) handleAuthError();
  },

  setSelectedAction: (action, territoryId) => set({ selectedAction: action, selectedTerritoryId: territoryId ?? null, actionResult: null }),
  dismissActionResult: () => set({ actionResult: null }),
  dismissAttackModal: () => set({ attackModal: null }),
  dismissTurnModal: () => set({ showTurnModal: false, turnEvents: [] }),
}));
