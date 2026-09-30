const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const keyboardContainer = document.getElementById('keyboard');
const yellowCursor = document.getElementById('yellowCursor');
const gestureStatus = document.getElementById('gesture-status');
const devModal = document.getElementById('devModal');
const simOverlay = document.getElementById('cyberSimOverlay');
const simText = document.getElementById('simText');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNum = document.getElementById('countdownNum');
const filterBar = document.getElementById('filterBar');
const codeLogConsole = document.getElementById('codeLogConsole');
const trackingStatusText = document.getElementById('trackingStatusText');

// System Tracking & Logging States
let isTrackingActive = true;
let currentFacingMode = 'user'; // 'user' = Front, 'environment' = Back
let behaviorLogs = [];
let mediaStream = null;

// Audio Synthesizer
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

// 1. FRONT / REAR CAMERA SWITCH FEATURE
async function startCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: currentFacingMode,
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  };

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = mediaStream;
    appendConsoleLog(`[CAMERA] Switched to ${currentFacingMode.toUpperCase()} camera.`, 'text-yellow');
  } catch (err) {
    appendConsoleLog(`[CAMERA ERROR] Could not access camera: ${err.message}`, 'text-red');
  }
}

function switchCamera() {
  currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
  playCyberSound(1100, 0.06);
  startCamera();
}

// 2. TRACKING ON / OFF FEATURE
function toggleTracking() {
  isTrackingActive = !isTrackingActive;
  const btn = document.getElementById('trackingToggleBtn');

  if (isTrackingActive) {
    btn.innerText = "⏹️ Tracking: ON";
    btn.style.borderColor = "#00ff66";
    btn.style.color = "#00ff66";
    trackingStatusText.innerText = "🟡 AI EMOTION & ANGER HUD ACTIVE";
    appendConsoleLog("[TRACKING] Real-time AI Emotion Analysis RESUMED.", 'text-cyan');
    playCyberSound(1000, 0.08);
  } else {
    btn.innerText = "▶️ Tracking: OFF";
    btn.style.borderColor = "#ff0055";
    btn.style.color = "#ff0055";
    trackingStatusText.innerText = "🔴 TRACKING PAUSED";
    appendConsoleLog("[TRACKING] Detection paused by operator.", 'text-red');
    playCyberSound(400, 0.08);
  }
}

// 3. EXPORT / DOWNLOAD XML DATA FEATURE
function downloadXMLData() {
  playCyberSound(1400, 0.1);
  if (behaviorLogs.length === 0) {
    alert("ডাউনলোড করার মতো কোনো বিহেভিয়ার ডাটা জমা হয়নি!");
    return;
  }

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += '<CyberHUD_BehaviorAnalyticsLogs>\n';
  xmlContent += `  <MetaInfo>\n`;
  xmlContent += `    <Developer>Mohammad Billal Hossain (Shakil)</Developer>\n`;
  xmlContent += `    <TotalEntries>${behaviorLogs.length}</TotalEntries>\n`;
  xmlContent += `  </MetaInfo>\n`;
  xmlContent += '  <DataLogs>\n';

  behaviorLogs.forEach(log => {
    xmlContent += `    <LogEntry>\n`;
    xmlContent += `      <Timestamp>${log.timestamp}</Timestamp>\n`;
    xmlContent += `      <TargetID>${log.id}</TargetID>\n`;
    xmlContent += `      <Emotion>${log.emotion}</Emotion>\n`;
    xmlContent += `      <AngerScore>${log.score}</AngerScore>\n`;
    xmlContent += `      <MouthMetric>${log.mouthMetric}</MouthMetric>\n`;
    xmlContent += `      <BrowMetric>${log.browMetric}</BrowMetric>\n`;
    xmlContent += `    </LogEntry>\n`;
  });

  xmlContent += '  </DataLogs>\n';
  xmlContent += '</CyberHUD_BehaviorAnalyticsLogs>';

  const blob = new Blob([xmlContent], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cyber_AI_Emotion_Logs_${Date.now()}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  appendConsoleLog(`[EXPORT] ${behaviorLogs.length} XML Log records successfully exported!`, 'text-yellow');
}

// Helper: Append log to top screen console
function appendConsoleLog(msg, colorClass = '') {
  const line = document.createElement('div');
  line.className = `log-line ${colorClass}`;
  line.innerText = msg;
  codeLogConsole.appendChild(line);

  if (codeLogConsole.childNodes.length > 80) {
    codeLogConsole.removeChild(codeLogConsole.firstChild);
  }
  codeLogConsole.scrollTop = codeLogConsole.scrollHeight;
}

// Search Simulation
function executeCyberSearch(type) {
  playCyberSound(900, 0.06);
  const query = cyberInput.value.trim() || "AI Behavior Analysis";
  keyboardContainer.classList.add('hidden');
  appendConsoleLog(`[SEARCH] Query initialized: "${query}"`, 'text-cyan');
}

function startVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("ক্রোম ব্রাউজার ব্যবহার করুন।");
  const recognition = new SpeechRecognition();
  recognition.lang = 'bn-BD';
  gestureStatus.innerText = "🎙️ বলুন, শুনছি...";
  playCyberSound(1000, 0.08);

  recognition.start();
  recognition.onresult = (event) => {
    cyberInput.value = event.results[0][0].transcript;
    executeCyberSearch('google');
  };
}

let activeFilter = 'beauty';
function applyCamFilter(filter) {
  activeFilter = filter;
  videoElement.className = `filter-${filter}`;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  playCyberSound(1200, 0.04);
}

let isCountingDown = false;
function triggerPhotoCountdown() {
  if (isCountingDown) return;
  isCountingDown = true;
  let count = 3;
  countdownOverlay.classList.remove('hidden');
  countdownNum.innerText = count;

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

  if (activeFilter === 'beauty') ctx.filter = 'brightness(112%) contrast(108%) saturate(120%)';
  if (activeFilter === 'dslr') ctx.filter = 'brightness(105%) contrast(120%) saturate(110%)';
  if (activeFilter === 'neon') ctx.filter = 'hue-rotate(180deg) saturate(200%)';
  if (activeFilter === 'bw') ctx.filter = 'grayscale(100%) contrast(150%)';

  ctx.drawImage(videoElement, 0, 0, snapCanvas.width, snapCanvas.height);
  const link = document.createElement('a');
  link.download = `Cyber_AI_Photo_${Date.now()}.png`;
  link.href = snapCanvas.toDataURL('image/png');
  link.click();
  gestureStatus.innerText = "📸 HD ছবি ডাউনলোড হয়েছে!";
}

// Keyboard Controls
function openKeyboard() { keyboardContainer.classList.remove('hidden'); }
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
  if (key === '⌫') cyberInput.value = cyberInput.value.slice(0, -1);
  else if (key === 'SPACE') cyberInput.value += ' ';
  else if (key === 'CLOSE') keyboardContainer.classList.add('hidden');
  else cyberInput.value += key;
}

const iotState = { light: false, fan: false, ac: false };
function toggleIoT(device) {
  iotState[device] = !iotState[device];
  const btn = document.getElementById(`${device}Btn`);
  btn.classList.toggle('active', iotState[device]);
  btn.innerText = `${device.toUpperCase()}: ${iotState[device] ? 'ON' : 'OFF'}`;
  playCyberSound(iotState[device] ? 1200 : 500, 0.06);
}

setInterval(() => {
  document.getElementById('timeWidget').innerText = `⏱️ ${new Date().toLocaleTimeString()}`;
}, 1000);

// Matrix Background Effect
const matrixCanvas = document.getElementById('matrixCanvas');
const mCtx = matrixCanvas.getContext('2d');
matrixCanvas.width = 640;
matrixCanvas.height = 480;
const drops = Array(25).fill(1);
function drawMatrix() {
  mCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
  mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  mCtx.fillStyle = "#00f3ff";
  mCtx.font = "10px monospace";
  drops.forEach((y, i) => {
    mCtx.fillText("01CYBERHUD80"[Math.floor(Math.random() * 12)], i * 12, y * 12);
    if (y * 12 > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  });
}

// MediaPipe Machine Learning Engine
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 0 });

const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
faceMesh.setOptions({ maxNumFaces: 2, refineLandmarks: false });

let handResults = null;
let faceResults = null;

hands.onResults(r => handResults = r);
faceMesh.onResults(r => faceResults = r);

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

async function processFrame() {
  if (videoElement.readyState >= 2) {
    await hands.send({ image: videoElement });
    await faceMesh.send({ image: videoElement });
  }
  renderLoop();
  requestAnimationFrame(processFrame);
}

function renderLoop() {
  drawMatrix();
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  let faceCenters = [];

  // Face Detection & Realtime Data Generation
  if (isTrackingActive && faceResults && faceResults.multiFaceLandmarks) {
    faceResults.multiFaceLandmarks.forEach((landmarks, index) => {
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      landmarks.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });

      const w = canvasElement.width;
      const h = canvasElement.height;
      const x1 = minX * w;
      const y1 = minY * h;
      const boxW = (maxX - minX) * w;
      const boxH = (maxY - minY) * h;

      faceCenters.push({ x: x1 + boxW / 2, y: y1 + boxH / 2 });

      // Landmark Measurements
      const mouthDist = Math.hypot(landmarks[13].x - landmarks[14].x, landmarks[13].y - landmarks[14].y);
      const browDist = Math.hypot(landmarks[70].x - landmarks[300].x, landmarks[70].y - landmarks[300].y);

      let angerScore = Math.min(100, Math.max(10, Math.round((browDist * 200) + (mouthDist * 300))));
      let statusText = "CALM";
      let statusColor = "#00ff66";

      if (angerScore > 75) {
        statusText = "ANGER DETECTED";
        statusColor = "#ff1100";
      } else if (angerScore > 45) {
        statusText = "ESCALATING";
        statusColor = "#ffea00";
      }

      // Draw Target Bounding Box
      canvasCtx.strokeStyle = statusColor;
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(x1, y1, boxW, boxH);

      canvasCtx.fillStyle = statusColor;
      canvasCtx.fillRect(x1, y1 - 18, boxW, 18);
      canvasCtx.fillStyle = "#000";
      canvasCtx.font = "bold 9px monospace";
      canvasCtx.fillText(`ID: 0${index + 1} | ${statusText} | ${angerScore}%`, x1 + 4, y1 - 5);

      updateSidebarHUD(index + 1, statusText, angerScore, statusColor);

      // Save and stream live behavior log entry (Every ~30 frames)
      if (Math.random() < 0.05) {
        const time = new Date().toLocaleTimeString();
        const logData = {
          timestamp: new Date().toISOString(),
          id: `TARGET_0${index + 1}`,
          emotion: statusText,
          score: angerScore,
          mouthMetric: mouthDist.toFixed(4),
          browMetric: browDist.toFixed(4)
        };
        behaviorLogs.push(logData);

        const colorClass = (angerScore > 75) ? 'text-red' : (angerScore > 45) ? 'text-yellow' : 'text-cyan';
        appendConsoleLog(`[${time}] ID_0${index + 1} | EMOTION:${statusText} | SCORE:${angerScore}/100 | BROW_DIST:${logData.browMetric}`, colorClass);
      }
    });

    if (faceCenters.length >= 2) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(faceCenters[0].x, faceCenters[0].y);
      canvasCtx.lineTo(faceCenters[1].x, faceCenters[1].y);
      canvasCtx.strokeStyle = "#ffea00";
      canvasCtx.lineWidth = 1.5;
      canvasCtx.setLineDash([4, 4]);
      canvasCtx.stroke();
      canvasCtx.setLineDash([]);
    }
  }

  // Hand Tracking Controls
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      cursorX += ((1 - indexTip.x) * window.innerWidth - cursorX) * 0.35;
      cursorY += (indexTip.y * window.innerHeight - cursorY) * 0.35;

      yellowCursor.style.left = `${cursorX}px`;
      yellowCursor.style.top = `${cursorY}px`;

      const isIndexUp = landmarks[8].y < landmarks[6].y;
      const isMiddleUp = landmarks[12].y < landmarks[10].y;
      const isRingUp = landmarks[16].y < landmarks[14].y;
      const isPinkyDown = landmarks[20].y > landmarks[18].y;

      if (isIndexUp && isMiddleUp && isRingUp && isPinkyDown) {
        triggerPhotoCountdown();
      }

      if (Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y) < 0.042) {
        yellowCursor.classList.add('pinched');
      } else {
        yellowCursor.classList.remove('pinched');
      }
    }
  }
  canvasCtx.restore();
}

function updateSidebarHUD(id, status, score, color) {
  const statusElem = document.getElementById(`hudStatus${id}`);
  const barElem = document.getElementById(`hudBar${id}`);
  const scoreElem = document.getElementById(`hudScore${id}`);

  if (statusElem && barElem && scoreElem) {
    statusElem.innerText = status;
    statusElem.style.color = color;
    barElem.style.width = `${score}%`;
    barElem.style.backgroundColor = color;
    scoreElem.innerText = `Score: ${score}/100`;
  }
}

function showDevInfo() { devModal.style.display = 'flex'; }
function hideDevInfo() { devModal.style.display = 'none'; }

// Start Initial Setup
startCamera();
requestAnimationFrame(processFrame);
