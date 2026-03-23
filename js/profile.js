document.addEventListener('DOMContentLoaded', () => {
    
    // SIMULADOR DE SESIÓN: Imaginamos que este es el usuario logueado actualmente
    const currentUser = {
        name: "Juan Pérez",
        job: "Carpintero",
        photo: "https://i.pravatar.cc/150?img=12",
        rating: 0, // Aún no tiene trabajos
        reviews: 0,
        // ¡Ojo aquí! Cambia esto a true o false para ver cómo cambia la pantalla
        isVerified: false 
    };

    // Llenamos la interfaz con los datos del usuario
    document.getElementById('userName').innerText = currentUser.name;
    document.getElementById('userJob').innerText = currentUser.job;
    document.getElementById('userPhoto').src = currentUser.photo;
    document.getElementById('userRating').innerText = currentUser.rating;
    document.getElementById('userReviewsCount').innerText = currentUser.reviews;

    // Lógica del filtro de seguridad (El Banner)
    const statusBanner = document.getElementById('verificationStatus');
    
    if (currentUser.isVerified) {
        // Si ya fue aprobado por el administrador
        statusBanner.className = 'status-banner status-verified';
        statusBanner.innerHTML = '✔️ Identidad Verificada. Tu perfil ya es visible para los clientes.';
        // Aquí podrías habilitar el botón de subir fotos
    } else {
        // Si sigue en revisión
        statusBanner.className = 'status-banner status-pending';
        statusBanner.innerHTML = '⏳ Tu identificación está en revisión. Aún no apareces en las búsquedas públicas.';
    }

    // Botón de cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        alert("Cerrando sesión...");
        window.location.href = 'login.html';
    });

});
