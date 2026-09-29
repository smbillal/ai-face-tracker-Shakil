const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const gestureText = document.getElementById('gesture-detected');
const devModal = document.getElementById('devModal');

// Synthesized Cyber Audio Effect (No external mp3 required)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCyberSound(freq = 600, duration = 0.08) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Build Cyber Keyboard
const keys = ['1','2','3','4','5','6','7','8','9','0','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','SPACE','BKSP'];
const keyboardContainer = document.getElementById('keyboard');

keys.forEach(key => {
  const btn = document.createElement('div');
  btn.className = 'key-btn';
  btn.innerText = key;
  if(key === 'SPACE') btn.style.gridColumn = 'span 2';
  btn.onclick = () => handleKeyPress(key);
  keyboardContainer.appendChild(btn);
});

function handleKeyPress(key) {
  playCyberSound(800, 0.05);
  if (key === 'BKSP') {
    cyberInput.value = cyberInput.value.slice(0, -1);
  } else if (key === 'SPACE') {
    cyberInput.value += ' ';
  } else {
    cyberInput.value += key;
  }
}

// MediaPipe Setup (Fast & Responsive)
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.65,
  minTrackingConfidence: 0.65
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

function renderLoop() {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Render Face Mesh
  if (faceResults && faceResults.multiFaceLandmarks) {
    for (const landmarks of faceResults.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#00f3ff22', lineWidth: 1});
    }
  }

  // Render Hand Skeleton & Gesture Control
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#ff0055', lineWidth: 2});
      drawLandmarks(canvasCtx, landmarks, {color: '#00f3ff', lineWidth: 1, radius: 2});

      processGestures(landmarks);
    }
  }
  canvasCtx.restore();
}

// Gesture Recognition Logic
let lastActionTime = 0;
function processGestures(landmarks) {
  const now = Date.now();
  if (now - lastActionTime < 2000) return; // 2 seconds cooldown

  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  // 3 Fingers UP (Index + Middle + Ring) -> Real Screenshot
  if (indexUp && middleUp && ringUp && !pinkyUp) {
    gestureText.innerText = "গেচার: ৩ আঙুল [স্ক্রিনশট প্রসেসিং]";
    takeScreenshot();
    lastActionTime = now;
  }
  // Middle Finger ONLY UP -> Developer Info
  else if (middleUp && !indexUp && !ringUp && !pinkyUp) {
    gestureText.innerText = "গেচার: মাঝের আঙুল [ডেভলপার ইনফো]";
    showDevInfo();
    lastActionTime = now;
  }
}

// Action Functions
function takeScreenshot() {
  playCyberSound(1200, 0.2);
  const target = document.getElementById('captureTarget');
  html2canvas(target).then(canvas => {
    const link = document.createElement('a');
    link.download = 'cyber-hud-screenshot.png';
    link.href = canvas.toDataURL();
    link.click();
    gestureText.innerText = "গেচার: স্ক্রিনশট সফলভাবে সেভ হয়েছে!";
  });
}

function executeSearch() {
  playCyberSound(900, 0.1);
  const query = cyberInput.value.trim();
  if (query) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  } else {
    alert("অনুগ্রহ করে ব্রাউজ করার জন্য কিছু লিখুন!");
  }
}

function showDevInfo() {
  playCyberSound(1000, 0.15);
  devModal.style.display = 'flex';
}

function hideDevInfo() {
  playCyberSound(400, 0.08);
  devModal.style.display = 'none';
}

// Initialize Camera Frame Loop
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

// Voice Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'bn-BD';
  recognition.continuous = true;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    
    if (transcript.includes("ডেভলপারের তথ্য") || transcript.includes("ডেভেলপার")) {
      showDevInfo();
    } else if (transcript.includes("স্ক্রিনশট")) {
      takeScreenshot();
    } else if (transcript.includes("সার্চ")) {
      executeSearch();
    } else {
      cyberInput.value += ' ' + transcript;
    }
  };

  recognition.start();
} else {
  document.getElementById('voice-status').innerText = "🎙️ ভয়েস নট সাপোর্টেড";
                     }
