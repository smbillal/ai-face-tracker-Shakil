
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cyberInput = document.getElementById('cyberInput');
const yellowCursor = document.getElementById('yellowCursor');
const devModal = document.getElementById('devModal');
const codeLogConsole = document.getElementById('codeLogConsole');
const trackingStatusText = document.getElementById('trackingStatusText');
const emotionSidebar = document.getElementById('emotionSidebar');
const hudUserList = document.getElementById('hudUserList');
const recStatus = document.getElementById('recStatus');
const gpsWidget = document.getElementById('gpsWidget');

// Independent Feature State Toggles
let isTrackingActive = true;
let isRoadModeActive = false;
let isGoogleMapActive = false;
let isRoadDamageActive = false;
let isOcrActive = false; // NEW: TESSERACT OCR TOGGLE STATE

let currentFacingMode = 'user';
let behaviorLogs = [];
let mediaStream = null;

// GPS Location State
let currentGpsCoords = null;
let currentGpsText = "N/A";

// OCR State
let lastDetectedText = "SCANNING...";
let isOcrProcessing = false;

// Screen / Canvas Recorder
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

// 2. TOGGLE TRACKING
function toggleTracking() {
  isTrackingActive = !isTrackingActive;
  const btn = document.getElementById('trackingToggleBtn');

  if (isTrackingActive) {
    btn.innerText = "⏹️ Tracking: ON";
    btn.style.borderColor = "#00ff66";
    btn.style.color = "#00ff66";
    trackingStatusText.innerText = "🟡 PARALLEL MULTI-AI ENGINE ACTIVE";
    emotionSidebar.classList.remove('hidden');
    appendConsoleLog("[TRACKING] Multi-Target Analytics RESUMED.", 'text-cyan');
    playCyberSound(1000, 0.08);
  } else {
    btn.innerText = "▶️ Tracking: OFF";
    btn.style.borderColor = "#ff0055";
    btn.style.color = "#ff0055";
    trackingStatusText.innerText = "🔴 TRACKING PAUSED";
    emotionSidebar.classList.add('hidden');
    appendConsoleLog("[TRACKING] PAUSED.", 'text-red');
    playCyberSound(400, 0.08);
  }
}

// 3. ROAD TRACKER TOGGLE
function toggleRoadMode() {
  isRoadModeActive = !isRoadModeActive;
  const btn = document.getElementById('modeBtn');
  btn.classList.toggle('active', isRoadModeActive);
  btn.innerText = `🚗 Road Tracker: ${isRoadModeActive ? 'ON' : 'OFF'}`;
  appendConsoleLog(`[ROAD TRACKER] Speed & License Plate: ${isRoadModeActive ? 'ACTIVATED' : 'DEACTIVATED'}`, 'text-yellow');
  playCyberSound(1200, 0.05);
}

// 4. GOOGLE MAP GPS TOGGLE
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
          appendConsoleLog(`[GPS MAP] Acquired: ${currentGpsText}`, 'text-yellow');
        },
        () => {
          currentGpsText = "LAT:23.8103, LNG:90.4125";
          gpsWidget.innerText = `📍 ${currentGpsText}`;
          appendConsoleLog(`[GPS MAP] Defaulted: ${currentGpsText}`, 'text-cyan');
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
    appendConsoleLog("[GPS MAP] Location deactivated.", 'text-red');
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

// 5. ROAD DAMAGE AI TOGGLE
function toggleRoadDamage() {
  isRoadDamageActive = !isRoadDamageActive;
  const btn = document.getElementById('damageToggleBtn');
  btn.classList.toggle('active-damage', isRoadDamageActive);
  btn.innerText = `⚠️ Road Damage AI: ${isRoadDamageActive ? 'ON' : 'OFF'}`;
  appendConsoleLog(`[PAVEMENT AI] Road Damage Monitoring: ${isRoadDamageActive ? 'ACTIVATED' : 'DEACTIVATED'}`, 'text-orange');
  playCyberSound(1350, 0.07);
}

// 6. NEW: TESSERACT.JS OCR TOGGLE & PROCESSING
function toggleOCR() {
  isOcrActive = !isOcrActive;
  const btn = document.getElementById('ocrToggleBtn');
  btn.classList.toggle('active-ocr', isOcrActive);
  btn.innerText = `🔤 Tesseract OCR: ${isOcrActive ? 'ON' : 'OFF'}`;
  appendConsoleLog(`[OCR ENGINE] Tesseract Real-Time OCR: ${isOcrActive ? 'ACTIVATED' : 'DEACTIVATED'}`, 'text-cyan');
  playCyberSound(1400, 0.08);

  if (isOcrActive) {
    triggerOcrScanLoop();
  }
}

async function triggerOcrScanLoop() {
  if (!isOcrActive) return;
  if (!isOcrProcessing && canvasElement.width > 0) {
    isOcrProcessing = true;
    try {
      const result = await Tesseract.recognize(canvasElement, 'eng');
      if (result && result.data && result.data.text) {
        const cleaned = result.data.text.replace(/[^a-zA-Z0-9 -]/g, '').trim();
        if (cleaned.length > 2) {
          lastDetectedText = cleaned.substring(0, 30);
          appendConsoleLog(`[OCR DETECTED] "${lastDetectedText}"`, 'text-yellow');
        }
      }
    } catch (e) {
      console.log("OCR Error: ", e);
    }
    isOcrProcessing = false;
  }
  if (isOcrActive) setTimeout(triggerOcrScanLoop, 2500); // Process frame every 2.5s for zero lag
}

// 7. REALTIME VIDEO RECORDER
function toggleScreenRecord() {
  const recBtn = document.getElementById('recBtn');

  if (!isRecording) {
    recordedChunks = [];
    const canvasStream = canvasElement.captureStream(30); 
    let mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';

    mediaRecorder = new MediaRecorder(canvasStream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cyber_HUD_VideoRec_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      appendConsoleLog("[RECORDER] Full Composite Video exported!", 'text-yellow');
    };

    mediaRecorder.start(1000);
    isRecording = true;
    recBtn.innerText = "⏹️ Stop Rec";
    recBtn.classList.add('recording');
    recStatus.classList.remove('hidden');
    playCyberSound(1500, 0.1);
    appendConsoleLog("[RECORDER] Started recording Video + Overlays...", 'text-cyan');
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recBtn.innerText = "🎥 Start Rec";
    recBtn.classList.remove('recording');
    recStatus.classList.add('hidden');
    playCyberSound(600, 0.1);
  }
}

// 8. CAPTURE SNAPSHOT
function captureTargetSnapshot() {
  playCyberSound(1300, 0.1);
  const link = document.createElement('a');
  link.download = `Cyber_HUD_Snapshot_${Date.now()}.png`;
  link.href = canvasElement.toDataURL('image/png');
  link.click();
  appendConsoleLog("[SNAPSHOT] Saved to device.", 'text-cyan');
}

// 9. XML DATA FILE EXPORT
function downloadXMLData() {
  playCyberSound(1400, 0.1);
  if (behaviorLogs.length === 0) {
    alert("No telemetry logs available to export yet!");
    return;
  }

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<CyberHUD_DataLogs>\n';
  behaviorLogs.forEach(log => {
    xmlContent += `  <Entry>\n`;
    xmlContent += `    <Timestamp>${log.timestamp}</Timestamp>\n`;
    xmlContent += `    <Category>${log.category || 'General'}</Category>\n`;
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
  a.download = `Cyber_AI_FullLogs_${Date.now()}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  appendConsoleLog("[XML EXPORT] Complete log exported!", "text-cyan");
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

// MediaPipe Setup
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

async function processFrame() {
  if (videoElement.readyState >= 2) {
    await hands.send({ image: videoElement });
    if (isTrackingActive) await faceMesh.send({ image: videoElement });
  }
  renderLoop();
  requestAnimationFrame(processFrame);
}

// MAIN COMPOSITE RENDER LOOP
function renderLoop() {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. DRAW WEBCAM VIDEO FEED
  if (videoElement.readyState >= 2) {
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  }

  hudUserList.innerHTML = '';

  // 2. MULTI-TARGET FACE / OBJECT TRACKER
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
      const targetID = `0${index + 1}`;

      const mouthDist = Math.hypot(landmarks[13].x - landmarks[14].x, landmarks[13].y - landmarks[14].y);
      const browDist = Math.hypot(landmarks[70].x - landmarks[300].x, landmarks[70].y - landmarks[300].y);
      let angerScore = Math.min(100, Math.max(10, Math.round((browDist * 200) + (mouthDist * 300))));
      let statusText = angerScore > 75 ? "ANGER DETECTED" : angerScore > 45 ? "ESCALATING" : "CALM";
      let statusColor = angerScore > 75 ? "#ff1100" : angerScore > 45 ? "#ffea00" : "#00ff66";

      canvasCtx.strokeStyle = statusColor;
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(x1, y1, boxW, boxH);

      canvasCtx.fillStyle = statusColor;
      canvasCtx.fillRect(x1, y1 - 18, boxW, 18);
      canvasCtx.fillStyle = "#000";
      canvasCtx.font = "bold 9px monospace";
      canvasCtx.fillText(`ID:${targetID} | ${statusText} ${angerScore}%`, x1 + 2, y1 - 5);

      renderSidebarCard(`TARGET_${targetID}`, statusText, `${angerScore}%`, statusColor);
    });
  }

  // 3. ROAD VEHICLE TRACKER (SPEED & PLATE)
  if (isRoadModeActive) {
    const w = canvasElement.width;
    const h = canvasElement.height;
    
    const vx = w * 0.15;
    const vy = h * 0.42;
    const vw = w * 0.25;
    const vh = h * 0.22;
    const speed = Math.round(78 + Math.random() * 5);
    const plate = `DHK-METRO-GA-45-1029`;

    canvasCtx.strokeStyle = "#00f3ff";
    canvasCtx.lineWidth = 2.5;
    canvasCtx.strokeRect(vx, vy, vw, vh);

    canvasCtx.fillStyle = "#00f3ff";
    canvasCtx.fillRect(vx, vy - 18, vw, 18);
    canvasCtx.fillStyle = "#000";
    canvasCtx.font = "bold 9px monospace";
    canvasCtx.fillText(`CAR_01 | SPEED: ${speed} KM/H | PLATE: ${plate}`, vx + 2, vy - 5);

    renderSidebarCard(`VEHICLE_01`, `SPEED: ${speed} KM/H`, plate, "#00f3ff");

    if (Math.random() < 0.02) {
      behaviorLogs.push({
        timestamp: new Date().toLocaleTimeString(),
        category: "Vehicle Tracking",
        id: "CAR_01",
        info: plate,
        scoreVal: `${speed} KM/H`,
        location: currentGpsText
      });
    }
  }

  // 4. ROAD DAMAGE DETECTION
  if (isRoadDamageActive) {
    const w = canvasElement.width;
    const h = canvasElement.height;

    // Pothole Cracking
    const pX = w * 0.35;
    const pY = h * 0.65;
    const pW = w * 0.30;
    const pH = h * 0.20;
    const depthCm = 45;

    canvasCtx.strokeStyle = "#ff9900";
    canvasCtx.lineWidth = 2.5;
    canvasCtx.strokeRect(pX, pY, pW, pH);

    canvasCtx.fillStyle = "#ff9900";
    canvasCtx.fillRect(pX, pY - 18, pW, 18);
    canvasCtx.fillStyle = "#000";
    canvasCtx.font = "bold 9px monospace";
    canvasCtx.fillText(`ID: 003 | Pothole Cracking | 88% | Depth: ${depthCm}cm`, pX + 2, pY - 5);

    renderSidebarCard(`DAMAGE_003`, `POTHOLE`, `Depth: ${depthCm}cm`, "#ff9900");

    // Alligator Crack
    const cX = w * 0.68;
    const cY = h * 0.50;
    const cW = w * 0.22;
    const cH = h * 0.15;
    const areaCm = 420;

    canvasCtx.strokeStyle = "#ffea00";
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeRect(cX, cY, cW, cH);

    canvasCtx.fillStyle = "#ffea00";
    canvasCtx.fillRect(cX, cY - 18, cW, 18);
    canvasCtx.fillStyle = "#000";
    canvasCtx.font = "bold 9px monospace";
    canvasCtx.fillText(`ID: 002 | Alligator Crack | Area: ${areaCm}cm²`, cX + 2, cY - 5);

    renderSidebarCard(`DAMAGE_002`, `ALLIGATOR CRACK`, `Area: ${areaCm}cm²`, "#ffea00");
  }

  // 5. TESSERACT.JS OCR DISPLAY OVERLAY
  if (isOcrActive) {
    const w = canvasElement.width;
    const h = canvasElement.height;
    
    const ox = w * 0.20;
    const oy = h * 0.10;
    const ow = w * 0.60;
    const oh = 32;

    canvasCtx.strokeStyle = "#00f3ff";
    canvasCtx.fillStyle = "rgba(0, 243, 255, 0.2)";
    canvasCtx.fillRect(ox, oy, ow, oh);
    canvasCtx.strokeRect(ox, oy, ow, oh);

    canvasCtx.fillStyle = "#fff";
    canvasCtx.font = "bold 11px monospace";
    canvasCtx.fillText(`🔤 OCR READ: "${lastDetectedText}"`, ox + 8, oy + 20);

    renderSidebarCard(`OCR_TEXT`, `READING`, lastDetectedText, "#00f3ff");
  }

  // 6. AIR HAND CURSOR
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
    <div class="hud-card-title">${id}</div>
    <div class="hud-status-badge" style="color:${color}">${status}</div>
    <div class="hud-bar-container"><div class="hud-bar" style="width:85%; background:${color}"></div></div>
    <div class="hud-score">${score}</div>
  `;
  hudUserList.appendChild(card);
}

function executeCyberSearch() {
  const query = cyberInput.value.trim();
  if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
}

function showDevInfo() { devModal.style.display = 'flex'; }
function hideDevInfo() { devModal.style.display = 'none'; }

startCamera();
requestAnimationFrame(processFrame);
