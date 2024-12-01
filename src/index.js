const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const admin = require('firebase-admin');
const app = express();

// Inicializar Firebase Admin
const serviceAccount = require('/etc/secrets/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// Ruta para iniciar OAuth
app.get('/auth/google', (req, res) => {
  const redirectUri = 'https://backend-marketgo.onrender.com/auth/google/callback';
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    redirect_uri: redirectUri,
  });
  res.redirect(authUrl);
});

// Ruta para manejar el callback
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const redirectUri = 'https://backend-marketgo.onrender.com/auth/google/callback';

  try {
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    // Verificar si el usuario ya existe en Firebase
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Crear un nuevo usuario
        userRecord = await admin.auth().createUser({
          email,
          displayName: payload.name,
          photoURL: payload.picture,
        });
      } else {
        throw error;
      }
    }

    // Redirigir al frontend con un token o mensaje
    const token = await admin.auth().createCustomToken(userRecord.uid);
    res.redirect(`https://marketgog5.netlify.app/success?token=${token}`);
  } catch (error) {
    console.error('Error during Google OAuth:', error);
    res.redirect('https://marketgog5.netlify.app/error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
