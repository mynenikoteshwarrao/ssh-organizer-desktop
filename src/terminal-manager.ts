import * as pty from 'node-pty';
import * as os from 'os';
import * as path from 'path';
import { EventEmitter } from 'events';
import { TerminalSession, ConnectionProfile, AuthType } from './types';
import { logger } from './logger';

export interface TerminalProcess {
  id: string;
  ptyProcess: pty.IPty;
  session: TerminalSession;
}

export class TerminalManager extends EventEmitter {
  private terminals = new Map<string, TerminalProcess>();

  constructor() {
    super();
  }

  async createTerminal(terminalId: string, profile: ConnectionProfile): Promise<{ success: boolean; error?: string }> {
    try {
      // Determine shell and SSH command based on platform
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'cmd.exe' : (process.env.SHELL || '/bin/bash');

      // Build SSH command
      const sshArgs = await this.buildSSHCommand(profile);
      if (!sshArgs.success) {
        return { success: false, error: sshArgs.error };
      }

      // Create terminal session
      const session: TerminalSession = {
        id: terminalId,
        profileId: profile.id,
        profileName: profile.name,
        cols: 80,
        rows: 24,
        shell: shell,
        cwd: os.homedir()
      };

      // Determine command to run
      let command: string;
      let args: string[];

      if (isWindows) {
        // On Windows, use cmd.exe and then execute SSH
        command = 'cmd.exe';
        args = [];
      } else {
        // On Unix-like systems, use the shell
        command = shell;
        args = [];
      }

      // Create PTY process
      const ptyProcess = pty.spawn(command, args, {
        name: 'xterm-color',
        cols: session.cols,
        rows: session.rows,
        cwd: session.cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        },
        encoding: 'utf8'
      });

      // Store terminal process
      const terminalProcess: TerminalProcess = {
        id: terminalId,
        ptyProcess,
        session
      };

      this.terminals.set(terminalId, terminalProcess);

      // Handle PTY data (output from terminal)
      ptyProcess.onData((data: string) => {
        this.emit('data', terminalId, data);
      });

      // Handle PTY exit
      ptyProcess.onExit((exitCode) => {
        logger.info(`Terminal ${terminalId} exited with code ${exitCode.exitCode}`);
        this.emit('close', terminalId);
        this.terminals.delete(terminalId);
      });

      // Send initial SSH command after a brief delay
      setTimeout(() => {
        if (sshArgs.command) {
          ptyProcess.write(`${sshArgs.command}\r`);
        }
      }, 500);

      logger.success(`Terminal ${terminalId} created for ${profile.name}`);
      return { success: true };

    } catch (error) {
      logger.error(`Failed to create terminal ${terminalId}`, error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to create terminal session' };
    }
  }

  sendData(terminalId: string, data: string): void {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.ptyProcess.write(data);
    }
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.ptyProcess.resize(cols, rows);
      terminal.session.cols = cols;
      terminal.session.rows = rows;
    }
  }

  closeTerminal(terminalId: string): void {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.ptyProcess.kill();
      this.terminals.delete(terminalId);
      logger.info(`Terminal ${terminalId} closed`);
    }
  }

  closeAllTerminals(): void {
    for (const [terminalId] of this.terminals) {
      this.closeTerminal(terminalId);
    }
  }

  getActiveTerminals(): TerminalSession[] {
    return Array.from(this.terminals.values()).map(t => t.session);
  }

  private async buildSSHCommand(profile: ConnectionProfile): Promise<{ success: boolean; command?: string; error?: string }> {
    try {
      const args: string[] = [];

      // Add port if not default
      if (profile.port !== 22) {
        args.push('-p', profile.port.toString());
      }

      // Add SSH options for better terminal experience
      args.push('-o', 'StrictHostKeyChecking=no');
      args.push('-o', 'UserKnownHostsFile=/dev/null');
      args.push('-o', 'LogLevel=QUIET');

      // Handle authentication
      if (profile.authType === AuthType.PRIVATE_KEY || profile.authType === AuthType.PRIVATE_KEY_WITH_PASSWORD) {
        if (!profile.privateKeyPath) {
          return { success: false, error: 'Private key path is required' };
        }

        // Check if private key file exists
        const fs = require('fs');
        if (!fs.existsSync(profile.privateKeyPath)) {
          return { success: false, error: 'Private key file not found' };
        }

        args.push('-i', `"${profile.privateKeyPath}"`);
      }

      // Add connection target
      args.push(`${profile.username}@${profile.hostname}`);

      // Build final command
      const sshCommand = `ssh ${args.join(' ')}`;

      return { success: true, command: sshCommand };
    } catch (error) {
      return { success: false, error: 'Failed to build SSH command' };
    }
  }
}