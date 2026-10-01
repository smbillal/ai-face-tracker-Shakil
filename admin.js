// FIREBASE CONFIGURATION
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

// AUTHORIZED MULTI-ADMIN EMAILS
const ADMIN_EMAILS = [
  "smshakilco@gmail.com",
  "admin2@cyberhud.com",
  "admin3@cyberhud.com"
];

function loginAdmin() {
  const email = document.getElementById('adminEmail').value;
  const pass = document.getElementById('adminPassword').value;

  if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
    document.getElementById('adminAuthError').innerText = "Access Denied: Email is not registered as Admin.";
    return;
  }

  auth.signInWithEmailAndPassword(email, pass)
    .then((userCredential) => {
      document.getElementById('adminAuthModal').style.display = 'none';
      document.getElementById('adminDashboard').classList.remove('hidden');
      document.getElementById('currentAdminEmail').innerText = `Admin: ${userCredential.user.email}`;
      startAdminRealtimeMonitoring();
    })
    .catch((err) => {
      document.getElementById('adminAuthError').innerText = err.message;
    });
}

function logoutAdmin() {
  auth.signOut().then(() => {
    window.location.reload();
  });
}

// REALTIME MULTI-USER MONITORING FOR ADMIN
function startAdminRealtimeMonitoring() {
  const usersRef = db.ref('users');

  usersRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    const tableBody = document.getElementById('userMonitoringTableBody');
    tableBody.innerHTML = '';

    let total = 0, online = 0, crashes = 0, speedAlerts = 0;

    Object.keys(data).forEach((uid) => {
      total++;
      const user = data[uid];
      const telemetry = user.telemetry || {};
      const profile = user.profile || {};

      if (telemetry.isOnline) online++;
      if (telemetry.crashDetected) crashes++;
      if (telemetry.speed > 100) speedAlerts++;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${profile.email || profile.phone || uid}</td>
        <td><span class="${telemetry.isOnline ? 'text-green' : 'text-red'}">${telemetry.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}</span></td>
        <td class="${telemetry.speed > 100 ? 'text-red font-bold' : ''}">${telemetry.speed || 0} KM/H</td>
        <td>${telemetry.activeCams || 0} Cams</td>
        <td>${telemetry.speedAlertUserEnabled ? 'ENABLED' : 'DISABLED BY USER'} ${telemetry.speed > 100 ? '🚨 (EXCEEDED)' : ''}</td>
        <td><span class="${telemetry.crashDetected ? 'text-red' : 'text-green'}">${telemetry.crashDetected ? '🚨 CRASH ALERT' : 'NORMAL'}</span></td>
        <td>
          <button class="cyber-btn" onclick="viewSingleUserLive('${uid}')">👁️ Inspect</button>
          <button class="cyber-btn snap-btn" onclick="downloadSingleUserData('${uid}')">💾 Download Data</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    document.getElementById('totalUsersCount').innerText = total;
    document.getElementById('onlineUsersCount').innerText = online;
    document.getElementById('crashAlertsCount').innerText = crashes;
    document.getElementById('speedAlertsCount').innerText = speedAlerts;
  });
}

// SINGLE USER DATA DOWNLOAD (ADMIN EXCLUSIVE)
function downloadSingleUserData(uid) {
  db.ref(`users/${uid}`).once('value', (snap) => {
    const userData = snap.val();
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `User_Telemetry_${uid}.json`;
    a.click();
  });
}

// BULK ALL USERS DATA DOWNLOAD
function bulkDownloadAllUserData() {
  db.ref('users').once('value', (snap) => {
    const allData = snap.val();
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `All_Users_Fleet_Data_${Date.now()}.json`;
    a.click();
  });
}
