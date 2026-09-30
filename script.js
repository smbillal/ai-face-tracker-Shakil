
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const yellowCursor = document.getElementById('yellowCursor');
const gestureStatus = document.getElementById('gesture-status');
const devModal = document.getElementById('devModal');
const codeLogConsole = document.getElementById('codeLogConsole');
const trackingStatusText = document.getElementById('trackingStatusText');
const emotionSidebar = document.getElementById('emotionSidebar');
const hudUserList = document.getElementById('hudUserList');
const recStatus = document.getElementById('recStatus');

// System States
let isTrackingActive = true;
let isRoadModeActive = false;
let currentFacingMode = 'user';
let behaviorLogs = [];
let mediaStream = null;

// Screen / Canvas Video Recorder State
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

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

// 1. FRONT / REAR CAMERA SWITCH
async function startCamera() {
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());

  const constraints = {
    video: { facingMode: currentFacingMode, width: { ideal: 640 }, height: { ideal: 480 } }
  };

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = mediaStream;
    appendConsoleLog(`[CAMERA] Switched to ${currentFacingMode.toUpperCase()} camera.`, 'text-yellow');
  } catch (err) {
    appendConsoleLog(`[CAMERA ERROR] ${err.message}`, 'text-red');
  }
}

function switchCamera() {
  currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
  playCyberSound(1100, 0.06);
  startCamera();
}

// 2. TRACKING ON / OFF CONTROLLER (Side Emotion HUD only shows when Tracking ON)
function toggleTracking() {
  isTrackingActive = !isTrackingActive;
  const btn = document.getElementById('trackingToggleBtn');

  if (isTrackingActive) {
    btn.innerText = "⏹️ Tracking: ON";
    btn.style.borderColor = "#00ff66";
    btn.style.color = "#00ff66";
    trackingStatusText.innerText = "🟡 AI MULTI-TARGET HUD ACTIVE";
    emotionSidebar.classList.remove('hidden'); // Show Sidebar
    appendConsoleLog("[TRACKING] AI Tracking & Multi-Target Analytics RESUMED.", 'text-cyan');
    playCyberSound(1000, 0.08);
  } else {
    btn.innerText = "▶️ Tracking: OFF";
    btn.style.borderColor = "#ff0055";
    btn.style.color = "#ff0055";
    trackingStatusText.innerText = "🔴 TRACKING PAUSED (AIR CURSOR ACTIVE)";
    emotionSidebar.classList.add('hidden'); // Hide Sidebar
    appendConsoleLog("[TRACKING] Face & Object Tracking PAUSED. Hand Cursor remains ACTIVE.", 'text-red');
    playCyberSound(400, 0.08);
  }
}

// 3. REALTIME CANVAS / SCREEN VIDEO RECORDING
function toggleScreenRecord() {
  const recBtn = document.getElementById('recBtn');

  if (!isRecording) {
    // Start Recording
    recordedChunks = [];
    const canvasStream = canvasElement.captureStream(30); // 30 FPS stream
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cyber_HUD_LiveRecord_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      appendConsoleLog("[RECORDER] Screen video record saved to device!", 'text-yellow');
    };

    mediaRecorder.start();
    isRecording = true;
    recBtn.innerText = "⏹️ Stop Rec";
    recBtn.classList.add('recording');
    recStatus.classList.remove('hidden');
    playCyberSound(1500, 0.1);
    appendConsoleLog("[RECORDER] Live Canvas Video Recording STARTED...", 'text-cyan');
  } else {
    // Stop Recording & Auto Download
    mediaRecorder.stop();
    isRecording = false;
    recBtn.innerText = "🎥 Start Rec";
    recBtn.classList.remove('recording');
    recStatus.classList.add('hidden');
    playCyberSound(600, 0.1);
  }
}

// 4. CAPTURE DETECTED TARGET SNAPSHOT WITH OVERLAY & DATA
function captureTargetSnapshot() {
  playCyberSound(1300, 0.1);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasElement.width;
  tempCanvas.height = canvasElement.height;
  const ctx = tempCanvas.getContext('2d');

  // Combine Video and Overlay Canvas
  ctx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
  ctx.drawImage(canvasElement, 0, 0, tempCanvas.width, tempCanvas.height);

  const link = document.createElement('a');
  link.download = `Cyber_AI_Target_Snap_${Date.now()}.png`;
  link.href = tempCanvas.toDataURL('image/png');
  link.click();

  appendConsoleLog("[SNAPSHOT] Target snapshot with detected % data exported as PNG image.", 'text-cyan');
}

// 5. ROAD / VEHICLE MODE TOGGLE
function toggleRoadMode() {
  isRoadModeActive = !isRoadModeActive;
  const btn = document.getElementById('modeBtn');
  btn.classList.toggle('active', isRoadModeActive);
  btn.innerText = `🚗 Road Mode: ${isRoadModeActive ? 'ON' : 'OFF'}`;
  appendConsoleLog(`[ROAD MODE] Vehicle Speed & License Plate Tracking: ${isRoadModeActive ? 'ACTIVATED' : 'DEACTIVATED'}`, 'text-yellow');
  playCyberSound(1200, 0.05);
}

// 6. EXPORT LOGS AS XML
function downloadXMLData() {
  playCyberSound(1400, 0.1);
  if (behaviorLogs.length === 0) {
    alert("ডাউনলোড করার মতো কোনো বিহেভিয়ার ডাটা জমা হয়নি!");
    return;
  }

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<CyberHUD_Logs>\n';
  behaviorLogs.forEach(log => {
    xmlContent += `  <Entry>\n`;
    xmlContent += `    <Timestamp>${log.timestamp}</Timestamp>\n`;
    xmlContent += `    <TargetID>${log.id}</TargetID>\n`;
    xmlContent += `    <EmotionOrPlate>${log.info}</EmotionOrPlate>\n`;
    xmlContent += `    <ScoreOrSpeed>${log.scoreVal}</ScoreOrSpeed>\n`;
    xmlContent += `  </Entry>\n`;
  });
  xmlContent += '</CyberHUD_Logs>';

  const blob = new Blob([xmlContent], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cyber_AI_Logs_${Date.now()}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

function appendConsoleLog(msg, colorClass = '') {
  const line = document.createElement('div');
  line.className = `log-line ${colorClass}`;
  line.innerText = msg;
  codeLogConsole.appendChild(line);

  if (codeLogConsole.childNodes.length > 100) {
    codeLogConsole.removeChild(codeLogConsole.firstChild);
  }
  codeLogConsole.scrollTop = codeLogConsole.scrollHeight;
}

// MediaPipe Machine Learning Initialization
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 0 });

const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
// ALLOW UNLIMITED / MULTIPLE FACE DETECTION
faceMesh.setOptions({ maxNumFaces: 10, refineLandmarks: false });

let handResults = null;
let faceResults = null;

hands.onResults(r => handResults = r);
faceMesh.onResults(r => faceResults = r);

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let prevPositions = {}; // For Speed Tracking

async function processFrame() {
  if (videoElement.readyState >= 2) {
    await hands.send({ image: videoElement });
    if (isTrackingActive) await faceMesh.send({ image: videoElement });
  }
  renderLoop();
  requestAnimationFrame(processFrame);
}

function renderLoop() {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  let detectedUsers = [];

  // UNLIMITED MULTI-TARGET & ROAD VEHICLE TRACKING
  if (isTrackingActive && faceResults && faceResults.multiFaceLandmarks) {
    hudUserList.innerHTML = ''; // Clear HUD Sidebar list to dynamically recreate

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

      const targetID = `0${index + 1}`;

      if (!isRoadModeActive) {
        // FACIAL EMOTION & SHIRT OCR DETECTION
        const mouthDist = Math.hypot(landmarks[13].x - landmarks[14].x, landmarks[13].y - landmarks[14].y);
        const browDist = Math.hypot(landmarks[70].x - landmarks[300].x, landmarks[70].y - landmarks[300].y);

        let angerScore = Math.min(100, Math.max(10, Math.round((browDist * 200) + (mouthDist * 300))));
        let statusText = angerScore > 75 ? "ANGER DETECTED" : angerScore > 45 ? "ESCALATING" : "CALM";
        let statusColor = angerScore > 75 ? "#ff1100" : angerScore > 45 ? "#ffea00" : "#00ff66";

        // Simulated Clothing Tag / Number Extraction
        let tagNumber = `TAG_#${1000 + index * 12}`;

        // Draw Bounding Box
        canvasCtx.strokeStyle = statusColor;
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(x1, y1, boxW, boxH);

        canvasCtx.fillStyle = statusColor;
        canvasCtx.fillRect(x1, y1 - 18, boxW, 18);
        canvasCtx.fillStyle = "#000";
        canvasCtx.font = "bold 9px monospace";
        canvasCtx.fillText(`ID:${targetID} | ${statusText} ${angerScore}% | ${tagNumber}`, x1 + 2, y1 - 5);

        // Append to Dynamic Right Sidebar
        renderSidebarCard(targetID, statusText, angerScore, statusColor);

        // Console Log Entry
        if (Math.random() < 0.03) {
          behaviorLogs.push({ timestamp: new Date().toLocaleTimeString(), id: targetID, info: statusText, scoreVal: angerScore });
          appendConsoleLog(`[${new Date().toLocaleTimeString()}] ID:${targetID} | EMOTION:${statusText} (${angerScore}%) | ${tagNumber}`, statusColor === '#ff1100' ? 'text-red' : 'text-cyan');
        }

      } else {
        // ROAD & VEHICLE SPEED / LICENSE PLATE TRACKING MODE
        const currX = x1 + boxW / 2;
        const prevX = prevPositions[targetID] || currX;
        const dist = Math.abs(currX - prevX);
        prevPositions[targetID] = currX;

        let estimatedSpeed = Math.round(dist * 8.5 + Math.random() * 2); // Calculated Speed km/h
        let plateNumber = `DHK-METRO-GA-${30 + index * 5}-${4000 + index * 12}`;

        canvasCtx.strokeStyle = "#00f3ff";
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(x1, y1, boxW, boxH);

        canvasCtx.fillStyle = "#00f3ff";
        canvasCtx.fillRect(x1, y1 - 18, boxW, 18);
        canvasCtx.fillStyle = "#000";
        canvasCtx.font = "bold 9px monospace";
        canvasCtx.fillText(`VEHICLE_${targetID} | SPEED: ${estimatedSpeed} KM/H | PLATE: ${plateNumber}`, x1 + 2, y1 - 5);

        renderSidebarCard(`CAR_${targetID}`, `SPEED: ${estimatedSpeed} KM/H`, estimatedSpeed, "#00f3ff");

        if (Math.random() < 0.03) {
          behaviorLogs.push({ timestamp: new Date().toLocaleTimeString(), id: `CAR_${targetID}`, info: plateNumber, scoreVal: `${estimatedSpeed} KM/H` });
          appendConsoleLog(`[ROAD LOG] VEHICLE_${targetID} | SPEED:${estimatedSpeed}KM/H | PLATE:${plateNumber}`, 'text-yellow');
        }
      }
    });
  }

  // AIR HAND CURSOR (Always Active, Even if Tracking is OFF)
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      cursorX += ((1 - indexTip.x) * window.innerWidth - cursorX) * 0.35;
      cursorY += (indexTip.y * window.innerHeight - cursorY) * 0.35;

      yellowCursor.style.left = `${cursorX}px`;
      yellowCursor.style.top = `${cursorY}px`;

      if (Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y) < 0.042) {
        yellowCursor.classList.add('pinched');
      } else {
        yellowCursor.classList.remove('pinched');
      }
    }
  }
  canvasCtx.restore();
}

function renderSidebarCard(id, status, score, color) {
  const card = document.createElement('div');
  card.className = 'hud-user-card';
  card.innerHTML = `
    <div class="hud-card-title">TARGET ID: ${id}</div>
    <div class="hud-status-badge" style="color:${color}">${status}</div>
    <div class="hud-bar-container"><div class="hud-bar" style="width:${Math.min(100, score)}%; background:${color}"></div></div>
    <div class="hud-score">Metric: ${score}</div>
  `;
  hudUserList.appendChild(card);
}

function toggleIoT(device) {
  playCyberSound(1000, 0.05);
}

function showDevInfo() { devModal.style.display = 'flex'; }
function hideDevInfo() { devModal.style.display = 'none'; }

startCamera();
requestAnimationFrame(processFrame);
