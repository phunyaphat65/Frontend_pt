// ---------------------------------------------------------
// shop/js/profile.js (เวอร์ชันแก้ไขล่าสุด รองรับทุกระบบ session)
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 🧩 Key หลักใน LocalStorage
  const USERS_KEY = "pt_users";
  const SESSION_SHOP = "pt_shop_session";
  const SESSION_SEEKER = "pt_seeker_session";
  const LEGACY_SESSION = "pt_session"; // รองรับระบบเก่า

  // 🧱 ตัวแปร DOM
  const form = document.getElementById("profileForm");
  const logoutBtn = document.getElementById("logoutBtn");

  // -----------------------------------------------------
  // 🧭 ตรวจสอบสถานะการเข้าสู่ระบบ
  // -----------------------------------------------------
  const email =
    localStorage.getItem(SESSION_SHOP) ||
    localStorage.getItem(LEGACY_SESSION) ||
    localStorage.getItem(SESSION_SEEKER);

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
  let shop = users.find(u => u.email === email && u.role === "shop");

  if (!shop) {
    Swal.fire({
      icon: "error",
      title: "ไม่พบข้อมูลร้านค้า",
      text: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
    }).then(() => {
      localStorage.removeItem(SESSION_SHOP);
      localStorage.removeItem(LEGACY_SESSION);
      window.location.href = "../auth.html";
    });
    return;
  }

  // -----------------------------------------------------
  // 🧾 แจ้งเตือน SweetAlert2
  // -----------------------------------------------------
  function showAlert(type, message) {
    Swal.fire({
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 1800
    });
  }

  // -----------------------------------------------------
  // 🧠 โหลดข้อมูลร้านในฟอร์ม
  // -----------------------------------------------------
  function loadProfile() {
    document.getElementById("shopName").value = shop.name || "";
    document.getElementById("shopEmail").value = shop.email || "";
    document.getElementById("shopPhone").value = shop.phone || "";
    document.getElementById("shopAddress").value = shop.address || "";
    document.getElementById("shopDescription").value = shop.description || "";
  }

  // -----------------------------------------------------
  // 💾 เมื่อกดบันทึกข้อมูล
  // -----------------------------------------------------
  form.addEventListener("submit", e => {
    e.preventDefault();

    const updated = {
      ...shop,
      name: document.getElementById("shopName").value.trim(),
      phone: document.getElementById("shopPhone").value.trim(),
      address: document.getElementById("shopAddress").value.trim(),
      description: document.getElementById("shopDescription").value.trim()
    };

    if (!updated.name || !updated.phone) {
      showAlert("error", "กรุณากรอกชื่อร้านและเบอร์โทรให้ครบถ้วน");
      return;
    }

    const updatedUsers = users.map(u =>
      u.email === shop.email ? updated : u
    );
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    shop = updated;
    showAlert("success", "✅ บันทึกข้อมูลเรียบร้อยแล้ว");
  });

  // -----------------------------------------------------
  // 🚪 ปุ่มออกจากระบบ
  // -----------------------------------------------------
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
        localStorage.removeItem(SESSION_SHOP);
        localStorage.removeItem(LEGACY_SESSION);
        localStorage.removeItem(SESSION_SEEKER);
        Swal.fire({
          icon: "success",
          title: "ออกจากระบบเรียบร้อย 👋",
          timer: 1200,
          showConfirmButton: false
        }).then(() => (window.location.href = "../auth.html"));
      }
    });
  });

  // โหลดข้อมูลเมื่อหน้าเพจพร้อม
  loadProfile();
});
