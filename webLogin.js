const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/baseUsage', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    console.log('Conectado a la base de datos MongoDB');
});

// Definir el esquema de usuario
const userSchema = new mongoose.Schema({
    cedula: String,
    password: String
});

// Definir un esquema de usuario
const reporteSchema = new mongoose.Schema({
    cedula: String,
    fecha: Date,
    mayorConsumo: String,
    packageName1: String,
    packageName2: String,
    packageName3: String,
    packageName4: String,
    packageName5: String,
    tiempoUso1: String,
    tiempoUso2: String,
    tiempoUso3: String,
    tiempoUso4: String,
    tiempoUso5: String,
});

// Definir un modelo basado en el esquema
const Reporte = mongoose.model('Reporte', reporteSchema);

const User = mongoose.model('User', userSchema);

// Ruta para manejar el inicio de sesión
app.post('/login', async (req, res) => {
    const { cedula, password } = req.body;
    try {
        const user = await User.findOne({ cedula, password });
        if (user) {
            res.redirect('/main');
        } else {
            res.send('Credenciales incorrectas');
        }
    } catch (error) {
        res.status(500).send('Error al procesar la solicitud');
    }
});




// Ruta para obtener y mostrar todos los usuarios en formato JSON
app.get('/get-reportes', (req, res) => {
    Reporte.find()
        .then(reportes => {
            res.json(reportes); // Devolver todos los usuarios en formato JSON
        })
        .catch(err => {
            console.error('Error al consultar reportes:', err);
            res.status(500).send('Error al obtener reportes'); // Devolver un mensaje de error si hay algún problema
        });
});

module.exports = app;