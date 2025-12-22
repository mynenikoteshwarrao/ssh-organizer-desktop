# Publishing SSH Organizer to npmjs

This guide provides step-by-step instructions for publishing SSH Organizer as free software on npmjs.

## 📋 Prerequisites

### Required Accounts
1. **npmjs Account**: Create a free account at [npmjs.com](https://www.npmjs.com/signup)
2. **GitHub Account**: For source code hosting (recommended)

### Required Software
- **Node.js** (v18.0.0 or later)
- **npm** (v8.0.0 or later)
- **Git** (for version control)

## 🚀 Publishing Steps

### 1. Setup npm Account

```bash
# Login to npm (if not already logged in)
npm login

# Verify your login
npm whoami
```

### 2. Prepare for Publishing

```bash
# Build the application
npm run build

# Run quality checks
npm run lint
npm run typecheck

# Test the package locally (optional)
npm pack
```

### 3. Publish to npmjs

```bash
# Publish to npm registry
npm publish

# For scoped packages (if using organization)
npm publish --access public
```

### 4. Verify Publication

```bash
# Check if package is published
npm view ssh-organizer-desktop

# Install globally to test
npm install -g ssh-organizer-desktop
```

## 📦 Package Details

### Package Information
- **Package Name**: `ssh-organizer-desktop`
- **Current Version**: `1.0.0`
- **License**: MIT (Free Software)
- **Author**: Koteshwar Rao Myneni

### Installation for Users
```bash
# Global installation (recommended)
npm install -g ssh-organizer-desktop

# Local installation
npm install ssh-organizer-desktop

# Using npx (no installation required)
npx ssh-organizer-desktop
```

### Usage After Installation
```bash
# Start the application
ssh-organizer-desktop

# Or if installed locally
npx ssh-organizer-desktop
```

## 🔄 Version Management

### Updating the Package
```bash
# Update version (patch/minor/major)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.1 -> 1.1.0
npm version major  # 1.1.0 -> 2.0.0

# Publish updated version
npm publish
```

### Semantic Versioning Guidelines
- **PATCH** (x.x.X): Bug fixes, small improvements
- **MINOR** (x.X.x): New features, backwards compatible
- **MAJOR** (X.x.x): Breaking changes, major updates

## 📚 Repository Setup (Recommended)

### 1. Create GitHub Repository
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: SSH Organizer v1.0.0"

# Add remote repository
git remote add origin https://github.com/koteshwar-myneni/ssh-organizer-desktop.git
git branch -M main
git push -u origin main
```

### 2. Repository Structure
```
ssh-organizer-desktop/
├── src/                    # Source code
├── dist/                   # Compiled code
├── assets/                 # Icons and resources
├── package.json           # Package configuration
├── README.md              # Main documentation
├── BUILD.md               # Build instructions
├── PUBLISHING.md          # This file
├── LICENSE                # MIT License
├── .npmignore            # Files to exclude from npm package
└── .gitignore            # Files to exclude from git
```

## 🛡️ Security and Best Practices

### Pre-publication Checklist
- ✅ All sensitive data removed from code
- ✅ No hardcoded credentials or API keys
- ✅ MIT License properly configured
- ✅ Dependencies are up-to-date and secure
- ✅ Code is linted and type-checked
- ✅ README.md is comprehensive
- ✅ Version number is appropriate

### Security Considerations
- Never include private keys or credentials in the package
- Use `.npmignore` to exclude sensitive files
- Regularly update dependencies for security patches
- Consider using `npm audit` to check for vulnerabilities

## 📊 Package Statistics

### Expected Package Size
- **Packed Size**: ~50-100 MB (includes Electron runtime)
- **Dependencies**: 15+ packages (React, Electron, security libs)
- **Supported Platforms**: macOS, Windows, Linux

### Download Instructions for Users
```bash
# Quick start for end users
npm install -g ssh-organizer-desktop
ssh-organizer-desktop
```

## 🔧 Troubleshooting

### Common Publishing Issues

#### 1. Package Name Already Exists
```bash
# Check if name is available
npm view ssh-organizer-desktop

# If taken, choose a different name in package.json
"name": "ssh-organizer-myneni"
```

#### 2. Authentication Issues
```bash
# Re-authenticate with npm
npm logout
npm login
```

#### 3. Permission Issues
```bash
# Use public access for scoped packages
npm publish --access public
```

### Build Issues
```bash
# Clean build
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📈 Post-Publication

### Monitoring and Maintenance
1. **Monitor Downloads**: Check npm stats regularly
2. **Update Dependencies**: Keep packages current
3. **Handle Issues**: Respond to GitHub issues and npm feedback
4. **Version Updates**: Release updates as needed

### Promoting Your Package
1. **Documentation**: Maintain comprehensive README
2. **GitHub**: Use proper tags and releases
3. **Community**: Share in relevant developer communities
4. **Social Media**: Announce releases and features

## 📞 Support

### For Publishing Issues
- **npmjs Support**: [npm Support](https://www.npmjs.com/support)
- **Documentation**: [npm Docs](https://docs.npmjs.com/)

### For Technical Issues
- **GitHub Issues**: Create issues in your repository
- **Email**: Contact author at koteshwar.myneni@gmail.com

---

## 🎉 Success!

Once published, your SSH Organizer will be available to developers worldwide as free software! Users can install it globally and use it for secure SSH connection management.

**Package URL**: https://www.npmjs.com/package/ssh-organizer-desktop
**Author**: Koteshwar Rao Myneni
**License**: MIT (Free Software)