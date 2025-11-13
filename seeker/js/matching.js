/**
 * seeker/js/matching.js
 * ระบบจับคู่งาน (Job Matching) สำหรับผู้หางาน
 * ใช้ข้อมูลจาก localStorage ทั้งผู้ใช้และร้านค้า
 */

(function () {
  const USERS_KEY = "pt_users";
  const JOBS_KEY = "pt_jobs";
  const APPLIED_KEY = "pt_applications";
  const SESSION_KEY = "pt_session";

  const container = document.getElementById("matchingList");
  const alertBox = document.getElementById("alertBox");

  let currentUser = null;

  // ✅ เริ่มต้นเมื่อโหลดหน้าเสร็จ
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    currentUser = getCurrentUser();

    if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบก่อนเข้าหน้านี้");
      window.location.href = "../auth.html";
      return;
    }

    const jobs = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
    if (jobs.length === 0) {
      container.innerHTML = `<p style="text-align:center;color:#666;">ยังไม่มีงานในระบบ</p>`;
      return;
    }

    renderMatchingJobs(jobs);
  }

  // ✅ ดึงข้อมูลผู้ใช้ปัจจุบัน
  function getCurrentUser() {
    const sessionEmail = localStorage.getItem(SESSION_KEY);
    if (!sessionEmail) return null;

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return users.find((u) => u.email === sessionEmail);
  }

  // ✅ เรนเดอร์รายการงานที่เหมาะสม
  function renderMatchingJobs(jobs) {
    const seekerSkills = currentUser.skills
      ? currentUser.skills.split(",").map((s) => s.trim().toLowerCase())
      : [];

    const userLat = currentUser.lat || 13.7563;
    const userLng = currentUser.lng || 100.5018;

    // ✅ ประเมินความเหมาะสมแต่ละงาน
    const scoredJobs = jobs.map((job) => {
      const jobSkills = job.skills
        ? job.skills.split(",").map((s) => s.trim().toLowerCase())
        : [];

      const skillMatch =
        seekerSkills.length > 0
          ? jobSkills.filter((s) => seekerSkills.includes(s)).length /
            jobSkills.length
          : 0;

      const distance = calculateDistance(userLat, userLng, job.lat, job.lng);
      const distanceScore = distance <= 5 ? 1 : distance <= 10 ? 0.7 : 0.4;

      const score = (skillMatch * 0.7 + distanceScore * 0.3) * 100;

      return { ...job, score: Math.round(score), distance };
    });

    // ✅ เรียงจากความเหมาะสมสูงสุด
    scoredJobs.sort((a, b) => b.score - a.score);

    container.innerHTML = "";
    scoredJobs.forEach((job) => {
      const jobEl = document.createElement("div");
      jobEl.className = "job-card";
      jobEl.innerHTML = `
        <div class="job-header">
          <h3>${job.title}</h3>
          <span class="score">${job.score}% ตรงกับคุณ</span>
        </div>
        <p><strong>ร้าน:</strong> ${job.shop_name}</p>
        <p><strong>ทักษะที่ต้องการ:</strong> ${job.skills}</p>
        <p><strong>ระยะทาง:</strong> ${job.distance.toFixed(1)} กม.</p>
        <p><strong>สถานที่:</strong> ${job.address}</p>
        <button class="apply-btn" data-id="${job.id}">สมัครงานนี้</button>
      `;
      container.appendChild(jobEl);
    });

    // ✅ ติดตั้ง event ให้ปุ่มสมัคร
    document.querySelectorAll(".apply-btn").forEach((btn) => {
      btn.addEventListener("click", handleApply);
    });
  }

  // ✅ ฟังก์ชันคำนวณระยะทาง (Haversine formula)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat2 || !lon2) return 999;
    const R = 6371; // km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // ✅ สมัครงาน
  function handleApply(e) {
    const jobId = e.target.dataset.id;
    const allApplications = JSON.parse(localStorage.getItem(APPLIED_KEY) || "[]");

    // ตรวจสอบว่าผู้ใช้สมัครแล้วหรือยัง
    const alreadyApplied = allApplications.some(
      (a) => a.jobId === jobId && a.userEmail === currentUser.email
    );
    if (alreadyApplied) {
      showAlert("⚠️ คุณสมัครงานนี้แล้ว", "warning");
      return;
    }

    const newApplication = {
      id: `app_${Date.now()}`,
      jobId,
      userEmail: currentUser.email,
      date: new Date().toISOString(),
      status: "รอดำเนินการ",
    };

    allApplications.push(newApplication);
    localStorage.setItem(APPLIED_KEY, JSON.stringify(allApplications));

    showAlert("✅ สมัครงานสำเร็จ!", "success");
  }

  // ✅ แสดง alert สวยๆ ด้านบน
  function showAlert(msg, type = "info") {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";
    setTimeout(() => (alertBox.style.display = "none"), 2500);
  }
})();
