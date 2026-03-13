
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env específicamente desde la carpeta backend
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testGemini() {
    console.log('--- DIAGNÓSTICO DE GEMINI AI ---');

    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        console.error('❌ ERROR: No se encontró la variable GEMINI_API_KEY en el archivo .env');
        console.log('Asegúrate de que el archivo .env exista en backend/.env');
        return;
    }

    console.log(`✅ API Key detectada (inicia con: ${key.slice(0, 6)}...)`);

    const genAI = new GoogleGenerativeAI(key);
    // Probamos con el modelo que configuramos en el código
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    try {
        console.log('⏳ Enviando petición de prueba a Google...');
        const result = await model.generateContent('Responde solo con la palabra: FUNCIONANDO');
        const response = result.response.text().trim();

        if (response.includes('FUNCIONANDO')) {
            console.log('\n✨ ¡TODO BIEN! La IA está respondiendo correctamente.');
            console.log('Ahora los pagos deberían validarse automáticamente sin errores 404.\n');
        } else {
            console.log('\n⚠️ La IA respondió algo inesperado:', response);
        }
    } catch (error: any) {
        console.error('\n❌ ERROR DE CONEXIÓN:');
        if (error.message.includes('404')) {
            console.error('El modelo gemini-2.5-flash no fue encontrado. Posiblemente tu API KEY es de un proyecto antiguo o no tiene permisos de IA Studio.');
        } else if (error.message.includes('API_KEY_INVALID')) {
            console.error('La API KEY es incorrecta o no es válida.');
        } else {
            console.error(error.message);
        }
        console.log('\nSugerencia: Crea una nueva API KEY en https://aistudio.google.com/app/apikey\n');
    }
}

testGemini();
