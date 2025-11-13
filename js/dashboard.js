// ===========================
// dashboard.js (เวอร์ชันปรับปรุง)
// ===========================

// ตรวจสอบการล็อกอินก่อนเข้าใช้งาน
const user = requireLogin(true);

// ===========================
// ดึงข้อมูลจาก LocalStorage
// ===========================
function getData(key, defaultValue = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
  } catch {
    return defaultValue;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ===========================
// ดึงข้อมูลที่เกี่ยวข้องกับผู้ใช้
// ===========================
function getUserJobs(email) {
  const jobs = getData("pt_jobs", []);
  return jobs.filter(j => j.owner === email);
}

function getUserApplications(email) {
  const applications = getData("pt_applications", []);
  return applications.filter(a => a.user === email);
}

function getUserReviews(email) {
  const reviews = getData("pt_reviews", []);
  return reviews.filter(r => r.user === email || r.shop === email);
}

// ===========================
// แสดงข้อมูลบนหน้า Dashboard
// ===========================
function renderDashboard() {
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  const jobCountEl = document.getElementById("jobCount");
  const appCountEl = document.getElementById("appCount");
  const reviewCountEl = document.getElementById("reviewCount");

  // ดึงข้อมูลของ user
  nameEl.textContent = user?.name || "ไม่ทราบชื่อ";
  emailEl.textContent = user?.email || "-";

  // ดึงข้อมูลจากระบบ
  const jobs = getUserJobs(user.email);
  const apps = getUserApplications(user.email);
  const reviews = getUserReviews(user.email);

  jobCountEl.textContent = jobs.length;
  appCountEl.textContent = apps.length;
  reviewCountEl.textContent = reviews.length;

  // หากต้องการโชว์งานล่าสุด
  const latestJobsEl = document.getElementById("latestJobs");
  if (latestJobsEl) {
    latestJobsEl.innerHTML = jobs.length
      ? jobs.slice(-3).reverse().map(j => `
          <li>
            <strong>${j.title}</strong><br>
            💰 ${j.wage} บาท/ชม.<br>
            <small>${j.description || ''}</small>
          </li>
        `).join("")
      : `<li>ยังไม่มีงานที่สร้าง</li>`;
  }
}

// ===========================
// ปุ่มออกจากระบบ
// ===========================
document.getElementById("logoutBtn")?.addEventListener("click", logout);

// ===========================
// โหลดข้อมูลเมื่อเปิดหน้า
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  if (!user) return; // ป้องกัน error ซ้ำ
  renderDashboard();
});
