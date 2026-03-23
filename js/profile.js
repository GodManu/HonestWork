import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const statusBanner = document.getElementById('verificationStatus');
    const logoutBtn = document.getElementById('logoutBtn');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            
            onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const status = userData.idStatus; 

                    console.log("Datos recibidos:", userData);

                    // Función segura para llenar datos (si el ID no existe, no rompe el código)
                    const fillData = (id, text) => {
                        const el = document.getElementById(id);
                        if (el) el.innerText = text;
                    };

                    fillData('userName', userData.name || "Usuario");
                    fillData('userJob', userData.job || "No definido");
                    fillData('userRating', userData.rating || "0.0");
                    fillData('userReviewsCount', userData.reviewsCount || "0");

                    const userPhoto = document.getElementById('userPhoto');
                    if (userPhoto) userPhoto.src = userData.profilePhoto || "https://via.placeholder.com/150";

                    // LÓGICA DEL BANNER
                    if (statusBanner) {
                        statusBanner.className = 'status-banner'; // Reset
                        
                        if (status === "verificado") {
                            statusBanner.classList.add('status-verified');
                            statusBanner.innerHTML = '✔️ Perfil Verificado. ¡Ya eres visible!';
                            statusBanner.style.background = "#d4edda"; // Forzamos color por si el CSS falla
                            statusBanner.style.color = "#155724";
                        } else if (status === "rechazado") {
                            statusBanner.style.background = "#f8d7da";
                            statusBanner.style.color = "#721c24";
                            statusBanner.innerHTML = '❌ Identificación rechazada.';
                        } else {
                            statusBanner.classList.add('status-pending');
                            statusBanner.innerHTML = '⏳ Tu identificación está en revisión. Aún no apareces en las búsquedas públicas.';
                        }
                    }
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => { window.location.href = 'login.html'; });
        });
    }
});
