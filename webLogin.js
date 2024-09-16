const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 8081;

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/baseUsage')
    .then(() => {
        console.log('Conectado a la base de datos MongoDB');
    })
    .catch((err) => {
        console.error('Error de conexión a MongoDB:', err);
    });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));

// Definir el esquema de usuario
const userSchema = new mongoose.Schema({
    cedula: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Definir un esquema de reporte
const reporteSchema = new mongoose.Schema({
    email: { type: String, required: true },
    fecha: { type: Date, required: true },
    mayorConsumo: { type: String, required: true },
    packageName1: { type: String, required: true },
    packageName2: { type: String, required: true },
    packageName3: { type: String, required: true },
    packageName4: { type: String, required: true },
    packageName5: { type: String, required: true },
    tiempoUso1: { type: String, required: true },
    tiempoUso2: { type: String, required: true },
    tiempoUso3: { type: String, required: true },
    tiempoUso4: { type: String, required: true },
    tiempoUso5: { type: String, required: true }
});

// Definir el esquema y el modelo de correo electrónico
// const emailSchema = new mongoose.Schema({
//     email: { type: String, required: true, unique: true }
// });

// emailSchema.index({ email: 1 }, { unique: true });


// Guardar sección de preferencias y gustos
const userPreferencesSchema = new mongoose.Schema({
    email: { type: String, required: true },
    periodo: { type: String, required: true },
    mascota: { type: String, required: true },
    responsabilidadesEnCasa: { type: String, required: true },
    tareasUniversitarias: { type: String, required: true },
    espacioOrdenado: { type: String, required: true },
    actividadesAireLibre: { type: String, required: true },
    actividadesEnCasa: { type: String, required: true },
    motivacion: { type: String, required: true }
});

// Guardar sección de preferencias y gustos
const userRegisterSchema = new mongoose.Schema({
    email: { type: String, required: true },
    cedula: { type: String, required: true },
    edad: { type: String, required: true },
    genero: { type: String, required: true },
    so: { type: String, required: true },
    movilidad: { type: String, required: true },
    tiempoDiario: { type: String, required: true },
});

// Definir un modelo basado en el esquema
const Reporte = mongoose.model('Reporte', reporteSchema);
const User = mongoose.model('User', userSchema);
const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);
const UserRegister= mongoose.model('UserRegister', userRegisterSchema);
// const Email = mongoose.model('Email', emailSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        console.error('Error en la ruta /login:', error.message);
        res.status(500).send('Error al procesar la solicitud');
    }
});

// Ruta para validar el correo electrónico
app.post('/validar-email', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).send({ error: 'Email is required' });
    }

    try {
        const emailRegister = await UserRegister.findOne({ email });
        const emailPreference = await UserPreferences.findOne({ email });
    
        // Si existe el email en emailRegister y no existe en emailPreference, devuelve true
        if (emailRegister && !emailPreference) {
            return res.status(200).send({ exists: true });
        }
    
        // Si existe el email en emailPreference, devuelve false
        if (emailPreference) {
            return res.status(200).send({ exists: false });
        }
    
        // Si no existe en ambos, devuelve que no existe (404)
        return res.status(404).send({ exists: false });
    
    } catch (error) {
        return res.status(500).send({ error: 'Server error en validar email', details: error });
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

// Ruta para agregar un nuevo reporte desde la aplicación móvil Flutter
app.post('/enviar-datos', (req, res) => {
    const { email, fecha, mayorConsumo, usageData } = req.body;

    if (usageData) {
        // Parsear los datos enviados desde el móvil
        const parsedDataToSend = JSON.parse(usageData);

        // Construir un objeto Reporte con los datos recibidos
        const nuevoReporte = new Reporte({
            email,
            fecha,
            mayorConsumo,
        });
        // Definir una función para obtener los campos packageName y tiempoUso
        const getFieldData = (index, field) => {
            return parsedDataToSend[index] ? parsedDataToSend[index][field] : '-';
        };
        // Iterar sobre un número máximo de elementos y asignar los valores correspondientes
        const maxElements = 5;
        for (let i = 0; i < maxElements; i++) {
            nuevoReporte[`packageName${i + 1}`] = getFieldData(i, 'packageName');
            nuevoReporte[`tiempoUso${i + 1}`] = getFieldData(i, 'totalTimeInForeground');
        }

        nuevoReporte.save()
            .then(reporte => {
                res.status(200).send('Datos recibidos correctamente'); // Enviar una respuesta exitosa
            })
            .catch(err => {
                console.error('Error al agregar nuevo reporte:', err);
                res.status(500).send('Error al procesar los datos'); // Enviar una respuesta de error en caso de problemas
            });
    } else {
        // Si no se recibieron datos de uso de aplicaciones, enviar una lista vacía
        const nuevoReporte = new Reporte({
            email,
            fecha,
            mayorConsumo,
            packageName1: '-',
            packageName2: '-',
            packageName3: '-',
            packageName4: '-',
            packageName5: '-',
            tiempoUso1: 0,
            tiempoUso2: 0,
            tiempoUso3: 0,
            tiempoUso4: 0,
            tiempoUso5: 0,
        });
        nuevoReporte.save()
            .then(reporte => {
                res.status(200).send('Datos recibidos correctamente'); // Enviar una respuesta exitosa
            })
            .catch(err => {
                console.error('Error al agregar nuevo reporte:', err);
                res.status(500).send('Error al procesar los datos'); // Enviar una respuesta de error en caso de problemas
            });
    }
});

// Ruta para eliminar un usuario
app.post('/delete-reporte', (req, res) => {
    Reporte.findOneAndDelete({ _id: req.body.reporteId })
        .then(() => {
            res.redirect('/main'); // Redirigir de vuelta a la página principal después de eliminar usuario
        })
        .catch(err => {
            console.error('Error al eliminar usuario:', err);
            res.redirect('/'); // Redirigir de vuelta a la página principal en caso de error
        });
});

// Ruta para eliminar un user-preference
app.post('/delete-user-preference', (req, res) => {
    UserPreferences.findOneAndDelete({ _id: req.body.userPreferenceId })
        .then(() => {
            res.redirect('/main'); // Redirigir de vuelta a la página principal después de eliminar usuario
        })
        .catch(err => {
            console.error('Error al eliminar user preference:', err);
            res.redirect('/'); // Redirigir de vuelta a la página principal en caso de error
        });
});


// Endpoint para obtener los datos de userPreferences
app.get('/get-user-preferences', async (req, res) => {
    try {
        const userPreferences = await UserPreferences.find();
        res.json(userPreferences);
    } catch (error) {
        console.error('Error al obtener userPreferences:', error);
        res.status(500).send('Error al obtener userPreferences');
    }
});

// Endpoint para obtener los datos de userPreferences
app.get('/get-user-register', async (req, res) => {
    try {
        const userRegister = await UserRegister.find();
        res.json(userRegister);
    } catch (error) {
        console.error('Error al obtener userPreferences:', error);
        res.status(500).send('Error al obtener userPreferences');
    }
});

// Ruta para eliminar un user-preference
app.post('/delete-user-register', (req, res) => {
    UserRegister.findOneAndDelete({ _id: req.body.userRegisterId })
        .then(() => {
            res.redirect('/main'); // Redirigir de vuelta a la página principal después de eliminar usuario
        })
        .catch(err => {
            console.error('Error al eliminar user preference:', err);
            res.redirect('/'); // Redirigir de vuelta a la página principal en caso de error
        });
});

const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai"); //uso GEMINI
const moment = require('moment-timezone');
// const UserRegister = require('./models/UserRegister'); // Importa el modelo de usuarios

// Configuración de claves y URL para el clima
const apiKey = 'b12c8f9a8a6055055c1b0a02dd14d4e5'; 
const lat = -2.858670;
const lon = -78.962428;
const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

// Configuración de Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyBcPFBmlnt-Z6yc2h8yrNKQFq0yaJzlsQg");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Función para obtener la hora actual en la zona horaria especificada
async function getCurrentTime() {
    const timezone = 'America/Guayaquil';
    return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
}
// Función para obtener el clima actual
async function getWeatherDescription() {
    try {
        const response = await axios.get(weatherUrl);
        const data = response.data;
        return data.weather[0].description;
    } catch (error) {
        console.error('Error fetching the weather data:', error.message);
        return 'condiciones meteorológicas no disponibles';
    }
}


app.post('/enviar-preferencias', async (req, res) => {
    const {
        email,
        periodo,
        mascota,
        responsabilidadesEnCasa,
        tareasUniversitarias,
        espacioOrdenado,
        actividadesAireLibre,
        actividadesEnCasa,
        motivacion,
    } = req.body;

    const nuevasPreferencias = new UserPreferences({
        email,
        periodo,
        mascota,
        responsabilidadesEnCasa,
        tareasUniversitarias,
        espacioOrdenado,
        actividadesAireLibre,
        actividadesEnCasa,
        motivacion,
    });
    //Antiguo
    // nuevasPreferencias.save()
    //     .then(preferencias => {
    //         res.status(200).send('Preferencias guardadas correctamente');
    //     })
    //     .catch(err => {
    //         console.error('Error al guardar preferencias:', err);
    //         res.status(500).send('Error al procesar las preferencias');
    //     }); 

    try {
        // Guardar preferencias en la base de datos
        await nuevasPreferencias.save();

        // Obtener los datos adicionales del usuario en la tabla UserRegister
        const usuario = await UserRegister.findOne({ email });
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Obtener la hora y el clima actual
        const currentTime = await getCurrentTime();
        const weatherDescription = await getWeatherDescription();

        // Crear el prompt para la API de IA de Gemini
        const prompt = `Genera un texto personalizado de presentación para el usuario.
        El usuario tiene el siguiente perfil:
        - Nombre: ${usuario.nombre}
        - Edad: ${usuario.edad} años
        - Cédula: ${usuario.cedula}
        - Prefiere actividades en casa como: ${actividadesEnCasa}
        - Prefiere actividades al aire libre como: ${actividadesAireLibre}
        - El usuario tiene mascota: ${mascota ? 'Sí' : 'No'}
        - Tareas universitarias: ${tareasUniversitarias}
        - El espacio está ordenado: ${espacioOrdenado}
        - La hora actual es: ${currentTime}
        - El clima actual es: ${weatherDescription}.`;

        console.log(`Prompt generado: ${prompt}`);

        // Llamada a la API de Gemini
        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        
        console.log(`Respuesta de Gemini: ${responseText}`);

        // Enviar la respuesta de la IA como respuesta de la API
        res.status(200).send({ message: 'Preferencias guardadas y consulta a Gemini realizada correctamente', respuestaIA: responseText });
 
    } catch (err) {
        console.error('Error al procesar las preferencias:', err);
        res.status(500).send('Error al procesar las preferencias');
    }

});


module.exports = app;