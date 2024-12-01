const express = require('express');
const cors = require('cors');
const { google } = require('google-auth-library');
const admin = require('firebase-admin');
require('dotenv').config();

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('/etc/secrets/serviceAccountKey.json')),
});

const app = express();

// Configurar CORS
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Configurar cliente de Google OAuth2
const client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `${process.env.BACKEND_URL}/auth/google/callback`
);

// Ruta para redirigir al autenticador de Google
app.get('/auth/google', (req, res) => {
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
  });
  res.redirect(url);
});

// Ruta para manejar el callback y autenticación en Firebase
app.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    // Intercambiar el código por tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Verificar el ID Token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Registrar o autenticar usuario en Firebase
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        user = await admin.auth().createUser({
          email,
          displayName: name,
        });
      } else {
        throw error;
      }
    }

    // Redirigir al frontend con el UID del usuario
    res.redirect(`${process.env.FRONTEND_URL}/main?user=${user.uid}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during authentication');
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
