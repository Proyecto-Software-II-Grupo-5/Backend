const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

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

// Función para generar el PDF con datos dinámicos
function generarFacturaPDF(facturaData) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Datos de la factura
        const { numero, fecha, cliente, direccion, productos, subtotal, iva, total, metodoPago } = facturaData;

        // Crear contenido del PDF
        doc.fontSize(16).text('Factura de Venta - MARKETGO', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Número de Factura: ${numero}`);
        doc.text(`Fecha: ${fecha}`);
        doc.text(`Cliente: ${cliente}`);
        doc.text(`Dirección: ${direccion}`);
        doc.text(`Método de Pago: ${metodoPago}`);
        doc.moveDown();

        doc.text('Productos:');
        doc.moveDown();
        productos.forEach((producto) => {
            doc.text(
                `${producto.name} - Cantidad: ${producto.quantity} - Precio Unitario: $${producto.price.toFixed(2)} - Total: $${producto.total}`
            );
        });
        doc.moveDown();
        doc.text(`Subtotal: $${subtotal.toFixed(2)}`);
        doc.text(`IVA: $${iva.toFixed(2)}`);
        doc.text(`Total: $${total.toFixed(2)}`);

        doc.end(); // Finalizar el documento
    });
}

// Función para enviar el correo con el PDF adjunto
async function enviarCorreoConPDF(to, facturaData) {
    if (!to) {
        throw new Error('Falta el correo del destinatario');
    }

    try {
        // Generar el PDF con los datos dinámicos
        const pdfBuffer = await generarFacturaPDF(facturaData);

        // Enviar el correo con el PDF adjunto
        const info = await transporter.sendMail({
            from: 'marketgo@gmail.com',
            to,
            subject: 'FACTURA MARKETGO',
            html: '<p>Por favor, encuentre adjunta su factura.</p>',
            attachments: [
                {
                    filename: 'factura.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        });

        return { message: 'Correo enviado exitosamente', info };
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        throw new Error(`Error al enviar el correo: ${error.message}`);
    }
}

module.exports = { enviarCorreoConPDF };
