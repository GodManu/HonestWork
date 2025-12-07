// js/worker.js
import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const workerContent = document.getElementById("workerContent");
const params = new URLSearchParams(window.location.search);
const workerId = params.get("id");

// =====================================
// CARGAR PERFIL
// =====================================

if (!workerId) {
  workerContent.innerHTML = "<p>No se especificó trabajador.</p>";
} else {
  loadWorker(workerId);
}

async function loadWorker(id) {
  const snap = await getDoc(doc(db, "users", id));

  if (!snap.exists()) {
    workerContent.innerHTML = "<p>Este perfil no existe.</p>";
    return;
  }

  renderWorker(snap.data());

  setTimeout(() => {
    loadReviews(id);
    loadRatingSummary(id);
  }, 150);
}

// =====================================
// MOSTRAR PERFIL COMPLETO
// =====================================

function renderWorker(data) {
  const name = data.name || "Sin nombre";
  const oficio = data.oficio || "Oficio no especificado";
  const descripcion = data.descripcion || "Este trabajador aún no agregó descripción.";
  const email = data.email || "No disponible";
  const photoURL = data.photoURL || "";
  const initial = name[0] || "?";

  const services = Array.isArray(data.services) ? data.services : [];

  const servicesHTML = services.length
    ? `
      <ul style="list-style:none;padding:0;">
        ${services.map(s => `
          <li style="
            padding:.4rem 0;
            border-bottom:1px solid #e5e7eb;
            display:flex;
            justify-content:space-between;">
            <span>${s.name}</span>
            <b>$${s.price} MXN</b>
          </li>
        `).join("")}
      </ul>`
    : `<p class="worker-placeholder">Aún no hay servicios agregados.</p>`;

  workerContent.innerHTML = `
    <div class="worker-top">
      <div class="worker-avatar-big">
        ${photoURL ? `<img src="${photoURL}">` : initial}
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
      <div class="worker-section-title">Contacto</div>
      <p><b>Correo:</b> ${email}</p>
      <p class="worker-placeholder">Próximamente WhatsApp directo.</p>
    </div>
  `;
}

// =====================================
// PROMEDIO DE CALIFICACIÓN
// =====================================

async function loadRatingSummary(workerId) {
  const box = document.getElementById("ratingSummary");

  const q = query(
    collection(db, "reviews"),
    where("workerId", "==", workerId)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    box.textContent = "Aún no hay reseñas.";
    return;
  }

  let total = 0;
  const count = snap.docs.length;

  snap.forEach(d => total += d.data().rating);

  const avg = (total / count).toFixed(1);

  box.innerHTML = `
    ⭐ <span style="font-size:1.2rem;">${avg}</span>
    <span style="color:#4b5563;"> · ${count} reseña${count === 1 ? "" : "s"}</span>
  `;
}

// =====================================
// FORMATO FECHA
// =====================================

function formatDate(ts) {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// =====================================
// CARGAR RESEÑAS
// =====================================

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

  for (const d of snap.docs) {
    const r = d.data();

    let userName = "Usuario verificado";
    let userPhoto = "";
    let userInitial = "?";

    try {
      const uSnap = await getDoc(doc(db, "users", r.userId));
      if (uSnap.exists()) {
        const u = uSnap.data();
        userName = u.name || userName;
        userPhoto = u.photoURL || "";
        userInitial = u.name?.[0] || "?";
      }
    } catch {}

    html += `
      <div class="review-card">
        <div class="review-user">
          <div class="review-avatar">
            ${userPhoto ? `<img src="${userPhoto}">` : userInitial}
          </div>
          <div>
            <strong>${userName}</strong>
            <div class="review-date">${formatDate(r.timestamp)}</div>
          </div>
        </div>

        <div class="review-stars">
          ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
        </div>

        <p class="review-comment">${r.comment}</p>
      </div>
    `;
  }

  container.innerHTML = html;
}

// =====================================
// MODAL RESEÑA
// =====================================

document.getElementById("writeReviewBtn").onclick = () =>
  document.getElementById("reviewModal").classList.remove("hidden");

document.getElementById("closeReviewBtn").onclick = () =>
  document.getElementById("reviewModal").classList.add("hidden");

document.getElementById("submitReviewBtn").onclick = async () => {

  if (!auth.currentUser) {
    alert("Debes iniciar sesión para reseñar.");
    return;
  }

  const rating = Number(document.getElementById("ratingInput").value);
  const comment = document.getElementById("commentInput").value.trim();

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

  document.getElementById("reviewModal").classList.add("hidden");

  loadReviews(workerId);
  loadRatingSummary(workerId);
};
