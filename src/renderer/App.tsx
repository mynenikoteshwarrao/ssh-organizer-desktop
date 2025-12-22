import React, { useState, useEffect } from 'react';
import { ConnectionProfile, AuthType, ActiveConnection } from '../types';
import { LogEntry } from '../logger';
import ConnectionList from './components/ConnectionList';
import ConnectionForm from './components/ConnectionForm';
import ActiveConnections from './components/ActiveConnections';
// External terminals are used - no embedded terminal manager needed
import Logger from './components/Logger';
import './styles/App.css';

interface AppState {
  connections: ConnectionProfile[];
  activeConnections: ActiveConnection[];
  selectedConnection: ConnectionProfile | null;
  showForm: boolean;
  loading: boolean;
  logs: LogEntry[];
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    connections: [],
    activeConnections: [],
    selectedConnection: null,
    showForm: false,
    loading: true,
    logs: [],
  });

  useEffect(() => {
    loadConnections();
    loadActiveConnections();
    loadLogs();

    // Subscribe to log updates
    const unsubscribe = window.electronAPI.onLogsUpdated((logs) => {
      setState(prev => ({ ...prev, logs }));
    });

    // Refresh active connections periodically
    const activeConnectionsInterval = setInterval(loadActiveConnections, 5000);

    return () => {
      unsubscribe();
      clearInterval(activeConnectionsInterval);
    };
  }, []);

  const loadLogs = async () => {
    try {
      const logs = await window.electronAPI.getLogs();
      setState(prev => ({ ...prev, logs }));
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const connections = await window.electronAPI.getConnections();
      setState(prev => ({
        ...prev,
        connections,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load connections:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadActiveConnections = async () => {
    try {
      const activeConnections = await window.electronAPI.getActiveConnections();
      setState(prev => ({ ...prev, activeConnections }));
    } catch (error) {
      console.error('Failed to load active connections:', error);
    }
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleNewConnection = () => {
    setState(prev => ({
      ...prev,
      selectedConnection: {
        id: generateUUID(),
        name: '',
        hostname: '',
        port: 22,
        username: '',
        authType: AuthType.PRIVATE_KEY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      showForm: true,
    }));
  };

  const handleEditConnection = (connection: ConnectionProfile) => {
    setState(prev => ({
      ...prev,
      selectedConnection: connection,
      showForm: true,
    }));
  };

  const handleDeleteConnection = async (id: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      const result = await window.electronAPI.deleteConnection(id);
      if (result.success) {
        await loadConnections();
      } else {
        alert(result.error || 'Failed to delete connection');
      }
    }
  };

  const handleConnect = async (id: string) => {
    const result = await window.electronAPI.connectSSH(id);
    if (!result.success) {
      alert(result.error || 'Failed to connect');
    } else {
      // Refresh active connections and show terminals after successful connection
      await loadActiveConnections();
      // External terminal launched - no UI state change needed
    }
  };

  const handleDisconnect = async (activeConnectionId: string) => {
    const result = await window.electronAPI.disconnectSSH(activeConnectionId);
    if (!result.success) {
      alert(result.error || 'Failed to disconnect');
    } else {
      // Refresh active connections after successful disconnection
      await loadActiveConnections();
    }
  };

  const handleDisconnectAll = async () => {
    if (confirm('Are you sure you want to disconnect all active connections?')) {
      const result = await window.electronAPI.disconnectAll();
      if (!result.success) {
        alert(result.error || 'Failed to disconnect all connections');
      } else {
        // Refresh active connections after successful disconnection
        await loadActiveConnections();
      }
    }
  };

  const handleSaveConnection = async (connection: ConnectionProfile) => {
    const result = await window.electronAPI.saveConnection(connection);
    if (result.success) {
      setState(prev => ({ ...prev, showForm: false, selectedConnection: null }));
      await loadConnections();
    } else {
      alert(result.error || 'Failed to save connection');
    }
  };

  const handleCloseForm = () => {
    setState(prev => ({
      ...prev,
      showForm: false,
      selectedConnection: null,
    }));
  };

  // External terminals don't need toggle - they open in system Terminal app

  const handleClearLogs = async () => {
    try {
      await window.electronAPI.clearLogs();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  if (state.loading) {
    return (
      <div className="app-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            <img src="../../assets/ssh-organizer-logo.png" alt="SSH Organizer" className="brand-icon" />
          </div>
          <div className="brand-content">
            <h1 className="brand-title">SSH Organizer</h1>
            <div className="brand-subtitle">Professional SSH Connection Management</div>
          </div>
        </div>
        <div className="header-watermark">
          Myneni
        </div>
      </div>
      <div className="app-body">
        <div className="app-sidebar">
        <div className="sidebar-header">
          <h2>SSH Connections</h2>
          <div className="sidebar-actions">
            <button className="btn btn-primary" onClick={handleNewConnection}>
              + New
            </button>
            {state.activeConnections.length > 0 && (
              <span className="external-terminal-info">
                {state.activeConnections.length} external terminal{state.activeConnections.length > 1 ? 's' : ''} active
              </span>
            )}
          </div>
        </div>
        <ConnectionList
          connections={state.connections}
          onConnect={handleConnect}
          onEdit={handleEditConnection}
          onDelete={handleDeleteConnection}
        />
        </div>

        <div className="app-main">
        {state.showForm && state.selectedConnection ? (
          <ConnectionForm
            connection={state.selectedConnection}
            onSave={handleSaveConnection}
            onCancel={handleCloseForm}
          />
        ) : (
          <div className="welcome">
            <h3>SSH Connection Manager</h3>
            <p>Select a connection from the sidebar to connect, or create a new one.</p>

            <ActiveConnections
              activeConnections={state.activeConnections}
              onDisconnect={handleDisconnect}
              onDisconnectAll={handleDisconnectAll}
            />

            {state.connections.length === 0 && (
              <div className="empty-state">
                <p>No connections configured yet.</p>
                <button className="btn btn-primary" onClick={handleNewConnection}>
                  Create Your First Connection
                </button>
              </div>
            )}

            <Logger logs={state.logs} onClear={handleClearLogs} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default App;