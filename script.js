// Firebase Configuration
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

// Initialize Firebase Application
if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = typeof firebase !== "undefined" ? firebase.auth() : null;
const database = typeof firebase !== "undefined" ? firebase.database() : null;

let currentUser = null;
let isRecording = false;
let speedAlertState = true;
let voiceAlertState = false;
let driverAlertState = true;

// DOM Ready Handler
window.addEventListener("DOMContentLoaded", () => {
    // Firebase Authentication State Observer
    if (auth) {
        auth.onAuthStateChanged((user) => {
            const authModal = document.getElementById("userAuthModal");
            const userStatusLabel = document.getElementById("userStatusLabel");
            const userIdLabel = document.getElementById("userIdLabel");
            const logoutBtn = document.getElementById("logoutBtn");
            const telemetryLog = document.getElementById("telemetryLog");

            if (user) {
                currentUser = user;
                if (authModal) authModal.style.display = "none";
                if (userStatusLabel) userStatusLabel.innerText = "ONLINE";
                if (userIdLabel) userIdLabel.innerText = "ID: " + user.email.split('@')[0];
                if (logoutBtn) logoutBtn.style.display = "inline-block";
                
                if (telemetryLog) {
                    telemetryLog.innerText = `[AUTH SUCCESS] Logged in as: ${user.email} | Telemetry Stream Active.`;
                }

                startCamera();
                updateUserOnlineStatus(true);
            } else {
                currentUser = null;
                if (authModal) authModal.style.display = "flex";
                if (userStatusLabel) userStatusLabel.innerText = "Guest User";
                if (userIdLabel) userIdLabel.innerText = "ID: ----";
                if (logoutBtn) logoutBtn.style.display = "none";

                if (telemetryLog) {
                    telemetryLog.innerText = "[AUTH] Waiting for User Authentication Session...";
                }
            }
        });
    } else {
        startCamera();
    }

    startTimer();
});

// Authentication Modal Tab Switcher (Login / Register / Reset)
function switchTab(tabName) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const resetForm = document.getElementById("resetForm");
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabRegisterBtn = document.getElementById("tabRegisterBtn");
    const tabResetBtn = document.getElementById("tabResetBtn");
    const errorElem = document.getElementById("authError");

    if (errorElem) errorElem.innerText = "";

    if (tabLoginBtn) tabLoginBtn.classList.remove("active");
    if (tabRegisterBtn) tabRegisterBtn.classList.remove("active");
    if (tabResetBtn) tabResetBtn.classList.remove("active");

    if (loginForm) loginForm.style.display = "none";
    if (registerForm) registerForm.style.display = "none";
    if (resetForm) resetForm.style.display = "none";

    if (tabName === 'login') {
        if (loginForm) loginForm.style.display = "block";
        if (tabLoginBtn) tabLoginBtn.classList.add("active");
    } else if (tabName === 'register') {
        if (registerForm) registerForm.style.display = "block";
        if (tabRegisterBtn) tabRegisterBtn.classList.add("active");
    } else if (tabName === 'reset') {
        if (resetForm) resetForm.style.display = "block";
        if (tabResetBtn) tabResetBtn.classList.add("active");
    }
}

// User Login Function
function loginUser() {
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();
    const errorElem = document.getElementById("authError");

    if (!email || !password) {
        if (errorElem) errorElem.innerText = "Please enter both email and password.";
        return;
    }

    if (errorElem) errorElem.innerText = "Authenticating...";

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            if (errorElem) errorElem.innerText = "";
        })
        .catch((error) => {
            if (errorElem) errorElem.innerText = getEnglishError(error.code);
        });
}

// User Registration Function
function registerUser() {
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value.trim();
    const errorElem = document.getElementById("authError");

    if (!email || !password) {
        if (errorElem) errorElem.innerText = "Please enter both email and password.";
        return;
    }

    if (errorElem) errorElem.innerText = "Creating account...";

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            if (errorElem) errorElem.innerText = "Account created successfully!";
        })
        .catch((error) => {
            if (errorElem) errorElem.innerText = getEnglishError(error.code);
        });
}

// Password Reset Link Sender
function resetPassword() {
    const email = document.getElementById("resetEmail")?.value.trim();
    const errorElem = document.getElementById("authError");

    if (!email) {
        if (errorElem) errorElem.innerText = "Please enter your email address.";
        return;
    }

    if (errorElem) errorElem.innerText = "Sending reset link...";

    auth.sendPasswordResetEmail(email)
        .then(() => {
            if (errorElem) errorElem.innerText = "Password reset link sent to your email!";
        })
        .catch((error) => {
            if (errorElem) errorElem.innerText = getEnglishError(error.code);
        });
}

// User Logout Function
function logoutUser() {
    if (currentUser) {
        updateUserOnlineStatus(false);
    }
    if (auth) auth.signOut();
}

// Standard English Error Formatter
function getEnglishError(code) {
    switch (code) {
        case 'auth/user-not-found':
            return "No account found with this email.";
        case 'auth/wrong-password':
            return "Incorrect password.";
        case 'auth/invalid-email':
            return "Invalid email address.";
        case 'auth/email-already-in-use':
            return "This email is already registered.";
        case 'auth/weak-password':
            return "Password must be at least 6 characters.";
        default:
            return "Authentication error. Please try again.";
    }
}

// Update Realtime Database Status
function updateUserOnlineStatus(isOnline) {
    if (currentUser && database) {
        const userRef = database.ref("users/" + currentUser.uid);
        if (isOnline) {
            userRef.update({
                email: currentUser.email,
                isOnline: true,
                speed: 0,
                impactDetected: false,
                activeCams: "Quad Feed",
                lastActive: firebase.database.ServerValue.TIMESTAMP
            });
            userRef.onDisconnect().update({ isOnline: false });
        } else {
            userRef.update({ isOnline: false });
        }
    }
}

// Start User Front Webcam
function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        })
        .then(function (stream) {
            const videoElement = document.getElementById("webcam1");
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.play().catch(e => console.log("Autoplay check:", e));
            }
        })
        .catch(function (error) {
            console.error("Webcam stream access failed:", error);
        });
    }
}

// Toggle Grid Box Zoom (Without Breaking UI Controls)
function toggleFullScreen(element) {
    const camBoxes = document.querySelectorAll('.cam-box');
    if (!camBoxes.length) return;

    if (element.classList.contains('expanded-grid-box')) {
        camBoxes.forEach(box => {
            box.style.display = 'flex';
            box.classList.remove('expanded-grid-box');
        });
    } else {
        camBoxes.forEach(box => {
            if (box === element) {
                box.style.display = 'flex';
                box.classList.add('expanded-grid-box');
            } else {
                box.style.display = 'none';
            }
        });
    }
}

// Layout Switcher (1, 2, 4 Boxes)
function setLayout(boxCount) {
    const camGrid = document.getElementById("camGrid");
    const layoutBtns = document.querySelectorAll(".layout-btn");
    
    layoutBtns.forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    if (camGrid) {
        camGrid.className = "cam-grid grid-" + boxCount;
    }
}

// Action Button Functions
function toggleSpeedAlert() {
    speedAlertState = !speedAlertState;
    const btn = document.getElementById("speedAlertBtn");
    if (btn) btn.innerText = speedAlertState ? "⚠️ 100 KM/H Alert: ON" : "⚠️ 100 KM/H Alert: OFF";
}

function toggleVoiceAlert() {
    voiceAlertState = !voiceAlertState;
    const btn = document.getElementById("voiceAlertBtn");
    if (btn) btn.innerText = voiceAlertState ? "🎙️ Voice Alert: ON" : "🎙️ Voice Alert: OFF";
}

function toggleDriverAlert() {
    driverAlertState = !driverAlertState;
    const btn = document.getElementById("drowsyAlertBtn");
    if (btn) btn.innerText = driverAlertState ? "👁️ Sleep Alert: ON" : "👁️ Sleep Alert: OFF";
}

function toggleHudMirror() {
    const hudContainer = document.querySelector(".hud-container");
    if (hudContainer) hudContainer.classList.toggle("hud-mirrored");
}

function toggleRecord() {
    isRecording = !isRecording;
    const recBtn = document.getElementById("recBtn");
    if (recBtn) {
        recBtn.innerText = isRecording ? "⏹️ Stop Rec" : "🔴 Quad Rec";
        recBtn.style.background = isRecording ? "#ff0055" : "rgba(0, 243, 255, 0.05)";
    }
}

function takeSnap() {
    alert("Snapshot captured successfully!");
}

function selectCam(num) {
    const buttons = document.querySelectorAll(".cam-btn");
    buttons.forEach((b, idx) => {
        if (idx === num - 1) b.classList.add("active");
        else b.classList.remove("active");
    });
}

// Digital Clock
function startTimer() {
    const timerDisplay = document.getElementById("timerDisplay");
    setInterval(() => {
        const now = new Date();
        if (timerDisplay) {
            timerDisplay.innerText = now.toTimeString().split(' ')[0];
        }
    }, 1000);
      }
