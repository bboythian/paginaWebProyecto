const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const moment = require('moment-timezone');
const app = express();
const port = 8081;

// Configuración de Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyBcPFBmlnt-Z6yc2h8yrNKQFq0yaJzlsQg");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Configuración de clima
const apiKey = 'b12c8f9a8a6055055c1b0a02dd14d4e5';
const lat = -2.897023;
const lon = -79.004260;
const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;


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

// Guardar sección de preferencias y gustos
const userPreferencesSchema = new mongoose.Schema({
    email: { type: String, required: true },
    periodo: { type: String, required: true },
    horarioClases: { type: String, required: true },
    mascota: { type: String, required: true },
    responsabilidadesEnCasa: { type: String, required: true },
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
// Definir el esquema de respuesta de Gemini
const userProfileGeminiSchema = new mongoose.Schema({
    email: { type: String, required: true },
    respuestaGemini: { type: String, required: true },
});

// Definir el esquema para la nueva tabla actividadesAlternativas
const actividadesAlternativasSchema = new mongoose.Schema({
    emailUser: { type: String, required: true },
    horaActual: { type: String, required: true },
    promptConsultaGemini: { type: String, required: true },
    respuestaConsultaGemini: { type: String, required: true }
});


// Definir un modelo basado en el esquema
const Reporte = mongoose.model('Reporte', reporteSchema);
const User = mongoose.model('User', userSchema);
const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);
const UserRegister= mongoose.model('UserRegister', userRegisterSchema);
const UserProfileGemini = mongoose.model('UserProfileGemini', userProfileGeminiSchema);
const ActividadesAlternativas = mongoose.model('ActividadesAlternativas', actividadesAlternativasSchema);

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

// Endpoint para obtener los datos de userPreferences
app.get('/get-activity-gemini', async (req, res) => {
    try {
        const actividadesAlternativas = await ActividadesAlternativas.find();
        res.json(actividadesAlternativas);
    } catch (error) {
        console.error('Error al obtener actividaes alternativas gemini:', error);
        res.status(500).send('Error al obtener actividaes alternativas gemini');
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
app.post('/generar-consulta', async (req, res) => {
    const { email } = req.body;
    const currentTime = await getCurrentTime();
    const date = new Date(currentTime);
    const hours = String(date.getHours()).padStart(2, '0');  // Obtiene las horas
    const minutes = String(date.getMinutes()).padStart(2, '0');  // Obtiene los minutos


    const weatherDescription = await getWeatherDescription();
    // Obtener el día actual
    const options = { weekday: 'long' }; // Devuelve el nombre completo del día (Lunes, Martes, etc.)
    const currentDay = new Date().toLocaleDateString('es-ES', options);

    if (!email) {
        return res.status(400).send({ error: 'Email is required' });
    }

    try {
        // Buscar el perfil de usuario en la tabla UserProfileGemini
        const userProfile = await UserProfileGemini.findOne({ email });
        const preferencesUserProfile = await UserPreferences.findOne({ email });

        // Si no se encuentra el perfil, devolver un error
        if (!userProfile) {
            return res.status(404).send({ error: 'Perfil de usuario no encontrado' });
        }
        if (!preferencesUserProfile) {
            return res.status(404).send({ error: 'Preferencias de usuario no encontrado' });
        }

        // Obtener el campo 'respuestaGemini' de la base de datos
        const respuestaGemini = userProfile.respuestaGemini;
        const scheduleClass = preferencesUserProfile.horarioClases; // cambiar a horario
        

        const nuevoPrompt = `Genera una sola actividad y de ejecución inmediata que no involucre gastos, para el siguiente perfil: ${respuestaGemini}.
        La actividad debe estar alineada con sus intereses y ayudar a fomentar una desconexión saludable del uso continuo del celular, mediante actividades que promuevan el bienestar, salud y rendimiento académico.
        Se debe prestar atención a las siguientes condiciones:  
        1. Hoy es ${currentDay}, son las ${hours}:${minutes}H y el clima actual es ${weatherDescription}.
        2. De lunes a viernes el estudiante está en clases en horario ${scheduleClass} , por lo que según hora, la recomendación debe ser dejar de usar el teléfono y prestar atención a clases.
        3. La actividad debe ser posible de realizarla en Cuenca - Ecuador y coherente para la hora actual.
        4. Si de noche entre las 23:00pm y 04:00am, sugerir que se debe dormir, si esta fuera del rango sugerir actividades en casa.
        5. Si la hora actual es entre las 12:30 y las 14:30 el estudiante debe almorzar
        Utiliza máximo 40 palabras con lenguaje cercano a la población Ecuatoriana. `;

        // Realizar la consulta a la API de Gemini con el nuevo prompt
        const respuestaGeminiNueva = await consultarGemini(nuevoPrompt);

        const resumePromt= `Día: ${currentDay}, clima ${weatherDescription}`;

        const actividadGeneradaGemini = new ActividadesAlternativas({
            emailUser: email,
            horaActual: currentTime,
            promptConsultaGemini: resumePromt,
            respuestaConsultaGemini: respuestaGeminiNueva
        });
        // Llamar a la función para guardar la actividad
        await guardarActividadGenerada(actividadGeneradaGemini);

        // Enviar la respuesta generada de vuelta al teléfono (cliente Flutter)
        return res.status(200).send(respuestaGeminiNueva);

    } catch (error) {
        console.error('Error en la ruta /generar-consulta:', error.message);
        return res.status(500).send({ error: 'Error al procesar la solicitud', details: error.message });
    }
});

// Función para guardar la actividad generada
async function guardarActividadGenerada(actividad) {
    try {
        await actividad.save();
        console.log('Actividad guardada exitosamente');
    } catch (error) {
        console.error('Error al guardar la actividad:', error.message);
    }
}


 
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
// - Su horario de clases es: ${preferencias.horarioClases}
async function generarPromptGemini(usuario, preferencias) {
    const prompt = ` Escribe un texto de 30 palabras que describa claramente el perfil de un/a estudiante universitario/a con las siguientes características:
    - Edad: ${usuario.edad} años,
    - Genero: ${usuario.genero},
    - Situación de movilidad: ${usuario.movilidad},
    - Dedica tiempo a sus tareas: ${usuario.tiempoDiario},
    - Top 3 actividades en casa ${preferencias.actividadesEnCasa},
    - Top 3 actividades fuera de casa: ${preferencias.actividadesAireLibre},
    - Organizacion de su espacio: ${preferencias.espacioOrdenado},
    - Tiene mascota: ${preferencias.mascota}
    El texto debe describir al usuario de manera coherente y fluida, integrando estos datos para formar un perfil completo y preciso.`;

    console.log(`Consulta de perfil generada para: ${usuario.email}`);
    return prompt;
}
// Función para hacer la consulta a la API de Gemini
async function consultarGemini(prompt, retryCount = 5) {
    try {
        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        return responseText;
    } catch (error) {
        console.error('Error consultando Gemini:', error);
        if (retryCount > 0) {
            console.log(`Reintentando consulta a Gemini... (${5 - retryCount} intento(s) restantes) para `);
              // Esperar 1 segundo (1000 milisegundos) antes de reintentar
              await sleep(3000);
              
            return consultarGemini(prompt, retryCount - 1);  // Decrementar el contador
        } else {
            throw new Error('Error consultando Gemini después de varios intentos');
        }
    }
}
// Función para pausar la ejecución durante una cantidad de milisegundos
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/enviar-preferencias', async (req, res) => {
    const {
        email,
        periodo,
        mascota,
        responsabilidadesEnCasa,
        horarioClases,
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
        horarioClases,
        espacioOrdenado,
        actividadesAireLibre,
        actividadesEnCasa,
        motivacion,
    });

    try {
        // Guardar preferencias en la base de datos
        await nuevasPreferencias.save();
 
        // Obtener los datos adicionales del usuario en la tabla UserRegister
        const usuario = await UserRegister.findOne({ email });
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Generar el prompt para la consulta a Gemini
        const prompt = await generarPromptGemini(usuario, nuevasPreferencias);

        // Hacer la consulta a la API de Gemini
        const respuestaGemini = await consultarGemini(prompt);

        // Guardar la respuesta de Gemini en la nueva tabla UserProfileGemini
        const nuevoPerfilGemini = new UserProfileGemini({
            email: email,
            respuestaGemini: respuestaGemini,
        });
        await nuevoPerfilGemini.save();

        // Enviar un mensaje de éxito al cliente
         res.status(200).send({ message: 'Preferencias guardadas y respuesta de Gemini almacenada correctamente.' });
    } catch (err) {
        console.error('Error al procesar las preferencias:', err.message);

        // Enviar un error de procesamiento y guardar las preferencias igualmente
        res.status(500).send({
            error: 'Preferencias guardadas, pero hubo un problema al consultar Gemini.',
            detalles: err.message
        });
    }
});
// Endpoint para obtener los datos de UserProfileGemini
app.get('/get-user-profile-gemini', async (req, res) => {
    try {
        const userProfileGemini = await UserProfileGemini.find();
        res.json(userProfileGemini);
    } catch (error) {
        console.error('Error al obtener UserProfileGemini:', error);
        res.status(500).send('Error al obtener UserProfileGemini');
    }
});
// Ruta para eliminar un perfil de usuario de Gemini
app.post('/delete-user-profile-gemini', (req, res) => {
    UserProfileGemini.findOneAndDelete({ _id: req.body.userProfileGeminiId })
        .then(() => {
            res.redirect('/main'); // Redirigir de vuelta a la página principal después de eliminar el registro
        })
        .catch(err => {
            console.error('Error al eliminar perfil de usuario de Gemini:', err);
            res.redirect('/'); // Redirigir en caso de error
        });
});
// Ruta para eliminar un perfil de usuario de Gemini
app.post('/delete-activity-gemini', (req, res) => {
    ActividadesAlternativas.findOneAndDelete({ _id: req.body.ActividadesAlternativasId })
        .then(() => {
            res.redirect('/main'); // Redirigir de vuelta a la página principal después de eliminar el registro
        })
        .catch(err => {
            console.error('Error al eliminar perfil de usuario de Gemini:', err);
            res.redirect('/'); // Redirigir en caso de error
        });
});
module.exports = app;