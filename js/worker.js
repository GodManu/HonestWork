import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    const params = new URLSearchParams(window.location.search);
    const workerId = params.get('id');

    const gallery = document.getElementById('workerGallery');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const workerName = document.getElementById('workerName');
    
    // Elementos de Reseñas
    const reviewsList = document.getElementById('reviewsList');
    const btnSubmitReview = document.getElementById('btnSubmitReview');
    const reviewFormSection = document.getElementById('reviewFormSection');
    const loginToReviewMessage = document.getElementById('loginToReviewMessage');
    const loggedInUserName = document.getElementById('loggedInUserName');

    if (!workerId) { window.location.href = 'workers.html'; return; }

    let currentUser = null;
    let currentUserName = "Usuario";

    // 1. VIGILANTE DE SESIÓN
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if(userDoc.exists()) {
                    currentUserName = userDoc.data().name || "Usuario";
                }
                if(loggedInUserName) loggedInUserName.innerText = currentUserName;
                if(reviewFormSection) reviewFormSection.style.display = 'block';
                if(loginToReviewMessage) loginToReviewMessage.style.display = 'none';
            } catch (error) { console.error("Error Auth:", error); }
        } else {
            if(reviewFormSection) reviewFormSection.style.display = 'none';
            if(loginToReviewMessage) loginToReviewMessage.style.display = 'block';
        }
    });

    try {
        // 2. CARGAR DATOS DEL TRABAJADOR
        const docRef = doc(db, "users", workerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const worker = docSnap.data();

            if (worker.idStatus !== "verificado") {
                document.body.innerHTML = `<div style="text-align:center; margin-top:100px;"><h1>Perfil no disponible</h1><a href="workers.html">Volver</a></div>`;
                return;
            }

            workerName.innerText = worker.name || "Profesional";
            document.getElementById('workerJob').innerText = worker.job || "Oficio";
            document.getElementById('workerPhoto').src = worker.profilePhoto || 'https://via.placeholder.com/150';
            
            const rating = parseFloat(worker.rating) || 0;
            document.getElementById('workerRating').innerHTML = `★ ${rating.toFixed(1)} <small>(${worker.reviewsCount || 0} reseñas)</small>`;

            // 3. WHATSAPP
            if (worker.phone && whatsappBtn) {
                let cleanPhone = worker.phone.toString().replace(/\D/g, '');
                if (cleanPhone.length === 10) cleanPhone = "52" + cleanPhone;
                whatsappBtn.href = `https://wa.me/${cleanPhone}?text=Hola, te vi en HonestWork...`;
            }

            // 4. GALERÍA DE PORTAFOLIO
            if (gallery) {
                gallery.innerHTML = ""; 
                if (worker.workPhotos && worker.workPhotos.length > 0) {
                    worker.workPhotos.forEach(work => {
                        const url = typeof work === 'string' ? work : work.url;
                        const desc = typeof work === 'string' ? "Trabajo" : work.description;
                        gallery.innerHTML += `<div style="border:1px solid #eee; border-radius:8px; overflow:hidden;"><img src="${url}" style="width:100%; height:200px; object-fit:cover;"><p style="padding:10px; font-size:0.9em;">${desc}</p></div>`;
                    });
                }
            }

            // 5. RENDERIZAR RESEÑAS CON FOTOS Y BOTÓN ELIMINAR
            const renderReviews = () => {
                reviewsList.innerHTML = "";
                if (!worker.reviews || worker.reviews.length === 0) {
                    reviewsList.innerHTML = "<p>Sin reseñas aún.</p>";
                    return;
                }
                [...worker.reviews].reverse().forEach(rev => {
                    const stars = "⭐".repeat(rev.rating);
                    const isMyReview = currentUser && currentUser.uid === rev.reviewerUid;
                    
                    let photosHtml = "";
                    if (rev.photos && rev.photos.length > 0) {
                        photosHtml = `<div style="display:flex; gap:5px; margin-top:10px;">` + 
                            rev.photos.map(p => `<img src="${p}" style="width:60px; height:60px; object-fit:cover; border-radius:4px; cursor:pointer;" onclick="window.open('${p}')">`).join("") + 
                            `</div>`;
                    }

                    reviewsList.innerHTML += `
                        <div style="background:#fdfdfd; padding:15px; border-radius:8px; border:1px solid #eee; margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between;">
                                <strong>${rev.name} ✔️</strong>
                                <span style="color:#999; font-size:0.8em;">${new Date(rev.date).toLocaleDateString()}</span>
                            </div>
                            <div style="color:#f5b301; margin:5px 0;">${stars}</div>
                            <p style="margin:0; color:#555;">${rev.comment}</p>
                            ${photosHtml}
                            ${isMyReview ? `<button class="delete-rev-btn" data-rev='${JSON.stringify(rev)}' style="color:red; background:none; border:none; cursor:pointer; font-size:0.8em; margin-top:10px; text-decoration:underline;">Eliminar mi reseña</button>` : ""}
                        </div>
                    `;
                });

                // Lógica del botón eliminar propio
                document.querySelectorAll('.delete-rev-btn').forEach(btn => {
                    btn.onclick = async (e) => {
                        const revData = JSON.parse(e.currentTarget.getAttribute('data-rev'));
                        if(confirm("¿Borrar tu reseña? Las estrellas del trabajador se recalcularán.")){
                            try {
                                const newCount = (worker.reviewsCount || 1) - 1;
                                let newAverage = 0;
                                if (newCount > 0) {
                                    newAverage = ((worker.rating * worker.reviewsCount) - revData.rating) / newCount;
                                }
                                await updateDoc(docRef, {
                                    reviews: arrayRemove(revData),
                                    rating: newAverage,
                                    reviewsCount: newCount
                                });
                                window.location.reload();
                            } catch (err) { console.error(err); }
                        }
                    };
                });
            };
            renderReviews();

            // 6. PUBLICAR RESEÑA CON EVIDENCIA Y COMPROMISO
            if (btnSubmitReview) {
                btnSubmitReview.onclick = async () => {
                    const confirmCheck = document.getElementById('confirmTruth').checked;
                    const fileInput = document.getElementById('reviewPhotos');
                    const comment = document.getElementById('reviewComment').value.trim();
                    const ratingVal = parseInt(document.getElementById('reviewRating').value);

                    if (!currentUser) return alert("Inicia sesión.");
                    if (currentUser.uid === workerId) return alert("No puedes autocalificarte.");
                    if (!confirmCheck) return alert("Debes confirmar que tu reseña es real.");
                    if (!comment) return alert("Escribe un comentario.");

                    btnSubmitReview.innerText = "Subiendo evidencia...";
                    btnSubmitReview.disabled = true;

                    try {
                        let photoUrls = [];
                        if (fileInput.files.length > 0) {
                            for (let file of fileInput.files) {
                                const path = `reviews/${workerId}/${currentUser.uid}/${Date.now()}_${file.name}`;
                                const sRef = ref(storage, path);
                                await uploadBytes(sRef, file);
                                const url = await getDownloadURL(sRef);
                                photoUrls.push(url);
                            }
                        }

                        const newReview = {
                            reviewerUid: currentUser.uid,
                            name: currentUserName,
                            rating: ratingVal,
                            comment: comment,
                            photos: photoUrls,
                            date: new Date().toISOString()
                        };

                        const currentCount = parseInt(worker.reviewsCount) || 0;
                        const currentRating = parseFloat(worker.rating) || 0;
                        const newCount = currentCount + 1;
                        const newAverage = ((currentRating * currentCount) + ratingVal) / newCount;

                        await updateDoc(docRef, {
                            reviews: arrayUnion(newReview),
                            rating: newAverage,
                            reviewsCount: newCount
                        });

                        alert("¡Reseña publicada!");
                        window.location.reload();
                    } catch (error) {
                        console.error(error);
                        alert("Error al publicar.");
                        btnSubmitReview.disabled = false;
                    }
                };
            }

        } else { window.location.href = 'workers.html'; }
    } catch (error) { console.error(error); }
});
