// js/firebase-config.js
// ————————————————
// Importar módulos desde Firebase CDN (versión recomendada)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ————————————————
// TU CONFIGURACIÓN REAL DE HONESTWORK
const firebaseConfig = {
  apiKey: "AIzaSyDX3QjLJgxBPrfxP2zuGXHCF_v5q423T5U",
  authDomain: "honestwork-d4fc1.firebaseapp.com",
  projectId: "honestwork-d4fc1",
  storageBucket: "honestwork-d4fc1.firebasestorage.app",
  messagingSenderId: "333342987792",
  appId: "1:333342987792:web:97df043c18f7249b5edc95",
  measurementId: "G-P5WCQ142TH"
};

// ————————————————
// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Analytics (opcional, pero lo dejo por si lo usas)
export const analytics = getAnalytics(app);

// Inicializar módulos que usaremos en todo HonestWork
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

