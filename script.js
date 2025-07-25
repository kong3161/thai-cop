const video = document.getElementById("camera");
const canvas = document.getElementById("preview");
const locationInput = document.getElementById("location");

let latitude = "";
let longitude = "";
let currentStream = null;
let currentFacingMode = "environment";

// เปิดกล้องตามทิศทางที่กำหนด
function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  navigator.mediaDevices
    .getUserMedia({
      video: { facingMode: { exact: currentFacingMode } }
    })
    .then((stream) => {
      currentStream = stream;
      video.srcObject = stream;
    })
    .catch((err) => {
      alert("ไม่สามารถเข้าถึงกล้องได้: " + err.message);
    });
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
  const imageData = canvas.toDataURL("image/jpeg");

  if (!latitude || !longitude || !imageData) {
    alert("ข้อมูลไม่ครบ กรุณาลองใหม่");
    return;
  }

  console.log("📦 กำลังส่งข้อมูล:");
  console.log("ชื่อ:", name);
  console.log("รายละเอียด:", note);
  console.log("พิกัด:", latitude, longitude);
  console.log("ภาพ:", imageData.substring(0, 100) + "...");

  alert("📍 บันทึกข้อมูลเรียบร้อย (จำลอง)");
}

// เริ่มต้นเปิดกล้อง
startCamera();