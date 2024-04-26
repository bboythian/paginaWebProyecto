const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const path = require('path'); // Importa el módulo path aquí
// Directorio público que contiene los archivos estáticos
//app.use(express.static('public'));
// Ruta para acceder al index.html directamente
// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
