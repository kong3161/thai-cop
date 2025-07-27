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

async function generatePersonCode() {
  const res = await fetch("https://alqdcyxbxmhotkyzicgv.supabase.co/rest/v1/reports?select=person_code", {
    headers: {
      apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWRjeXhieG1ob3RreXppY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQ3MTgsImV4cCI6MjA2OTExMDcxOH0.9OZIc6YMlcOvd85y7gwZdi7Pqn5f_1SdIJ7YI20beSU",
      Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWRjeXhieG1ob3RreXppY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQ3MTgsImV4cCI6MjA2OTExMDcxOH0.9OZIc6YMlcOvd85y7gwZdi7Pqn5f_1SdIJ7YI20beSU"
    }
  });
  const data = await res.json();
  const existingCodes = data
    .map(item => item.person_code)
    .filter(code => code && code.startsWith('P'))
    .map(code => parseInt(code.slice(1)))
    .sort((a, b) => b - a);

  const nextNum = existingCodes.length > 0 ? existingCodes[0] + 1 : 1;
  const newCode = `P${String(nextNum).padStart(4, '0')}`;
  const personCodeInput = document.getElementById("person_code");
  if (personCodeInput) personCodeInput.value = newCode;
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

async function uploadToCloudinary() {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "unsigned_preset");

      try {
        const res = await fetch("https://api.cloudinary.com/v1_1/dibfdc1ft/image/upload", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (!data.secure_url) {
          reject(new Error("การอัปโหลดภาพไปยัง Cloudinary ล้มเหลว"));
        } else {
          resolve(data.secure_url);
        }
      } catch (error) {
        reject(error);
      }
    }, "image/jpeg");
  });
}

async function submitData() {
  const personCodeInput = document.getElementById("person_code");
  let personCode = personCodeInput.value.trim();

  if (!personCode) {
    // ดึง person_code ล่าสุดจาก Supabase
    const res = await fetch("https://alqdcyxbxmhotkyzicgv.supabase.co/rest/v1/reports?select=person_code&order=person_code.desc&limit=1", {
      headers: {
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWRjeXhieG1ob3RreXppY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQ3MTgsImV4cCI6MjA2OTExMDcxOH0.9OZIc6YMlcOvd85y7gwZdi7Pqn5f_1SdIJ7YI20beSU",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWRjeXhieG1ob3RreXppY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzQ3MTgsImV4cCI6MjA2OTExMDcxOH0.9OZIc6YMlcOvd85y7gwZdi7Pqn5f_1SdIJ7YI20beSU"
      }
    });
    const last = await res.json();
    const lastCode = last[0]?.person_code || "P0000";
    const number = parseInt(lastCode.replace("P", ""), 10) + 1;
    personCode = "P" + number.toString().padStart(4, "0");
    personCodeInput.value = personCode;
  }

  const name = document.getElementById("name").value;
  const note = document.getElementById("note").value;
  const gender = document.getElementById("gender").value;
  const approxAge = document.getElementById("approx_age").value;
  const appearance = document.getElementById("appearance").value;
  const condition = document.getElementById("condition").value;
  const timestamp = new Date().toISOString();

  if (!latitude || !longitude) {
    alert("ข้อมูลไม่ครบ กรุณาลองใหม่");
    return;
  }

  const imageData = canvas.toDataURL("image/jpeg");

  try {
    const imageUrl = await uploadToCloudinary();
    console.log("Image URL:", imageUrl);

    const response = await fetch("https://alqdcyxbxmhotkyzicgv.supabase.co/rest/v1/reports", {
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
        image: imageUrl,
        person_code: personCode
      })
    });

    if (!response.ok) throw new Error("ไม่สามารถบันทึกข้อมูลได้");
    const data = await response.json();
    alert("📍 บันทึกข้อมูลเรียบร้อย");
    console.log("บันทึกสำเร็จ:", data);

  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
    console.error(error);
  }
}

// เริ่มต้นเปิดกล้อง
startCamera();
generatePersonCode();

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
