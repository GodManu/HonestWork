import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitamos que la página se recargue

        // Capturamos los datos
        const emailIngresado = document.getElementById('email').value.trim();
        const passwordIngresado = document.getElementById('password').value;

        try {
            // Ocultamos el error por si estaba visible de un intento anterior
            if (loginError) loginError.style.display = 'none';

            // 1. CONEXIÓN REAL CON FIREBASE
            // Aquí Firebase revisa si el correo y contraseña existen en tu proyecto
            const userCredential = await signInWithEmailAndPassword(auth, emailIngresado, passwordIngresado);
            
            console.log("Acceso autorizado para:", userCredential.user.email);
            
            // 2. REDIRECCIÓN
            // Si la contraseña es correcta, lo mandamos a su perfil
            window.location.href = 'profile.html';

        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            
            // 3. MANEJO DE ERRORES REALES
            if (loginError) {
                loginError.style.display = 'block';
                
                // Traducimos los códigos de error de Firebase para el usuario
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    loginError.innerText = "La contraseña o el correo son incorrectos.";
                } else if (error.code === 'auth/user-not-found') {
                    loginError.innerText = "No existe ninguna cuenta registrada con este correo.";
                } else if (error.code === 'auth/too-many-requests') {
                    loginError.innerText = "Demasiados intentos fallidos. Intenta de nuevo más tarde.";
                } else {
                    loginError.innerText = "Error de conexión. Intenta de nuevo.";
                }
            }
            
            // Limpiamos solo el campo de la contraseña por comodidad
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    });
});
