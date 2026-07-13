# 💧 AquaBuddy (Retro Edition)

**AquaBuddy** is a beautiful, gamified desktop companion built with Electron that helps you stay hydrated. It lives entirely in your macOS menu bar (with no Dock footprint) and features a retro pixel-art buddy that walks onto your screen to remind you to drink water!

---

## ✨ Features

- **macOS Menu Bar Integration**:
  - Drops a native water droplet icon in the status bar.
  - Features a **live countdown timer** directly in the top menu bar next to the icon (e.g. ` 19:42`).
  - **Zero Dock footprint**: Invisible in the Dock and Cmd+Tab switcher.
- **Lively Waddling Companion Alert**:
  - When the countdown finishes, the companion window spawns off-screen and **walks/waddles** (bobbing, stepping, and rocking) onto the screen.
  - Stands still once in place, plays an 8-bit sound chime, and displays custom motivational prompts.
  - Natively transparent character sprites (backgrounds processed to alpha via border-BFS flood-fill).
- **Motivation Engine**:
  - Cycles through **36 motivational messages**.
  - Dynamic prompts comparing your progress to **yesterday's water consumption** (e.g., *"Yesterday you drank 2000ml. You are at 1500ml today. Keep pushing!"*).
- **Interactive Dashboard**:
  - **Companion Tab**: Select from 5 companions (Orange Cat, Blue Hoodie Boy, Robot, Wizard Frog, Chibi Girl).
  - **Analytics Tab**: Clean, pure-CSS weekly bar chart and monthly reports calculated on-the-fly from persistent logs.
  - **Settings Tab**: Configure custom drink intervals (in minutes) and daily intake goals (in ml).
- **macOS Startup & Recovery Daemon**:
  - Autostarts on system boot in a silent, hidden state (`--hidden` flag) using a custom `launchd` LaunchAgent.
  - **KeepAlive Daemon**: Automatically restarts the app within seconds if it is terminated or crashes.

---

## 🛠️ Setup & Running

### Prerequisites

- Node.js (v18+)
- macOS (for native menu bar timers and startup plists)

### Installation

Install dependency packages:

```bash
npm install
```

### Running Locally

To run the application in development mode:

```bash
npm start
```

---

## 🚀 Configuring Startup & Auto-Restart (macOS launchd)

To make AquaBuddy start automatically when your Mac boots and restart itself if closed/crashed:

1. Make the setup script executable:
   ```bash
   chmod +x install_startup.sh
   ```
2. Run the script:
   ```bash
   ./install_startup.sh
   ```

*This registers a LaunchAgent plist named `com.aquabuddy` at `~/Library/LaunchAgents/` and loads it into your user space. To view any startup logs, check `startup_err.log` and `startup_out.log` in the project root.*

---

## 🖱️ Status Bar Operations

- **Left-Click**: Toggles the main AquaBuddy Dashboard.
- **Right-Click**: Opens a quick context menu:
  - **Open Dashboard**: Opens the dashboard settings.
  - **Log Glass (250ml)**: Quick-add water log directly from the bar.
  - **Pause/Resume Timer**: Pause/resume current session (displays active remaining minutes, e.g. *Pause Timer (12:35)*).
  - **Quit**: Safely exits the application and unloads the startup plist daemon.
