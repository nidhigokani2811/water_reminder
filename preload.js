const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Invoke handlers
    getState: () => ipcRenderer.invoke('get-state'),
    
    // Command triggers
    applySettings: (settings) => ipcRenderer.send('apply-settings', settings),
    toggleTimer: () => ipcRenderer.send('timer-toggle'),
    resetTimer: () => ipcRenderer.send('timer-reset'),
    addManualWater: (amount) => ipcRenderer.send('add-manual-water', amount),
    resetDaily: () => ipcRenderer.send('reset-daily'),
    widgetDrank: () => ipcRenderer.send('widget-drank'),
    widgetSnooze: () => ipcRenderer.send('widget-snooze'),
    
    // Listeners
    onStateUpdated: (callback) => ipcRenderer.on('state-updated', (event, state) => callback(state)),
    onTimerTick: (callback) => ipcRenderer.on('timer-tick', (event, seconds) => callback(seconds)),
    onTimerStatus: (callback) => ipcRenderer.on('timer-status', (event, status) => callback(status)),
    onGoalReached: (callback) => ipcRenderer.on('goal-reached', (event, state) => callback(state)),
    onAlertTrigger: (callback) => ipcRenderer.on('alert-trigger', (event, state) => callback(state)),
    onDirectionChange: (callback) => ipcRenderer.on('direction-change', (event, direction) => callback(direction)),
    onWalkCompleted: (callback) => ipcRenderer.on('walk-completed', () => callback())
});
