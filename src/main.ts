import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as keytar from 'keytar';
import { spawn } from 'child_process';
import { ConnectionProfile, AuthType } from './types';
import { ConnectionManager } from './connection-manager';
import { logger } from './logger';

class SSHConnectionManager {
  private mainWindow: BrowserWindow | null = null;
  private connectionManager: ConnectionManager;

  constructor() {
    this.connectionManager = new ConnectionManager();
    this.setupIpcHandlers();
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      height: 700,
      width: 1000,
      minHeight: 600,
      minWidth: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'default',
      show: false,
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('get-connections', async () => {
      return await this.connectionManager.getConnections();
    });

    ipcMain.handle('save-connection', async (event, profile: ConnectionProfile) => {
      return await this.connectionManager.saveConnection(profile);
    });

    ipcMain.handle('delete-connection', async (event, id: string) => {
      return await this.connectionManager.deleteConnection(id);
    });

    ipcMain.handle('connect-ssh', async (event, id: string) => {
      return await this.connectionManager.connectSSH(id);
    });

    ipcMain.handle('test-connection', async (event, profile: ConnectionProfile) => {
      return await this.connectionManager.testConnection(profile);
    });

    ipcMain.handle('get-active-connections', async () => {
      return await this.connectionManager.getActiveConnections();
    });

    ipcMain.handle('disconnect-ssh', async (event, activeConnectionId: string) => {
      return await this.connectionManager.disconnectSSH(activeConnectionId);
    });

    ipcMain.handle('disconnect-all', async () => {
      return await this.connectionManager.disconnectAll();
    });

    // Terminal IPC handlers
    ipcMain.handle('create-terminal', async (event, terminalId: string, profileId: string) => {
      return await this.connectionManager.createTerminal(terminalId, profileId);
    });

    ipcMain.handle('send-terminal-data', (event, terminalId: string, data: string) => {
      this.connectionManager.sendTerminalData(terminalId, data);
    });

    ipcMain.handle('resize-terminal', (event, terminalId: string, cols: number, rows: number) => {
      this.connectionManager.resizeTerminal(terminalId, cols, rows);
    });

    ipcMain.handle('close-terminal', (event, terminalId: string) => {
      this.connectionManager.closeTerminal(terminalId);
    });

    // Logger IPC handlers
    ipcMain.handle('get-logs', () => {
      return logger.getLogs();
    });

    ipcMain.handle('clear-logs', () => {
      logger.clear();
      return true;
    });

    // Set up logger subscription to send logs to renderer
    logger.subscribe((logs) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('logs-updated', logs);
      }
    });

    // Set up terminal manager event forwarding
    const terminalManager = this.connectionManager.getTerminalManager();

    terminalManager.on('data', (terminalId: string, data: string) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('terminal-data', terminalId, data);
      }
    });

    terminalManager.on('close', (terminalId: string) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('terminal-close', terminalId);
      }
    });
  }

  public init(): void {
    app.whenReady().then(() => {
      this.createWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }
}

const sshManager = new SSHConnectionManager();
sshManager.init();