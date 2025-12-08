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


// =======================================================
// SUBIR IDENTIFICACIÓN OFICIAL → /ids/USERID/id.jpg
// =======================================================
document.getElementById("uploadIdBtn").addEventListener("click", async () => {
  const file = document.getElementById("idUploadInput").files[0];
  if (!file) return alert("Selecciona una foto de tu identificación.");

  const user = auth.currentUser;
  if (!user) return;

  try {
    const storageRef = ref(storage, `ids/${user.uid}/id.jpg`);
    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "users", user.uid), {
      idURL: downloadURL,
      idStatus: "pending",
      idUploadedAt: new Date()
    });

    document.getElementById("idStatusText").innerHTML =
      "📄 Identificación enviada. Estado: <b>Pendiente de aprobación</b>";

    alert("Identificación subida correctamente ✔");
  } catch (error) {
    alert("Error subiendo identificación: " + error.message);
  }
});


// =======================================================
// VARIABLES
// =======================================================
let services = [];


// =======================================================
// CARGAR DATOS DE PERFIL AL ENTRAR
// =======================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return alert("Error: No existe tu perfil.");

  const data = snap.data();

  // Mostrar nombre, email
  document.getElementById("profileName").textContent = data.name;
  document.getElementById("profileEmail").textContent = data.email;

  // Estado de verificación
  document.getElementById("idStatusText").innerHTML =
    data.idStatus === "approved"
      ? "✔ Identidad verificada"
      : data.idStatus === "pending"
      ? "⏳ Verificación en proceso"
      : "📄 Aún no has enviado tu identificación.";

  // Foto de perfil
  if (data.photoURL) {
    document.getElementById("profilePicPreview").innerHTML = `<img src="${data.photoURL}">`;
  } else {
    document.getElementById("profilePicPreview").textContent = data.name?.[0] ?? "?";
  }

  // Rellenar inputs
  document.getElementById("oficioInput").value = data.oficio || "";
  document.getElementById("descInput").value = data.descripcion || "";
  document.getElementById("phoneInput").value = data.phone || "";
  document.getElementById("cityInput").value = data.city || "";
  document.getElementById("categoryInput").value = data.category || "";
  document.getElementById("isWorkerInput").checked = data.isWorker === true;

  // Cargar servicios
  services = Array.isArray(data.services) ? data.services : [];
  renderServices();
});


// =======================================================
// MOSTRAR SERVICIOS
// =======================================================
function renderServices() {
  const box = document.getElementById("servicesList");

  if (!services.length) {
    box.innerHTML = `<p style="color:#9ca3af;">Aún no has agregado servicios.</p>`;
    return;
  }

  box.innerHTML = services
    .map(
      (s, i) => `
      <div style="display:flex; justify-content:space-between; padding:.3rem 0; border-bottom:1px solid #eee;">
        <div>
          <strong>${s.name}</strong>
          <div style="color:#666;font-size:.85rem;">$${s.price} MXN</div>
        </div>
        <button class="removeServiceBtn" data-index="${i}" style="color:red;background:none;border:none;">
          Eliminar
        </button>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".removeServiceBtn").forEach(btn =>
    btn.addEventListener("click", () => {
      services.splice(btn.dataset.index, 1);
      renderServices();
    })
  );
}


// =======================================================
// AGREGAR SERVICIO
// =======================================================
document.getElementById("addServiceBtn").addEventListener("click", () => {
  const name = document.getElementById("serviceNameInput").value.trim();
  const price = Number(document.getElementById("servicePriceInput").value.trim());

  if (!name || !price) return alert("Escribe servicio y precio válido.");

  services.push({ name, price });

  document.getElementById("serviceNameInput").value = "";
  document.getElementById("servicePriceInput").value = "";

  renderServices();
});


// =======================================================
// GUARDAR PERFIL
// =======================================================
document.getElementById("saveProfileBtn").onclick = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión");

  await updateDoc(doc(db, "users", user.uid), {
    oficio: document.getElementById("oficioInput").value.trim(),
    descripcion: document.getElementById("descInput").value.trim(),
    phone: document.getElementById("phoneInput").value.trim(),
    city: document.getElementById("cityInput").value.trim(),
    category: document.getElementById("categoryInput").value,
    isWorker: document.getElementById("isWorkerInput").checked,
    services
  });

  alert("Perfil actualizado ✔");
};


// =======================================================
// SUBIR FOTO DE PERFIL → /profilePictures/USERID/profile.jpg
// =======================================================
document.getElementById("profilePicInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  const storageRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await updateProfile(user, { photoURL: url });
  await updateDoc(doc(db, "users", user.uid), { photoURL: url });

  document.getElementById("profilePicPreview").innerHTML = `<img src="${url}">`;

  alert("Foto actualizada ✔");
});


// =======================================================
// CERRAR SESIÓN
// =======================================================
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
  window.location.href = "index.html";
});
