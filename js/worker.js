import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

    // --- VARIABLES DEL USUARIO ACTIVO QUE ESTÁ VIENDO LA PÁGINA ---
    let currentUser = null;
    let currentUserName = "Usuario";

    // 1. VERIFICAR QUIÉN ESTÁ CONECTADO
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Buscar el nombre real de quien comenta en la base de datos
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if(userDoc.exists()) {
                    currentUserName = userDoc.data().name || "Usuario";
                }
                if(loggedInUserName) loggedInUserName.innerText = currentUserName;
                
                // Mostrar formulario, ocultar aviso
                if(reviewFormSection) reviewFormSection.style.display = 'block';
                if(loginToReviewMessage) loginToReviewMessage.style.display = 'none';
            } catch (error) {
                console.error("Error al obtener datos del usuario:", error);
            }
        } else {
            // No hay sesión: Ocultar formulario, mostrar aviso
            if(reviewFormSection) reviewFormSection.style.display = 'none';
            if(loginToReviewMessage) loginToReviewMessage.style.display = 'block';
        }
    });

    try {
        // 2. CONSULTAR LOS DATOS DEL TRABAJADOR (El dueño del perfil)
        const docRef = doc(db, "users", workerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const worker = docSnap.data();

            if (worker.idStatus !== "verificado") {
                document.body.innerHTML = `<div style="text-align:center; margin-top:100px;"><h1>Perfil no disponible</h1><a href="workers.html">Volver al directorio</a></div>`;
                return;
            }

            // 3. LLENAR INFORMACIÓN BÁSICA DEL TRABAJADOR
            workerName.innerText = worker.name || "Profesional";
            document.getElementById('workerJob').innerText = worker.job || "Oficio no definido";
            document.getElementById('workerPhoto').src = worker.profilePhoto || 'https://via.placeholder.com/150';
            
            const rating = parseFloat(worker.rating) || 0;
            const ratingHtml = `<span style="color: #f5b301;">★</span> ${rating.toFixed(1)} <small style="color:#999; font-size: 0.7em;">(${worker.reviewsCount || 0} reseñas)</small>`;
            document.getElementById('workerRating').innerHTML = ratingHtml;

            // 4. CONFIGURAR WHATSAPP
            if (worker.phone && whatsappBtn) {
                let cleanPhone = worker.phone.toString().replace(/\D/g, '');
                if (cleanPhone.length === 10) cleanPhone = "52" + cleanPhone;
                const mensaje = encodeURIComponent(`Hola ${worker.name}, te encontré en HonestWork y me gustaría pedirte un presupuesto para un trabajo de ${worker.job}.`);
                whatsappBtn.href = `https://wa.me/${cleanPhone}?text=${mensaje}`;
            } else if (whatsappBtn) {
                whatsappBtn.style.display = 'none';
            }

            // 5. GALERÍA DE TRABAJOS
            if (gallery) {
                gallery.innerHTML = ""; 
                if (worker.workPhotos && worker.workPhotos.length > 0) {
                    worker.workPhotos.forEach(work => {
                        const url = typeof work === 'string' ? work : work.url;
                        const desc = typeof work === 'string' ? "Trabajo realizado" : work.description;
                        const card = document.createElement('div');
                        card.style.cssText = "border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";
                        card.innerHTML = `<img src="${url}" style="width: 100%; height: 200px; object-fit: cover; cursor: pointer;" onclick="window.open('${url}', '_blank')"><div style="padding: 15px; flex-grow: 1;"><p style="color: #444; font-size: 0.95em; margin: 0;">${desc}</p></div>`;
                        gallery.appendChild(card);
                    });
                } else {
                    gallery.innerHTML = `<p style="color: #999; grid-column: 1/-1; text-align: center;">Aún no hay fotos en el portafolio.</p>`;
                }
            }

            // ==========================================
            // 6. RENDERIZAR RESEÑAS EXISTENTES (AHORA CON VERIFICACIÓN)
            // ==========================================
            if (reviewsList) {
                reviewsList.innerHTML = "";
                if (!worker.reviews || worker.reviews.length === 0) {
                    reviewsList.innerHTML = "<p style='color:#666; font-style:italic; text-align:center;'>Aún no hay reseñas. ¡Sé el primero en calificar!</p>";
                } else {
                    const reversedReviews = [...worker.reviews].reverse();
                    
                    reversedReviews.forEach(rev => {
                        const stars = "⭐".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
                        const dateStr = rev.date ? new Date(rev.date).toLocaleDateString() : "Reciente";
                        
                        reviewsList.innerHTML += `
                            <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <div>
                                        <strong style="color: #333;">${rev.name}</strong> 
                                        <span style="color: green; font-size: 0.8em;" title="Cuenta Verificada">✔️</span>
                                    </div>
                                    <span style="color: #999; font-size: 0.85em;">${dateStr}</span>
                                </div>
                                <div style="color: #f5b301; margin-bottom: 10px; font-size: 0.9em;">${stars}</div>
                                <p style="margin: 0; color: #555; font-size: 0.95em; line-height: 1.4;">"${rev.comment}"</p>
                            </div>
                        `;
                    });
                }
            }

            // ==========================================
            // 7. LÓGICA PARA PUBLICAR LA NUEVA RESEÑA
            // ==========================================
            if (btnSubmitReview) {
                btnSubmitReview.onclick = async () => {
                    if (!currentUser) {
                        alert("Error de seguridad: Debes iniciar sesión para comentar.");
                        return;
                    }

                    const revRating = parseInt(document.getElementById('reviewRating').value);
                    const revComment = document.getElementById('reviewComment').value.trim();

                    if (!revComment) {
                        alert("Por favor, escribe un comentario para publicar tu reseña.");
                        return;
                    }

                    // Evitar que el trabajador se ponga reseñas a sí mismo
                    if (currentUser.uid === workerId) {
                        alert("No puedes dejarte una reseña a ti mismo en tu propio perfil.");
                        return;
                    }

                    btnSubmitReview.innerText = "Publicando...";
                    btnSubmitReview.disabled = true;

                    try {
                        // Construimos la reseña blindada con los datos reales
                        const newReview = {
                            reviewerUid: currentUser.uid, // Guardamos el ID real de quien comenta
                            name: currentUserName,        // El nombre real sacado de la base de datos
                            rating: revRating,
                            comment: revComment,
                            date: new Date().toISOString()
                        };

                        const currentCount = parseInt(worker.reviewsCount) || 0;
                        const currentRating = parseFloat(worker.rating) || 0;
                        const newCount = currentCount + 1;
                        const newAverage = ((currentRating * currentCount) + revRating) / newCount;

                        await updateDoc(docRef, {
                            reviews: arrayUnion(newReview),
                            rating: newAverage,
                            reviewsCount: newCount
                        });

                        alert("¡Gracias por tu reseña! Ya está pública.");
                        window.location.reload();

                    } catch (error) {
                        console.error("Error al publicar reseña:", error);
                        alert("Hubo un error de conexión al enviar tu reseña.");
                        btnSubmitReview.innerText = "Publicar Reseña Verificada";
                        btnSubmitReview.disabled = false;
                    }
                };
            }

        } else {
            console.error("No se encontró el trabajador.");
            window.location.href = 'workers.html';
        }

    } catch (error) {
        console.error("Error al cargar perfil:", error);
        alert("Hubo un problema al cargar la información. Intenta de nuevo.");
    }
});
