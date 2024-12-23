const express = require('express');
const router = express.Router();
const admin = require('../firebase');

router.post('/', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const db = admin.firestore();
    const userRef = db.collection('usuario').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return res.status(200).send({
        isValid: true,
        mensaje: 'El usuario ya existe',
        usuario: userData,
      });
    }

    return res.status(200).send({
      isValid: false,
      mensaje: 'El usuario no existe',
    });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return res.status(500).send({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
