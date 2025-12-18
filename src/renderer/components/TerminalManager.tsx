import React, { useState, useEffect } from 'react';
import { ActiveConnection } from '../../types';
import Terminal from './Terminal';

interface TerminalManagerProps {
  activeConnections: ActiveConnection[];
  onConnectionClose: (connectionId: string) => void;
}

interface TerminalTab {
  id: string;
  connectionId: string;
  connectionName: string;
  isActive: boolean;
}

const TerminalManager: React.FC<TerminalManagerProps> = ({
  activeConnections,
  onConnectionClose
}) => {
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  useEffect(() => {
    // Sync terminal tabs with active connections
    const newTabs: TerminalTab[] = activeConnections
      .filter(conn => conn.status === 'connected')
      .map(conn => ({
        id: conn.id,
        connectionId: conn.id,
        connectionName: conn.profileName,
        isActive: false
      }));

    // Update existing tabs or create new ones
    const updatedTabs = newTabs.map(newTab => {
      const existingTab = terminalTabs.find(tab => tab.connectionId === newTab.connectionId);
      return existingTab || newTab;
    });

    // Remove tabs for disconnected connections
    const validTabs = updatedTabs.filter(tab =>
      activeConnections.some(conn => conn.id === tab.connectionId && conn.status === 'connected')
    );

    setTerminalTabs(validTabs);

    // Set active terminal if none is active and we have terminals
    if (!activeTerminalId && validTabs.length > 0) {
      setActiveTerminalId(validTabs[0].id);
    }

    // Remove active terminal if it's no longer valid
    if (activeTerminalId && !validTabs.some(tab => tab.id === activeTerminalId)) {
      setActiveTerminalId(validTabs.length > 0 ? validTabs[0].id : null);
    }
  }, [activeConnections, terminalTabs, activeTerminalId]);

  const handleTabClick = (terminalId: string) => {
    setActiveTerminalId(terminalId);
  };

  const handleTabClose = (terminalId: string) => {
    const tab = terminalTabs.find(t => t.id === terminalId);
    if (tab) {
      onConnectionClose(tab.connectionId);
    }

    // If this was the active tab, switch to another tab
    if (activeTerminalId === terminalId) {
      const remainingTabs = terminalTabs.filter(t => t.id !== terminalId);
      setActiveTerminalId(remainingTabs.length > 0 ? remainingTabs[0].id : null);
    }
  };

  const handleTerminalClose = () => {
    if (activeTerminalId) {
      handleTabClose(activeTerminalId);
    }
  };

  if (terminalTabs.length === 0) {
    return (
      <div className="terminal-manager-empty">
        <div className="empty-state">
          <h3>No Active Terminals</h3>
          <p>Connect to a server to open a terminal session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-manager">
      <div className="terminal-tabs">
        {terminalTabs.map(tab => (
          <div
            key={tab.id}
            className={`terminal-tab ${tab.id === activeTerminalId ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-title">{tab.connectionName}</span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleTabClose(tab.id);
              }}
              title="Close terminal"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="terminal-content">
        {terminalTabs.map(tab => (
          <div
            key={tab.id}
            className={`terminal-pane ${tab.id === activeTerminalId ? 'active' : 'hidden'}`}
          >
            <Terminal
              terminalId={tab.id}
              connectionName={tab.connectionName}
              onClose={handleTerminalClose}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalManager;