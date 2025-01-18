const express = require('express');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit'); // Importar PDFKit
const router = express.Router();
const { generarFacturaPDF } = require('./facturaPDF'); // Importar la función

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

// Ruta para enviar correo con el PDF adjunto
router.post('/', async (req, res) => {
    const { to } = req.body;

    if (!to) {
        return res.status(400).json({ error: 'Falta el correo del destinatario' });
    }

    try {
        // Generar el PDF llamando a factura.js
        const pdfBuffer = await generarFacturaPDF();

        // Enviar el correo con el PDF adjunto
        const info = await transporter.sendMail({
            from: 'marketgo@gmail.com',
            to,
            subject: 'FACTURA MARKETGO',
            html: `<p>Por favor, encuentre adjunta su factura.</p>`,
            attachments: [
                {
                    filename: 'factura.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        res.status(200).json({ message: 'Correo enviado exitosamente', info });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).json({ error: 'Error al enviar el correo', details: error.message });
    }
});

module.exports = router;