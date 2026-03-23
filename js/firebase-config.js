// js/firebase-config.js

// 1. Importar módulos desde Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 2. Tu configuración real de HonestWork
const firebaseConfig = {
  apiKey: "AIzaSyDX3QjLJgxBPrfxP2zuGXHCF_v5q423T5U",
  authDomain: "honestwork-d4fc1.firebaseapp.com",
  projectId: "honestwork-d4fc1",
  storageBucket: "honestwork-d4fc1.firebasestorage.app",
  messagingSenderId: "333342987792",
  appId: "1:333342987792:web:97df043c18f7249b5edc95",
  measurementId: "G-P5WCQ142TH"
};

// 3. Inicializar la App
export const app = initializeApp(firebaseConfig);

// 4. Exportar los servicios para que el resto de la página los use
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
