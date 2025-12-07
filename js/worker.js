// js/worker.js
import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const workerContent = document.getElementById("workerContent");

// Obtener ID del trabajador
const params = new URLSearchParams(window.location.search);
const workerId = params.get("id");

if (!workerId) {
  workerContent.innerHTML = "<p>No se especificó ningún trabajador.</p>";
} else {
  loadWorker(workerId);
}

// =======================================================
// CARGAR PERFIL DEL TRABAJADOR
// =======================================================
async function loadWorker(id) {
  try {
    const snap = await getDoc(doc(db, "users", id));

    if (!snap.exists()) {
      workerContent.innerHTML = "<p>El perfil de este trabajador no existe.</p>";
      return;
    }

    const data = snap.data();
    renderWorker(data);
    loadReviews(id);

  } catch (error) {
    workerContent.innerHTML = `<p>Error cargando perfil: ${error.message}</p>`;
  }
}

// =======================================================
// MOSTRAR PERFIL EN PANTALLA
// =======================================================
function renderWorker(data) {
  const name = data.name || "Trabajador sin nombre";
  const oficio = data.oficio || "Oficio no especificado";
  const descripcion = data.descripcion || "Este trabajador aún no ha agregado una descripción.";
  const photoURL = data.photoURL || "";
  const email = data.email || "";

  const initial = name.trim()[0] || "?";

  // Servicios
  const services = Array.isArray(data.services) ? data.services : [];

  const servicesHTML = services.length
    ? `
      <ul style="list-style:none; padding:0;">
        ${services.map(svc => `
          <li style="padding:0.4rem 0; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between;">
            <span>${svc.name}</span>
            <span style="font-weight:600;">$${svc.price} MXN</span>
          </li>
        `).join("")}
      </ul>
    `
    : `<p class="worker-placeholder">Este trabajador aún no ha agregado servicios.</p>`;

  // HTML principal
  workerContent.innerHTML = `
    <div class="worker-top">
      <div class="worker-avatar-big">
        ${photoURL ? `<img src="${photoURL}" alt="Foto">` : initial}
      </div>
      <div>
        <h1>${name}</h1>
        <p class="worker-oficio-big">${oficio}</p>
      </div>
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Sobre mí</div>
      <p>${descripcion}</p>
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Servicios y precios</div>
      ${servicesHTML}
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Reseñas verificadas</div>
      <div id="reviewsContainer">
        <p class="worker-placeholder">Cargando reseñas...</p>
      </div>

      <button id="writeReviewBtn" class="btn-secondary" style="margin-top:1rem;">
        Escribir reseña
      </button>
    </div>

    <div class="contact-box">
      <div class="contact-label">Contacto</div>
      ${email ? `<p><strong>${email}</strong></p>` : `<p>Email no disponible.</p>`}
    </div>
  `;

  attachReviewEvents();
}

// =======================================================
// CARGAR RESEÑAS
// =======================================================
async function loadReviews(workerId) {
  const container = document.getElementById("reviewsContainer");

  const q = query(
    collection(db, "reviews"),
    where("workerId", "==", workerId),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = `<p class="worker-placeholder">Aún no hay reseñas.</p>`;
    return;
  }

  let html = "";

  snap.forEach(docSnap => {
    const r = docSnap.data();

    html += `
      <div class="review-card">
        <div class="review-header">
          <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
        </div>
        <p>${r.comment}</p>
        <small>Reseña verificada</small>
      </div>
    `;
  });

  container.innerHTML = html;
}

// =======================================================
// EVENTOS PARA ABRIR / CERRAR MODAL Y ENVIAR RESEÑA
// =======================================================
function attachReviewEvents() {
  const writeBtn = document.getElementById("writeReviewBtn");
  const modal = document.getElementById("reviewModal");
  const closeBtn = document.getElementById("closeReviewBtn");
  const submitBtn = document.getElementById("submitReviewBtn");

  writeBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  submitBtn.addEventListener("click", async () => {
    const rating = Number(document.getElementById("ratingInput").value);
    const comment = document.getElementById("commentInput").value.trim();

    if (!auth.currentUser) {
      alert("Necesitas iniciar sesión para dejar una reseña.");
      return;
    }

    if (!comment) {
      alert("Escribe un comentario.");
      return;
    }

    await addDoc(collection(db, "reviews"), {
      userId: auth.currentUser.uid,
      workerId,
      rating,
      comment,
      timestamp: serverTimestamp()
    });

    alert("Reseña enviada ✔");

    modal.classList.add("hidden");
    loadReviews(workerId);
  });
}
