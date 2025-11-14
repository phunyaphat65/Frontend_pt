// seeker/js/matching.js
// Matching page for seeker/matching.html
// Works with data model:
// USERS: { email, name, role, skills (string or array), experience (string) }
// JOBS: { id, shop_email, shop_name, title, description, wage, startDate, location, lat, lng, image, rating, skills (array), experience (string) }
// APPS: applications saved under key "pt_applications"
// Session: pt_seeker_session

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

  // Modal DOM
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

  // session check
  const seekerEmail = localStorage.getItem(SESSION_SEEKER);
  if (!seekerEmail) {
    Swal.fire({
      icon: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      text: "คุณต้องเข้าสู่ระบบบัญชีผู้สมัครเพื่อดูการจับคู่งาน"
    }).then(() => location.href = "../auth.html");
    return;
  }

  userEmailEl.textContent = seekerEmail;

  // load helpers
  const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const loadJobs  = () => JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  const loadApps  = () => JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
  const saveApps  = apps => localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  const loadLikes = () => JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");

  // normalize helpers
  function toArrayMaybe(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      // split by comma or semicolon
      return value.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  // matching algorithm:
  // - if job.skills intersects with user.skills -> match
  // - or if job.experience is substring of user.experience -> match
  // - small boost for location proximity (if lat/lng present, but we don't compute distance here)
  function getMatchedJobsForUser(user) {
    const jobs = loadJobs();
    const userSkills = toArrayMaybe(user.skills).map(s => s.toLowerCase());
    const userExp = (user.experience || "").toLowerCase();

    return jobs.filter(job => {
      const jobSkills = toArrayMaybe(job.skills).map(s => s.toLowerCase());
      const skillMatch = jobSkills.some(js => userSkills.includes(js));
      const expMatch = job.experience && userExp ? userExp.includes((job.experience || "").toLowerCase()) : false;
      // If neither skills nor experience available, fallback: show popular jobs (rating >=4) or same city substring
      const fallback = (!jobSkills.length && !job.experience) ? (job.rating && job.rating >= 4) : false;
      return skillMatch || expMatch || fallback;
    });
  }

  // render list
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

    const matched = getMatchedJobsForUser(user);

    matchList.innerHTML = "";
    emptyState.style.display = matched.length === 0 ? "block" : "none";

    matched.forEach(job => {
      const alreadyApplied = apps.some(a => a.applicant === seekerEmail && a.job_id === job.id);
      const liked = likes.some(l => l.user === seekerEmail && l.job_id === job.id);

      const card = document.createElement("div");
      card.className = "match-card";

      // thumbnail (use job.image if present)
      const thumb = document.createElement("div");
      thumb.className = "thumb";
      if (job.image) {
        const img = document.createElement("img");
        img.src = job.image;
        img.alt = job.title || "thumb";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        thumb.appendChild(img);
      } else {
        thumb.textContent = "🏪";
      }

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `
        <div class="title">${escapeHtml(job.title || "-")}</div>
        <div class="shop">${escapeHtml(job.shop_name || "-")}</div>
        <div class="desc">${escapeHtml(job.description || "-")}</div>
        <div class="info-row">
          <div>⭐ ${job.rating || 0}/5</div>
          <div>💰 ${job.wage || "-"} บาท/ชม.</div>
          <div>📍 ${escapeHtml(job.location || "-")}</div>
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.innerHTML = `
        <button class="btn secondary view-btn">${alreadyApplied ? "✅ สมัครแล้ว" : "รายละเอียด"}</button>
        <button class="btn primary apply-btn" ${alreadyApplied ? "disabled" : ""}>${alreadyApplied ? "สมัครแล้ว" : "สมัคร"}</button>
      `;

      // Like heart
      const likeBtn = document.createElement("div");
      likeBtn.className = "like-btn";
      likeBtn.style.marginLeft = "8px";
      likeBtn.style.cursor = "pointer";
      likeBtn.textContent = liked ? "❤️" : "🤍";
      likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLike(job.id);
      });

      // attach events
      actions.querySelector(".view-btn").addEventListener("click", () => openModal(job));
      actions.querySelector(".apply-btn").addEventListener("click", () => applyToJob(job));

      // clicking the card also opens details
      card.addEventListener("click", (e) => {
        // avoid opening when clicking the apply/view buttons or like
        if (e.target.closest('.btn')) return;
        openModal(job);
      });

      // assemble
      card.appendChild(thumb);
      card.appendChild(meta);
      const actionWrap = document.createElement("div");
      actionWrap.style.display = "flex"; actionWrap.style.flexDirection = "column"; actionWrap.style.alignItems = "flex-end";
      actionWrap.appendChild(likeBtn);
      actionWrap.appendChild(actions);
      card.appendChild(actionWrap);

      matchList.appendChild(card);
    });
  }

  // open modal with job details
  function openModal(job) {
    modal.classList.add("active");
    modalTitle.textContent = job.title || "-";
    modalShop.textContent = job.shop_name || "-";
    modalRating.textContent = (job.rating ? `⭐ ${job.rating}/5` : "");
    modalWage.textContent = job.wage || "-";
    modalLocation.textContent = job.location || "-";
    modalDesc.textContent = job.description || "-";
    if (job.image) {
      modalThumb.src = job.image;
      modalThumb.style.display = "block";
    } else {
      modalThumb.style.display = "none";
    }

    // set apply button state
    const apps = loadApps();
    const already = apps.some(a => a.applicant === seekerEmail && a.job_id === job.id);
    modalApplyBtn.textContent = already ? "✅ สมัครแล้ว" : "สมัครงานนี้";
    modalApplyBtn.disabled = !!already;

    // attach apply handler (fresh closure)
    modalApplyBtn.onclick = () => applyToJob(job);
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  // apply flow
  function applyToJob(job) {
    const apps = loadApps();
    if (apps.some(a => a.applicant === seekerEmail && a.job_id === job.id)) {
      Swal.fire("คุณสมัครงานนี้แล้ว", "", "info");
      renderMatches();
      return;
    }

    Swal.fire({
      title: "ยืนยันการสมัคร?",
      text: `คุณต้องการสมัครงาน "${job.title}" หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "สมัคร",
      cancelButtonText: "ยกเลิก"
    }).then(res => {
      if (!res.isConfirmed) return;

      const newApp = {
        id: Date.now(),
        applicant: seekerEmail,
        job_id: job.id,
        job_title: job.title,
        shop_name: job.shop_name,
        date: new Date().toISOString(),
        status: "pending",
        note: ""
      };

      apps.push(newApp);
      saveApps(apps);
      Swal.fire("สมัครเรียบร้อย", "ระบบได้บันทึกใบสมัครของคุณแล้ว", "success");
      closeModal();
      renderMatches();
    });
  }

  // like toggler
  function toggleLike(jobId) {
    const likes = loadLikes();
    const idx = likes.findIndex(l => l.user === seekerEmail && l.job_id === jobId);
    if (idx >= 0) {
      likes.splice(idx, 1);
    } else {
      likes.push({ id: Date.now(), user: seekerEmail, job_id: jobId });
    }
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    renderMatches();
  }

  // escape helper (simple)
  function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    Swal.fire({
      title: "ออกจากระบบ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก"
    }).then(r => {
      if (r.isConfirmed) {
        localStorage.removeItem(SESSION_SEEKER);
        location.href = "../auth.html";
      }
    });
  });

  // modal close handlers
  closeModalEl.addEventListener("click", closeModal);
  modalCloseBtn.addEventListener("click", closeModal);
  // close if click outside modal-box
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // init
  renderMatches();

  // expose render for debugging if needed
  window.__renderMatches = renderMatches;

})();
