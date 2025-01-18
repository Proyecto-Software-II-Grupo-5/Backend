const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configuración de transporte para nodemailer
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: 'gmail', // Usando Gmail, puedes cambiarlo si usas otro servicio
    secure: true,
  auth: {
    user: process.env.EMAIL_API_GMAIL, // Correo del emisor
    pass: process.env.EMAIL_API_PASSWORD // Contraseña o clave de aplicación de Gmail
  }
});

// Ruta para enviar correo
router.post('/', async (req, res) => {
  const { to } = req.body; // Recibe el correo del destinatario

  if (!to) {
    return res.status(400).json({ error: 'Falta el correo del destinatario' });
  }

  try {
    const info = await transporter.sendMail({
      from: 'marketgo@gmail.com', // Correo del emisor
      to, // Correo del destinatario
      subject: 'FACTURA MARKETGO', // Asunto fijo
      html: `
        <p>Aquí está su link:</p>
        <a href="https://www.youtube.com/watch?v=rM4lthSYVhE&list=RDGMEMveQBJ5EaHfODz2alVFs-IQVMrM4lthSYVhE&start_radio=1">
          Ver video
        </a>
      ` // Mensaje HTML con el link
    });

    res.status(200).json({ message: 'Correo enviado exitosamente', info });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ error: 'Error al enviar el correo', details: error.message });
  }
});

module.exports = router;
