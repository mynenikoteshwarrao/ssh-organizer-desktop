import React, { useState, useEffect } from 'react';

interface ConfigPaths {
  profilesFile: string;
  profilesDir: string;
}

const ConfigInfo: React.FC = () => {
  const [configPaths, setConfigPaths] = useState<ConfigPaths | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadConfigPaths();
  }, []);

  const loadConfigPaths = async () => {
    try {
      const paths = await window.electronAPI.getConfigPaths();
      setConfigPaths(paths);
    } catch (error) {
      console.error('Failed to load config paths:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback - you could enhance with a toast notification
    const button = document.activeElement as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }
  };

  const openFolder = (path: string) => {
    // Use the directory path for opening
    const dirPath = path.endsWith('.json') ? configPaths?.profilesDir : path;
    // This would need to be implemented in electron to actually open the folder
    // For now, just copy the directory path
    copyToClipboard(dirPath || '');
  };

  if (!configPaths) {
    return null;
  }

  return (
    <div className="config-info">
      <div className="config-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="config-title">📁 Configuration Files</span>
        <span className="config-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="config-content">
          <div className="config-section">
            <h4>Connection Profiles</h4>
            <div className="config-path">
              <span className="path-text">{configPaths.profilesFile}</span>
              <div className="path-actions">
                <button
                  className="btn-small"
                  onClick={() => copyToClipboard(configPaths.profilesFile)}
                  title="Copy file path"
                >
                  Copy
                </button>
                <button
                  className="btn-small"
                  onClick={() => openFolder(configPaths.profilesFile)}
                  title="Copy folder path"
                >
                  Folder
                </button>
              </div>
            </div>
            <p className="config-description">
              Contains your SSH connection profiles (hostnames, usernames, ports, etc.)
            </p>
          </div>

          <div className="config-section">
            <h4>Configuration Directory</h4>
            <div className="config-path">
              <span className="path-text">{configPaths.profilesDir}</span>
              <button
                className="btn-small"
                onClick={() => copyToClipboard(configPaths.profilesDir)}
                title="Copy directory path"
              >
                Copy
              </button>
            </div>
            <p className="config-description">
              Main configuration directory for SSH Organizer
            </p>
          </div>

          <div className="config-section">
            <h4>Credential Storage</h4>
            <div className="config-path">
              <span className="path-text">Profiles Configuration File</span>
            </div>
            <p className="config-description">
              Passwords and passphrases are stored directly in the profile configuration file for convenience.
              <br />
              <strong>⚠️ Security Note:</strong> Credentials are stored in plain text in the configuration file.
              Ensure proper file permissions and backup security.
            </p>
          </div>

          <div className="config-warning">
            <strong>⚠️ Backup Note:</strong> The configuration directory contains sensitive credentials.
            Ensure secure backup practices and proper file permissions.
          </div>
        </div>
      )}

    </div>
  );
};

export default ConfigInfo;