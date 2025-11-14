// seeker/js/matching.js
// Fully improved matching system + ranking

(function () {
  const USERS_KEY = "pt_users";
  const JOBS_KEY  = "pt_jobs";
  const APPS_KEY  = "pt_applications";
  const LIKES_KEY = "pt_likes";
  const SESSION_SEEKER = "pt_seeker_session";

  // DOM
  const matchList = document.getElementById("matchList");
  const emptyState = document.getElementById("emptyState");
  const userEmailEl = document.getElementById("userEmail");

  // Modal
  const modal = document.getElementById("jobModal");
  const closeModalEl = document.getElementById("closeModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalShop = document.getElementById("modalShop");
  const modalRating = document.getElementById("modalRating");
  const modalWage = document.getElementById("modalWage");
  const modalLocation = document.getElementById("modalLocation");
  const modalDesc = document.getElementById("modalDesc");
  const modalThumb = document.getElementById("modalThumb");
  const modalApplyBtn = document.getElementById("modalApplyBtn");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  // ---- SESSION CHECK ----
  const seekerEmail = localStorage.getItem(SESSION_SEEKER);
  if (!seekerEmail) {
    Swal.fire({
      icon: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      text: "คุณต้องเข้าสู่ระบบบัญชีผู้สมัครเพื่อดูงานที่แมตช์"
    }).then(() => location.href = "../auth.html");
    return;
  }
  userEmailEl.textContent = seekerEmail;

  // ---- LOAD/SAVE HELPERS ----
  const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const loadJobs  = () => JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  const loadApps  = () => JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
  const saveApps  = apps => localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  const loadLikes = () => JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");

  // ---- SAFETY NORMALIZER ----
  function toArrayMaybe(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string")
      return value.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    return [];
  }

  // ---- MATCH SCORE SYSTEM ----
  function calculateMatchScore(job, user) {
    let score = 0;

    const jobSkills  = toArrayMaybe(job.skills).map(s => s.toLowerCase());
    const userSkills = toArrayMaybe(user.skills).map(s => s.toLowerCase());

    // skills match
    jobSkills.forEach(js => {
      if (userSkills.includes(js)) score += 3;
    });

    // experience match
    if (job.experience && user.experience) {
      const j = job.experience.toLowerCase();
      const u = user.experience.toLowerCase();
      if (u.includes(j)) score += 2;
    }

    // rating helps ranking
    if (job.rating) score += (job.rating * 0.3);

    return score;
  }

  // ---- RENDER FUNCTION ----
  function renderMatches() {
    const users = loadUsers();
    const jobs = loadJobs();
    const apps = loadApps();
    const likes = loadLikes();

    const user = users.find(u => u.email === seekerEmail);
    if (!user) {
      Swal.fire("ไม่พบข้อมูลผู้ใช้", "", "error").then(() => {
        localStorage.removeItem(SESSION_SEEKER);
        location.href = "../auth.html";
      });
      return;
    }

    // สร้างคะแนนแมตช์ให้ทุกงาน
    const rankedJobs = jobs
      .map(job => ({
        ...job,
        matchScore: calculateMatchScore(job, user)
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    matchList.innerHTML = "";
    emptyState.style.display = rankedJobs.length === 0 ? "block" : "none";

    rankedJobs.forEach(job => {
      const alreadyApplied = apps.some(a => a.applicant === seekerEmail && a.job_id === job.id);
      const liked = likes.some(l => l.user === seekerEmail && l.job_id === job.id);

      const card = document.createElement("div");
      card.className = "match-card";

      // --- Thumbnail ---
      const thumb = document.createElement("div");
      thumb.className = "thumb";
      if (job.image) {
        const img = document.createElement("img");
        img.src = job.image;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        thumb.appendChild(img);
      } else {
        thumb.textContent = "🏪";
      }

      // --- Meta ---
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `
        <div class="title">${escapeHtml(job.title)}</div>
        <div class="shop">${escapeHtml(job.shop_name)}</div>
        <div class="desc">${escapeHtml(job.description || "-")}</div>

        <div class="info-row">
          <div>⭐ ${job.rating || 0}/5</div>
          <div>💰 ${job.wage || "-"} บาท/ชม.</div>
          <div>📍 ${escapeHtml(job.location || "-")}</div>
        </div>

        <div class="match-score">คะแนนแมตช์: ${job.matchScore.toFixed(1)}</div>
      `;

      // --- Actions ---
      const actions = document.createElement("div");
      actions.className = "actions";
      actions.innerHTML = `
        <button class="btn secondary view-btn">${alreadyApplied ? "ดูรายละเอียด" : "รายละเอียด"}</button>
        <button class="btn primary apply-btn" ${alreadyApplied ? "disabled" : ""}>${alreadyApplied ? "สมัครแล้ว" : "สมัคร"}</button>
      `;

      // Like button
      const likeBtn = document.createElement("div");
      likeBtn.className = "like-btn";
      likeBtn.textContent = liked ? "❤️" : "🤍";
      likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLike(job.id);
      });

      // Events
      actions.querySelector(".view-btn").addEventListener("click", () => openModal(job));
      actions.querySelector(".apply-btn").addEventListener("click", () => applyToJob(job));
      card.addEventListener("click", e => {
        if (!e.target.closest(".btn")) openModal(job);
      });

      // Assemble
      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.flexDirection = "column";
      wrap.style.alignItems = "flex-end";
      wrap.appendChild(likeBtn);
      wrap.appendChild(actions);

      card.appendChild(thumb);
      card.appendChild(meta);
      card.appendChild(wrap);
      matchList.appendChild(card);
    });
  }

  // ---- MODAL ----
  function openModal(job) {
    modal.classList.add("active");

    modalTitle.textContent = job.title;
    modalShop.textContent = job.shop_name;
    modalRating.textContent = `⭐ ${job.rating || 0}/5`;
    modalWage.textContent = job.wage;
    modalLocation.textContent = job.location;
    modalDesc.textContent = job.description;

    if (job.image) {
      modalThumb.src = job.image;
      modalThumb.style.display = "block";
    } else {
      modalThumb.style.display = "none";
    }

    const apps = loadApps();
    const already = apps.some(a => a.applicant === seekerEmail && a.job_id === job.id);

    modalApplyBtn.textContent = already ? "สมัครแล้ว" : "สมัครงานนี้";
    modalApplyBtn.disabled = already;

    modalApplyBtn.onclick = () => applyToJob(job);
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  // ---- APPLY JOB ----
  function applyToJob(job) {
    const apps = loadApps();
    if (apps.some(a => a.applicant === seekerEmail && a.job_id === job.id)) {
      Swal.fire("คุณสมัครงานนี้แล้ว", "", "info");
      renderMatches();
      return;
    }

    Swal.fire({
      title: "ยืนยันการสมัคร?",
      text: job.title,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "สมัคร",
      cancelButtonText: "ยกเลิก"
    }).then(res => {
      if (!res.isConfirmed) return;

      apps.push({
        id: Date.now(),
        applicant: seekerEmail,
        job_id: job.id,
        job_title: job.title,
        shop_name: job.shop_name,
        date: new Date().toISOString(),
        status: "pending"
      });

      saveApps(apps);
      Swal.fire("สมัครเรียบร้อย", "", "success");
      closeModal();
      renderMatches();
    });
  }

  // ---- LIKE ----
  function toggleLike(jobId) {
    const likes = loadLikes();
    const idx = likes.findIndex(l => l.user === seekerEmail && l.job_id === jobId);

    if (idx >= 0) likes.splice(idx, 1);
    else likes.push({ id: Date.now(), user: seekerEmail, job_id: jobId });

    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    renderMatches();
  }

  // ---- ESCAPE ----
  function escapeHtml(v) {
    if (!v) return "";
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---- LOGOUT ----
  document.getElementById("logoutBtn").addEventListener("click", () => {
    Swal.fire({
      title: "ออกจากระบบ?",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ"
    }).then(r => {
      if (r.isConfirmed) {
        localStorage.removeItem(SESSION_SEEKER);
        location.href = "../auth.html";
      }
    });
  });

  // ---- MODAL EVENTS ----
  closeModalEl.addEventListener("click", closeModal);
  modalCloseBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  // INIT
  renderMatches();

  // expose render for debugging if needed
  window.__renderMatches = renderMatches;

})();
