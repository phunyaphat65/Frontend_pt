/**
 * seeker/js/seeker.js
 * -------------------
 * ตัวจัดการหลักของฝั่งผู้หางาน (Job Seeker)
 * - ตรวจสอบ session (role ต้องเป็น seeker)
 * - โหลดข้อมูลโปรไฟล์ผู้ใช้
 * - ฟังก์ชันออกจากระบบ
 * - ฟังก์ชันอำนวยความสะดวกทั่วไป
 */

(function () {
  const SESSION_KEY = "pt_session";
  const USERS_KEY = "pt_users";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const currentUser = getCurrentUser();

    // ถ้าไม่มี session ให้กลับไปหน้า login
    if (!currentUser) {
      redirectToLogin("กรุณาเข้าสู่ระบบก่อนเข้าใช้งาน");
      return;
    }

    // ตรวจสอบ role
    if (currentUser.role !== "seeker") {
      alert("บัญชีนี้ไม่ใช่ผู้หางาน");
      window.location.href = "../shop/dashboard.html";
      return;
    }

    // แสดงชื่อผู้ใช้ใน header
    const userLabel = document.getElementById("userLabel");
    if (userLabel) {
      userLabel.textContent = currentUser.name || currentUser.email;
    }

    // ตั้งค่าปุ่ม logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }

    console.log("✅ Seeker session loaded:", currentUser.email);
  }

  // ✅ ดึงข้อมูลผู้ใช้ปัจจุบัน
  function getCurrentUser() {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return users.find((u) => u.email === email);
  }

  // ✅ ฟังก์ชันออกจากระบบ
  function handleLogout() {
    if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "../auth.html";
    }
  }

  // ✅ ฟังก์ชันแจ้งเตือน + redirect
  function redirectToLogin(message = "") {
    if (message) alert(message);
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "../auth.html";
  }

  // ✅ ฟังก์ชันช่วยแปลงวันที่ให้สวยงาม
  window.formatDateTH = function (dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ✅ ฟังก์ชันแจ้งเตือนสวย ๆ
  window.showAlert = function (message, type = "info") {
    let alertBox = document.getElementById("alertBox");
    if (!alertBox) {
      alertBox = document.createElement("div");
      alertBox.id = "alertBox";
      document.body.appendChild(alertBox);
    }

    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";

    setTimeout(() => (alertBox.style.display = "none"), 3000);
  };

  // ✅ ฟังก์ชันดึงค่าจาก localStorage (ทั่วไป)
  window.getLocalData = function (key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  };

  // ✅ ฟังก์ชันบันทึกค่าลง localStorage
  window.saveLocalData = function (key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  };
})();
