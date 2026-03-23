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

        submitBtn.innerText = "Verificando identidad...";
        submitBtn.disabled = true;
        errorMessage.style.display = 'none';

        try {
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const jobTitle = document.getElementById('jobTitle').value.trim();
            const idNumber = document.getElementById('idNumber').value.trim().toUpperCase();
            const password = document.getElementById('password').value;
            const idPhotoFile = document.getElementById('idPhoto').files[0];

            // -------------------------------------------------------------------
            // PASO 1: FILTRO ANTI-DUPLICADOS (Cambiado a colección "users")
            // -------------------------------------------------------------------
            const usersRef = collection(db, "users"); // <--- DEBE SER "users"
            const q = query(usersRef, where("idNumber", "==", idNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                throw new Error("duplicado");
            }

            // -------------------------------------------------------------------
            // PASO 2: CREAR LA CUENTA
            // -------------------------------------------------------------------
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // -------------------------------------------------------------------
            // PASO 3: SUBIR LA FOTO (ids/)
            // -------------------------------------------------------------------
            const storagePath = `ids/${user.uid}/${idPhotoFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, idPhotoFile);

            // -------------------------------------------------------------------
            // PASO 4: ESPERA DE SEGURIDAD
            // -------------------------------------------------------------------
            await new Promise(resolve => setTimeout(resolve, 800));

            // -------------------------------------------------------------------
            // PASO 5: GUARDAR EL PERFIL
            // -------------------------------------------------------------------
            const userDocRef = doc(db, "users", user.uid);
            
            await setDoc(userDocRef, {
                uid: user.uid,
                name: fullName,
                email: email,
                job: jobTitle,
                idNumber: idNumber,
                idDocumentPath: storagePath, 
                profilePhoto: "https://via.placeholder.com/150", 
                idStatus: "pendiente", 
                rating: 0,
                reviewsCount: 0,
                createdAt: new Date()
            });
            
            alert('¡Registro exitoso! Tu perfil está en revisión.');
            window.location.href = 'profile.html';

        } catch (error) {
            console.error("Error detallado:", error);
            errorMessage.style.display = 'block';
            
            if (error.message === "duplicado") {
                errorMessage.innerText = `Esta identificación ya está registrada.`;
            } else if (error.code === 'permission-denied') {
                errorMessage.innerText = "Error de permisos. Revisa las reglas de Firestore.";
            } else {
                errorMessage.innerText = "Error al procesar: " + (error.code || error.message);
            }
        } finally {
            submitBtn.innerText = "Crear Cuenta";
            submitBtn.disabled = false;
        }
    });
});
