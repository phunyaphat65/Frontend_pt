/**
 * seeker/js/reviews.js
 * ระบบรีวิวร้าน สำหรับผู้หางาน (Seeker)
 * - แสดงเฉพาะงานที่ผู้ใช้เคยสมัคร
 * - ป้องกันรีวิวซ้ำ
 * - เก็บ/แก้ไขรีวิวใน localStorage
 * - ใช้ SweetAlert2 แจ้งเตือนสวยงาม
 */

(function () {
  const USERS_KEY = "pt_users";
  const JOBS_KEY = "pt_jobs";
  const REVIEWS_KEY = "pt_reviews";
  const APPS_KEY = "pt_applications";
  const SESSION_KEY = "pt_seeker_session";

  const reviewForm = document.getElementById("reviewForm");
  const reviewList = document.getElementById("reviewList");
  const shopSelect = document.getElementById("shopSelect");
  const emptyState = document.getElementById("emptyState");
  const logoutBtn = document.getElementById("logoutBtn");

  let currentUser = null;
  let allReviews = [];
  let jobs = [];
  let applications = [];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // 🔐 โหลด session
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) {
      Swal.fire("กรุณาเข้าสู่ระบบก่อน", "", "warning").then(() => {
        window.location.href = "../auth.html";
      });
      return;
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    currentUser = users.find((u) => u.email === email && u.role === "seeker");

    if (!currentUser) {
      Swal.fire("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่", "error").then(() => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "../auth.html";
      });
      return;
    }

    jobs = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
    applications = JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
    allReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");

    loadJobOptions();
    renderReviews();

    reviewForm.addEventListener("submit", handleSubmit);
    logoutBtn.addEventListener("click", handleLogout);
  }

  // 🏪 โหลดงานที่ผู้ใช้เคยสมัคร
  function loadJobOptions() {
    const myApps = applications.filter((a) => a.user_email === currentUser.email);

    if (myApps.length === 0) {
      shopSelect.innerHTML = `<option value="">คุณยังไม่มีงานที่สมัคร</option>`;
      shopSelect.disabled = true;
      return;
    }

    shopSelect.innerHTML = myApps
      .map((app) => {
        const job = jobs.find((j) => j.job_id === app.job_id);
        return job
          ? `<option value="${job.job_id}">${job.title} (${job.shop_name})</option>`
          : "";
      })
      .join("");
  }

  // 💾 เมื่อส่งฟอร์มรีวิว
  function handleSubmit(e) {
    e.preventDefault();

    const jobId = shopSelect.value;
    const rating = parseInt(document.getElementById("rating").value);
    const comment = document.getElementById("comment").value.trim();

    if (!jobId || !rating) {
      Swal.fire("กรุณาเลือกงานและให้คะแนน", "", "warning");
      return;
    }

    const job = jobs.find((j) => j.job_id === jobId);
    if (!job) {
      Swal.fire("ไม่พบข้อมูลงาน", "", "error");
      return;
    }

    // ❌ ตรวจสอบว่ารีวิวซ้ำไหม
    const existing = allReviews.find(
      (r) => r.user_email === currentUser.email && r.job_id === jobId
    );

    if (existing) {
      Swal.fire("คุณได้รีวิวงานนี้ไปแล้ว", "", "info");
      return;
    }

    const newReview = {
      id: `rev_${Date.now()}`,
      job_id: jobId,
      user_email: currentUser.email,
      user_name: currentUser.name || "ไม่ระบุชื่อ",
      shop_name: job.shop_name || "ไม่ระบุร้าน",
      job_title: job.title || "ไม่ระบุชื่องาน",
      rating,
      comment,
      date: new Date().toISOString(),
    };

    allReviews.push(newReview);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));

    Swal.fire("ส่งรีวิวเรียบร้อย ✅", "", "success").then(() => {
      reviewForm.reset();
      renderReviews();
    });
  }

  // 💬 แสดงเฉพาะรีวิวของผู้ใช้
  function renderReviews() {
    const myReviews = allReviews.filter((r) => r.user_email === currentUser.email);

    if (myReviews.length === 0) {
      emptyState.style.display = "block";
      reviewList.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";

    myReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

    reviewList.innerHTML = myReviews
      .map(
        (r) => `
        <div class="review-card">
          <div class="review-header">
            <div class="review-user">${r.shop_name}</div>
            <div class="review-rating">${"⭐".repeat(r.rating)}</div>
          </div>
          <div class="review-comment">${r.comment || "<i>ไม่มีความคิดเห็น</i>"}</div>
          <div class="review-date">${formatDate(r.date)}</div>
        </div>
      `
      )
      .join("");
  }

  // 🧭 ออกจากระบบ
  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    Swal.fire("ออกจากระบบเรียบร้อย", "", "success").then(() => {
      window.location.href = "../auth.html";
    });
  }

  // 🗓 ฟังก์ชันแปลงวันที่ให้อ่านง่าย
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
})();
