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

let services = [];

// ====================================================
// CARGAR DATOS DEL USUARIO AL ABRIR EL PERFIL
// ====================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) {
    alert("Tu perfil no existe en Firestore.");
    return;
  }

  const data = snap.data();

  // Mostrar datos
  document.getElementById("profileName").textContent = data.name;
  document.getElementById("profileEmail").textContent = data.email;

  // Foto
  if (data.photoURL) {
    document.getElementById("profilePicPreview").innerHTML = `<img src="${data.photoURL}">`;
  } else {
    document.getElementById("profilePicPreview").textContent = data.name?.[0] ?? "?";
  }

  // Inputs normales
  document.getElementById("oficioInput").value = data.oficio || "";
  document.getElementById("descInput").value = data.descripcion || "";
  document.getElementById("phoneInput").value = data.phone || "";      // 🔥 IMPORTANTE
  document.getElementById("cityInput").value = data.city || "";
  document.getElementById("categoryInput").value = data.category || "";
  document.getElementById("isWorkerInput").checked = data.isWorker === true;

  // Servicios
  services = Array.isArray(data.services) ? data.services : [];
  renderServices();
});

// ====================================================
// MOSTRAR SERVICIOS
// ====================================================
function renderServices() {
  const box = document.getElementById("servicesList");

  if (!services.length) {
    box.innerHTML = `<p style="font-size:0.85rem; color:#9ca3af;">Aún no has agregado servicios.</p>`;
    return;
  }

  box.innerHTML = services
    .map(
      (s, i) => `
      <div style="display:flex; justify-content:space-between; padding:.3rem 0; border-bottom:1px solid #eee;">
        <div>
          <strong>${s.name}</strong>
          <div style="color:#666; font-size:.85rem;">$${s.price} MXN</div>
        </div>
        <button class="removeServiceBtn" data-index="${i}" style="color:red; background:none; border:none;">Eliminar</button>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".removeServiceBtn").forEach((btn) =>
    btn.addEventListener("click", () => {
      services.splice(btn.dataset.index, 1);
      renderServices();
    })
  );
}

// ====================================================
// AGREGAR SERVICIO
// ====================================================
document.getElementById("addServiceBtn").addEventListener("click", () => {
  const name = document.getElementById("serviceNameInput").value.trim();
  const price = Number(document.getElementById("servicePriceInput").value.trim());

  if (!name || !price) return alert("Escribe servicio y precio válido.");

  services.push({ name, price });

  document.getElementById("serviceNameInput").value = "";
  document.getElementById("servicePriceInput").value = "";

  renderServices();
});

// ====================================================
// GUARDAR PERFIL (AQUÍ SE GUARDA WHATSAPP)
// ====================================================
document.getElementById("saveProfileBtn").onclick = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión");

  const phone = document.getElementById("phoneInput").value.trim();
  const oficio = document.getElementById("oficioInput").value.trim();
  const desc = document.getElementById("descInput").value.trim();
  const city = document.getElementById("cityInput").value.trim();
  const category = document.getElementById("categoryInput").value;
  const isWorker = document.getElementById("isWorkerInput").checked;

  await updateDoc(doc(db, "users", user.uid), {
    phone,
    oficio,
    descripcion: desc,
    city,
    category,
    isWorker
  });

  alert("Perfil actualizado correctamente ✔");
};


// ====================================================
// SUBIR FOTO DE PERFIL
// ====================================================
document.getElementById("profilePicInput").addEventListener("change", async (e) => {
  const user = auth.currentUser;
  const file = e.target.files[0];
  if (!file) return;

  const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  await updateProfile(user, { photoURL: url });
  await updateDoc(doc(db, "users", user.uid), { photoURL: url });

  document.getElementById("profilePicPreview").innerHTML = `<img src="${url}">`;

  alert("Foto actualizada ✔");
});

// ====================================================
// CERRAR SESIÓN
// ====================================================
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
  window.location.href = "index.html";
});
