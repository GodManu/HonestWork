import { db } from "./firebase-config.js";
// Agregamos updateDoc y arrayUnion para poder guardar las reseñas
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. OBTENER EL ID DEL TRABAJADOR DESDE LA URL
    const params = new URLSearchParams(window.location.search);
    const workerId = params.get('id');

    // Referencias a los elementos del HTML
    const gallery = document.getElementById('workerGallery');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const workerName = document.getElementById('workerName');
    
    // Referencias a los elementos de Reseñas
    const reviewsList = document.getElementById('reviewsList');
    const btnSubmitReview = document.getElementById('btnSubmitReview');

    if (!workerId) {
        window.location.href = 'workers.html';
        return;
    }

    try {
        // 2. CONSULTAR LOS DATOS EN FIRESTORE
        const docRef = doc(db, "users", workerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const worker = docSnap.data();

            if (worker.idStatus !== "verificado") {
                document.body.innerHTML = `
                    <div style="text-align:center; margin-top:100px; font-family:sans-serif;">
                        <h1>Perfil no disponible</h1>
                        <p>Este profesional no se encuentra activo en este momento.</p>
                        <a href="workers.html" style="color:#007bff; text-decoration:none; font-weight:bold;">Volver al directorio</a>
                    </div>
                `;
                return;
            }

            // 3. LLENAR INFORMACIÓN BÁSICA
            workerName.innerText = worker.name || "Profesional";
            document.getElementById('workerJob').innerText = worker.job || "Oficio no definido";
            document.getElementById('workerPhoto').src = worker.profilePhoto || 'https://via.placeholder.com/150';
            
            const rating = parseFloat(worker.rating) || 0;
            const ratingHtml = `
                <span style="color: #f5b301;">★</span> ${rating.toFixed(1)} 
                <small style="color:#999; font-size: 0.7em;">(${worker.reviewsCount || 0} reseñas)</small>
            `;
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

            // 5. CARGAR LA GALERÍA DE TRABAJOS
            if (gallery) {
                gallery.innerHTML = ""; 
                if (worker.workPhotos && worker.workPhotos.length > 0) {
                    worker.workPhotos.forEach(work => {
                        const isOldFormat = typeof work === 'string';
                        const url = isOldFormat ? work : work.url;
                        const desc = isOldFormat ? "Trabajo realizado" : work.description;

                        const card = document.createElement('div');
                        card.style.cssText = "border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";
                        
                        card.innerHTML = `
                            <img src="${url}" style="width: 100%; height: 200px; object-fit: cover; cursor: pointer;" onclick="window.open('${url}', '_blank')">
                            <div style="padding: 15px; flex-grow: 1;">
                                <p style="color: #444; font-size: 0.95em; margin: 0;">${desc}</p>
                            </div>
                        `;
                        gallery.appendChild(card);
                    });
                } else {
                    gallery.innerHTML = `<p style="color: #999; grid-column: 1/-1; text-align: center;">Este profesional aún no ha subido fotos.</p>`;
                }
            }

            // ==========================================
            // 6. RENDERIZAR RESEÑAS EXISTENTES
            // ==========================================
            if (reviewsList) {
                reviewsList.innerHTML = "";
                if (!worker.reviews || worker.reviews.length === 0) {
                    reviewsList.innerHTML = "<p style='color:#666; font-style:italic; text-align:center;'>Aún no hay reseñas. ¡Sé el primero en calificar a este profesional!</p>";
                } else {
                    // Volteamos el arreglo para mostrar la más nueva hasta arriba
                    const reversedReviews = [...worker.reviews].reverse();
                    
                    reversedReviews.forEach(rev => {
                        // Dibujar las estrellitas amarillas
                        const stars = "⭐".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
                        const dateStr = rev.date ? new Date(rev.date).toLocaleDateString() : "Reciente";
                        
                        reviewsList.innerHTML += `
                            <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <strong style="color: #333;">${rev.name}</strong>
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
            // 7. LÓGICA PARA ENVIAR UNA NUEVA RESEÑA
            // ==========================================
            if (btnSubmitReview) {
                btnSubmitReview.onclick = async () => {
                    const revName = document.getElementById('reviewerName').value.trim();
                    const revRating = parseInt(document.getElementById('reviewRating').value);
                    const revComment = document.getElementById('reviewComment').value.trim();

                    if (!revName || !revComment) {
                        alert("Por favor, ingresa tu nombre y un comentario para publicar la reseña.");
                        return;
                    }

                    btnSubmitReview.innerText = "Publicando...";
                    btnSubmitReview.disabled = true;

                    try {
                        // Creamos el objeto de la reseña
                        const newReview = {
                            name: revName,
                            rating: revRating,
                            comment: revComment,
                            date: new Date().toISOString()
                        };

                        // 🧮 MATEMÁTICAS: Calcular el nuevo promedio
                        const currentCount = parseInt(worker.reviewsCount) || 0;
                        const currentRating = parseFloat(worker.rating) || 0;
                        
                        const newCount = currentCount + 1;
                        const newAverage = ((currentRating * currentCount) + revRating) / newCount;

                        // Guardamos todo en Firebase
                        await updateDoc(docRef, {
                            reviews: arrayUnion(newReview),     // Agrega la reseña a la lista
                            rating: newAverage,                 // Actualiza las estrellas
                            reviewsCount: newCount              // Sube el contador
                        });

                        alert("¡Gracias por tu reseña! Ayudas a mantener la confianza en la plataforma.");
                        
                        // Recargamos la página para que el cliente vea su comentario publicado y el nuevo promedio
                        window.location.reload();

                    } catch (error) {
                        console.error("Error al publicar reseña:", error);
                        alert("Hubo un error al enviar tu reseña. Intenta de nuevo.");
                        btnSubmitReview.innerText = "Publicar Reseña";
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
