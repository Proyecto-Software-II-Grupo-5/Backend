const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000; 

app.get('/', (req, res) => {
    res.send('¡Hola, mundo! Tu servidor está funcionando.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});