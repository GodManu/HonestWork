document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Extraemos el ID de la URL (ej. worker.html?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const workerId = parseInt(urlParams.get('id'));

    // SIMULADOR DE BASE DE DATOS (Más detallada para el perfil individual)
    const workersDetailedData = [
        { 
            id: 1, 
            name: "Carlos López", 
            job: "Plomero Especializado", 
            rating: 4.8, 
            reviewsCount: 34, 
            photo: "https://i.pravatar.cc/150?img=11", 
            verified: true,
            phone: "521234567890", // Para el link de WhatsApp
            gallery: [
                "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
                "https://images.unsplash.com/photo-1607472586893-edb57cb31311?auto=format&fit=crop&w=300&q=80"
            ],
            reviews: [
                { author: "Familia García", stars: 5, text: "Excelente servicio, muy puntual y resolvió la fuga en menos de una hora. Lo recomiendo ampliamente." },
                { author: "Martín R.", stars: 4.5, text: "Buen trabajo, dejó todo muy limpio. El precio me pareció justo para la zona." }
            ]
        },
        // Aquí puedes agregar más trabajadores simulados si quieres probar con id=2, id=3, etc.
    ];

    const workerProfile = document.getElementById('workerProfile');
    const errorMessage = document.getElementById('errorMessage');

    // 2. Buscamos al trabajador en nuestra "Base de Datos"
    const worker = workersDetailedData.find(w => w.id === workerId);

    // 3. Pintamos la información si existe
    if (worker) {
        // Mostramos el contenedor
        workerProfile.style.display = 'block';

        // Llenamos los textos e imágenes
        document.getElementById('wPhoto').src = worker.photo;
        document.getElementById('wName').innerText = worker.name;
        document.getElementById('wJob').innerText = worker.job;
        document.getElementById('wRating').innerText = worker.rating;
        document.getElementById('wReviewsCount').innerText = worker.reviewsCount;
        
        // Link de WhatsApp dinámico
        const whatsappMsg = `Hola ${worker.name}, te vi en HonestWork y me gustaría cotizar un trabajo.`;
        document.getElementById('wContact').href = `https://wa.me/${worker.phone}?text=${encodeURIComponent(whatsappMsg)}`;

        // Llenamos la galería
        const galleryContainer = document.getElementById('wGallery');
        if(worker.gallery && worker.gallery.length > 0) {
            worker.gallery.forEach(imgUrl => {
                galleryContainer.innerHTML += `<img src="${imgUrl}" alt="Trabajo realizado">`;
            });
        } else {
            galleryContainer.innerHTML = '<p>Aún no hay fotos de trabajos.</p>';
        }

        // Llenamos las reseñas
        const reviewsContainer = document.getElementById('wReviewsList');
        if(worker.reviews && worker.reviews.length > 0) {
            worker.reviews.forEach(review => {
                reviewsContainer.innerHTML += `
                    <div class="review-card">
                        <div class="review-stars">★ ${review.stars}</div>
                        <p style="margin: 0 0 10px 0;">"${review.text}"</p>
                        <small style="color: #777;">- ${review.author}</small>
                    </div>
                `;
            });
        }

    } else {
        // Si entran a un ID que no existe (ej. worker.html sin ID o con un ID falso)
        errorMessage.style.display = 'block';
    }
});
