#!/bin/bash

# 🚀 GitHub Actions Toolkit Development Setup
# Container ID: 7d68f86e5dee

echo "🔥 Setting up development environment..."

# Set locale properly
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# Show environment info
echo "📦 Environment:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Python: $(python3 --version)"
echo "  Git: $(git --version)"
echo "  Container: $(hostname)"
echo "  Locale: $LC_ALL"

# Check project status
echo ""
echo "📋 Project Status:"
echo "  Directory: $(pwd)"
echo "  Git branch: $(git branch --show-current)"
echo "  Git status: $(git status --porcelain | wc -l) files changed"

# Available commands
echo ""
echo "🛠️  Available Commands:"
echo "  npm run build     - Compile TypeScript"
echo "  npm run test      - Run tests"
echo "  npm run lint      - Check code style"
echo "  npm run format    - Format code"
echo "  npm run bootstrap - Install dependencies"

echo ""
echo "✅ Development environment ready!"
echo "💡 Type 'help' for more commands"
