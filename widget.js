// AquaBuddy Retro Widget Renderer Logic

const REMINDER_MESSAGES = [
    // --- English Quotes ---
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
    "Did you know? Water cures grumpiness. Take a sip! 😠➡️😊",
    "Time to lubricate those joints and feed your brain! 🦾",
    "H2O time! Keep that energy high and body happy! ⚡",
    "Be like water, my friend. Sip some now! 🌊",
    "One small glass for you, one giant leap for your health! 🧑‍🚀",
    "Alert: Hydration levels dropping. Refill immediately! 🚨",
    "Water check! Drop what you're doing and take a gulp. 🛑🥤",
    "Keep the flow going! Drink some liquid energy. ⛲",
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
    "Drink water: because you deserve to feel amazing every day! 🌸",

    // --- Gujarati (in English Characters) Funny & Friendly Lines ---
    "Ey dost, tu suki draksh jevo thai gayo chhe! Chal pani pi! 🍇",
    "Chal bhai, have bahu kaam karyu, ek glass pani gatgatavi ja! 🥛",
    "Screen jovanu muko ane pehla ek ghutdo pani pio! Hu badhu jou chhu ho! 👀",
    "Tari kidneys bumo pade chhe: bhai, thodu pani to mokal! 📣",
    "Chal dost, pani pi le nahin to battery low thai jashe! ⚡",
    "Taru sharir kai ran nathi ke pani vagar chalshe, chal pi le! 🌵",
    "Chal, modu na kar! Pani pi ane pacho kame lagi ja! 🚀",
    "Ek nano viram le ane gatgatavi ja! Moj ma re! 😉💧",
    "Hydrate rahesho to life set raheshe, chal pani pi le! 🥛✨",
    "Ey hero! Pani pivano samay thai gayo chhe ho! 😎🥛"
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

function playBloopSound() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
}

function playYawnSound() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.6);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.6);
}

function spawnParticles() {
    const container = document.getElementById("particle-container");
    if (!container) return;
    
    const emojis = ['💧', '✨', '💙', '🌊', '💧'];
    
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        
        const tx = (Math.random() - 0.5) * 100 + 'px';
        const tr = (Math.random() - 0.5) * 60 + 'deg';
        p.style.setProperty('--tx', tx);
        p.style.setProperty('--tr', tr);
        
        container.appendChild(p);
    }
}

// Load companion sprite (assets are pre-processed to have transparent backgrounds)
function loadCompanionSprite(charId) {
    const companionSprite = document.getElementById("companion-sprite");
    if (!companionSprite) return;
    
    companionSprite.className = "companion-sprite spritesheet"; // Reset and apply spritesheet class
    companionSprite.style.backgroundImage = `url('character${charId}.png')`;
    companionSprite.style.backgroundSize = "400% auto";
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
            const compName = state.companionName || "AquaBuddy";
            const currentHour = new Date().getHours();
            const timeGreeting = currentHour < 12 ? "Good morning!" : currentHour >= 18 ? "Good evening!" : "Hello!";
            
            // 1. Pick a random message from the pool (English or Gujarati!)
            const randomIndex = Math.floor(Math.random() * REMINDER_MESSAGES.length);
            let rawMsg = REMINDER_MESSAGES[randomIndex];
            
            // Replace generic 250ml with customized glass size if it exists in message
            if (state.glassSize) {
                rawMsg = rawMsg.replace("250ml", `${state.glassSize}ml`);
            }
            
            if (state.streak >= 3) {
                rawMsg += " 🔥 Hydration streak!";
            }
            
            // 2. Set Companion Header
            const headerElement = document.getElementById("widget-companion-header");
            if (headerElement) {
                headerElement.textContent = `🌸 ${compName} says:`;
            }
            
            // 3. Set main quote/message body
            msgElement.textContent = rawMsg;
            
            // 4. Update Stats Footer
            const statsElement = document.getElementById("widget-stats-footer");
            if (statsElement) {
                const todayVal = state.currentIntake || 0;
                const goalVal = state.dailyGoal || 2000;
                let statsText = `💧 ${todayVal}/${goalVal}ml`;
                
                if (state.yesterdayIntake && state.yesterdayIntake > 0) {
                    statsText += ` | 📈 Yesterday: ${state.yesterdayIntake}ml`;
                }
                
                statsElement.textContent = statsText;
            }
            
            // Start off-screen
            const widget = document.getElementById("retro-widget");
            if (widget) {
                widget.classList.remove("arrived");
            }

            // Hide speech bubble and actions container during walk-in
            if (speechBubble) speechBubble.classList.remove("show");
            if (actionsContainer) actionsContainer.classList.remove("show");
            
            // Render companion sprite (always random to show a different one every time)
            const ids = ["1", "2", "3", "4", "5", "6"];
            let charId = ids[Math.floor(Math.random() * ids.length)];
            loadCompanionSprite(charId);
            
            // Trigger walking animation state
            const companionSprite = document.getElementById("companion-sprite");
            if (companionSprite) {
                companionSprite.classList.add("walking");
            }
            
            // Ensure character faces left when walking in
            const container = document.querySelector(".companion-character-container");
            if (container) {
                container.style.transform = 'scaleX(-1)';
            }

            // Start the CSS walk-in animation
            setTimeout(() => {
                if (widget) {
                    widget.classList.add("arrived");
                }
            }, 100);

            // Wait for CSS transition (1.5s) to complete
            setTimeout(() => {
                if (companionSprite) {
                    companionSprite.classList.remove("walking"); // Stand still
                    
                    // Character takes a sip of water right after arriving
                    setTimeout(() => {
                        companionSprite.classList.add("drinking");
                        // Stop drinking after 1.5 second (returns to holding glass)
                        setTimeout(() => {
                            companionSprite.classList.remove("drinking");
                        }, 1500);
                    }, 300);
                }
                if (speechBubble) speechBubble.classList.add("show");
                if (actionsContainer) actionsContainer.classList.add("show");
                
                // Play retro arpeggio chime when bubble appears
                playRetroChime();
            }, 1600);
        });
    }
    
    // Wire up buttons to main IPC commands
    let isClosing = false;
    
    drankBtn.addEventListener("click", () => {
        if (isClosing) return;
        isClosing = true;
        
        playBloopSound();
        spawnParticles();
        
        const companionSprite = document.getElementById("companion-sprite");
        if (companionSprite) {
            companionSprite.classList.add("drinking");
        }
        
        setTimeout(() => {
            if (window.api && window.api.widgetDrank) {
                window.api.widgetDrank();
            }
        }, 1200);
    });
    
    snoozeBtn.addEventListener("click", () => {
        if (isClosing) return;
        isClosing = true;
        
        playYawnSound();
        
        setTimeout(() => {
            if (window.api && window.api.widgetSnooze) {
                window.api.widgetSnooze();
            }
        }, 600);
    });
    
    // Pre-activate AudioContext on early clicks
    document.addEventListener("click", () => {
        initAudio();
    }, { once: true });
});
