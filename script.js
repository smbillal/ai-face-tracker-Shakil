const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const gestureText = document.getElementById('gesture-detected');
const devModal = document.getElementById('devModal');

// Virtual Keyboard Layout Generation
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
  if (key === 'BKSP') {
    cyberInput.value = cyberInput.value.slice(0, -1);
  } else if (key === 'SPACE') {
    cyberInput.value += ' ';
  } else {
    cyberInput.value += key;
  }
}

// MediaPipe Setup for High Performance
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0, // 0 = Fast Speed, Lightweight
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: false, // Turned off for higher FPS
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

let handResults = null;
let faceResults = null;

hands.onResults((results) => { handResults = results; });
faceMesh.onResults((results) => { faceResults = results; });

// Draw and Process Frame Loop
function renderLoop() {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // 1. Draw Face Mesh
  if (faceResults && faceResults.multiFaceLandmarks) {
    for (const landmarks of faceResults.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#00f3ff22', lineWidth: 1});
    }
  }

  // 2. Draw Hand & Detect Gestures
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#ff0055', lineWidth: 2});
      drawLandmarks(canvasCtx, landmarks, {color: '#00f3ff', lineWidth: 1, radius: 2});

      processGestures(landmarks);
    }
  }
  
  canvasCtx.restore();
}

// Gesture Detection Logic
let lastActionTime = 0;
function processGestures(landmarks) {
  const now = Date.now();
  if (now - lastActionTime < 1500) return; // Cooldown to prevent duplicate triggers

  // Check Extended Fingers
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  // Rule 1: Exactly 3 fingers up (Index + Middle + Ring) -> Screenshot
  if (indexUp && middleUp && ringUp && !pinkyUp) {
    gestureText.innerText = "গেচার: ৩ আঙুল (স্ক্রিনশট)";
    takeScreenshot();
    lastActionTime = now;
  }
  
  // Rule 2: Only Middle finger up -> Developer Info
  else if (middleUp && !indexUp && !ringUp && !pinkyUp) {
    gestureText.innerText = "গেচার: মাঝের আঙুল (ডেভলপার ইনফো)";
    showDevInfo();
    lastActionTime = now;
  }
}

// Functions
function takeScreenshot() {
  alert("📸 স্ক্রিনশট নেওয়া হয়েছে!");
}

function showDevInfo() {
  devModal.style.display = 'flex';
}

function hideDevInfo() {
  devModal.style.display = 'none';
}

// Camera Optimization Setup
const camera = new Camera(videoElement, {
  onFrame: async () => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    // Fast parallel processing
    await hands.send({image: videoElement});
    await faceMesh.send({image: videoElement});
    
    renderLoop();
  },
  width: 640,
  height: 480
});
camera.start();

// Voice Command Recognition (Bangla)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'bn-BD';
  recognition.continuous = true;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    console.log("Voice Command:", transcript);
    
    if (transcript.includes("ডেভলপারের তথ্য") || transcript.includes("ডেভেলপার")) {
      showDevInfo();
    }
  };

  recognition.start();
} else {
  document.getElementById('voice-status').innerText = "🎙️ ভয়েস সাপোর্ট নেই";
  }
