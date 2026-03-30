import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    // Referencias HTML
    const statusBanner = document.getElementById('verificationStatus');
    const logoutBtn = document.getElementById('logoutBtn');
    const workGallery = document.getElementById('workGallery');
    const userPhoto = document.getElementById('userPhoto'); 
    const profilePhotoInput = document.getElementById('profilePhotoInput'); 

    // Elementos para subir trabajos
    const btnUploadWork = document.getElementById('btnUploadWork');
    const fileInput = document.getElementById('newWorkPhoto');
    const descInput = document.getElementById('newWorkDescription');

    // Elementos para editar perfil
    const btnEditProfile = document.getElementById('btnEditProfile');
    const editProfileModal = document.getElementById('editProfileModal');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const btnSaveEdit = document.getElementById('btnSaveEdit');

    let currentUserData = {}; 

    // 1. VIGILANTE DE SESIÓN
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            
            // 2. ESCUCHA EN TIEMPO REAL
            onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    currentUserData = userData;
                    const status = userData.idStatus; 

                    // Llenar datos en pantalla
                    const fillData = (id, text) => {
                        const el = document.getElementById(id);
                        if (el) el.innerText = text;
                    };

                    fillData('userName', userData.name || "Usuario");
                    fillData('userJob', userData.job || "No definido");
                    fillData('userCity', userData.city || "México");
                    fillData('userRating', userData.rating || "0.0");
                    fillData('userReviewsCount', userData.reviewsCount || "0");

                    if (userPhoto) userPhoto.src = userData.profilePhoto || "https://via.placeholder.com/150";

                    // --- RENDER GALERÍA ---
                    if (workGallery) {
                        workGallery.innerHTML = ""; 
                        if (userData.workPhotos && userData.workPhotos.length > 0) {
                            userData.workPhotos.forEach(work => {
                                const url = typeof work === 'string' ? work : work.url;
                                const desc = typeof work === 'string' ? "Sin descripción" : work.description;
                                const card = document.createElement('div');
                                card.style = "position: relative; border: 1px solid #eee; border-radius: 8px; padding: 10px; background: white; display: flex; flex-direction: column;";
                                card.innerHTML = `
                                    <img src="${url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                                    <p style="font-size: 0.85em; color: #555; margin-bottom: 15px; flex-grow: 1;">${desc}</p>
                                    <button class="btn-delete-work" data-work='${JSON.stringify(work)}' style="background: #dc3545; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold;">Eliminar</button>
                                `;
                                workGallery.appendChild(card);
                            });

                            // Botones eliminar
                            document.querySelectorAll('.btn-delete-work').forEach(btn => {
                                btn.onclick = async (e) => {
                                    const workData = JSON.parse(e.currentTarget.getAttribute('data-work'));
                                    if(confirm("¿Eliminar este trabajo?")) {
                                        await updateDoc(userRef, { workPhotos: arrayRemove(workData) });
                                        if(workData.path) await deleteObject(ref(storage, workData.path));
                                    }
                                };
                            });
                        }
                    }

                    // --- BANNER STATUS ---
                    if (statusBanner) {
                        if (status === "verificado") {
                            if (btnUploadWork) btnUploadWork.disabled = false;
                            statusBanner.className = 'status-banner status-verified';
                            statusBanner.innerHTML = '✔️ Perfil Verificado. ¡Ya eres visible!';
                        } else {
                            if (btnUploadWork) btnUploadWork.disabled = true;
                            statusBanner.className = 'status-banner status-pending';
                            statusBanner.innerHTML = '⏳ Tu identificación está en revisión.';
                        }
                    }
                }
            });

            // 3. SUBIR TRABAJOS
            if (btnUploadWork) {
                btnUploadWork.onclick = async () => {
                    const file = fileInput.files[0];
                    const description = descInput.value.trim();
                    if (!file || !description) return alert("Faltan datos");

                    btnUploadWork.disabled = true;
                    try {
                        const path = `public/${user.uid}/works/${Date.now()}_${file.name}`;
                        const sRef = ref(storage, path);
                        await uploadBytes(sRef, file);
                        const url = await getDownloadURL(sRef);

                        await updateDoc(userRef, {
                            workPhotos: arrayUnion({ url, description, path })
                        });
                        fileInput.value = ""; descInput.value = "";
                        alert("¡Trabajo guardado!");
                    } catch (e) { console.error(e); }
                    btnUploadWork.disabled = false;
                };
            }

            // 4. EDITAR PERFIL (MODAL)
            if (btnEditProfile) {
                btnEditProfile.onclick = () => {
                    document.getElementById('editName').value = currentUserData.name || '';
                    document.getElementById('editJob').value = currentUserData.job || '';
                    document.getElementById('editCity').value = currentUserData.city || '';
                    document.getElementById('editPhone').value = currentUserData.phone || '';
                    editProfileModal.style.display = 'flex';
                };
                btnCancelEdit.onclick = () => editProfileModal.style.display = 'none';
                btnSaveEdit.onclick = async () => {
                    await updateDoc(userRef, {
                        name: document.getElementById('editName').value,
                        job: document.getElementById('editJob').value,
                        city: document.getElementById('editCity').value,
                        phone: document.getElementById('editPhone').value
                    });
                    editProfileModal.style.display = 'none';
                };
            }

        } else {
            window.location.href = 'login.html';
        }
    });

    if (logoutBtn) {
        logoutBtn.onclick = () => signOut(auth).then(() => window.location.href = 'login.html');
    }
});
