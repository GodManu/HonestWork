// js/workers.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const workersList = document.getElementById("workersList");

// Parámetros de búsqueda
const params = new URLSearchParams(window.location.search);
const textFilter = params.get("q")?.toLowerCase() || "";
const cityFilter = params.get("city")?.toLowerCase() || "";
const categoryFilter = params.get("cat")?.toLowerCase() || "";

// ==========================================
// CARGAR TRABAJADORES
// ==========================================
async function loadWorkers() {
  try {
    const q = query(
      collection(db, "users"),
      where("isWorker", "==", true)
    );

    const querySnapshot = await getDocs(q);

    workersList.innerHTML = "";

    if (querySnapshot.empty) {
      workersList.innerHTML = "<p>No hay trabajadores activos todavía.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const name = data.name || "Sin nombre";
      const oficio = (data.oficio || "").toLowerCase();
      const descripcion = (data.descripcion || "").toLowerCase();
      const city = (data.city || "").toLowerCase();
      const category = (data.category || "").toLowerCase();

      // -----------------------------
      // FILTROS
      // -----------------------------
      if (textFilter) {
        const matches =
          oficio.includes(textFilter) ||
          descripcion.includes(textFilter) ||
          name.toLowerCase().includes(textFilter);

        if (!matches) return;
      }

      if (cityFilter && !city.includes(cityFilter)) return;
      if (categoryFilter && !category.includes(categoryFilter)) return;

      const photoURL = data.photoURL || "";
      const initial = name.trim()[0] || "?";

      const card = document.createElement("div");
      card.className = "worker-card";

      card.innerHTML = `
        <div class="worker-header">
          <div class="worker-avatar">
            ${photoURL ? `<img src="${photoURL}">` : initial}
          </div>
          <div>
            <h3>${name}</h3>
            <p class="worker-oficio">${data.oficio || "Oficio no especificado"}</p>
          </div>
        </div>

        <p class="worker-desc">${data.descripcion || ""}</p>
        <p class="worker-city"><b>Ciudad:</b> ${data.city || "No especificada"}</p>
        <p class="worker-cat"><b>Categoría:</b> ${data.category || "No especificada"}</p>

        <p class="worker-tags">
          <a href="worker.html?id=${docSnap.id}" 
             style="text-decoration:none;color:#2563eb;font-weight:600;">
            Ver perfil público →
          </a>
        </p>
      `;

      workersList.appendChild(card);
    });

  } catch (error) {
    workersList.innerHTML = `<p>Error cargando trabajadores: ${error.message}</p>`;
  }
}

loadWorkers();
