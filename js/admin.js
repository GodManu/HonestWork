import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const pendingList = document.getElementById('pendingList');
    const adminTable = document.getElementById('adminTable');
    const loading = document.getElementById('loading');

    // ==========================================
    // 1. EL "CADENERO": VERIFICAR SI ES ADMIN
    // ==========================================
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const adminRef = doc(db, "users", user.uid);
                const adminSnap = await getDoc(adminRef);

                if (adminSnap.exists() && adminSnap.data().isAdmin === true) {
                    console.log("Acceso concedido: Eres administrador.");
                    loadPendings(); // Si es admin, cargamos la lista
                } else {
                    alert("Acceso denegado. No tienes permisos de administrador.");
                    window.location.href = "index.html";
                }
            } catch (error) {
                console.error("Error al verificar permisos:", error);
                window.location.href = "index.html";
            }
        } else {
            // Si ni siquiera está logueado, al login
            window.location.href = "login.html";
        }
    });

    // ==========================================
    // 2. CARGAR TRABAJADORES PENDIENTES
    // ==========================================
    const loadPendings = async () => {
        try {
            const q = query(collection(db, "users"), where("idStatus", "==", "pendiente"));
            const querySnapshot = await getDocs(q);
            
            pendingList.innerHTML = "";
            
            if (querySnapshot.empty) {
                loading.innerText = "No hay trabajadores pendientes de verificación. ✅";
                adminTable.style.display = "none";
                return;
            }

            loading.style.display = "none";
            adminTable.style.display = "table";

            querySnapshot.forEach((docSnap) => {
                const worker = docSnap.data();
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>
                        <strong>${worker.name}</strong><br>
                        <small>${worker.email}</small>
                    </td>
                    <td>${worker.job}</td>
                    <td><code>${worker.idNumber}</code></td>
                    <td>
                        <span class="id-link" data-path="${worker.idDocumentPath}" style="color: blue; text-decoration: underline; cursor: pointer;">
                            Ver Identificación
                        </span>
                    </td>
                    <td>
                        <button class="btn-approve" data-id="${docSnap.id}" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Aprobar</button>
                        <button class="btn-reject" data-id="${docSnap.id}" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px;">Rechazar</button>
                    </td>
                `;
                pendingList.appendChild(tr);
            });

            addEventListeners();

        } catch (error) {
            console.error("Error al cargar pendientes:", error);
            loading.innerText = "Error de permisos. Asegúrate de tener isAdmin: true en tu perfil de Firestore.";
        }
    };

    // ==========================================
    // 3. ACCIONES DE LOS BOTONES
    // ==========================================
    const addEventListeners = () => {
        // Ver Identificación
        document.querySelectorAll('.id-link').forEach(link => {
            link.onclick = async (e) => {
                const path = e.target.getAttribute('data-path');
                try {
                    const url = await getDownloadURL(ref(storage, path));
                    window.open(url, '_blank');
                } catch (err) {
                    alert("No se pudo cargar la imagen. Es posible que el archivo no exista o las reglas de Storage lo bloqueen.");
                }
            };
        });

        // Aprobar
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.onclick = async (e) => {
                const userId = e.target.getAttribute('data-id');
                if (confirm("¿Aprobar a este trabajador?")) {
                    try {
                        await updateDoc(doc(db, "users", userId), { idStatus: "verificado" });
                        alert("Trabajador aprobado con éxito.");
                        loadPendings(); 
                    } catch (err) {
                        alert("Error al aprobar: " + err.message);
                    }
                }
            };
        });

        // Rechazar
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.onclick = async (e) => {
                const userId = e.target.getAttribute('data-id');
                if (confirm("¿Rechazar esta identificación?")) {
                    try {
                        await updateDoc(doc(db, "users", userId), { idStatus: "rechazado" });
                        alert("Trabajador rechazado.");
                        loadPendings();
                    } catch (err) {
                        alert("Error al rechazar: " + err.message);
                    }
                }
            };
        });
    };
});
