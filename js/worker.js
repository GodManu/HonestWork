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
  workerContent.innerHTML = "<p>No se especificó trabajador.</p>";
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
      workerContent.innerHTML = "<p>El perfil no existe.</p>";
      return;
    }

    renderWorker(snap.data());

// Esperar a que el DOM ya tenga renderizado reviewsContainer
setTimeout(() => {
  loadReviews(id);
}, 80);

  } catch (error) {
    workerContent.innerHTML = `<p>Error cargando perfil: ${error.message}</p>`;
  }
}

// =======================================================
// MOSTRAR PERFIL
// =======================================================
function renderWorker(data) {
  const name = data.name || "Sin nombre";
  const oficio = data.oficio || "Oficio no especificado";
  const descripcion = data.descripcion || "Este trabajador aún no agregó descripción";
  const photoURL = data.photoURL || "";
  const initial = name.trim()[0] || "?";

  // Servicios
  const services = Array.isArray(data.services) ? data.services : [];

  const servicesHTML = services.length
    ? `
      <ul style="list-style:none;padding:0;">
        ${services.map(s => `
          <li style="padding:.4rem 0;border-bottom:1px solid #e5e7eb;
                     display:flex;justify-content:space-between;">
            <span>${s.name}</span>
            <span><b>$${s.price} MXN</b></span>
          </li>
        `).join("")}
      </ul>
    `
    : `<p class="worker-placeholder">Aún no hay servicios.</p>`;

  workerContent.innerHTML = `
    <div class="worker-top">
      <div class="worker-avatar-big">
        ${photoURL ? `<img src="${photoURL}">` : initial}
      </div>
      <div>
        <h1>${name}</h1>
        <p>${oficio}</p>
      </div>
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Sobre mí</div>
      <p>${descripcion}</p>
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Servicios</div>
      ${servicesHTML}
    </div>
  `;

  attachModalEvents();
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
  snap.forEach(doc => {
    const r = doc.data();

    html += `
      <div class="review-card">
        <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
        <p>${r.comment}</p>
        <small>Reseña verificada</small>
      </div>
    `;
  });

  container.innerHTML = html;
}

// =======================================================
// EVENTOS DEL MODAL
// =======================================================
function attachModalEvents() {
  const modal = document.getElementById("reviewModal");

  document.getElementById("writeReviewBtn").onclick = () => {
    modal.classList.remove("hidden");
  };

  document.getElementById("closeReviewBtn").onclick = () => {
    modal.classList.add("hidden");
  };

  document.getElementById("submitReviewBtn").onclick = async () => {
    const rating = Number(document.getElementById("ratingInput").value);
    const comment = document.getElementById("commentInput").value.trim();

    if (!auth.currentUser) {
      alert("Debes iniciar sesión");
      return;
    }

    if (!comment) {
      alert("El comentario no puede ir vacío");
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
  };
}
