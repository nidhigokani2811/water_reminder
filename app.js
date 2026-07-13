// AquaBuddy Dashboard Renderer Process Logic

let state = {
    dailyGoal: 2000,
    currentIntake: 0,
    intervalMinutes: 20,
    activeCompanion: "3",
    streak: 0,
    history: [],
    allTimeLogs: [],
    yesterdayIntake: 0,
    openAtLogin: false
};

// DOM Elements - General
const timerDisplay = document.getElementById("timer-display");
const timerRingFill = document.getElementById("timer-ring-fill");
const timerStatus = document.getElementById("timer-status");
const playPauseBtn = document.getElementById("timer-play-pause-btn");
const resetTimerBtn = document.getElementById("timer-reset-btn");

const totalIntakeDisplay = document.getElementById("total-intake");
const targetDisplay = document.getElementById("target-display");
const progressFill = document.getElementById("progress-fill");
const glassesGrid = document.getElementById("glasses-grid");
const addGlassBtn = document.getElementById("add-glass-btn");
const resetDailyBtn = document.getElementById("reset-daily-btn");
const streakDisplay = document.getElementById("streak-count");
const historyList = document.getElementById("history-list");

// DOM Elements - Settings
const companionSelect = document.getElementById("companion-select");
const intervalInput = document.getElementById("interval-input");
const goalInput = document.getElementById("goal-input");
const startupCheckbox = document.getElementById("startup-checkbox");
const saveSettingsBtn = document.getElementById("save-settings-btn");

// DOM Elements - Notifications
const notifBtn = document.getElementById("notification-toggle");
const notifBtnText = document.getElementById("notif-btn-text");

// DOM Elements - Nudge & Analytics
const dailyNudgeText = document.getElementById("daily-nudge-text");
const todayValReport = document.getElementById("today-val-report");
const yesterdayValReport = document.getElementById("yesterday-val-report");
const comparisonAnalysis = document.getElementById("comparison-analysis");
const weeklyBarChart = document.getElementById("weekly-bar-chart");
const monthlyAverage = document.getElementById("monthly-average");
const monthlyCompletion = document.getElementById("monthly-completion");
const monthlyEvents = document.getElementById("monthly-events");
const monthlyLogList = document.getElementById("monthly-log-list");

// SVG Glass Icon
const GLASS_SVG = `
    <svg class="glass-icon" width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3 L5 25 C5 26.1 5.9 27 7 27 L17 27 C18.1 27 19 26.1 19 25 L21 3" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
        <path d="M4.5 9 L19.5 9" stroke="#60a5fa" stroke-width="2"/>
        <path d="M5.5 19 L18.5 19" stroke="#60a5fa" stroke-width="1" stroke-dasharray="2,2"/>
        <path d="M5.2 11 L18.8 11 L17.5 25 L6.5 25 Z" fill="#60a5fa" opacity="0.6"/>
    </svg>
`;

const RING_RADIUS = 95;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
timerRingFill.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;

// Audio Context
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSuccessChime() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    const notes = [523.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    const noteLength = 0.05;
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * noteLength);
        gain.gain.setValueAtTime(0.15, now + idx * noteLength);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * noteLength + (noteLength * 2));
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * noteLength);
        osc.stop(now + idx * (noteLength * 1.5));
    });
}

// Render Dashboard Data
function updateProgressUI() {
    totalIntakeDisplay.textContent = state.currentIntake;
    targetDisplay.textContent = state.dailyGoal;
    
    const percentage = Math.min((state.currentIntake / state.dailyGoal) * 100, 100);
    progressFill.style.width = `${percentage}%`;
    
    streakDisplay.textContent = state.streak;
    
    // Draw Glass Icons
    const numGlasses = Math.floor(state.currentIntake / 250);
    glassesGrid.innerHTML = "";
    
    if (numGlasses === 0) {
        glassesGrid.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">No glasses yet today. Let's start!</span>`;
    } else {
        for (let i = 0; i < Math.min(numGlasses, 16); i++) {
            const glassContainer = document.createElement("div");
            glassContainer.innerHTML = GLASS_SVG.trim();
            glassesGrid.appendChild(glassContainer.firstChild);
        }
        if (numGlasses > 16) {
            const extra = document.createElement("span");
            extra.textContent = `+${numGlasses - 16} more`;
            extra.style.fontSize = "0.85rem";
            extra.style.color = "var(--secondary-color)";
            extra.style.fontWeight = "bold";
            glassesGrid.appendChild(extra);
        }
    }
    
    // Sync Settings Form elements
    intervalInput.value = state.intervalMinutes;
    goalInput.value = state.dailyGoal;
    companionSelect.value = state.activeCompanion;
    startupCheckbox.checked = !!state.openAtLogin;
    
    // Render History Logs
    renderHistory();
    
    // Render Gamified Nudges and Analytics Tab
    renderNudgesAndAnalytics();
}

function renderHistory() {
    historyList.innerHTML = "";
    if (!state.history || state.history.length === 0) {
        historyList.innerHTML = `<li class="history-empty">No water logs for today yet. Keep drinking!</li>`;
        return;
    }
    
    const reversedHistory = [...state.history].reverse();
    reversedHistory.forEach(log => {
        const li = document.createElement("li");
        li.className = "history-item";
        li.innerHTML = `
            <span class="time">⏰ ${log.time}</span>
            <span class="details">+${log.amount} ml Drank</span>
        `;
        historyList.appendChild(li);
    });
}

function updateTimerRing(percent) {
    const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;
    timerRingFill.style.strokeDashoffset = offset;
}

function renderTimerText(secondsRemaining) {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Render Gamified Hydration Nudges & CSS Charts
function renderNudgesAndAnalytics() {
    const todayIntake = state.currentIntake;
    const yesterdayIntake = state.yesterdayIntake || 0;
    
    // 1. Daily Nudge Box & Analytics Card
    todayValReport.textContent = `${todayIntake} ml`;
    yesterdayValReport.textContent = `${yesterdayIntake} ml`;
    
    if (yesterdayIntake > 0) {
        if (todayIntake < yesterdayIntake) {
            const diff = yesterdayIntake - todayIntake;
            dailyNudgeText.textContent = `Yesterday you drank ${yesterdayIntake}ml. You need ${diff}ml more today to beat yesterday's score! 🚀`;
            comparisonAnalysis.textContent = `You are ${diff}ml behind yesterday's progress. Let's take a sip to catch up! 🥤`;
        } else {
            const excess = todayIntake - yesterdayIntake;
            dailyNudgeText.textContent = `Awesome! You beat yesterday's score by ${excess}ml! Keep it up! 🏆`;
            comparisonAnalysis.textContent = `Legendary! You matched yesterday's score and exceeded it by ${excess}ml! Hydration master status unlocked. 👑`;
        }
    } else {
        dailyNudgeText.textContent = `Daily target: ${state.dailyGoal}ml. Build your hydration streak today! 🌊`;
        comparisonAnalysis.textContent = `No recorded logs for yesterday. Use today to set a solid baseline hydration record!`;
    }
    
    // 2. Render Weekly Bar Chart (last 7 days)
    renderWeeklyChart();
    
    // 3. Render Monthly Analytics Summary
    renderMonthlySummary();
}

// Generate weekly chart using pure CSS
function renderWeeklyChart() {
    weeklyBarChart.innerHTML = "";
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Compute last 7 dates
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayName = weekdayNames[d.getDay()];
        
        // Sum intake for this date
        const dayLogs = (state.allTimeLogs || []).filter(log => log.date === dateStr);
        const total = dayLogs.reduce((sum, log) => sum + log.amount, 0);
        
        data.push({ dayName, total });
    }
    
    // Scale mapping based on max intake or goal
    const maxVal = Math.max(...data.map(d => d.total), state.dailyGoal, 1000);
    
    data.forEach(item => {
        const percent = (item.total / maxVal) * 100;
        
        const wrapper = document.createElement("div");
        wrapper.className = "chart-bar-wrapper";
        
        wrapper.innerHTML = `
            <div class="chart-bar-value">${item.total} ml</div>
            <div class="chart-bar" style="height: ${Math.max(percent, 4)}%"></div>
            <div class="chart-label" style="margin-top: 6px;">${item.dayName}</div>
        `;
        
        weeklyBarChart.appendChild(wrapper);
    });
}

// Generate Monthly Metrics & scroll list (last 30 days)
function renderMonthlySummary() {
    const logs = state.allTimeLogs || [];
    
    // Filter logs for the last 30 calendar days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Group logs by date
    const dailyTotals = {};
    let drinkEventsCount = 0;
    
    logs.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate >= thirtyDaysAgo) {
            dailyTotals[log.date] = (dailyTotals[log.date] || 0) + log.amount;
            drinkEventsCount++;
        }
    });
    
    // Calculate averages & goal completion rates
    const dates = Object.keys(dailyTotals);
    const numActiveDays = dates.length || 1;
    const totalVolume = Object.values(dailyTotals).reduce((sum, val) => sum + val, 0);
    const averageIntake = Math.round(totalVolume / numActiveDays);
    
    const goalsCompleted = Object.values(dailyTotals).filter(total => total >= state.dailyGoal).length;
    const completionRate = Math.round((goalsCompleted / numActiveDays) * 100);
    
    // Render summaries
    monthlyAverage.textContent = `${averageIntake} ml`;
    monthlyCompletion.textContent = `${completionRate}%`;
    monthlyEvents.textContent = drinkEventsCount;
    
    // Render last 30 days log list
    monthlyLogList.innerHTML = "";
    
    // Generate dates list descending
    const dateList = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const dayLogs = logs.filter(log => log.date === dateStr);
        if (dayLogs.length > 0) {
            const total = dayLogs.reduce((sum, log) => sum + log.amount, 0);
            dateList.push({
                dateStr: dateStr,
                displayDate: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                total: total
            });
        }
    }
    
    if (dateList.length === 0) {
        monthlyLogList.innerHTML = `<div class="history-empty">No logged history found yet.</div>`;
        return;
    }
    
    dateList.forEach(day => {
        const metGoal = day.total >= state.dailyGoal;
        const item = document.createElement("div");
        item.className = "monthly-log-item";
        item.innerHTML = `
            <span class="date">📅 ${day.displayDate}</span>
            <span class="amount-badge ${metGoal ? 'met' : 'unmet'}">${day.total} ml (${metGoal ? 'Goal Met' : 'Unmet'})</span>
        `;
        monthlyLogList.appendChild(item);
    });
}

// Request and Update Notification permissions
function updateNotificationBtn() {
    if (!('Notification' in window)) {
        notifBtn.style.display = 'none';
        return;
    }
    
    if (Notification.permission === 'granted') {
        notifBtnText.textContent = "Notifications Enabled";
        notifBtn.classList.remove("btn-secondary");
        notifBtn.classList.add("btn-outline");
        notifBtn.disabled = true;
    } else if (Notification.permission === 'denied') {
        notifBtnText.textContent = "Notifications Blocked";
        notifBtn.disabled = true;
    }
}

// IPC communication triggers
if (window.api) {
    window.api.onStateUpdated((updatedState) => {
        state = updatedState;
        updateProgressUI();
    });
    
    window.api.onTimerTick((seconds) => {
        renderTimerText(seconds);
        const totalIntervalSeconds = state.intervalMinutes * 60;
        const percentRemaining = (seconds / totalIntervalSeconds) * 100;
        updateTimerRing(percentRemaining);
    });
    
    window.api.onTimerStatus((status) => {
        renderTimerText(status.seconds);
        const totalIntervalSeconds = state.intervalMinutes * 60;
        const percentRemaining = (status.seconds / totalIntervalSeconds) * 100;
        updateTimerRing(percentRemaining);
        
        if (status.running) {
            timerStatus.textContent = "Counting Down";
            playPauseBtn.textContent = "Pause Timer";
            playPauseBtn.classList.remove("btn-outline");
            playPauseBtn.classList.add("btn-primary");
        } else {
            timerStatus.textContent = "Paused";
            playPauseBtn.textContent = "Resume Timer";
            playPauseBtn.classList.remove("btn-primary");
            playPauseBtn.classList.add("btn-outline");
        }
    });
    
    window.api.onGoalReached((updatedState) => {
        state = updatedState;
        updateProgressUI();
        playSuccessChime();
    });
}

// Tab Switching Controls
function setupTabNavigation() {
    const tabs = document.querySelectorAll(".nav-tab");
    const panels = document.querySelectorAll(".tab-panel");
    
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-tab");
            
            // Toggle tabs
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            // Toggle panels
            panels.forEach(panel => {
                if (panel.getAttribute("id") === target) {
                    panel.classList.add("active");
                } else {
                    panel.classList.remove("active");
                }
            });
            
            // Refresh reports if Analytics tab was clicked
            if (target === "tab-reports") {
                renderNudgesAndAnalytics();
            }
        });
    });
}

// Document initiation
document.addEventListener("DOMContentLoaded", async () => {
    // Fetch initial state
    if (window.api && window.api.getState) {
        state = await window.api.getState();
        updateProgressUI();
    }
    
    setupTabNavigation();
    updateNotificationBtn();
    
    // Event listeners
    addGlassBtn.addEventListener("click", () => {
        if (window.api && window.api.addManualWater) {
            window.api.addManualWater(250);
        }
    });
    
    resetDailyBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset today's water intake?")) {
            if (window.api && window.api.resetDaily) {
                window.api.resetDaily();
            }
        }
    });
    
    playPauseBtn.addEventListener("click", () => {
        if (window.api && window.api.toggleTimer) {
            window.api.toggleTimer();
        }
    });
    
    resetTimerBtn.addEventListener("click", () => {
        if (window.api && window.api.resetTimer) {
            window.api.resetTimer();
        }
    });
    
    saveSettingsBtn.addEventListener("click", () => {
        const goal = parseInt(goalInput.value);
        const interval = parseInt(intervalInput.value);
        const companion = companionSelect.value;
        const autoStart = startupCheckbox.checked;
        
        if (isNaN(interval) || interval < 1 || interval > 180) {
            alert("Please enter a valid interval between 1 and 180 minutes.");
            return;
        }
        if (isNaN(goal) || goal < 500 || goal > 6000) {
            alert("Please enter a valid daily goal between 500 and 6000 ml.");
            return;
        }
        
        if (window.api && window.api.applySettings) {
            window.api.applySettings({
                dailyGoal: goal,
                intervalMinutes: interval,
                activeCompanion: companion,
                openAtLogin: autoStart
            });
            alert("Settings applied!");
        }
    });
    
    notifBtn.addEventListener("click", () => {
        if ('Notification' in window) {
            Notification.requestPermission().then(() => {
                updateNotificationBtn();
            });
        }
    });
    
    document.addEventListener("click", () => {
        initAudio();
    }, { once: true });
});
