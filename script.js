const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const browserFrame = document.getElementById('browserFrame');
const keyboardContainer = document.getElementById('keyboard');
const cursorEl = document.getElementById('cyberCursor');
const gestureStatus = document.getElementById('gesture-status');
const devModal = document.getElementById('devModal');

// Synthesized Sound Effects (High Speed Web Audio)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playAudio(freq = 700, duration = 0.05, type = 'sawtooth') {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Input Focus Listener -> Show Digital Keyboard without mobile keyboard
cyberInput.addEventListener('click', () => {
  keyboardContainer.classList.remove('hidden');
  browserFrame.classList.add('hidden');
  cyberInput.classList.remove('hidden');
  playAudio(900, 0.08);
});

// Virtual Keyboard Layout Setup
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
  playAudio(800, 0.04);
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

// Matrix Background Animation Loop
const matrixCanvas = document.getElementById('matrixCanvas');
const mCtx = matrixCanvas.getContext('2d');
function initMatrix() {
  matrixCanvas.width = matrixCanvas.offsetWidth;
  matrixCanvas.height = matrixCanvas.offsetHeight;
}
initMatrix();

const matrixChars = "0110100101CYBERHUD30";
const fontSize = 10;
const columns = Math.floor(matrixCanvas.width / fontSize) || 20;
const drops = Array(columns).fill(1);

function drawMatrix() {
  mCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
  mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  mCtx.fillStyle = "#00f3ff";
  mCtx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
    mCtx.fillText(text, i * fontSize, drops[i] * fontSize);
    if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}

// MediaPipe Optimization (High Performance)
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0, // Maximum Speed
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

hands.onResults((results) => { handResults = results; });
faceMesh.onResults((results) => { faceResults = results; });

let lastPinchTime = 0;

function renderLoop() {
  drawMatrix(); // Render Background Matrix
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Render Face Tracking Mesh
  if (faceResults && faceResults.multiFaceLandmarks) {
    for (const landmarks of faceResults.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#00f3ff18', lineWidth: 1});
    }
  }

  // Render Hand Tracking & Process Air-Touch Cursor
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#ff0055', lineWidth: 2});
      drawLandmarks(canvasCtx, landmarks, {color: '#00f3ff', lineWidth: 1, radius: 2});

      processAirTouch(landmarks);
    }
  }
  canvasCtx.restore();
}

// Air-Touch Reticle Cursor & Pinch Click System
function processAirTouch(landmarks) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];

  // Mirror X coordinate for video feed
  const cursorX = (1 - indexTip.x) * window.innerWidth;
  const cursorY = indexTip.y * window.innerHeight;

  // Move Reticle Cursor
  cursorEl.style.left = `${cursorX}px`;
  cursorEl.style.top = `${cursorY}px`;

  // Calculate Distance for Pinch Gesture (Index Tip to Thumb Tip)
  const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
  const now = Date.now();

  if (distance < 0.05) { // Pinch Trigger Threshold
    cursorEl.classList.add('pinched');
    if (now - lastPinchTime > 600) { // Cooldown delay
      lastPinchTime = now;
      playAudio(1200, 0.08);

      // Perform Physical Click under Cyber Cursor
      cursorEl.style.display = 'none';
      const targetElement = document.elementFromPoint(cursorX, cursorY);
      cursorEl.style.display = 'block';

      if (targetElement) {
        targetElement.click();
        gestureStatus.innerText = "কমান্ড সিলেক্ট করা হয়েছে!";
      }
    }
  } else {
    cursorEl.classList.remove('pinched');
  }

  // 3-Finger Screenshot Gesture Detection
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  if (middleUp && ringUp && !pinkyUp && (now - lastPinchTime > 2500)) {
    takeScreenshot();
    lastPinchTime = now;
  }
}

// Functions & Controls
function takeScreenshot() {
  playAudio(1500, 0.15);
  html2canvas(document.body).then(canvas => {
    const link = document.createElement('a');
    link.download = 'cyber-hud-screenshot.png';
    link.href = canvas.toDataURL();
    link.click();
    gestureStatus.innerText = "স্ক্রিনশট সেভ করা হয়েছে!";
  });
}

function executeSearch() {
  playAudio(900, 0.08);
  const query = cyberInput.value.trim();
  if (query) {
    cyberInput.classList.add('hidden');
    keyboardContainer.classList.add('hidden');
    browserFrame.classList.remove('hidden');
    // Embedded Web Search
    browserFrame.src = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  } else {
    alert("অনুগ্রহ করে সার্চ করার জন্য কিছু লিখুন!");
  }
}

function openYouTube() {
  playAudio(1000, 0.08);
  cyberInput.classList.add('hidden');
  keyboardContainer.classList.add('hidden');
  browserFrame.classList.remove('hidden');
  // Embedded YouTube inside top screen
  browserFrame.src = "https://www.youtube.com/embed?listType=search&list=cyberpunk";
}

function showDevInfo() {
  playAudio(1100, 0.1, 'triangle');
  devModal.style.display = 'flex';
}

function hideDevInfo() {
  playAudio(400, 0.05);
  devModal.style.display = 'none';
}

// Camera Engine Setup
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
