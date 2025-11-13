// ----------------------------------------------------
// shop/js/reviews.js (เวอร์ชันปรับปรุงระดับ Production)
// แสดงรีวิวร้าน พร้อมระบบ session ใหม่และป้องกันการเข้าถึงผิดสิทธิ์
// ----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const USERS_KEY = "pt_users";
  const REVIEWS_KEY = "pt_reviews";
  const SESSION_SHOP = "pt_shop_session";
  const LEGACY_SESSION = "pt_session"; // รองรับ key เก่าไว้เผื่อผู้ใช้เก่า

  const reviewList = document.getElementById("reviewList");
  const emptyState = document.getElementById("emptyState");
  const avgRatingEl = document.getElementById("avgRating");
  const totalReviewsEl = document.getElementById("totalReviews");
  const logoutBtn = document.getElementById("logoutBtn");

  // 🧭 ตรวจสอบ Session
  const email =
    localStorage.getItem(SESSION_SHOP) ||
    localStorage.getItem(LEGACY_SESSION);

  if (!email) {
    alert("⚠️ กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "../auth.html";
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const shop = users.find(u => u.email === email && u.role === "shop");

  if (!shop) {
    alert("❌ บัญชีนี้ไม่ใช่ร้านค้า กรุณาเข้าสู่ระบบใหม่");
    localStorage.removeItem(SESSION_SHOP);
    localStorage.removeItem(LEGACY_SESSION);
    window.location.href = "../auth.html";
    return;
  }

  // 📦 โหลดรีวิวทั้งหมด
  const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");

  // 🔎 กรองเฉพาะรีวิวของร้านนี้ (อิงจาก email)
  const shopReviews = reviews.filter(r => r.shopEmail === email);

  // 🧮 แสดงผลรีวิว
  if (shopReviews.length === 0) {
    emptyState.style.display = "block";
    avgRatingEl.textContent = "--";
    totalReviewsEl.textContent = "ยังไม่มีรีวิว";
    return;
  }

  // คำนวณคะแนนเฉลี่ย
  const avgRating = (
    shopReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
    shopReviews.length
  ).toFixed(1);

  avgRatingEl.textContent = `⭐ ${avgRating}`;
  totalReviewsEl.textContent = `รีวิวทั้งหมด ${shopReviews.length} รายการ`;

  // แสดงรีวิว (เรียงใหม่ล่าสุดก่อน)
  shopReviews
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(r => {
      const div = document.createElement("div");
      div.className = "review-card";
      div.innerHTML = `
        <div class="review-header">
          <div class="review-user">👤 ${r.seekerEmail || "ผู้ใช้ไม่ระบุ"}</div>
          <div class="review-rating">⭐ ${r.rating}</div>
        </div>
        <div class="review-comment">${r.comment || "-"}</div>
        <div class="review-date">${new Date(r.date).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })}</div>
      `;
      reviewList.appendChild(div);
    });

  // 🚪 ออกจากระบบ
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_SHOP);
    localStorage.removeItem(LEGACY_SESSION);
    window.location.href = "../auth.html";
  });
});
