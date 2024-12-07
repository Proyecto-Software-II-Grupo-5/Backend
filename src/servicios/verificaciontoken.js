const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const serviceAccount = require('/etc/secrets/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

router.post('/', async (req, res) => {
  const idToken = req.body.idToken;

  console.log('ID Token recibido:', idToken);

  if (typeof idToken !== 'string') {
    return res.status(400).send({ isValid: false, error: 'El ID token debe ser una cadena de texto' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token decodificado:', decodedToken);
    res.status(200).send({ isValid: true, uid: decodedToken.uid, name: decodedToken.name, email: decodedToken.email, picture: decodedToken.picture });
  } catch (error) {
    console.error('Error al verificar el token:', error);
    res.status(401).send({ isValid: false, error: error.message });
  }
});

module.exports = router;

