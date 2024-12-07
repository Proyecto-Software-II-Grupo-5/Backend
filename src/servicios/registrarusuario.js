const express = require('express');
const router = express.Router();
const axios = require('axios');
const admin = require('firebase-admin');
const comprobarUsuario = require('./comprobarusuario');

router.get('/', (req, res) => { res.send('El servicio de iniciar sesión está funcionando correctamente.'); });

router.post('/', async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verificar el token usando el servicio de verificación
    const response = await axios.post('https://backend-marketgo.onrender.com/verifyToken', { idToken });
    const tokenData = response.data;

    if (!tokenData.isValid) {
      return res.status(401).send({ isValid: false, error: 'Token inválido' });
    }

    const { uid, name, email, picture } = tokenData;

    // Verificar si el usuario ya existe usando la función comprobarUsuario
    const usuarioExiste = await comprobarUsuario(uid);

    if (usuarioExiste) {
      return res.status(200).send({ isValid: true, mensaje: 'El usuario ya existe' });
    } else {
      // Registrar el usuario
      const db = admin.firestore();
      const userRef = db.collection('usuarios').doc(uid);

      await userRef.set({ name, email, picture });
      return res.status(200).send({ isValid: true, mensaje: 'Usuario registrado exitosamente' });
    }
  } catch (error) {
    console.error('Error en el proceso de registro:', error);
    return res.status(500).send({ error: 'Error en el proceso de registro' });
  }
});

module.exports = router;

