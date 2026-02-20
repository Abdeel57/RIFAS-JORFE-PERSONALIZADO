import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './utils/errors';

console.log('🔍 Iniciando servidor Express...');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();

// Ruta raíz para health checks de plataformas que prueban "/"
app.get('/', (req, res) => {
  console.log('🏠 [ROOT] Root check llamado');
  res.status(200).json({
    status: 'ok',
    message: 'Backend root is running',
    timestamp: new Date().toISOString(),
  });
});

// Health check - debe funcionar siempre, incluso si hay errores de configuración
app.get('/health', (req, res) => {
  console.log('🏥 [HEALTH] Health check llamado');
  console.log('🏥 [HEALTH] Request URL:', req.url);
  console.log('🏥 [HEALTH] Request path:', req.path);
  console.log('🏥 [HEALTH] Request method:', req.method);
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running',
    port: process.env.PORT || '3001',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Endpoint de prueba para verificar logging
app.get('/test-logging', (req, res) => {
  console.log('🧪 [TEST] Endpoint de prueba de logging llamado');
  console.log('🧪 [TEST] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🧪 [TEST] Query:', req.query);
  res.json({ 
    success: true,
    message: 'Logging funciona correctamente',
    timestamp: new Date().toISOString(),
    logs: 'Revisa los logs de Railway para ver estos mensajes'
  });
});

// Middleware básico - CORS configurado para permitir frontend
// IMPORTANTE: CORS debe estar ANTES de cualquier otro middleware
// El admin panel ahora está en el mismo dominio, no necesita CORS
console.log('🔧 Configurando CORS...');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Obtener orígenes permitidos desde variables de entorno
const allowedOrigins: string[] = [];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Agregar orígenes adicionales comunes
allowedOrigins.push('https://naorifas.netlify.app');
allowedOrigins.push('http://localhost:3000');
allowedOrigins.push('http://localhost:5173');

console.log('🌐 Orígenes permitidos:', allowedOrigins);

// Configuración simplificada de CORS (solo para frontend externo)
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sin origen (como Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Si el origen está en la lista permitida, permitirlo
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origen permitido: ${origin}`);
      return callback(null, true);
    }
    
    // En desarrollo, permitir todos los orígenes
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En producción, solo permitir orígenes específicos
    console.log(`⚠️  CORS: Origen no permitido: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Aplicar CORS
app.use(cors(corsOptions));

// Manejar explícitamente OPTIONS requests para asegurar que funcionen
app.options('*', cors(corsOptions));

console.log('✅ CORS configurado correctamente');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.path}`, {
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    origin: req.headers.origin,
    host: req.headers.host,
    'content-type': req.headers['content-type'],
    body: req.method === 'POST' ? (req.path.includes('/login') ? { email: req.body?.email, passwordLength: req.body?.password?.length } : '***') : undefined,
  });
  next();
});

// Cargar configuración y rutas con manejo de errores
try {
  console.log('📦 Cargando configuración...');
  const env = require('./config/env').default;
  console.log('✅ Configuración cargada');
  
  console.log('📦 Cargando rutas...');
  // Routes
  const raffleRoutes = require('./routes/raffles.routes').default;
  const purchaseRoutes = require('./routes/purchases.routes').default;
  const verifyRoutes = require('./routes/verify.routes').default;
  const adminRoutes = require('./routes/admin.routes').default;

  app.use('/api/raffles', raffleRoutes);
  app.use('/api/purchases', purchaseRoutes);
  app.use('/api/verify', verifyRoutes);
  app.use('/api/admin', adminRoutes);

  // Cargar rutas de soporte solo si Gemini está configurado
  try {
    if (process.env.GEMINI_API_KEY) {
      const supportRoutes = require('./routes/support.routes').default;
      app.use('/api/support', supportRoutes);
      console.log('✅ Ruta de soporte (chatbot) cargada');
    } else {
      console.log('⚠️  Ruta de soporte omitida (GEMINI_API_KEY no configurada)');
      // Agregar ruta placeholder para que no falle
      app.use('/api/support', (req, res) => {
        res.status(503).json({
          success: false,
          error: 'Chatbot no disponible. La funcionalidad de IA no está configurada.',
        });
      });
    }
  } catch (error: any) {
    console.warn('⚠️  No se pudo cargar ruta de soporte:', error.message);
    // Agregar ruta placeholder
    app.use('/api/support', (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Chatbot no disponible.',
      });
    });
  }

  console.log('✅ Todas las rutas cargadas correctamente');
} catch (error: any) {
  console.error('⚠️  Error cargando rutas:', error.message);
  console.error('Stack:', error.stack);
  // El health check seguirá funcionando aunque las rutas fallen
}

// Servir archivos estáticos del admin panel
const adminPath = path.join(__dirname, 'admin');
console.log('📁 Ruta del admin panel:', adminPath);

// Servir archivos estáticos (JS, CSS, imágenes, etc.)
app.use('/admin', express.static(adminPath, {
  maxAge: '1y',
  etag: true,
}));

// Catch-all para SPA: todas las rutas /admin/* que no sean archivos estáticos
// deben servir index.html para que React Router funcione
app.get('/admin/*', (req, res) => {
  const indexPath = path.join(adminPath, 'index.html');
  console.log('📄 Sirviendo index.html del admin para:', req.path);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.warn('⚠️  No se pudo servir index.html del admin:', err.message);
      // Si no existe el admin panel, devolver 404
      res.status(404).json({
        success: false,
        error: 'Admin panel no encontrado. Asegúrate de que el build del admin panel se haya ejecutado.',
      });
    }
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

console.log(`🚀 Iniciando servidor en http://${HOST}:${PORT}...`);

process.on('SIGTERM', () => {
  console.error('🛑 [PROCESS] Recibido SIGTERM, el contenedor será detenido');
});

process.on('SIGINT', () => {
  console.error('🛑 [PROCESS] Recibido SIGINT');
});

process.on('uncaughtException', (error) => {
  console.error('💥 [PROCESS] uncaughtException:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 [PROCESS] unhandledRejection:', reason);
});

process.on('beforeExit', (code) => {
  console.error('🛑 [PROCESS] beforeExit', { code });
});

process.on('exit', (code) => {
  console.error('🛑 [PROCESS] exit', { code });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🌐 API base: http://${HOST}:${PORT}/api`);
  console.log(`👨‍💼 Admin panel: http://${HOST}:${PORT}/admin`);
  console.log(`✅ Servidor iniciado correctamente`);
  console.log(`📋 Rutas registradas:`);
  console.log(`   - GET /`);
  console.log(`   - GET /health`);
  console.log(`   - GET /test-logging`);
  console.log(`   - GET /api/*`);
  console.log(`   - GET /admin/*`);
});

server.on('error', (error) => {
  console.error('💥 [SERVER] error', error);
});

server.on('close', () => {
  console.error('🛑 [SERVER] close event');
});

