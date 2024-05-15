const express = require('express');
const path = require('path');
const webLogin = require('./webLogin');

const app = express();

// Servir archivos estáticos desde el directorio raíz del proyecto
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

// Usar el archivo webLogin.js para manejar la ruta de login
app.use(webLogin);

// Ruta para servir el archivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webServiceApp', 'index.html'));
});

// Ruta para servir el archivo HTML de login
app.get('/ingresar', (req, res) => {
    res.sendFile(path.join(__dirname, 'webServiceApp', 'webLogin.html'));
});

// Ruta para servir el archivo HTML de la página principal después del login
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'webServiceApp', 'webServiceMain.html'));
});

app.listen(8080, () => {
    console.log('Servidor corriendo en http://localhost:8080');
});
