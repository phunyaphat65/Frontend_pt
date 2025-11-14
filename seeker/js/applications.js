(() => {

  const SESSION_SEEKER = "pt_seeker_session";
  const APPS_KEY = "pt_applications";
  const JOBS_KEY = "jobs";   // <<< ปรับให้ตรงกับ seeker/jobs.js
  const applicationsList = document.getElementById("applicationsList");

  // -----------------------------
  // Login Check
  // -----------------------------
  const seekerEmail = localStorage.getItem(SESSION_SEEKER);
  if (!seekerEmail) {
    Swal.fire({
      icon: "warning",
      title: "ต้องเข้าสู่ระบบก่อน",
      text: "กรุณาเข้าสู่ระบบบัญชีผู้สมัคร",
    }).then(() => location.href = "../auth.html");
    return;
  }

  // -----------------------------
  // Load data
  // -----------------------------
  function loadApplications() {
    const all = JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
    return all.filter(a => a.applicant === seekerEmail);
  }

  function loadJobs() {
    return JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  }

  // -----------------------------
  // Render applications
  // -----------------------------
  function renderApplications() {
    const apps = loadApplications();
    const jobs = loadJobs();

    applicationsList.innerHTML = "";

    if (apps.length === 0) {
      applicationsList.innerHTML = `<p class="no-data">ยังไม่มีใบสมัครงาน</p>`;
      return;
    }

    apps.sort((a, b) => new Date(b.date) - new Date(a.date));

    apps.forEach(app => {
      const job = jobs.find(j => j.id === app.job_id);

      const card = document.createElement("div");
      card.className = "app-card";

      const title = app.job_title || (job ? job.title : "(งานถูกลบแล้ว)");
      const shopName = job ? job.shop_name : "(ไม่มีข้อมูล)";
      const location = job ? job.location : "-";

      card.innerHTML = `
        <div class="app-header">
          <h3>${title}</h3>
          <span class="badge status-${app.status}">${statusText(app.status)}</span>
        </div>

        <div class="app-info">
          <p><strong>ร้าน:</strong> ${shopName}</p>
          <p><strong>สถานที่:</strong> ${location}</p>
          <p><strong>วันที่สมัคร:</strong> ${new Date(app.date).toLocaleDateString("th-TH")}</p>
          <p><strong>รายละเอียดที่ส่ง:</strong> ${app.note || "-"}</p>

          ${!job ? `<p class="warn">⚠️ งานนี้อาจถูกลบแล้ว</p>` : ""}
        </div>
      `;

      if (["pending", "reviewing"].includes(app.status)) {
        const btn = document.createElement("button");
        btn.className = "btn-cancel";
        btn.innerHTML = `<i class="fa-solid fa-ban"></i> ยกเลิกใบสมัคร`;
        btn.onclick = () => cancelApplication(app.id);
        card.appendChild(btn);
      }

      applicationsList.appendChild(card);
    });
  }

  function statusText(status) {
    return {
      pending: "⏳ รอดำเนินการ",
      reviewing: "🔎 ร้านกำลังตรวจสอบ",
      interview: "📞 นัดสัมภาษณ์",
      approved: "✅ ผ่านการคัดเลือก",
      hired: "🎉 ได้งานแล้ว",
      rejected: "❌ ไม่ผ่าน",
      cancelled: "⚪ ยกเลิกแล้ว",
    }[status] || status;
  }

  // -----------------------------
  // Cancel application
  // -----------------------------
  function cancelApplication(id) {
    Swal.fire({
      title: "ยกเลิกใบสมัคร?",
      text: "คุณต้องการยกเลิกใบสมัครนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ไม่ยกเลิก",
    }).then(res => {
      if (!res.isConfirmed) return;

      let apps = JSON.parse(localStorage.getItem(APPS_KEY) || "[]");

      apps = apps.map(a => {
        if (a.id === id) a.status = "cancelled";
        return a;
      });

      localStorage.setItem(APPS_KEY, JSON.stringify(apps));

      renderApplications();

      Swal.fire({
        icon: "success",
        title: "ยกเลิกใบสมัครแล้ว",
      });
    });
  }

  // -----------------------------
  // Logout
  // -----------------------------
  document.getElementById("logoutBtn").onclick = () => {
    Swal.fire({
      title: "ออกจากระบบ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then(res => {
      if (res.isConfirmed) {
        localStorage.removeItem(SESSION_SEEKER);
        Swal.fire("ออกจากระบบแล้ว", "", "success")
          .then(() => location.href = "../auth.html");
      }
    });
  };

  // Start
  renderApplications();

})();
