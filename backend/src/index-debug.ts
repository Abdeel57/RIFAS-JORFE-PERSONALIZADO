// Versión de debug para diagnosticar problemas
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno primero
dotenv.config();

console.log('🔍 Variables de entorno cargadas:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Faltante');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada (' + process.env.JWT_SECRET.length + ' caracteres)' : '❌ Faltante');
console.log('NODE_ENV:', process.env.NODE_ENV || 'no configurado');
console.log('PORT:', process.env.PORT || 'no configurado');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());

// Health check simple
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
    }
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});





