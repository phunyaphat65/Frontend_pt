// ----------------------------------------------------------
// seeker/js/jobs.js  (FINAL FIXED — Applications now saves correctly)
// ----------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  const JOBS_KEY = "jobs";
  const APPS_KEY = "pt_applications";
  const LIKES_KEY = "pt_likes";
  const SESSION = "pt_seeker_session";

  // DOM
  const jobList = document.getElementById("jobList");
  const searchInput = document.getElementById("searchInput");
  const applyBtn = document.getElementById("applyBtn");

  const modal = document.getElementById("jobModal");
  const closeModal = document.getElementById("closeModal");

  const jobTitle = document.getElementById("jobTitle");
  const shopName = document.getElementById("shopName");
  const shopRating = document.getElementById("shopRating");
  const jobWage = document.getElementById("jobWage");
  const jobStartDate = document.getElementById("jobStartDate");
  const jobLocation = document.getElementById("jobLocation");
  const jobDesc = document.getElementById("jobDesc");
  const jobImage = document.getElementById("jobImage");

  let selectedJobId = null;

  // ----------------------------------------------------------
  // LOGIN CHECK
  // ----------------------------------------------------------
  const seekerEmail = localStorage.getItem(SESSION);
  if (!seekerEmail) {
    Swal.fire("กรุณาเข้าสู่ระบบก่อน", "", "warning").then(() => {
      location.href = "../auth.html";
    });
    return;
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------
  const loadJobs = () => JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  const loadApps = () => JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
  const loadLikes = () => JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");

  // ----------------------------------------------------------
  // OPEN MODAL
  // ----------------------------------------------------------
  window.openJobModal = (job) => {
    selectedJobId = job.id;

    jobTitle.textContent = job.title;
    shopName.textContent = job.shop_name;
    jobWage.textContent = job.wage + " บาท/ชม.";
    jobStartDate.textContent = job.startDate || "-";
    jobLocation.textContent = "📍 " + (job.location || "-");
    jobDesc.textContent = job.description || "-";

    if (job.image) {
      jobImage.src = job.image;
      jobImage.style.display = "block";
    } else {
      jobImage.style.display = "none";
    }

    // เช็คว่าสมัครแล้วหรือยัง
    const applied = loadApps().some(
      a => a.applicant === seekerEmail && a.job_id === job.id
    );

    applyBtn.disabled = applied;
    applyBtn.textContent = applied ? "✅ สมัครแล้ว" : "สมัครงานนี้";

    modal.classList.add("active");
  };

  closeModal.addEventListener("click", () => modal.classList.remove("active"));
  window.onclick = e => {
    if (e.target === modal) modal.classList.remove("active");
  };

  // ----------------------------------------------------------
  // APPLY JOB (FIXED!!!)  — now appears in applications.html
  // ----------------------------------------------------------
  applyBtn.addEventListener("click", () => {
    if (!selectedJobId) return;

    const jobs = loadJobs();
    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) return Swal.fire("ไม่พบนงาน", "", "error");

    let apps = loadApps();

    // เช็คซ้ำ
    const exists = apps.some(
      a => a.applicant === seekerEmail && a.job_id === job.id
    );

    if (exists) {
      return Swal.fire("คุณสมัครงานนี้แล้ว", "", "info");
    }

    // โครงสร้างข้อมูลที่ applications.html ใช้
    const newApp = {
      id: Date.now(),
      job_id: job.id,
      applicant: seekerEmail,
      job_id: job.id,
      job_title: job.title,
      shop_name: job.shop_name,
      wage: job.wage,
      location: job.location || "",
      applied_at: new Date().toISOString(),
      status: "pending",
      note: ""
    };

    apps.push(newApp);
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));

    Swal.fire("สมัครงานสำเร็จ!", job.title, "success");

    modal.classList.remove("active");

    // อัปเดตการ์ดงาน
    renderJobs(searchInput.value);
  });

  // ----------------------------------------------------------
  // LIKE SYSTEM
  // ----------------------------------------------------------
  const toggleLike = (jobId) => {
    let likes = loadLikes();

    const idx = likes.findIndex(
      l => l.user === seekerEmail && l.job_id === jobId
    );

    if (idx >= 0) likes.splice(idx, 1);
    else likes.push({ id: Date.now(), user: seekerEmail, job_id: jobId });

    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));

    renderJobs(searchInput.value);
  };

  const isLiked = (jobId) =>
    loadLikes().some(l => l.user === seekerEmail && l.job_id === jobId);

  // ----------------------------------------------------------
  // RENDER JOB LIST
  // ----------------------------------------------------------
  function renderJobs(keyword = "") {
    const jobs = loadJobs();
    const apps = loadApps();

    jobList.innerHTML = "";

    const filtered = jobs.filter(j =>
      `${j.title} ${j.shop_name} ${j.location} ${j.description}`
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );

    if (filtered.length === 0) {
      jobList.innerHTML = `
        <p class="no-job" style="text-align:center;color:#777;margin-top:20px;">
          ❗ ไม่พบงานที่ค้นหา
        </p>`;
      return;
    }

    filtered.forEach(job => {
      const applied = apps.some(
        a => a.applicant === seekerEmail && a.job_id === job.id
      );
      const liked = isLiked(job.id);

      const card = document.createElement("div");
      card.className = "job-card";

      card.innerHTML = `
        <button class="like-btn ${liked ? "liked" : ""}" data-id="${job.id}">❤️</button>

        <h3>${job.title}</h3>
        <p>🏪 ${job.shop_name}</p>
        <p>💰 ${job.wage} บาท/ชม.</p>
        <p>� เริ่ม: ${job.startDate}</p>
        <p>�📍 ${job.location}</p>

        <button class="btn-primary">
          ${applied ? "✅ สมัครแล้ว" : "ดูรายละเอียด"}
        </button>
      `;

      // Like button
      card.querySelector(".like-btn").addEventListener("click", e => {
        e.stopPropagation();
        toggleLike(job.id);
      });

      // Open modal
      card.querySelector(".btn-primary")
        .addEventListener("click", () => openJobModal(job));

      jobList.appendChild(card);
    });
  }

  // ----------------------------------------------------------
  // SEARCH (REAL-TIME)
  // ----------------------------------------------------------
  searchInput.addEventListener("input", () => {
    renderJobs(searchInput.value);
  });

  // First Load
  renderJobs();

});
