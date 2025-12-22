# SSH Connection Manager - Build Instructions

## 📋 Prerequisites

### Required Software
- **Node.js** (v18.20.3 or later)
- **npm** (comes with Node.js)
- **Git** (for cloning repository)

### Platform-specific Requirements

#### macOS
- **Xcode Command Line Tools**: `xcode-select --install`
- **Python 3**: Usually included with macOS
- **Build tools**: Automatically installed with Xcode CLI tools

#### Windows
- **Visual Studio Build Tools** or **Visual Studio Community**
- **Python 3**: Download from python.org
- **Windows SDK**: Latest version

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install build-essential python3 python3-pip git
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd ssh-connection-manager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Rebuild Native Modules
```bash
npm run postinstall
# or manually:
npx electron-rebuild
```

### 4. Development Mode
```bash
npm run dev
# or
npm start
```

## 🔧 Build Commands

### Development Build
```bash
npm run build
```
Creates development build in `dist/` directory.

### Platform-Specific Builds

#### macOS Only
```bash
npm run dist:mac
```
Creates:
- `SSH Connection Manager-1.0.0.dmg` (Intel x64)
- `SSH Connection Manager-1.0.0-arm64.dmg` (Apple Silicon)
- `SSH Connection Manager-1.0.0-mac.zip` (Intel x64 portable)
- `SSH Connection Manager-1.0.0-arm64-mac.zip` (Apple Silicon portable)

#### Windows Only
```bash
npm run dist:win
```
Creates:
- `SSH Connection Manager-1.0.0-win.zip` (Windows x64 portable)

#### Linux Only
```bash
npm run dist:linux
```
Creates:
- `SSH Connection Manager-1.0.0-arm64.AppImage` (Linux ARM64 portable)

### All Platforms
```bash
npm run dist:all
```
Builds for all supported platforms simultaneously.

## 📁 Build Output

All build artifacts are created in the `build/` directory:

```
build/
├── SSH Connection Manager-1.0.0.dmg              # macOS Intel installer
├── SSH Connection Manager-1.0.0-arm64.dmg        # macOS Apple Silicon installer
├── SSH Connection Manager-1.0.0-mac.zip          # macOS Intel portable
├── SSH Connection Manager-1.0.0-arm64-mac.zip    # macOS Apple Silicon portable
├── SSH Connection Manager-1.0.0-win.zip          # Windows portable
├── SSH Connection Manager-1.0.0-arm64.AppImage   # Linux portable
├── mac/                                           # macOS unpacked app
├── mac-arm64/                                     # macOS ARM64 unpacked app
├── win-unpacked/                                  # Windows unpacked app
└── linux-arm64-unpacked/                         # Linux unpacked app
```

## ⚙️ Build Configuration

### electron-builder Configuration
Located in `package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.koteshwar.ssh-connection-manager",
    "productName": "SSH Connection Manager",
    "copyright": "Copyright © 2024 Koteshwar Rao Myneni",
    "directories": {
      "output": "build"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "!node_modules/.cache"
    ],
    "asarUnpack": [
      "node_modules/node-pty/**/*",
      "node_modules/keytar/**/*"
    ]
  }
}
```

### Platform-Specific Settings

#### macOS (`mac`)
- **Category**: Developer Tools
- **Targets**: DMG, ZIP
- **Architectures**: x64, arm64
- **Code Signing**: Disabled (development)
- **Dark Mode**: Supported
- **Hardened Runtime**: Enabled

#### Windows (`win`)
- **Targets**: ZIP
- **Architectures**: x64
- **Icon**: Custom ICO format
- **Publisher**: SSH Connection Manager

#### Linux (`linux`)
- **Target**: AppImage
- **Architecture**: arm64
- **Icon**: Custom PNG format

## 🔨 Native Modules

### Included Native Dependencies
- **keytar**: Secure password/credential storage
- **node-pty**: Terminal/PTY functionality

### Rebuilding Native Modules
Native modules must be rebuilt for Electron:

```bash
# Automatic rebuild (recommended)
npm run postinstall

# Manual rebuild
npx electron-rebuild

# Force rebuild specific module
npx electron-rebuild --only=keytar
npx electron-rebuild --only=node-pty
```

### ASAR Unpacking
Native modules are automatically unpacked from the ASAR archive:
- `node_modules/node-pty/**/*`
- `node_modules/keytar/**/*`

## 🐛 Troubleshooting

### Common Issues

#### Native Module Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run postinstall
```

#### macOS Code Signing Warnings
- **Issue**: "cannot find valid Developer ID Application identity"
- **Solution**: Normal for development builds without Apple Developer certificate
- **Impact**: App works but shows as unidentified developer

#### Windows Build Issues
- **Issue**: Missing Visual Studio Build Tools
- **Solution**: Install Visual Studio Build Tools or Community Edition
- **Alternative**: Use Windows Subsystem for Linux (WSL)

#### Linux Dependencies
```bash
# Ubuntu/Debian missing dependencies
sudo apt install libnss3-dev libatk-bridge2.0-dev libdrm2-dev libgtk-3-dev
```

### Architecture Issues

#### Apple Silicon (M1/M2) Macs
- Use ARM64 builds for best performance
- Intel builds work via Rosetta 2
- Native modules automatically built for correct architecture

#### Windows 32-bit (i386)
- Currently not supported due to node-pty compilation issues
- Use 64-bit Windows builds

## 📊 Build Statistics

### Typical Build Sizes
- **macOS DMG**: ~92-97 MB
- **macOS ZIP**: ~89-94 MB
- **Windows ZIP**: ~102 MB
- **Linux AppImage**: ~102 MB

### Build Times (Approximate)
- **Development build**: 30-60 seconds
- **Single platform**: 2-5 minutes
- **All platforms**: 10-15 minutes

## 🔍 Development Workflow

### 1. Development
```bash
npm run dev          # Watch mode with hot reload
npm start           # Start built application
```

### 2. Testing
```bash
npm run lint        # Code linting
npm run typecheck   # TypeScript type checking
```

### 3. Building
```bash
npm run build       # Create development build
npm run dist:mac    # Create production macOS build
```

### 4. Distribution
- Upload build artifacts from `build/` directory
- DMG files for macOS App Store or direct distribution
- ZIP files for portable installations
- AppImage for Linux distribution

## 📝 Build Script Details

### Available Scripts
```json
{
  "scripts": {
    "build": "tsc && npm run build:renderer",
    "build:renderer": "webpack --config webpack.config.js --mode=production",
    "dev": "concurrently \"tsc --watch\" \"webpack --config webpack.config.js --mode=development --watch\" \"wait-on dist/main.js && electron .\"",
    "start": "electron .",
    "pack": "electron-builder",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux",
    "dist:all": "npm run build && electron-builder --mac --win --linux",
    "postinstall": "electron-builder install-app-deps"
  }
}
```

## 🎯 Production Deployment

### Code Signing (Optional)
For production distribution, consider code signing:

#### macOS
1. Obtain Apple Developer certificate
2. Update `package.json` with certificate details
3. Enable `hardenedRuntime` and proper entitlements

#### Windows
1. Obtain code signing certificate
2. Configure `win.certificateFile` and `win.certificatePassword`

### Distribution Channels
- **Direct Download**: Host ZIP/DMG files
- **Mac App Store**: Use `mas` target
- **Microsoft Store**: Use `appx` target
- **Auto-Updates**: Configure update servers

---

## 📞 Support

For build issues or questions:
1. Check this documentation
2. Review GitHub issues
3. Ensure all prerequisites are installed
4. Try rebuilding native modules

**Author**: Koteshwar Rao Myneni
**License**: MIT