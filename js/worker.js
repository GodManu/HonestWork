import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. OBTENER EL ID DEL TRABAJADOR DESDE LA URL (ej: worker.html?id=ABC123XYZ)
    const params = new URLSearchParams(window.location.search);
    const workerId = params.get('id');

    // Referencias a los elementos del HTML
    const gallery = document.getElementById('workerGallery');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const workerName = document.getElementById('workerName');

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

            // SEGURIDAD: Solo mostrar si el perfil está verificado
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
            
            // Mostrar Estrellas y Reseñas
            const rating = parseFloat(worker.rating) || 0;
            const ratingHtml = `
                <span style="color: #f5b301;">★</span> ${rating.toFixed(1)} 
                <small style="color:#999; font-size: 0.7em;">(${worker.reviewsCount || 0} reseñas)</small>
            `;
            document.getElementById('workerRating').innerHTML = ratingHtml;

            // 4. CONFIGURAR EL BOTÓN DE WHATSAPP REAL
            if (worker.phone && whatsappBtn) {
                let cleanPhone = worker.phone.toString().replace(/\D/g, '');
                
                // Si es un número de México de 10 dígitos, le ponemos el código de país (52)
                if (cleanPhone.length === 10) {
                    cleanPhone = "52" + cleanPhone;
                }

                const mensaje = encodeURIComponent(`Hola ${worker.name}, te encontré en HonestWork Los Cabos y me gustaría pedirte un presupuesto para un trabajo de ${worker.job}.`);
                whatsappBtn.href = `https://wa.me/${cleanPhone}?text=${mensaje}`;
            } else if (whatsappBtn) {
                whatsappBtn.style.display = 'none';
            }

            // 5. CARGAR LA GALERÍA DE TRABAJOS (NUEVO FORMATO CON DESCRIPCIÓN)
            if (gallery) {
                gallery.innerHTML = ""; // Limpiar el "Cargando..."
                
                if (worker.workPhotos && worker.workPhotos.length > 0) {
                    worker.workPhotos.forEach(work => {
                        // Detectamos si es formato viejo (solo string) o nuevo (objeto)
                        const isOldFormat = typeof work === 'string';
                        const url = isOldFormat ? work : work.url;
                        const desc = isOldFormat ? "Trabajo realizado" : work.description;

                        const card = document.createElement('div');
                        // Estilos en línea para las tarjetas del portafolio
                        card.style.cssText = "border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";
                        
                        card.innerHTML = `
                            <img src="${url}" alt="Trabajo de ${worker.name}" style="width: 100%; height: 200px; object-fit: cover; cursor: pointer;" onclick="window.open('${url}', '_blank')" title="Clic para ampliar">
                            <div style="padding: 15px; flex-grow: 1;">
                                <p style="color: #444; font-size: 0.95em; margin: 0; line-height: 1.4;">${desc}</p>
                            </div>
                        `;
                        gallery.appendChild(card);
                    });
                } else {
                    gallery.innerHTML = `
                        <p style="color: #999; grid-column: 1 / -1; text-align: center; padding: 20px; border: 2px dashed #eee; border-radius: 10px;">
                            Este profesional aún no ha subido fotos de sus trabajos anteriores a su portafolio.
                        </p>
                    `;
                }
            }

        } else {
            console.error("No se encontró el trabajador en la base de datos.");
            window.location.href = 'workers.html';
        }

    } catch (error) {
        console.error("Error al cargar el perfil del trabajador:", error);
        alert("Hubo un problema al cargar la información. Intenta de nuevo.");
    }
});
