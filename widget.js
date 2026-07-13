// AquaBuddy Retro Widget Renderer Logic

const REMINDER_MESSAGES = [
    "Time to drink water to keep your skin glowing! ✨",
    "Hydrate or diedrate! Drink up! 💧",
    "Your kidneys are begging you for a splash of water! 👑",
    "Water is life! Take a sip, you beautiful human! 🌸",
    "Psst... are you turning into a dry raisin? Drink water! 🍇",
    "A wild water reminder appeared! Choose: DRANK or SNOOZE. 👾",
    "Fuel your brain, refresh your cells! 🧠💦",
    "Drink water now! I am watching you... 👀🥛",
    "Level up your energy! Take a sip of the elixir of life. 🧪",
    "Gulp gulp gulp! It is hydration hour! ⏰",
    "Your organs are chanting: WATER! WATER! WATER! 📣",
    "Drink up! Future you is thanking you for the hydration. 🚀",
    "Did you know? Water cures grumpiness. Take a sip! 😠➡️😊",
    "Time to lubricate those joints and feed your brain! 🦾",
    "H2O time! Keep that energy high and body happy! ⚡",
    "Be like water, my friend. Sip some now! 🌊",
    "One small glass for you, one giant leap for your health! 🧑‍🚀",
    "Alert: Hydration levels dropping. Refill immediately! 🚨",
    "Water check! Drop what you're doing and take a gulp. 🛑🥤",
    "Keep the flow going! Drink 250ml of liquid energy. ⛲",
    "Stay fresh, stay cool! Pour a glass of water. 🧊",
    "Every sip is a step toward a healthier, more vibrant you! 🌟",
    "Your future self will thank you for the hydration. Sip now! 🚀",
    "Water is the ultimate beauty elixir. Keep your skin glowing! ✨",
    "Power up your productivity! Hydrate your brain cells. 🧠",
    "Feel the energy flow. Drink a glass of fresh water! ⚡",
    "Hydrate your way to the top. Success starts with self-care! 🏆",
    "Invest in your health: one sip at a time. 💧",
    "A glass of water is a reboot button for your body! ⛲",
    "Stay active, stay hydrated, stay unstoppable! 🦾",
    "Your heart, brain, and muscles are waiting for H2O. Drink up! ❤️",
    "Water clears the mind and cleanses the soul. Take a sip! 🌊",
    "Be proud of your progress. Keep the hydration streak alive! 🔥",
    "Hydration is key to high vibes and bright minds. 🌟",
    "Refresh. Refuel. Reignite. Sip some water! 🧊",
    "Drink water: because you deserve to feel amazing every day! 🌸"
];

let audioCtx = null;

// Initialize audio context
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// 8-Bit Chime sound synthesizer
function playRetroChime() {
    initAudio();
    if (!audioCtx) return;
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6 (Ascending Arpeggio)
    const noteLength = 0.085;
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = (idx % 2 === 0) ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, now + idx * noteLength);
        
        gain.gain.setValueAtTime(0.18, now + idx * noteLength);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * noteLength + noteLength);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now + idx * noteLength);
        osc.stop(now + idx * noteLength + noteLength);
    });
}

// Load companion sprite (assets are pre-processed to have transparent backgrounds)
function loadCompanionSprite(charId) {
    const companionSprite = document.getElementById("companion-sprite");
    if (!companionSprite) return;
    companionSprite.src = `character${charId}.png`;
}

// Set up UI actions and IPC triggers
document.addEventListener("DOMContentLoaded", () => {
    const drankBtn = document.getElementById("widget-drank-btn");
    const snoozeBtn = document.getElementById("widget-snooze-btn");
    const msgElement = document.getElementById("widget-message");
    
    // Select speech bubble and actions container to animate on arrival
    const speechBubble = document.querySelector(".retro-speech-bubble");
    const actionsContainer = document.querySelector(".retro-actions");
    
    // Listen for alert trigger from main process
    if (window.api && window.api.onAlertTrigger) {
        window.api.onAlertTrigger((state) => {
            // Check yesterday's comparison and generate customized messages
            let message = "";
            if (state.yesterdayIntake && state.yesterdayIntake > 0) {
                if (state.currentIntake < state.yesterdayIntake) {
                    message = `Yesterday you drank ${state.yesterdayIntake}ml. You are at ${state.currentIntake}ml today. Keep pushing to beat your score! 🚀`;
                } else {
                    message = `You beat yesterday's intake of ${state.yesterdayIntake}ml! Drank ${state.currentIntake}ml today. Legendary hydration! 🏆`;
                }
            } else {
                const randomIndex = Math.floor(Math.random() * REMINDER_MESSAGES.length);
                message = REMINDER_MESSAGES[randomIndex];
            }
            msgElement.textContent = message;
            
            // Hide speech bubble and actions container during walk-in
            if (speechBubble) speechBubble.classList.remove("show");
            if (actionsContainer) actionsContainer.classList.remove("show");
            
            // Render companion sprite
            let charId = state.activeCompanion;
            if (charId === "random") {
                const ids = ["1", "2", "3", "4", "5"];
                charId = ids[Math.floor(Math.random() * ids.length)];
            }
            loadCompanionSprite(charId);
            
            // Trigger walking animation state
            const companionSprite = document.getElementById("companion-sprite");
            if (companionSprite) {
                companionSprite.classList.add("walking");
            }
        });
    }

    // Listen for walking direction changes (apply flip to container to avoid animation overrides)
    if (window.api && window.api.onDirectionChange) {
        window.api.onDirectionChange((direction) => {
            const container = document.querySelector(".companion-character-container");
            if (container) {
                if (direction === 'right') {
                    container.style.transform = 'scaleX(-1)';
                } else {
                    container.style.transform = 'scaleX(1)';
                }
            }
        });
    }

    // Listen for walk arrival completion (stops character, shows bubble, plays chime)
    if (window.api && window.api.onWalkCompleted) {
        window.api.onWalkCompleted(() => {
            const sprite = document.getElementById("companion-sprite");
            if (sprite) {
                sprite.classList.remove("walking"); // Stand still
            }
            if (speechBubble) speechBubble.classList.add("show");
            if (actionsContainer) actionsContainer.classList.add("show");
            
            // Play retro arpeggio chime when bubble appears
            playRetroChime();
        });
    }
    
    // Wire up buttons to main IPC commands
    drankBtn.addEventListener("click", () => {
        if (window.api && window.api.widgetDrank) {
            window.api.widgetDrank();
        }
    });
    
    snoozeBtn.addEventListener("click", () => {
        if (window.api && window.api.widgetSnooze) {
            window.api.widgetSnooze();
        }
    });
    
    // Pre-activate AudioContext on early clicks
    document.addEventListener("click", () => {
        initAudio();
    }, { once: true });
});
