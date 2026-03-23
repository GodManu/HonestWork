document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // SIMULADOR DE BASE DE DATOS: Usuarios válidos
    const usuariosRegistrados = [
        { email: "juan@ejemplo.com", password: "password123" },
        { email: "maria@ejemplo.com", password: "segura456" }
    ];

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evitamos que la página se recargue

        const emailIngresado = document.getElementById('email').value.trim();
        const passwordIngresado = document.getElementById('password').value;

        // Buscamos si existe un usuario que coincida con ese correo Y esa contraseña
        const usuarioValido = usuariosRegistrados.find(
            user => user.email === emailIngresado && user.password === passwordIngresado
        );

        if (usuarioValido) {
            // ¡Acceso concedido! 
            loginError.style.display = 'none';
            
            // En una app real, aquí guardarías un "Token" de sesión segura
            console.log("Acceso autorizado para:", emailIngresado);
            
            // Redirigimos al trabajador a su panel de control
            window.location.href = 'profile.html';
        } else {
            // Acceso denegado: mostramos la alerta
            loginError.style.display = 'block';
            
            // Limpiamos solo el campo de la contraseña por comodidad
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    });
});
