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

// Initialize Firebase (v9 Compat)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

let allUsersCache = {};

// Monitor Admin Authentication State
auth.onAuthStateChanged((user) => {
    const authModal = document.getElementById("adminAuthModal");
    const dashboard = document.getElementById("adminDashboard");
    const adminEmailText = document.getElementById("currentAdminEmail");

    if (user) {
        if (authModal) authModal.style.display = "none";
        if (dashboard) dashboard.classList.remove("hidden");
        if (adminEmailText) adminEmailText.innerText = "Admin: " + user.email;
        
        // Start live telemetry database stream
        listenToUserTelemetry();
    } else {
        if (authModal) authModal.style.display = "flex";
        if (dashboard) dashboard.classList.add("hidden");
    }
});

// Multi-Admin Login Function
function loginAdmin() {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const errorElement = document.getElementById("adminAuthError");

    if (!email || !password) {
        errorElement.innerText = "Please enter both email and password.";
        return;
    }

    errorElement.innerText = "Authenticating...";

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            errorElement.innerText = "";
        })
        .catch((error) => {
            errorElement.innerText = "Login Failed: " + error.message;
        });
}

// Admin Logout Function
function logoutAdmin() {
    auth.signOut().then(() => {
        document.getElementById("adminAuthError").innerText = "";
    });
}

// Realtime User Telemetry & Fleet Monitoring
function listenToUserTelemetry() {
    const userTableBody = document.getElementById("userMonitoringTableBody");
    const totalUsersElem = document.getElementById("totalUsersCount");
    const onlineUsersElem = document.getElementById("onlineUsersCount");
    const crashAlertsElem = document.getElementById("crashAlertsCount");
    const speedAlertsElem = document.getElementById("speedAlertsCount");

    database.ref("users").on("value", (snapshot) => {
        userTableBody.innerHTML = "";
        
        if (!snapshot.exists()) {
            userTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888;">No active user telemetry records found.</td></tr>`;
            if (totalUsersElem) totalUsersElem.innerText = "0";
            if (onlineUsersElem) onlineUsersElem.innerText = "0";
            if (crashAlertsElem) crashAlertsElem.innerText = "0";
            if (speedAlertsElem) speedAlertsElem.innerText = "0";
            allUsersCache = {};
            return;
        }

        let usersData = snapshot.val();
        allUsersCache = usersData;

        let totalUsers = 0;
        let onlineUsers = 0;
        let crashAlerts = 0;
        let speedAlerts = 0;

        for (let uid in usersData) {
            totalUsers++;
            let user = usersData[uid];

            let isOnline = user.isOnline || false;
            let currentSpeed = user.speed || 0;
            let speedAlertActive = currentSpeed > 100;

            if (isOnline) onlineUsers++;
            if (user.impactDetected) crashAlerts++;
            if (speedAlertActive) speedAlerts++;

            let statusBadge = isOnline ? 
                `<span class="badge" style="background:#00ff66; color:#000;">ONLINE</span>` : 
                `<span class="badge" style="background:#555; color:#fff;">OFFLINE</span>`;

            let impactBadge = user.impactDetected ? 
                `<span style="color:#ff0055; font-weight:bold;">🚨 CRASH</span>` : 
                `<span style="color:#00ff66;">NORMAL</span>`;

            let speedBadge = speedAlertActive ? 
                `<span style="color:#ffcc00; font-weight:bold;">⚠️ ${currentSpeed} KM/H</span>` : 
                `<span>${currentSpeed} KM/H</span>`;

            let row = `
                <tr>
                    <td><strong>${user.email || user.customId || uid}</strong></td>
                    <td>${statusBadge}</td>
                    <td>${speedBadge}</td>
                    <td>${user.activeCams || 'Quad Feed'}</td>
                    <td>${speedAlertActive ? 'YES' : 'NO'}</td>
                    <td>${impactBadge}</td>
                    <td>
                        <button class="cyber-btn rec-btn" onclick="deleteUserRecord('${uid}')" style="padding: 2px 8px; font-size: 11px;">Remove</button>
                    </td>
                </tr>
            `;
            userTableBody.innerHTML += row;
        }

        if (totalUsersElem) totalUsersElem.innerText = totalUsers;
        if (onlineUsersElem) onlineUsersElem.innerText = onlineUsers;
        if (crashAlertsElem) crashAlertsElem.innerText = crashAlerts;
        if (speedAlertsElem) speedAlertsElem.innerText = speedAlerts;
    });
}

// Bulk Download User Data in JSON Format
function bulkDownloadAllUserData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allUsersCache, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DRIVEVISION_Telemetry_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Bulk Download System Logs in XML Format
function bulkDownloadSystemLogs() {
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<DriveVisionLogs timestamp="${new Date().toISOString()}">\n`;
    for (let uid in allUsersCache) {
        let user = allUsersCache[uid];
        xmlContent += `  <User id="${uid}">\n`;
        xmlContent += `    <Email>${user.email || 'N/A'}</Email>\n`;
        xmlContent += `    <Speed>${user.speed || 0}</Speed>\n`;
        xmlContent += `    <Impact>${user.impactDetected || false}</Impact>\n`;
        xmlContent += `  </User>\n`;
    }
    xmlContent += `</DriveVisionLogs>`;

    const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DRIVEVISION_SystemLogs_${new Date().toISOString().slice(0,10)}.xml`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Delete User Record
function deleteUserRecord(uid) {
    if (confirm("Are you sure you want to delete this user telemetry record?")) {
        database.ref("users/" + uid).remove()
        .then(() => alert("User record removed successfully."))
        .catch((error) => alert("Error deleting user: " + error.message));
    }
                                  }
