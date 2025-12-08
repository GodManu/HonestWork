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

  // Verificación de identificación
  const idStatusText = document.getElementById("idStatusText");
  if (data.idStatus === "approved") {
    idStatusText.textContent = "✔ Identidad verificada";
  } else if (data.idStatus === "pending") {
    idStatusText.textContent = "⏳ Verificación en proceso";
  } else {
    idStatusText.textContent = "📄 Aún no has enviado tu identificación.";
  }

  // Foto
  const preview = document.getElementById("profilePicPreview");
  if (data.photoURL) {
    preview.innerHTML = `<img src="${data.photoURL}">`;
  } else {
    preview.textContent = data.name?.[0] ?? "?";
  }

  // Inputs
  document.getElementById("oficioInput").value = data.oficio || "";
  document.getElementById("descInput").value = data.descripcion || "";
  document.getElementById("phoneInput").value = data.phone || "";
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
  const list = document.getElementById("servicesList");

  if (!services.length) {
    list.innerHTML = `
      <p style="font-size:0.85rem; color:#9ca3af;">Aún no has agregado servicios.</p>
    `;
    return;
  }

  list.innerHTML = services
    .map(
      (s, i) => `
      <div style="display:flex; justify-content:space-between; padding:.4rem 0;
                  border-bottom:1px solid #ddd;">
        <div>
          <strong>${s.name}</strong>
          <div style="color:#666; font-size:.85rem;">$${s.price} MXN</div>
        </div>
        <button class="removeServiceBtn" data-index="${i}" 
                style="color:red; background:none; border:none;">Eliminar</button>
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

  if (!name || !price) {
    alert("Escribe servicio y precio válido.");
    return;
  }

  services.push({ name, price });

  document.getElementById("serviceNameInput").value = "";
  document.getElementById("servicePriceInput").value = "";

  renderServices();
});

// ====================================================
// GUARDAR PERFIL
// ====================================================
document.getElementById("saveProfileBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const oficio = document.getElementById("oficioInput").value.trim();
  const desc = document.getElementById("descInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const city = document.getElementById("cityInput").value.trim();
  const category = document.getElementById("categoryInput").value;
  const isWorker = document.getElementById("isWorkerInput").checked;

  await updateDoc(doc(db, "users", user.uid), {
    oficio,
    descripcion: desc,
    phone,
    city,
    category,
    isWorker,
    services
  });

  alert("Perfil actualizado ✔");
});

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
// SUBIR IDENTIFICACIÓN
// ====================================================
document.getElementById("uploadIdBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  const file = document.getElementById("idUploadInput").files[0];
  if (!file) return alert("Selecciona una foto de tu identificación.");

  const idRef = ref(storage, `ids/${user.uid}.jpg`);
  await uploadBytes(idRef, file);
  const url = await getDownloadURL(idRef);

  await updateDoc(doc(db, "users", user.uid), {
    idURL: url,
    idStatus: "pending",
    idUploadedAt: new Date()
  });

  document.getElementById("idStatusText").textContent =
    "⏳ Verificación en proceso";

  alert("Identificación enviada ✔");
});

// ====================================================
// CERRAR SESIÓN
// ====================================================
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
  window.location.href = "index.html";
});
