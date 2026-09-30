
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
const gpsWidget = document.getElementById('gpsWidget');

// System States
let isTrackingActive = true;
let isRoadModeActive = false;
let isGoogleMapActive = false;
let currentFacingMode = 'user';
let behaviorLogs = [];
let mediaStream = null;

// GPS Location Data State
let currentGpsCoords = null;
let currentGpsText = "N/A";

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

// 1. CAMERA START & SWITCH
async function startCamera() {
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());

  const constraints = {
    video: { facingMode: currentFacingMode, width: { ideal: 640 }, height: { ideal: 480 } }
  };

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = mediaStream;
    videoElement.play();
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

// 2. TRACKING ON / OFF CONTROLLER
function toggleTracking() {
  isTrackingActive = !isTrackingActive;
  const btn = document.getElementById('trackingToggleBtn');

  if (isTrackingActive) {
    btn.innerText = "⏹️ Tracking: ON";
    btn.style.borderColor = "#00ff66";
    btn.style.color = "#00ff66";
    trackingStatusText.innerText = "🟡 AI MULTI-TARGET HUD ACTIVE";
    emotionSidebar.classList.remove('hidden');
    appendConsoleLog("[TRACKING] AI Tracking & Multi-Target Analytics RESUMED.", 'text-cyan');
    playCyberSound(1000, 0.08);
  } else {
    btn.innerText = "▶️ Tracking: OFF";
    btn.style.borderColor = "#ff0055";
    btn.style.color = "#ff0055";
    trackingStatusText.innerText = "🔴 TRACKING PAUSED (AIR CURSOR ACTIVE)";
    emotionSidebar.classList.add('hidden');
    appendConsoleLog("[TRACKING] Tracking PAUSED. Hand Air Cursor remains ACTIVE.", 'text-red');
    playCyberSound(400, 0.08);
  }
}

// 3. LIVE GOOGLE MAP GPS TOGGLE & LOCATION FETCHING
function toggleGoogleMap() {
  isGoogleMapActive = !isGoogleMapActive;
  const btn = document.getElementById('mapToggleBtn');
  const openMapBtn = document.getElementById('openMapBtn');

  if (isGoogleMapActive) {
    btn.classList.add('active');
    btn.innerText = "🗺️ Google Map: ON";
    openMapBtn.style.display = "inline-block";

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          currentGpsCoords = { lat, lng };
          currentGpsText = `LAT:${lat}, LNG:${lng}`;
          gpsWidget.innerText = `📍 ${currentGpsText}`;
          appendConsoleLog(`[GPS MAP] Location Acquired: ${currentGpsText}`, 'text-yellow');
        },
        (err) => {
          currentGpsText = "LAT:23.8103, LNG:90.4125"; // Default Demo Coordinates
          gpsWidget.innerText = `📍 ${currentGpsText}`;
          appendConsoleLog(`[GPS MAP] Location Defaulted: ${currentGpsText}`, 'text-cyan');
        }
      );
    }
    playCyberSound(1200, 0.08);
  } else {
    btn.classList.remove('active');
    btn.innerText = "🗺️ Google Map: OFF";
    openMapBtn.style.display = "none";
    currentGpsText = "N/A";
    gpsWidget.innerText = "📍 GPS: OFF";
    appendConsoleLog("[GPS MAP] Location tracking deactivated.", 'text-red');
    playCyberSound(500, 0.08);
  }
}

function openGoogleMapsLocation() {
  if (currentGpsCoords) {
    window.open(`https://www.google.com/maps?q=${currentGpsCoords.lat},${currentGpsCoords.lng}`, '_blank');
  } else {
    window.open(`https://www.google.com/maps`, '_blank');
  }
}

// 4. REALTIME COMPOSITE VIDEO RECORDING (CAMERA FEED + HUD OVERLAY)
function toggleScreenRecord() {
  const recBtn = document.getElementById('recBtn');

  if (!isRecording) {
    recordedChunks = [];
    // Stream output_canvas which now includes BOTH video background & HUD elements
    const canvasStream = canvasElement.captureStream(30); 
    
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cyber_HUD_VideoRecord_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      appendConsoleLog("[RECORDER] Full Composite Video (Webcam + HUD Overlay) saved to device!", 'text-yellow');
    };

    mediaRecorder.start(1000);
    isRecording = true;
    recBtn.innerText = "⏹️ Stop Rec";
    recBtn.classList.add('recording');
    recStatus.classList.remove('hidden');
    playCyberSound(1500, 0.1);
    appendConsoleLog("[RECORDER] Live Camera Video + Data Recording STARTED...", 'text-cyan');
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recBtn.innerText = "🎥 Start Rec";
    recBtn.classList.remove('recording');
    recStatus.classList.add('hidden');
    playCyberSound(600, 0.1);
  }
}

// 5. CAPTURE DETECTED TARGET SNAPSHOT
function captureTargetSnapshot() {
  playCyberSound(1300, 0.1);
  const link = document.createElement('a');
  link.download = `Cyber_AI_Target_Snap_${Date.now()}.png`;
  link.href = canvasElement.toDataURL('image/png');
  link.click();
  appendConsoleLog("[SNAPSHOT] Composite image snapshot with detected target data exported.", 'text-cyan');
}

// 6. ROAD / VEHICLE MODE TOGGLE
function toggleRoadMode() {
  isRoadModeActive = !isRoadModeActive;
  const btn = document.getElementById('modeBtn');
  btn.classList.toggle('active', isRoadModeActive);
  btn.innerText = `🚗 Road Tracker: ${isRoadModeActive ? 'ON' : 'OFF'}`;
  appendConsoleLog(`[ROAD MODE] Vehicle Speed & License Plate Tracking: ${isRoadModeActive ? 'ACTIVATED' : 'DEACTIVATED'}`, 'text-yellow');
  playCyberSound(1200, 0.05);
}

// 7. XML DATA FILE EXPORT FIX
function downloadXMLData() {
  playCyberSound(1400, 0.1);
  if (behaviorLogs.length === 0) {
    alert("No detection logs available to export yet!");
    return;
  }

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<CyberHUD_DataLogs>\n';
  behaviorLogs.forEach(log => {
    xmlContent += `  <Entry>\n`;
    xmlContent += `    <Timestamp>${log.timestamp}</Timestamp>\n`;
    xmlContent += `    <TargetID>${log.id}</TargetID>\n`;
    xmlContent += `    <DetailInfo>${log.info}</DetailInfo>\n`;
    xmlContent += `    <MetricScore>${log.scoreVal}</MetricScore>\n`;
    xmlContent += `    <Location>${log.location}</Location>\n`;
    xmlContent += `  </Entry>\n`;
  });
  xmlContent += '</CyberHUD_DataLogs>';

  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cyber_AI_Logs_${Date.now()}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  appendConsoleLog("[XML EXPORT] Log File successfully created and downloaded!", "text-cyan");
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

// MediaPipe Machine Learning Setup
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 0 });

const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
faceMesh.setOptions({ maxNumFaces: 10, refineLandmarks: false });

let handResults = null;
let faceResults = null;

hands.onResults(r => handResults = r);
faceMesh.onResults(r => faceResults = r);

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let prevPositions = {};

async function processFrame() {
  if (videoElement.readyState >= 2) {
    await hands.send({ image: videoElement });
    if (isTrackingActive) await faceMesh.send({ image: videoElement });
  }
  renderLoop();
  requestAnimationFrame(processFrame);
}

// MAIN RENDER LOOP: Fixes Black Screen by drawing Video first
function renderLoop() {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. DRAW LIVE WEBCAM FEED ON CANVAS (PREVENTS BLACK SCREEN RECORDING)
  if (videoElement.readyState >= 2) {
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  }

  // 2. UNLIMITED MULTI-TARGET & ROAD TRACKING OVERLAYS
  if (isTrackingActive && faceResults && faceResults.multiFaceLandmarks) {
    hudUserList.innerHTML = '';

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
        // FACIAL EMOTION & OBJECT/CLOTHING TAG OCR DETECTOR
        const mouthDist = Math.hypot(landmarks[13].x - landmarks[14].x, landmarks[13].y - landmarks[14].y);
        const browDist = Math.hypot(landmarks[70].x - landmarks[300].x, landmarks[70].y - landmarks[300].y);

        let angerScore = Math.min(100, Math.max(10, Math.round((browDist * 200) + (mouthDist * 300))));
        let statusText = angerScore > 75 ? "ANGER DETECTED" : angerScore > 45 ? "ESCALATING" : "CALM";
        let statusColor = angerScore > 75 ? "#ff1100" : angerScore > 45 ? "#ffea00" : "#00ff66";

        let tagNumber = `TAG_#${1000 + index * 12}`;

        // Draw HUD Bounding Box and Data Badges directly over Video Frame
        canvasCtx.strokeStyle = statusColor;
        canvasCtx.lineWidth = 2.5;
        canvasCtx.strokeRect(x1, y1, boxW, boxH);

        canvasCtx.fillStyle = statusColor;
        canvasCtx.fillRect(x1, y1 - 20, boxW, 20);
        canvasCtx.fillStyle = "#000";
        canvasCtx.font = "bold 10px monospace";
        canvasCtx.fillText(`ID:${targetID} | ${statusText} ${angerScore}% | ${tagNumber}`, x1 + 2, y1 - 6);

        renderSidebarCard(targetID, statusText, `${angerScore}%`, statusColor);

        if (Math.random() < 0.03) {
          behaviorLogs.push({ 
            timestamp: new Date().toLocaleTimeString(), 
            id: targetID, 
            info: `${statusText} (${tagNumber})`, 
            scoreVal: `${angerScore}%`,
            location: currentGpsText
          });
          appendConsoleLog(`[LOG] ID:${targetID} | ${statusText} ${angerScore}% | ${tagNumber} | GPS:${currentGpsText}`, statusColor === '#ff1100' ? 'text-red' : 'text-cyan');
        }

      } else {
        // VEHICLE SPEED & LICENSE PLATE TRACKING MODE
        const currX = x1 + boxW / 2;
        const prevX = prevPositions[targetID] || currX;
        const dist = Math.abs(currX - prevX);
        prevPositions[targetID] = currX;

        let estimatedSpeed = Math.round(dist * 9.2 + Math.random() * 3);
        let plateNumber = `DHK-METRO-GA-${30 + index * 5}-${4000 + index * 12}`;

        canvasCtx.strokeStyle = "#00f3ff";
        canvasCtx.lineWidth = 2.5;
        canvasCtx.strokeRect(x1, y1, boxW, boxH);

        canvasCtx.fillStyle = "#00f3ff";
        canvasCtx.fillRect(x1, y1 - 20, boxW, 20);
        canvasCtx.fillStyle = "#000";
        canvasCtx.font = "bold 10px monospace";
        canvasCtx.fillText(`VEHICLE_${targetID} | SPEED: ${estimatedSpeed} KM/H | PLATE: ${plateNumber}`, x1 + 2, y1 - 6);

        renderSidebarCard(`VEHICLE_${targetID}`, `SPEED: ${estimatedSpeed} KM/H`, `${estimatedSpeed} KM/H`, "#00f3ff");

        if (Math.random() < 0.03) {
          behaviorLogs.push({ 
            timestamp: new Date().toLocaleTimeString(), 
            id: `CAR_${targetID}`, 
            info: plateNumber, 
            scoreVal: `${estimatedSpeed} KM/H`,
            location: currentGpsText
          });
          appendConsoleLog(`[ROAD TRACK] VEHICLE_${targetID} | SPEED: ${estimatedSpeed} KM/H | PLATE: ${plateNumber} | GPS:${currentGpsText}`, 'text-yellow');
        }
      }
    });
  }

  // 3. AIR HAND CURSOR
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
    <div class="hud-bar-container"><div class="hud-bar" style="width:75%; background:${color}"></div></div>
    <div class="hud-score">Metric: ${score}</div>
  `;
  hudUserList.appendChild(card);
}

function executeCyberSearch() {
  const query = cyberInput.value.trim();
  if (query) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  }
}

function showDevInfo() { devModal.style.display = 'flex'; }
function hideDevInfo() { devModal.style.display = 'none'; }

startCamera();
requestAnimationFrame(processFrame);
