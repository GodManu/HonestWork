// js/workers.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const workersList = document.getElementById("workersList");

async function loadWorkers() {
  try {
    // Buscar solo usuarios que marcaron isWorker = true
    const q = query(
      collection(db, "users"),
      where("isWorker", "==", true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      workersList.innerHTML = "<p>No hay trabajadores activos todavía.</p>";
      return;
    }

    workersList.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const name = data.name || "Sin nombre";
      const oficio = data.oficio || "Oficio no especificado";
      const descripcion = data.descripcion || "";
      const photoURL = data.photoURL || "";

      const initial = name.trim()[0] || "?";

      const card = document.createElement("div");
      card.className = "worker-card";

      card.innerHTML = `
        <div class="worker-header">
          <div class="worker-avatar">
            ${photoURL ? `<img src="${photoURL}" alt="Foto">` : initial}
          </div>
          <div>
            <h3>${name}</h3>
            <p class="worker-oficio">${oficio}</p>
          </div>
        </div>
        <p class="worker-desc">${descripcion}</p>
        <p class="worker-tags">Próximamente: ver perfil público, reseñas y más.</p>
      `;

      workersList.appendChild(card);
    });

  } catch (error) {
    workersList.innerHTML = `<p>Error cargando trabajadores: ${error.message}</p>`;
  }
}

// Ejecutar al cargar
loadWorkers();
