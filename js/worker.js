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
const workerId = new URLSearchParams(window.location.search).get("id");

// ================================
// CARGAR PERFIL
// ================================
if (!workerId) workerContent.innerHTML = "No se especificó trabajador.";
else loadWorker(workerId);

async function loadWorker(id) {
  const snap = await getDoc(doc(db, "users", id));

  if (!snap.exists()) {
    workerContent.innerHTML = "Este trabajador no existe.";
    return;
  }

  renderProfile(snap.data());

  // cargar reseñas y promedio
  setTimeout(() => {
    loadReviews(id);
    loadRatingSummary(id);
  }, 150);
}

// ================================
// RENDER DEL PERFIL COMPLETO
// ================================
function renderProfile(data) {
  const name = data.name || "Sin nombre";
  const oficio = data.oficio || "Oficio no especificado";
  const descripcion = data.descripcion || "Este trabajador no agregó descripción.";
  const email = data.email || "No disponible";
  const photoURL = data.photoURL || "";
  const initial = name[0] || "?";

  const services = Array.isArray(data.services) ? data.services : [];

  const servicesHTML = services.length
    ? `
      <ul style="list-style:none;padding:0;">
        ${services
          .map(
            (s) => `
            <li style="
              padding:0.4rem 0;
              border-bottom:1px solid #e5e7eb;
              display:flex; justify-content:space-between;">
              <span>${s.name}</span>
              <b>$${s.price} MXN</b>
            </li>`
          )
          .join("")}
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
      <div class="worker-section-title">Servicios y precios</div>
      ${servicesHTML}
    </div>

    <div class="worker-section">
      <div class="worker-section-title">Contacto</div>
      <p><b>Correo:</b> ${email}</p>
    </div>
  `;
}

// ================================
// CARGAR PROMEDIO DE RESEÑAS
// ================================
async function loadRatingSummary(workerId) {
  const box = document.getElementById("ratingSummary");

  const q = query(collection(db, "reviews"), where("workerId", "==", workerId));
  const snap = await getDocs(q);

  if (snap.empty) {
    box.textContent = "Aún no hay reseñas.";
    return;
  }

  let total = 0;
  const count = snap.docs.length;

  snap.forEach((d) => (total += d.data().rating));

  const avg = (total / count).toFixed(1);

  box.innerHTML = `⭐ <span style="font-size:1.2rem;">${avg}</span> · ${count} reseña${
    count === 1 ? "" : "s"
  }`;
}

// ================================
// FORMATEAR FECHA
// ================================
function formatDate(ts) {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// ================================
// CARGAR RESEÑAS
// ================================
async function loadReviews(workerId) {
  const box = document.getElementById("reviewsContainer");

  const q = query(
    collection(db, "reviews"),
    where("workerId", "==", workerId),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    box.innerHTML = `<p class="worker-placeholder">Aún no hay reseñas.</p>`;
    return;
  }

  let html = "";

  for (const d of snap.docs) {
    const r = d.data();

    // obtener info del usuario que dejó la reseña
    let name = "Usuario verificado";
    let photo = "";
    let initial = "?";

    try {
      const userSnap = await getDoc(doc(db, "users", r.userId));
      if (userSnap.exists()) {
        const u = userSnap.data();
        name = u.name || name;
        photo = u.photoURL || "";
        initial = u.name?.[0] || "?";
      }
    } catch {}

    html += `
      <div class="review-card">
        <div class="review-user">
          <div class="review-avatar">${photo ? `<img src="${photo}">` : initial}</div>
          <div>
            <strong>${name}</strong>
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

  box.innerHTML = html;
}

// ================================
// MODAL PARA ESCRIBIR RESEÑA
// ================================
document.getElementById("writeReviewBtn").onclick = () =>
  document.getElementById("reviewModal").classList.remove("hidden");

document.getElementById("closeReviewBtn").onclick = () =>
  document.getElementById("reviewModal").classList.add("hidden");

document.getElementById("submitReviewBtn").onclick = async () => {
  if (!auth.currentUser) {
    alert("Debes iniciar sesión.");
    return;
  }

  const rating = Number(document.getElementById("ratingInput").value);
  const comment = document.getElementById("commentInput").value.trim();

  if (!comment) return alert("Escribe un comentario.");

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
