import React from 'react';
import { ConnectionProfile } from '../../types';

interface ConnectionListProps {
  connections: ConnectionProfile[];
  onConnect: (id: string) => void;
  onEdit: (connection: ConnectionProfile) => void;
  onDelete: (id: string) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = ({
  connections,
  onConnect,
  onEdit,
  onDelete,
}) => {
  if (connections.length === 0) {
    return (
      <div className="connection-list-empty">
        <p>No connections yet</p>
      </div>
    );
  }

  return (
    <div className="connection-list">
      {connections.map((connection) => (
        <div key={connection.id} className="connection-item">
          <div className="connection-info">
            <div className="connection-name">{connection.name}</div>
            <div className="connection-details">
              {connection.username}@{connection.hostname}:{connection.port}
            </div>
            {connection.description && (
              <div className="connection-description">{connection.description}</div>
            )}
          </div>
          <div className="connection-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onConnect(connection.id)}
              title="Connect"
            >
              Connect
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onEdit(connection)}
              title="Edit"
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(connection.id)}
              title="Delete"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionList;