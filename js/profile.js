import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del HTML
    const statusBanner = document.getElementById('verificationStatus');
    const logoutBtn = document.getElementById('logoutBtn');
    const workPhotosInput = document.getElementById('workPhotos');
    const workGallery = document.getElementById('workGallery');

    // 1. VIGILANTE DE SESIÓN (Auth)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuario activo:", user.uid);
            const userRef = doc(db, "users", user.uid);
            
            // 2. ESCUCHA EN TIEMPO REAL (Firestore)
            onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const status = userData.idStatus; 

                    // Actualizar información básica
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

                    // --- LÓGICA DE LA GALERÍA ---
                    if (workGallery) {
                        workGallery.innerHTML = ""; // Limpiar antes de redibujar
                        if (userData.workPhotos && userData.workPhotos.length > 0) {
                            userData.workPhotos.forEach(photoUrl => {
                                const img = document.createElement('img');
                                img.src = photoUrl;
                                img.style.width = "100%";
                                img.style.height = "120px";
                                img.style.objectFit = "cover";
                                img.style.borderRadius = "8px";
                                img.style.border = "1px solid #ddd";
                                img.style.cursor = "pointer";
                                img.onclick = () => window.open(photoUrl, '_blank');
                                workGallery.appendChild(img);
                            });
                        } else {
                            workGallery.innerHTML = '<p style="color: #999; font-size: 0.8em; grid-column: 1/-1;">Aún no tienes fotos de tus trabajos.</p>';
                        }
                    }

                    // --- LÓGICA DE VERIFICACIÓN (Banner y Botón) ---
                    if (statusBanner) {
                        statusBanner.className = 'status-banner'; // Reset
                        
                        if (status === "verificado") {
                            // Desbloquear subida de fotos
                            if (workPhotosInput) {
                                workPhotosInput.disabled = false;
                                workPhotosInput.style.cursor = "pointer";
                            }
                            // Banner verde
                            statusBanner.classList.add('status-verified');
                            statusBanner.innerHTML = '✔️ Perfil Verificado. ¡Ya eres visible!';
                            statusBanner.style.background = "#d4edda";
                            statusBanner.style.color = "#155724";
                        } else if (status === "rechazado") {
                            if (workPhotosInput) workPhotosInput.disabled = true;
                            statusBanner.style.background = "#f8d7da";
                            statusBanner.style.color = "#721c24";
                            statusBanner.innerHTML = '❌ Identificación rechazada. Contacta a soporte.';
                        } else {
                            // Estado: Pendiente
                            if (workPhotosInput) workPhotosInput.disabled = true;
                            statusBanner.classList.add('status-pending');
                            statusBanner.innerHTML = '⏳ Tu identificación está en revisión.';
                        }
                    }
                }
            });

            // 3. LÓGICA DE CARGA DE FOTOS (Storage)
            if (workPhotosInput) {
                workPhotosInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    // Feedback visual al usuario
                    const originalText = statusBanner.innerHTML;
                    statusBanner.innerHTML = "⏳ Subiendo imagen... por favor espera.";

                    try {
                        const storagePath = `public/${user.uid}/works/${Date.now()}_${file.name}`;
                        const storageRef = ref(storage, storagePath);
                        
                        await uploadBytes(storageRef, file);
                        const downloadURL = await getDownloadURL(storageRef);

                        // Actualizar el array en la base de datos
                        await updateDoc(doc(db, "users", user.uid), {
                            workPhotos: arrayUnion(downloadURL)
                        });

                        alert("¡Foto de trabajo añadida con éxito!");
                    } catch (error) {
                        console.error("Error al subir foto:", error);
                        alert("Error al subir la imagen. Intenta de nuevo.");
                    } finally {
                        statusBanner.innerHTML = originalText;
                        workPhotosInput.value = ""; // Limpiar el input
                    }
                });
            }

        } else {
            // Si no hay usuario, mandamos al login
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
