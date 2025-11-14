/**
 * seeker/js/reviews.js
 * ระบบรีวิวสำหรับผู้หางาน (Seeker)
 * - แสดงเฉพาะงานที่ผู้ใช้เคยสมัคร (applicant)
 * - ป้องกันรีวิวซ้ำ
 * - ใช้งานร่วมกับโครงสร้าง JOBS ของคุณ (id, title, shop_name)
 */

(() => {

  const USERS_KEY = "pt_users";
  const JOBS_KEY = "pt_jobs";
  const APPS_KEY = "pt_applications";
  const REVIEWS_KEY = "pt_reviews";
  const SESSION_KEY = "pt_seeker_session";

  const reviewForm = document.getElementById("reviewForm");
  const reviewList = document.getElementById("reviewList");
  const shopSelect = document.getElementById("shopSelect");
  const emptyState = document.getElementById("emptyState");
  const logoutBtn = document.getElementById("logoutBtn");

  let currentUser = null;
  let jobs = [];
  let apps = [];
  let reviews = [];

  document.addEventListener("DOMContentLoaded", init);

  function init() {

    // 🔐 เช็คการเข้าสู่ระบบ
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) {
      Swal.fire("ต้องเข้าสู่ระบบก่อน", "", "warning").then(() => {
        location.href = "../auth.html";
      });
      return;
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    currentUser = users.find(u => u.email === email && u.role === "seeker");

    if (!currentUser) {
      Swal.fire("ผู้ใช้ไม่ถูกต้อง", "", "error").then(() => {
        localStorage.removeItem(SESSION_KEY);
        location.href = "../auth.html";
      });
      return;
    }

    // โหลดข้อมูลทั้งหมด
    jobs = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
    apps = JSON.parse(localStorage.getItem(APPS_KEY) || "[]");
    reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");

    loadJobOptions();
    renderReviews();

    reviewForm.addEventListener("submit", handleSubmit);
    logoutBtn.addEventListener("click", logout);
  }

  // 📌 โหลดงานที่ user เคยสมัคร
  function loadJobOptions() {

    // apps เก็บเป็น applicant ไม่ใช่ user_email
    const myApps = apps.filter(a => a.applicant === currentUser.email);

    if (myApps.length === 0) {
      shopSelect.innerHTML = `<option value="">คุณยังไม่เคยสมัครงาน</option>`;
      shopSelect.disabled = true;
      return;
    }

    shopSelect.disabled = false;

    shopSelect.innerHTML = myApps.map(app => {
      const job = jobs.find(j => j.id === app.job_id);
      if (!job) return "";
      return `<option value="${job.id}">${job.title} (${job.shop_name})</option>`;
    }).join("");
  }

  // 📌 เมื่อส่งรีวิว
  function handleSubmit(e) {
    e.preventDefault();

    const jobId = shopSelect.value;
    const rating = parseInt(document.getElementById("rating").value);
    const comment = document.getElementById("comment").value.trim();

    if (!jobId || !rating) {
      Swal.fire("กรุณาเลือกงานและให้คะแนน", "", "warning");
      return;
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      Swal.fire("ไม่พบข้อมูลงาน", "", "error");
      return;
    }

    // ❌ ป้องกันรีวิวซ้ำ
    const exists = reviews.find(
      r => r.user_email === currentUser.email && r.job_id === jobId
    );

    if (exists) {
      Swal.fire("คุณรีวิวงานนี้ไปแล้ว", "", "info");
      return;
    }

    const newReview = {
      id: "rev_" + Date.now(),
      job_id: jobId,
      user_email: currentUser.email,
      user_name: currentUser.name || "",
      shop_name: job.shop_name,
      job_title: job.title,
      rating,
      comment,
      date: new Date().toISOString()
    };

    reviews.push(newReview);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));

    Swal.fire("ส่งรีวิวสำเร็จ", "", "success").then(() => {
      reviewForm.reset();
      renderReviews();
    });
  }

  // 📌 แสดงรีวิวทั้งหมดของผู้ใช้
  function renderReviews() {
    const myReviews = reviews.filter(r => r.user_email === currentUser.email);

    if (myReviews.length === 0) {
      emptyState.style.display = "block";
      reviewList.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";

    myReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

    reviewList.innerHTML = myReviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-user">${r.shop_name}</div>
          <div class="review-rating">${"⭐".repeat(r.rating)}</div>
        </div>
        <div class="review-comment">${r.comment || "<i>ไม่มีความคิดเห็น</i>"}</div>
        <div class="review-date">${formatDate(r.date)}</div>
      </div>
    `).join("");
  }

  // 📌 แปลงวันที่
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  // 📌 ออกจากระบบ
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    Swal.fire("ออกจากระบบแล้ว", "", "success").then(() => {
      location.href = "../auth.html";
    });
  }

})();
