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
});

// —————————————————————————————
// 2. GUARDAR CAMBIOS
// —————————————————————————————

document.getElementById("saveProfileBtn").addEventListener("click", async () => {
  const user = auth.currentUser;

  const oficio = document.getElementById("oficioInput").value.trim();
  const descripcion = document.getElementById("descInput").value.trim();

  try {
    await updateDoc(doc(db, "users", user.uid), {
      oficio: oficio,
      descripcion: descripcion,
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
