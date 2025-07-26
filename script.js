const video = document.getElementById("camera");
const canvas = document.getElementById("preview");
const locationInput = document.getElementById("location");

let latitude = "";
let longitude = "";
let currentStream = null;
let currentFacingMode = "environment";

// เปิดกล้องตามทิศทางที่กำหนด
async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: currentFacingMode } }
    });
    currentStream = stream;
    video.srcObject = stream;
    video.play();
  } catch (err) {
    alert("ไม่สามารถเปิดกล้องได้: " + err.message);
    console.error("Camera error:", err);
  }
}

// สลับกล้อง
function switchCamera() {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
}

// ดึงตำแหน่ง GPS
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition((position) => {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    locationInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    // แสดงแผนที่ด้วย Leaflet
    const map = L.map('map').setView([latitude, longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([latitude, longitude]).addTo(map);
  }, () => {
    locationInput.value = "ไม่สามารถระบุตำแหน่งได้";
  });
}

// ถ่ายภาพ
function capturePhoto() {
  canvas.style.display = "block";
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
}

function submitData() {
  const name = document.getElementById("name").value;
  const note = document.getElementById("note").value;
  const gender = document.getElementById("gender").value;
  const approxAge = document.getElementById("approx_age").value;
  const appearance = document.getElementById("appearance").value;
  const condition = document.getElementById("condition").value;
  const imageData = canvas.toDataURL("image/jpeg");
  const timestamp = new Date().toISOString();

  if (!latitude || !longitude || !imageData) {
    alert("ข้อมูลไม่ครบ กรุณาลองใหม่");
    return;
  }

  // ส่งข้อมูลเข้า Supabase
  fetch("https://alqdcyxbxmhotkyzicgv.supabase.co/rest/v1/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWRjeXhieG1ob3RreXppY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQ3MTgsImV4cCI6MjA2OTExMDcxOH0.9OZIc6YMlcOvd85y7gwZdi7Pqn5f_1SdIJ7YI20beSU",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWRjeXhieG1ob3RreXppY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQ3MTgsImV4cCI6MjA2OTExMDcxOH0.9OZIc6YMlcOvd85y7gwZdi7Pqn5f_1SdIJ7YI20beSU",
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      name,
      note,
      gender,
      approx_age: parseInt(approxAge),
      appearance,
      condition,
      latitude,
      longitude,
      timestamp,
      image: imageData
    })
  })
  .then(response => {
    if (!response.ok) throw new Error("ไม่สามารถบันทึกข้อมูลได้");
    return response.json();
  })
  .then(data => {
    alert("📍 บันทึกข้อมูลเรียบร้อย");
    console.log("บันทึกสำเร็จ:", data);
  })
  .catch(error => {
    alert("เกิดข้อผิดพลาด: " + error.message);
    console.error(error);
  });
}

// เริ่มต้นเปิดกล้อง
startCamera();

// ขอพิกัดและเวลาใหม่
function refreshLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      locationInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      // อัปเดตแผนที่
      const map = L.map('map').setView([latitude, longitude], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([latitude, longitude]).addTo(map);
    }, () => {
      locationInput.value = "ไม่สามารถระบุตำแหน่งได้";
    });
  }

  // อัปเดต timestamp
  const timestamp = new Date();
  const options = { 
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  };
  const timestampElement = document.getElementById("timestampDisplay");
  if (timestampElement) {
    timestampElement.textContent =
      "เวลาที่ระบบบันทึก: " + timestamp.toLocaleString('th-TH', options);
  }
}

// ผูกฟังก์ชันกับปุ่มรีเฟรชพิกัด
const refreshBtn = document.getElementById("refresh-location");
if (refreshBtn) {
  refreshBtn.addEventListener("click", refreshLocation);
}
