// --------------------------------------------------
// shop/js/jobs.js (เวอร์ชันมืออาชีพ)
// จัดการงานของร้านค้าในระบบ Part-time Match
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const USERS_KEY = "pt_users";
  const JOBS_KEY = "pt_jobs";
  const SESSION_SHOP = "pt_shop_session";

  const jobList = document.getElementById("jobList");
  const emptyState = document.getElementById("emptyState");
  const addJobBtn = document.getElementById("addJobBtn");
  const modal = document.getElementById("jobModal");
  const modalTitle = document.getElementById("modalTitle");
  const saveJobBtn = document.getElementById("saveJobBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const closeModal = document.getElementById("closeModal");

  let editJobId = null;

  // --------------------------------------------------
  // 🧭 ตรวจสอบสถานะเข้าสู่ระบบ
  // --------------------------------------------------
  const email = localStorage.getItem(SESSION_SHOP);
  if (!email) {
    Swal.fire({
      icon: "warning",
      title: "ยังไม่ได้เข้าสู่ระบบ",
      text: "กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้",
      confirmButtonText: "ตกลง"
    }).then(() => (window.location.href = "../auth.html"));
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const shop = users.find(u => u.email === email && u.role === "shop");

  if (!shop) {
    Swal.fire({
      icon: "error",
      title: "ไม่พบข้อมูลร้านค้า",
      text: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
    }).then(() => {
      localStorage.removeItem(SESSION_SHOP);
      window.location.href = "../auth.html";
    });
    return;
  }

  // --------------------------------------------------
  // ⚙️ Utility functions
  // --------------------------------------------------
  const loadJobs = () => JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
  const saveJobs = jobs => localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));

  const showAlert = (icon, text, timer = 1600) => {
    Swal.fire({ icon, title: text, showConfirmButton: false, timer });
  };

  // --------------------------------------------------
  // 🧾 แสดงรายการงานของร้านนี้
  // --------------------------------------------------
  function renderJobs() {
    const jobs = loadJobs().filter(j => j.shop_email === email);
    jobList.innerHTML = "";

    if (jobs.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";
    jobs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = `
          <h3>${job.title}</h3>
          <p>📍 ${job.location}</p>
          <p>💰 ${job.wage} บาท/ชม.</p>
          <p>${job.description || ""}</p>
          <div class="actions">
            <button class="btn btn-edit">แก้ไข</button>
            <button class="btn btn-delete">ลบ</button>
          </div>
        `;

        const [editBtn, deleteBtn] = card.querySelectorAll("button");
        editBtn.addEventListener("click", () => openModal(job));
        deleteBtn.addEventListener("click", () => deleteJob(job.job_id));

        jobList.appendChild(card);
      });
  }

  // --------------------------------------------------
  // 🪟 เปิด / ปิด Modal
  // --------------------------------------------------
  function openModal(job = null) {
    modal.classList.remove("hidden");

    if (job) {
      modalTitle.textContent = "✏️ แก้ไขงาน";
      document.getElementById("jobTitle").value = job.title;
      document.getElementById("jobLocation").value = job.location;
      document.getElementById("jobWage").value = job.wage;
      document.getElementById("jobDesc").value = job.description || "";
      editJobId = job.job_id;
    } else {
      modalTitle.textContent = "➕ เพิ่มงานใหม่";
      document.getElementById("jobTitle").value = "";
      document.getElementById("jobLocation").value = "";
      document.getElementById("jobWage").value = "";
      document.getElementById("jobDesc").value = "";
      editJobId = null;
    }
  }

  function closeJobModal() {
    modal.classList.add("hidden");
  }

  modal.addEventListener("click", e => {
    if (e.target === modal) closeJobModal();
  });
  if (closeModal) closeModal.addEventListener("click", closeJobModal);

  // --------------------------------------------------
  // 💾 บันทึกงาน
  // --------------------------------------------------
  saveJobBtn.addEventListener("click", () => {
    const title = document.getElementById("jobTitle").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const wage = parseInt(document.getElementById("jobWage").value);
    const desc = document.getElementById("jobDesc").value.trim();

    if (!title || !location || !wage) {
      showAlert("error", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const jobs = loadJobs();

    if (editJobId) {
      const idx = jobs.findIndex(j => j.job_id === editJobId);
      if (idx !== -1) {
        jobs[idx] = { ...jobs[idx], title, location, wage, description: desc };
      }
      showAlert("success", "✅ แก้ไขงานเรียบร้อยแล้ว");
    } else {
      const newJob = {
        job_id: Date.now().toString(),
        title,
        location,
        wage,
        description: desc,
        shop_email: email,
        shop_name: shop.name,
        created_at: new Date().toISOString()
      };
      jobs.push(newJob);
      showAlert("success", "✅ เพิ่มงานใหม่เรียบร้อย");
    }

    saveJobs(jobs);
    closeJobModal();
    renderJobs();
  });

  // --------------------------------------------------
  // 🗑️ ลบงาน
  // --------------------------------------------------
  function deleteJob(id) {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "หากลบแล้วจะไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก"
    }).then(result => {
      if (result.isConfirmed) {
        const jobs = loadJobs().filter(j => j.job_id !== id);
        saveJobs(jobs);
        showAlert("success", "🗑️ ลบงานเรียบร้อยแล้ว");
        renderJobs();
      }
    });
  }

  // --------------------------------------------------
  // 🧩 ปุ่มเพิ่มงานใหม่
  // --------------------------------------------------
  addJobBtn.addEventListener("click", () => openModal());

  // --------------------------------------------------
  // 🚪 ออกจากระบบ
  // --------------------------------------------------
  logoutBtn.addEventListener("click", () => {
    Swal.fire({
      title: "ออกจากระบบ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก"
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem(SESSION_SHOP);
        Swal.fire({
          icon: "success",
          title: "ออกจากระบบเรียบร้อย 👋",
          timer: 1200,
          showConfirmButton: false
        }).then(() => (window.location.href = "../auth.html"));
      }
    });
  });

  // --------------------------------------------------
  // 🔄 เริ่มโหลดข้อมูล
  // --------------------------------------------------
  renderJobs();
});
