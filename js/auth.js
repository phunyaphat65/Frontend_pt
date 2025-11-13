// ==========================
// auth.js (เวอร์ชันปรับปรุง)
// ==========================

// กำหนด key ที่ใช้เก็บข้อมูลใน localStorage
const SESSION_KEY = "pt_session";
const USERS_KEY = "pt_users";

// ✅ ดึงข้อมูลผู้ใช้ปัจจุบัน
function getCurrentUser() {
  try {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return users.find(u => u.email === email) || null;
  } catch (err) {
    console.error("Error getting current user:", err);
    return null;
  }
}

// ✅ ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือยัง
function requireLogin(redirect = true) {
  const user = getCurrentUser();
  if (!user && redirect) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "auth.html"; // ไปหน้าเข้าสู่ระบบ
  }
  return user;
}

// ✅ ฟังก์ชันออกจากระบบ
function logout() {
  if (confirm("ต้องการออกจากระบบหรือไม่?")) {
    localStorage.removeItem(SESSION_KEY);
    alert("ออกจากระบบเรียบร้อยแล้ว 👋");
    window.location.href = "auth.html";
  }
}

// ✅ ฟังก์ชันล็อกอิน (เก็บ session)
function login(email) {
  if (!email) return;
  localStorage.setItem(SESSION_KEY, email);
}

// ✅ ฟังก์ชันสมัครสมาชิก (เพิ่มผู้ใช้ใหม่)
function registerUser(newUser) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  if (users.find(u => u.email === newUser.email)) {
    alert("อีเมลนี้มีอยู่ในระบบแล้ว");
    return false;
  }
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  alert("สมัครสมาชิกเรียบร้อย 🎉");
  return true;
}

// ✅ ฟังก์ชันรีเซ็ตรหัสผ่าน
function resetPassword(email, newPassword) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const index = users.findIndex(u => u.email === email);
  if (index === -1) {
    alert("ไม่พบผู้ใช้นี้ในระบบ");
    return false;
  }
  users[index].password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  alert("เปลี่ยนรหัสผ่านเรียบร้อย ✅");
  return true;
}

// ✅ ตัวอย่างการตรวจสอบ session อัตโนมัติในทุกหน้า (ยกเว้นหน้า auth)
document.addEventListener("DOMContentLoaded", () => {
  const authPages = ["auth.html", "register.html"];
  const currentPage = window.location.pathname.split("/").pop();
  if (!authPages.includes(currentPage)) {
    requireLogin(true);
  }
});
