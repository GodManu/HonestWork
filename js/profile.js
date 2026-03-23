import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

    const statusBanner = document.getElementById('verificationStatus');
    const logoutBtn = document.getElementById('logoutBtn');

    // 1. ESCUCHAR SI HAY UN USUARIO LOGUEADO
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuario detectado:", user.uid);
            
            // 2. ESCUCHAR CAMBIOS EN TIEMPO REAL (onSnapshot)
            const userRef = doc(db, "users", user.uid);
            
            onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const status = userData.idStatus; 
                    
                    console.log(">>> Datos actualizados desde Firestore:", userData);
                    console.log(">>> Estatus actual detectado:", status);

                    // Llenamos la interfaz
                    document.getElementById('userName').innerText = userData.name || "Sin nombre";
                    document.getElementById('userJob').innerText = userData.job || "Oficio no definido";
                    document.getElementById('userPhoto').src = userData.profilePhoto || "https://via.placeholder.com/150";
                    document.getElementById('userRating').innerText = userData.rating || "0.0";
                    document.getElementById('userReviewsCount').innerText = userData.reviewsCount || "0";

                    // 3. LÓGICA DEL BANNER (Limpiamos clases antes de asignar la nueva)
                    statusBanner.className = 'status-banner'; // Reset de clases base

                    if (status === "verificado") {
                        console.log("¡Cambiando banner a VERDE!");
                        statusBanner.classList.add('status-verified');
                        statusBanner.innerHTML = '✔️ Perfil Verificado. ¡Ya eres visible en el directorio!';
                    } else if (status === "rechazado") {
                        console.log("¡Cambiando banner a ROJO!");
                        statusBanner.style.background = "#f8d7da";
                        statusBanner.style.color = "#721c24";
                        statusBanner.innerHTML = '❌ Tu identificación fue rechazada. Contacta a soporte.';
                    } else {
                        console.log("Cambiando banner a AMARILLO (Pendiente)...");
                        statusBanner.classList.add('status-pending');
                        statusBanner.innerHTML = '⏳ Identificación en revisión. No eres visible al público todavía.';
                    }
                } else {
                    console.log("Error: El documento del usuario no existe en Firestore.");
                }
            });

        } else {
            window.location.href = 'login.html';
        }
    });

    // 4. CERRAR SESIÓN
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login.html';
            });
        });
    }
});
