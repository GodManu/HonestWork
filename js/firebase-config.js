// js/firebase-config.js

// Importamos SDK desde CDN en las páginas que lo usen (login, register, etc.)
// Aquí sólo dejamos la config como objeto.

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicialización básica (para usar en otras partes)
if (typeof firebase !== "undefined" && firebase.apps?.length === 0) {
  firebase.initializeApp(firebaseConfig);
}
