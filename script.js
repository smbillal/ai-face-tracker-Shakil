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

// Initialize Firebase
if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = typeof firebase !== "undefined" ? firebase.auth() : null;
const database = typeof firebase !== "undefined" ? firebase.database() : null;

let currentUser = null;

// DOM Content Loaded Event Listener
window.addEventListener("DOMContentLoaded", () => {
    // Listen for Auth Changes
    if (auth) {
        auth.onAuthStateChanged((user) => {
            const authModal = document.getElementById("userAuthModal") || document.getElementById("authModal");
            
            if (user) {
                currentUser = user;
                if (authModal) authModal.style.display = "none";
                startCamera();
                updateUserOnlineStatus(true);
            } else {
                currentUser = null;
                if (authModal) authModal.style.display = "flex";
            }
        });
    } else {
        startCamera();
    }
});

// Switch Auth Tabs (লগইন / নতুন একাউন্ট / পাসওয়ার্ড রিসেট)
function switchTab(tabName) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const resetForm = document.getElementById("resetForm");
    const errorElem = document.getElementById("authError") || document.getElementById("userAuthError");

    if (errorElem) errorElem.innerText = "";

    const tabs = document.querySelectorAll(".tab-btn, .auth-tab");
    tabs.forEach(tab => tab.classList.remove("active"));

    if (tabName === 'login') {
        if (loginForm) loginForm.style.display = "block";
        if (registerForm) registerForm.style.display = "none";
        if (resetForm) resetForm.style.display = "none";
    } else if (tabName === 'register') {
        if (loginForm) loginForm.style.display = "none";
        if (registerForm) registerForm.style.display = "block";
        if (resetForm) resetForm.style.display = "none";
    } else if (tabName === 'reset') {
        if (loginForm) loginForm.style.display = "none";
        if (registerForm) registerForm.style.display = "none";
        if (resetForm) resetForm.style.display = "block";
    }
}

// User Login
function loginUser() {
    const email = (document.getElementById("userEmail") || document.getElementById("loginEmail"))?.value.trim();
    const password = (document.getElementById("userPassword") || document.getElementById("loginPassword"))?.value.trim();
    const errorElem = document.getElementById("authError") || document.getElementById("userAuthError");

    if (!email || !password) {
        if (errorElem) errorElem.innerText = "ইমেইল এবং পাসওয়ার্ড প্রদান করুন।";
        return;
    }

    if (errorElem) errorElem.innerText = "লগইন হচ্ছে...";

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            if (errorElem) errorElem.innerText = "";
        })
        .catch((error) => {
            if (errorElem) errorElem.innerText = "লগইন ব্যর্থ: " + getErrorMessage(error.code);
        });
}

// User Registration
function registerUser() {
    const email = (document.getElementById("regEmail") || document.getElementById("registerEmail"))?.value.trim();
    const password = (document.getElementById("regPassword") || document.getElementById("registerPassword"))?.value.trim();
    const errorElem = document.getElementById("authError") || document.getElementById("userAuthError");

    if (!email || !password) {
        if (errorElem) errorElem.innerText = "সবগুলো ফিল্ড পূরণ করুন।";
        return;
    }

    if (errorElem) errorElem.innerText = "একাউন্ট তৈরি হচ্ছে...";

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            if (errorElem) errorElem.innerText = "একাউন্ট সফলভাবে তৈরি হয়েছে!";
        })
        .catch((error) => {
            if (errorElem) errorElem.innerText = "রেজিস্ট্রেশন ব্যর্থ: " + getErrorMessage(error.code);
        });
}

// Password Reset Link
function resetPassword() {
    const email = (document.getElementById("resetEmail"))?.value.trim();
    const errorElem = document.getElementById("authError") || document.getElementById("userAuthError");

    if (!email) {
        if (errorElem) errorElem.innerText = "আপনার ইমেইল এড্রেসটি লিখুন।";
        return;
    }

    if (errorElem) errorElem.innerText = "রিসেট লিঙ্ক পাঠানো হচ্ছে...";

    auth.sendPasswordResetEmail(email)
        .then(() => {
            if (errorElem) errorElem.innerText = "পাসওয়ার্ড রিসেট লিঙ্ক ইমেইলে পাঠানো হয়েছে।";
        })
        .catch((error) => {
            if (errorElem) errorElem.innerText = "ব্যর্থ: " + getErrorMessage(error.code);
        });
}

// Logout User
function logoutUser() {
    if (currentUser) {
        updateUserOnlineStatus(false);
    }
    if (auth) auth.signOut();
}

// Friendly Bangla Error Messages
function getErrorMessage(code) {
    switch (code) {
        case 'auth/user-not-found':
            return "এই ইমেইল দিয়ে কোনো একাউন্ট পাওয়া যায়নি।";
        case 'auth/wrong-password':
            return "ভুল পাসওয়ার্ড দেওয়া হয়েছে।";
        case 'auth/invalid-email':
            return "অকার্যকর ইমেইল এড্রেস।";
        case 'auth/email-already-in-use':
            return "এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।";
        case 'auth/weak-password':
            return "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।";
        default:
            return "অনুগ্রহ করে আবার চেষ্টা করুন।";
    }
}

// Update Realtime User Telemetry & Online Status
function updateUserOnlineStatus(isOnline) {
    if (currentUser && database) {
        const userRef = database.ref("users/" + currentUser.uid);
        if (isOnline) {
            userRef.update({
                email: currentUser.email,
                isOnline: true,
                lastActive: firebase.database.ServerValue.TIMESTAMP,
                activeCams: "Quad Feed"
            });
            userRef.onDisconnect().update({ isOnline: false });
        } else {
            userRef.update({ isOnline: false });
        }
    }
}

// Initialize Camera Stream
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
            const videoElement = document.getElementById("webcam1") || document.querySelector("video");
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.play().catch(e => console.log("Auto-play restriction:", e));
            }
        })
        .catch(function (error) {
            console.error("Camera access error:", error);
        });
    }
}

// Expand single camera inside HUD Grid Box area (Without hiding HUD Controls)
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
