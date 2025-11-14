// ----------------------------------------------------------  
// seeker/js/applications.js (FINAL MATCHED VERSION)
// ----------------------------------------------------------

(() => {

  const SESSION_SEEKER = "pt_seeker_session";
  const APPS_KEY = "pt_applications";
  const JOBS_KEY = "jobs";

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
  const loadApplications = () => {
    const all = JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
    return all.filter(a => a.applicant === seekerEmail);
  };

  const loadJobs = () =>
    JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");

  // -----------------------------
  // Status text + color badge
  // -----------------------------
  function renderStatus(status) {
    const map = {
      pending: { text: "⏳ รอดำเนินการ", color: "#d4a017" },
      reviewing: { text: "🔎 ร้านกำลังตรวจสอบ", color: "#3498db" },
      interview: { text: "📞 นัดสัมภาษณ์", color: "#9b59b6" },
      approved: { text: "✅ ผ่านการคัดเลือก", color: "#2ecc71" },
      hired: { text: "🎉 ได้งานแล้ว", color: "#27ae60" },
      rejected: { text: "❌ ไม่ผ่าน", color: "#e74c3c" },
      cancelled: { text: "⚪ ยกเลิกแล้ว", color: "#95a5a6" },
    };
    return map[status] || { text: status, color: "#999" };
  }

  // -----------------------------
  // Render Applications
  // -----------------------------
  function renderApplications() {
    const apps = loadApplications();
    const jobs = loadJobs();

    applicationsList.innerHTML = "";

    if (apps.length === 0) {
      applicationsList.innerHTML = `<p class="no-data">ยังไม่มีใบสมัครงาน</p>`;
      return;
    }

    // sort ใหม่ล่าสุดก่อน
    apps.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));

    apps.forEach(app => {
      const job = jobs.find(j => j.id === app.job_id);

      const card = document.createElement("div");
      card.className = "app-card";

      const statusInfo = renderStatus(app.status);

      const title = app.job_title || (job ? job.title : "(งานถูกลบแล้ว)");
      const shopName = app.shop_name || (job ? job.shop_name : "(ไม่มีข้อมูล)");
      const location = app.location || (job ? job.location : "-");

      card.innerHTML = `
        <div class="app-header">
          <h3>${title}</h3>
          <span class="badge" style="background:${statusInfo.color}">
            ${statusInfo.text}
          </span>
        </div>

        <div class="app-info">
          <p><strong>ร้าน:</strong> ${shopName}</p>
          <p><strong>สถานที่:</strong> ${location}</p>
          <p><strong>ค่าแรง:</strong> ${app.wage || "-"} บาท/ชม.</p>
          <p><strong>วันที่สมัคร:</strong> 
            ${new Date(app.applied_at).toLocaleString("th-TH")}
          </p>
          <p><strong>หมายเหตุ:</strong> ${app.note || "-"}</p>

          ${!job ? `<p class="warn">⚠️ งานนี้อาจถูกลบแล้ว</p>` : ""}
        </div>
      `;

      // ปุ่มยกเลิก เฉพาะ pending
      if (app.status === "pending") {
        const btn = document.createElement("button");
        btn.className = "btn-cancel";
        btn.innerHTML = `<i class="fa-solid fa-ban"></i> ยกเลิกใบสมัคร`;
        btn.onclick = () => cancelApplication(app.id);
        card.appendChild(btn);
      }

      applicationsList.appendChild(card);
    });
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

      Swal.fire({
        icon: "success",
        title: "ยกเลิกใบสมัครแล้ว",
      });

      renderApplications();
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
