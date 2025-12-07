// js/worker.js
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const workerContent = document.getElementById("workerContent");

// 1. Leer id de la URL
const params = new URLSearchParams(window.location.search);
const workerId = params.get("id");

if (!workerId) {
  workerContent.innerHTML = "<p>No se especificó ningún trabajador.</p>";
} else {
  loadWorker(workerId);
}

async function loadWorker(id) {
  try {
    const snap = await getDoc(doc(db, "users", id));

    if (!snap.exists()) {
      workerContent.innerHTML = "<p>El perfil de este trabajador no existe o fue eliminado.</p>";
      return;
    }

    const data = snap.data();
    renderWorker(data);
    loadReviews(workerId);
  } catch (error) {
    workerContent.innerHTML = `<p>Error cargando perfil: ${error.message}</p>`;
  }
}

function renderWorker(data) {
  const name = data.name || "Trabajador sin nombre";
  const oficio = data.oficio || "Oficio no especificado";
  const descripcion = data.descripcion || "Este trabajador aún no ha agregado una descripción.";
  const photoURL = data.photoURL || "";
  const email = data.email || "";

  const initial = name.trim()[0] || "?";

  // Servicios del trabajador
  const services = Array.isArray(data.services) ? data.services : [];

  const servicesHTML = services.length
    ? `
      <ul style="list-style:none; padding:0; margin-top:0.5rem;">
        ${services.map(svc => `
          <li style="
            padding:0.4rem 0;
            border-bottom:1px solid #e5e7eb;
            display:flex;
            justify-content:space-between;
            font-size:0.9rem;
          ">
            <span>${svc.name}</span>
            <span style="font-weight:600;">$${svc.price} MXN</span>
          </li>
        `).join("")}
      </ul>
    `
    : `
      <p class="worker-placeholder">
        Este trabajador aún no ha agregado sus servicios y precios.
      </p>
    `;

  // HTML final del perfil público
  workerContent.innerHTML = `
    <div class="worker-top">
      <div class="worker-avatar-big">
        ${photoURL ? `<img src="${photoURL}" alt="Foto de perfil">` : initial}
      </div>
      <div>
        <h1 style="font-size:1.5rem; margin-bottom:0.1rem;">${name}</h1>
        <p class="worker-oficio-big">${oficio}</p>
        <span class="worker-badge">
          <span style="width:7px;height:7px;border-radius:999px;background:#10b981;"></span>
          Trabajador activo en HonestWork
        </span>
      </div>
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Sobre mí</div>
      <p class="worker-description">${descripcion}</p>
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Servicios y precios</div>
      ${servicesHTML}
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Reseñas y recomendaciones</div>
      <p class="worker-placeholder">
        Próximamente: reseñas verificadas de clientes reales, calificación promedio y comentarios.
      </p>
    </div>

    <div class="contact-box">
      <div class="contact-label">Contacto</div>
      ${
        email
          ? `<p>Correo: <strong>${email}</strong></p>`
          : `<p class="worker-placeholder">El trabajador aún no ha configurado datos de contacto.</p>`
      }
      <p class="worker-placeholder">
        Próximamente: botón de contacto directo por WhatsApp y más datos de contacto.
      </p>
    </div>
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
        <div class="review-header">
          <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
        </div>
        <p class="review-comment">${r.comment}</p>
        <p class="review-author">Reseña verificada por usuario</p>
      </div>
    `;
  });

  container.innerHTML = html;
}

