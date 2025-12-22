import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  terminalId: string;
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
}

const Terminal: React.FC<TerminalProps> = ({ terminalId, onData, onResize }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const xterm = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selection: '#3390ff',
      },
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    // Create addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    // Load addons
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // Open terminal in the DOM
    xterm.open(terminalRef.current);

    // Fit terminal to container
    fitAddon.fit();

    // Store references
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Handle data input from terminal
    xterm.onData((data: string) => {
      onData(data);
    });

    // Handle resize
    xterm.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      onResize(cols, rows);
    });

    // Listen for data from main process
    const handleTerminalData = (event: any, id: string, data: string) => {
      if (id === terminalId) {
        xterm.write(data);
      }
    };

    const handleTerminalClose = (event: any, id: string) => {
      if (id === terminalId) {
        xterm.write('\r\n\x1b[31mConnection closed.\x1b[0m\r\n');
      }
    };

    // Set up IPC listeners
    window.electron?.ipcRenderer.on('terminal-data', handleTerminalData);
    window.electron?.ipcRenderer.on('terminal-close', handleTerminalClose);

    // Handle window resize
    const handleResize = () => {
      setTimeout(() => fitAddon.fit(), 100);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.electron?.ipcRenderer.removeAllListeners('terminal-data');
      window.electron?.ipcRenderer.removeAllListeners('terminal-close');
      xterm.dispose();
    };
  }, [terminalId, onData, onResize]);

  // Method to write data to terminal
  useEffect(() => {
    const handleWrite = (event: any, id: string, data: string) => {
      if (id === terminalId && xtermRef.current) {
        xtermRef.current.write(data);
      }
    };

    window.electron?.ipcRenderer.on('terminal-write', handleWrite);

    return () => {
      window.electron?.ipcRenderer.removeAllListeners('terminal-write');
    };
  }, [terminalId]);

  return (
    <div
      ref={terminalRef}
      className="terminal-container"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e'
      }}
    />
  );
};

export default Terminal;