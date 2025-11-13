// ==========================================
// utils.js — ฟังก์ชันทั่วไปของระบบ
// ใช้ได้ทุกหน้า เช่น auth.js, storage.js, reviews.js ฯลฯ
// ==========================================

// ✅ แปลง string ให้ปลอดภัยจาก XSS (ใช้ใน innerHTML)
export function escapeHtml(text = "") {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ✅ สร้างรหัส UID สั้น ๆ ใช้เป็น id งาน / รีวิว / ใบสมัคร
export function uid(prefix = "") {
  const rand = Math.random().toString(36).substring(2, 9);
  const time = Date.now().toString(36);
  return prefix + time + rand;
}

// ✅ เข้ารหัสรหัสผ่าน (Hash) — ปลอดภัยมากกว่าการเก็บ plain text
// หมายเหตุ: ใช้ base64-hash แบบง่ายใน frontend (ไม่ใช่การเข้ารหัสจริงใน production)
export async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// ✅ ตรวจสอบรหัสผ่านที่ hash แล้ว
export async function verifyPassword(inputPassword, hashedPassword) {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === hashedPassword;
}

// ✅ แปลงวันที่ให้อ่านง่าย เช่น "13 พ.ย. 2025 เวลา 14:30"
export function formatDateTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ✅ สร้าง OTP (เลข 6 หลัก)
export function generateOTP(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
  return otp;
}

// ✅ ดีเลย์ (ใช้ใน animation หรือจำลองการโหลดข้อมูล)
export function sleep(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ✅ แสดง Toast แจ้งเตือนสวย ๆ (ไม่ต้องใช้ alert)
export function showToast(message, type = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// สไตล์ของ Toast (inject เข้าไปในหน้าอัตโนมัติ)
if (!document.getElementById("toast-style")) {
  const style = document.createElement("style");
  style.id = "toast-style";
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: #5264f9;
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      font-family: "Prompt", sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      opacity: 0;
      transform: translateY(15px);
      transition: all 0.3s ease;
      z-index: 9999;
    }
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    .toast-success { background: #2ecc71; }
    .toast-error { background: #e74c3c; }
    .toast-warning { background: #f39c12; }
    .toast-info { background: #3498db; }
  `;
  document.head.appendChild(style);
}

// ✅ ตรวจสอบอีเมล (รูปแบบเบื้องต้น)
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ ตรวจสอบเบอร์โทรศัพท์ (เบื้องต้น: ไทย 10 หลัก)
export function isValidPhone(phone) {
  return /^0[0-9]{9}$/.test(phone);
}

// ✅ ตัดคำยาว (ใช้ในแสดง preview งาน)
export function truncate(text, maxLength = 100) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}
