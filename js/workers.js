// js/workers.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const workersList = document.getElementById("workersList");

// ==============================
// LEER FILTROS DE LA URL
// ==============================
const params = new URLSearchParams(window.location.search);
const textFilter = params.get("q")?.toLowerCase() || "";
const cityFilter = params.get("city")?.toLowerCase() || "";
const categoryFilter = params.get("cat")?.toLowerCase() || "";

// ==============================
// CARGAR TRABAJADORES
// ==============================
async function loadWorkers() {
  try {
    const q = query(
      collection(db, "users"),
      where("isWorker", "==", true)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      workersList.innerHTML = "<p>No hay trabajadores registrados aún.</p>";
      return;
    }

    workersList.innerHTML = "";

    snap.forEach(docSnap => {
      const data = docSnap.data();

      const name = data.name || "Sin nombre";
      const oficio = (data.oficio || "").toLowerCase();
      const desc = (data.descripcion || "").toLowerCase();
      const city = (data.city || "").toLowerCase();
      const category = (data.category || "").toLowerCase();
      const photoURL = data.photoURL || "";
      const initial = name[0] || "?";

      // ==========================
      // APLICAR FILTROS
      // ==========================

      // filtro de texto
      if (textFilter) {
        const match =
          name.toLowerCase().includes(textFilter) ||
          oficio.includes(textFilter) ||
          desc.includes(textFilter);
        if (!match) return;
      }

      // filtro ciudad
      if (cityFilter && !city.includes(cityFilter)) return;

      // filtro categoría
      if (categoryFilter && !category.includes(categoryFilter)) return;

      // ==========================
      // CREAR TARJETA DE TRABAJADOR
      // ==========================

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

        <a href="worker.html?id=${docSnap.id}" 
           class="btn-primary"
           style="margin-top:0.6rem; display:inline-block;">
          Ver perfil →
        </a>
      `;

      workersList.appendChild(card);
    });

  } catch (err) {
    workersList.innerHTML = `<p>Error al cargar trabajadores: ${err.message}</p>`;
  }
}

loadWorkers();
