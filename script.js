// Responsive Dynamic Resolution Detection
const isMobile = window.innerWidth <= 768;

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cursor = document.getElementById('ai-cursor');
const searchInput = document.getElementById('search-input');
const keyboard = document.getElementById('virtual-keyboard');
const browserView = document.getElementById('browser-view');
const browserIframe = document.getElementById('browser-iframe');
const hudText = document.getElementById('hud-text');
const statusDot = document.getElementById('status-dot');
const ownerCard = document.getElementById('owner-card');
const codeStudioBox = document.getElementById('code-studio-box');
const codeTypewriter = document.getElementById('code-typewriter');
const btnClearAll = document.getElementById('btn-clear-all');
const btnFullCam = document.getElementById('btn-full-cam');
const btnToggleKbd = document.getElementById('btn-toggle-kbd');
const btnCodeBox = document.getElementById('btn-code-box');
const closeCodeBtn = document.getElementById('close-code-btn');
const flashOverlay = document.getElementById('flash-overlay');

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

// Speed & Sensitivity Auto Adjustment for Mobile and PC
const SPEED_SENSITIVITY = isMobile ? 1.35 : 1.75;
const SMOOTHING_FACTOR = isMobile ? 0.45 : 0.65;

let isPinching = false;
let lastPinchTime = 0;
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 2200;

const sampleCodeSnippet = `<!-- AI Control Project by Mohammad Billal Hossain -->
<script>
  const hands = new Hands({ locateFile: (f) => ... });
  hands.setOptions({ maxNumHands: 1, modelComplexity: ${isMobile ? 0 : 1} });
<\/script>`;

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
        if (typewriterIndex < sampleCodeSnippet.length) {
            codeTypewriter.innerText += sampleCodeSnippet.charAt(typewriterIndex);
            typewriterIndex++;
        } else {
            clearInterval(typewriterInterval);
        }
    }, 20);
}

function hideCodeBox() {
    codeStudioBox.classList.remove('active');
    if (typewriterInterval) clearInterval(typewriterInterval);
}

function clearAllScreenObjects() {
    browserView.classList.remove('active');
    browserIframe.src = "about:blank";
    keyboard.classList.remove('visible');
    ownerCard.classList.remove('active');
    hideCodeBox();
    hudText.innerText = "স্ক্রিন ক্লিয়ার করা হয়েছে!";
}

btnClearAll.addEventListener('click', clearAllScreenObjects);
btnFullCam.addEventListener('click', clearAllScreenObjects);
btnToggleKbd.addEventListener('click', () => keyboard.classList.toggle('visible'));
btnCodeBox.addEventListener('click', () => {
    if (codeStudioBox.classList.contains('active')) hideCodeBox();
    else startCodeTypewriter();
});
closeCodeBtn.addEventListener('click', hideCodeBox);

function takeScreenShot() {
    hudText.innerText = "📸 স্ক্রিনশট নেওয়া হচ্ছে...";
    flashOverlay.style.opacity = '0.9';
    setTimeout(() => flashOverlay.style.opacity = '0', 200);

    html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.download = 'gesture-screenshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        hudText.innerText = "✅ স্ক্রিনশট সম্পন্ন!";
    }).catch(() => hudText.innerText = "❌ স্ক্রিনশট নেওয়া যায়নি");
}

function showOwnerProfile() {
    ownerCard.classList.add('active');
    hudText.innerText = "👤 Developer: Mohammad Billal Hossain";
    speakText("This site was created by Mohammad Billal Hossain");
    setTimeout(() => ownerCard.classList.remove('active'), 4500);
}

function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    hudText.innerText = "সার্চ: " + query;
    let targetUrl = query;
    if (!query.startsWith('http://') && !query.startsWith('https://')) {
        if (query.includes('.') && !query.includes(' ')) {
            targetUrl = 'https://' + query;
        } else {
            targetUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
        }
    }
    browserIframe.src = targetUrl;
    browserView.classList.add('active');
    keyboard.classList.remove('visible');
}

function handleKeyPress(keyElement) {
    const char = keyElement.getAttribute('data-key');
    const action = keyElement.getAttribute('data-action');

    if (char) searchInput.value += char;
    else if (action === 'backspace') searchInput.value = searchInput.value.slice(0, -1);
    else if (action === 'clear') searchInput.value = '';
    else if (action === 'space') searchInput.value += ' ';
    else if (action === 'search') performSearch();
    else if (action === 'close') keyboard.classList.remove('visible');

    keyElement.classList.add('hover-active');
    setTimeout(() => keyElement.classList.remove('hover-active'), 150);
}

function interactAtCursor(x, y, triggerClick) {
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;

    cursor.style.display = 'none';
    const targetEl = document.elementFromPoint(x, y);
    cursor.style.display = 'block';

    document.querySelectorAll('.key, .nav-btn').forEach(el => el.classList.remove('hover-active'));

    if (targetEl) {
        const keyEl = targetEl.closest('.key');
        const btnEl = targetEl.closest('.nav-btn');

        if (keyEl) keyEl.classList.add('hover-active');
        if (btnEl) btnEl.classList.add('hover-active');

        if (triggerClick) {
            if (keyEl) handleKeyPress(keyEl);
            else if (btnEl === btnFullCam) clearAllScreenObjects();
            else if (btnEl === btnToggleKbd) keyboard.classList.toggle('visible');
            else if (btnEl === btnCodeBox) {
                if (codeStudioBox.classList.contains('active')) hideCodeBox();
                else startCodeTypewriter();
            }
        }
    }
}

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
        const thumbOpen = Math.abs(landmarks[4].x - landmarks[2].x) > 0.05;

        const now = Date.now();

        // Gesture 1: Screenshot (4 fingers)
        if (indexOpen && middleOpen && ringOpen && pinkyOpen && !thumbOpen) {
            if (now - lastGestureTime > GESTURE_COOLDOWN) {
                lastGestureTime = now;
                takeScreenShot();
            }
        }

        // Gesture 2: Developer Profile (Thumb up only)
        if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen && (landmarks[4].y < landmarks[3].y)) {
            if (now - lastGestureTime > GESTURE_COOLDOWN) {
                lastGestureTime = now;
                showOwnerProfile();
            }
        }

        // Pinch Click
        const distance = Math.hypot(
            (indexTip.x - thumbTip.x) * screenW,
            (indexTip.y - thumbTip.y) * screenH
        );

        let triggerPinch = false;
        if (distance < (isMobile ? 30 : 40)) {
            cursor.classList.add('pinched');
            if (!isPinching && (now - lastPinchTime > 250)) {
                isPinching = true;
                triggerPinch = true;
                lastPinchTime = now;
            }
        } else {
            cursor.classList.remove('pinched');
            isPinching = false;
        }

        interactAtCursor(cursorX, cursorY, triggerPinch);

        // Landmarks Rendering
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: 'rgba(0, 243, 255, 0.4)', lineWidth: 1.5});
        drawLandmarks(canvasCtx, [landmarks[8], landmarks[4]], {color: '#ff0055', lineWidth: 2, radius: 3});

    } else {
        statusDot.classList.remove('active');
        hudText.innerText = "হাত ট্র্যাকিংয়ের জন্য তৈরি...";
    }
    canvasCtx.restore();
}

// MediaPipe Initialization
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: isMobile ? 0 : 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: isMobile ? 640 : 1280,
    height: isMobile ? 480 : 720
});

camera.start().then(() => {
    hudText.innerText = "ক্যামেরা রেডি! হাত তুলে নিয়ন্ত্রণ করুন।";
});

window.addEventListener('mousemove', (e) => {
    if (!statusDot.classList.contains('active')) interactAtCursor(e.clientX, e.clientY, false);
});

window.addEventListener('click', (e) => {
    if (!statusDot.classList.contains('active')) interactAtCursor(e.clientX, e.clientY, true);
});
