//-------------------------------------------------------
// shop/js/matching.js — FIXED TO WORK WITH CURRENT DATA
//-------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  const SESSION_KEY = "pt_shop_session";
  const USERS_KEY   = "pt_users";
  const JOBS_KEY    = "pt_jobs";
  const APPS_KEY    = "pt_applications";

  const matchContainer = document.getElementById("matchContainer");
  const emptyMatch = document.getElementById("emptyMatch");
  const logoutBtn = document.getElementById("logoutBtn");

  const load = key => JSON.parse(localStorage.getItem(key) || "[]");

  // Distance calculator
  function distanceKm(a, b) {
    if (!a || !b || !a.lat || !a.lng || !b.lat || !b.lng) return 9999;
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI/180;
    const dLng = (b.lng - a.lng) * Math.PI/180;
    const lat1 = a.lat * Math.PI/180;
    const lat2 = b.lat * Math.PI/180;

    const h = Math.sin(dLat/2)**2 +
              Math.sin(dLng/2)**2 * Math.cos(lat1) * Math.cos(lat2);

    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // LOGIN CHECK
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) {
    Swal.fire("กรุณาเข้าสู่ระบบ").then(()=> location.href="../auth.html");
    return;
  }

  const users = load(USERS_KEY);
  const shop = users.find(u => u.email === email && u.role === "shop");

  if (!shop) {
    Swal.fire("บัญชีไม่ใช่ร้านค้า").then(()=>{
      localStorage.setItem(SESSION_KEY,"");
      location.href="../auth.html";
    });
    return;
  }

  // LOAD JOBS + SEEKERS
  const jobs = load(JOBS_KEY).filter(j => j.shop_email === email);
  const seekers = users.filter(u => u.role === "seeker");

  if (jobs.length === 0) {
    emptyMatch.textContent = "คุณยังไม่มีงานในระบบ";
    emptyMatch.style.display = "block";
    return;
  }

  // SIMPLE SCORE
  function calcMatchScore(job, seeker) {
    let score = 0;

    // If seeker has skills (string)
    if (seeker.skills) {
      const skillList = seeker.skills.split(/,|\s+/).filter(s=>s);
      const matched = skillList.filter(s =>
        (job.description||"").toLowerCase().includes(s.toLowerCase())
      );
      score += Math.min(50, matched.length * 10);
    }

    // Distance
    const dist = distanceKm(
      job.location_pin || job.locationPin,
      { lat: seeker.lat, lng: seeker.lng }
    );
    if (dist <= 2) score += 30;
    else if (dist <= 5) score += 20;
    else if (dist <= 10) score += 10;

    return Math.min(100, score);
  }

  // RENDER MATCHING
  function renderMatching() {
    matchContainer.innerHTML = "";
    let found = 0;

    jobs.forEach(job => {

      // job.location_pin รองรับ 2 แบบ
      const jobPin = job.location_pin || job.locationPin || null;

      const list = seekers
        .map(s => {
          const distance = distanceKm(jobPin, { lat:s.lat, lng:s.lng });
          const score = calcMatchScore(job, s);
          return { ...s, distance, score };
        })
        .sort((a,b)=>a.distance - b.distance);

      if (list.length === 0) return;

      found++;

      const block = document.createElement("div");
      block.className="job-section";

      block.innerHTML = `
        <div class="job-header">
          <h3>${job.title}</h3>
          <p>📍 ${job.location} | 💰 ${job.wage} บาท/ชม</p>
        </div>
        <div class="candidate-list"></div>
      `;

      const cList = block.querySelector(".candidate-list");

      list.forEach(sk => {
        const invited = load(APPS_KEY).some(a =>
          a.job_id === job.job_id &&
          a.seeker_email === sk.email &&
          a.type === "invite"
        );

        const card = document.createElement("div");
        card.className = "candidate-card";

        card.innerHTML = `
          <h4>${sk.name || sk.fullname || "ไม่ระบุชื่อ"}</h4>
          <p>ทักษะ: ${sk.skills || "-"}</p>
          <p>ระยะทาง: ${sk.distance === 9999 ? "ไม่พบ" : sk.distance.toFixed(2) + " กม."}</p>
          <p>คะแนนความเหมาะสม: <b>${sk.score}%</b></p>
          <button ${invited?"disabled":""} class="btn-invite">
            ${invited ? "✔ เชิญแล้ว" : "📩 เชิญสมัคร"}
          </button>
        `;

        card.querySelector(".btn-invite").addEventListener("click", () => {
          if (!invited) invite(job, sk);
        });

        cList.appendChild(card);
      });

      matchContainer.appendChild(block);
    });

    emptyMatch.style.display = found === 0 ? "block" : "none";
  }

  // INVITE
  function invite(job, seeker) {
    Swal.fire({
      title:`เชิญ ${seeker.name}?`,
      icon:"question",
      showCancelButton:true
    }).then(r=>{
      if(!r.isConfirmed) return;

      const apps = load(APPS_KEY);
      apps.push({
        app_id: Date.now()+"",
        seeker_email: seeker.email,
        shop_email: job.shop_email,
        job_id: job.job_id,
        type:"invite",
        status:"invited",
        created_at:new Date().toISOString()
      });
      localStorage.setItem(APPS_KEY, JSON.stringify(apps));

      Swal.fire("ส่งคำเชิญสำเร็จ","","success");
      renderMatching();
    });
  }

  // LOGOUT
  logoutBtn.addEventListener("click", () => {
    Swal.fire({
      title:"ออกจากระบบ?",
      showCancelButton:true
    }).then(r=>{
      if (r.isConfirmed) {
        localStorage.setItem(SESSION_KEY,"");
        location.href="../auth.html";
      }
    });
  });

  // RUN
  renderMatching();
});
