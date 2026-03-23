import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. OBTENER EL ID DEL TRABAJADOR DESDE LA URL
    const params = new URLSearchParams(window.location.search);
    const workerId = params.get('id');

    if (!workerId) {
        window.location.href = 'workers.html';
        return;
    }

    try {
        // 2. BUSCAR AL TRABAJADOR EN FIRESTORE
        const docRef = doc(db, "users", workerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const worker = docSnap.data();

            // Solo mostrar si está verificado (Seguridad extra)
            if (worker.idStatus !== "verificado") {
                document.body.innerHTML = "<h2 style='text-align:center; margin-top:50px;'>Este perfil aún no ha sido verificado.</h2>";
                return;
            }

            // 3. LLENAR LOS DATOS
            document.getElementById('workerName').innerText = worker.name;
            document.getElementById('workerJob').innerText = worker.job;
            document.getElementById('workerPhoto').src = worker.profilePhoto || 'https://via.placeholder.com/150';
            document.getElementById('workerRating').innerHTML = `★ ${worker.rating || '0.0'} <small style="color:#999">(${worker.reviewsCount || 0} reseñas)</small>`;

            // Configurar WhatsApp (Placeholder)
            const whatsappBtn = document.getElementById('whatsappBtn');
            whatsappBtn.href = `https://wa.me/5211234567890?text=Hola%20${worker.name},%20te%20vi%20en%20HonestWork...`;

            // 4. CARGAR GALERÍA DE FOTOS
            const gallery = document.getElementById('workerGallery');
            if (worker.workPhotos && worker.workPhotos.length > 0) {
                gallery.innerHTML = "";
                worker.workPhotos.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.className = 'gallery-item';
                    img.onclick = () => window.open(url, '_blank');
                    gallery.appendChild(img);
                });
            } else {
                gallery.innerHTML = "<p>Este profesional aún no ha subido fotos de sus trabajos.</p>";
            }

        } else {
            console.log("No existe el trabajador.");
        }

    } catch (error) {
        console.error("Error al cargar perfil:", error);
    }
});
