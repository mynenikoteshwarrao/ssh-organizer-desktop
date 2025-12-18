# SSH Connection Manager

A secure desktop SSH connection manager application built with Electron, TypeScript, and React.

## Features

- **Secure Storage**: Credentials stored in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **Multiple Authentication**: Support for private keys, private keys with passphrase, and username/password
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Local-Only**: No cloud sync, all data stays on your machine
- **Easy Connection Management**: Add, edit, delete, and quickly connect to SSH servers
- **Activity Logger**: Real-time activity tracking with expandable log viewer showing what's happening in the app

## Security Features

- OS-level credential storage (no plain text passwords)
- Local-only operation (no network transmission of credentials)
- Encrypted storage for connection metadata
- No session logging or credential exposure

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn
- Native build tools for your platform

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Start the application:
   ```bash
   npm start
   ```

### Development

For development with hot reload:
```bash
npm run dev
```

### Building for Distribution

```bash
npm run dist
```

## Usage

1. **Add Connection**: Click "New" to add a new SSH connection
2. **Configure Authentication**: Choose between private key or password authentication
3. **Save Credentials**: Passwords and passphrases are stored securely in your system keychain
4. **Connect**: Click "Connect" on any saved connection to launch SSH in your terminal

## Authentication Types

- **Private Key**: Use a private key file (PEM format)
- **Private Key with Passphrase**: Private key with additional passphrase protection
- **Username & Password**: Traditional username/password authentication

## File Storage

- Connection profiles: `~/.ssh-manager/profiles.json`
- Credentials: System keychain (never stored in plain text files)

## Security Notes

- Never commit the `.ssh-manager` directory to version control
- Credentials are stored using your operating system's secure credential storage
- Private key files remain where you specify them (app stores path references only)
- No network communication except for SSH connections you initiate

## Building from Source

This application uses:
- **Electron** for cross-platform desktop functionality
- **React** for the user interface
- **TypeScript** for type safety
- **Keytar** for secure credential storage
- **Webpack** for bundling the renderer process

## Supported Platforms

- macOS 10.15+
- Windows 10+
- Linux (Ubuntu 18.04+, or equivalent)

## License

MIT License - see LICENSE file for details