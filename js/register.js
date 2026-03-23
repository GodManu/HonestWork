import { auth, db, storage } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // UI: Estado de carga
        submitBtn.innerText = "Verificando y creando cuenta...";
        submitBtn.disabled = true;
        errorMessage.style.display = 'none';

        try {
            // 1. Captura de datos del formulario
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const jobTitle = document.getElementById('jobTitle').value.trim();
            const phone = document.getElementById('phone').value.trim(); // Nuevo campo
            const idNumber = document.getElementById('idNumber').value.trim().toUpperCase();
            const password = document.getElementById('password').value;
            const idPhotoFile = document.getElementById('idPhoto').files[0];

            if (!idPhotoFile) {
                throw new Error("Debes subir una foto de tu identificación.");
            }

            // -------------------------------------------------------------------
            // PASO 1: FILTRO ANTI-DUPLICADOS (Evitar que usen el mismo ID)
            // -------------------------------------------------------------------
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("idNumber", "==", idNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                throw new Error("duplicado");
            }

            // -------------------------------------------------------------------
            // PASO 2: CREAR USUARIO EN AUTHENTICATION
            // -------------------------------------------------------------------
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // -------------------------------------------------------------------
            // PASO 3: SUBIR IDENTIFICACIÓN A STORAGE (Carpeta privada /ids/)
            // -------------------------------------------------------------------
            const storagePath = `ids/${user.uid}/${idPhotoFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, idPhotoFile);

            // -------------------------------------------------------------------
            // PASO 4: PEQUEÑA PAUSA (Para que Firebase asimile la sesión)
            // -------------------------------------------------------------------
            await new Promise(resolve => setTimeout(resolve, 800));

            // -------------------------------------------------------------------
            // PASO 5: CREAR DOCUMENTO EN FIRESTORE (Colección "users")
            // -------------------------------------------------------------------
            // Limpiamos el teléfono por si pusieron guiones o paréntesis
            const cleanPhone = phone.replace(/\D/g, ''); 

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: fullName,
                email: email,
                phone: cleanPhone,      // Guardamos el teléfono real
                job: jobTitle,
                idNumber: idNumber,
                idDocumentPath: storagePath, 
                profilePhoto: "https://via.placeholder.com/150", // Placeholder inicial
                idStatus: "pendiente",  // Estado inicial para revisión
                rating: 0,
                reviewsCount: 0,
                workPhotos: [],         // Galería vacía al inicio
                createdAt: new Date()
            });

            alert('¡Registro exitoso! Ahora espera a que el administrador verifique tu cuenta.');
            window.location.href = 'profile.html';

        } catch (error) {
            console.error("Error completo:", error);
            errorMessage.style.display = 'block';
            
            // Mensajes personalizados para el usuario
            if (error.message === "duplicado") {
                errorMessage.innerText = "Este número de identificación ya está registrado.";
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage.innerText = "Este correo electrónico ya está en uso.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage.innerText = "La contraseña es muy débil (mínimo 6 caracteres).";
            } else if (error.code === 'permission-denied') {
                errorMessage.innerText = "Error de permisos en el servidor. Contacta a soporte.";
            } else {
                errorMessage.innerText = "Error: " + (error.message || "No se pudo completar el registro.");
            }
        } finally {
            submitBtn.innerText = "Crear Cuenta y Enviar a Verificación";
            submitBtn.disabled = false;
        }
    });
});
