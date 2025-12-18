import React, { useState, useEffect } from 'react';
import { LogEntry } from '../../logger';

interface LoggerProps {
  logs: LogEntry[];
  onClear: () => void;
}

const Logger: React.FC<LoggerProps> = ({ logs, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="logger">
      <div className="logger-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="logger-title">
          <span>Activity Log</span>
          <span className="log-count">({logs.length})</span>
        </div>
        <div className="logger-controls">
          {logs.length > 0 && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              Clear
            </button>
          )}
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="logger-content">
          {logs.length === 0 ? (
            <div className="no-logs">
              <span>No activity yet</span>
            </div>
          ) : (
            <div className="logs-list">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`log-entry log-${log.level}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-main">
                    <span className="log-icon">{getLogIcon(log.level)}</span>
                    <span className="log-time">{log.timestamp}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                  {log.details && selectedLog?.id === log.id && (
                    <div className="log-details">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logger;