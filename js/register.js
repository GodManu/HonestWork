import { auth, db, storage } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // Cambiamos el texto del botón para que el usuario sepa que está cargando
        submitBtn.innerText = "Procesando y verificando...";
        submitBtn.disabled = true;
        errorMessage.style.display = 'none';

        try {
            // 1. Capturamos los datos del formulario
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const jobTitle = document.getElementById('jobTitle').value.trim();
            const idNumber = document.getElementById('idNumber').value.trim().toUpperCase();
            const password = document.getElementById('password').value;
            const idPhotoFile = document.getElementById('idPhoto').files[0];

            // -------------------------------------------------------------------
            // PASO 1: FILTRO ANTI-DUPLICADOS (El control de acceso principal)
            // -------------------------------------------------------------------
            const workersRef = collection(db, "workers");
            const q = query(workersRef, where("idNumber", "==", idNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Si la consulta no está vacía, significa que ese número ya está registrado. ¡Bloqueamos el paso!
                throw new Error("duplicado");
            }

            // -------------------------------------------------------------------
            // PASO 2: CREAR LA CUENTA (Dar de alta en el sistema)
            // -------------------------------------------------------------------
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

           // -------------------------------------------------------------------
            // PASO 3: SUBIR LA FOTO (Guardar evidencia en la bóveda segura)
            // -------------------------------------------------------------------
            // Usamos la carpeta "ids" para que coincida con tus reglas
            const storagePath = `ids/${user.uid}/${idPhotoFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, idPhotoFile);

            // ⚠️ ELIMINAMOS la petición de la URL pública porque tus reglas 
            // de alta seguridad protegen este archivo. Solo guardaremos la ruta.

            // -------------------------------------------------------------------
            // PASO 4: GUARDAR EL PERFIL (Crear el expediente del trabajador)
            // -------------------------------------------------------------------
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: fullName,
                email: email,
                job: jobTitle,
                idNumber: idNumber,
                idDocumentPath: storagePath, // Guardamos la RUTA interna, no una URL pública
                profilePhoto: "https://via.placeholder.com/150", 
                idStatus: "pendiente",
                rating: 0,
                reviewsCount: 0,
                createdAt: new Date()
            });

            // ¡Éxito! Limpiamos y redirigimos
            alert('¡Registro exitoso! Tu perfil ha sido enviado a revisión.');
            registerForm.reset();
            window.location.href = 'profile.html';

        } catch (error) {
            console.error("Error en el registro:", error);
            errorMessage.style.display = 'block';
            
            // Personalizamos el mensaje dependiendo del error
            if (error.message === "duplicado") {
                errorMessage.innerText = `Atención: La identificación ${document.getElementById('idNumber').value.trim().toUpperCase()} ya está vinculada a una cuenta existente. Contacta a soporte.`;
                document.getElementById('idNumber').style.border = '2px solid red';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage.innerText = "Este correo electrónico ya está registrado.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage.innerText = "La contraseña debe tener al menos 6 caracteres.";
            } else {
                errorMessage.innerText = "Ocurrió un error al procesar tu solicitud. Intenta de nuevo.";
            }
        } finally {
            // Regresamos el botón a la normalidad
            submitBtn.innerText = "Crear Cuenta y Enviar a Verificación";
            submitBtn.disabled = false;
        }
    });
});
