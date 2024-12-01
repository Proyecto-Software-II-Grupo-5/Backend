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

app.use(cors({ origin: 'https://marketgog5.netlify.app', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Ruta para iniciar la autenticación
app.get('/auth', (req, res) => {
  const redirectUri = `https://backend-marketgo.onrender.com/auth/callback`;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;

  res.redirect(authUrl);
});

// Ruta de callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No se recibió el código de autorización');
  }

  try {
    // Intercambia el código por un token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://backend-marketgo.onrender.com/auth/callback',
      grant_type: 'authorization_code',
    });

    const { id_token } = tokenResponse.data;

    // Decodificar el token si es necesario
    const decodedToken = await admin.auth().verifyIdToken(id_token);
    console.log('Usuario autenticado:', decodedToken);

    // Redirigir al frontend con el token en los parámetros de la URL
    res.redirect(`https://marketgog5.netlify.app/main?token=${id_token}`);
  } catch (error) {
    console.error('Error en el intercambio de tokens:', error.response?.data || error.message || error);

    // Mostrar las credenciales usadas solo en entorno de desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.error('Credenciales utilizadas:', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET ? 'Configurado' : 'No configurado',
      });
    }

    res.status(500).send('Error en la autenticación');
  }
});

// Servidor escuchando en el puerto configurado
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
