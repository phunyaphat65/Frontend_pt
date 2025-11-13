// ======================================
// reviews.js (เวอร์ชันปรับปรุง)
// ======================================

// ---------------------------
// ตรวจสอบการเข้าสู่ระบบ
// ---------------------------
const user = requireLogin(true);

// ---------------------------
// คีย์ข้อมูล LocalStorage
// ---------------------------
const REVIEWS_KEY = "pt_reviews";
const JOBS_KEY = "pt_jobs";

// ---------------------------
// ฟังก์ชันจัดการข้อมูล
// ---------------------------
function getData(key, defaultValue = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
  } catch {
    return defaultValue;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------
// โหลดและแสดงผลรีวิวทั้งหมด
// ---------------------------
function renderReviews() {
  const list = document.getElementById("reviews");
  const reviews = getData(REVIEWS_KEY);
  const jobs = getData(JOBS_KEY);

  if (!list) return;

  if (!reviews.length) {
    list.innerHTML = `<p style="color:#777;text-align:center;">ยังไม่มีรีวิวในระบบ</p>`;
    return;
  }

  list.innerHTML = reviews
    .reverse()
    .map(r => {
      const job = jobs.find(j => j.id === r.shopId);
      const shopName = job ? job.title : `ร้าน ${r.shopId}`;
      return `
        <div class="review-card">
          <div class="review-header">
            <strong>${shopName}</strong>
            <span class="rating">⭐ ${r.rating}/5</span>
          </div>
          <p class="comment">${r.comment || "ไม่มีความคิดเห็น"}</p>
          <div class="review-footer">
            <small>โดย ${r.user}</small>
            <small>${new Date(r.date).toLocaleString("th-TH")}</small>
          </div>
        </div>
      `;
    })
    .join("");
}

// ---------------------------
// เพิ่มรีวิวใหม่
// ---------------------------
document.getElementById("reviewForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const shopId = form.shopId.value.trim();
  const rating = parseInt(form.rating.value);
  const comment = form.comment.value.trim();

  if (!shopId || !rating) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  const reviews = getData(REVIEWS_KEY);
  const newReview = {
    id: Date.now(),
    user: user.email,
    shopId,
    rating,
    comment,
    date: new Date().toISOString()
  };

  reviews.push(newReview);
  saveData(REVIEWS_KEY, reviews);

  alert("บันทึกรีวิวเรียบร้อย ✅");
  form.reset();
  renderReviews();
});

// ---------------------------
// ปุ่มออกจากระบบ
// ---------------------------
document.getElementById("logoutBtn")?.addEventListener("click", logout);

// ---------------------------
// โหลดรีวิวเมื่อเริ่มต้น
// ---------------------------
document.addEventListener("DOMContentLoaded", renderReviews);
