import { db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    const workersContainer = document.getElementById('workersContainer');
    const searchInput = document.getElementById('searchInput');
    const ratingFilter = document.getElementById('ratingFilter');
    let allWorkers = []; // Aquí guardaremos los datos que traigamos de Firebase

    // 1. FUNCIÓN PARA CARGAR TRABAJADORES VERIFICADOS DESDE FIRESTORE
    const fetchVerifiedWorkers = async () => {
        try {
            workersContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Buscando profesionales confiables...</p>';

            // Filtro de Seguridad: Solo traemos a los que TÚ ya aprobaste
            const q = query(collection(db, "users"), where("idStatus", "==", "verificado"));
            const querySnapshot = await getDocs(q);
            
            allWorkers = [];
            querySnapshot.forEach((doc) => {
                allWorkers.push({ id: doc.id, ...doc.data() });
            });

            renderWorkers(allWorkers);

        } catch (error) {
            console.error("Error al cargar trabajadores:", error);
            workersContainer.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">Error al conectar con la base de datos.</p>';
        }
    };

    // 2. FUNCIÓN PARA DIBUJAR LAS TARJETAS (Renderizar)
    function renderWorkers(workers) {
        workersContainer.innerHTML = ''; 

        if (workers.length === 0) {
            workersContainer.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; color: #666;">No se encontraron profesionales que coincidan con tu búsqueda.</p>';
            return;
        }

        workers.forEach(worker => {
            const card = document.createElement('div');
            card.className = 'worker-card';
            
            // Aseguramos que la calificación sea un número decimal
            const rating = parseFloat(worker.rating) || 0;

            card.innerHTML = `
                <img src="${worker.profilePhoto || 'https://via.placeholder.com/150'}" alt="Foto de ${worker.name || 'Profesional'}">
                <h3 style="margin: 5px 0;">${worker.name || 'Sin nombre'}</h3>
                <p style="color: #666; margin-bottom: 5px;">${worker.job || 'Oficio no definido'}</p>
                
                <div class="verified-badge">
                    ✔️ Perfil Verificado
                </div>
                
                <div class="rating">
                    ★ ${rating.toFixed(1)} <span style="color: #999; font-size: 0.8em; font-weight: normal;">(${worker.reviewsCount || 0} reseñas)</span>
                </div>
                
                <a href="worker.html?id=${worker.id}" class="btn-view">Ver Perfil</a>
            `;
            workersContainer.appendChild(card);
        });
    }

    // 3. FILTRO EN TIEMPO REAL (Buscador)
    const filterWorkers = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const minRating = parseFloat(ratingFilter.value) || 0;

        const filtered = allWorkers.filter(worker => {
            // Usamos || "" para evitar errores si el nombre u oficio están vacíos en la base de datos
            const nameMatch = (worker.name || "").toLowerCase().includes(searchTerm);
            const jobMatch = (worker.job || "").toLowerCase().includes(searchTerm);
            
            const matchesSearch = nameMatch || jobMatch;
            const matchesRating = (parseFloat(worker.rating) || 0) >= minRating;
            
            return matchesSearch && matchesRating;
        });

        renderWorkers(filtered);
    };

    // Eventos del buscador
    searchInput.addEventListener('input', filterWorkers);
    ratingFilter.addEventListener('change', filterWorkers);

    // Arrancamos la carga inicial
    fetchVerifiedWorkers();
});
