const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const statusDiv = document.getElementById('status');
const urlInput = document.getElementById('urlInput');
const webFrame = document.getElementById('webFrame');
const cursor = document.getElementById('cursor');
const keyboardContainer = document.getElementById('keyboard');

// ১. ভার্চুয়াল কিবোর্ড জেনারেট করা
const keys = [
  'Q','W','E','R','T','Y','U','I','O','P',
  'A','S','D','F','G','H','J','K','L',
  'Z','X','C','V','B','N','M',
  '1','2','3','4','5','6','7','8','9','0',
  'SPACE', 'BACK', 'GO'
];

keys.forEach(key => {
  const btn = document.createElement('button');
  btn.className = 'key-btn';
  btn.innerText = key;
  btn.dataset.key = key;
  keyboardContainer.appendChild(btn);
});

function loadUrl() {
  let url = urlInput.value.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://www.bing.com/search?q=' + encodeURIComponent(url);
  }
  webFrame.src = url;
}

// ২. আল্ট্রা-ফাস্ট AI মডেল সেটআপ
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: false, // ফাস্ট স্পিডের জন্য
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0, // আল্ট্রা ফাস্ট পারফরম্যান্স
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

let latestFaceResults = null;
let latestHandResults = null;

faceMesh.onResults(results => { latestFaceResults = results; });
hands.onResults(results => { latestHandResults = results; });

// ৩. হাই-স্পিড রেন্ডারিং লুপ (FPS Boost)
let lastPinchTime = 0;

function drawFrame() {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // ক্যামেরা ফ্রেম আঁকা
  if (latestFaceResults && latestFaceResults.image) {
    canvasCtx.drawImage(latestFaceResults.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  // ছবির মতো ফেসে হলুদ বক্স ও ট্র্যাকিং ড্র করা
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

    // হলুদ বর্ডার বক্স (Image 2 Style)
    canvasCtx.strokeStyle = '#e3b341';
    canvasCtx.lineWidth = 3;
    canvasCtx.strokeRect(minX - 12, minY - 12, (maxX - minX) + 24, (maxY - minY) + 24);
    
    // ফেস মেস আঁকা
    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#00ffcc40', lineWidth: 1});
    statusDiv.innerText = "⚡ আল্ট্রা-ফাস্ট ইশারা ও ফেস ট্র্যাকিং চালু রয়েছে!";
  }

  // হাতের ইশারা দিয়ে কার্সর ও ক্লিক কন্ট্রোল
  if (latestHandResults && latestHandResults.multiHandLandmarks && latestHandResults.multiHandLandmarks.length > 0) {
    const handLandmarks = latestHandResults.multiHandLandmarks[0];
    drawConnectors(canvasCtx, handLandmarks, HAND_CONNECTIONS, {color: '#ff0055', lineWidth: 2});
    drawLandmarks(canvasCtx, handLandmarks, {color: '#ffffff', radius: 2});

    const indexTip = handLandmarks[8]; // তর্জনী
    const thumbTip = handLandmarks[4]; // বুড়ো আঙুল

    // কার্সরের পজিশন গণনা (মিরর ইফেক্ট সহ)
    const cursorX = (1 - indexTip.x) * window.innerWidth;
    const cursorY = indexTip.y * window.innerHeight;

    cursor.style.display = 'block';
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    // আঙুলের জোড়া লাগানোর দূরত্ব (Pinch Detection)
    const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

    if (distance < 0.05) { // আঙুল ছোঁয়ালে ক্লিক
      cursor.classList.add('clicking');
      const now = Date.now();
      if (now - lastPinchTime > 300) { 
        lastPinchTime = now;
        handleGestureClick(cursorX, cursorY);
      }
    } else {
      cursor.classList.remove('clicking');
    }
  } else {
    cursor.style.display = 'none';
  }

  canvasCtx.restore();
  requestAnimationFrame(drawFrame);
}

// ৪. ইশারায় টাইপিং ও ক্লিক হ্যান্ডলার
function handleGestureClick(x, y) {
  const elem = document.elementFromPoint(x, y);
  if (!elem) return;

  if (elem.classList.contains('key-btn')) {
    const key = elem.dataset.key;
    if (key === 'SPACE') {
      urlInput.value += ' ';
    } else if (key === 'BACK') {
      urlInput.value = urlInput.value.slice(0, -1);
    } else if (key === 'GO') {
      loadUrl();
    } else {
      urlInput.value += key;
    }
  } else if (elem.classList.contains('btn-go')) {
    loadUrl();
  } else {
    elem.click();
  }
}

// ৫. ক্যামেরা চালু করা
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
    await hands.send({image: videoElement});
  },
  width: 480,
  height: 360,
  facingMode: 'user'
});

camera.start().then(() => {
  requestAnimationFrame(drawFrame);
}).catch(err => {
  statusDiv.innerText = "ক্যামেরা ত্রুটি: " + err;
});
