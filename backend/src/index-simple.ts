// Versión simplificada para diagnosticar problemas de inicio
import express from 'express';

console.log('🔍 Iniciando servidor...');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Faltante');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada (' + process.env.JWT_SECRET.length + ' chars)' : '❌ Faltante');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running',
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV
  });
});

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check disponible en: http://${HOST}:${PORT}/health`);
});




