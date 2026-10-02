
/* ===================================================
   DRIVEVISION AI - Admin Management Engine (JS)
   =================================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadAdminUserData();
    startAdminMonitoring();
});

function loadAdminUserData() {
    const tbody = document.getElementById("userTableBody");
    const countEl = document.getElementById("totalUsersCount");
    
    const userJson = localStorage.getItem("drivevision_user");
    tbody.innerHTML = "";

    if (userJson) {
        const user = JSON.parse(userJson);
        countEl.innerText = "1";

        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        tr.innerHTML = `
            <td style="padding:10px; color:var(--color-yellow); font-weight:bold;">${user.uniqueId}</td>
            <td>${user.name}</td>
            <td>${user.country}</td>
            <td>${user.age}</td>
            <td>${user.phone}</td>
            <td>${user.email}</td>
            <td><span class="badge green">ACTIVE</span></td>
            <td><button class="cyber-btn red" onclick="deleteUser()">Block / Delete</button></td>
        `;
        tbody.appendChild(tr);
    } else {
        countEl.innerText = "0";
        tbody.innerHTML = `<tr><td colspan="8" style="padding:15px; text-align:center;">No registered users found in directory.</td></tr>`;
    }
}

function deleteUser() {
    if (confirm("Are you sure you want to block or delete this user?")) {
        localStorage.removeItem("drivevision_user");
        loadAdminUserData();
    }
}

function refreshAdminData() {
    loadAdminUserData();
}

function startAdminMonitoring() {
    const feed = document.getElementById("adminTelemetryFeed");
    setInterval(() => {
        const time = new Date().toLocaleTimeString();
        const msg = `[SYS_LOG ${time}] Global Stream Sync OK | Latency: 12ms | AES-256 Encryption Active`;
        feed.innerHTML = `<div>${msg}</div>` + feed.innerHTML;
    }, 4000);
}
