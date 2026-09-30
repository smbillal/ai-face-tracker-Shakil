const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const browserFrame = document.getElementById('browserFrame');
const keyboardContainer = document.getElementById('keyboard');
const yellowCursor = document.getElementById('yellowCursor');
const gestureStatus = document.getElementById('gesture-status');
const devModal = document.getElementById('devModal');

// Synthesized Cyber Audio Feedback
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCyberSound(freq = 800, duration = 0.04) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Open Digital Keyboard
function openKeyboard() {
  keyboardContainer.classList.remove('hidden');
  playCyberSound(950, 0.05);
}

cyberInput.addEventListener('mouseenter', openKeyboard);
cyberInput.addEventListener('click', openKeyboard);

// Full A to Z Cyber Keyboard Layout + Numbers + ⌫ (X)
const fullKeys = [
  '1','2','3','4','5','6','7','8','9','0',
  'Q','W','E','R','T','Y','U','I','O','P',
  'A','S','D','F','G','H','J','K','L','⌫ (X)',
  'Z','X','C','V','B','N','M','SPACE','CLOSE'
];

fullKeys.forEach(key => {
  const btn = document.createElement('div');
  btn.className = 'key-btn';
  btn.innerText = key;

  if(key === 'SPACE') btn.style.gridColumn = 'span 2';
  if(key === 'CLOSE') { btn.style.gridColumn = 'span 2'; btn.style.borderColor = '#ff0055'; }
  if(key === '⌫ (X)') { btn.style.color = '#ffeb3b'; btn.style.borderColor = '#ffeb3b'; }

  btn.onclick = () => handleKeyPress(key);
  keyboardContainer.appendChild(btn);
});

function handleKeyPress(key) {
  playCyberSound(850, 0.04);
  if (key === '⌫ (X)') {
    cyberInput.value = cyberInput.value.slice(0, -1);
  } else if (key === 'SPACE') {
    cyberInput.value += ' ';
  } else if (key === 'CLOSE') {
    keyboardContainer.classList.add('hidden');
  } else {
    cyberInput.value += key;
  }
}

// Background Matrix Animation
const matrixCanvas = document.getElementById('matrixCanvas');
const mCtx = matrixCanvas.getContext('2d');
function resizeMatrix() {
  matrixCanvas.width = matrixCanvas.offsetWidth;
  matrixCanvas.height = matrixCanvas.offsetHeight;
}
resizeMatrix();

const chars = "01CYBERHUD40";
const drops = Array(25).fill(1);
function drawMatrix() {
  mCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
  mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  mCtx.fillStyle = "#00f3ff";
  mCtx.font = "10px monospace";
  for (let i = 0; i < drops.length; i++) {
    const text = chars.charAt(Math.floor(Math.random() * chars.length));
    mCtx.fillText(text, i * 12, drops[i] * 12);
    if (drops[i] * 12 > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}

// MediaPipe Machine Learning Engine
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

let handResults = null;
let faceResults = null;

hands.onResults(r => handResults = r);
faceMesh.onResults(r => faceResults = r);

// Smooth Cursor Interpolation (Lerp) Variables
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let targetX = cursorX;
let targetY = cursorY;

// Anti Auto-Click State Control
let isPinching = false;
let lastClickTime = 0;

function renderLoop() {
  drawMatrix();

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (faceResults && faceResults.multiFaceLandmarks) {
    for (const landmarks of faceResults.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#00f3ff18', lineWidth: 1});
    }
  }

  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#ff0055', lineWidth: 1.5});
      drawLandmarks(canvasCtx, landmarks, {color: '#ffea00', lineWidth: 1, radius: 2});

      processSmoothCursor(landmarks);
    }
  }
  canvasCtx.restore();
}

function processSmoothCursor(landmarks) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];

  // Target Location Calculation
  targetX = (1 - indexTip.x) * window.innerWidth;
  targetY = indexTip.y * window.innerHeight;

  // Linear Interpolation (Lerp) for Silky Smooth Cursor
  cursorX += (targetX - cursorX) * 0.35;
  cursorY += (targetY - cursorY) * 0.35;

  yellowCursor.style.left = `${cursorX}px`;
  yellowCursor.style.top = `${cursorY}px`;

  // Pinch Distance Calculation
  const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
  const now = Date.now();

  // Strict Pinch Trigger (Zero Auto-Click Lock)
  if (distance < 0.042) {
    yellowCursor.classList.add('pinched');
    if (!isPinching && (now - lastClickTime > 600)) {
      isPinching = true;
      lastClickTime = now;
      playCyberSound(1100, 0.06);

      // Perform Exact Click
      yellowCursor.style.display = 'none';
      const clickedElem = document.elementFromPoint(cursorX, cursorY);
      yellowCursor.style.display = 'block';

      if (clickedElem) {
        clickedElem.click();
        gestureStatus.innerText = "সিলেক্ট করা হয়েছে!";
      }
    }
  } else {
    isPinching = false;
    yellowCursor.classList.remove('pinched');
  }
}

// Google Search & YouTube Action Handlers
function searchGoogle() {
  playCyberSound(900, 0.06);
  const query = cyberInput.value.trim() || "Google Cyber HUD";
  keyboardContainer.classList.add('hidden');
  browserFrame.src = `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;
}

function executeGoogleSearch() {
  searchGoogle();
}

function openYouTubeEmbed() {
  playCyberSound(950, 0.08);
  keyboardContainer.classList.add('hidden');
  const query = cyberInput.value.trim();
  if (query) {
    browserFrame.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
  } else {
    browserFrame.src = `https://www.youtube.com/embed/fJ9rUzIMcZQ`; // Cyberpunk HUD background demo
  }
}

function showDevInfo() {
  playCyberSound(1000, 0.06);
  devModal.style.display = 'flex';
}

function hideDevInfo() {
  playCyberSound(400, 0.04);
  devModal.style.display = 'none';
}

// Camera Engine Frame Loop
const camera = new Camera(videoElement, {
  onFrame: async () => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    await hands.send({image: videoElement});
    await faceMesh.send({image: videoElement});

    renderLoop();
  },
  width: 640,
  height: 480
});
camera.start();
