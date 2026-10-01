
// FIREBASE INITIALIZATION & PERSISTENCE
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

// KEEP USER LOGGED IN PERSISTENTLY
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

let currentUser = null;
let userProfileData = null;

// AUTH TAB SWITCHER (Login / Register / Forgot)
function switchAuthTab(tab) {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('registerView').classList.add('hidden');
  document.getElementById('forgotView').classList.add('hidden');

  document.getElementById('tabLogin').classList.remove('active');
  document.getElementById('tabRegister').classList.remove('active');
  document.getElementById('tabForgot').classList.remove('active');

  document.getElementById('authMessage').innerText = '';

  if (tab === 'login') {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('tabLogin').classList.add('active');
  } else if (tab === 'register') {
    document.getElementById('registerView').classList.remove('hidden');
    document.getElementById('tabRegister').classList.add('active');
  } else if (tab === 'forgot') {
    document.getElementById('forgotView').classList.remove('hidden');
    document.getElementById('tabForgot').classList.add('active');
  }
}

// GENERATE RANDOM 5-DIGIT UNIQUE USER ID
function generateUnique5DigitID() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// REGISTER NEW USER WITH EXTENDED FIELDS
function registerUser() {
  const name = document.getElementById('regName').value.trim();
  const age = document.getElementById('regAge').value.trim();
  const contact = document.getElementById('regContact').value.trim();
  const country = document.getElementById('regCountry').value.trim();
  const pass = document.getElementById('regPass').value;
  const msg = document.getElementById('authMessage');

  if (!name || !contact || !pass || !country) {
    msg.innerText = "⚠️ Please fill in all the fields.!";
    return;
  }

  const email = contact.includes('@') ? contact : `${contact.replace(/[^0-9]/g, '')}@cyberhud.com`;
  const uniqueId = generateUnique5DigitID();

  msg.innerText = "⏳ Account is being created....";

  auth.createUserWithEmailAndPassword(email, pass)
    .then((cred) => {
      const uid = cred.user.uid;
      const profile = {
        uid: uid,
        uniqueId: uniqueId,
        name: name,
        age: age,
        contact: contact,
        country: country,
        email: cred.user.email,
        photoURL: "https://via.placeholder.com/80/00f3ff/000000?text=" + encodeURIComponent(name.charAt(0)),
        createdTime: Date.now()
      };

      // Save Profile in Database
      return db.ref(`users/${uid}/profile`).set(profile);
    })
    .then(() => {
      msg.innerText = "✅ Registration successful!";
    })
    .catch((err) => {
      msg.innerText = "❌ Error: " + err.message;
    });
}

// LOGIN EXISTING USER
function loginUser() {
  const contact = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const msg = document.getElementById('authMessage');

  if (!contact || !pass) {
    msg.innerText = "⚠️ Enter email/phone and password!";
    return;
  }

  const email = contact.includes('@') ? contact : `${contact.replace(/[^0-9]/g, '')}@cyberhud.com`;
  msg.innerText = "⏳ Verifying....";

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      msg.innerText = "✅ Login successful!";
    })
    .catch((err) => {
      msg.innerText = "❌ Incorrect information or password: " + err.message;
    });
}

// FORGOT PASSWORD RESET EMAIL
function resetUserPassword() {
  const email = document.getElementById('forgotEmail').value.trim();
  const msg = document.getElementById('authMessage');

  if (!email || !email.includes('@')) {
    msg.innerText = "⚠️ Please provide a valid email address!";
    return;
  }

  msg.innerText = "⏳ Password reset email is being sent....";

  auth.sendPasswordResetEmail(email)
    .then(() => {
      msg.innerText = "📧 A password reset link has been sent to your email. Please check!";
    })
    .catch((err) => {
      msg.innerText = "❌ Error: " + err.message;
    });
}

// AUTH STATE LISTENER & SESSION PERSISTENCE
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    document.getElementById('userAuthModal').style.display = 'none';

    // Fetch Profile Data
    db.ref(`users/${user.uid}/profile`).on('value', (snap) => {
      userProfileData = snap.val() || {};
      updateHUDProfileBadge();
    });

    // Realtime Presence Update
    db.ref(`users/${user.uid}/telemetry`).update({ isOnline: true });
    db.ref(`users/${user.uid}/telemetry`).onDisconnect().update({ isOnline: false });

  } else {
    currentUser = null;
    document.getElementById('userAuthModal').style.display = 'flex';
  }
});

// UPDATE HUD BADGE
function updateHUDProfileBadge() {
  if (!userProfileData) return;
  document.getElementById('badgeName').innerText = userProfileData.name || "User";
  document.getElementById('badgeId').innerText = `ID: ${userProfileData.uniqueId || '00000'}`;
}

// PROFILE MODAL FUNCTIONS
function openProfileModal() {
  if (!userProfileData) return;
  document.getElementById('dispUserName').innerText = userProfileData.name || "User";
  document.getElementById('dispUserId').innerText = `UNIQUE ID: ${userProfileData.uniqueId || '00000'}`;
  document.getElementById('dispUserEmail').innerText = `${userProfileData.contact || ''} (${userProfileData.country || ''})`;
  document.getElementById('editName').value = userProfileData.name || "";
  document.getElementById('editPhotoUrl').value = userProfileData.photoURL || "";
  
  if (userProfileData.photoURL) {
    document.getElementById('userProfileImg').src = userProfileData.photoURL;
  }

  document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('profileModal').classList.add('hidden');
}

function saveProfileChanges() {
  if (!currentUser) return;
  const newName = document.getElementById('editName').value.trim();
  const newPhoto = document.getElementById('editPhotoUrl').value.trim();

  db.ref(`users/${currentUser.uid}/profile`).update({
    name: newName,
    photoURL: newPhoto
  }).then(() => {
    alert("✅ Profile information has been successfully updated.!");
    closeProfileModal();
  });
}

// LOGOUT
function logoutUser() {
  if (currentUser) {
    db.ref(`users/${currentUser.uid}/telemetry`).update({ isOnline: false }).then(() => {
      auth.signOut().then(() => {
        window.location.reload();
      });
    });
  }
        }
