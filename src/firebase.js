//firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('/etc/secrets/serviceAccountKey.json');// Actualiza la ruta a tu archivo de clave del servicio

// Inicializa la aplicación de Firebase solo si no ha sido inicializada previamente
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
