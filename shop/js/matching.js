// -------------------------------------------------------
// shop/js/matching.js (PRO VERSION)
// ระบบจับคู่แรงงานแบบสมบูรณ์สำหรับร้านค้า
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------
  // CONSTANTS & STORAGE KEYS
  // ---------------------------------------------------
  const SESSION_KEY = "pt_shop_session";
  const USERS_KEY = "pt_users";
  const JOBS_KEY = "pt_jobs";
  const APPS_KEY = "pt_applications";

  const matchContainer = document.getElementById("matchContainer");
  const emptyMatch = document.getElementById("emptyMatch");
  const logoutBtn = document.getElementById("logoutBtn");

  // ---------------------------------------------------
  // 1) ตรวจสอบ Session ร้านค้า
  // ---------------------------------------------------
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return redirectLogin("กรุณาเข้าสู่ระบบก่อนเข้าหน้านี้");

  const users = load(USERS_KEY);
  const shop = users.find(u => u.email === email && u.role === "shop");
  if (!shop) {
    localStorage.removeItem(SESSION_KEY);
    return redirectLogin("บัญชีนี้ไม่ใช่ร้านค้า");
  }

  // ---------------------------------------------------
  // 2) โหลดข้อมูลจำเป็น
  // ---------------------------------------------------
  const jobs = load(JOBS_KEY).filter(j => j.shop_email === email);
  const seekers = users.filter(u => u.role === "seeker");
  const applications = load(APPS_KEY);

  if (jobs.length === 0) {
    emptyMatch.style.display = "block";
    emptyMatch.textContent = "คุณยังไม่มีงานในระบบ";
    return;
  }

  // ---------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------
  function load(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }

  function redirectLogin(msg) {
    Swal.fire({ icon: "warning", title: msg }).then(() => {
      window.location.href = "../auth.html";
    });
  }

  function distanceKm(a, b) {
    if (!a || !b || !a.lat || !a.lng || !b.lat || !b.lng) return null;

    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;

    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;

    const h = Math.sin(dLat/2)**2 +
              Math.sin(dLng/2)**2 * Math.cos(lat1) * Math.cos(lat2);

    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // ---------------------------------------------------
  // 3) ระบบคำนวณความเหมาะสมแบบมืออาชีพ (0–100)
  // ---------------------------------------------------
  function calcMatchScore(job, seeker) {
    let score = 0;

    // ① ค่าแรง (30 คะแนน)
    if (seeker.expected_wage) {
      if (job.wage >= seeker.expected_wage) score += 30;
      else score += Math.max(0, 15 - (seeker.expected_wage - job.wage) * 0.5);
    }

    // ② ระยะทาง (20 คะแนน)
    if (job.location_pin && seeker.pin) {
      const dist = distanceKm(job.location_pin, seeker.pin);
      if (dist != null) {
        if (dist <= 2) score += 20;
        else if (dist <= 5) score += 15;
        else if (dist <= 10) score += 5;
      }
    }

    // ③ ทักษะ (30 คะแนน)
    if (Array.isArray(seeker.skills)) {
      const matched = seeker.skills.filter(s =>
        (job.description || "").toLowerCase().includes(s.toLowerCase())
      );
      score += Math.min(30, matched.length * 10);
    }

    // ④ วันเริ่มงาน (20 คะแนน)
    if (job.start_date && seeker.available_date) {
      const js = new Date(job.start_date);
      const ss = new Date(seeker.available_date);

      if (ss <= js) score += 20;
      else score += Math.max(0, 20 - (ss - js) / (1000 * 3600 * 24));
    }

    return Math.min(100, Math.round(score));
  }

  // ---------------------------------------------------
  // 4) แสดงผลรายการจับคู่
  // ---------------------------------------------------
  function renderMatching() {
    matchContainer.innerHTML = "";
    let found = 0;

    jobs.forEach(job => {
      const matched = seekers
        .map(s => ({ ...s, score: calcMatchScore(job, s) }))
        .filter(s => s.score >= 50)
        .sort((a, b) => b.score - a.score);

      if (matched.length === 0) return;

      found++;

      const section = document.createElement("div");
      section.className = "job-section";

      section.innerHTML = `
        <div class="job-header">
          <h3>${job.title}</h3>
          <span>
            📍 ${job.location} | 💰 ${job.wage} บาท/ชม.
            <br>📅 เริ่มงาน: ${job.start_date || "ไม่ระบุ"}
          </span>
        </div>
        <div class="candidate-list"></div>
      `;

      const list = section.querySelector(".candidate-list");

      matched.forEach(seeker => {
        const alreadyInvited = applications.some(
          a => a.job_id === job.job_id
            && a.seeker_email === seeker.email
            && a.type === "invite"
        );

        const card = document.createElement("div");
        card.className = "candidate-card";

        card.innerHTML = `
          <h4>${seeker.name}</h4>
          <p>📍 ${seeker.location || "-"}</p>
          <p>💰 ต้องการ: ${seeker.expected_wage || "-"} บาท/ชม.</p>
          <p>🎯 ความเหมาะสม: <b>${seeker.score}%</b></p>
          <p>📅 ว่างเริ่มงาน: ${seeker.available_date || "-"}</p>
          <button class="btn-invite" ${alreadyInvited ? "disabled" : ""}>
            ${alreadyInvited ? "✔ เชิญแล้ว" : "📩 เชิญสมัคร"}
          </button>
        `;

        card.querySelector(".btn-invite").addEventListener("click", () => {
          if (!alreadyInvited) invite(job, seeker);
        });

        list.appendChild(card);
      });

      matchContainer.appendChild(section);
    });

    emptyMatch.style.display = found === 0 ? "block" : "none";
  }

  // ---------------------------------------------------
  // 5) เชิญสมัครงาน
  // ---------------------------------------------------
  function invite(job, seeker) {
    Swal.fire({
      title: `เชิญ ${seeker.name}?`,
      text: `ให้สมัครงาน "${job.title}"`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "เชิญเลย",
      cancelButtonText: "ยกเลิก"
    }).then(res => {
      if (!res.isConfirmed) return;

      const apps = load(APPS_KEY);

      apps.push({
        app_id: Date.now().toString(),
        job_id: job.job_id,
        seeker_email: seeker.email,
        shop_email: job.shop_email,
        type: "invite",
        status: "invited",
        created_at: new Date().toISOString()
      });

      localStorage.setItem(APPS_KEY, JSON.stringify(apps));

      Swal.fire({
        icon: "success",
        title: "เชิญผู้สมัครแล้ว",
        timer: 1200,
        showConfirmButton: false
      });

      renderMatching();
    });
  }

  // ---------------------------------------------------
  // 6) ออกจากระบบ
  // ---------------------------------------------------
  logoutBtn.addEventListener("click", () => {
    Swal.fire({
      title: "ออกจากระบบ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก"
    }).then(r => {
      if (r.isConfirmed) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "../auth.html";
      }
    });
  });

  // ---------------------------------------------------
  // เริ่มทำงาน
  // ---------------------------------------------------
  renderMatching();
});
