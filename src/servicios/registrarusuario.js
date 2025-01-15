//registrarusuario.js
const express = require('express');
const router = express.Router();
const verificarYRegistrarUsuario = require('./usuarioHandler');

router.post('/', async (req, res) => {
  const { idToken } = req.body;

  try {
    const response = await verificarYRegistrarUsuario(idToken, true);
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({ error: 'Error en el registro de usuario' });
  }
});

module.exports = router;
