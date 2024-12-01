const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('process.env.GOOGLE_CLIENT_ID');

app.get('/auth/google', async (req, res) => {
    const redirectUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
    });
    res.redirect(redirectUrl);
});
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;

  try {
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Verificar el token y obtener datos del usuario
      const ticket = await client.verifyIdToken({
          idToken: tokens.id_token,
          audience: 'process.env.GOOGLE_CLIENT_ID',
      });
      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      // Registrar o verificar usuario en Firebase
      const userRecord = await admin.auth().getUserByEmail(email).catch(async (error) => {
          if (error.code === 'auth/user-not-found') {
              return await admin.auth().createUser({
                  email,
                  displayName: name,
                  photoURL: picture,
              });
          }
          throw error;
      });

      // Enviar respuesta al frontend
      res.redirect(`https://marketgog5.netlify.app?token=${tokens.id_token}`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Authentication failed');
  }
});
