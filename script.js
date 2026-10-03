// --- 1. YOUR LIVE FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBrSa3hbt7kJTPddCPfdlzGiS3rTVWbgBg",
    authDomain: "road-traffic-data-8aec1.firebaseapp.com",
    databaseURL: "https://road-traffic-data-8aec1-default-rtdb.firebaseio.com",
    projectId: "road-traffic-data-8aec1",
    storageBucket: "road-traffic-data-8aec1.firebasestorage.app",
    messagingSenderId: "714117386299",
    appId: "1:714117386299:web:501fc2a8ac89a627af0c1e",
    measurementId: "G-CEMEBF2DN5"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Ensure session remains active across server updates
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const ADMIN_EMAIL = "smshakilco@gmail.com";

auth.onAuthStateChanged(user => {
    const authBtn = document.getElementById('authBtn');
    const adminBtn = document.getElementById('adminBtn');

    if (user) {
        authBtn.innerText = "Logout (" + user.email.split('@')[0] + ")";
        authBtn.onclick = () => auth.signOut();
        
        // Show Admin Panel ONLY for smshakilco@gmail.com
        if (user.email === ADMIN_EMAIL) {
            adminBtn.style.display = "inline-block";
        } else {
            adminBtn.style.display = "none";
        }
    } else {
        authBtn.innerText = "Login / Register";
        authBtn.onclick = () => openAuthModal();
        adminBtn.style.display = "none";
    }
});

// --- AUTHENTICATION FUNCTIONS ---
function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function submitLogin() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => closeAuthModal())
        .catch(err => alert("Login Error: " + err.message));
}

function submitRegister() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert("Registration Successful!");
            closeAuthModal();
        })
        .catch(err => alert("Registration Error: " + err.message));
}

function submitForgotPassword() {
    const email = document.getElementById('authEmail').value;
    if (!email) {
        alert("Please enter your email to reset password.");
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => alert("Password reset link / OTP has been sent to your email."))
        .catch(err => alert("Error: " + err.message));
}

// --- 2. CAMERA CONTROLS ---
async function testRearCam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } }
        });
        document.getElementById('video1').srcObject = stream;
    } catch (err) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        document.getElementById('video1').srcObject = stream;
    }
}

function toggleCam(id, isChecked) {
    const videoElem = document.getElementById(`video${id}`);
    if (!isChecked && videoElem.srcObject) {
        videoElem.srcObject.getTracks().forEach(track => track.stop());
        videoElem.srcObject = null;
    } else if (isChecked) {
        testRearCam();
    }
}

// --- 3. SATELLITE GPS MAP ---
let map, marker, watchId;

function initMap() {
    map = L.map('map').setView([21.4858, 39.1925], 15);

    L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google Satellite'
    }).addTo(map);

    marker = L.marker([21.4858, 39.1925]).addTo(map).bindPopup('Vehicle Location');

    startGPS();
}

function startGPS() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(pos => {
            const latlng = [pos.coords.latitude, pos.coords.longitude];
            marker.setLatLng(latlng);
            map.panTo(latlng);
        }, err => console.log(err), { enableHighAccuracy: true });
    }
}

function toggleGPS() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        alert("GPS Tracking Paused");
    } else {
        startGPS();
        alert("GPS Tracking Activated");
    }
}

window.onload = function() {
    initMap();
    loadAdSettings();
};

// --- 4. OFFLINE RECORDING SYSTEM ---
let mediaRecorder;
let recordedChunks = [];

window.addEventListener('offline', () => {
    document.getElementById('offlineNotice').style.display = 'inline-block';
});

window.addEventListener('online', () => {
    document.getElementById('offlineNotice').style.display = 'none';
});

function startGridRecording() {
    const video1 = document.getElementById('video1');
    if (!video1.srcObject) {
        alert("Please turn on Rear Cam to test recording.");
        return;
    }

    const stream = video1.srcObject;
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recordedChunks = [];

    mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `DriveVision_Recording_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    mediaRecorder.start();
    alert("Recording Started! Stopping and Downloading in 5 seconds...");
    setTimeout(() => mediaRecorder.stop(), 5000);
}

// --- 5. AD MANAGER FOR ADMIN ---
function toggleAdminPanel() {
    const modal = document.getElementById('adminModal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function saveAdSettings() {
    const ad1 = document.getElementById('ad1Input').value;
    const ad2 = document.getElementById('ad2Input').value;
    const ad3 = document.getElementById('ad3Input').value;
    const ad4 = document.getElementById('ad4Input').value;

    const ads = { ad1, ad2, ad3, ad4 };
    localStorage.setItem('drivevision_ads', JSON.stringify(ads));

    if (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL) {
        db.ref('ads').set(ads);
    }

    renderAds(ads);
    toggleAdminPanel();
    alert("Ads Updated Successfully!");
}

function loadAdSettings() {
    const savedAds = localStorage.getItem('drivevision_ads');
    if (savedAds) {
        renderAds(JSON.parse(savedAds));
    } else {
        db.ref('ads').once('value', snapshot => {
            if (snapshot.exists()) renderAds(snapshot.val());
        });
    }
}

function renderAds(ads) {
    if (ads.ad1) executeAdScript('adSlot1', ads.ad1);
    if (ads.ad2) executeAdScript('adSlot2', ads.ad2);
    if (ads.ad3) executeAdScript('adSlot3', ads.ad3);
    if (ads.ad4) executeAdScript('adSlot4', ads.ad4);
}

function executeAdScript(slotId, code) {
    const slot = document.getElementById(slotId);
    slot.innerHTML = code;
    
    const scripts = slot.getElementsByTagName('script');
    for (let script of scripts) {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.text = script.innerHTML;
        }
        document.body.appendChild(newScript);
    }
}
