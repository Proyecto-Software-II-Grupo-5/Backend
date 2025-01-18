const nodemailer = require('nodemailer');
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

// Función para enviar el correo con el PDF adjunto
async function enviarCorreoConPDF(to) {
    if (!to) {
        throw new Error('Falta el correo del destinatario');
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

        return { message: 'Correo enviado exitosamente', info };
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        throw new Error(`Error al enviar el correo: ${error.message}`);
    }
}

module.exports = { enviarCorreoConPDF };
