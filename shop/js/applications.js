// ------------------------------
// shop/js/applications.js (เวอร์ชันแก้ไขมืออาชีพ)
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // ใช้โครงสร้างเดียวกับ auth.js
  const USERS_KEY = "pt_users";
  const JOBS_KEY = "pt_jobs";
  const APPS_KEY = "pt_applications";
  const SESSION_SEEKER = "pt_seeker_session";
  const SESSION_SHOP = "pt_shop_session";

  const appList = document.getElementById("appList");
  const emptyState = document.getElementById("emptyState");
  const logoutBtn = document.getElementById("logoutBtn");

  // ------------------------------
  // ตรวจสอบ Session จาก auth.js
  // ------------------------------
  const email =
    localStorage.getItem(SESSION_SHOP) ||
    localStorage.getItem(SESSION_SEEKER);

  if (!email) {
    Swal.fire({
      icon: "warning",
      title: "โปรดเข้าสู่ระบบก่อน",
      confirmButtonText: "ตกลง",
    }).then(() => (window.location.href = "../auth.html"));
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const currentUser = users.find(u => u.email === email);

  if (!currentUser || currentUser.role !== "shop") {
    Swal.fire({
      icon: "warning",
      title: "หน้านี้สำหรับร้านค้าเท่านั้น",
      confirmButtonText: "ตกลง",
    }).then(() => {
      localStorage.removeItem(SESSION_SHOP);
      window.location.href = "../auth.html";
    });
    return;
  }

  // ------------------------------
  // โหลดข้อมูลใบสมัคร
  // ------------------------------
  const jobs = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  const applications = JSON.parse(localStorage.getItem(APPS_KEY) || "[]");

  const shopJobs = jobs.filter(j => j.shop_email === currentUser.email);
  const shopJobIds = shopJobs.map(j => j.job_id);
  const shopApplications = applications.filter(a => shopJobIds.includes(a.job_id));

  if (!shopApplications.length) {
    emptyState.style.display = "block";
    return;
  }

  // ------------------------------
  // แสดงรายการใบสมัคร
  // ------------------------------
  shopApplications.forEach(app => {
    const job = jobs.find(j => j.job_id === app.job_id);
    const card = document.createElement("div");
    card.className = "application-item";

    const statusClass =
      app.status === "approved"
        ? "approved"
        : app.status === "rejected"
        ? "rejected"
        : "pending";

    card.innerHTML = `
      <div class="app-info">
        <strong>${job?.title || "ไม่ระบุชื่องาน"}</strong>
        <span>ผู้สมัคร: ${app.user_email}</span>
        <span>วันที่สมัคร: ${new Date(app.date_applied).toLocaleDateString("th-TH")}</span>
        <span>สถานะ: <span class="status ${statusClass}">${translateStatus(app.status)}</span></span>
      </div>
      <div class="actions">
        <button class="btn-approve">อนุมัติ</button>
        <button class="btn-reject">ปฏิเสธ</button>
      </div>
    `;

    const [approveBtn, rejectBtn] = card.querySelectorAll("button");
    approveBtn.addEventListener("click", () => updateStatus(app, "approved"));
    rejectBtn.addEventListener("click", () => updateStatus(app, "rejected"));

    appList.appendChild(card);
  });

  // ------------------------------
  // ฟังก์ชันแปลงสถานะ
  // ------------------------------
  function translateStatus(status) {
    switch (status) {
      case "approved":
        return "✅ อนุมัติแล้ว";
      case "rejected":
        return "❌ ปฏิเสธ";
      default:
        return "🕓 รอดำเนินการ";
    }
  }

  // ------------------------------
  // ฟังก์ชันอัปเดตสถานะใบสมัคร
  // ------------------------------
  function updateStatus(app, newStatus) {
    const confirmMsg =
      newStatus === "approved"
        ? "ยืนยันการอนุมัติใบสมัครนี้หรือไม่?"
        : "ยืนยันการปฏิเสธใบสมัครนี้หรือไม่?";

    Swal.fire({
      icon: "question",
      title: confirmMsg,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((res) => {
      if (!res.isConfirmed) return;

      const updatedApps = applications.map(a =>
        a.app_id === app.app_id ? { ...a, status: newStatus } : a
      );

      localStorage.setItem(APPS_KEY, JSON.stringify(updatedApps));
      Swal.fire({
        icon: "success",
        title: "อัปเดตสถานะเรียบร้อย ✅",
        timer: 1200,
        showConfirmButton: false,
      }).then(() => window.location.reload());
    });
  }

  // ------------------------------
  // Logout
  // ------------------------------
  logoutBtn.addEventListener("click", () => {
    Swal.fire({
      icon: "question",
      title: "ออกจากระบบ?",
      text: "คุณต้องการออกจากระบบหรือไม่",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem(SESSION_SHOP);
        Swal.fire({
          icon: "success",
          title: "ออกจากระบบเรียบร้อย 👋",
          timer: 1200,
          showConfirmButton: false,
        }).then(() => (window.location.href = "../auth.html"));
      }
    });
  });
});
