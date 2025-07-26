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

// จำลองการบันทึกข้อมูล
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

  console.log("📦 กำลังส่งข้อมูล:");
  console.log("ชื่อ:", name);
  console.log("รายละเอียด:", note);
  console.log("เพศ:", gender);
  console.log("อายุโดยประมาณ:", approxAge);
  console.log("ลักษณะภายนอก:", appearance);
  console.log("อาการ:", condition);
  console.log("พิกัด:", latitude, longitude);
  console.log("เวลา:", timestamp);
  console.log("ภาพ:", imageData.substring(0, 100) + "...");

  alert("📍 บันทึกข้อมูลเรียบร้อย (จำลอง)");
}

// เริ่มต้นเปิดกล้อง
startCamera();

// ขอพิกัดใหม่
function requestNewLocation() {
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
}

// ผูกฟังก์ชันกับปุ่มรีเฟรชพิกัด
const refreshBtn = document.getElementById("refresh-location");
if (refreshBtn) {
  refreshBtn.addEventListener("click", requestNewLocation);
}
