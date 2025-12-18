import { randomUUID } from 'crypto';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export type LogLevel = LogEntry['level'];

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private addLog(level: LogLevel, message: string, details?: string) {
    const logEntry: LogEntry = {
      id: randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details
    };

    this.logs.unshift(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  info(message: string, details?: string) {
    this.addLog('info', message, details);
    console.log(`[INFO] ${message}`, details ? `\n${details}` : '');
  }

  success(message: string, details?: string) {
    this.addLog('success', message, details);
    console.log(`[SUCCESS] ${message}`, details ? `\n${details}` : '');
  }

  warning(message: string, details?: string) {
    this.addLog('warning', message, details);
    console.warn(`[WARNING] ${message}`, details ? `\n${details}` : '');
  }

  error(message: string, details?: string) {
    this.addLog('error', message, details);
    console.error(`[ERROR] ${message}`, details ? `\n${details}` : '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);

    // Send current logs immediately
    listener([...this.logs]);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }
}

export const logger = new Logger();