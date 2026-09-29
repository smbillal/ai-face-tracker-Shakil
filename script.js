const isMobile = window.innerWidth <= 768;

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cursor = document.getElementById('ai-cursor');
const hudInput = document.getElementById('hudInput');
const keyboard = document.getElementById('virtual-keyboard');
const browserSection = document.getElementById('browser-section');
const urlDisplay = document.getElementById('urlDisplay');
const webFrame = document.getElementById('webFrame');
const hudText = document.getElementById('hud-text');
const statusDot = document.getElementById('status-dot');
const ownerCard = document.getElementById('owner-card');
const codeStudioBox = document.getElementById('code-studio-box');
const codeTypewriter = document.getElementById('code-typewriter');
const btnQuickClear = document.getElementById('btn-quick-clear');
const btnCloseBrowser = document.getElementById('btnCloseBrowser');
const btnCodeToggle = document.getElementById('btn-code-toggle');
const closeCodeBtn = document.getElementById('close-code-btn');
const flashOverlay = document.getElementById('flash-overlay');
const searchTrigger = document.getElementById('search-trigger');

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

// ১.৮৫ গুণ ফুল স্পিড ও অতি-সংবেদনশীল কার্সর ট্র্যাকিং
const SPEED_SENSITIVITY = isMobile ? 1.85 : 2.3;
const SMOOTHING_FACTOR = isMobile ? 0.75 : 0.85;

let isPinching = false;
let lastPinchTime = 0;
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 2500;

// Cyberpunk Digital Click Audio Synthesizer
function playCyberClickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}
}

const sourceCodeText = `<!DOCTYPE html>
<!-- AI Gesture Project Developed by Mohammad Billal Hossain -->
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands"></script>
</head>
<body>
  <script>
    const hands = new Hands({ locateFile: (f) => ... });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 0 });
    hands.onResults((results) => {
      // High-Speed Finger & Gesture Detection Logic
    });
  <\/script>
</body>
</html>`;

let typewriterIndex = 0;
let typewriterInterval = null;

function resizeCanvas() {
    canvasElement.width = videoElement.clientWidth || window.innerWidth;
    canvasElement.height = videoElement.clientHeight || window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function startCodeTypewriter() {
    codeStudioBox.classList.add('active');
    if (typewriterInterval) clearInterval(typewriterInterval);
    codeTypewriter.innerText = '';
    typewriterIndex = 0;
    typewriterInterval = setInterval(() => {
        if (typewriterIndex < sourceCodeText.length) {
            codeTypewriter.innerText += sourceCodeText.charAt(typewriterIndex);
            typewriterIndex++;
        } else {
            clearInterval(typewriterInterval);
        }
    }, 15);
}

function hideCodeBox() {
    codeStudioBox.classList.remove('active');
    if (typewriterInterval) clearInterval(typewriterInterval);
}

function clearAllScreenObjects() {
    browserSection.classList.remove('active');
    webFrame.src = "about:blank";
    keyboard.classList.remove('visible');
    ownerCard.classList.remove('active');
    hideCodeBox();
    hudText.innerText = "স্ক্রিন ক্লিয়ার করা হয়েছে!";
}

btnQuickClear.addEventListener('click', clearAllScreenObjects);
btnCloseBrowser.addEventListener('click', () => {
    browserSection.classList.remove('active');
    webFrame.src = "about:blank";
});
btnCodeToggle.addEventListener('click', () => {
    if (codeStudioBox.classList.contains('active')) hideCodeBox();
    else startCodeTypewriter();
});
closeCodeBtn.addEventListener('click', hideCodeBox);

// ৪-আঙুলের স্ক্রিনশট ফাংশন
function takeScreenShot() {
    hudText.innerText = "📸 স্ক্রিনশট নেওয়া হচ্ছে...";
    flashOverlay.style.opacity = '0.9';
    setTimeout(() => flashOverlay.style.opacity = '0', 200);

    html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.download = 'gesture-screenshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        hudText.innerText = "✅ স্ক্রিনশট সফলভাবে ক্যাপচার হয়েছে!";
    }).catch(() => hudText.innerText = "❌ স্ক্রিনশট ব্যর্থ হয়েছে");
}

// ১-আঙুল (Thumb Up) ডেভেলপার নাম ও ভয়েস
function showOwnerProfile() {
    ownerCard.classList.add('active');
    hudText.innerText = "👤 Developer: Mohammad Billal Hossain";
    speakText("This site was created by Mohammad Billal Hossain");
    setTimeout(() => ownerCard.classList.remove('active'), 5000);
}

// রিয়েল-টাইম সার্চ প্রসেসিং
function performSearch() {
    const query = hudInput.value.trim();
    if (!query) return;

    let targetUrl = query;
    if (!query.startsWith('http://') && !query.startsWith('https://')) {
        if (query.includes('.') && !query.includes(' ')) {
            targetUrl = 'https://' + query;
        } else {
            targetUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
        }
    }

    urlDisplay.innerText = targetUrl;
    webFrame.src = targetUrl;
    browserSection.classList.add('active');
    keyboard.classList.remove('visible');
    hudText.innerText = "সার্চ শুরু হয়েছে...";
}

// কিবোর্ড প্রসেসিং
function handleKeyPress(keyElement) {
    playCyberClickSound();
    const char = keyElement.getAttribute('data-key');
    const action = keyElement.getAttribute('data-action');

    if (char) hudInput.value += char;
    else if (action === 'backspace') hudInput.value = hudInput.value.slice(0, -1);
    else if (action === 'clear') hudInput.value = '';
    else if (action === 'space') hudInput.value += ' ';
    else if (action === 'search') performSearch();
    else if (action === 'hide') keyboard.classList.remove('visible');

    keyElement.classList.add('hover-active');
    setTimeout(() => keyElement.classList.remove('hover-active'), 150);
}

// কার্সর ইন্টারঅ্যাকশন
function interactAtCursor(x, y, triggerClick) {
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;

    cursor.style.display = 'none';
    const targetEl = document.elementFromPoint(x, y);
    cursor.style.display = 'block';

    document.querySelectorAll('.key, .nav-btn, .clear-screen-btn').forEach(el => el.classList.remove('hover-active'));

    if (targetEl) {
        // অটো কিবোর্ড পপ-আপ সার্চ বারে হোভার করলে
        if (targetEl.closest('#search-trigger')) {
            keyboard.classList.add('visible');
        }

        // কুইক সাইড ক্রস বোতামে কার্সর রাখলেই স্ক্রিন ক্লিয়ার
        if (targetEl.closest('#btn-quick-clear')) {
            clearAllScreenObjects();
        }

        const keyEl = targetEl.closest('.key');
        const btnEl = targetEl.closest('.nav-btn');

        if (keyEl) keyEl.classList.add('hover-active');
        if (btnEl) btnEl.classList.add('hover-active');

        if (triggerClick) {
            if (keyEl) handleKeyPress(keyEl);
            else if (btnEl === btnCodeToggle) {
                if (codeStudioBox.classList.contains('active')) hideCodeBox();
                else startCodeTypewriter();
            } else if (btnEl === btnCloseBrowser) {
                browserSection.classList.remove('active');
                webFrame.src = "about:blank";
            }
        }
    }
}

// MediaPipe ট্র্যাকিং লুপ
function onResults(results) {
    resizeCanvas();
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusDot.classList.add('active');
        const landmarks = results.multiHandLandmarks[0];

        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const rawMappedX = (1 - indexTip.x) * screenW;
        const rawMappedY = indexTip.y * screenH;
        const centerX = screenW / 2;
        const centerY = screenH / 2;

        const targetX = centerX + (rawMappedX - centerX) * SPEED_SENSITIVITY;
        const targetY = centerY + (rawMappedY - centerY) * SPEED_SENSITIVITY;

        cursorX = cursorX + (targetX - cursorX) * SMOOTHING_FACTOR;
        cursorY = cursorY + (targetY - cursorY) * SMOOTHING_FACTOR;

        cursorX = Math.max(10, Math.min(screenW - 10, cursorX));
        cursorY = Math.max(10, Math.min(screenH - 10, cursorY));

        const indexOpen = landmarks[8].y < landmarks[6].y;
        const middleOpen = landmarks[12].y < landmarks[10].y;
        const ringOpen = landmarks[16].y < landmarks[14].y;
        const pinkyOpen = landmarks[20].y < landmarks[18].y;
        const thumbUpOnly = landmarks[4].y < landmarks[3].y && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen;

        const now = Date.now();

        // জেসচার ১: ৪ আঙুলে স্ক্রিনশট (তর্জনী, মধ্যমা, অনামিকা, কনিষ্ঠা)
        if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
            if (now - lastGestureTime > GESTURE_COOLDOWN) {
                lastGestureTime = now;
                takeScreenShot();
            }
        }

        // জেসচার ২: ১ বৃদ্ধা আঙুল (Thumb Up) ডেভেলপার নাম ও ভয়েস
        if (thumbUpOnly) {
            if (now - lastGestureTime > GESTURE_COOLDOWN) {
                lastGestureTime = now;
                showOwnerProfile();
            }
        }

        // চিমটি কাটা (Pinch Click)
        const distance = Math.hypot(
            (indexTip.x - thumbTip.x) * screenW,
            (indexTip.y - thumbTip.y) * screenH
        );

        let triggerPinch = false;
        if (distance < (isMobile ? 32 : 45)) {
            cursor.classList.add('pinched');
            if (!isPinching && (now - lastPinchTime > 220)) {
                isPinching = true;
                triggerPinch = true;
                lastPinchTime = now;
            }
        } else {
            cursor.classList.remove('pinched');
            isPinching = false;
        }

        interactAtCursor(cursorX, cursorY, triggerPinch);

        // ক্যানভাসে হাতের লাইন অঙ্কন
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: 'rgba(0, 243, 255, 0.4)', lineWidth: 1.5});
        drawLandmarks(canvasCtx, [landmarks[8], landmarks[4]], {color: '#ff0055', lineWidth: 2, radius: 3});

    } else {
        statusDot.classList.remove('active');
        hudText.innerText = "হাত ট্র্যাকিংয়ের জন্য ক্যামেরা চালু আছে...";
    }
    canvasCtx.restore();
}

// MediaPipe Hands সেটআপ (ফুল স্পিড অপটিমাইজড)
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: isMobile ? 320 : 640,
    height: isMobile ? 240 : 480
});

camera.start().then(() => {
    hudText.innerText = "ক্যামেরা প্রস্তুত! ইশারায় নিয়ন্ত্রণ করুন।";
});

window.addEventListener('mousemove', (e) => {
    if (!statusDot.classList.contains('active')) interactAtCursor(e.clientX, e.clientY, false);
});

window.addEventListener('click', (e) => {
    if (!statusDot.classList.contains('active')) interactAtCursor(e.clientX, e.clientY, true);
});
