import { contextBridge, ipcRenderer } from 'electron';
import { ConnectionProfile, ConnectionResult, ActiveConnection } from './types';
import { LogEntry } from './logger';

const electronAPI = {
  getConnections: (): Promise<ConnectionProfile[]> =>
    ipcRenderer.invoke('get-connections'),

  saveConnection: (profile: ConnectionProfile): Promise<ConnectionResult> =>
    ipcRenderer.invoke('save-connection', profile),

  deleteConnection: (id: string): Promise<ConnectionResult> =>
    ipcRenderer.invoke('delete-connection', id),

  connectSSH: (id: string): Promise<ConnectionResult> =>
    ipcRenderer.invoke('connect-ssh', id),

  testConnection: (profile: ConnectionProfile): Promise<ConnectionResult> =>
    ipcRenderer.invoke('test-connection', profile),

  // Active connections API
  getActiveConnections: (): Promise<ActiveConnection[]> =>
    ipcRenderer.invoke('get-active-connections'),

  disconnectSSH: (activeConnectionId: string): Promise<ConnectionResult> =>
    ipcRenderer.invoke('disconnect-ssh', activeConnectionId),

  disconnectAll: (): Promise<ConnectionResult> =>
    ipcRenderer.invoke('disconnect-all'),

  // Terminal API
  createTerminal: (terminalId: string, connectionName: string): Promise<ConnectionResult> =>
    ipcRenderer.invoke('create-terminal', terminalId, connectionName),

  sendTerminalData: (terminalId: string, data: string): void => {
    ipcRenderer.invoke('send-terminal-data', terminalId, data);
  },

  resizeTerminal: (terminalId: string, cols: number, rows: number): void => {
    ipcRenderer.invoke('resize-terminal', terminalId, cols, rows);
  },

  closeTerminal: (terminalId: string): void => {
    ipcRenderer.invoke('close-terminal', terminalId);
  },

  onTerminalData: (terminalId: string, callback: (data: string) => void) => {
    const subscription = (event: any, receivedTerminalId: string, data: string) => {
      if (receivedTerminalId === terminalId) {
        callback(data);
      }
    };
    ipcRenderer.on('terminal-data', subscription);

    return () => {
      ipcRenderer.removeListener('terminal-data', subscription);
    };
  },

  onTerminalClose: (terminalId: string, callback: () => void) => {
    const subscription = (event: any, receivedTerminalId: string) => {
      if (receivedTerminalId === terminalId) {
        callback();
      }
    };
    ipcRenderer.on('terminal-close', subscription);

    return () => {
      ipcRenderer.removeListener('terminal-close', subscription);
    };
  },

  // Logger API
  getLogs: (): Promise<LogEntry[]> =>
    ipcRenderer.invoke('get-logs'),

  clearLogs: (): Promise<boolean> =>
    ipcRenderer.invoke('clear-logs'),

  onLogsUpdated: (callback: (logs: LogEntry[]) => void) => {
    const subscription = (event: any, logs: LogEntry[]) => callback(logs);
    ipcRenderer.on('logs-updated', subscription);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('logs-updated', subscription);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}