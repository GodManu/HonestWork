// Esperamos a que todo el HTML de la página cargue
document.addEventListener('DOMContentLoaded', () => {
    
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    // SIMULADOR DE BASE DE DATOS: 
    // Imagina que estas son las identificaciones (CURP o INE) de personas que ya tienen cuenta.
    // Más adelante, esto se cambiará por una consulta real a tu servidor.
    const identificacionesRegistradas = [
        'CURP1234567890', 
        'INE987654321', 
        '12345678'
    ];

    registerForm.addEventListener('submit', (e) => {
        // 1. Detenemos el envío automático del formulario para poder revisar los datos primero
        e.preventDefault(); 

        // 2. Capturamos lo que el usuario escribió (lo pasamos a mayúsculas para evitar errores)
        const fullName = document.getElementById('fullName').value.trim();
        const idNumber = document.getElementById('idNumber').value.trim().toUpperCase();
        const idPhoto = document.getElementById('idPhoto').files[0];

        // 3. Filtro de Seguridad (Buscamos duplicados)
        if (identificacionesRegistradas.includes(idNumber)) {
            
            // ¡Alerta de duplicado! Mostramos el mensaje de error y bloqueamos el registro
            errorMessage.style.display = 'block';
            errorMessage.innerText = `Atención: La identificación ${idNumber} ya está vinculada a una cuenta existente. Si es un error, contacta a soporte.`;
            
            // Pintamos el borde del input en rojo para que el usuario sepa dónde está el problema
            document.getElementById('idNumber').style.border = '2px solid red';
            
        } else {
            
            // 4. Todo en orden: Ocultamos errores y simulamos la creación de la cuenta
            errorMessage.style.display = 'none';
            document.getElementById('idNumber').style.border = '1px solid #ccc';
            
            // Aquí en el futuro enviarás la foto (idPhoto) y los datos a tu servidor seguro
            console.log("Subiendo documento de:", fullName);
            console.log("Archivo adjunto:", idPhoto.name);
            
            // Mensaje de éxito temporal
            alert('¡Identificación validada! Tu cuenta ha sido creada y pasará a revisión por soporte.');
            
            // Limpiamos el formulario y podríamos redirigirlo al inicio de sesión
            registerForm.reset();
            // window.location.href = 'login.html'; 
        }
    });
});
