const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const browserFrame = document.getElementById('browserFrame');
const keyboardContainer = document.getElementById('keyboard');
const yellowCursor = document.getElementById('yellowCursor');
const gestureStatus = document.getElementById('gesture-status');
const devModal = document.getElementById('devModal');

// Synthesized Fast Web Audio Sound Effect
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq = 750, duration = 0.04) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Open Digital Keyboard on input interaction
function openKeyboard() {
  keyboardContainer.classList.remove('hidden');
  playSound(900, 0.05);
}

cyberInput.addEventListener('mouseenter', openKeyboard);
cyberInput.addEventListener('click', openKeyboard);

// Keyboard Setup
const keys = ['1','2','3','4','5','6','7','8','9','0','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','SPACE','BKSP','CLOSE'];

keys.forEach(key => {
  const btn = document.createElement('div');
  btn.className = 'key-btn';
  btn.innerText = key;
  if(key === 'SPACE') btn.style.gridColumn = 'span 2';
  if(key === 'CLOSE') { btn.style.gridColumn = 'span 2'; btn.style.borderColor = '#ff0055'; }
  btn.onclick = () => handleKeyPress(key);
  keyboardContainer.appendChild(btn);
});

function handleKeyPress(key) {
  playSound(850, 0.04);
  if (key === 'BKSP') {
    cyberInput.value = cyberInput.value.slice(0, -1);
  } else if (key === 'SPACE') {
    cyberInput.value += ' ';
  } else if (key === 'CLOSE') {
    keyboardContainer.classList.add('hidden');
  } else {
    cyberInput.value += key;
  }
}

// Background Cyber Matrix Animation
const matrixCanvas = document.getElementById('matrixCanvas');
const mCtx = matrixCanvas.getContext('2d');
function resizeMatrix() {
  matrixCanvas.width = matrixCanvas.offsetWidth;
  matrixCanvas.height = matrixCanvas.offsetHeight;
}
resizeMatrix();

const chars = "010101SHAKILCYBER";
const drops = Array(30).fill(1);

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

// Fast MediaPipe Tracking Setup
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0, // Fastest execution
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

hands.onResults((r) => { handResults = r; });
faceMesh.onResults((r) => { faceResults = r; });

let lastPinchTime = 0;

function renderLoop() {
  drawMatrix();

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw Face Mesh Overlay
  if (faceResults && faceResults.multiFaceLandmarks) {
    for (const landmarks of faceResults.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#00f3ff20', lineWidth: 1});
    }
  }

  // Draw Hand Mesh & Process Yellow Cursor
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#ff0055', lineWidth: 1.5});
      drawLandmarks(canvasCtx, landmarks, {color: '#ffeb3b', lineWidth: 1, radius: 2});

      processYellowCursor(landmarks);
    }
  }
  canvasCtx.restore();
}

// Fast Cursor Tracking & Pinch Selection
function processYellowCursor(landmarks) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];

  // Smooth Screen Coordinate Calculation
  const cursorX = (1 - indexTip.x) * window.innerWidth;
  const cursorY = indexTip.y * window.innerHeight;

  // Move Yellow Pointer
  yellowCursor.style.left = `${cursorX}px`;
  yellowCursor.style.top = `${cursorY}px`;

  // Auto Open Keyboard when Cursor hovers Search Box
  const searchBox = document.querySelector('.search-bar-container');
  const searchRect = searchBox.getBoundingClientRect();
  if (cursorX >= searchRect.left && cursorX <= searchRect.right &&
      cursorY >= searchRect.top && cursorY <= searchRect.bottom) {
    openKeyboard();
  }

  // Pinch Pinch Distance Calculation (Thumb tip to Index tip)
  const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
  const now = Date.now();

  if (distance < 0.055) { // Pinching trigger
    yellowCursor.classList.add('pinched');
    if (now - lastPinchTime > 500) {
      lastPinchTime = now;
      playSound(1200, 0.06);

      // Perform Element Trigger under Cursor
      yellowCursor.style.display = 'none';
      const elementUnderCursor = document.elementFromPoint(cursorX, cursorY);
      yellowCursor.style.display = 'block';

      if (elementUnderCursor) {
        elementUnderCursor.click();
        gestureStatus.innerText = "কমান্ড সিলেক্ট করা হয়েছে!";
      }
    }
  } else {
    yellowCursor.classList.remove('pinched');
  }
}

// Top Box Control Actions
function openYouTube() {
  playSound(950, 0.08);
  keyboardContainer.classList.add('hidden');
  browserFrame.classList.remove('hidden');
  browserFrame.src = "https://m.youtube.com/";
}

function executeSearch() {
  playSound(900, 0.08);
  const query = cyberInput.value.trim();
  if (query) {
    keyboardContainer.classList.add('hidden');
    browserFrame.classList.remove('hidden');
    browserFrame.src = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  }
}

function takeScreenshot() {
  playSound(1400, 0.12);
  html2canvas(document.body).then(canvas => {
    const a = document.createElement('a');
    a.download = 'cyber-hud-screenshot.png';
    a.href = canvas.toDataURL();
    a.click();
  });
}

function showDevInfo() {
  playSound(1100, 0.08);
  devModal.style.display = 'flex';
}

function hideDevInfo() {
  playSound(400, 0.05);
  devModal.style.display = 'none';
}

// High Speed Optimized Camera Frame Feed
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
