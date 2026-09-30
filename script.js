
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const browserFrame = document.getElementById('browserFrame');
const keyboardContainer = document.getElementById('keyboard');
const yellowCursor = document.getElementById('yellowCursor');
const gestureStatus = document.getElementById('gesture-status');
const devModal = document.getElementById('devModal');
const simOverlay = document.getElementById('cyberSimOverlay');
const simText = document.getElementById('simText');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNum = document.getElementById('countdownNum');
const filterBar = document.getElementById('filterBar');

// Synthesized Cyber Audio Synthesizer
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCyberSound(freq = 800, duration = 0.04) {
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

// CAPTCHA-Free Cyber Search with Loading Simulation
function executeCyberSearch(type) {
  playCyberSound(900, 0.06);
  const query = cyberInput.value.trim() || "Cyberpunk Technology";
  keyboardContainer.classList.add('hidden');

  simOverlay.classList.remove('hidden');
  simText.innerText = "SYNTHESIZING DATA & BYPASSING SECURE CAPTCHA...";

  setTimeout(() => {
    simOverlay.classList.add('hidden');
    if (type === 'google') {
      // DuckDuckGo Clean Embed prevents Google CAPTCHA errors completely
      browserFrame.src = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    }
  }, 1200);
}

// Multi-Channel Interactive YouTube Interface
function openYouTubeMultiChannel() {
  playCyberSound(950, 0.08);
  keyboardContainer.classList.add('hidden');
  const query = cyberInput.value.trim();

  simOverlay.classList.remove('hidden');
  simText.innerText = "CONNECTING MULTI-CHANNEL YOUTUBE STREAM...";

  setTimeout(() => {
    simOverlay.classList.add('hidden');
    if (query) {
      browserFrame.src = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}`;
    } else {
      browserFrame.src = `https://www.youtube-nocookie.com/embed?listType=search&list=Cyberpunk+Music`;
    }
  }, 1000);
}

// Voice Search Engine
function startVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। Google Chrome ব্যবহার করুন।");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'bn-BD';
  gestureStatus.innerText = "🎙️ বলুন, শুনছি...";
  playCyberSound(1000, 0.08);

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    cyberInput.value = transcript;
    executeCyberSearch('google');
  };
}

// AI Camera & DSLR Filters
let activeFilter = 'beauty';
function toggleCamMode() {
  filterBar.classList.toggle('hidden');
  playCyberSound(1100, 0.05);
}

function applyCamFilter(filter) {
  activeFilter = filter;
  videoElement.className = `filter-${filter}`;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  playCyberSound(1200, 0.04);
}

// 3-Finger Gesture Detection & 3-Second Photo Countdown
let isCountingDown = false;

function triggerPhotoCountdown() {
  if (isCountingDown) return;
  isCountingDown = true;

  let count = 3;
  countdownOverlay.classList.remove('hidden');
  countdownNum.innerText = count;
  playCyberSound(1200, 0.1);

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownNum.innerText = count;
      playCyberSound(1000, 0.08);
    } else {
      clearInterval(timer);
      countdownOverlay.classList.add('hidden');
      captureHDPhoto();
      isCountingDown = false;
    }
  }, 1000);
}

function captureHDPhoto() {
  playCyberSound(1500, 0.2);
  const snapCanvas = document.createElement('canvas');
  snapCanvas.width = videoElement.videoWidth || 1280;
  snapCanvas.height = videoElement.videoHeight || 720;
  const ctx = snapCanvas.getContext('2d');

  // Apply Beauty/DSLR filter directly to canvas photo
  if (activeFilter === 'beauty') ctx.filter = 'brightness(112%) contrast(108%) saturate(120%)';
  if (activeFilter === 'dslr') ctx.filter = 'brightness(105%) contrast(120%) saturate(110%)';
  if (activeFilter === 'neon') ctx.filter = 'hue-rotate(180deg) saturate(200%)';
  if (activeFilter === 'bw') ctx.filter = 'grayscale(100%) contrast(150%)';

  ctx.drawImage(videoElement, 0, 0, snapCanvas.width, snapCanvas.height);

  // Auto Download Photo
  const link = document.createElement('a');
  link.download = `Cyber_AI_Photo_${Date.now()}.png`;
  link.href = snapCanvas.toDataURL('image/png');
  link.click();
  gestureStatus.innerText = "📸 HD ছবি ডাউনলোড হয়েছে!";
}

// Clean Virtual Keyboard Layout (Only ⌫)
function openKeyboard() {
  keyboardContainer.classList.remove('hidden');
  playCyberSound(950, 0.05);
}

cyberInput.addEventListener('click', openKeyboard);

const fullKeys = [
  '1','2','3','4','5','6','7','8','9','0',
  'Q','W','E','R','T','Y','U','I','O','P',
  'A','S','D','F','G','H','J','K','L','⌫',
  'Z','X','C','V','B','N','M','SPACE','CLOSE'
];

fullKeys.forEach(key => {
  const btn = document.createElement('div');
  btn.className = 'key-btn';
  btn.innerText = key;

  if(key === 'SPACE') btn.style.gridColumn = 'span 2';
  if(key === 'CLOSE') { btn.style.gridColumn = 'span 2'; btn.style.borderColor = '#ff0055'; }
  if(key === '⌫') { btn.style.color = '#ffea00'; btn.style.borderColor = '#ffea00'; }

  btn.onclick = () => handleKeyPress(key);
  keyboardContainer.appendChild(btn);
});

function handleKeyPress(key) {
  playCyberSound(850, 0.04);
  if (key === '⌫') {
    cyberInput.value = cyberInput.value.slice(0, -1);
  } else if (key === 'SPACE') {
    cyberInput.value += ' ';
  } else if (key === 'CLOSE') {
    keyboardContainer.classList.add('hidden');
  } else {
    cyberInput.value += key;
  }
}

// IoT Automation Controller
const iotState = { light: false, fan: false, ac: false };
function toggleIoT(device) {
  iotState[device] = !iotState[device];
  const btn = document.getElementById(`${device}Btn`);
  const status = iotState[device] ? 'ON' : 'OFF';
  btn.classList.toggle('active', iotState[device]);
  btn.innerText = `${device.toUpperCase()}: ${status}`;
  playCyberSound(iotState[device] ? 1200 : 500, 0.06);
}

// Metrics Update
setInterval(() => {
  const now = new Date();
  document.getElementById('timeWidget').innerText = `⏱️ ${now.toLocaleTimeString()}`;
}, 1000);

if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    const updateBat = () => {
      document.getElementById('batteryWidget').innerText = `🔋 Battery: ${Math.round(battery.level * 100)}%`;
    };
    updateBat();
    battery.addEventListener('levelchange', updateBat);
  });
}

// Matrix Cyber Effect
const matrixCanvas = document.getElementById('matrixCanvas');
const mCtx = matrixCanvas.getContext('2d');
function resizeMatrix() {
  matrixCanvas.width = matrixCanvas.offsetWidth;
  matrixCanvas.height = matrixCanvas.offsetHeight;
}
resizeMatrix();

const chars = "01CYBERHUD60";
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

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

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

      processGestures(landmarks);
    }
  }
  canvasCtx.restore();
}

function processGestures(landmarks) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];

  cursorX += ((1 - indexTip.x) * window.innerWidth - cursorX) * 0.35;
  const cursorY_target = indexTip.y * window.innerHeight;
  cursorY += (cursorY_target - cursorY) * 0.35;

  yellowCursor.style.left = `${cursorX}px`;
  yellowCursor.style.top = `${cursorY}px`;

  // Finger Counting Logic for 3-Finger Snap Trigger
  const isIndexUp = landmarks[8].y < landmarks[6].y;
  const isMiddleUp = landmarks[12].y < landmarks[10].y;
  const isRingUp = landmarks[16].y < landmarks[14].y;
  const isPinkyDown = landmarks[20].y > landmarks[18].y;

  // 3 Fingers Up Detection
  if (isIndexUp && isMiddleUp && isRingUp && isPinkyDown) {
    gestureStatus.innerText = "📸 ৩টি আঙুল ডিটেক্টেড! কাউন্টডাউন শুরু...";
    triggerPhotoCountdown();
  }

  // Air Click (Pinch)
  const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
  if (distance < 0.042) {
    yellowCursor.classList.add('pinched');
  } else {
    yellowCursor.classList.remove('pinched');
  }
}

function showDevInfo() { devModal.style.display = 'flex'; }
function hideDevInfo() { devModal.style.display = 'none'; }

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
