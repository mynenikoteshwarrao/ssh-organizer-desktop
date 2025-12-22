# SSH Connection Manager

A secure desktop SSH connection manager application built with Electron, TypeScript, and React.

![SSH Connection Manager](assets/icon.png)

**Version**: 1.0.0
**Author**: Koteshwar Rao Myneni
**License**: MIT

## Features

- **Secure Storage**: Credentials stored in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **Multiple Authentication**: Support for private keys, private keys with passphrase, and username/password
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Local-Only**: No cloud sync, all data stays on your machine
- **Easy Connection Management**: Add, edit, delete, and quickly connect to SSH servers
- **External Terminal Integration**: Opens SSH connections in your system's terminal application
- **Professional UI**: Custom cybersecurity-themed logo and polished interface
- **Connection Tracking**: Monitor active external terminal sessions
- **Activity Logger**: Real-time activity tracking with expandable log viewer

## Security Features

- OS-level credential storage (no plain text passwords)
- Local-only operation (no network transmission of credentials)
- Encrypted storage for connection metadata
- No session logging or credential exposure

## Installation

### Quick Installation (Pre-built)

Download the latest release for your platform:

- **macOS**: `SSH Connection Manager-1.0.0.dmg` (Intel) or `SSH Connection Manager-1.0.0-arm64.dmg` (Apple Silicon)
- **Windows**: `SSH Connection Manager-1.0.0-win.zip`
- **Linux**: `SSH Connection Manager-1.0.0-arm64.AppImage`

### Development Prerequisites

- **Node.js** v18.20.3 or later
- **npm** (comes with Node.js)
- **Platform-specific build tools**:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: Visual Studio Build Tools or Visual Studio Community
  - **Linux**: `build-essential python3 git` (Ubuntu/Debian)

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd ssh-connection-manager
   npm install
   ```

2. **Rebuild native modules**:
   ```bash
   npm run postinstall
   # or manually: npx electron-rebuild
   ```

3. **Start development**:
   ```bash
   npm run dev          # Development with hot reload
   # or
   npm start            # Start built application
   ```

### Building for Distribution

#### All Platforms
```bash
npm run dist:all
```

#### Specific Platforms
```bash
npm run dist:mac     # macOS DMG and ZIP
npm run dist:win     # Windows ZIP
npm run dist:linux   # Linux AppImage
```

#### Output
All builds are created in the `build/` directory:

```
build/
├── SSH Connection Manager-1.0.0.dmg              # macOS Intel (97MB)
├── SSH Connection Manager-1.0.0-arm64.dmg        # macOS Apple Silicon (92MB)
├── SSH Connection Manager-1.0.0-mac.zip          # macOS Intel portable (94MB)
├── SSH Connection Manager-1.0.0-arm64-mac.zip    # macOS Apple Silicon portable (89MB)
├── SSH Connection Manager-1.0.0-win.zip          # Windows portable (102MB)
└── SSH Connection Manager-1.0.0-arm64.AppImage   # Linux portable (102MB)
```

## Usage

1. **Add Connection**: Click "New" to add a new SSH connection
2. **Configure Authentication**: Choose between private key or password authentication
3. **Save Credentials**: Passwords and passphrases are stored securely in your system keychain
4. **Connect**: Click "Connect" on any saved connection to launch SSH in an external terminal

### How It Works

- **External Terminal Integration**: SSH connections open in your system's default terminal:
  - **macOS**: Terminal.app
  - **Windows**: Command Prompt
  - **Linux**: gnome-terminal (or default terminal)
- **Connection Tracking**: The app monitors active external terminal sessions
- **Secure Credentials**: Private keys and passwords are handled securely without exposure

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

## Technology Stack

This application is built with:
- **Electron 28.3.3** - Cross-platform desktop framework
- **React 18.2.0** - User interface library
- **TypeScript 5.3.0** - Type-safe JavaScript
- **Webpack 5.89.0** - Module bundler
- **keytar 7.9.0** - Secure credential storage
- **node-pty 1.0.0** - Terminal/PTY functionality

## Build Configuration

### Native Modules
The application includes native modules that require platform-specific compilation:

- **keytar**: OS credential storage (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **node-pty**: Terminal functionality for external SSH connections

### ASAR Unpacking
Native modules are automatically unpacked from the ASAR archive for proper functionality:
```json
"asarUnpack": [
  "node_modules/node-pty/**/*",
  "node_modules/keytar/**/*"
]
```

### Electron Builder Configuration
```json
{
  "appId": "com.koteshwar.ssh-connection-manager",
  "productName": "SSH Connection Manager",
  "copyright": "Copyright © 2024 Koteshwar Rao Myneni",
  "mac": {
    "category": "public.app-category.developer-tools",
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },
      { "target": "zip", "arch": ["x64", "arm64"] }
    ]
  },
  "win": {
    "target": [{ "target": "zip", "arch": ["x64"] }]
  },
  "linux": {
    "target": "AppImage"
  }
}
```

## Troubleshooting Build Issues

### Native Module Rebuild
If you encounter native module errors:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run postinstall

# Force rebuild specific modules
npx electron-rebuild --only=keytar
npx electron-rebuild --only=node-pty
```

### Platform-Specific Issues

#### macOS
- **Issue**: "cannot find valid Developer ID Application identity"
- **Solution**: Normal for development builds without Apple Developer certificate

#### Windows
- **Issue**: Missing Visual Studio Build Tools
- **Solution**: Install Visual Studio Build Tools or Community Edition

#### Linux
- **Issue**: Missing dependencies
- **Solution**:
  ```bash
  sudo apt install libnss3-dev libatk-bridge2.0-dev libdrm2-dev libgtk-3-dev
  ```

## Supported Platforms

| Platform | Architecture | Format | Size | Notes |
|----------|-------------|---------|------|-------|
| **macOS** | Intel x64 | DMG, ZIP | 94-97MB | macOS 10.15+ |
| **macOS** | Apple Silicon (ARM64) | DMG, ZIP | 89-92MB | Native performance |
| **Windows** | x64 | ZIP | 102MB | Windows 10+ |
| **Linux** | ARM64 | AppImage | 102MB | Ubuntu 18.04+ or equivalent |

### Architecture Support
- **Universal macOS**: Both Intel and Apple Silicon builds
- **Windows x64**: 64-bit Windows only (32-bit deprecated due to native module issues)
- **Linux ARM64**: Optimized for modern ARM-based Linux systems

## Distribution Files

### Download Sizes
- **Smallest**: macOS Apple Silicon ZIP (89MB)
- **Largest**: Windows/Linux portable (102MB each)
- **Most Compatible**: macOS DMG installers (92-97MB)

### File Types
- **DMG**: macOS disk image installer (double-click to install)
- **ZIP**: Portable archives (extract and run directly)
- **AppImage**: Linux portable executable (chmod +x and run)

## Development Status

✅ **Feature Complete**
- External terminal SSH connections
- Secure credential management
- Cross-platform native modules
- Professional UI with custom branding
- Connection tracking and management

✅ **Production Ready**
- All platforms built and tested
- Native modules properly bundled
- Code signing prepared (certificates required for distribution)
- Comprehensive documentation

## Contributing

See [BUILD.md](BUILD.md) for detailed build instructions and development setup.

### Key Development Commands
```bash
npm run dev          # Development with hot reload
npm run build        # Create development build
npm run dist:all     # Build all platform distributions
npm run postinstall  # Rebuild native modules
```

## License

MIT License - see [LICENSE](LICENSE) file for details

**Copyright © 2024 Koteshwar Rao Myneni**