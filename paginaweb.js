
// paginaweb.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname)));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// Ruta para cargar el segundo proyecto
app.get('/web_ciberadiccion', (req, res) => {
    const { spawn } = require('child_process');
    const ls = spawn('node', ['../servidorPrueba/server.js']);

    ls.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ls.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    res.send("Proyecto cargado correctamente.");
});

// Nueva ruta para manejar la solicitud del botón
app.get('/cargar-segundo-proyecto', (req, res) => {
    // Redirigir a la ruta que carga el segundo proyecto
    res.redirect('/web_ciberadiccion');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
