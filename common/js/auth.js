// ==========================
// auth.js (เวอร์ชันปรับปรุง)
// ==========================

// 🔑 Key สำหรับ localStorage
const USERS_KEY = "pt_users";
const SESSION_SEEKER = "pt_seeker_session";
const SESSION_SHOP = "pt_shop_session";

// 📦 Utility functions
const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

// ฟังก์ชันแฮชรหัสผ่าน (จำลอง)
const hash = (s) => [...s].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0).toString();

// ✅ ดึงข้อมูลผู้ใช้ปัจจุบัน (จาก session ใด session หนึ่ง)
function getCurrentUser() {
  const email =
    localStorage.getItem(SESSION_SEEKER) ||
    localStorage.getItem(SESSION_SHOP);
  if (!email) return null;

  const users = loadUsers();
  return users.find(u => u.email === email) || null;
}

// ✅ ตรวจสอบการล็อกอิน (และ redirect ถ้ายังไม่ได้ล็อกอิน)
function requireLogin(redirect = true) {
  const user = getCurrentUser();
  if (!user && redirect) {
    Swal.fire({
      icon: "warning",
      title: "โปรดเข้าสู่ระบบก่อน",
      confirmButtonText: "ตกลง",
    }).then(() => (window.location.href = "../auth.html"));
  }
  return user;
}

// ✅ ออกจากระบบ (พร้อมแสดง popup)
function logout() {
  Swal.fire({
    icon: "question",
    title: "ออกจากระบบ?",
    text: "คุณต้องการออกจากระบบหรือไม่",
    showCancelButton: true,
    confirmButtonText: "ออกจากระบบ",
    cancelButtonText: "ยกเลิก",
  }).then((res) => {
    if (res.isConfirmed) {
      localStorage.removeItem(SESSION_SEEKER);
      localStorage.removeItem(SESSION_SHOP);
      Swal.fire({
        icon: "success",
        title: "ออกจากระบบเรียบร้อย 👋",
        timer: 1200,
        showConfirmButton: false,
      }).then(() => (window.location.href = "../auth.html"));
    }
  });
}

// ✅ บันทึก session เมื่อเข้าสู่ระบบ
function login(email, role) {
  if (!email || !role) return;
  if (role === "shop") localStorage.setItem(SESSION_SHOP, email);
  else localStorage.setItem(SESSION_SEEKER, email);
}

// ✅ สมัครสมาชิก (เพิ่มผู้ใช้ใหม่)
function registerUser(newUser) {
  const users = loadUsers();

  if (users.find(u => u.email === newUser.email)) {
    Swal.fire("⚠️", "อีเมลนี้ถูกใช้แล้ว", "warning");
    return false;
  }

  newUser.password_hash = hash(newUser.password);
  delete newUser.password;

  users.push(newUser);
  saveUsers(users);

  Swal.fire("✅", "สมัครสมาชิกเรียบร้อยแล้ว! กรุณาเข้าสู่ระบบ", "success");
  return true;
}

// ✅ รีเซ็ตรหัสผ่าน
function resetPassword(email, newPassword) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) {
    Swal.fire("❌", "ไม่พบบัญชีผู้ใช้นี้", "error");
    return false;
  }

  users[idx].password_hash = hash(newPassword);
  saveUsers(users);

  Swal.fire("✅", "เปลี่ยนรหัสผ่านสำเร็จ", "success");
  return true;
}

// ✅ ตรวจสอบ session อัตโนมัติทุกหน้า (ยกเว้น auth.html)
document.addEventListener("DOMContentLoaded", () => {
  const authPages = ["auth.html"];
  const page = window.location.pathname.split("/").pop();

  if (!authPages.includes(page)) {
    requireLogin(true);
  }
});
