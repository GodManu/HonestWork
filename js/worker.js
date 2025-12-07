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

if (!workerId) {
  workerContent.innerHTML = "<p>No se especificó trabajador.</p>";
} else {
  loadWorker(workerId);
}

async function loadWorker(id) {
  const snap = await getDoc(doc(db, "users", id));

  if (!snap.exists()) {
    workerContent.innerHTML = "<p>El perfil no existe.</p>";
    return;
  }

  renderWorker(snap.data());

  setTimeout(() => {
  loadReviews(id);
  loadRatingSummary(id);
}, 100);
}
async function loadRatingSummary(workerId) {
  const ratingBox = document.getElementById("ratingSummary");

  const q = query(
    collection(db, "reviews"),
    where("workerId", "==", workerId)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    ratingBox.textContent = "Aún no hay reseñas.";
    return;
  }

  let total = 0;
  let count = snap.docs.length;

  snap.forEach(doc => {
    total += doc.data().rating;
  });

  const average = (total / count).toFixed(1);

  ratingBox.innerHTML = `
    ⭐ <span style="font-size:1.2rem;">${average}</span> 
    <span style="color:#4b5563;"> · ${count} reseña${count === 1 ? "" : "s"}</span>
  `;
}

function renderWorker(data) {
  const name = data.name || "Sin nombre";
  const oficio = data.oficio || "Oficio no especificado";
  const descripcion = data.descripcion || "";
  const photoURL = data.photoURL || "";
  const initial = name[0] || "?";

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
  `;
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  return timestamp.toDate().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

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
      const userSnap = await getDoc(doc(db, "users", r.userId));
      if (userSnap.exists()) {
        userName = userSnap.data().name || "Usuario verificado";
        userPhoto = userSnap.data().photoURL || "";
        userInitial = (userSnap.data().name?.[0] || "?");
      }
    } catch (e) {}

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
