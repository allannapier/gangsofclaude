/**
 * Gangs of Claude - WebSocket Bridge Server
 *
 * Bridges between Claude Code CLI (NDJSON WebSocket) and browser (JSON WebSocket)
 * Automatically spawns Claude Code CLI when browsers connect.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync, watch } from 'fs';
import { calculateTurnIncome, calculateActionReward, resolveAssassination } from './mechanics';

// Character data for death resolution (mirrors client/src/data/families.ts)
interface CharacterInfo { id: string; fullName: string; role: string; family: string; }
const ALL_CHARACTERS: CharacterInfo[] = [
  { id: 'marinelli_vito', fullName: 'Vito Marinelli', role: 'Don', family: 'marinelli' },
  { id: 'marinelli_salvatore', fullName: 'Salvatore Marinelli', role: 'Underboss', family: 'marinelli' },
  { id: 'marinelli_bruno', fullName: 'Bruno Marinelli', role: 'Consigliere', family: 'marinelli' },
  { id: 'marinelli_marco', fullName: 'Marco Marinelli', role: 'Capo', family: 'marinelli' },
  { id: 'marinelli_luca', fullName: 'Luca Marinelli', role: 'Soldier', family: 'marinelli' },
  { id: 'marinelli_enzo', fullName: 'Enzo Marinelli', role: 'Associate', family: 'marinelli' },
  { id: 'rossetti_marco', fullName: 'Marco Rossetti', role: 'Don', family: 'rossetti' },
  { id: 'rossetti_carla', fullName: 'Carla Rossetti', role: 'Underboss', family: 'rossetti' },
  { id: 'rossetti_antonio', fullName: 'Antonio Rossetti', role: 'Consigliere', family: 'rossetti' },
  { id: 'rossetti_franco', fullName: 'Franco Rossetti', role: 'Capo', family: 'rossetti' },
  { id: 'rossetti_maria', fullName: 'Maria Rossetti', role: 'Soldier', family: 'rossetti' },
  { id: 'rossetti_paolo', fullName: 'Paolo Rossetti', role: 'Associate', family: 'rossetti' },
  { id: 'falcone_sofia', fullName: 'Sofia Falcone', role: 'Don', family: 'falcone' },
  { id: 'falcone_victor', fullName: 'Victor Falcone', role: 'Underboss', family: 'falcone' },
  { id: 'falcone_dante', fullName: 'Dante Falcone', role: 'Consigliere', family: 'falcone' },
  { id: 'falcone_iris', fullName: 'Iris Falcone', role: 'Capo', family: 'falcone' },
  { id: 'falcone_leo', fullName: 'Leo Falcone', role: 'Soldier', family: 'falcone' },
  { id: 'moretti_antonio', fullName: 'Antonio Moretti', role: 'Don', family: 'moretti' },
  { id: 'moretti_giovanni', fullName: 'Giovanni Moretti', role: 'Underboss', family: 'moretti' },
  { id: 'moretti_elena', fullName: 'Elena Moretti', role: 'Consigliere', family: 'moretti' },
  { id: 'moretti_ricardo', fullName: 'Ricardo Moretti', role: 'Capo', family: 'moretti' },
  { id: 'moretti_carlo', fullName: 'Carlo Moretti', role: 'Soldier', family: 'moretti' },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Path to save.json (project root/.claude/game-state/save.json)
const saveJsonPath = join(rootDir, '..', '.claude', 'game-state', 'save.json');
console.log('🔧 DEBUG: Server code loaded - index.ts');
console.log('📁 Save file path:', saveJsonPath);

// Track last known state to detect changes
let lastEventCount = 0;
let lastMessageCount = 0;
let lastKnownTurn = 0;
let lastPlayerWealth = -1;
let lastPlayerRespect = -1;
let lastPlayerRank = '';
let lastPlayerFamily = '';
let lastTerritoryHash = '';

// Poll save.json for changes (more reliable than fs.watch)
function setupSaveFileWatcher() {
  if (!existsSync(saveJsonPath)) {
    console.log('⚠️ save.json not found, skipping file watcher');
    return;
  }

  console.log('👁️ Setting up file polling for save.json...');

  // Poll every 500ms for changes
  setInterval(() => {
    readAndBroadcastSaveData();
  }, 500);
}

function readAndBroadcastSaveData() {
  try {
    const content = readFileSync(saveJsonPath, 'utf-8');
    if (!content || content.trim() === '') {
      console.log('⚠️ save.json is empty');
      return;
    }

    const saveData = JSON.parse(content);
    if (!saveData) {
      console.log('⚠️ save.json parsed to null');
      return;
    }

    const currentEventCount = saveData.events?.length || 0;
    console.log(`📊 save.json read: ${currentEventCount} events, turn: ${saveData.turn}, lastEventCount: ${lastEventCount}`);

    // Check if events changed
    if (currentEventCount !== lastEventCount) {
      console.log(`📊 EVENTS CHANGED: ${currentEventCount} events (was ${lastEventCount})`);
      lastEventCount = currentEventCount;

      // Broadcast events update to all browsers
      let broadcastCount = 0;
      for (const [id, client] of browserClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'events_update',
            events: saveData.events || [],
          }));
          broadcastCount++;
        }
      }
      console.log(`📡 Broadcasted events to ${broadcastCount} browsers`);
    } else {
      console.log(`📊 No change in event count`);
    }

    // Check if messages changed
    const currentMessageCount = saveData.messages?.length || 0;
    if (currentMessageCount !== lastMessageCount) {
      console.log(`📋 MESSAGES CHANGED: ${currentMessageCount} messages (was ${lastMessageCount})`);
      lastMessageCount = currentMessageCount;

      // Extract tasks and send update to all browsers
      const tasks = extractTasksFromSaveData(saveData);
      console.log(`📋 Sending tasks update from save.json: ${tasks.length} tasks`);
      for (const [id, client] of browserClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'tasks_update',
            tasks: tasks,
          }));
        }
      }
    }

    // Check if turn changed OR territory ownership changed
    const currentTerritoryHash = JSON.stringify(saveData.territoryOwnership || {});
    if ((saveData.turn !== undefined && saveData.turn !== lastKnownTurn) || currentTerritoryHash !== lastTerritoryHash) {
      if (saveData.turn !== lastKnownTurn) {
        console.log(`🔄 Turn changed: ${saveData.turn} (was ${lastKnownTurn})`);
      }
      if (currentTerritoryHash !== lastTerritoryHash) {
        console.log(`🗺️ Territory ownership changed`);
      }
      lastKnownTurn = saveData.turn;
      lastTerritoryHash = currentTerritoryHash;

      // Broadcast game state update
      for (const [id, client] of browserClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'game_state_update',
            gameState: {
              turn: saveData.turn,
              phase: saveData.phase || 'playing',
              territoryOwnership: saveData.territoryOwnership || {},
              deceased: saveData.deceased || [],
            },
          }));
        }
      }
    }

    // Check if player state changed
    if (saveData.player) {
      const p = saveData.player;
      if (p.wealth !== lastPlayerWealth || p.respect !== lastPlayerRespect || p.rank !== lastPlayerRank || (p.family || 'None') !== lastPlayerFamily) {
        console.log(`👤 Player state changed: wealth=${p.wealth}, respect=${p.respect}, rank=${p.rank}, family=${p.family}`);
        lastPlayerWealth = p.wealth;
        lastPlayerRespect = p.respect;
        lastPlayerRank = p.rank || '';
        lastPlayerFamily = p.family || 'None';

        for (const [id, client] of browserClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'player_state_update',
              player: {
                name: p.name || 'Player',
                rank: p.rank || 'Outsider',
                family: p.family || 'None',
                wealth: p.wealth ?? 0,
                respect: p.respect ?? 0,
                loyalty: p.loyalty ?? 50,
              },
            }));
          }
        }
      }
    }
  } catch (e) {
    // Ignore read errors (file might be mid-write)
  }
}

// Initialize watcher when server starts
setupSaveFileWatcher();

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'gangs-of-claude' });
});

// Endpoint to start CLI manually
app.post('/api/start-cli', async (c) => {
  try {
    const result = await startCliProcess();
    return c.json({ success: true, pid: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Endpoint to stop CLI
app.post('/api/stop-cli', async (c) => {
  try {
    stopCliProcess();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Store connections and processes
const browserClients = new Map<string, WebSocket>();
let cliConnection: WebSocket | null = null;
let cliProcess: ReturnType<typeof spawn> | null = null;
let cliStdoutBuffer = '';
const pendingPrompts: string[] = [];

// Track pending next-turn commands to broadcast completion
const pendingNextTurnRequests = new Set<string>();
let isNextTurnInProgress = false;
// Track CLI initialization — prompts sent before init may be lost
let cliInitialized = false;

// Retry configuration for API rate-limit errors
const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let lastFailedPrompt: string | null = null;
let lastSubmittedPrompt: string | null = null;

function isRateLimitError(resultText: string): boolean {
  return /API Error:\s*429/i.test(resultText) ||
         /rate.?limit/i.test(resultText) ||
         /too many requests/i.test(resultText) ||
         /Insufficient balance/i.test(resultText) ||
         /overloaded/i.test(resultText);
}

function broadcastToAllBrowsers(msg: object) {
  const json = JSON.stringify(msg);
  for (const [, client] of browserClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

function cancelRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  retryCount = 0;
  lastFailedPrompt = null;
}

function scheduleRetry(prompt: string) {
  if (retryCount >= RETRY_DELAYS.length) {
    console.log('❌ Max retries reached, giving up');
    broadcastToAllBrowsers({ type: 'retry_failed', attempt: retryCount, maxAttempts: RETRY_DELAYS.length, message: 'Max retries reached. Please try again later.' });
    cancelRetry();
    return false;
  }

  const delay = RETRY_DELAYS[retryCount];
  lastFailedPrompt = prompt;
  console.log(`🔄 Scheduling retry ${retryCount + 1}/${RETRY_DELAYS.length} in ${delay / 1000}s for: ${prompt}`);

  broadcastToAllBrowsers({
    type: 'retry_scheduled',
    attempt: retryCount + 1,
    maxAttempts: RETRY_DELAYS.length,
    delayMs: delay,
    prompt,
  });

  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (!cliConnection || cliConnection.readyState !== WebSocket.OPEN || !cliInitialized) {
      console.log('❌ CLI not connected for retry');
      broadcastToAllBrowsers({ type: 'retry_failed', attempt: retryCount, maxAttempts: RETRY_DELAYS.length, message: 'CLI disconnected during retry.' });
      cancelRetry();
      return;
    }

    retryCount++;
    console.log(`🔄 Retrying (attempt ${retryCount}/${RETRY_DELAYS.length}): ${prompt}`);
    broadcastToAllBrowsers({
      type: 'retrying',
      attempt: retryCount,
      maxAttempts: RETRY_DELAYS.length,
      prompt,
    });

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const ndjson = JSON.stringify({
      type: 'user',
      requestId,
      message: { role: 'user', content: prompt },
    }) + '\n';
    cliConnection.send(ndjson);

    if (prompt.trim() === '/next-turn') {
      pendingNextTurnRequests.add(requestId);
      isNextTurnInProgress = true;
    }
  }, delay);

  return true;
}

// Start Claude Code CLI process
async function startCliProcess() {
  if (cliProcess) {
    console.log('CLI process already running');
    return cliProcess.pid;
  }

  console.log('🚀 Starting Claude Code CLI...');

  cliProcess = spawn('claude', [
    '--sdk-url', `ws://localhost:3456/ws/cli/auto`,
    '--dangerously-skip-permissions',
  ], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: rootDir,
    env: { ...process.env },
  });

  cliProcess.stdout?.on('data', (data) => {
    const text = data.toString();
    console.log('CLI stdout:', text.substring(0, 500));
    try {
      writeFileSync('/tmp/ws-debug.log', `CLI stdout: ${text.substring(0, 500)}\n`, { flag: 'a' });
    } catch (e) {}

    // Forward to all browsers
    for (const [id, client] of browserClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'content_delta',
          delta: { text },
        }));
      }
    }
  });

  cliProcess.stderr?.on('data', (data) => {
    const text = data.toString();
    console.error('CLI stderr:', text);
    try {
      writeFileSync('/tmp/ws-debug.log', `CLI stderr: ${text}\n`, { flag: 'a' });
    } catch (e) {}

    // Forward errors to browsers
    for (const [id, client] of browserClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'content_delta',
          delta: { text: `[Error: ${text}]` },
        }));
      }
    }
  });

  cliProcess.on('close', (code) => {
    console.log(`CLI process exited with code ${code}`);
    cliProcess = null;

    // Notify browsers
    for (const [id, client] of browserClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'status',
          status: 'disconnected',
        }));
      }
    }
  });

  cliProcess.on('error', (error) => {
    console.error('CLI process error:', error);
    cliProcess = null;
  });

  // Wait a bit for the process to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  return cliProcess.pid;
}

function stopCliProcess() {
  if (cliProcess) {
    console.log('🛑 Stopping CLI process...');
    cliProcess.kill('SIGTERM');
    cliProcess = null;
  }
  cliConnection = null;
  cliInitialized = false;
  pendingPrompts.length = 0;
}

// Create WebSocket server for browsers
Bun.serve({
  hostname: '0.0.0.0',
  port: 3456,
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'gangs-of-claude' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // API endpoints
    if (url.pathname === '/api/start-cli' && req.method === 'POST') {
      return (async () => {
        try {
          await startCliProcess();
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })();
    }

    if (url.pathname === '/api/stop-cli' && req.method === 'POST') {
      stopCliProcess();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // WebSocket upgrade for Claude Code CLI
    // Must check BEFORE /ws to avoid path overlap
    // Matches /ws/cli/:session pattern
    if (url.pathname.startsWith('/ws/cli/')) {
      const sessionMatch = url.pathname.match(/^\/ws\/cli\/([^/]+)$/);
      const sessionId = sessionMatch ? sessionMatch[1] : url.searchParams.get('session') || 'cli';
      return server.upgrade(req, {
        data: { type: 'cli', sessionId },
      });
    }

    // WebSocket upgrade for browsers
    if (url.pathname === '/ws') {
      const clientType = url.searchParams.get('type') || 'browser';
      const sessionId = url.searchParams.get('session') || 'unknown';

      if (clientType === 'browser') {
        return server.upgrade(req, {
          data: { type: 'browser', sessionId },
        });
      }
    }

    // Also support /cli for backwards compatibility
    if (url.pathname === '/cli') {
      return server.upgrade(req, {
        data: { type: 'cli', sessionId: url.searchParams.get('session') || 'cli' },
      });
    }

    return new Response('Not found', { status: 404 });
  },

  websocket: {
    open(ws) {
      const data = ws.data as { type: string; sessionId: string };

      console.log(`🔗 WebSocket connected: ${data.type} (${data.sessionId})`);

      if (data.type === 'cli') {
        cliConnection = ws;
        cliInitialized = false; // Wait for init message before flushing prompts

        // Notify all browsers that CLI is connecting (not fully ready yet)
        for (const [id, client] of browserClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'status',
              status: 'connecting',
              sessionId: data.sessionId,
            }));
          }
        }
      } else {
        browserClients.set(data.sessionId, ws);

        // Auto-start CLI if not running
        if (!cliProcess && !cliConnection) {
          console.log('📱 Browser connected - auto-starting CLI...');
          startCliProcess().catch(err => {
            console.error('Failed to auto-start CLI:', err);
          });
        }

        // Send current CLI status to the newly connected browser
        ws.send(JSON.stringify({
          type: 'status',
          status: cliConnection ? 'connected' : (cliProcess ? 'connecting' : 'waiting_for_cli'),
          sessionId: data.sessionId,
        }));

        // Send initial game state from save.json to newly connected browser
        try {
          if (existsSync(saveJsonPath)) {
            const saveData = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
            if (saveData) {
              if (saveData.player) {
                ws.send(JSON.stringify({ type: 'player_state_update', player: saveData.player }));
              }
              if (saveData.events && Array.isArray(saveData.events)) {
                ws.send(JSON.stringify({ type: 'events_update', events: saveData.events }));
              }
              if (saveData.turn !== undefined) {
                ws.send(JSON.stringify({
                  type: 'game_state_update',
                  gameState: {
                    turn: saveData.turn,
                    phase: saveData.phase || 'playing',
                    families: saveData.families,
                    territoryOwnership: saveData.territoryOwnership || {},
                    deceased: saveData.deceased || [],
                  },
                }));
              }
              if (saveData.messages) {
                const tasks = extractTasksFromSaveData(saveData);
                if (tasks.length > 0) {
                  ws.send(JSON.stringify({ type: 'tasks_update', tasks }));
                }
              }
            }
          }
        } catch (e) {
          console.error('Error sending initial state to browser:', e);
        }
      }
    },

    message(ws, message) {
      // Write to file for debugging
      try {
        writeFileSync('/tmp/ws-debug.log', `Message handler called: type=${ws.data?.type}, message=${typeof message === 'string' ? message.substring(0, 100) : '(binary)'}\n`, { flag: 'a' });
      } catch (e) {
        // Ignore
      }
      console.log('🔧 DEBUG: Message handler called, ws.data:', ws.data, 'message:', typeof message === 'string' ? message.substring(0, 100) : message);
      const data = ws.data as { type: string; sessionId: string };

      if (data.type === 'browser') {
        // Message from browser - forward to CLI via WebSocket
        console.log('📨 Received message from browser:', typeof message === 'string' ? message.substring(0, 100) : '(binary)');
        try {
          writeFileSync('/tmp/ws-debug.log', `Browser message: cliConnection=${!!cliConnection}, readyState=${cliConnection?.readyState}\n`, { flag: 'a' });
        } catch (e) {}
        // Handle state request from browser
        try {
          const msg = typeof message === 'string' ? JSON.parse(message) : message;
          if (msg.type === 'request_state') {
            console.log('📊 State requested by browser');
            try {
              if (existsSync(saveJsonPath)) {
                const saveData = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                if (saveData.player) {
                  ws.send(JSON.stringify({
                    type: 'player_state_update',
                    player: saveData.player,
                  }));
                  console.log('📊 Sent player state to browser');
                }
                // Also send game state (current turn, etc.)
                if (saveData.turn !== undefined) {
                  ws.send(JSON.stringify({
                    type: 'game_state_update',
                    gameState: {
                      turn: saveData.turn,
                      phase: saveData.phase || 'playing',
                      families: saveData.families,
                      territoryOwnership: saveData.territoryOwnership || {},
                      deceased: saveData.deceased || [],
                    },
                  }));
                }
              } else {
                console.log('⚠️ save.json not found at:', saveJsonPath);
              }
            } catch (e) {
              console.error('Error reading save.json for state request:', e);
            }
            return; // Don't forward to CLI
          }

          // Handle events request from browser
          if (msg.type === 'request_events') {
            console.log('📊 Events requested by browser');
            try {
              if (existsSync(saveJsonPath)) {
                const saveData = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                if (saveData.events && Array.isArray(saveData.events)) {
                  ws.send(JSON.stringify({
                    type: 'events_update',
                    events: saveData.events,
                  }));
                  console.log(`📊 Sent ${saveData.events.length} events to browser`);
                }
                // Also send current game state
                if (saveData.turn !== undefined) {
                  ws.send(JSON.stringify({
                    type: 'game_state_update',
                    gameState: {
                      turn: saveData.turn,
                      phase: saveData.phase || 'playing',
                      families: saveData.families,
                      territoryOwnership: saveData.territoryOwnership || {},
                      deceased: saveData.deceased || [],
                    },
                  }));
                }
              }
            } catch (e) {
              console.error('Error reading save.json for events request:', e);
            }
            return; // Don't forward to CLI
          }

          // Handle tasks request from browser
          if (msg.type === 'request_tasks') {
            console.log('📋 Tasks requested by browser');
            try {
              if (existsSync(saveJsonPath)) {
                const saveData = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                const tasks = extractTasksFromSaveData(saveData);
                ws.send(JSON.stringify({
                  type: 'tasks_update',
                  tasks: tasks,
                }));
                console.log(`📋 Sent ${tasks.length} tasks to browser`);
              }
            } catch (e) {
              console.error('Error reading save.json for tasks request:', e);
            }
            return;
          }

          // Handle player action logging
          if (msg.type === 'log_player_action') {
            console.log('📝 Logging player action:', msg.action);
            try {
              if (existsSync(saveJsonPath)) {
                const saveData = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                if (!saveData.events) {
                  saveData.events = [];
                }
                // Add the player action to events
                saveData.events.push({
                  turn: saveData.turn || 0,
                  type: 'action',
                  actor: msg.actor || 'Player',
                  action: msg.action,
                  target: msg.target,
                  description: msg.description,
                  timestamp: Date.now(),
                });
                writeFileSync(saveJsonPath, JSON.stringify(saveData, null, 2));
                console.log('📝 Player action logged to save.json');

                // Broadcast update to all browsers
                for (const [id, client] of browserClients) {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'events_update',
                      events: saveData.events,
                    }));
                  }
                }
              }
            } catch (e) {
              console.error('Error logging player action:', e);
            }
            return; // Don't forward to CLI
          }
        } catch (e) {
          // Not JSON, continue to forward
        }

        // Extract prompt robustly from either JSON envelope or raw text.
        let prompt = '';
        if (typeof message === 'string') {
          try {
            const msg = JSON.parse(message);
            prompt = String(msg.prompt || msg.content || '');
          } catch {
            prompt = message;
          }
        } else {
          const msg: any = message;
          prompt = String(msg?.prompt || msg?.content || '');
        }

        if (!prompt.trim()) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Empty prompt received',
          }));
          return;
        }

        if (cliConnection && cliConnection.readyState === WebSocket.OPEN && cliInitialized) {
          try {
            const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
            const ndjson = JSON.stringify({
              type: 'user',
              requestId,
              message: {
                role: 'user',
                content: prompt,
              },
            }) + '\n';
            cliConnection.send(ndjson);
            lastSubmittedPrompt = prompt;
            cancelRetry(); // Reset retry state on fresh command

            // Track if this is a next-turn command
            if (prompt.trim() === '/next-turn') {
              pendingNextTurnRequests.add(requestId);
              isNextTurnInProgress = true;
              console.log('🎯 Tracking next-turn request:', requestId);
              // NOTE: Turn increment is handled by the PreToolUse hook (increment-turn.sh).
              // Do NOT increment here to avoid double-incrementing.
            }
          } catch (e) {
            console.error('Error forwarding to CLI WebSocket:', e);
          }
          return;
        }

        // CLI websocket not ready yet: queue prompt and start CLI if needed.
        pendingPrompts.push(prompt);
        ws.send(JSON.stringify({
          type: 'info',
          message: 'CLI starting up... command queued.',
        }));

        if (!cliProcess && !cliConnection) {
          // CLI not connected - auto-start it
          console.log('📱 CLI not connected - auto-starting...');
          try {
            writeFileSync('/tmp/ws-debug.log', `CLI NOT connected, auto-starting...\n`, { flag: 'a' });
          } catch (e) {}
          startCliProcess().then(() => {
            console.log('✅ CLI auto-started; queued prompts will flush on CLI websocket connect');
          }).catch(err => {
            console.error('Failed to auto-start CLI:', err);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to start CLI: ' + err.message,
            }));
          });
        }
        return;
      } else {
        // Message from CLI - forward to all browsers
        const messageStr = typeof message === 'string' ? message : String(message);
        console.log('📥 Received from CLI:', messageStr.substring(0, 200));
        try {
          writeFileSync('/tmp/ws-debug.log', `CLI message: ${messageStr.substring(0, 200)}\n`, { flag: 'a' });
        } catch (e) {}
        const lines = messageStr.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const cliData = JSON.parse(line);
            console.log('🔄 Transforming CLI message:', cliData.type);

            // Detect CLI ready — flush pending prompts once we receive any message
            if (!cliInitialized) {
              cliInitialized = true;
              console.log('✅ CLI initialized (first message received), flushing', pendingPrompts.length, 'queued prompts');
              // Notify browsers
              for (const [id, client] of browserClients) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ type: 'status', status: 'connected' }));
                }
              }
              // Flush queued prompts
              while (pendingPrompts.length > 0 && cliConnection && cliConnection.readyState === WebSocket.OPEN) {
                const prompt = pendingPrompts.shift()!;
                const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                const ndjson = JSON.stringify({
                  type: 'user',
                  requestId,
                  message: { role: 'user', content: prompt },
                }) + '\n';
                cliConnection.send(ndjson);
                if (prompt.trim() === '/next-turn') {
                  pendingNextTurnRequests.add(requestId);
                  isNextTurnInProgress = true;
                }
                console.log('📤 Flushed queued prompt:', prompt.substring(0, 50));
              }
            }

            // Handle control_request specially - send response back to CLI
            if (cliData.type === 'control_request' && cliData.request_id) {
              const controlResponse = {
                type: 'control_response',
                request_id: cliData.request_id,
                response: {
                  approved: true,
                },
              };
              console.log('📤 Sending control_response to CLI:', controlResponse);
              try {
                writeFileSync('/tmp/ws-debug.log', `Sending control_response: ${JSON.stringify(controlResponse)}\n`, { flag: 'a' });
              } catch (e) {}
              ws.send(JSON.stringify(controlResponse) + '\n');  // NDJSON format - add newline!
              continue; // Don't forward to browser
            }

            const browserMessage = transformCliMessage(cliData);
            try {
              writeFileSync('/tmp/ws-debug.log', `Transformed: ${JSON.stringify(browserMessage)?.substring(0, 200)}\n`, { flag: 'a' });
            } catch (e) {}

            // Check if this was a command result - do this BEFORE the continue so we always update state
            if (cliData.type === 'result' || (cliData.subtype === 'success' && cliData.result)) {
              const resultText = String(cliData.result || '');
              const isError = cliData.is_error === true;

              // Check for rate-limit / API errors and auto-retry
              if (isError && isRateLimitError(resultText) && lastSubmittedPrompt) {
                console.log('⚠️ Rate limit error detected, attempting retry for:', lastSubmittedPrompt);
                const willRetry = scheduleRetry(lastSubmittedPrompt);
                if (willRetry) {
                  // Don't send turn_complete/command_complete — we're retrying
                  // But still forward the error text to browser for visibility
                  continue;
                }
                // If max retries reached, fall through to normal completion
              } else {
                // Successful result — reset retry state
                cancelRetry();
              }

              console.log('🎯 Command completed, will update player state from save.json');
              // CLI may return request_id (snake_case) or requestId (camelCase)
              const responseRequestId = cliData.requestId || cliData.request_id;
              // Check if this is a next-turn result by requestId or by the in-progress flag
              // Check if this is a next-turn result.
              // Use isNextTurnInProgress as the primary signal — it's set when
              // /next-turn is sent and cleared here. The requestId match is a
              // secondary check in case isNextTurnInProgress was cleared by a race.
              const isNextTurnResult = isNextTurnInProgress ||
                                       (responseRequestId && pendingNextTurnRequests.has(responseRequestId));
              if (isNextTurnResult) {
                if (responseRequestId) {
                  pendingNextTurnRequests.delete(responseRequestId);
                }
                isNextTurnInProgress = false;
                console.log('🎯 Next-turn command completed, will broadcast turn_complete after updates');
              }
              setTimeout(() => {
                try {
                  console.log('📁 Reading save.json from:', saveJsonPath);
                  if (existsSync(saveJsonPath)) {
                    const saveData = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                    console.log('📄 save.json player data:', saveData.player);
                    // Send player state update
                    if (saveData.player) {
                      console.log('📊 Sending player state update from save.json');
                      for (const [id, client] of browserClients) {
                        if (client.readyState === WebSocket.OPEN) {
                          client.send(JSON.stringify({
                            type: 'player_state_update',
                            player: saveData.player,
                          }));
                        }
                      }
                    }
                    // Send events update
                    if (saveData.events && Array.isArray(saveData.events)) {
                      console.log('📊 Sending events update from save.json:', saveData.events.length, 'events');
                      for (const [id, client] of browserClients) {
                        if (client.readyState === WebSocket.OPEN) {
                          client.send(JSON.stringify({
                            type: 'events_update',
                            events: saveData.events,
                          }));
                        }
                      }
                    }
                    // Send game state update (includes turn number)
                    if (saveData.turn !== undefined) {
                      console.log('📊 Sending game state update from save.json:', 'turn', saveData.turn);
                      for (const [id, client] of browserClients) {
                        if (client.readyState === WebSocket.OPEN) {
                          client.send(JSON.stringify({
                            type: 'game_state_update',
                            gameState: {
                              turn: saveData.turn,
                              phase: saveData.phase || 'playing',
                              families: saveData.families,
                              territoryOwnership: saveData.territoryOwnership || {},
                              deceased: saveData.deceased || [],
                            },
                          }));
                        }
                      }
                    }
                    // Send tasks update (from messages with type: "order")
                    try {
                      const tasks = extractTasksFromSaveData(saveData);
                      if (tasks.length > 0) {
                        console.log('📋 Sending tasks update from save.json:', tasks.length, 'tasks');
                        for (const [id, client] of browserClients) {
                          if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                              type: 'tasks_update',
                              tasks: tasks,
                            }));
                          }
                        }
                      }
                    } catch (taskErr) {
                      console.error('Error extracting tasks:', taskErr);
                    }

                  } else {
                    console.log('⚠️ save.json not found at:', saveJsonPath);
                  }

                  // Apply turn income BEFORE broadcasting completion
                  if (isNextTurnResult && existsSync(saveJsonPath)) {
                    try {
                      const incomeState = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                      if (incomeState.player && incomeState.player.family && incomeState.player.family !== 'none') {
                        const familyKey = Object.keys(incomeState.families || {}).find(
                          k => k.toLowerCase() === incomeState.player.family.toLowerCase()
                        );
                        const family = familyKey ? incomeState.families[familyKey] : null;
                        const ownership = incomeState.territoryOwnership || {};
                        const territoryCount = Object.values(ownership).filter(
                          (v: any) => v && v.toLowerCase() === incomeState.player.family.toLowerCase()
                        ).length;

                        const income = calculateTurnIncome(incomeState.player, family, territoryCount);
                        if (income.total > 0) {
                          incomeState.player.wealth = (incomeState.player.wealth || 0) + income.total;
                        }
                        // Award respect per turn based on rank and activity
                        const respectGains: Record<string, number> = {
                          'Associate': 1, 'Soldier': 2, 'Capo': 3, 'Underboss': 4, 'Don': 5
                        };
                        const respectGain = respectGains[incomeState.player.rank] || 0;
                        if (respectGain > 0) {
                          incomeState.player.respect = (incomeState.player.respect || 0) + respectGain;
                        }
                        if (income.total > 0 || respectGain > 0) {
                          // Log income as an event
                          if (!incomeState.events) incomeState.events = [];
                          const parts: string[] = [];
                          if (income.total > 0) parts.push(`$${income.total} (${income.description})`);
                          if (respectGain > 0) parts.push(`+${respectGain} respect`);
                          incomeState.events.push({
                            turn: incomeState.turn,
                            actor: 'System',
                            action: 'income',
                            target: incomeState.player.family,
                            result: `💰 Turn income: ${parts.join(', ')}`,
                            outcome: 'success',
                          });
                          writeFileSync(saveJsonPath, JSON.stringify(incomeState, null, 2));
                          console.log(`💰 Applied turn income: $${income.total}, +${respectGain} respect → player now has $${incomeState.player.wealth}, ${incomeState.player.respect} respect`);
                          // Re-broadcast updated player state with new wealth and respect
                          for (const [id, client] of browserClients) {
                            if (client.readyState === WebSocket.OPEN) {
                              client.send(JSON.stringify({
                                type: 'player_state_update',
                                player: incomeState.player,
                              }));
                              client.send(JSON.stringify({
                                type: 'income_report',
                                income: income,
                              }));
                            }
                          }
                        }
                      }
                    } catch (incomeErr) {
                      console.error('Error applying turn income:', incomeErr);
                    }
                  }

                  // Process deaths from combat events this turn
                  if (isNextTurnResult && existsSync(saveJsonPath)) {
                    try {
                      const deathState = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                      const currentTurn = deathState.turn || 0;
                      const deceased: string[] = deathState.deceased || [];
                      const deceasedSet = new Set(deceased);
                      const turnEvents = (deathState.events || []).filter((e: any) => e.turn === currentTurn);
                      let deathsThisTurn = 0;

                      // Check attack events for potential casualties
                      for (const event of turnEvents) {
                        const action = (event.action || '').toLowerCase();
                        if (!['attack', 'plan_attack', 'eliminate'].includes(action)) continue;
                        
                        const target = (event.target || '').toLowerCase();
                        if (!target) continue;
                        
                        // 8% chance per attack that a named character is a casualty
                        const roll = Math.random() * 100;
                        if (roll > 8) continue;
                        
                        // Find a living member of the target family
                        const eligibleMembers = ALL_CHARACTERS.filter(m => 
                          m.family === target && !deceasedSet.has(m.id) && m.role !== 'Don'
                        );
                        if (eligibleMembers.length === 0) continue;
                        
                        const victimIdx = Math.floor(Math.random() * eligibleMembers.length);
                        const victim = eligibleMembers[victimIdx];
                        const familyName = target.charAt(0).toUpperCase() + target.slice(1);
                        
                        // Mark as deceased
                        deceased.push(victim.id);
                        deceasedSet.add(victim.id);
                        deathsThisTurn++;
                        
                        // Log death event
                        deathState.events.push({
                          turn: currentTurn,
                          type: 'death',
                          actor: event.actor,
                          action: 'eliminate',
                          target: victim.id,
                          description: `${victim.fullName} was killed in the attack by ${event.actor}`,
                          result: `💀 ${victim.fullName} (${victim.role}) of the ${familyName} family has been eliminated`,
                          outcome: 'death',
                        });
                        
                        // Reduce family soldier count
                        const familyKey = Object.keys(deathState.families || {}).find(
                          k => k.toLowerCase() === target
                        );
                        if (familyKey && deathState.families[familyKey]) {
                          deathState.families[familyKey].soldiers = Math.max(0, 
                            (deathState.families[familyKey].soldiers || 0) - 1
                          );
                        }
                        
                        console.log(`💀 ${victim.fullName} killed by ${event.actor}'s attack on ${familyName}`);
                      }
                      
                      if (deathsThisTurn > 0) {
                        deathState.deceased = deceased;
                        writeFileSync(saveJsonPath, JSON.stringify(deathState, null, 2));
                        console.log(`☠️ ${deathsThisTurn} casualties this turn`);
                        
                        // Broadcast deceased update to browsers
                        for (const [id, client] of browserClients) {
                          if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                              type: 'deceased_update',
                              deceased: deceased,
                            }));
                          }
                        }
                      }
                    } catch (deathErr) {
                      console.error('Error processing deaths:', deathErr);
                    }
                  }

                  // Broadcast completion signals AFTER all state updates
                  // Re-read save.json one final time to get income/death events
                  // that were added above, then broadcast before turn_complete.
                  if (isNextTurnResult) {
                    try {
                      if (existsSync(saveJsonPath)) {
                        const finalState = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                        if (finalState.events && Array.isArray(finalState.events)) {
                          for (const [id, client] of browserClients) {
                            if (client.readyState === WebSocket.OPEN) {
                              client.send(JSON.stringify({
                                type: 'events_update',
                                events: finalState.events,
                              }));
                            }
                          }
                        }
                      }
                    } catch (e) {
                      console.error('Error re-broadcasting final events:', e);
                    }
                    console.log('🏁 Turn processing complete, broadcasting turn_complete');
                    broadcastTurnComplete();
                  } else {
                    // Broadcast command_complete for non-turn commands
                    console.log('✅ Command complete, broadcasting command_complete');
                    for (const [id, client] of browserClients) {
                      if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                          type: 'command_complete',
                        }));
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error reading save.json:', e);
                }
              }, 300); // Delay to ensure save.json has been written by CLI
            }

            // Skip null messages (system, etc.)
            if (browserMessage === null) {
              continue;
            }

            // Handle array of messages (e.g., multiple tool_calls)
            const messagesToSend = Array.isArray(browserMessage) ? browserMessage : [browserMessage];

            for (const [id, client] of browserClients) {
              if (client.readyState === WebSocket.OPEN) {
                for (const msg of messagesToSend) {
                  client.send(JSON.stringify(msg));
                }
              }
            }
          } catch (e) {
            console.log('⚠️ Non-JSON from CLI, forwarding as text:', line.substring(0, 50));
            for (const [id, client] of browserClients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'content_delta',
                  delta: { text: line + '\n' },
                }));
              }
            }
          }
        }
      }
    },

    close(ws, code, message) {
      const data = ws.data as { type: string; sessionId: string };

      console.log(`🔌 WebSocket disconnected: ${data.type} (${data.sessionId})`);

      if (data.type === 'cli') {
        cliConnection = null;
        cliInitialized = false;

        for (const [id, client] of browserClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'status',
              status: 'disconnected',
            }));
          }
        }
      } else {
        browserClients.delete(data.sessionId);

        // Auto-stop CLI when no browsers connected
        if (browserClients.size === 0) {
          console.log('📱 No browsers connected - stopping CLI...');
          setTimeout(() => {
            if (browserClients.size === 0) {
              stopCliProcess();
            }
          }, 5000);
        }
      }
    },

    error(ws, error) {
      console.error('WebSocket error:', error);
    },
  },
});

// Helper to safely convert any value to string
function toString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return '[Object]';
    }
  }
  return String(val);
}

function transformCliMessage(data: any): any {
  // Handle content_delta - pass through
  if (data.type === 'content_delta') {
    return data;
  }

  // Handle assistant messages - convert to content_delta
  if (data.type === 'assistant' && data.message) {
    const msg = data.message;
    if (msg.content && Array.isArray(msg.content)) {
      // Extract text from content blocks
      const textParts = msg.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('');

      if (textParts) {
        return { type: 'content_delta', delta: { text: textParts } };
      }

      // Extract tool_use from content blocks
      const toolUses = msg.content.filter((c: any) => c.type === 'tool_use');
      if (toolUses.length > 0) {
        return toolUses.map((tu: any) => ({
          type: 'tool_call',
          toolUse: {
            name: tu.name,
            input: tu.input,
            id: tu.id,
          },
        }));
      }
    }
  }

  // Handle user messages (tool results)
  if (data.type === 'user' && data.message) {
    const msg = data.message;
    if (msg.content && Array.isArray(msg.content)) {
      const toolResults = msg.content.filter((c: any) => c.type === 'tool_result');
      if (toolResults.length > 0) {
        return toolResults.map((tr: any) => ({
          type: 'tool_result',
          toolUseId: tr.tool_use_id,
          content: tr.content,
          isError: tr.is_error,
        }));
      }
    }
  }

  // Handle tool_use messages
  if (data.type === 'tool_use') {
    return {
      type: 'tool_call',
      toolUse: {
        name: data.name,
        input: data.input,
        id: data.id,
      },
      result: data.result,
      error: data.error,
    };
  }

  // Handle status messages
  if (data.type === 'status') {
    return {
      type: 'status',
      status: data.status,
    };
  }

  // Handle control_request - return null (handled directly in message handler)
  if (data.type === 'control_request') {
    return null;
  }

  // Handle system messages - log but don't forward
  if (data.type === 'system') {
    return null;
  }

  // Handle 'done' message - indicates completion of response
  if (data.type === 'done') {
    return {
      type: 'status',
      status: 'idle',
    };
  }

  // Handle 'result' message - command execution complete
  if (data.type === 'result') {
    return {
      type: 'content_delta',
      delta: {
        text: '',
      },
      _meta: { completed: true },
    };
  }

  // Handle subagent_response - skill/subagent output
  if (data.type === 'subagent_response' || data.type === 'subagent_result') {
    const text = toString(data.output || data.result || data.content) || JSON.stringify(data);
    return {
      type: 'content_delta',
      delta: { text },
    };
  }

  // Handle thinking messages
  if (data.type === 'thinking' || data.type === 'thought') {
    return {
      type: 'content_delta',
      delta: {
        text: toString(data.text || data.content),
      },
    };
  }

  // Default: passthrough unknown message types as content_delta
  // This ensures we don't miss any messages from skills/subagents
  if (data.text || data.content || data.message || data.output || data.result) {
    const text = toString(data.text || data.content || data.message || data.output || data.result);
    return {
      type: 'content_delta',
      delta: { text },
    };
  }

  // Last resort: return as raw JSON for debugging
  return {
    type: 'content_delta',
    delta: {
      text: '',
    },
    _debug: { unknownType: data.type, raw: data },
  };
}

// Helper function to extract tasks from save.json messages
function extractTasksFromSaveData(saveData: any): any[] {
  if (!saveData.messages || !Array.isArray(saveData.messages)) {
    return [];
  }
  // Filter messages that are orders (tasks) to the player
  return saveData.messages
    .filter((msg: any) => msg.type === 'order' && msg.to === 'Player')
    .map((msg: any, idx: number) => ({
      id: `task-${msg.turn}-${idx}`,
      from: msg.from,
      content: msg.content,
      type: msg.type,
      turn: msg.turn,
      completed: msg.status === 'completed',
      action: msg.action,  // Include executable action data
    }));
}

// Helper function to broadcast action_started to all browsers
function broadcastActionStarted(action: any) {
  console.log('📡 Broadcasting action_started:', action);
  for (const [id, client] of browserClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'action_started',
        action: action,
      }));
    }
  }
}

// Helper function to broadcast turn_complete to all browsers
function broadcastTurnComplete() {
  console.log('📡 Broadcasting turn_complete');
  for (const [id, client] of browserClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'turn_complete',
      }));
    }
  }
}

console.log(`
🎮 Gangs of Claude WebSocket Bridge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 WebSocket Server: ws://localhost:3456
🌐 Web UI:           http://localhost:5174

✓ Auto-starting CLI when browser connects
✓ Auto-stopping CLI when all browsers disconnect

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Keep process running
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  stopCliProcess();
  process.exit(0);
});
