// Auto-start camera when DOM content is loaded
window.addEventListener("DOMContentLoaded", () => {
    startCamera();
});

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
            let videoElement = document.getElementById("webcam1");
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.play();
            }
        })
        .catch(function (error) {
            console.error("Camera access error:", error);
            alert("Camera access denied. Please check your browser permissions.");
        });
    } else {
        alert("Camera feature is not supported by your browser.");
    }
}

// Expand single camera inside HUD Grid Box area (Without hiding HUD Controls)
function toggleFullScreen(element) {
    const camBoxes = document.querySelectorAll('.cam-box');
    
    // If already expanded, reset back to 4-box grid view
    if (element.classList.contains('expanded-grid-box')) {
        camBoxes.forEach(box => {
            box.style.display = 'flex';
            box.classList.remove('expanded-grid-box');
        });
    } else {
        // Expand selected camera box inside the grid container and hide others
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
