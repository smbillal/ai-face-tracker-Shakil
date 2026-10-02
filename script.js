
/* ===================================================
   DRIVEVISION AI - Master Web Application Engine (JS)
   =================================================== */

// Global App State
let boxCount = 4;
let isRecording = false;
let phoneCamActive = false;
let driverMode = false;
let localStream = null;
let activeChannels = 20; // Backend supports up to 20 channels
let currentUser = null;
let telemetryLogs = [];
let map, userMarker, routeLine;

// Camera Channel Names
let cameraNames = {
    1: "Front Cam (Distance Grid)",
    2: "Rear Cam (Reverse Grid)",
    3: "Left Blind Spot",
    4: "Right Blind Spot"
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    checkSavedUser();
    renderCameraGrid();
    initLiveMap();
    startTelemetrySimulation();
});

// Render Camera Boxes Dynamically
function renderCameraGrid() {
    const grid = document.getElementById("cameraGrid");
    grid.className = `camera-grid grid-${boxCount <= 4 ? boxCount : 4}`;
    grid.innerHTML = "";

    for (let i = 1; i <= boxCount; i++) {
        const name = cameraNames[i] || `Camera Channel ${i}`;
        const box = document.createElement("div");
        box.className = "cam-box";
        box.id = `camBox_${i}`;

        box.innerHTML = `
            <div class="cam-header">
                <span class="cam-title" onclick="renameCam(${i})"><i class="fa-solid fa-pen-to-square"></i> ${name}</span>
                <span class="badge ${i === 1 && phoneCamActive ? 'green' : 'red'}" id="status_${i}">${i === 1 && phoneCamActive ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div class="cam-canvas-wrap">
                ${i === 1 && phoneCamActive ? '<video id="phoneVideo" autoplay playsinline muted></video>' : ''}
                <canvas id="canvasOverlay_${i}" class="cam-overlay-grid"></canvas>
                <div class="offline-placeholder" id="placeholder_${i}" style="${i === 1 && phoneCamActive ? 'display:none;' : 'display:block;'}">
                    <i class="fa-solid fa-video-slash fa-2x"></i><br>
                    OFFLINE / WAITING FOR STREAM
                </div>
            </div>
        `;
        grid.appendChild(box);

        // Draw Front & Rear Grid Overlay
        setTimeout(() => drawGridOverlay(i), 100);
    }
}

// Draw Distance Grid Overlay Lines (Front & Rear)
function drawGridOverlay(camId) {
    const canvas = document.getElementById(`canvasOverlay_${camId}`);
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (camId === 1) {
        // Front Cam Distance Grid Lines
        ctx.strokeStyle = "#00ff66";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.2, canvas.height);
        ctx.lineTo(canvas.width * 0.4, canvas.height * 0.5);
        ctx.moveTo(canvas.width * 0.8, canvas.height);
        ctx.lineTo(canvas.width * 0.6, canvas.height * 0.5);
        ctx.stroke();

        // Distance Bars
        ctx.strokeStyle = "#ffcc00";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.28, canvas.height * 0.8);
        ctx.lineTo(canvas.width * 0.72, canvas.height * 0.8);
        ctx.stroke();

        ctx.strokeStyle = "#ff0055";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.35, canvas.height * 0.6);
        ctx.lineTo(canvas.width * 0.65, canvas.height * 0.6);
        ctx.stroke();
    } else if (camId === 2) {
        // Rear Parking Grid Lines
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.15, canvas.height);
        ctx.lineTo(canvas.width * 0.3, canvas.height * 0.4);
        ctx.moveTo(canvas.width * 0.85, canvas.height);
        ctx.lineTo(canvas.width * 0.7, canvas.height * 0.4);
        ctx.stroke();
    }
}

// Switch Layout Boxes (1, 2, 3, 4 to Dynamic)
function setBoxCount(count) {
    boxCount = count;
    renderCameraGrid();
}

// Toggle Phone Test Camera
async function togglePhoneCam() {
    phoneCamActive = !phoneCamActive;
    if (phoneCamActive) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            renderCameraGrid();
            const video = document.getElementById("phoneVideo");
            if (video) video.srcObject = localStream;
        } catch (err) {
            alert("Camera permission denied: " + err.message);
            phoneCamActive = false;
        }
    } else {
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        renderCameraGrid();
    }
}

// Rename Camera Title
function renameCam(id) {
    const newName = prompt("Enter new name for camera:", cameraNames[id] || `Camera ${id}`);
    if (newName) {
        cameraNames[id] = newName;
        renderCameraGrid();
    }
}

// Auto Expand Camera Channels if External Server connects 5+
function autoExpandChannels(count) {
    if (count > boxCount) {
        boxCount = count;
        renderCameraGrid();
        alert(`${count} Custom Camera Channels detected from server! Boxes expanded automatically.`);
    }
}

// Embedded Google/Leaflet Map
function initLiveMap() {
    map = L.map('liveMap').setView([21.4225, 39.8262], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; DRIVEVISION AI Maps'
    }).addTo(map);

    userMarker = L.marker([21.4225, 39.8262]).addTo(map).bindPopup("Vehicle Live Location").openPopup();
}

function setMapDestination() {
    const dest = document.getElementById("destInput").value;
    if (!dest) return alert("Please enter destination location!");

    // Simulate Route Line
    if (routeLine) map.removeLayer(routeLine);
    const latlngs = [
        [21.4225, 39.8262],
        [21.4500, 39.8500],
        [21.4800, 39.8800]
    ];
    routeLine = L.polyline(latlngs, { color: '#00ff66' }).addTo(map);
    map.fitBounds(routeLine.getBounds());
    alert(`Destination set to: ${dest} (Live route tracking active)`);
}

function toggleMapFullscreen() {
    const box = document.getElementById("mapBoxContainer");
    box.classList.toggle("fullscreen-map");
}

// Live Vehicle Telemetry Simulation
function startTelemetrySimulation() {
    setInterval(() => {
        const plates = ["ABC-1234", "KSA-8899", "NY-5544", "UAE-9012"];
        const randomPlate = plates[Math.floor(Math.random() * plates.length)];
        const speed = Math.floor(Math.random() * 60) + 40;
        const distance = (Math.random() * 15 + 2).toFixed(1);

        const logItem = `
            <div class="telemetry-item">
                <span><strong style="color:var(--color-yellow)">[${randomPlate}]</strong> Distance: ${distance}m</span>
                <span style="color:${speed > 80 ? 'var(--color-red)' : 'var(--color-green)'}">${speed} km/h</span>
            </div>
        `;
        const logBox = document.getElementById("telemetryLog");
        if (logBox) {
            logBox.innerHTML = logItem + logBox.innerHTML;
        }

        telemetryLogs.unshift({ plate: randomPlate, speed: speed, distance: distance, time: new Date().toLocaleTimeString() });
        if (telemetryLogs.length > 20) telemetryLogs.pop();
    }, 3000);
}

// Export CSV & XML Logs
function exportDataLog(type) {
    let content = "";
    let filename = `DRIVEVISION_Log_${Date.now()}.${type}`;

    if (type === 'csv') {
        content = "Plate,Speed_KMH,Distance_M,Time\n";
        telemetryLogs.forEach(l => content += `${l.plate},${l.speed},${l.distance},${l.time}\n`);
    } else {
        content = "<telemetry>\n";
        telemetryLogs.forEach(l => {
            content += `  <log plate="${l.plate}" speed="${l.speed}" distance="${l.distance}" time="${l.time}" />\n`;
        });
        content += "</telemetry>";
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

// Quad Recording
function toggleRecording() {
    isRecording = !isRecording;
    const btn = document.getElementById("recBtn");
    if (isRecording) {
        btn.classList.add("recording");
        btn.innerHTML = `<i class="fa-solid fa-square"></i> Stop Rec`;
    } else {
        btn.classList.remove("recording");
        btn.innerHTML = `<i class="fa-solid fa-circle"></i> Quad Rec`;
        alert("Recording completed and saved to gallery!");
    }
}

// Authentication & 6-Digit Unique ID Generator
function handleRegistration(e) {
    e.preventDefault();
    const name = document.getElementById("regName").value;
    const country = document.getElementById("regCountry").value;
    const age = document.getElementById("regAge").value;
    const phone = document.getElementById("regPhone").value;
    const email = document.getElementById("regEmail").value;
    
    // Generate 6-digit Unique ID
    const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();

    currentUser = { name, country, age, phone, email, uniqueId };
    localStorage.setItem("drivevision_user", JSON.stringify(currentUser));
    
    alert(`Registration successful! Your 6-digit Unique ID: ${uniqueId}`);
    updateUserBadge();
    closeModal("authModal");
}

function handleLogin(e) {
    e.preventDefault();
    const idOrEmail = document.getElementById("loginIdOrEmail").value;
    const saved = JSON.parse(localStorage.getItem("drivevision_user"));

    if (saved && (saved.email === idOrEmail || saved.uniqueId === idOrEmail)) {
        currentUser = saved;
        updateUserBadge();
        closeModal("authModal");
        alert("Login successful!");
    } else {
        alert("User not found! Please check your details.");
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem("drivevision_user");
    updateUserBadge();
    closeModal("authModal");
}

function checkSavedUser() {
    const saved = localStorage.getItem("drivevision_user");
    if (saved) {
        currentUser = JSON.parse(saved);
        updateUserBadge();
    }
}

function updateUserBadge() {
    const badge = document.getElementById("userBadgeText");
    if (currentUser) {
        badge.innerText = `${currentUser.name} | ID: ${currentUser.uniqueId}`;
    } else {
        badge.innerText = "Guest";
    }
}

function openAuthOrProfile() {
    openModal("authModal");
    if (currentUser) {
        document.getElementById("authTabs").style.display = "none";
        document.getElementById("regForm").style.display = "none";
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("profileCard").style.display = "block";
        
        document.getElementById("profName").innerText = currentUser.name;
        document.getElementById("profId").innerText = currentUser.uniqueId;
        document.getElementById("profCountry").innerText = currentUser.country;
        document.getElementById("profAge").innerText = currentUser.age;
        document.getElementById("profPhone").innerText = currentUser.phone;
        document.getElementById("profEmail").innerText = currentUser.email;
    } else {
        document.getElementById("authTabs").style.display = "flex";
        switchAuthTab('reg');
    }
}

// Modal Helpers
function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }

function switchAuthTab(tab) {
    document.getElementById("regForm").style.display = tab === 'reg' ? 'flex' : 'none';
    document.getElementById("loginForm").style.display = tab === 'login' ? 'flex' : 'none';
}

function switchHubTab(type) {
    const status = document.getElementById("hubStatus");
    if (type === 'wifi') status.innerHTML = `<p>Wi-Fi Server <strong>DRIVEVISION_SERVER_HUB</strong> Active.</p>`;
    if (type === 'usb') status.innerHTML = `<p>Connect USB Type-C Cable (WebUSB Plug-and-Play).</p>`;
    if (type === 'bt') status.innerHTML = `<p>Scan and pair Bluetooth sensors.</p>`;
}

function simulateDeviceConnect() {
    autoExpandChannels(6);
    closeModal("hubModal");
}

function toggleDriverMode() {
    driverMode = !driverMode;
    alert(`Driver Focus Mode: ${driverMode ? 'ENABLED' : 'DISABLED'}`);
}
