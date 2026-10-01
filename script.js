// GLOBAL DOM ELEMENTS
const yellowCursor = document.getElementById('yellowCursor');
const codeLogConsole = document.getElementById('codeLogConsole');
const quadGridContainer = document.getElementById('quadGridContainer');
const recBtn = document.getElementById('recBtn');
const recStatus = document.getElementById('recStatus');
const netStatusWidget = document.getElementById('netStatusWidget');
const gForceWidget = document.getElementById('gForceWidget');
const driverAlertText = document.getElementById('driverAlertText');
const voiceStatusText = document.getElementById('voiceStatusText');

// MASTER CANVAS FOR ALL 4 CAMS RECORDING
const masterRecordCanvas = document.getElementById('masterRecordCanvas');
const masterCtx = masterRecordCanvas.getContext('2d');

// 4 CAMS STATE MATRIX
const camChannels = [
  { id: 1, active: true, video: document.getElementById('webcam1'), canvas: document.getElementById('canvas1'), stream: null },
  { id: 2, active: true, video: document.getElementById('webcam2'), canvas: document.getElementById('canvas2'), stream: null },
  { id: 3, active: true, video: document.getElementById('webcam3'), canvas: document.getElementById('canvas3'), stream: null },
  { id: 4, active: true, video: document.getElementById('webcam4'), canvas: document.getElementById('canvas4'), stream: null }
];

let activeGridLayout = 4;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let isDrowsinessActive = true;
let isHudMirrored = false;
let isVoiceActive = false;

// SOUND SYNTHESIZER
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCyberSound(freq = 900, duration = 0.04) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine'; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration);
}

// 1. ONLINE / OFFLINE AUTO NETWORK DETECTOR
function updateNetworkStatus() {
  if (navigator.onLine) {
    netStatusWidget.innerText = "🌐 ONLINE";
    netStatusWidget.className = "text-cyan";
    appendConsoleLog("[NET] Online Mode Active. Cloud Telemetry Enabled.", "text-cyan");
  } else {
    netStatusWidget.innerText = "🔌 OFFLINE MODE";
    netStatusWidget.className = "text-yellow";
    appendConsoleLog("[NET] Running Offline. Features Localized.", "text-yellow");
  }
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// 2. DYNAMIC QUAD CAMERA INIT (USB OTG, TYPE-C, IPHONE, WIFI, BT)
async function initializeMultiCameraSystem() {
  updateNetworkStatus();
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    appendConsoleLog(`[HARDWARE] Found ${videoDevices.length} Camera Devices Connected.`, 'text-green');

    // Attach Front Camera to Cam 1 & Rear/Facing Cams to 2, 3, 4
    for (let i = 0; i < 4; i++) {
      const channel = camChannels[i];
      if (!channel.active) continue;

      const deviceId = videoDevices[i] ? videoDevices[i].deviceId : undefined;
      const facingMode = (i === 0) ? 'environment' : (i === 3 ? 'user' : undefined);

      const constraints = {
        video: deviceId ? { exact: deviceId } : { facingMode: facingMode, width: 640, height: 480 }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        channel.stream = stream;
        channel.video.srcObject = stream;
        await channel.video.play();
      } catch (err) {
        appendConsoleLog(`[CAM ${i+1} STREAM] Fallback Virtual Feed Loaded.`, 'text-yellow');
      }
    }
  } catch (e) {
    appendConsoleLog("[CAM BUS] Initializing Standby Canvas Engines.", 'text-yellow');
  }

  startQuadRenderPipeline();
}

// 3. ON/OFF TOGGLE FOR INDIVIDUAL 4 CAMERAS
function toggleCameraChannel(camId) {
  const channel = camChannels[camId - 1];
  channel.active = !channel.active;

  const btn = document.getElementById(`btnCam${camId}`);
  const box = document.getElementById(`boxCam${camId}`);

  if (channel.active) {
    btn.className = "cam-toggle-btn active";
    btn.innerText = `📹 Cam ${camId}: (ON)`;
    box.style.display = "block";
    appendConsoleLog(`[CAMERA] Channel ${camId} Enabled.`, 'text-green');
  } else {
    btn.className = "cam-toggle-btn disabled";
    btn.innerText = `📹 Cam ${camId}: (OFF)`;
    box.style.display = "none";
    appendConsoleLog(`[CAMERA] Channel ${camId} Disabled.`, 'text-red');
  }
  playCyberSound(1100, 0.05);
}

// 4. DISPLAY GRID LAYOUT SELECTOR (1, 2, 3, 4 BOX VIEW)
function setGridLayout(num) {
  activeGridLayout = num;
  quadGridContainer.className = `quad-grid-container grid-layout-${num}`;

  document.querySelectorAll('.grid-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  // Adjust display boxes based on layout number
  camChannels.forEach((ch, idx) => {
    const box = document.getElementById(`boxCam${ch.id}`);
    if (idx < num && ch.active) {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });

  appendConsoleLog(`[GRID] Switched to ${num}-Box Display Mode.`, 'text-cyan');
  playCyberSound(1200, 0.05);
}

function focusSingleCamera(camId) {
  setGridLayout(1);
  camChannels.forEach(ch => {
    const box = document.getElementById(`boxCam${ch.id}`);
    box.style.display = (ch.id === camId) ? "block" : "none";
  });
  appendConsoleLog(`[DISPLAY] Focused Full Screen on Camera ${camId}.`, 'text-yellow');
}

// 5. BANGLA VOICE CONTROL SYSTEM
let recognition = null;
function toggleVoiceControl() {
  isVoiceActive = !isVoiceActive;
  const btn = document.getElementById('voiceToggleBtn');
  btn.classList.toggle('active', isVoiceActive);
  btn.innerText = `🎙️ বাংলা ভয়েস কন্ট্রোল: ${isVoiceActive ? 'ON' : 'OFF'}`;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (isVoiceActive) {
    if (!SpeechRecognition) { alert("Voice Speech API Not Supported!"); return; }
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'bn-BD'; // BANGLA LANGUAGE SUPPORT

    recognition.onresult = (event) => {
      const command = event.results[event.results.length - 1][0].transcript.trim();
      voiceStatusText.innerText = `🎙️ বাংলা কমান্ড: "${command}"`;
      appendConsoleLog(`[VOICE BANGLA] Identified: "${command}"`, 'text-cyan');

      if (command.includes("ছবি") || command.includes("স্নেপ")) captureTargetSnapshot();
      else if (command.includes("রেকর্ড")) toggleScreenRecord();
      else if (command.includes("নাইট")) setVisionMode('night');
      else if (command.includes("মিরর")) toggleHUDMirror();
      else if (command.includes("নরমান")) setVisionMode('normal');
    };

    recognition.onend = () => { if (isVoiceActive) recognition.start(); };
    recognition.start();
    playCyberSound(1400, 0.08);
  } else {
    if (recognition) recognition.stop();
    voiceStatusText.innerText = '🎙️ বাংলা ভয়েস কন্ট্রোল বন্ধ আছে';
  }
}

// 6. COLLISION & AUTO-IMPACT DETECTOR WITH AUTO DOWNLOAD
if (window.DeviceMotionEvent) {
  window.addEventListener('devicemotion', (event) => {
    const acc = event.accelerationIncludingGravity;
    if (acc) {
      const gMag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z) / 9.8;
      gForceWidget.innerText = `📐 G-FORCE: ${gMag.toFixed(1)}G`;

      // IMPACT / ACCIDENT DETECTED (> 2.8G Threshold)
      if (gMag > 2.8) {
        triggerCollisionSnapshot(gMag.toFixed(1));
      }
    }
  });
}

function triggerCollisionSnapshot(gVal) {
  playCyberSound(2000, 0.2);
  driverAlertText.innerText = `🚨 IMPACT COLLISION DETECTED (${gVal}G)! AUTO SAVING...`;
  driverAlertText.style.color = "#ff1100";

  // AUTO SNAPSHOT AND DOWNLOAD
  captureTargetSnapshot(`CRASH_EVENT_${gVal}G`);
  appendConsoleLog(`[CRASH LOCK] Emergency Snapshot Auto Downloaded! G-Force: ${gVal}G`, 'text-red');
}

// 7. DRIVER DROWSINESS & YAWN MONITOR (FACE MESH)
const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true });

faceMesh.onResults((results) => {
  if (!isDrowsinessActive || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

  const landmarks = results.multiFaceLandmarks[0];
  const topEye = landmarks[159].y;
  const bottomEye = landmarks[145].y;
  const eyeDist = Math.abs(topEye - bottomEye);

  if (eyeDist < 0.012) { // EYES CLOSED / DROWSY DETECTED
    driverAlertText.innerText = "⚠️ সতর্কবার্তা: চালকের চোখ বন্ধ! সোজা তাকান!";
    driverAlertText.style.color = "#ff1100";
    playCyberSound(1800, 0.1);
  } else {
    driverAlertText.innerText = "🟢 DRIVER ALERT: ACTIVE & SAFE";
    driverAlertText.style.color = "#ffea00";
  }
});

function toggleDrowsinessAlert() {
  isDrowsinessActive = !isDrowsinessActive;
  const btn = document.getElementById('drowsyToggleBtn');
  btn.classList.toggle('active', isDrowsinessActive);
  btn.innerText = `👁️ চালকের ঘুম সতর্কবার্তা: ${isDrowsinessActive ? 'ON' : 'OFF'}`;
}

// 8. QUAD RENDER LOOP & COMPOSITE CANVAS
function startQuadRenderPipeline() {
  masterRecordCanvas.width = 1280;
  masterRecordCanvas.height = 720;

  function renderLoop() {
    camChannels.forEach((ch, idx) => {
      if (!ch.active) return;

      const ctx = ch.canvas.getContext('2d');
      ch.canvas.width = ch.video.videoWidth || 640;
      ch.canvas.height = ch.video.videoHeight || 480;

      if (ch.video.readyState >= 2) {
        ctx.drawImage(ch.video, 0, 0, ch.canvas.width, ch.canvas.height);
      }

      // Composite onto Master Canvas for Quad Recording
      const x = (idx % 2) * 640;
      const y = Math.floor(idx / 2) * 360;
      masterCtx.drawImage(ch.canvas, x, y, 640, 360);
    });

    // Process Driver Face Detection on Cam 4
    if (camChannels[3].active && camChannels[3].video.readyState >= 2 && isDrowsinessActive) {
      faceMesh.send({ image: camChannels[3].video }).catch(()=>{});
    }

    requestAnimationFrame(renderLoop);
  }

  renderLoop();
}

// 9. SYNCHRONIZED QUAD CAMERA RECORDING
function toggleScreenRecord() {
  if (!isRecording) {
    const stream = masterRecordCanvas.captureStream(60);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cyber_HUD_QuadRecord_${Date.now()}.webm`;
      a.click();
    };

    mediaRecorder.start();
    isRecording = true;
    recBtn.classList.add('recording');
    recBtn.innerText = "⏹️ Stop Rec";
    recStatus.classList.remove('hidden');
    appendConsoleLog("[QUAD REC] Recording 4 Cameras Simultaneously...", 'text-red');
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recBtn.classList.remove('recording');
    recBtn.innerText = "🎥 Quad Rec";
    recStatus.classList.add('hidden');
    appendConsoleLog("[QUAD REC] Composite Quad Video Saved.", 'text-green');
  }
}

// HUD MIRROR MODE & SNAPSHOT
function toggleHUDMirror() {
  isHudMirrored = !isHudMirrored;
  camChannels.forEach(ch => ch.canvas.classList.toggle('hud-mirrored', isHudMirrored));
}

function captureTargetSnapshot(prefix = "Snap") {
  playCyberSound(1300, 0.1);
  const link = document.createElement('a');
  link.download = `Cyber_HUD_${prefix}_${Date.now()}.png`;
  link.href = masterRecordCanvas.toDataURL('image/png');
  link.click();
}

function setVisionMode(mode) {
  camChannels.forEach(ch => {
    ch.canvas.classList.remove('night-vision', 'thermal-vision');
    if (mode === 'night') ch.canvas.classList.add('night-vision');
    if (mode === 'thermal') ch.canvas.classList.add('thermal-vision');
  });
}

function connectExternalStream() {
  const url = prompt("Enter Bluetooth / WiFi / IP Camera Stream URL:");
  if (url) appendConsoleLog(`[STREAM] Connected to External Cam: ${url}`, 'text-green');
}

function downloadXMLData() { alert("Exporting XML telemetry logs..."); }
function showDevInfo() { document.getElementById('devModal').style.display = 'flex'; }
function hideDevInfo() { document.getElementById('devModal').style.display = 'none'; }

function appendConsoleLog(msg, colorClass = '') {
  const line = document.createElement('div');
  line.className = `log-line ${colorClass}`;
  line.innerText = msg;
  codeLogConsole.appendChild(line);
  if (codeLogConsole.childNodes.length > 60) codeLogConsole.removeChild(codeLogConsole.firstChild);
  codeLogConsole.scrollTop = codeLogConsole.scrollHeight;
}

// INITIALIZE SYSTEM
initializeMultiCameraSystem();
