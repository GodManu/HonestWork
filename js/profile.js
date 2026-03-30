import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del HTML
    const statusBanner = document.getElementById('verificationStatus');
    const logoutBtn = document.getElementById('logoutBtn');
    const workGallery = document.getElementById('workGallery');
    const userPhoto = document.getElementById('userPhoto'); 
    const profilePhotoInput = document.getElementById('profilePhotoInput'); 

    // Referencias para subir trabajos
    const btnUploadWork = document.getElementById('btnUploadWork');
    const fileInput = document.getElementById('newWorkPhoto');
    const descInput = document.getElementById('newWorkDescription');

    // Referencias para editar perfil
    const btnEditProfile = document.getElementById('btnEditProfile');
    const editProfileModal = document.getElementById('editProfileModal');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const btnSaveEdit = document.getElementById('btnSaveEdit');

    // 1. VIGILANTE DE SESIÓN (Auth)
    onAuthStateChanged(auth, (user) => {
        let currentUserData = {}; // Guardará los datos para ponerlos en la ventana de edición

        if (user) {
            console.log("Usuario activo:", user.uid);
            const userRef = doc(db, "users", user.uid);
            
            // 2. ESCUCHA EN TIEMPO REAL (Firestore)
            onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const status = userData.idStatus; 
                    
                    currentUserData = userData; // Actualizamos los datos frescos

                    // Actualizar información básica en la pantalla
                    const fillData = (id, text) => {
                        const el = document.getElementById(id);
                        if (el) el.innerText = text;
                    };

                    fillData('userName', userData.name || "Usuario");
                    fillData('userJob', userData.job || "No definido");
                    fillData('userCity', userData.city || "México"); // Mostrar ciudad
                    fillData('userRating', userData.rating || "0.0");
                    fillData('userReviewsCount', userData.reviewsCount || "0");

                    if (userPhoto) userPhoto.src = userData.profilePhoto || "https://via.placeholder.com/150";

                    // --- LÓGICA DE LA GALERÍA (CON BOTÓN DE ELIMINAR) ---
                    if (workGallery) {
                        workGallery.innerHTML = ""; 
                        
                        if (userData.workPhotos && userData.workPhotos.length > 0) {
                            userData.workPhotos.forEach(work => {
                                const isOldFormat = typeof work === 'string';
                                const url = isOldFormat ? work : work.url;
                                const desc = isOldFormat ? "Sin descripción" : work.description;
                                
                                const card = document.createElement('div');
                                card.style = "position: relative; border: 1px solid #eee; border-radius: 8px; padding: 10px; background: white; display: flex; flex-direction: column;";
                                
                                card.innerHTML = `
                                    <img src="${url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 5px; margin-bottom: 10px; cursor: pointer;" onclick="window.open('${url}', '_blank')">
                                    <p style="font-size: 0.85em; color: #555; margin-bottom: 15px; flex-grow: 1; overflow-y: auto;">${desc}</p>
                                    <button class="btn-delete-work" data-work='${JSON.stringify(work)}' style="background: #dc3545; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold;">
                                        <i class="fa-solid fa-trash"></i> Eliminar
                                    </button>
                                `;
                                workGallery.appendChild(card);
                            });

                            document.querySelectorAll('.btn-delete-work').forEach(btn => {
                                btn.onclick = async (e) => {
                                    const workData = JSON.parse(e.currentTarget.getAttribute('data-work'));
                                    
                                    if(confirm("¿Estás seguro de que quieres eliminar este trabajo de tu portafolio?")) {
                                        try {
                                            await updateDoc(doc(db, "users", user.uid), {
                                                workPhotos: arrayRemove(workData)
                                            });
                                            
                                            if(workData.path) {
                                                await deleteObject(ref(storage, workData.path));
                                            }
                                        } catch(error) {
                                            console.error("Error al eliminar:", error);
                                            alert("Hubo un error al eliminar la foto.");
                                        }
                                    }
                                };
                            });

                        } else {
                            workGallery.innerHTML = '<p style="color: #999; font-size: 0.9em; grid-column: 1/-1; text-align: center;">Aún no tienes fotos de tus trabajos.</p>';
                        }
                    }

                    // --- LÓGICA DE VERIFICACIÓN (Banner y Botón) ---
                    if (statusBanner) {
                        statusBanner.className = 'status-banner'; // Reset
                        
                        if (status === "verificado") {
                            if (btnUploadWork) btnUploadWork.disabled = false;
                            
                            statusBanner.classList.add('status-verified');
                            statusBanner.innerHTML = '✔️ Perfil Verificado. ¡Ya eres visible!';
                            statusBanner.style.background = "#d4edda";
                            statusBanner.style.color = "#155724";
                        } else if (status === "rechazado") {
                            if (btnUploadWork) btnUploadWork.disabled = true;
                            statusBanner.style.background = "#f8d7da";
                            statusBanner.style.color = "#721c24";
                            statusBanner.innerHTML = '❌ Identificación rechazada. Contacta a soporte.';
                        } else {
                            if (btnUploadWork) btnUploadWork.disabled = true;
                            statusBanner.classList.add('status-pending');
                            statusBanner.innerHTML = '⏳ Tu identificación está en revisión.';
                        }
                    }
                }
            });

            // 3. LÓGICA DE CARGA DE FOTOS DE TRABAJOS CON DESCRIPCIÓN
            if (btnUploadWork) {
                btnUploadWork.onclick = async () => {
                    const file = fileInput.files[0];
                    const description = descInput.value.trim();

                    if (!file) { alert("Por favor selecciona una foto de tu trabajo."); return; }
                    if (!description) { alert("Por favor agrega una breve descripción del trabajo."); return; }

                    const originalText = statusBanner.innerHTML;
                    statusBanner.innerHTML = "⏳ Subiendo trabajo al portafolio... por favor espera.";
                    btnUploadWork.disabled = true;

                    try {
                        const storagePath = `public/${user.uid}/works/${Date.now()}_${file.name}`;
                        const storageRef = ref(storage, storagePath);
                        
                        await uploadBytes(storageRef, file);
                        const downloadURL = await getDownloadURL(storageRef);

                        const newWorkItem = {
                            url: downloadURL,
                            description: description,
                            path: storagePath
                        };

                        await updateDoc(doc(db, "users", user.uid), {
                            workPhotos: arrayUnion(newWorkItem)
                        });

                        fileInput.value = "";
                        descInput.value = "";
                        alert("¡Trabajo añadido con éxito!");
                    } catch (error) {
                        console.error("Error al subir trabajo:", error);
                        alert("Error al subir el archivo. Intenta de nuevo.");
                    } finally {
                        statusBanner.innerHTML = originalText;
                        btnUploadWork.disabled = false;
                    }
                };
            }

            // 4. LÓGICA PARA CAMBIAR FOTO DE PERFIL
            if (userPhoto && profilePhotoInput) {
                userPhoto.onclick = () => { profilePhotoInput.click(); };

                profilePhotoInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    userPhoto.style.opacity = "0.5";
                    const originalText = statusBanner.innerHTML;
                    statusBanner.innerHTML = "⏳ Actualizando foto de perfil...";

                    try {
                        const storagePath = `profilePictures/${user.uid}/${Date.now()}_${file.name}`;
                        const storageRef = ref(storage, storagePath);
                        
                        await uploadBytes(storageRef, file);
                        const downloadURL = await getDownloadURL(storageRef);

                        await updateDoc(doc(db, "users", user.uid), {
                            profilePhoto: downloadURL
                        });

                        alert("¡Foto de perfil actualizada con éxito!");
                    } catch (error) {
                        console.error("Error al subir foto de perfil:", error);
                        alert("Error al subir la imagen de perfil.");
                    } finally {
                        userPhoto.style.opacity = "1";
                        statusBanner.innerHTML = originalText;
                        profilePhotoInput.value = ""; 
                    }
                };
            }

            // ==========================================
            // 5. LÓGICA PARA EDITAR PERFIL (NUEVO)
            // ==========================================
            if (btnEditProfile && editProfileModal) {
                // Abrir modal y cargar datos actuales
                btnEditProfile.onclick = () => {
                    document.getElementById('editName').value = currentUserData.name || '';
                    document.getElementById('editJob').value = currentUserData.job || '';
                    document.getElementById('editCity').value = currentUserData.city || '';
                    document.getElementById('editPhone').value = currentUserData.phone || '';
                    editProfileModal.style.display = 'flex'; // Mostrar ventana
                };

                // Botón cancelar
                btnCancelEdit.onclick = () => {
                    editProfileModal.style.display = 'none';
                };

                // Botón guardar
                btnSaveEdit.onclick = async () => {
                    const newName = document.getElementById('editName').value.trim();
                    const newJob = document.getElementById('editJob').value.trim();
                    const newCity = document.getElementById('editCity').value.trim();
                    const newPhone = document.getElementById('editPhone').value.trim();

                    if (!newName || !newJob || !newPhone) {
                        alert("El nombre, oficio y teléfono no pueden estar vacíos.");
                        return;
                    }

                    btnSaveEdit.innerText = "Guardando...";
                    btnSaveEdit.disabled = true;

                    try {
                        await updateDoc(doc(db, "users", user.uid), {
                            name: newName,
                            job: newJob,
                            city: newCity,
                            phone: newPhone
                        });
                        alert("¡Información actualizada con éxito!");
                        editProfileModal.style.display = 'none';
                    } catch (error) {
                        console.error("Error al actualizar perfil:", error);
                        alert("Hubo un error al guardar los cambios.");
                    } finally {
                        btnSaveEdit.innerText = "Guardar Cambios";
                        btnSaveEdit.disabled = false;
                    }
                };
            }

        } else {
            window.location.href = 'login.html';
        }
    });

    // 6. CERRAR SESIÓN
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            signOut(auth).then(() => {
                window.location.href = 'login.html';
            });
        };
    }
});
