const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Hide macOS Dock Icon immediately on launch (before app is ready)
if (app.dock) {
    app.dock.hide();
}

// File path for persistence in user data folder
const STATE_FILE = path.join(app.getPath('userData'), 'aquabuddy_state.json');

// Core App State (All-time tracking)
let state = {
    dailyGoal: 2000,
    currentIntake: 0,
    intervalMinutes: 20,
    activeCompanion: "3", // default Leo
    streak: 0,
    lastActiveDate: "",
    history: [],          // Projected dynamically for today
    allTimeLogs: [],      // Permanent array of { date: 'YYYY-MM-DD', time: 'HH:MM AM/PM', amount: 250 }
    openAtLogin: false,
    timerRunning: true,
    secondsRemaining: 1200
};

let dashboardWindow = null;
let widgetWindow = null;
let tray = null;
let timerId = null;
app.isQuitting = false;

// Load persisted state
function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            const savedState = JSON.parse(data);
            state = { ...state, ...savedState };
        } catch (e) {
            console.error("Failed to parse state file", e);
        }
    }
    
    // For backward compatibility: migrate legacy single-day history array if exists
    if (state.history && state.history.length > 0 && (!state.allTimeLogs || state.allTimeLogs.length === 0)) {
        const legacyDate = state.lastActiveDate || getTodayDateString();
        state.allTimeLogs = state.history.map(item => ({
            date: legacyDate,
            time: item.time,
            amount: item.amount
        }));
    }
    
    const today = getTodayDateString();
    
    // Validate and evaluate daily streak maintenance
    if (state.lastActiveDate !== today) {
        checkStreakMaintenance(today);
        state.lastActiveDate = today;
    }
    
    // Project and recompute today's values
    recomputeDailyValues();
    saveState();
}

// Save state
function saveState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
        console.error("Failed to save state file", e);
    }
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Recompute current intakes, logs, and yesterday comparisons from permanent logs
function recomputeDailyValues() {
    const today = getTodayDateString();
    if (!state.allTimeLogs) state.allTimeLogs = [];
    
    // 1. Compute today's values
    const todaysLogs = state.allTimeLogs.filter(log => log.date === today);
    state.currentIntake = todaysLogs.reduce((sum, log) => sum + log.amount, 0);
    state.history = todaysLogs.map(log => ({ time: log.time, amount: log.amount }));
    
    // 2. Compute yesterday's values
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    const yesterdayLogs = state.allTimeLogs.filter(log => log.date === yesterdayStr);
    state.yesterdayIntake = yesterdayLogs.reduce((sum, log) => sum + log.amount, 0);
}

function checkStreakMaintenance(todayStr) {
    if (!state.lastActiveDate) return;
    
    const lastDate = new Date(state.lastActiveDate);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Compute yesterday's total
    const yesterdayLogs = state.allTimeLogs.filter(log => log.date === state.lastActiveDate);
    const yesterdayTotal = yesterdayLogs.reduce((sum, log) => sum + log.amount, 0);
    const goalMet = yesterdayTotal >= state.dailyGoal;
    
    if (diffDays === 1) {
        if (!goalMet) {
            state.streak = 0; // Broke streak by not meeting yesterday's goal
        }
    } else if (diffDays > 1) {
        state.streak = 0; // Reset streak due to idle days
    }
}

// Create System Tray (Menu Bar Icon)
function createTray() {
    // 16x16 transparent black water droplet PNG loaded directly from base64
    const base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAd0lEQVQ4T2NkoBAwUqifAb+Bh8F2HwMDw38G3ACRGrABAwMDo4yMDBitgCwI14BNDS5F2A3AYwCyZmxqcCnCbgAeA5A1Y1OBSxOsgAAB4CwwB9Z3TfAAAAABJRU5ErkJggg==';
    const trayIcon = nativeImage.createFromDataURL(base64Icon);
    trayIcon.setTemplateImage(true); // Automatically adapts color to macOS Dark/Light menu bar themes

    tray = new Tray(trayIcon);
    tray.setToolTip('AquaBuddy');
    
    // Left click toggles the dashboard window
    tray.on('click', () => {
        toggleDashboardWindow();
    });

    // Initialize context menu
    updateTrayMenu();
}

function toggleDashboardWindow() {
    if (!dashboardWindow || dashboardWindow.isDestroyed()) {
        createDashboardWindow();
        return;
    }

    if (dashboardWindow.isVisible()) {
        dashboardWindow.hide();
    } else {
        dashboardWindow.show();
        dashboardWindow.focus();
    }
}

function updateTrayMenu() {
    if (!tray) return;

    const isRunning = state.timerRunning;
    const minutes = Math.floor(state.secondsRemaining / 60);
    const seconds = state.secondsRemaining % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const timerLabel = isRunning 
        ? `Pause Timer (${timeStr})`
        : `Resume Timer`;

    // Display the timer directly in the macOS menu bar next to the dot icon
    const title = isRunning ? ` ${timeStr}` : ` ⏸️ ${timeStr}`;
    tray.setTitle(title);

    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Open Dashboard', 
            click: () => {
                if (dashboardWindow) {
                    dashboardWindow.show();
                    dashboardWindow.focus();
                } else {
                    createDashboardWindow();
                }
            } 
        },
        { 
            label: 'Drink Glass (250ml)', 
            click: () => {
                addWater(250);
            } 
        },
        { 
            label: timerLabel, 
            click: () => {
                if (state.timerRunning) {
                    pauseTimer();
                } else {
                    startTimer();
                }
            } 
        },
        { type: 'separator' },
        { 
            label: 'Quit', 
            click: () => {
                app.isQuitting = true;
                app.quit();
            } 
        }
    ]);

    tray.setContextMenu(contextMenu);
}

// Create Main Dashboard Window
function createDashboardWindow() {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
        dashboardWindow.show();
        return;
    }

    dashboardWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        show: false,
        title: "AquaBuddy",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    dashboardWindow.loadFile('index.html');

    dashboardWindow.once('ready-to-show', () => {
        dashboardWindow.show();
        // Sync initial state
        dashboardWindow.webContents.send('state-updated', state);
        dashboardWindow.webContents.send('timer-status', { 
            running: state.timerRunning, 
            seconds: state.secondsRemaining 
        });
    });

    // Hide instead of destroy on close to run in background (macOS style)
    dashboardWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            dashboardWindow.hide();
        }
        return false;
    });
}

// Create Floating Transparent Always-On-Top Alert Overlay
function createWidgetWindow() {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.show();
        widgetWindow.webContents.send('alert-trigger', state);
        return;
    }

    const { width, height } = screen.getPrimaryDisplay().workArea;
    const widgetWidth = 320;
    const widgetHeight = 350;
    
    const targetX = width - widgetWidth - 24;
    const startX = width; // Start off-screen to the right
    const y = height - widgetHeight - 24;

    widgetWindow = new BrowserWindow({
        width: widgetWidth,
        height: widgetHeight,
        x: startX,
        y: y,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        hasShadow: false,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    widgetWindow.loadFile('widget.html');

    widgetWindow.once('ready-to-show', () => {
        widgetWindow.show();
        // Send state to widget so it knows active companion & details
        widgetWindow.webContents.send('alert-trigger', state);
        startWalkIn(startX, targetX, y);
    });

    widgetWindow.on('closed', () => {
        stopWalking();
        widgetWindow = null;
    });
}

// Walking / Pacing animation interval for desktop overlay widget
let walkInterval = null;
function startWalkIn(startX, targetX, y) {
    if (walkInterval) clearInterval(walkInterval);
    
    let currentX = startX;
    
    // Set initial direction to face left (walking onto screen from right)
    setTimeout(() => {
        if (widgetWindow && !widgetWindow.isDestroyed()) {
            widgetWindow.webContents.send('direction-change', 'left');
        }
    }, 100);

    walkInterval = setInterval(() => {
        if (!widgetWindow || widgetWindow.isDestroyed()) {
            stopWalking();
            return;
        }
        
        currentX -= 4.5; // Walk speed moving leftwards
        
        if (currentX <= targetX) {
            currentX = targetX;
            clearInterval(walkInterval);
            walkInterval = null;
            
            // Stop character walking, display speech bubble and actions
            widgetWindow.webContents.send('walk-completed');
        }
        
        widgetWindow.setPosition(Math.round(currentX), Math.round(y));
    }, 20); // 50fps smooth walk-in
}

function stopWalking() {
    if (walkInterval) {
        clearInterval(walkInterval);
        walkInterval = null;
    }
}

// Background Timer Management
function startTimer() {
    if (timerId) clearInterval(timerId);
    state.timerRunning = true;
    saveState();
    
    broadcastToDashboard('timer-status', { running: true, seconds: state.secondsRemaining });
    updateTrayMenu();
    
    timerId = setInterval(() => {
        if (state.secondsRemaining > 0) {
            state.secondsRemaining--;
            broadcastToDashboard('timer-tick', state.secondsRemaining);
            updateTrayMenu();
        } else {
            clearInterval(timerId);
            timerId = null;
            triggerHydrationAlert();
        }
    }, 1000);
}

function pauseTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    state.timerRunning = false;
    saveState();
    broadcastToDashboard('timer-status', { running: false, seconds: state.secondsRemaining });
    updateTrayMenu();
}

function triggerHydrationAlert() {
    broadcastToDashboard('timer-status', { running: false, seconds: 0 });
    updateTrayMenu();
    createWidgetWindow();
}

function broadcastToDashboard(channel, value) {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
        dashboardWindow.webContents.send(channel, value);
    }
}

// Add water intake
function addWater(amount) {
    const today = getTodayDateString();
    
    // Check if goal was met BEFORE this drink
    const todayLogsBefore = state.allTimeLogs.filter(log => log.date === today);
    const totalBefore = todayLogsBefore.reduce((sum, log) => sum + log.amount, 0);
    const wasGoalMet = totalBefore >= state.dailyGoal;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    state.allTimeLogs.push({
        date: today,
        time: timeString,
        amount: amount
    });
    
    recomputeDailyValues();
    
    const isGoalMetNow = state.currentIntake >= state.dailyGoal;
    if (isGoalMetNow && !wasGoalMet) {
        state.streak += 1;
        broadcastToDashboard('goal-reached', state);
    }
    
    state.lastActiveDate = today;
    saveState();
    broadcastToDashboard('state-updated', state);
    updateTrayMenu();
}

// IPC Receivers/Handlers
ipcMain.handle('get-state', () => {
    return state;
});

ipcMain.on('apply-settings', (event, newSettings) => {
    state.dailyGoal = newSettings.dailyGoal;
    state.activeCompanion = newSettings.activeCompanion;
    const intervalChanged = state.intervalMinutes !== newSettings.intervalMinutes;
    state.intervalMinutes = newSettings.intervalMinutes;
    
    // Handle Auto-Start System Configuration
    state.openAtLogin = !!newSettings.openAtLogin;
    if (app.isPackaged) {
        try {
            app.setLoginItemSettings({
                openAtLogin: state.openAtLogin,
                path: app.getPath('exe')
            });
        } catch (err) {
            console.error("Failed to set login item settings", err);
        }
    } else {
        console.log("Skipping native login item settings in developer mode (not packaged). Use install_startup.sh for auto-start in development.");
    }
    
    if (intervalChanged) {
        state.secondsRemaining = state.intervalMinutes * 60;
        if (state.timerRunning) {
            startTimer();
        } else {
            broadcastToDashboard('timer-status', { running: false, seconds: state.secondsRemaining });
        }
    }
    
    recomputeDailyValues();
    saveState();
    broadcastToDashboard('state-updated', state);
    updateTrayMenu();
});

ipcMain.on('timer-toggle', () => {
    if (state.timerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

ipcMain.on('timer-reset', () => {
    state.secondsRemaining = state.intervalMinutes * 60;
    if (state.timerRunning) {
        startTimer();
    } else {
        broadcastToDashboard('timer-status', { running: false, seconds: state.secondsRemaining });
        saveState();
    }
    updateTrayMenu();
});

ipcMain.on('add-manual-water', (event, amount) => {
    addWater(amount);
});

ipcMain.on('reset-daily', () => {
    const today = getTodayDateString();
    // Strip today's logs from allTimeLogs
    state.allTimeLogs = state.allTimeLogs.filter(log => log.date !== today);
    recomputeDailyValues();
    saveState();
    broadcastToDashboard('state-updated', state);
    updateTrayMenu();
});

ipcMain.on('widget-drank', () => {
    addWater(250);
    state.secondsRemaining = state.intervalMinutes * 60;
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.close();
        widgetWindow = null;
    }
    startTimer();
});

ipcMain.on('widget-snooze', () => {
    // Snooze for 5 minutes
    state.secondsRemaining = 5 * 60;
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.close();
        widgetWindow = null;
    }
    startTimer();
});

// App Lifecycle
app.whenReady().then(() => {
    loadState();
    createTray();
    
    // Check if launched as hidden (system startup)
    const isHidden = process.argv.includes('--hidden');
    if (!isHidden) {
        createDashboardWindow();
    }
    
    if (state.timerRunning) {
        startTimer();
    } else {
        if (state.secondsRemaining === undefined || state.secondsRemaining <= 0) {
            state.secondsRemaining = state.intervalMinutes * 60;
        }
        updateTrayMenu();
    }
});

app.on('activate', () => {
    if (dashboardWindow) {
        dashboardWindow.show();
    } else {
        createDashboardWindow();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
