const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

const hudInput = document.getElementById('hudInput');
const keyboardContainer = document.getElementById('keyboard');
const cursor = document.getElementById('cursor');
const browserSection = document.getElementById('browser-section');
const urlDisplay = document.getElementById('urlDisplay');
const webFrame = document.getElementById('webFrame');
const statusPill = document.getElementById('status-pill');

// ১. ভার্চুয়াল কিবোর্ড তৈরি
const keys = [
  'Q','W','E','R','T','Y','U','I','O','P',
  'A','S','D','F','G','H','J','K','L',
  'Z','X','C','V','B','N','M',
  '1','2','3','4','5','6','7','8','9','0',
  'SPACE', 'BACK', 'SEARCH'
];

keys.forEach(key => {
  const btn = document.createElement('button');
  btn.className = 'key-btn';
  if (key === 'SPACE' || key === 'BACK') btn.classList.add('action-key');
  if (key === 'SEARCH') btn.classList.add('go-key');
  btn.innerText = key;
  btn.dataset.key = key;
  keyboardContainer.appendChild(btn);
});

// ব্রাউজার বন্ধ করার ফাংশন
function closeBrowser() {
  browserSection.classList.remove('active');
  webFrame.src = "about:blank";
}

// সার্চ চালুর ফাংশন
function executeSearch() {
  const query = hudInput.value.trim();
  if (!query) return;

  let targetUrl = query;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  }

  urlDisplay.innerText = targetUrl;
  webFrame.src = targetUrl;
  
  // স্বয়ংক্রিয়ভাবে স্প্লিট স্ক্রিনে সুইচ করবে (ক্যামেরা নিচে, ব্রাউজার উপরে)
  browserSection.classList.add('active');
}

// ২. অত্যন্ত ফাস্ট AI ট্র্যাকিং সেটআপ (মোবাইল কনফিগারেশন ফ্রেন্ডলি)
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0, // সুপার ফাস্ট পারফরম্যান্স
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

let latestFaceResults = null;
let latestHandResults = null;

faceMesh.onResults(results => { latestFaceResults = results; });
hands.onResults(results => { latestHandResults = results; });

// ৩. হাই-স্পিড রেন্ডারিং লুপ
let lastPinchTime = 0;

function renderLoop() {
  // ক্যানভাস সাইজ স্ক্রিন অনুযায়ী অ্যাডজাস্ট
  if (canvasElement.width !== canvasElement.clientWidth) {
    canvasElement.width = canvasElement.clientWidth;
    canvasElement.height = canvasElement.clientHeight;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // ক্যামেরা ফিড ড্র
  if (latestFaceResults && latestFaceResults.image) {
    canvasCtx.drawImage(latestFaceResults.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  // ফেইস ট্র্যাকিং ও হলুদ বর্ডার বক্স
  if (latestFaceResults && latestFaceResults.multiFaceLandmarks && latestFaceResults.multiFaceLandmarks.length > 0) {
    const landmarks = latestFaceResults.multiFaceLandmarks[0];
    let minX = canvasElement.width, minY = canvasElement.height, maxX = 0, maxY = 0;

    landmarks.forEach(pt => {
      const x = pt.x * canvasElement.width;
      const y = pt.y * canvasElement.height;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // হলুদ ডিজিটাল বক্স
    canvasCtx.strokeStyle = '#e3b341';
    canvasCtx.lineWidth = 3;
    canvasCtx.strokeRect(minX - 10, minY - 10, (maxX - minX) + 20, (maxY - minY) + 20);

    // ফেইস মেস লাইন ড্র
    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#00f0ff33', lineWidth: 1});
    statusPill.innerText = "⚡ আল্ট্রা-ফাস্ট ইশারা ও ফেইস ট্র্যাকিং সক্রিয়";
  }

  // হাতের আঙুলের ইশারা দিয়ে কার্সর চালনা
  if (latestHandResults && latestHandResults.multiHandLandmarks && latestHandResults.multiHandLandmarks.length > 0) {
    const handLandmarks = latestHandResults.multiHandLandmarks[0];
    
    drawConnectors(canvasCtx, handLandmarks, HAND_CONNECTIONS, {color: '#00f0ff', lineWidth: 2});
    drawLandmarks(canvasCtx, handLandmarks, {color: '#ff0055', radius: 2});

    const indexTip = handLandmarks[8]; // তর্জনী
    const thumbTip = handLandmarks[4]; // বুড়ো আঙুল

    // স্ক্রিনের সাথে সমন্বয়
    const cursorX = (1 - indexTip.x) * window.innerWidth;
    const cursorY = indexTip.y * window.innerHeight;

    cursor.style.display = 'block';
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    // চিমটি কাটা (Pinch Gesture) চেক
    const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

    if (distance < 0.055) { // আঙুল ছোঁয়ালে
      cursor.classList.add('clicking');
      const now = Date.now();
      if (now - lastPinchTime > 280) { // ২৮০ মিলি-সেকেন্ড কুলডাউন
        lastPinchTime = now;
        handleGesturePinch(cursorX, cursorY);
      }
    } else {
      cursor.classList.remove('clicking');
    }
  } else {
    cursor.style.display = 'none';
  }

  canvasCtx.restore();
  requestAnimationFrame(renderLoop);
}

// ৪. ইশারায় টাইপিং হ্যান্ডলার
function handleGesturePinch(x, y) {
  const elem = document.elementFromPoint(x, y);
  if (!elem) return;

  if (elem.classList.contains('key-btn')) {
    const key = elem.dataset.key;
    if (key === 'SPACE') {
      hudInput.value += ' ';
    } else if (key === 'BACK') {
      hudInput.value = hudInput.value.slice(0, -1);
    } else if (key === 'SEARCH') {
      executeSearch();
    } else {
      hudInput.value += key;
    }
  } else {
    elem.click();
  }
}

// ৫. অপটিমাইজড ক্যামেরা প্রসেসিং (320x240 রেজোলিউশন - ফাস্ট স্পিড)
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
    await hands.send({image: videoElement});
  },
  width: 320,
  height: 240,
  facingMode: 'user'
});

camera.start().then(() => {
  requestAnimationFrame(renderLoop);
}).catch(err => {
  statusPill.innerText = "ক্যামেরা চালুর ত্রুটি: " + err;
});
