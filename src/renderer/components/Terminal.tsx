import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  terminalId: string;
  connectionName: string;
  onClose: () => void;
  onResize?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({
  terminalId,
  connectionName,
  onClose,
  onResize
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new XTerm({
      fontFamily: '"SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: 13,
      fontWeight: 400,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
      theme: {
        foreground: '#ffffff',
        background: '#1e1e1e',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#316ac5',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      }
    });

    // Create and load addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal in DOM
    terminal.open(terminalRef.current);

    // Fit terminal to container
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle data from terminal (user input)
    terminal.onData((data) => {
      // Send data to backend terminal process
      window.electronAPI.sendTerminalData(terminalId, data);
    });

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      window.electronAPI.resizeTerminal(terminalId, cols, rows);
      onResize?.();
    });

    // Request terminal creation from backend
    window.electronAPI.createTerminal(terminalId, connectionName)
      .then((result) => {
        if (result.success) {
          setIsConnected(true);
          setStatus('Connected');
        } else {
          setStatus(`Error: ${result.error}`);
          terminal.write(`\r\n\x1b[31mConnection failed: ${result.error}\x1b[0m\r\n`);
        }
      })
      .catch((error) => {
        setStatus(`Error: ${error.message}`);
        terminal.write(`\r\n\x1b[31mFailed to connect: ${error.message}\x1b[0m\r\n`);
      });

    // Listen for data from backend
    const unsubscribeData = window.electronAPI.onTerminalData(terminalId, (data) => {
      terminal.write(data);
    });

    // Listen for terminal close events
    const unsubscribeClose = window.electronAPI.onTerminalClose(terminalId, () => {
      setIsConnected(false);
      setStatus('Disconnected');
      terminal.write('\r\n\x1b[33mConnection closed\x1b[0m\r\n');
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribeData();
      unsubscribeClose();
      window.electronAPI.closeTerminal(terminalId);
      terminal.dispose();
    };
  }, [terminalId, connectionName, onResize]);

  const handleFit = () => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  const handleDisconnect = () => {
    window.electronAPI.closeTerminal(terminalId);
    onClose();
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-info">
          <span className="terminal-title">{connectionName}</span>
          <span className={`terminal-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {status}
          </span>
        </div>
        <div className="terminal-actions">
          <button
            className="terminal-btn"
            onClick={handleClear}
            title="Clear terminal"
          >
            Clear
          </button>
          <button
            className="terminal-btn"
            onClick={handleFit}
            title="Fit to container"
          >
            Fit
          </button>
          <button
            className="terminal-btn terminal-btn-danger"
            onClick={handleDisconnect}
            title="Disconnect"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="terminal-content">
        <div ref={terminalRef} className="terminal" />
      </div>
    </div>
  );
};

export default Terminal;