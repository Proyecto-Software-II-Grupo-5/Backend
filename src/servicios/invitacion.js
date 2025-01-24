const express = require('express');
const nodemailer = require('nodemailer');

// Configuración de transporte para nodemailer
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: 'gmail',
    secure: true,
    auth: {
        user: process.env.EMAIL_API_GMAIL,
        pass: process.env.EMAIL_API_PASSWORD
    }
});

// Crear un router para el endpoint
const router = express.Router();

// Ruta para enviar la invitación
router.post('/', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Falta el correo del destinatario' });
    }

    try {
        const info = await transporter.sendMail({
            from: 'https://marketgog5.netlify.app',
            to: email,
            subject: 'Invitación a MarketGo',
            html: `<p>¡Únete a MarketGo! Haz clic en el siguiente enlace para acceder:</p>
                   <a href="https://marketgog5.netlify.app">MarketGo</a>`,
        });

        res.status(200).json({
            message: 'Invitación enviada exitosamente',
            info,
        });
    } catch (error) {
        console.error('Error al enviar la invitación:', error);
        res.status(500).json({ error: `Error al enviar la invitación: ${error.message}` });
    }
});

module.exports = router;
