// ----------------------------------------------------------
// seeker/js/jobs.js
// แสดงรายการงาน, ระบบค้นหา, สมัครงาน + แสดงบนแผนที่
// ----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const JOBS_KEY = "pt_jobs";
  const USERS_KEY = "pt_users";
  const APPS_KEY = "pt_applications";

  const SESSION_SEEKER = "pt_seeker_session";
  const SESSION_SHOP = "pt_shop_session";

  const jobList = document.getElementById("jobsList");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  const modal = document.getElementById("jobModal");
  const closeModalBtn = document.getElementById("closeJobModal");
  const applyBtn = document.getElementById("applyBtn");

  const jobTitle = document.getElementById("jobTitle");
  const shopName = document.getElementById("shopName");
  const jobCategory = document.getElementById("jobCategory");
  const jobWage = document.getElementById("jobWage");
  const jobStartDate = document.getElementById("jobStartDate");
  const jobLocation = document.getElementById("jobLocation");
  const jobDesc = document.getElementById("jobDesc");

  let selectedJobId = null;
  let map, markers = [];

  // --------------------------
  // ตรวจสอบ session
  // --------------------------
  const currentEmail = localStorage.getItem(SESSION_SEEKER);
  if (!currentEmail) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "../auth.html";
    return;
  }

  // --------------------------
  // โหลดข้อมูล
  // --------------------------
  const loadJobs = () => JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  const loadApplications = () => JSON.parse(localStorage.getItem(APPS_KEY) || "[]");

  // --------------------------
  // สมัครงาน
  // --------------------------
  function applyJob(jobId) {
    const jobs = loadJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return alert("ไม่พบนางานนี้");

    const apps = loadApplications();
    const already = apps.find(a => a.user === currentEmail && a.jobId === jobId);
    if (already) return alert("คุณได้สมัครงานนี้ไปแล้ว");

    const newApp = {
      id: Date.now(),
      user: currentEmail,
      jobId,
      jobTitle: job.title,
      shopName: job.shopName,
      date: new Date().toISOString(),
      status: "รอการตรวจสอบ"
    };

    apps.push(newApp);
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));

    alert(`สมัครงาน "${job.title}" สำเร็จแล้ว`);
    modal.classList.remove("active");
    renderJobs(searchInput.value, categoryFilter.value);
  }

  // --------------------------
  // แสดง Modal รายละเอียดงาน
  // --------------------------
  function openJobModal(job) {
    selectedJobId = job.id;
    jobTitle.textContent = job.title;
    shopName.textContent = job.shopName || "-";
    jobCategory.textContent = job.category || "-";
    jobWage.textContent = job.salary || "ไม่ระบุ";
    jobStartDate.textContent = job.startDate || "-";
    jobLocation.textContent = job.location || "-";
    jobDesc.textContent = job.description || "ไม่มีรายละเอียดเพิ่มเติม";

    const apps = loadApplications();
    const already = apps.some(a => a.user === currentEmail && a.jobId === job.id);
    applyBtn.disabled = already;
    applyBtn.textContent = already ? "✅ สมัครแล้ว" : "สมัครงานนี้";

    modal.classList.add("active");
  }

  closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));
  applyBtn.addEventListener("click", () => {
    if (selectedJobId) applyJob(selectedJobId);
  });

  // --------------------------
  // แสดงบนแผนที่
  // --------------------------
  function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 13.7563, lng: 100.5018 },
      zoom: 11,
    });
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
  }

  function renderMarkers(jobs) {
    clearMarkers();
    jobs.forEach(job => {
      if (!job.lat || !job.lng) return;
      const marker = new google.maps.Marker({
        position: { lat: job.lat, lng: job.lng },
        map,
        title: job.title,
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="font-size:14px;">
            <strong>${job.title}</strong><br>
            🏪 ${job.shopName || "-"}<br>
            💰 ${job.salary || "-"} บาท/ชม.<br>
            📅 เริ่ม: ${job.startDate || "-"}
          </div>
        `
      });

      marker.addListener("click", () => info.open(map, marker));
      markers.push(marker);
    });
  }

  // --------------------------
  // แสดงรายการงาน
  // --------------------------
  function renderJobs(keyword = "", category = "") {
    const jobs = loadJobs();
    const apps = loadApplications();

    let filtered = jobs.filter(j => {
      const text = `${j.title} ${j.shopName} ${j.description}`.toLowerCase();
      const matchesKeyword = text.includes(keyword.toLowerCase());
      const matchesCategory = category === "" || j.category === category;
      return matchesKeyword && matchesCategory;
    });

    jobList.innerHTML = "";

    if (filtered.length === 0) {
      jobList.innerHTML = `<p class="empty-text">ไม่พบนางานที่ตรงกับคำค้นหา</p>`;
      clearMarkers();
      return;
    }

    filtered.forEach(job => {
      const applied = apps.some(a => a.user === currentEmail && a.jobId === job.id);

      const card = document.createElement("div");
      card.className = "job-card";
      card.innerHTML = `
        <h4>${job.title}</h4>
        <p>🏪 ${job.shopName || "-"}</p>
        <p>💰 ${job.salary || "-"} บาท/ชม.</p>
        <p>📅 เริ่ม: ${job.startDate || "-"}</p>
        <p>📍 ${job.location || "-"}</p>
        <button class="btn-detail">${applied ? "✅ สมัครแล้ว" : "ดูรายละเอียด"}</button>
      `;

      const btn = card.querySelector(".btn-detail");
      btn.addEventListener("click", () => openJobModal(job));

      jobList.appendChild(card);
    });

    renderMarkers(filtered);
  }

  // --------------------------
  // Event
  // --------------------------
  searchInput.addEventListener("input", () => {
    renderJobs(searchInput.value, categoryFilter.value);
  });

  categoryFilter.addEventListener("change", () => {
    renderJobs(searchInput.value, categoryFilter.value);
  });

  // --------------------------
  // เริ่มต้น
  // --------------------------
  window.initMap = initMap;
  renderJobs();
});
