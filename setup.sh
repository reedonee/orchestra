#!/bin/bash
# Orchestra Setup Script for React Native Windows
# This script automates the initial setup of the Orchestra project

set -e  # Exit on any error

echo "======================================"
echo "Orchestra - React Native Windows Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Node.js version:"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in PATH"
    exit 1
fi

echo "[2/4] npm version:"
npm --version
echo ""

# Install dependencies
echo "[3/4] Installing npm dependencies..."
npm install
echo "Dependencies installed successfully!"
echo ""

# Add React Native Windows support
echo "[4/4] Adding React Native Windows support..."
echo "This will initialize the Windows platform with C++ and WinUI 3..."
npx react-native-windows-init --overwrite --language cpp --useWinUI3
echo ""

echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Open windows/Orchestra.sln in Visual Studio 2022"
echo "2. Build the solution (Ctrl+Shift+B)"
echo "3. Or run: npm run windows"
echo ""
echo "For more information, see README.md"
echo "======================================"
