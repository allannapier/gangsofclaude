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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Path to save.json (project root/.claude/game-state/save.json)
const saveJsonPath = join(rootDir, '..', '.claude', 'game-state', 'save.json');
console.log('🔧 DEBUG: Server code loaded - index.ts');
console.log('📁 Save file path:', saveJsonPath);

// Track last known event count to detect changes
let lastEventCount = 0;
let lastMessageCount = 0;
let lastKnownTurn = 0;

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

    // Check if turn changed
    if (saveData.turn !== undefined && saveData.turn !== lastKnownTurn) {
      console.log(`🔄 Turn changed: ${saveData.turn} (was ${lastKnownTurn})`);
      lastKnownTurn = saveData.turn;

      // Broadcast game state update
      for (const [id, client] of browserClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'game_state_update',
            gameState: {
              turn: saveData.turn,
              phase: saveData.phase || 'playing',
              territoryOwnership: saveData.territoryOwnership || {},
            },
          }));
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

        // Flush any queued prompts that arrived before CLI websocket connected.
        while (pendingPrompts.length > 0 && cliConnection.readyState === WebSocket.OPEN) {
          const prompt = pendingPrompts.shift()!;
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
        }

        // Notify all browsers that CLI is connected
        for (const [id, client] of browserClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'status',
              status: 'connected',
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

        if (cliConnection && cliConnection.readyState === WebSocket.OPEN) {
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

            // Track if this is a next-turn command
            if (prompt.trim() === '/next-turn') {
              pendingNextTurnRequests.add(requestId);
              isNextTurnInProgress = true;
              console.log('🎯 Tracking next-turn request:', requestId);

              // Increment turn in save.json before forwarding to CLI
              // (This is a fallback in case the PreToolUse hook doesn't fire)
              try {
                if (existsSync(saveJsonPath)) {
                  const saveData = JSON.parse(readFileSync(saveJsonPath, 'utf-8'));
                  const currentTurn = saveData.turn || 0;
                  saveData.turn = currentTurn + 1;
                  writeFileSync(saveJsonPath, JSON.stringify(saveData, null, 2));
                  console.log(`🎯 Pre-incremented turn from ${currentTurn} to ${saveData.turn}`);

                  // Broadcast turn update to browsers immediately
                  for (const [id, client] of browserClients) {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'game_state_update',
                        gameState: {
                          turn: saveData.turn,
                          phase: saveData.phase || 'playing',
                          families: saveData.families,
                          territoryOwnership: saveData.territoryOwnership || {},
                        },
                      }));
                    }
                  }
                }
              } catch (e) {
                console.error('Error pre-incrementing turn:', e);
              }
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
              console.log('🎯 Command completed, will update player state from save.json');
              // CLI may return request_id (snake_case) or requestId (camelCase)
              const responseRequestId = cliData.requestId || cliData.request_id;
              // Check if this is a next-turn result by requestId or by the in-progress flag
              const isNextTurnResult = (responseRequestId && pendingNextTurnRequests.has(responseRequestId)) ||
                                       (isNextTurnInProgress && cliData.result && typeof cliData.result === 'string' && cliData.result.includes('Turn'));
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
                            },
                          }));
                        }
                      }
                    }
                    // Send tasks update (from messages with type: "order")
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

                  } else {
                    console.log('⚠️ save.json not found at:', saveJsonPath);
                  }

                  // Broadcast turn_complete signal only if this was a next-turn command
                  // This must come AFTER all other updates so the client has fresh data
                  if (isNextTurnResult) {
                    console.log('🏁 Turn processing complete, broadcasting turn_complete');
                    broadcastTurnComplete();
                  }
                } catch (e) {
                  console.error('Error reading save.json:', e);
                }
              }, 100); // Small delay to ensure file is written
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
