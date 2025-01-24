const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

// Ruta para buscar todos los administradores
router.get('/', async (req, res) => {
  try {
    const usuariosRef = db.collection('usuario');
    const snapshot = await usuariosRef.where('rol', '==', 'administrador').get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'No se encontraron administradores.' });
    }

    const administradores = [];
    snapshot.forEach((doc) => {
      administradores.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ administradores });
  } catch (error) {
    console.error('Error al buscar administradores:', error);
    res.status(500).json({ error: 'Error al buscar administradores.' });
  }
});

module.exports = router;
