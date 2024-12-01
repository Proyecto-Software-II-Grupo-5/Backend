const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Validar variables de entorno requeridas
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Error: Faltan las variables de entorno GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET');
    process.exit(1);
}

// Inicializar Firebase Admin SDK
let serviceAccount;
try {
    serviceAccount = require('/etc/secrets/serviceAccountKey.json');
} catch (error) {
    console.error('Error al cargar el archivo de credenciales de Firebase:', error.message);
    process.exit(1);
}
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(cors({
    origin: 'https://marketgog5.netlify.app',
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Ruta para iniciar la autenticación
app.get('/auth', (req, res) => {
    const redirectUri = 'https://backend-marketgo.onrender.com/auth/callback';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
    res.redirect(authUrl);
});

// Ruta de callback para manejar el proceso de autenticación
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('No se recibió el código de autorización');
    }

    try {
        // Intercambiar el código por un token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'https://backend-marketgo.onrender.com/auth/callback',
            grant_type: 'authorization_code',
        });

        const { id_token } = tokenResponse.data;

        // Verificar el token con Firebase
        const decodedToken = await admin.auth().verifyIdToken(id_token);
        console.log('Usuario autenticado:', decodedToken);

        const { email, name } = decodedToken;

        // Verificar si el usuario ya existe o crearlo
        const userRecord = await admin.auth().getUserByEmail(email).catch(async () => {
            return await admin.auth().createUser({
                email,
                displayName: name,
            });
        });

        console.log('Usuario registrado o existente:', userRecord);

        // Configurar una cookie segura
        res.cookie('session', id_token, {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 1000, // 1 hora
        });

        // Redirigir al frontend
        res.redirect('https://marketgog5.netlify.app/main');
    } catch (error) {
        console.error('Error en el intercambio de tokens:', error.response?.data || error.message);
        res.status(500).send('Error en la autenticación');
    }
});

// Servidor escuchando en el puerto configurado
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
