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

// Ruta para agregar un nuevo reporte desde la aplicación móvil Flutter
app.post('/enviar-datos', (req, res) => {
    const { cedula, fecha, mayorConsumo, usageData } = req.body;

    if (usageData) {
        // Parsear los datos enviados desde el móvil
        const parsedDataToSend = JSON.parse(usageData);

        // Construir un objeto Reporte con los datos recibidos
        const nuevoReporte = new Reporte({
            cedula,
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
            cedula,
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

// //guardar seccion de preferencias y gustos
// const userPreferencesSchema = new mongoose.Schema({
//     cedula: String,
//     peliculas: String,
//     musica: String,
//     series: String,
//     libros: String,
//     formatoLectura: String,
//     actividadesAlAireLibre: String,
//     frecuenciaActividadesAlAireLibre: String,
//     actividadesEnInteriores: String,
//     tiempoActividadesEnInteriores: String,
//     destinosDeViaje: String,
//     actividadesEnViaje: String,
//     gadgets: String,
//     aplicaciones: String,
//     tipoComida: String,
//     frecuenciaComerFuera: String,
//     deportes: String,
//     frecuenciaEjercicio: String,
// });

// const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

// // Configurar OpenAI
// const configuration = new Configuration({
//     apiKey: 'YOUR_OPENAI_API_KEY',
//   });
//   const openai = new OpenAIApi(configuration);
  
  // Ruta para recibir la solicitud y consultar la IA
//   app.post('/sugerir-actividad', async (req, res) => {
//     const { cedula, hora, numeroAlerta } = req.body;
  
//     try {
//       // Buscar el perfil del usuario en la base de datos
//       const perfilUsuario = await UserPreferences.findOne({ cedula });
  
//       if (!perfilUsuario) {
//         return res.status(404).send('Perfil del usuario no encontrado');
//       }
  
//       // Preparar el mensaje para la API de OpenAI
//       const prompt = `
//       Perfil del usuario:
//       Peliculas: ${perfilUsuario.peliculas}
//       Musica: ${perfilUsuario.musica}
//       Series: ${perfilUsuario.series}
//       Libros: ${perfilUsuario.libros}
//       Formato de Lectura: ${perfilUsuario.formatoLectura}
//       Actividades al Aire Libre: ${perfilUsuario.actividadesAlAireLibre}
//       Frecuencia de Actividades al Aire Libre: ${perfilUsuario.frecuenciaActividadesAlAireLibre}
//       Actividades en Interiores: ${perfilUsuario.actividadesEnInteriores}
//       Tiempo en Actividades en Interiores: ${perfilUsuario.tiempoActividadesEnInteriores}
//       Destinos de Viaje: ${perfilUsuario.destinosDeViaje}
//       Actividades en Viaje: ${perfilUsuario.actividadesEnViaje}
//       Gadgets: ${perfilUsuario.gadgets}
//       Aplicaciones: ${perfilUsuario.aplicaciones}
//       Tipo de Comida: ${perfilUsuario.tipoComida}
//       Frecuencia de Comer Fuera: ${perfilUsuario.frecuenciaComerFuera}
//       Deportes: ${perfilUsuario.deportes}
//       Frecuencia de Ejercicio: ${perfilUsuario.frecuenciaEjercicio}
//       Hora del día: ${hora}
  
//       Sugerencia de actividad para desviar la atención del teléfono:
//       `;
  
//       // Consultar a la API de OpenAI
//       const response = await openai.createCompletion({
//         model: 'text-davinci-003',
//         prompt: prompt,
//         max_tokens: 150,
//       });
  
//       const sugerencia = response.data.choices[0].text.trim();
//       console.log('Sugerencia de actividad:', sugerencia);
//       res.send({ sugerencia });
//     } catch (error) {
//       console.error('Error al consultar la IA:', error);
//       res.status(500).send('Error al procesar la solicitud');
//     }
//   });

// app.post('/enviar-preferencias', (req, res) => {
//     const {
//         cedula,
//         peliculas,
//         musica,
//         series,
//         libros,
//         formatoLectura,
//         actividadesAlAireLibre,
//         frecuenciaActividadesAlAireLibre,
//         actividadesEnInteriores,
//         tiempoActividadesEnInteriores,
//         destinosDeViaje,
//         actividadesEnViaje,
//         gadgets,
//         aplicaciones,
//         tipoComida,
//         frecuenciaComerFuera,
//         deportes,
//         frecuenciaEjercicio,
//     } = req.body;

//     const nuevasPreferencias = new UserPreferences({
//         cedula,
//         peliculas,
//         musica,
//         series,
//         libros,
//         formatoLectura,
//         actividadesAlAireLibre,
//         frecuenciaActividadesAlAireLibre,
//         actividadesEnInteriores,
//         tiempoActividadesEnInteriores,
//         destinosDeViaje,
//         actividadesEnViaje,
//         gadgets,
//         aplicaciones,
//         tipoComida,
//         frecuenciaComerFuera,
//         deportes,
//         frecuenciaEjercicio,
//     });

//     nuevasPreferencias.save()
//         .then(preferencias => {
//             res.status(200).send('Preferencias guardadas correctamente');
//         })
//         .catch(err => {
//             console.error('Error al guardar preferencias:', err);
//             res.status(500).send('Error al procesar las preferencias');
//         }); 
// });


module.exports = app;