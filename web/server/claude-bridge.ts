/**
 * Claude Agent Bridge — Spawns Claude CLI with --sdk-url and communicates via WebSocket.
 * Uses the NDJSON protocol documented in the Companion project.
 *
 * One bridge instance is created per turn. It supports multi-turn:
 * send a prompt, get a result, send another prompt, etc.
 */

import { randomUUID } from 'node:crypto';
import type { Subprocess } from 'bun';
import type { ServerWebSocket } from 'bun';

export interface BridgeOptions {
  /** Port the game server is running on */
  port: number;
  /** Path to claude binary (defaults to 'claude') */
  claudeBinary?: string;
  /** Timeout per prompt in ms (default: 120000) */
  promptTimeout?: number;
  /** Callback when streaming text arrives */
  onStreamText?: (text: string) => void;
}

interface PendingPrompt {
  resolve: (result: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Manages a Claude CLI process connected via WebSocket for LLM-driven AI decisions.
 */
export class ClaudeAgentBridge {
  private sessionId: string;
  private port: number;
  private claudeBinary: string;
  private promptTimeout: number;
  private onStreamText?: (text: string) => void;

  private process: Subprocess | null = null;
  private cliSocket: ServerWebSocket<any> | null = null;
  private cliSessionId: string = '';
  private pendingPrompt: PendingPrompt | null = null;
  private connected: boolean = false;
  private initReceived: boolean = false;
  private resultText: string = '';

  // Promise that resolves when CLI connects via WebSocket
  private connectResolve: ((value: void) => void) | null = null;
  private connectReject: ((error: Error) => void) | null = null;
  private connectPromise: Promise<void>;

  constructor(options: BridgeOptions) {
    this.sessionId = randomUUID();
    this.port = options.port;
    this.claudeBinary = options.claudeBinary || 'claude';
    this.promptTimeout = options.promptTimeout || 120000;
    this.onStreamText = options.onStreamText;

    this.connectPromise = new Promise((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
    });
  }

  /** The unique session ID for this bridge's WebSocket path */
  get id(): string {
    return this.sessionId;
  }

  /**
   * Called by the server when Claude CLI connects via WebSocket.
   */
  handleCliConnection(ws: ServerWebSocket<any>): void {
    this.cliSocket = ws;
    this.connected = true;
    console.log(`[claude-bridge] CLI connected for session ${this.sessionId}`);
    // Resolve connect promise on WebSocket connection (don't wait for init)
    if (this.connectResolve) {
      this.connectResolve();
      this.connectResolve = null;
    }
  }

  /**
   * Called by the server when a message arrives from Claude CLI.
   */
  handleCliMessage(data: string): void {
    const raw = typeof data === 'string' ? data : data.toString();
    const lines = raw.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        console.log(`[claude-bridge] Message type: ${msg.type}${msg.subtype ? '/' + msg.subtype : ''}`);
        this.processMessage(msg);
      } catch (e) {
        console.warn(`[claude-bridge] Failed to parse line: ${line.substring(0, 100)}`);
      }
    }
  }

  /**
   * Called by the server when the CLI WebSocket closes.
   */
  handleCliClose(): void {
    this.connected = false;
    this.cliSocket = null;
    console.log(`[claude-bridge] CLI disconnected for session ${this.sessionId}`);

    // Reject any pending prompt
    if (this.pendingPrompt) {
      this.pendingPrompt.reject(new Error('CLI disconnected'));
      clearTimeout(this.pendingPrompt.timer);
      this.pendingPrompt = null;
    }
  }

  /**
   * Spawn the Claude CLI process and wait for it to connect.
   */
  async spawn(): Promise<void> {
    const sdkUrl = `ws://localhost:${this.port}/ws/agent/${this.sessionId}`;
    const args = [
      '--sdk-url', sdkUrl,
      '--print',
      '--output-format', 'stream-json',
      '--input-format', 'stream-json',
      '--max-turns', '8',
      '-p', '',
    ];

    console.log(`[claude-bridge] Spawning: ${this.claudeBinary} ${args.join(' ')}`);

    this.process = Bun.spawn([this.claudeBinary, ...args], {
      cwd: '/tmp', // Avoid picking up project .claude/settings.json hooks
      env: {
        ...process.env,
        CLAUDECODE: undefined,
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // Pipe stderr for debugging
    this.pipeStream(this.process.stderr, 'stderr');

    // Monitor exit
    this.process.exited.then((code) => {
      console.log(`[claude-bridge] CLI exited with code ${code} for session ${this.sessionId}`);
      this.handleCliClose();
    });

    // Wait for CLI to connect (with timeout)
    const connectTimeout = setTimeout(() => {
      if (this.connectReject) {
        this.connectReject(new Error('Claude CLI failed to connect within 30s'));
      }
    }, 30000);

    try {
      await this.connectPromise;
      clearTimeout(connectTimeout);
    } catch (e) {
      clearTimeout(connectTimeout);
      this.kill();
      throw e;
    }
  }

  /**
   * Send a prompt and wait for the LLM result.
   */
  async sendPrompt(text: string): Promise<string> {
    if (!this.connected || !this.cliSocket) {
      throw new Error('CLI not connected');
    }

    // Wait briefly for init if not received yet (best-effort, don't block forever)
    if (!this.initReceived) {
      await new Promise<void>((resolve) => {
        let attempts = 0;
        const check = () => {
          if (this.initReceived || attempts > 50) resolve(); // 5s max wait
          else { attempts++; setTimeout(check, 100); }
        };
        check();
      });
    }

    return new Promise<string>((resolve, reject) => {
      this.resultText = '';

      const timer = setTimeout(() => {
        this.pendingPrompt = null;
        reject(new Error(`Prompt timed out after ${this.promptTimeout}ms`));
      }, this.promptTimeout);

      this.pendingPrompt = { resolve, reject, timer };

      // Send user message
      const msg = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: text },
        parent_tool_use_id: null,
        session_id: this.cliSessionId,
      }) + '\n';

      this.cliSocket!.send(msg);
    });
  }

  /**
   * Kill the Claude CLI process.
   */
  kill(): void {
    if (this.process) {
      try {
        this.process.kill('SIGTERM');
      } catch {}
      this.process = null;
    }
    if (this.pendingPrompt) {
      clearTimeout(this.pendingPrompt.timer);
      this.pendingPrompt = null;
    }
  }

  // ── Internal message processing ──

  private processMessage(msg: any): void {
    switch (msg.type) {
      case 'system':
        if (msg.subtype === 'init') {
          this.cliSessionId = msg.session_id || '';
          this.initReceived = true;
          console.log(`[claude-bridge] Init received: session=${this.cliSessionId}, model=${msg.model}`);
        }
        // Log other system messages for debugging
        break;

      case 'assistant':
        // Extract text content from assistant message
        if (msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'text') {
              this.resultText += block.text;
              if (this.onStreamText) {
                this.onStreamText(block.text);
              }
            }
          }
        }
        break;

      case 'result':
        // Query complete — resolve pending prompt
        if (this.pendingPrompt) {
          clearTimeout(this.pendingPrompt.timer);
          const finalText = msg.result || this.resultText;
          this.pendingPrompt.resolve(finalText);
          this.pendingPrompt = null;
          this.resultText = '';
        }
        break;

      case 'control_request':
        // Auto-approve ALL control requests (tools, hooks, permissions)
        this.sendControlResponse(msg.request_id, msg.request?.input);
        break;

      case 'keep_alive':
        // Silently consume
        break;

      default:
        // Ignore stream_event, tool_progress, etc.
        break;
    }
  }

  private sendControlResponse(requestId: string, originalInput: any): void {
    if (!this.cliSocket) return;
    const response = JSON.stringify({
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: requestId,
        response: {
          behavior: 'allow',
          updatedInput: originalInput || {},
        },
      },
    }) + '\n';
    this.cliSocket.send(response);
  }

  private async pipeStream(
    stream: ReadableStream<Uint8Array> | null,
    label: string,
  ): Promise<void> {
    if (!stream) return;
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value).trim();
        if (text) {
          console.log(`[claude-bridge:${label}] ${text}`);
        }
      }
    } catch {
      // Stream closed
    }
  }
}
