import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

    const statusBanner = document.getElementById('verificationStatus');
    const logoutBtn = document.getElementById('logoutBtn');

    // 1. ESCUCHAR SI HAY UN USUARIO LOGUEADO
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Usuario detectado:", user.uid);
            
            // 2. BUSCAR SUS DATOS REALES EN FIRESTORE
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                // Llenamos la interfaz con datos de la base de datos
                document.getElementById('userName').innerText = userData.name || "Sin nombre";
                document.getElementById('userJob').innerText = userData.job || "Oficio no definido";
                document.getElementById('userPhoto').src = userData.profilePhoto || "https://via.placeholder.com/150";
                document.getElementById('userRating').innerText = userData.rating || "0.0";
                document.getElementById('userReviewsCount').innerText = userData.reviewsCount || "0";

                // 3. LÓGICA DEL BANNER DE SEGURIDAD (idStatus)
                const status = userData.idStatus; // 'pendiente', 'verificado' o 'rechazado'

                if (status === "verificado") {
                    statusBanner.className = 'status-banner status-verified';
                    statusBanner.innerHTML = '✔️ Perfil Verificado. ¡Ya eres visible en el directorio!';
                } else if (status === "rechazado") {
                    statusBanner.className = 'status-banner';
                    statusBanner.style.background = "#f8d7da";
                    statusBanner.style.color = "#721c24";
                    statusBanner.innerHTML = '❌ Tu identificación fue rechazada. Contacta a soporte.';
                } else {
                    // Por defecto: Pendiente
                    statusBanner.className = 'status-banner status-pending';
                    statusBanner.innerHTML = '⏳ Identificación en revisión. No eres visible al público todavía.';
                }

            } else {
                console.log("No se encontró el documento del usuario.");
            }
        } else {
            // Si no hay nadie logueado, lo mandamos al login
            window.location.href = 'login.html';
        }
    });

    // 4. CERRAR SESIÓN
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        });
    });
});
