/**
 * Claude Code WebSocket Protocol Types
 *
 * Reverse-engineered from Claude Code CLI --sdk-url flag
 * Protocol: NDJSON (newline-delimited JSON) over WebSocket
 */

// Base message types
type RequestMessage = {
  type: 'request';
  requestId: string;
};

// Control request subtypes (13 total)
type ControlRequest = RequestMessage & {
  control?: {
    type: 'initialize' | 'can_use_tool' | 'interrupt' | 'set_model' | 'mcp_server';
    [key: string]: any;
  };
};

// Content delta for streaming
type ContentDelta = {
  type: 'content_delta';
  delta: {
    type: 'text' | 'tool_use' | 'thinking';
    text?: string;
    partialJson?: string;
  };
};

// Permission request
type PermissionRequest = RequestMessage & {
  toolUse: {
    name: string;
    input: any;
    sessionId?: string;
  };
};

// Response from CLI
type ResponseMessage = {
  type: 'response';
  requestId: string;
  status: 'success' | 'error';
  result?: any;
  error?: string;
};

// Event message
type EventMessage = {
  type: 'event';
  event: 'token' | 'tool_call' | 'permission' | 'done';
  data: any;
};

/**
 * Messages FROM Claude Code CLI TO Browser
 */
export type CliToBrowserMessage =
  | ResponseMessage
  | EventMessage
  | {
      type: 'content_delta';
      delta: {
        type: 'text' | 'tool_use' | 'thinking';
        text?: string;
        partialJson?: string;
        toolUse?: {
          name: string;
          input: any;
        };
      };
    }
  | {
      type: 'permission_request';
      requestId: string;
      toolUse: {
        name: string;
        input: any;
      };
    }
  | {
      type: 'tool_call';
      toolUse: {
        name: string;
        input: any;
      };
      result?: any;
      error?: string;
    }
  | {
      type: 'status';
      status: 'idle' | 'busy' | 'error';
      sessionId: string;
    };

/**
 * Messages FROM Browser TO Claude Code CLI
 */
export type BrowserToCliMessage =
  | {
      type: 'prompt';
      prompt: string;
      sessionId: string;
    }
  | {
      type: 'permission_response';
      requestId: string;
      approved: boolean;
      modifiedInput?: any;
    }
  | {
      type: 'interrupt';
      sessionId: string;
    }
  | {
      type: 'control';
      control: {
        type: 'initialize' | 'can_use_tool' | 'interrupt' | 'set_model';
        [key: string]: any;
      };
    };

/**
 * Game state parsed from Claude responses
 */
export type GameState = {
  player: {
    name: string;
    rank: string;
    family: string;
    wealth: number;
    respect: number;
    loyalty: number;
  };
  families: Family[];
  turn: number;
  events: GameEvent[];
};

export type Family = {
  name: string;
  color: string;
  territory: number;
  wealth: number;
  members: Character[];
  relationships: Record<string, number>;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  family: string;
  alive: boolean;
  loyalty: number;
  relationship: number;
};

export type GameEvent = {
  id: string;
  turn: number;
  type: 'message' | 'attack' | 'recruit' | 'death' | 'expand' | 'intel';
  actor: string;
  target?: string;
  description: string;
  result: 'success' | 'failure' | 'pending';
};

/**
 * Parse game state from Claude text output
 */
export function parseGameState(text: string): Partial<GameState> {
  const state: Partial<GameState> = {
    player: { name: 'Player', rank: 'Outsider', family: 'None', wealth: 0, respect: 0, loyalty: 100 },
    families: [],
    events: []
  };

  // Parse player stats from /status output
  const rankMatch = text.match(/Rank:\s*(\w+)/);
  if (rankMatch) state.player!.rank = rankMatch[1];

  const familyMatch = text.match(/Family:\s*(\w+)/);
  if (familyMatch) state.player!.family = familyMatch[1];

  const wealthMatch = text.match(/Wealth:\s*(\d+)/);
  if (wealthMatch) state.player!.wealth = parseInt(wealthMatch[1]);

  const respectMatch = text.match(/Respect:\s*(\d+)/);
  if (respectMatch) state.player!.respect = parseInt(respectMatch[1]);

  return state;
}
