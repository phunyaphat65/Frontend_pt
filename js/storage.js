// ==========================================
// storage.js — จัดการฐานข้อมูล LocalStorage
// ใช้ร่วมกับระบบ Part-time Match
// ==========================================

// 🔑 คีย์หลักใน localStorage
const STORAGE_KEYS = {
  USERS: "pt_users",
  SESSION: "pt_session",
  JOBS: "pt_jobs",
  APPLICATIONS: "pt_applications",
  REVIEWS: "pt_reviews",
  PROFILES: "pt_profiles",
};

// ------------------------------
// ✅ ฟังก์ชันพื้นฐาน
// ------------------------------

/**
 * อ่านข้อมูลจาก localStorage
 * @param {string} key
 * @param {*} defaultValue - ค่าเริ่มต้นหากไม่มีข้อมูล
 */
export function getData(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error("❌ อ่านข้อมูลล้มเหลว:", key, err);
    return defaultValue;
  }
}

/**
 * บันทึกข้อมูลลง localStorage
 * @param {string} key
 * @param {*} value
 */
export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("❌ บันทึกข้อมูลล้มเหลว:", key, err);
  }
}

/**
 * ลบข้อมูล
 * @param {string} key
 */
export function removeData(key) {
  localStorage.removeItem(key);
}

/**
 * รีเซ็ตระบบทั้งหมด (ล้างทุกข้อมูล)
 */
export function clearAllData() {
  if (confirm("แน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดในระบบ?")) {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    alert("รีเซ็ตข้อมูลทั้งหมดแล้ว ✅");
  }
}

/**
 * สร้าง ID อัตโนมัติ (แบบ timestamp)
 */
export function generateId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

// ------------------------------
// 👤 ระบบผู้ใช้
// ------------------------------

/**
 * บันทึกผู้ใช้ใหม่
 */
export function registerUser(userData) {
  const users = getData(STORAGE_KEYS.USERS, []);
  const exists = users.some(u => u.email === userData.email);
  if (exists) throw new Error("อีเมลนี้ถูกใช้งานแล้ว");

  users.push(userData);
  saveData(STORAGE_KEYS.USERS, users);
}

/**
 * ตรวจสอบการเข้าสู่ระบบ
 */
export function loginUser(email, password) {
  const users = getData(STORAGE_KEYS.USERS, []);
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");

  saveData(STORAGE_KEYS.SESSION, email);
  return user;
}

/**
 * ออกจากระบบ
 */
export function logoutUser() {
  removeData(STORAGE_KEYS.SESSION);
  location.href = "auth.html";
}

/**
 * ดึงข้อมูลผู้ใช้ที่กำลังล็อกอินอยู่
 */
export function getCurrentUser() {
  const email = getData(STORAGE_KEYS.SESSION);
  if (!email) return null;
  const users = getData(STORAGE_KEYS.USERS, []);
  return users.find(u => u.email === email) || null;
}

/**
 * บังคับให้ต้องล็อกอินก่อนถึงจะเข้าได้
 * @param {boolean} redirect - ถ้า true จะ redirect ไปหน้า auth.html เมื่อไม่ได้ล็อกอิน
 */
export function requireLogin(redirect = false) {
  const user = getCurrentUser();
  if (!user && redirect) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    location.href = "auth.html";
  }
  return user;
}

// ------------------------------
// 💼 งาน (Jobs)
// ------------------------------

export function getJobs() {
  return getData(STORAGE_KEYS.JOBS, []);
}

export function saveJobs(jobs) {
  saveData(STORAGE_KEYS.JOBS, jobs);
}

// ------------------------------
// 📝 ใบสมัครงาน (Applications)
// ------------------------------

export function getApplications() {
  return getData(STORAGE_KEYS.APPLICATIONS, []);
}

export function saveApplications(apps) {
  saveData(STORAGE_KEYS.APPLICATIONS, apps);
}

// ------------------------------
// ⭐ รีวิวร้าน
// ------------------------------

export function getReviews() {
  return getData(STORAGE_KEYS.REVIEWS, []);
}

export function saveReviews(reviews) {
  saveData(STORAGE_KEYS.REVIEWS, reviews);
}

// ------------------------------
// 📄 โปรไฟล์ผู้ใช้
// ------------------------------

export function getProfiles() {
  return getData(STORAGE_KEYS.PROFILES, {});
}

export function saveProfiles(profiles) {
  saveData(STORAGE_KEYS.PROFILES, profiles);
}

export function getProfileByEmail(email) {
  const profiles = getProfiles();
  return profiles[email] || {};
}

export function saveProfile(email, data) {
  const profiles = getProfiles();
  profiles[email] = data;
  saveProfiles(profiles);
}
