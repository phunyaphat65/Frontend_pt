// ----------------------------------------------------------   
// seeker/js/jobs.js (FINAL VERSION — MATCHED WITH applications.js)
// KEY ทุกตัวถูกปรับให้ตรงกัน
// ระบบสมัครงานทำงานแน่นอน → applications.html แสดงผลทันที
// ----------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  const JOBS_KEY = "jobs";                    // <--- ต้องตรงกับ shop และ applications.js
  const APPS_KEY = "pt_applications";
  const LIKES_KEY = "pt_likes";
  const SESSION_SEEKER = "pt_seeker_session";

  const jobList = document.getElementById("jobList");
  const searchInput = document.getElementById("searchInput");
  const applyBtn = document.getElementById("applyBtn");

  const modal = document.getElementById("jobModal");
  const closeBtn = document.getElementById("closeJobModal");

  const jobTitle = document.getElementById("jobTitle");
  const shopName = document.getElementById("shopName");
  const shopRating = document.getElementById("shopRating");
  const jobWage = document.getElementById("jobWage");
  const jobStartDate = document.getElementById("jobStartDate");
  const jobLocation = document.getElementById("jobLocation");
  const jobDesc = document.getElementById("jobDesc");

  let selectedJobId = null;

  // -----------------------------
  // Login Check
  // -----------------------------
  const seekerEmail = localStorage.getItem(SESSION_SEEKER);
  if (!seekerEmail) {
    Swal.fire("ต้องเข้าสู่ระบบก่อน", "", "warning").then(() => {
      location.href = "../auth.html";
    });
    return;
  }

  // -----------------------------
  // Loaders
  // -----------------------------
  const loadJobs = () => JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  const loadApps = () => JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
  const loadLikes = () => JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");

  // -----------------------------
  // Modal
  // -----------------------------
  window.openJobModal = (job) => {
    selectedJobId = job.id;

    jobTitle.textContent = job.title;
    shopName.textContent = job.shop_name;

    // ไม่มี Rating ใช้ 0
    const rate = 0;
    shopRating.innerHTML = "⭐".repeat(rate) + "☆".repeat(5 - rate);

    jobWage.textContent = job.wage;
    jobStartDate.textContent = job.startDate;
    jobLocation.textContent = job.location;
    jobDesc.textContent = job.description;

    const apps = loadApps();
    const applied = apps.some(a => a.applicant === seekerEmail && a.job_id === job.id);

    applyBtn.disabled = applied;
    applyBtn.textContent = applied ? "✅ สมัครแล้ว" : "สมัครงานนี้";

    modal.classList.add("active");
  };

  closeBtn.addEventListener("click", () => modal.classList.remove("active"));
  window.onclick = e => { if (e.target === modal) modal.classList.remove("active"); };

  // -----------------------------
  // Apply Job
  // -----------------------------
  applyBtn.addEventListener("click", () => {
    if (!selectedJobId) return;

    const jobs = loadJobs();
    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) return Swal.fire("ไม่พบนาน", "", "error");

    let apps = loadApps();
    const duplicated = apps.some(a => a.applicant === seekerEmail && a.job_id === job.id);

    if (duplicated)
      return Swal.fire("คุณสมัครงานนี้แล้ว", "", "info");

    // บันทึกใบสมัคร
    apps.push({
      id: Date.now(),             // ใช้ ID มาตรฐานเดียวกับ applications.js
      applicant: seekerEmail,
      job_id: job.id,
      job_title: job.title,
      shop_name: job.shop_name,
      date: new Date().toISOString(),
      status: "pending",
      note: ""
    });

    localStorage.setItem(APPS_KEY, JSON.stringify(apps));

    Swal.fire("สมัครงานสำเร็จ", job.title, "success");

    modal.classList.remove("active");

    // อัปเดตการ์ดงาน
    renderJobs(searchInput.value);
  });

  // -----------------------------
  // Like System
  // -----------------------------
  const toggleLike = (jobId) => {
    let likes = loadLikes();
    const index = likes.findIndex(l => l.user === seekerEmail && l.job_id === jobId);

    if (index >= 0) likes.splice(index, 1);
    else likes.push({ id: Date.now(), user: seekerEmail, job_id: jobId });

    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    renderJobs(searchInput.value);
  };

  const isLiked = (jobId) => {
    return loadLikes().some(l => l.user === seekerEmail && l.job_id === jobId);
  };

  // -----------------------------
  // Google Map
  // -----------------------------
  let map;
  let markers = [];

  window.initMap = () => {
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: { lat: 13.7563, lng: 100.5018 }
    });
  };

  const clearMarkers = () => markers.forEach(m => m.setMap(null));

  const renderMarkers = (jobs) => {
    if (!map) return;
    clearMarkers();
    markers = [];

    jobs.forEach(job => {
      if (!job.lat || !job.lng) return;

      const marker = new google.maps.Marker({
        position: { lat: job.lat, lng: job.lng },
        map,
        title: job.title
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div>
            <b>${job.title}</b><br>
            🏪 ${job.shop_name}<br>
            ⭐ 0/5<br>
            💰 ${job.wage} บาท/ชม.<br>
          </div>
        `
      });

      marker.addListener("click", () => info.open(map, marker));
      markers.push(marker);
    });
  };

  // -----------------------------
  // Render job list
  // -----------------------------
  function renderJobs(keyword = "") {
    const jobs = loadJobs();
    const apps = loadApps();

    jobList.innerHTML = "";

    const filtered = jobs.filter(j =>
      `${j.title} ${j.shop_name} ${j.description} ${j.location}`
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );

    if (filtered.length === 0) {
      jobList.innerHTML = `<p class="no-data">ไม่พบงานที่ตรงกับคำค้นหา</p>`;
      clearMarkers();
      return;
    }

    filtered.forEach(job => {
      const applied = apps.some(a => a.applicant === seekerEmail && a.job_id === job.id);
      const liked = isLiked(job.id);

      const card = document.createElement("div");
      card.className = "job-card";

      card.innerHTML = `
        <span class="like-btn ${liked ? "liked" : ""}" data-id="${job.id}">❤️</span>

        <h4>${job.title}</h4>
        <p class="rating">⭐ 0/5</p>

        <p>🏪 ${job.shop_name}</p>
        <p>💰 ${job.wage} บาท/ชม.</p>
        <p>📅 เริ่ม: ${job.startDate}</p>
        <p>📍 ${job.location}</p>

        <button class="btn-primary">
          ${applied ? "✅ สมัครแล้ว" : "ดูรายละเอียด"}
        </button>
      `;

      // like button
      card.querySelector(".like-btn").addEventListener("click", e => {
        e.stopPropagation();
        toggleLike(job.id);
      });

      // modal button
      card.querySelector("button").addEventListener("click", () => openJobModal(job));

      jobList.appendChild(card);
    });

    renderMarkers(filtered);
  }

  searchInput.addEventListener("input", () => renderJobs(searchInput.value));

  // start
  renderJobs();

});
