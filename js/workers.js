// js/workers.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const workersList = document.getElementById("workersList");

// === LEER PARAMETROS DE BÚSQUEDA ===
const params = new URLSearchParams(window.location.search);
const textFilter = params.get("q")?.toLowerCase() || "";
const cityFilter = params.get("city")?.toLowerCase() || "";
const categoryFilter = params.get("cat")?.toLowerCase() || "";

// ===================================

async function loadWorkers() {
  try {
    // Traemos SOLO los que marcaron isWorker = true
    const q = query(
  collection(db, "reviews"),
  where("workerId", "==", workerId),
  orderBy("timestamp", "desc")
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
      const oficio = (data.oficio || "").toLowerCase();
      const descripcion = (data.descripcion || "").toLowerCase();
      const city = (data.city || "").toLowerCase();
      const category = (data.category || "").toLowerCase();


      // ===============================
      //        FILTROS DE BÚSQUEDA
      // ===============================

      // FILTRO 1: texto general (oficio + descripción)
      if (textFilter) {
        const matchesText =
          oficio.includes(textFilter) ||
          descripcion.includes(textFilter) ||
          name.toLowerCase().includes(textFilter);

        if (!matchesText) return;
      }

      // FILTRO 2: ciudad
      if (cityFilter && !city.includes(cityFilter)) {
        return;
      }

      // FILTRO 3: categoría
      if (categoryFilter && !category.includes(categoryFilter)) {
        return;
      }

      // ===============================

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
            <p class="worker-oficio">${data.oficio || "Oficio no especificado"}</p>
          </div>
        </div>

        <p class="worker-desc">${data.descripcion || ""}</p>
        <p class="worker-city"><b>Ciudad:</b> ${data.city || "No especificada"}</p>
        <p class="worker-cat"><b>Categoría:</b> ${data.category || "No especificada"}</p>


        <p class="worker-tags">
          <a href="worker.html?id=${docSnap.id}" style="text-decoration:none; color:#2563eb; font-weight:600;">
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

// Ejecutar al cargar
loadWorkers();
