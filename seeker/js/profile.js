(() => {
  const USERS_KEY = "pt_users";
  const SESSION_KEY = "pt_session";

  let map, marker;
  let currentLat = 13.7563, currentLng = 100.5018; // Default: Bangkok

  // 🗺️ Init Google Map
  window.initMap = () => {
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: currentLat, lng: currentLng },
      zoom: 13,
    });

    marker = new google.maps.Marker({
      position: { lat: currentLat, lng: currentLng },
      map,
      draggable: true,
    });

    google.maps.event.addListener(marker, "dragend", () => {
      const pos = marker.getPosition();
      currentLat = pos.lat();
      currentLng = pos.lng();
    });
  };

  // 👤 Helper functions
  const getCurrentUser = () => {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return users.find((u) => u.email === email);
  };

  const saveUser = (updatedUser) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const idx = users.findIndex((u) => u.email === updatedUser.email);
    if (idx !== -1) {
      users[idx] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  };

  // 🔐 Session Check
  const user = getCurrentUser();
  if (!user) {
    alert("กรุณาเข้าสู่ระบบก่อนใช้งาน");
    window.location.href = "../auth.html";
    return;
  }

  // 🧩 DOM Elements
  const form = document.getElementById("profileForm");
  const previewImg = document.getElementById("previewImg");
  const fileInput = document.getElementById("profileImageInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const successModal = document.getElementById("successModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  // 🧾 Prefill user data
  document.getElementById("email").value = user.email || "";
  document.getElementById("name").value = user.name || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("address").value = user.address || "";
  document.getElementById("skills").value = user.skills || "";
  document.getElementById("experience").value = user.experience || "";
  if (user.profile_image) previewImg.src = user.profile_image;
  if (user.lat && user.lng) {
    currentLat = user.lat;
    currentLng = user.lng;
  }

  // 📸 Upload image
  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      previewImg.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // 💾 Save profile
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    if (!name) return alert("กรุณากรอกชื่อ");
    if (!phone) return alert("กรุณากรอกเบอร์โทรศัพท์");

    const updatedUser = {
      ...user,
      name,
      phone,
      address: form.address.value.trim(),
      skills: form.skills.value.trim(),
      experience: form.experience.value.trim(),
      profile_image: previewImg.src,
      lat: currentLat,
      lng: currentLng,
    };

    saveUser(updatedUser);
    successModal.classList.add("active");
  });

  // ✅ Close modal
  closeModalBtn.addEventListener("click", () => {
    successModal.classList.remove("active");
  });

  // 🚪 Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("คุณแน่ใจว่าต้องการออกจากระบบหรือไม่?")) {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "../auth.html";
    }
  });
})();
