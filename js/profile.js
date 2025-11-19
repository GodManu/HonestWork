// js/profile.js
import { auth, db, storage } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// —————————————————————————————
// 1. DETECTAR AL USUARIO LOGEADO
// —————————————————————————————
let services = [];
let currentUserId = null;

function renderServices() {
  const container = document.getElementById("servicesList");
  if (!container) return;

  if (!services.length) {
    container.innerHTML = `
      <p style="font-size:0.85rem; color:#9ca3af; margin:0;">
        Aún no has agregado servicios.
      </p>
    `;
    return;
  }

  const itemsHtml = services.map((svc, index) => `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:0.4rem 0.2rem;
      border-bottom:1px solid #e5e7eb;
      font-size:0.9rem;
    ">
      <div>
        <div style="font-weight:500;">${svc.name}</div>
        <div style="font-size:0.8rem; color:#6b7280;">Aprox. $${svc.price} MXN</div>
      </div>
      <button 
        type="button" 
        data-index="${index}" 
        class="removeServiceBtn"
        style="border:none; background:none; color:#ef4444; font-size:0.8rem; cursor:pointer;">
        Eliminar
      </button>
    </div>
  `).join("");

  container.innerHTML = itemsHtml;

  // listeners para eliminar
  container.querySelectorAll(".removeServiceBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index, 10);
      services.splice(idx, 1);
      renderServices();
    });
  });
}

const addServiceBtn = document.getElementById("addServiceBtn");
if (addServiceBtn) {
  addServiceBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("serviceNameInput");
    const priceInput = document.getElementById("servicePriceInput");

    const name = nameInput.value.trim();
    const priceValue = priceInput.value.trim();

    if (!name || !priceValue) {
      alert("Escribe el nombre del servicio y un precio aproximado.");
      return;
    }

    const price = Number(priceValue);
    if (isNaN(price) || price < 0) {
      alert("El precio debe ser un número válido.");
      return;
    }

    services.push({
      name,
      price
    });

    nameInput.value = "";
    priceInput.value = "";
    renderServices();
  });
}


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId = user.uid;
  const userDoc = await getDoc(doc(db, "users", userId));

  if (!userDoc.exists()) {
    alert("Tu perfil no existe en Firestore.");
    return;
  }

  const data = userDoc.data();

  // Mostrar datos en pantalla
  document.getElementById("profileName").textContent = data.name;
  document.getElementById("profileEmail").textContent = data.email;
  
  // Foto de perfil
  const profilePic = document.getElementById("profilePicPreview");
  if (data.photoURL) {
    profilePic.innerHTML = `<img src="${data.photoURL}" alt="Foto de perfil">`;
  } else {
    profilePic.textContent = data.name?.[0] ?? "?";
  }

  // Rellenar campos
  document.getElementById("oficioInput").value = data.oficio || "";
  document.getElementById("descInput").value = data.descripcion || "";
  document.getElementById("isWorkerInput").checked = data.isWorker === true;
});

cargar servicios
  services = Array.isArray(data.services) ? data.services : [];
  renderServices();
// —————————————————————————————
// 2. GUARDAR CAMBIOS
// —————————————————————————————

document.getElementById("saveProfileBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const oficio = document.getElementById("oficioInput").value.trim();
  const descripcion = document.getElementById("descInput").value.trim();
  const isWorker = document.getElementById("isWorkerInput").checked;

  try {
    await updateDoc(doc(db, "users", user.uid), {
      oficio: oficio,
      descripcion: descripcion,
      isWorker: isWorker,
      services: services
    });

    alert("Perfil actualizado correctamente ✔");
  } catch (error) {
    alert("Error al guardar: " + error.message);
  }
});



// —————————————————————————————
// 3. SUBIR FOTO DE PERFIL
// —————————————————————————————

document.getElementById("profilePicInput").addEventListener("change", async (event) => {
  const user = auth.currentUser;
  const file = event.target.files[0];

  if (!file) return;

  try {
    const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);

    // Guardar en Firebase Auth + Firestore
    await updateProfile(user, { photoURL: downloadURL });
    await updateDoc(doc(db, "users", user.uid), { photoURL: downloadURL });

    document.getElementById("profilePicPreview").innerHTML = `<img src="${downloadURL}">`;

    alert("Foto de perfil actualizada ✔");

  } catch (error) {
    alert("Error subiendo la foto: " + error.message);
  }
});

// —————————————————————————————
// 4. CERRAR SESIÓN
// —————————————————————————————

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});
