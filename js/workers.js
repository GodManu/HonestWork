document.addEventListener('DOMContentLoaded', () => {
    
    // SIMULADOR DE BASE DE DATOS: Lista de trabajadores verificados
    const workersData = [
        { id: 1, name: "Carlos López", job: "Plomero", rating: 4.8, reviews: 34, photo: "https://i.pravatar.cc/150?img=11", verified: true },
        { id: 2, name: "María González", job: "Electricista", rating: 4.9, reviews: 52, photo: "https://i.pravatar.cc/150?img=5", verified: true },
        { id: 3, name: "Juan Pérez", job: "Carpintero", rating: 4.2, reviews: 15, photo: "https://i.pravatar.cc/150?img=12", verified: true },
        { id: 4, name: "Ana Silva", job: "Limpieza", rating: 5.0, reviews: 89, photo: "https://i.pravatar.cc/150?img=9", verified: true },
        { id: 5, name: "Roberto Gómez", job: "Jardinero", rating: 4.5, reviews: 22, photo: "https://i.pravatar.cc/150?img=15", verified: true },
        { id: 6, name: "Luis Martínez", job: "Pintor", rating: 3.8, reviews: 8, photo: "https://i.pravatar.cc/150?img=13", verified: true }
    ];

    const workersContainer = document.getElementById('workersContainer');
    const searchInput = document.getElementById('searchInput');
    const ratingFilter = document.getElementById('ratingFilter');

    // Función para dibujar las tarjetas de los trabajadores
    function renderWorkers(workers) {
        workersContainer.innerHTML = ''; // Limpiamos el contenedor

        if (workers.length === 0) {
            workersContainer.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">No se encontraron trabajadores con esos criterios.</p>';
            return;
        }

        workers.forEach(worker => {
            // Solo mostramos a los que pasaron tu filtro de seguridad (verificados)
            if (worker.verified) {
                const card = document.createElement('div');
                card.className = 'worker-card';
                card.innerHTML = `
                    <img src="${worker.photo}" alt="Foto de ${worker.name}">
                    <h3>${worker.name}</h3>
                    <p style="color: #666; margin-bottom: 5px;">${worker.job}</p>
                    <div class="verified-badge">
                        <span>✔️ Verificado con ID</span>
                    </div>
                    <div class="rating">
                        ★ ${worker.rating} <span style="color: #999; font-size: 0.8em;">(${worker.reviews} reseñas)</span>
                    </div>
                    <a href="worker.html?id=${worker.id}" class="btn-view">Ver Perfil</a>
                `;
                workersContainer.appendChild(card);
            }
        });
    }

    // Función para filtrar en tiempo real
    function filterWorkers() {
        const searchTerm = searchInput.value.toLowerCase();
        const minRating = parseFloat(ratingFilter.value);

        const filtered = workersData.filter(worker => {
            // Busca si el texto coincide con el nombre o el oficio
            const matchesSearch = worker.name.toLowerCase().includes(searchTerm) || worker.job.toLowerCase().includes(searchTerm);
            // Revisa si cumple con las estrellas mínimas
            const matchesRating = worker.rating >= minRating;

            return matchesSearch && matchesRating;
        });

        renderWorkers(filtered);
    }

    // Escuchar cuando el usuario escribe o cambia el filtro
    searchInput.addEventListener('input', filterWorkers);
    ratingFilter.addEventListener('change', filterWorkers);

    // Cargar todos los trabajadores al iniciar la página
    renderWorkers(workersData);
});
