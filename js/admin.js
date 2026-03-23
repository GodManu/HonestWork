import { db, storage } from "./firebase-config.js";
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', async () => {
    const pendingList = document.getElementById('pendingList');
    const adminTable = document.getElementById('adminTable');
    const loading = document.getElementById('loading');

    // 1. Cargar trabajadores pendientes
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
                        <span class="id-link" data-path="${worker.idDocumentPath}">Ver Identificación</span>
                    </td>
                    <td>
                        <button class="btn-approve" data-id="${docSnap.id}">Aprobar</button>
                        <button class="btn-reject" data-id="${docSnap.id}">Rechazar</button>
                    </td>
                `;
                pendingList.appendChild(tr);
            });

            // Asignar eventos a los botones recién creados
            addEventListeners();

        } catch (error) {
            console.error("Error al cargar pendientes:", error);
            loading.innerText = "Error de permisos o conexión.";
        }
    };

    const addEventListeners = () => {
        // Botón Ver Identificación
        document.querySelectorAll('.id-link').forEach(link => {
            link.addEventListener('click', async (e) => {
                const path = e.target.getAttribute('data-path');
                try {
                    const url = await getDownloadURL(ref(storage, path));
                    window.open(url, '_blank');
                } catch (err) {
                    alert("No se pudo cargar la imagen. Revisa si el archivo existe.");
                }
            });
        });

        // Botón Aprobar
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.getAttribute('data-id');
                if (confirm("¿Aprobar a este trabajador? Ya será público en la web.")) {
                    await updateDoc(doc(db, "users", userId), { idStatus: "verificado" });
                    loadPendings(); // Recargar lista
                }
            });
        });

        // Botón Rechazar
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.getAttribute('data-id');
                if (confirm("¿Rechazar identificación? No podrá aparecer en búsquedas.")) {
                    await updateDoc(doc(db, "users", userId), { idStatus: "rechazado" });
                    loadPendings(); // Recargar lista
                }
            });
        });
    };

    loadPendings();
});
