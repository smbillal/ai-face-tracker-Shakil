
// FIREBASE & ISOLATED AUTH INITIALIZATION
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "cyber-hud-v15.firebaseapp.com",
  databaseURL: "https://cyber-hud-v15-default-rtdb.firebaseio.com",
  projectId: "cyber-hud-v15"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUserUID = null;
let speedAlertUserEnabled = true;
let currentGpsSpeed = 0;

// USER LOGIN & ISOLATION STATE
function loginOrRegisterUser() {
  const userIdentifier = document.getElementById('userInputId').value;
  const pass = document.getElementById('userPassword').value;

  const email = userIdentifier.includes('@') ? userIdentifier : `${userIdentifier}@cyberhud.com`;

  auth.signInWithEmailAndPassword(email, pass)
    .catch(() => auth.createUserWithEmailAndPassword(email, pass))
    .then((cred) => {
      currentUserUID = cred.user.uid;
      document.getElementById('userAuthModal').style.display = 'none';
      setupIsolatedUserPresence(currentUserUID, email);
    });
}

function setupIsolatedUserPresence(uid, email) {
  const userRef = db.ref(`users/${uid}`);
  const connectedRef = db.ref('.info/connected');

  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      userRef.child('telemetry').onDisconnect().update({ isOnline: false });
      userRef.child('profile').set({ email: email, lastLogin: Date.now() });
      userRef.child('telemetry').update({ isOnline: true });
    }
  });
}

// 100 KM/H OVER-SPEED CHECK & USER TOGGLE
function checkSpeedAlert(speed) {
  currentGpsSpeed = speed;
  const speedWidget = document.getElementById('speedWarningWidget');

  if (speed > 100) {
    speedWidget.classList.remove('hidden');
    if (speedAlertUserEnabled) {
      playCyberSound(1900, 0.1); // Sound Warning for User
    }
  } else {
    speedWidget.classList.add('hidden');
  }

  // SYNC TELEMETRY TO FIREBASE FOR ADMIN MONITORING ONLY
  if (currentUserUID) {
    db.ref(`users/${currentUserUID}/telemetry`).update({
      speed: currentGpsSpeed,
      speedAlertUserEnabled: speedAlertUserEnabled,
      timestamp: Date.now()
    });
  }
}

function toggleUserSpeedAlert() {
  speedAlertUserEnabled = !speedAlertUserEnabled;
  const btn = document.getElementById('speedAlertToggleBtn');
  btn.classList.toggle('active', speedAlertUserEnabled);
  btn.innerText = `⚠️ 100 KM/H Alert: ${speedAlertUserEnabled ? 'ON' : 'OFF'}`;
}

// GOOGLE DRIVE DIRECT UPLOAD INTEGRATION
function uploadToGoogleDrive() {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: (response) => {
      if (response.access_token) {
        uploadCanvasToDrive(response.access_token);
      }
    },
  });
  tokenClient.requestAccessToken();
}

function uploadCanvasToDrive(accessToken) {
  const canvas = document.getElementById('masterRecordCanvas');
  canvas.toBlob((blob) => {
    const metadata = { name: `Cyber_HUD_Capture_${Date.now()}.png`, mimeType: 'image/png' };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: formData,
    }).then(() => alert("✅ Saved to Google Drive Successfully!"));
  });
        }
