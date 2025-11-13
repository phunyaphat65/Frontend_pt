// ======================================
// seeker.js — สำหรับผู้หางาน (Job Seeker)
// ======================================

// ------------------------------
// ตรวจสอบการเข้าสู่ระบบ
// ------------------------------
const user = requireLogin(true); // ใช้ฟังก์ชันจาก auth.js (เวอร์ชันปรับปรุง)

// ------------------------------
// LocalStorage Keys
// ------------------------------
const JOBS_KEY = "pt_jobs";
const APPLICATIONS_KEY = "pt_applications";
const PROFILES_KEY = "pt_profiles";

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

// ------------------------------
// ฟังก์ชันสมัครงาน
// ------------------------------
function applyForJob(jobId) {
  const jobs = getData(JOBS_KEY);
  const job = jobs.find(j => j.id === jobId);
  if (!job) return alert("ไม่พบบางงานนี้ในระบบ ❌");

  const applications = getData(APPLICATIONS_KEY);
  const alreadyApplied = applications.find(
    a => a.jobId === jobId && a.email === user.email
  );
  if (alreadyApplied) return alert("คุณได้สมัครงานนี้แล้ว ✅");

  const newApp = {
    id: Date.now(),
    jobId,
    jobTitle: job.title,
    email: user.email,
    status: "รอตรวจสอบ",
    date: new Date().toISOString()
  };

  applications.push(newApp);
  saveData(APPLICATIONS_KEY, applications);
  alert("สมัครงานเรียบร้อย 🎉");
  renderApplications();
}

// ------------------------------
// แสดงรายการใบสมัครของผู้ใช้
// ------------------------------
function renderApplications() {
  const container = document.getElementById("applications");
  if (!container) return;

  const applications = getData(APPLICATIONS_KEY).filter(
    a => a.email === user.email
  );

  if (!applications.length) {
    container.innerHTML =
      `<p style="color:#777;text-align:center;">คุณยังไม่มีใบสมัครงาน</p>`;
    return;
  }

  container.innerHTML = applications
    .map(app => `
      <div class="app-card">
        <div class="app-header">
          <strong>${app.jobTitle}</strong>
          <span class="status ${app.status === "รับแล้ว" ? "success" : ""}">
            ${app.status}
          </span>
        </div>
        <div class="app-footer">
          <small>สมัครเมื่อ ${new Date(app.date).toLocaleString("th-TH")}</small>
        </div>
      </div>
    `)
    .join("");
}

// ------------------------------
// แสดงรายการงานที่เปิดอยู่
// ------------------------------
function renderJobList() {
  const list = document.getElementById("jobList");
  if (!list) return;

  const jobs = getData(JOBS_KEY);
  if (!jobs.length) {
    list.innerHTML = `<p style="color:#777;text-align:center;">ยังไม่มีงานที่เปิดรับ</p>`;
    return;
  }

  list.innerHTML = jobs
    .map(job => `
      <div class="job-card">
        <div class="job-header">
          <h3>${job.title}</h3>
          <span class="wage">💰 ${job.wage} บาท/ชม.</span>
        </div>
        <p>${job.description || "ไม่มีรายละเอียด"}</p>
        <button onclick="applyForJob(${job.id})">📄 สมัครงานนี้</button>
      </div>
    `)
    .join("");
}

// ------------------------------
// Event: โหลดข้อมูลเมื่อเริ่มต้น
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderApplications();
  renderJobList();
});
