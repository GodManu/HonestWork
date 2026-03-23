import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const statusBanner = document.getElementById('verificationStatus');
    const logoutBtn = document.getElementById('logoutBtn');
    const workPhotosInput = document.getElementById('workPhotos'); // <--- El guardia busca el botón

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            
            onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const status = userData.idStatus; 

                    console.log("Datos recibidos:", userData);

                    // Función segura para llenar datos
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

                    // --- LÓGICA DE DESBLOQUEO Y BANNER ---
                    if (statusBanner) {
                        statusBanner.className = 'status-banner';
                        
                        if (status === "verificado") {
                            // 1. DESBLOQUEAMOS EL BOTÓN
                            if (workPhotosInput) {
                                workPhotosInput.disabled = false;
                                workPhotosInput.style.cursor = "pointer";
                            }
                            // 2. CAMBIAMOS BANNER A VERDE
                            statusBanner.classList.add('status-verified');
                            statusBanner.innerHTML = '✔️ Perfil Verificado. ¡Ya puedes subir tus trabajos!';
                            statusBanner.style.background = "#d4edda";
                            statusBanner.style.color = "#155724";
                        } else {
                            // Bloqueado si no está verificado
                            if (workPhotosInput) workPhotosInput.disabled = true;
                            statusBanner.classList.add('status-pending');
                            statusBanner.innerHTML = '⏳ Tu identificación está en revisión.';
                        }
                    }
                }
            });

            // --- LÓGICA PARA SUBIR LA FOTO AL SELECCIONARLA ---
            if (workPhotosInput) {
                workPhotosInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    alert("Subiendo foto de trabajo, espera un momento...");

                    try {
                        const storagePath = `public/${user.uid}/works/${Date.now()}_${file.name}`;
                        const storageRef = ref(storage, storagePath);
                        
                        await uploadBytes(storageRef, file);
                        const downloadURL = await getDownloadURL(storageRef);

                        // Agregamos la URL al arreglo 'workPhotos' en Firestore
                        await updateDoc(doc(db, "users", user.uid), {
                            workPhotos: arrayUnion(downloadURL)
                        });

                        alert("¡Excelente! Foto de trabajo guardada.");
                    } catch (error) {
                        console.error("Error al subir:", error);
                        alert("Error al subir la imagen.");
                    }
                });
            }

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
