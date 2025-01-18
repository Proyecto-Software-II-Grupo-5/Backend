// factura.js
const PDFDocument = require('pdfkit');

function generarFacturaPDF() {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Datos de ejemplo
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

module.exports = { generarFacturaPDF };
