// ---------------------------------------------------------
// shop/js/jobs.js (Full Professional Version)
// ระบบจัดการงานของร้านค้า สำหรับ Part-time Match
// รองรับ: แผนที่ Leaflet, ปักหมุด, รูปภาพ, วันเริ่มงาน,
// การแก้ไขงาน, การลบงาน, การแสดงผลแบบมืออาชีพ
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------
  // 🔐 ตรวจสอบการล็อกอินร้านค้า
  // ---------------------------
  const SESSION_SHOP = "pt_shop_session";
  const shopEmail = localStorage.getItem(SESSION_SHOP);
  if (!shopEmail) {
    Swal.fire("กรุณาเข้าสู่ระบบก่อน", "", "warning")
      .then(() => (window.location.href = "../auth.html"));
    return;
  }

  // ---------------------------
  // 🗂 LocalStorage Keys
  // ---------------------------
  const JOB_STORAGE = "pt_jobs";

  let jobs = JSON.parse(localStorage.getItem(JOB_STORAGE)) || [];
  let editJobId = null;

  // ---------------------------
  // 🧭 UI Elements
  // ---------------------------
  const modal = document.getElementById("jobModal");
  const openBtn = document.getElementById("addJobBtn");
  const closeBtn = document.getElementById("closeModal");

  const jobListEl = document.getElementById("jobList");
  const emptyState = document.getElementById("emptyState");

  const previewImage = document.getElementById("previewImage");
  let map, marker;
  let selectedImageBase64 = "";

  // ---------------------------
  // 📍 เปิด Modal
  // ---------------------------
  openBtn.onclick = () => {
    openModal();
  };

  function openModal(job = null) {
    modal.classList.remove("hidden");
    resetForm();

    if (job) {
      document.getElementById("modalTitle").textContent = "✏️ แก้ไขงาน";
      editJobId = job.id;

      document.getElementById("jobTitle").value = job.title;
      document.getElementById("jobDesc").value = job.desc;
      document.getElementById("jobLocation").value = job.location;
      document.getElementById("jobStart").value = job.startDate;
      document.getElementById("jobWage").value = job.wage;
      document.getElementById("jobContact").value = job.contact;

      if (job.image) {
        selectedImageBase64 = job.image;
        previewImage.src = job.image;
        previewImage.style.display = "block";
      }

      if (job.lat && job.lng) {
        setTimeout(() => initMap(job.lat, job.lng), 200);
      } else {
        setTimeout(initMap, 200);
      }

    } else {
      document.getElementById("modalTitle").textContent = "➕ เพิ่มงานใหม่";
      editJobId = null;
      setTimeout(initMap, 200);
    }
  }

  // ---------------------------
  // ❌ ปิด Modal
  // ---------------------------
  closeBtn.onclick = () => modal.classList.add("hidden");

  // ---------------------------
  // 🖼 Preview Image
  // ---------------------------
  document.getElementById("jobImage").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      selectedImageBase64 = evt.target.result;
      previewImage.src = selectedImageBase64;
      previewImage.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  // ---------------------------
  // 🗺️ Leaflet Map
  // ---------------------------
  function initMap(lat = 13.7563, lng = 100.5018) {
    if (!map) {
      map = L.map('map').setView([lat, lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

      map.on("click", e => {
        if (marker) map.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(map);

        document.getElementById("jobLocation").value =
          `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`;
      });

    } else {
      map.setView([lat, lng], 12);
    }

    setTimeout(() => map.invalidateSize(), 200);
  }

  // ---------------------------
  // 💾 บันทึกงาน
  // ---------------------------
  document.getElementById("saveJobBtn").onclick = () => {
    const title = document.getElementById("jobTitle").value.trim();
    const desc = document.getElementById("jobDesc").value.trim();
    const loc = document.getElementById("jobLocation").value.trim();
    const start = document.getElementById("jobStart").value;
    const wage = document.getElementById("jobWage").value;
    const contact = document.getElementById("jobContact").value;

    if (!title || !loc || !wage) {
      Swal.fire("กรุณากรอกข้อมูลให้ครบ", "", "warning");
      return;
    }

    let lat = null, lng = null;
    const latlngMatch = loc.match(/Lat: ([0-9.\-]+), Lng: ([0-9.\-]+)/);
    if (latlngMatch) {
      lat = parseFloat(latlngMatch[1]);
      lng = parseFloat(latlngMatch[2]);
    }

    if (editJobId) {
      const idx = jobs.findIndex(j => j.id === editJobId);
      if (idx !== -1) {
        jobs[idx] = {
          ...jobs[idx],
          title,
          desc,
          location: loc,
          startDate: start,
          wage,
          contact,
          image: selectedImageBase64,
          lat,
          lng
        };
      }

      Swal.fire("สำเร็จ!", "แก้ไขงานเรียบร้อยแล้ว", "success");

    } else {
      const newJob = {
        id: Date.now(),
        shop: shopEmail,
        title,
        desc,
        location: loc,
        startDate: start,
        wage,
        contact,
        image: selectedImageBase64,
        lat,
        lng,
        created_at: new Date().toISOString()
      };

      jobs.push(newJob);
      Swal.fire("บันทึกสำเร็จ!", "เพิ่มงานเรียบร้อยแล้ว", "success");
    }

    localStorage.setItem(JOB_STORAGE, JSON.stringify(jobs));
    modal.classList.add("hidden");
    renderJobs();
  };

  // ---------------------------
  // 📌 แสดงงานในระบบ
  // ---------------------------
  function renderJobs() {
    const shopJobs = jobs.filter(j => j.shop === shopEmail);

    jobListEl.innerHTML = "";
    emptyState.style.display = shopJobs.length === 0 ? "block" : "none";

    shopJobs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card";

        card.innerHTML = `
          <h4>${job.title}</h4>
          <p>📍 ${job.location}</p>
          <p>💰 ${job.wage} บาท/ชม.</p>
          <p>เริ่มงาน: ${job.startDate || "-"}</p>

          <button class="edit-btn" style="
            margin-top:8px;
            background:#667eea;color:#fff;border:none;
            padding:6px 12px;border-radius:6px;cursor:pointer;">
            ✏️ แก้ไข
          </button>

          <button class="delete-btn" style="
            margin-top:8px;background:#e74c3c;color:#fff;
            border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">
            🗑️ ลบ
          </button>
        `;

        card.querySelector(".edit-btn").onclick = () => openModal(job);
        card.querySelector(".delete-btn").onclick = () => deleteJob(job.id);

        jobListEl.appendChild(card);
      });
  }

  // ---------------------------
  // 🗑️ ลบงาน
  // ---------------------------
  function deleteJob(id) {
    Swal.fire({
      title: "ต้องการลบงาน?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก"
    }).then(result => {
      if (result.isConfirmed) {
        jobs = jobs.filter(j => j.id !== id);
        localStorage.setItem(JOB_STORAGE, JSON.stringify(jobs));
        renderJobs();
        Swal.fire("ลบสำเร็จ!", "", "success");
      }
    });
  }

  // ---------------------------
  // ♻️ Reset Form
  // ---------------------------
  function resetForm() {
    editJobId = null;

    document.getElementById("jobTitle").value = "";
    document.getElementById("jobDesc").value = "";
    document.getElementById("jobLocation").value = "";
    document.getElementById("jobStart").value = "";
    document.getElementById("jobWage").value = "";
    document.getElementById("jobContact").value = "";
    selectedImageBase64 = "";

    previewImage.style.display = "none";
    previewImage.src = "";
  }

  // ---------------------------
  // 🔄 โหลดงานทันที
  // ---------------------------
  renderJobs();
});
