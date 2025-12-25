import React, { useState } from 'react';
import { ConnectionProfile, AuthType } from '../../types';

interface ConnectionFormProps {
  connection: ConnectionProfile;
  onSave: (connection: ConnectionProfile) => void;
  onCancel: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  connection: initialConnection,
  onSave,
  onCancel,
}) => {
  const [connection, setConnection] = useState<ConnectionProfile>(initialConnection);
  const [credentials, setCredentials] = useState({
    password: initialConnection.password || '',
    privateKeyPassphrase: initialConnection.privateKeyPassphrase || '',
  });
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const isNewConnection = !connection.createdAt || connection.createdAt === connection.updatedAt;

  const handleInputChange = (field: keyof ConnectionProfile, value: any) => {
    setConnection(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleCredentialChange = (field: keyof typeof credentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleAuthTypeChange = (authType: AuthType) => {
    setConnection(prev => ({
      ...prev,
      authType,
      privateKeyPath: authType === AuthType.PASSWORD ? undefined : prev.privateKeyPath,
    }));
    setCredentials({ password: '', privateKeyPassphrase: '' });
  };

  const handleSelectPrivateKey = async () => {
    // In a real implementation, you'd use a file picker dialog
    // For now, user needs to enter the path manually
    const path = prompt('Enter the path to your private key file:');
    if (path) {
      setConnection(prev => ({ ...prev, privateKeyPath: path }));
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await window.electronAPI.testConnection(connection);
      alert(result.success ? 'Connection test successful!' : result.error);
    } catch (error) {
      alert('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!connection.name.trim()) {
      alert('Please enter a connection name');
      return;
    }
    if (!connection.hostname.trim()) {
      alert('Please enter a hostname');
      return;
    }
    if (!connection.username.trim()) {
      alert('Please enter a username');
      return;
    }

    if (connection.authType !== AuthType.PASSWORD && !connection.privateKeyPath) {
      alert('Please select a private key file');
      return;
    }

    // Save passwords directly in the profile
    const updatedConnection = { ...connection };

    if (connection.authType === AuthType.PASSWORD) {
      if (!credentials.password && isNewConnection) {
        alert('Password is required for new connections');
        return;
      }
      updatedConnection.password = credentials.password;
    }

    if (connection.authType === AuthType.PRIVATE_KEY_WITH_PASSWORD) {
      updatedConnection.privateKeyPassphrase = credentials.privateKeyPassphrase;
    }

    onSave(updatedConnection);
  };

  const needsPassword = connection.authType === AuthType.PASSWORD;
  const needsPrivateKey = connection.authType === AuthType.PRIVATE_KEY || connection.authType === AuthType.PRIVATE_KEY_WITH_PASSWORD;
  const needsPassphrase = connection.authType === AuthType.PRIVATE_KEY_WITH_PASSWORD;

  return (
    <div className="connection-form">
      <div className="form-header">
        <h3>{isNewConnection ? 'New Connection' : 'Edit Connection'}</h3>
      </div>

      <div className="form-content">
        <div className="form-group">
          <label>Connection Name</label>
          <input
            type="text"
            value={connection.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="My Server"
          />
        </div>

        <div className="form-group">
          <label>Hostname</label>
          <input
            type="text"
            value={connection.hostname}
            onChange={(e) => handleInputChange('hostname', e.target.value)}
            placeholder="server.example.com or 192.168.1.100"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={connection.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="ubuntu"
            />
          </div>

          <div className="form-group">
            <label>Port</label>
            <input
              type="number"
              value={connection.port}
              onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 22)}
              min="1"
              max="65535"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Authentication Type</label>
          <select
            value={connection.authType}
            onChange={(e) => handleAuthTypeChange(e.target.value as AuthType)}
          >
            <option value={AuthType.PRIVATE_KEY}>Private Key</option>
            <option value={AuthType.PRIVATE_KEY_WITH_PASSWORD}>Private Key with Passphrase</option>
            <option value={AuthType.PASSWORD}>Username & Password</option>
          </select>
        </div>

        {needsPrivateKey && (
          <div className="form-group">
            <label>Private Key File</label>
            <div className="file-input-group">
              <input
                type="text"
                value={connection.privateKeyPath || ''}
                onChange={(e) => handleInputChange('privateKeyPath', e.target.value)}
                placeholder="/path/to/private/key.pem"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSelectPrivateKey}
              >
                Browse
              </button>
            </div>
          </div>
        )}

        {needsPassword && (
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-group">
              <input
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={(e) => handleCredentialChange('password', e.target.value)}
                placeholder={isNewConnection ? "Enter password" : "Enter password"}
              />
              <button
                type="button"
                className="btn btn-secondary password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <small>
              Password will be stored in the profile configuration file.
            </small>
          </div>
        )}

        {needsPassphrase && (
          <div className="form-group">
            <label>Private Key Passphrase</label>
            <div className="password-input-group">
              <input
                type={showPassphrase ? "text" : "password"}
                value={credentials.privateKeyPassphrase}
                onChange={(e) => handleCredentialChange('privateKeyPassphrase', e.target.value)}
                placeholder="Enter passphrase (leave blank if none)"
              />
              <button
                type="button"
                className="btn btn-secondary password-toggle"
                onClick={() => setShowPassphrase(!showPassphrase)}
              >
                {showPassphrase ? "Hide" : "Show"}
              </button>
            </div>
            <small>
              Passphrase will be stored in the profile configuration file.
            </small>
          </div>
        )}

        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            value={connection.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Optional description for this connection"
            rows={3}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn-secondary"
          onClick={handleTestConnection}
          disabled={testing || !connection.hostname || !connection.username}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <div className="form-actions-right">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm;