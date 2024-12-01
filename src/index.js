const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');
require('dotenv').config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Error: Faltan las variables de entorno GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

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

app.get('/auth', (req, res) => {
  const redirectUri = `https://backend-marketgo.onrender.com/auth/callback`;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No se recibió el código de autorización');
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://backend-marketgo.onrender.com/auth/callback',
      grant_type: 'authorization_code',
    });

    const { id_token } = tokenResponse.data;
    const decodedToken = await admin.auth().verifyIdToken(id_token);
    console.log('Usuario autenticado:', decodedToken);

    // Evitar pasar el token en la URL por seguridad
    res.cookie('token', id_token, { httpOnly: true, secure: true });
    res.redirect('https://marketgog5.netlify.app/main');
  } catch (error) {
    console.error('Error en el intercambio de tokens:', error.response?.data || error.message || error);
    res.status(500).send('Error en la autenticación');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
