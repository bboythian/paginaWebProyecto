const express = require('express');
const dynamicRouter = express.Router();
const { spawn } = require('child_process');

let activeProject = null;

// Middleware para controlar el proyecto activo
dynamicRouter.use((req, res, next) => {
    if (!activeProject) {
        // Si no hay ningún proyecto activo, iniciar el primer proyecto
        activeProject = spawn('node', ['C:/Users/chris/Desktop/web_ciberadiccion/app.js']);
        console.log("Proyecto cargado correctamente.");
    }

    // Pasar el control al siguiente middleware
    next();
});

// Rutas para el primer proyecto
dynamicRouter.get('/', (req, res) => {
    if (activeProject) {
        // Procesar la solicitud a través del proyecto activo
        activeProject.stdin.write(req.url);
    } else {
        res.status(503).send("No hay proyecto activo.");
    }
});

// Rutas para el segundo proyecto
dynamicRouter.get('/web_ciberadiccion/*', (req, res) => {
    if (activeProject) {
        // Procesar la solicitud a través del proyecto activo
        activeProject.stdin.write(req.url);
    } else {
        res.status(503).send("No hay proyecto activo.");
    }
});

module.exports = dynamicRouter;
