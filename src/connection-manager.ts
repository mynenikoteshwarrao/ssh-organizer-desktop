import * as keytar from 'keytar';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { ConnectionProfile, AuthType, ConnectionCredentials, ConnectionResult, ActiveConnection, ConnectionStatus } from './types';
import { logger } from './logger';
import { TerminalManager } from './terminal-manager';

const SERVICE_NAME = 'ssh-connection-manager';
const PROFILES_FILE = path.join(os.homedir(), '.ssh-manager', 'profiles.json');

export class ConnectionManager {
  private profiles: ConnectionProfile[] = [];
  private recentConnections = new Map<string, number>();
  private readonly CONNECTION_COOLDOWN = 2000; // 2 seconds cooldown
  private activeConnections = new Map<string, ActiveConnection>();
  private terminalManager: TerminalManager;

  constructor() {
    logger.info('SSH Connection Manager initialized');
    this.terminalManager = new TerminalManager();
    this.loadProfiles();
  }

  private async loadProfiles(): Promise<void> {
    try {
      const profilesDir = path.dirname(PROFILES_FILE);
      if (!fs.existsSync(profilesDir)) {
        fs.mkdirSync(profilesDir, { recursive: true });
      }

      if (fs.existsSync(PROFILES_FILE)) {
        const data = fs.readFileSync(PROFILES_FILE, 'utf8');
        this.profiles = JSON.parse(data);
        logger.info(`Loaded ${this.profiles.length} connection profiles`);
      } else {
        logger.info('No existing profiles found, starting fresh');
      }
    } catch (error) {
      logger.error('Failed to load profiles', error instanceof Error ? error.message : String(error));
      this.profiles = [];
    }
  }

  private async saveProfiles(): Promise<void> {
    try {
      const profilesDir = path.dirname(PROFILES_FILE);
      if (!fs.existsSync(profilesDir)) {
        fs.mkdirSync(profilesDir, { recursive: true });
      }

      fs.writeFileSync(PROFILES_FILE, JSON.stringify(this.profiles, null, 2));
    } catch (error) {
      console.error('Failed to save profiles:', error);
      throw new Error('Failed to save connection profiles');
    }
  }

  async getConnections(): Promise<ConnectionProfile[]> {
    return this.profiles.map(profile => ({
      ...profile,
      // Don't expose sensitive data in the profile list
    }));
  }

  async getActiveConnections(): Promise<ActiveConnection[]> {
    return Array.from(this.activeConnections.values());
  }

  async disconnectSSH(activeConnectionId: string): Promise<ConnectionResult> {
    try {
      const activeConnection = this.activeConnections.get(activeConnectionId);
      if (!activeConnection) {
        return { success: false, error: 'Active connection not found' };
      }

      logger.info(`Initiating disconnection for: ${activeConnection.profileName}`);
      activeConnection.status = ConnectionStatus.DISCONNECTING;

      // Method 1: Try to close the terminal window using AppleScript (macOS)
      if (process.platform === 'darwin') {
        const applescript = `tell application "Terminal"
          set windowList to every window
          repeat with aWindow in windowList
            set tabList to every tab of aWindow
            repeat with aTab in tabList
              if busy of aTab is true then
                set processes of aTab to {}
                close aTab
              end if
            end repeat
          end repeat
        end tell`;

        spawn('osascript', ['-e', applescript], {
          detached: true,
          stdio: 'ignore'
        });
      }

      // Method 2: Kill the SSH process if we have a PID
      if (activeConnection.terminalPid) {
        try {
          process.kill(activeConnection.terminalPid, 'SIGTERM');
          logger.info(`Sent SIGTERM to SSH process ${activeConnection.terminalPid}`);
        } catch (error) {
          logger.warning(`Failed to kill SSH process ${activeConnection.terminalPid}:`, error instanceof Error ? error.message : String(error));
        }
      }

      // Method 3: Kill SSH processes by pattern matching
      if (process.platform !== 'win32') {
        spawn('pkill', ['-f', `ssh.*${activeConnection.hostname}`], {
          detached: true,
          stdio: 'ignore'
        });
      }

      // Update connection status
      activeConnection.status = ConnectionStatus.DISCONNECTED;
      this.activeConnections.delete(activeConnectionId);

      logger.success(`Disconnected from '${activeConnection.profileName}'`);
      return { success: true, message: 'SSH connection terminated' };
    } catch (error) {
      logger.error('Failed to disconnect SSH connection', error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to disconnect SSH connection' };
    }
  }

  async disconnectAll(): Promise<ConnectionResult> {
    try {
      const activeConnections = Array.from(this.activeConnections.keys());
      let successCount = 0;
      let errorCount = 0;

      for (const connectionId of activeConnections) {
        const result = await this.disconnectSSH(connectionId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        logger.success(`Successfully disconnected all ${successCount} connections`);
        return { success: true, message: `Disconnected ${successCount} connections` };
      } else if (successCount > 0) {
        logger.warning(`Disconnected ${successCount} connections, ${errorCount} failed`);
        return { success: true, message: `Disconnected ${successCount} connections, ${errorCount} failed` };
      } else {
        logger.error('Failed to disconnect any connections');
        return { success: false, error: 'Failed to disconnect connections' };
      }
    } catch (error) {
      logger.error('Failed to disconnect all connections', error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to disconnect all connections' };
    }
  }

  async saveConnection(profile: ConnectionProfile, credentials?: ConnectionCredentials): Promise<ConnectionResult> {
    logger.info(`Saving connection: ${profile.name} (${profile.username}@${profile.hostname}:${profile.port})`);
    try {
      const existingIndex = this.profiles.findIndex(p => p.id === profile.id);
      const now = new Date().toISOString();

      const updatedProfile: ConnectionProfile = {
        ...profile,
        updatedAt: now,
        createdAt: existingIndex === -1 ? now : this.profiles[existingIndex].createdAt
      };

      if (credentials) {
        // Store credentials securely in keychain
        if (credentials.password) {
          await keytar.setPassword(SERVICE_NAME, `${profile.id}_password`, credentials.password);
        }
        if (credentials.privateKeyPassphrase) {
          await keytar.setPassword(SERVICE_NAME, `${profile.id}_passphrase`, credentials.privateKeyPassphrase);
        }
      }

      if (existingIndex === -1) {
        this.profiles.push(updatedProfile);
      } else {
        this.profiles[existingIndex] = updatedProfile;
      }

      await this.saveProfiles();
      logger.success(`Connection '${profile.name}' saved successfully`);
      return { success: true, message: 'Connection saved successfully' };
    } catch (error) {
      logger.error(`Failed to save connection '${profile.name}'`, error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to save connection' };
    }
  }

  async deleteConnection(id: string): Promise<ConnectionResult> {
    const profile = this.profiles.find(p => p.id === id);
    logger.info(`Deleting connection: ${profile ? profile.name : id}`);
    try {
      const index = this.profiles.findIndex(p => p.id === id);
      if (index === -1) {
        return { success: false, error: 'Connection not found' };
      }

      // Remove credentials from keychain
      try {
        await keytar.deletePassword(SERVICE_NAME, `${id}_password`);
      } catch (e) {
        // Password might not exist
      }
      try {
        await keytar.deletePassword(SERVICE_NAME, `${id}_passphrase`);
      } catch (e) {
        // Passphrase might not exist
      }

      this.profiles.splice(index, 1);
      await this.saveProfiles();
      logger.success(`Connection '${profile?.name}' deleted successfully`);
      return { success: true, message: 'Connection deleted successfully' };
    } catch (error) {
      logger.error(`Failed to delete connection '${profile?.name}'`, error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to delete connection' };
    }
  }

  async connectSSH(id: string): Promise<ConnectionResult> {
    try {
      const profile = this.profiles.find(p => p.id === id);

      // Check for recent connection attempt (prevent double-clicking)
      const now = Date.now();
      const lastAttempt = this.recentConnections.get(id);
      if (lastAttempt && (now - lastAttempt) < this.CONNECTION_COOLDOWN) {
        logger.warning(`Connection to '${profile?.name || id}' ignored - too soon after previous attempt`);
        return { success: false, error: 'Please wait before trying to connect again' };
      }

      this.recentConnections.set(id, now);
      logger.info(`Initiating external terminal SSH connection to: ${profile?.name || id}`);

      if (!profile) {
        return { success: false, error: 'Connection not found' };
      }

      // Launch external terminal with SSH connection
      const terminalResult = await this.launchExternalTerminal(profile);

      if (terminalResult.success) {
        // Create active connection record
        const activeConnection: ActiveConnection = {
          id: `conn_${id}_${Date.now()}`,
          profileId: profile.id,
          profileName: profile.name,
          hostname: profile.hostname,
          username: profile.username,
          port: profile.port,
          startTime: new Date().toISOString(),
          status: ConnectionStatus.CONNECTED,
          terminalPid: terminalResult.pid
        };

        this.activeConnections.set(activeConnection.id, activeConnection);
        logger.success(`External SSH connection to '${profile.name}' launched successfully`);

        return {
          success: true,
          message: 'SSH connection launched in external terminal',
          activeConnectionId: activeConnection.id
        };
      } else {
        logger.error(`Failed to launch external terminal for '${profile.name}': ${terminalResult.error}`);
        return terminalResult;
      }
    } catch (error) {
      const profile = this.profiles.find(p => p.id === id);
      logger.error(`Failed to connect to SSH '${profile?.name || id}'`, error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to launch SSH connection' };
    }
  }

  // Terminal management methods
  getTerminalManager(): TerminalManager {
    return this.terminalManager;
  }

  async createTerminal(terminalId: string, profileId: string): Promise<ConnectionResult> {
    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) {
      logger.error(`Connection profile not found for ID: ${profileId}`);
      return { success: false, error: 'Connection profile not found' };
    }

    logger.info(`Creating embedded terminal for: ${profile.name}`);
    return await this.terminalManager.createTerminal(terminalId, profile);
  }

  sendTerminalData(terminalId: string, data: string): void {
    this.terminalManager.sendData(terminalId, data);
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    this.terminalManager.resizeTerminal(terminalId, cols, rows);
  }

  closeTerminal(terminalId: string): void {
    this.terminalManager.closeTerminal(terminalId);
    // Also remove from active connections if it exists
    this.activeConnections.delete(terminalId);
  }

  async testConnection(profile: ConnectionProfile): Promise<ConnectionResult> {
    logger.info(`Testing connection to: ${profile.name} (${profile.hostname})`);
    try {
      const sshArgs = await this.buildSSHArgs(profile);
      if (!sshArgs.success) {
        return sshArgs;
      }

      return new Promise((resolve) => {
        const ssh = spawn('ssh', [
          '-o', 'ConnectTimeout=10',
          '-o', 'BatchMode=yes',
          '-o', 'StrictHostKeyChecking=no',
          ...(sshArgs.args || []),
          'exit'
        ]);

        ssh.on('exit', (code) => {
          if (code === 0) {
            logger.success(`Connection test to '${profile.name}' successful`);
            resolve({ success: true, message: 'Connection test successful' });
          } else {
            logger.warning(`Connection test to '${profile.name}' failed with exit code ${code}`);
            resolve({ success: false, error: 'Connection test failed' });
          }
        });

        ssh.on('error', (error) => {
          logger.error(`Connection test to '${profile.name}' failed`, error.message);
          resolve({ success: false, error: `Connection test failed: ${error.message}` });
        });
      });
    } catch (error) {
      logger.error(`Failed to test connection to '${profile.name}'`, error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to test connection' };
    }
  }

  private async buildSSHArgs(profile: ConnectionProfile): Promise<{ success: boolean; args?: string[]; error?: string }> {
    const args: string[] = [];

    try {
      // Add port if not default
      if (profile.port !== 22) {
        args.push('-p', profile.port.toString());
      }

      // Handle authentication
      if (profile.authType === AuthType.PRIVATE_KEY || profile.authType === AuthType.PRIVATE_KEY_WITH_PASSWORD) {
        if (!profile.privateKeyPath) {
          return { success: false, error: 'Private key path is required' };
        }

        if (!fs.existsSync(profile.privateKeyPath)) {
          return { success: false, error: 'Private key file not found' };
        }

        args.push('-i', profile.privateKeyPath);

        // Check if private key needs passphrase
        if (profile.authType === AuthType.PRIVATE_KEY_WITH_PASSWORD) {
          const passphrase = await keytar.getPassword(SERVICE_NAME, `${profile.id}_passphrase`);
          if (!passphrase) {
            return { success: false, error: 'Private key passphrase not found. Please re-enter credentials.' };
          }
          // Note: SSH agent or expect script would be needed to handle passphrase automatically
          // For now, user will be prompted
        }
      } else if (profile.authType === AuthType.PASSWORD) {
        const password = await keytar.getPassword(SERVICE_NAME, `${profile.id}_password`);
        if (!password) {
          return { success: false, error: 'Password not found. Please re-enter credentials.' };
        }
        // Note: sshpass or expect would be needed to handle password automatically
        // For now, user will be prompted
      }

      args.push(`${profile.username}@${profile.hostname}`);

      return { success: true, args };
    } catch (error) {
      return { success: false, error: 'Failed to build SSH arguments' };
    }
  }

  private async launchExternalTerminal(profile: ConnectionProfile): Promise<{ success: boolean; pid?: number; error?: string }> {
    try {
      logger.info(`Launching external terminal for ${profile.name}`);
      const sshArgs = await this.buildSSHArgs(profile);
      if (!sshArgs.success) {
        logger.error(`Failed to build SSH args for ${profile.name}: ${sshArgs.error}`);
        return { success: false, error: sshArgs.error };
      }

      logger.info(`SSH args for ${profile.name}: ${sshArgs.args?.join(' ')}`);
      let terminalProcess;

      if (process.platform === 'darwin') {
        // macOS - Use AppleScript to open Terminal.app with SSH command
        const sshCommand = `ssh ${sshArgs.args?.join(' ') || ''}`;
        logger.info(`Executing SSH command: ${sshCommand}`);

        terminalProcess = spawn('osascript', [
          '-e', 'tell application "Terminal" to activate',
          '-e', `tell application "Terminal" to do script "${sshCommand}"`
        ], {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        // Handle process events for debugging
        terminalProcess.on('error', (error) => {
          logger.error(`Terminal process error: ${error.message}`);
        });

        terminalProcess.on('exit', (code, signal) => {
          logger.info(`Terminal process exited with code ${code}, signal ${signal}`);
        });
      } else if (process.platform === 'win32') {
        // Windows - Use cmd to start a new command prompt with SSH
        const sshCommand = `ssh ${sshArgs.args?.join(' ') || ''}`;
        terminalProcess = spawn('cmd', ['/c', 'start', 'cmd', '/k', sshCommand], {
          detached: true,
          stdio: 'ignore'
        });
      } else {
        // Linux - Use gnome-terminal or default terminal
        const sshCommand = `ssh ${sshArgs.args?.join(' ') || ''}`;
        terminalProcess = spawn('gnome-terminal', ['--', 'bash', '-c', `${sshCommand}; exec bash`], {
          detached: true,
          stdio: 'ignore'
        });
      }

      terminalProcess.unref();

      logger.info(`External terminal launched for ${profile.name} with PID: ${terminalProcess.pid}`);
      return { success: true, pid: terminalProcess.pid };
    } catch (error) {
      logger.error(`Failed to launch external terminal for ${profile.name}`, error instanceof Error ? error.message : String(error));
      return { success: false, error: 'Failed to launch external terminal' };
    }
  }

  private getTerminalCommand(): { command: string; args: string[] } {
    switch (process.platform) {
      case 'darwin':
        return { command: 'osascript', args: ['-e'] };
      case 'win32':
        return { command: 'cmd', args: ['/c', 'start', 'cmd', '/k'] };
      default:
        return { command: 'gnome-terminal', args: ['--'] };
    }
  }
}