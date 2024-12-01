const express = require('express');
const admin = require('firebase-admin');
const fs = require('fs'); // Para leer el archivo desde el sistema de archivos

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta al archivo secreto en Render
const serviceAccountPath = '/etc/secrets/serviceAccountKey.json';

// Inicializar Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

const PORT = process.env.PORT || 3000; // Render define PORT

// Ruta principal
app.get('/', (req, res) => {
    res.send('¡Hola, mundo! Tu servidor está funcionando.');
});

// Endpoint para verificar si un usuario está registrado
app.post('/api/isUserRegistered', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).send({ error: 'Email es requerido.' });

    try {
        // Buscar el documento del usuario por email
        const userDoc = await db.collection('users').doc(email).get();
        if (userDoc.exists) {
            return res.status(200).send({ registered: true });
        } else {
            return res.status(200).send({ registered: false });
        }
    } catch (error) {
        console.error('Error verificando registro:', error);
        return res.status(500).send({ error: 'Error interno del servidor.' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
