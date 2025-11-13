// ======================================
// shop.js — สำหรับผู้ประกอบการ (ร้านค้า)
// ======================================

// ------------------------------
// ตรวจสอบการเข้าสู่ระบบ
// ------------------------------
const user = requireLogin(true); // ใช้ฟังก์ชันจาก auth.js ที่ปรับปรุงแล้ว

// ------------------------------
// คีย์หลักใน localStorage
// ------------------------------
const JOBS_KEY = "pt_jobs";
const APPLICATIONS_KEY = "pt_applications";
const USERS_KEY = "pt_users";

// ------------------------------
// Utility Functions
// ------------------------------
function getData(key, defaultValue = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
  } catch {
    return defaultValue;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now();
}

// ------------------------------
// เพิ่มงานใหม่
// ------------------------------
function addJob(e) {
  e.preventDefault();
  const title = e.target.title.value.trim();
  const wage = e.target.wage.value.trim();
  const description = e.target.description.value.trim();

  if (!title || !wage) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

  const jobs = getData(JOBS_KEY);
  const newJob = {
    id: generateId(),
    shopEmail: user.email,
    title,
    wage: parseFloat(wage),
    description,
    createdAt: new Date().toISOString(),
  };

  jobs.push(newJob);
  saveData(JOBS_KEY, jobs);

  e.target.reset();
  alert("เพิ่มงานสำเร็จ 🎉");
  renderMyJobs();
}

// ------------------------------
// ลบงาน
// ------------------------------
function deleteJob(jobId) {
  if (!confirm("ต้องการลบงานนี้ใช่หรือไม่?")) return;

  let jobs = getData(JOBS_KEY);
  jobs = jobs.filter(j => j.id !== jobId || j.shopEmail !== user.email);
  saveData(JOBS_KEY, jobs);

  alert("ลบงานเรียบร้อย 🗑️");
  renderMyJobs();
}

// ------------------------------
// แสดงรายการงานของฉัน
// ------------------------------
function renderMyJobs() {
  const container = document.getElementById("myJobs");
  if (!container) return;

  const jobs = getData(JOBS_KEY).filter(j => j.shopEmail === user.email);

  if (!jobs.length) {
    container.innerHTML = `<p style="color:#777;text-align:center;">ยังไม่มีงานที่คุณเพิ่ม</p>`;
    return;
  }

  container.innerHTML = jobs
    .map(
      job => `
      <div class="job-card">
        <div class="job-header">
          <strong>${job.title}</strong>
          <span class="wage">💰 ${job.wage} บาท/ชม.</span>
        </div>
        <p>${job.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
        <div class="job-footer">
          <small>เพิ่มเมื่อ ${new Date(job.createdAt).toLocaleString("th-TH")}</small>
          <button class="btn-delete" onclick="deleteJob(${job.id})">ลบ</button>
        </div>
      </div>
    `
    )
    .join("");
}

// ------------------------------
// Event: โหลดข้อมูลเมื่อเริ่มต้น
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addJobForm");
  if (form) form.addEventListener("submit", addJob);
  renderMyJobs();
});
