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

// Función para generar el PDF
function generarFacturaPDF() {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Datos de ejemplo para la factura
        const factura = {
            numero: '001-001-000000123',
            fecha: '2025-01-18',
            cliente: 'Juan Pérez',
            direccion: 'Calle Falsa 123, Ciudad Ficticia',
            productos: [
                { descripcion: 'Producto A', cantidad: 2, precioUnitario: 15.0 },
                { descripcion: 'Producto B', cantidad: 1, precioUnitario: 25.0 },
            ],
            subtotal: 55.0,
            iva: 6.6,
            total: 61.6,
        };

        // Crear contenido del PDF
        doc.fontSize(16).text('Factura de Venta', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Número: ${factura.numero}`);
        doc.text(`Fecha: ${factura.fecha}`);
        doc.text(`Cliente: ${factura.cliente}`);
        doc.text(`Dirección: ${factura.direccion}`);
        doc.moveDown();
        doc.text('Productos:');
        doc.moveDown();
        factura.productos.forEach((producto) => {
            doc.text(
                `${producto.descripcion} - Cantidad: ${producto.cantidad} - Precio Unitario: $${producto.precioUnitario} - Total: $${(
                    producto.cantidad * producto.precioUnitario
                ).toFixed(2)}`
            );
        });
        doc.moveDown();
        doc.text(`Subtotal: $${factura.subtotal.toFixed(2)}`);
        doc.text(`IVA: $${factura.iva.toFixed(2)}`);
        doc.text(`Total: $${factura.total.toFixed(2)}`);

        doc.end(); // Finalizar el documento
    });
}

// Función para enviar el correo con el PDF adjunto
async function enviarCorreoConPDF(to) {
    if (!to) {
        throw new Error('Falta el correo del destinatario');
    }

    try {
        // Generar el PDF
        const pdfBuffer = await generarFacturaPDF();

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
