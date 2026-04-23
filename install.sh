#!/bin/bash

# Ensure script stops on errors
set -e

echo "==============================================="
echo " Installing LEAP Options Analyzer..."
echo "==============================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check requirements
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed. Please install Python 3."
    exit 1
fi

echo ""
echo "-> Setting up Frontend..."
cd "$PROJECT_DIR/frontend"
npm install

echo ""
echo "-> Setting up Backend..."
cd "$PROJECT_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate

echo ""
echo "-> Installing Macro in Shell Config..."

SHELL_RC="$HOME/.bashrc"
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
fi

# Make the leaps script executable
chmod +x "$PROJECT_DIR/leaps"

if grep -q "leaps() {" "$SHELL_RC"; then
    echo "Macro 'leaps' already exists in $SHELL_RC"
else
    echo "" >> "$SHELL_RC"
    echo "# === LEAP Options Analyzer Macro ===" >> "$SHELL_RC"
    echo "leaps() {" >> "$SHELL_RC"
    echo "  \"$PROJECT_DIR/leaps\"" >> "$SHELL_RC"
    echo "  exit" >> "$SHELL_RC"
    echo "}" >> "$SHELL_RC"
    echo "Added leaps macro to $SHELL_RC"
fi

echo ""
echo "==============================================="
echo " Installation Complete!"
echo " Please run: source $SHELL_RC"
echo " Or open a new terminal and type 'leaps' to run the app."
echo "==============================================="
