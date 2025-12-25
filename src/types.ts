export interface ConnectionProfile {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authType: AuthType;
  privateKeyPath?: string;
  password?: string;
  privateKeyPassphrase?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum AuthType {
  PASSWORD = 'password',
  PRIVATE_KEY = 'privateKey',
  PRIVATE_KEY_WITH_PASSWORD = 'privateKeyWithPassword'
}

export interface ConnectionCredentials {
  password?: string;
  privateKeyPassphrase?: string;
}

export interface ConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
  activeConnectionId?: string;
}

export interface ActiveConnection {
  id: string;
  profileId: string;
  profileName: string;
  hostname: string;
  username: string;
  port: number;
  startTime: string;
  terminalPid?: number;
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected'
}

export interface TerminalSession {
  id: string;
  profileId: string;
  profileName: string;
  cols: number;
  rows: number;
  shell: string;
  cwd?: string;
}