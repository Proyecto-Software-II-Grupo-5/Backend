const { application } = require("express");
const axios = require('axios');

// Leer las variables de entorno desde process.env
const PAYPAL_API = process.env.PAYPAL_API;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;

const createOrder = async (req, res) => {
    const order = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: "100.00"
                }
            },
        ],
        application_context: {
            brand_name: "marketgo",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: `https://backend-marketgo.onrender.com/capture-order`,
            cancel_url: `https://backend-marketgo.onrender.com/cancel-order`,
        }
    };

    try {
        console.log('Iniciando la autenticación con PayPal...');

        // Obtener el token de acceso de PayPal
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');

        const { data: { access_token } } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
            auth: {
                username: PAYPAL_API_CLIENT,
                password: PAYPAL_API_SECRET
            }
        });

        console.log('Token obtenido con éxito:', access_token);

        console.log('Creando la orden en PayPal...');

        // Crear la orden de PayPal
        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, order, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Orden creada con éxito:', response.data);

        const approveLink = response.data.links.find(link => link.rel === 'approve');

        if (!approveLink) {
            return res.status(500).json({ error: 'No se encontró la URL de aprobación de PayPal' });
        }

        // Devuelve la respuesta completa para verificarla
        return res.json({ approveUrl: approveLink.href });
    } catch (error) {
        console.error('Error al crear la orden:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error al crear la orden en PayPal' });
    }
};

const captureOrder = async (req, res) => {
    const { token } = req.query;
    try {
        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {}, {
            auth: {
                username: PAYPAL_API_CLIENT,
                password: PAYPAL_API_SECRET
            }
        });
        console.log(response.data);
        return res.send('Pagado');
    } catch (error) {
        console.error('Error al capturar la orden:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error al capturar la orden en PayPal' });
    }
};

const cancelPayment = (req, res) => res.send('Pago cancelado');

module.exports = { createOrder, captureOrder, cancelPayment };