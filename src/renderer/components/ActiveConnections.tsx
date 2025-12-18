import React from 'react';
import { ActiveConnection } from '../../types';

interface ActiveConnectionsProps {
  activeConnections: ActiveConnection[];
  onDisconnect: (activeConnectionId: string) => void;
  onDisconnectAll: () => void;
}

const ActiveConnections: React.FC<ActiveConnectionsProps> = ({
  activeConnections,
  onDisconnect,
  onDisconnectAll,
}) => {
  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      connecting: 'badge-warning',
      connected: 'badge-success',
      disconnecting: 'badge-warning',
      disconnected: 'badge-secondary'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary';
  };

  if (activeConnections.length === 0) {
    return (
      <div className="active-connections-empty">
        <p>No active connections</p>
      </div>
    );
  }

  return (
    <div className="active-connections">
      <div className="active-connections-header">
        <h3>Active Connections ({activeConnections.length})</h3>
        {activeConnections.length > 1 && (
          <button
            className="btn btn-sm btn-danger"
            onClick={onDisconnectAll}
            title="Disconnect All"
          >
            Disconnect All
          </button>
        )}
      </div>

      <div className="active-connections-list">
        {activeConnections.map((connection) => (
          <div key={connection.id} className="active-connection-item">
            <div className="connection-info">
              <div className="connection-header">
                <span className="connection-name">{connection.profileName}</span>
                <span className={`badge ${getStatusBadge(connection.status)}`}>
                  {connection.status}
                </span>
              </div>
              <div className="connection-details">
                {connection.username}@{connection.hostname}:{connection.port}
              </div>
              <div className="connection-meta">
                <span className="connection-duration">
                  Duration: {formatDuration(connection.startTime)}
                </span>
                <span className="connection-start-time">
                  Started: {new Date(connection.startTime).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="connection-actions">
              <button
                className="btn btn-sm btn-danger"
                onClick={() => onDisconnect(connection.id)}
                disabled={connection.status === 'disconnecting' || connection.status === 'disconnected'}
                title="Disconnect"
              >
                {connection.status === 'disconnecting' ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveConnections;