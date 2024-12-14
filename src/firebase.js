const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/USER/OneDrive - Escuela Politécnica Nacional/Universidad/SEXTO SEMESTRE/Ingenieria Software II/Archivos/ProyectoIB-GitAzure/MarketGo-Back/Backend/src/serviceAccountKey.json');// Actualiza la ruta a tu archivo de clave del servicio

// Inicializa la aplicación de Firebase solo si no ha sido inicializada previamente
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
