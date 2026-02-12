/**
 * Development server that starts both WebSocket bridge and Vite dev server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log(`
🎮 Gangs of Claude Development Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 WebSocket Server: ws://localhost:3456
🌐 Web UI:           http://localhost:5174
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To connect Claude Code CLI:
  claude --sdk-url ws://localhost:3456/cli \\
        --print \\
        --output-format stream-json
`);

// Start the WebSocket bridge server
const server = spawn('bun', ['run', 'server/index.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
});

// Give the server a moment to start, then start Vite
setTimeout(() => {
  // Start the Vite dev server
  const client = spawn('bun', ['run', '--cwd', 'client', 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  // Handle shutdown
  const shutdown = () => {
    console.log('\n👋 Shutting down servers...');
    server.kill();
    client.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Wait for both processes
  Promise.all([
    new Promise((resolve) => server.on('exit', resolve)),
    new Promise((resolve) => client.on('exit', resolve)),
  ]).then(() => process.exit(0));
}, 500);
