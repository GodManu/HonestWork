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

            // SEGURIDAD: Solo mostrar si el perfil ya fue aprobado por ti
            if (worker.idStatus !== "verificado") {
                document.body.innerHTML = `
                    <div style="text-align:center; margin-top:100px; font-family:sans-serif;">
                        <h1>Perfil en revisión</h1>
                        <p>Este profesional aún no ha completado su proceso de verificación.</p>
                        <a href="workers.html" style="color:#007bff;">Volver al directorio</a>
                    </div>
                `;
                return;
            }

            // 3. LLENAR INFORMACIÓN BÁSICA
            workerName.innerText = worker.name;
            document.getElementById('workerJob').innerText = worker.job;
            document.getElementById('workerPhoto').src = worker.profilePhoto || 'https://via.placeholder.com/150';
            
            // Mostrar Estrellas y Reseñas
            const ratingHtml = `
                <span style="color: #f5b301;">★</span> ${worker.rating || '0.0'} 
                <small style="color:#999; font-size: 0.7em;">(${worker.reviewsCount || 0} reseñas)</small>
            `;
            document.getElementById('workerRating').innerHTML = ratingHtml;

            // 4. CONFIGURAR EL BOTÓN DE WHATSAPP REAL
            if (worker.phone && whatsappBtn) {
                // El número ya viene limpio del registro, pero nos aseguramos por si acaso
                let cleanPhone = worker.phone.toString().replace(/\D/g, '');
                
                // Si es un número de México de 10 dígitos, le ponemos el código de país (52)
                if (cleanPhone.length === 10) {
                    cleanPhone = "52" + cleanPhone;
                }

                const mensaje = encodeURIComponent(`Hola ${worker.name}, te vi en HonestWork y me gustaría pedirte un presupuesto para un trabajo de ${worker.job}.`);
                whatsappBtn.href = `https://wa.me/${cleanPhone}?text=${mensaje}`;
            } else if (whatsappBtn) {
                // Si por alguna razón no hay teléfono, ocultamos el botón para no confundir al cliente
                whatsappBtn.style.display = 'none';
            }

            // 5. CARGAR LA GALERÍA DE TRABAJOS
            if (gallery) {
                gallery.innerHTML = ""; // Limpiar el "Cargando..."
                
                if (worker.workPhotos && worker.workPhotos.length > 0) {
                    worker.workPhotos.forEach(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        img.className = 'gallery-item';
                        img.alt = `Trabajo de ${worker.name}`;
                        
                        // Permitir ver la foto en grande al hacer clic
                        img.onclick = () => window.open(url, '_blank');
                        
                        gallery.appendChild(img);
                    });
                } else {
                    gallery.innerHTML = `
                        <p style="color: #999; grid-column: 1 / -1; text-align: center; padding: 20px; border: 2px dashed #eee; border-radius: 10px;">
                            Este profesional aún no ha subido fotos de sus trabajos anteriores.
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
