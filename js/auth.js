// js/auth.js
import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  doc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ————————————————
// REGISTRO
const btnRegister = document.getElementById("btnRegister");

if (btnRegister) {
  btnRegister.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
      alert("Llena todos los campos.");
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Guardar nombre en Firebase Auth
      await updateProfile(userCred.user, {
        displayName: name
      });

      // Guardar usuario en Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: name,
        email: email,
        createdAt: new Date(),
        isWorker: false,    // después cambiaremos esto cuando creen perfil profesional
        photoURL: "",
      });

      alert("Cuenta creada con éxito.");
      window.location.href = "index.html";

    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}


// ————————————————
// LOGIN
const btnLogin = document.getElementById("btnLogin");

if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Completa ambos campos.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      alert("Bienvenido!");
      window.location.href = "index.html";

    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}
