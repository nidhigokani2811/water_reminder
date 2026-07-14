#!/bin/bash

# AquaBuddy macOS Startup and Auto-Restart Setup Script
# This configures a LaunchAgent to run AquaBuddy on boot and auto-restart if it crashes or is closed.

PLIST_LABEL="com.aquabuddy"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/$PLIST_LABEL.plist"
APP_PATH="/Users/tsc/Desktop/water_reminder"

echo "⚙️  Configuring macOS startup & auto-restart (KeepAlive) for AquaBuddy..."

# Native Electron binary path inside node_modules
ELECTRON_BIN="$APP_PATH/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"

if [ ! -f "$ELECTRON_BIN" ]; then
    echo "❌ Error: Could not locate native Electron binary at: $ELECTRON_BIN"
    echo "Please run 'npm install' first in the project directory."
    exit 1
fi

echo "✅ Found native Electron binary at: $ELECTRON_BIN"

# Ensure LaunchAgents folder exists
mkdir -p "$PLIST_DIR"

# Write the plist file
cat <<EOF > "$PLIST_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>$ELECTRON_BIN</string>
        <string>$APP_PATH</string>
        <string>--hidden</string>
    </array>
    <key>LimitLoadToSessionType</key>
    <string>Aqua</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>$APP_PATH</string>
    <key>StandardOutPath</key>
    <string>$APP_PATH/startup_out.log</string>
    <key>StandardErrorPath</key>
    <string>$APP_PATH/startup_err.log</string>
</dict>
</plist>
EOF

# Set permissions
chmod 644 "$PLIST_FILE"

# Register the daemon
echo "🔄 Registering LaunchAgent with launchctl..."
# Unload previous configurations
launchctl unload "$PLIST_FILE" 2>/dev/null
# Load new configuration
launchctl load "$PLIST_FILE"

# Start the agent immediately under launchd management
echo "🚀 Starting AquaBuddy via launchctl..."
launchctl start "$PLIST_LABEL"

echo "🎉 Success! com.aquabuddy LaunchAgent installed and started successfully."
echo "App is now running under macOS launchctl control. Try quitting it (Cmd+Q) – it will restart automatically!"
echo "To check logs: tail -f $APP_PATH/startup_err.log"
