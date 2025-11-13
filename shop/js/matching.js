// -------------------------------------------------------
// shop/js/matching.js (เวอร์ชันปรับปรุงล่าสุด)
// ระบบจับคู่แรงงานที่เหมาะสมกับงานของร้านค้า
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const SESSION_KEY = "pt_shop_session";
  const USERS_KEY = "pt_users";
  const JOBS_KEY = "pt_jobs";
  const APPS_KEY = "pt_applications";

  const matchContainer = document.getElementById("matchContainer");
  const emptyMatch = document.getElementById("emptyMatch");
  const logoutBtn = document.getElementById("logoutBtn");

  // ---------------------------------------------------
  // 🧭 ตรวจสอบการเข้าสู่ระบบ
  // ---------------------------------------------------
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) {
    Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้เข้าสู่ระบบ",
      text: "กรุณาเข้าสู่ระบบก่อนเข้าหน้านี้",
      confirmButtonText: "ตกลง"
    }).then(() => (window.location.href = "../auth.html"));
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const shop = users.find(u => u.email === email && u.role === "shop");
  if (!shop) {
    Swal.fire({
      icon: "error",
      title: "บัญชีนี้ไม่ใช่ร้านค้า",
      confirmButtonText: "กลับสู่หน้าเข้าสู่ระบบ"
    }).then(() => {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "../auth.html";
    });
    return;
  }

  // ---------------------------------------------------
  // 📋 โหลดงานของร้าน
  // ---------------------------------------------------
  const jobs = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]").filter(
    j => j.shop_email === email
  );
  const seekers = users.filter(u => u.role === "seeker");

  if (jobs.length === 0) {
    emptyMatch.style.display = "block";
    emptyMatch.textContent = "คุณยังไม่มีงานในระบบ";
    return;
  }

  // ---------------------------------------------------
  // 🧮 ฟังก์ชันคำนวณคะแนนการจับคู่ (0–100)
  // ---------------------------------------------------
  function calcMatchScore(job, seeker) {
    let score = 0;

    // ✅ ค่าจ้าง
    if (seeker.expected_wage && job.wage >= seeker.expected_wage) score += 30;
    else if (!seeker.expected_wage) score += 15;

    // ✅ สถานที่ (ตรวจคำเหมือน)
    if (seeker.location && job.location.includes(seeker.location)) score += 30;

    // ✅ ทักษะ (keyword match)
    if (Array.isArray(seeker.skills) && job.description) {
      const matched = seeker.skills.filter(s =>
        job.description.toLowerCase().includes(s.toLowerCase())
      );
      score += matched.length * 10;
    }

    return Math.min(score, 100);
  }

  // ---------------------------------------------------
  // 🧾 แสดงรายการจับคู่
  // ---------------------------------------------------
  function renderMatching() {
    matchContainer.innerHTML = "";
    let totalMatches = 0;

    jobs.forEach(job => {
      // จัดลำดับผู้สมัครที่ตรง
      const matchedSeekers = seekers
        .map(seeker => ({
          ...seeker,
          score: calcMatchScore(job, seeker)
        }))
        .filter(s => s.score >= 50) // กำหนดเกณฑ์ขั้นต่ำ
        .sort((a, b) => b.score - a.score);

      if (matchedSeekers.length === 0) return;

      totalMatches++;

      const section = document.createElement("div");
      section.className = "job-section";
      section.innerHTML = `
        <div class="job-header">
          <h3>${job.title}</h3>
          <span>📍 ${job.location} | 💰 ${job.wage} บาท/ชม.</span>
        </div>
        <div class="candidate-list" id="job-${job.job_id}"></div>
      `;

      const candidateList = section.querySelector(".candidate-list");

      matchedSeekers.forEach(seeker => {
        const card = document.createElement("div");
        card.className = "candidate-card";
        card.innerHTML = `
          <h4>${seeker.name}</h4>
          <p>📍 ${seeker.location || "ไม่ระบุ"}</p>
          <p>💰 ต้องการ ${seeker.expected_wage || "-"} บาท/ชม.</p>
          <p>🎯 คะแนนความเหมาะสม: <b>${seeker.score}%</b></p>
          <button class="btn-invite">📩 เชิญสมัคร</button>
        `;

        card.querySelector(".btn-invite").addEventListener("click", () => {
          inviteSeeker(job, seeker);
        });

        candidateList.appendChild(card);
      });

      matchContainer.appendChild(section);
    });

    if (totalMatches === 0) {
      emptyMatch.style.display = "block";
    } else {
      emptyMatch.style.display = "none";
    }
  }

  // ---------------------------------------------------
  // 💌 ฟังก์ชันเชิญสมัครงาน
  // ---------------------------------------------------
  function inviteSeeker(job, seeker) {
    Swal.fire({
      title: `ต้องการเชิญ ${seeker.name}?`,
      text: `ให้มาสมัครงาน "${job.title}" หรือไม่`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "เชิญเลย",
      cancelButtonText: "ยกเลิก"
    }).then(result => {
      if (!result.isConfirmed) return;

      const apps = JSON.parse(localStorage.getItem(APPS_KEY) || "[]");

      // ตรวจสอบว่ามีการเชิญแล้วหรือยัง
      const exist = apps.find(
        a =>
          a.job_id === job.job_id &&
          a.seeker_email === seeker.email &&
          a.type === "invite"
      );
      if (exist) {
        Swal.fire({
          icon: "info",
          title: "เชิญผู้สมัครคนนี้ไปแล้ว",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      const invite = {
        app_id: Date.now().toString(),
        job_id: job.job_id,
        seeker_email: seeker.email,
        shop_email: job.shop_email,
        status: "invited",
        type: "invite",
        created_at: new Date().toISOString()
      };
      apps.push(invite);
      localStorage.setItem(APPS_KEY, JSON.stringify(apps));

      Swal.fire({
        icon: "success",
        title: "✅ เชิญผู้สมัครเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false
      });
    });
  }

  // ---------------------------------------------------
  // 🚪 ออกจากระบบ
  // ---------------------------------------------------
  logoutBtn.addEventListener("click", () => {
    Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก"
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem(SESSION_KEY);
        Swal.fire({
          icon: "success",
          title: "ออกจากระบบสำเร็จ 👋",
          timer: 1000,
          showConfirmButton: false
        }).then(() => (window.location.href = "../auth.html"));
      }
    });
  });

  // ---------------------------------------------------
  // เริ่มการแสดงผล
  // ---------------------------------------------------
  renderMatching();
});
