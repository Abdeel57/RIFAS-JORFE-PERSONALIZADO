import express from 'express';
import cors from 'cors';
import path from 'path';
import env from './config/env';
import { errorHandler, AppError } from './utils/errors';
import settingsRoutes from './routes/settings.routes';
import supportRoutes from './routes/support.routes';

console.log('🔍 Iniciando servidor Express...');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();

// IMPORTANTE: Habilitar trust proxy para que Express confíe en el proxy de Railway
app.enable('trust proxy');

// Middleware de logging para todas las peticiones - MOVIDO AL PRINCIPIO
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📥 [REQ] ${req.method} ${req.url}`, {
    host: req.headers.host,
    ip: req.ip,
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-forwarded-proto': req.headers['x-forwarded-proto'],
  });

  // Log on finish to see status code
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 [RES] ${req.method} ${req.path} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
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

// Local y desarrollo
allowedOrigins.push('http://localhost:3000');
allowedOrigins.push('http://localhost:5173');
allowedOrigins.push('http://127.0.0.1:3000');
allowedOrigins.push('http://127.0.0.1:5173');

// Agregar dinámicamente el host actual (Railway)
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  allowedOrigins.push(`http://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
}
// Regex: permitir cualquier subdominio de netlify.app y railway.app
const allowedOriginPatterns: RegExp[] = [/\.netlify\.app$/i, /\.railway\.app$/i];

function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginPatterns.some((re) => re.test(origin));
}

console.log('🌐 Orígenes permitidos:', allowedOrigins);
console.log('🌐 Patrones (netlify.app, railway.app): activos');

// Configuración de CORS para frontend en Netlify y otros orígenes permitidos
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sin origen (Postman, curl, same-origin, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      console.log(`✅ CORS: Origen permitido: ${origin}`);
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    console.log(`⚠️  CORS: Origen rechazado: ${origin}`);
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// (Middleware de logging movido arriba)

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
  const comprobanteRoutes = require('./routes/comprobante.routes').default;
  const adminRoutes = require('./routes/admin.routes').default;
  const imagesRoutes = require('./routes/images.routes').default;

  app.use('/api/raffles', raffleRoutes);
  app.use('/api/purchases', purchaseRoutes);
  app.use('/api/verify', verifyRoutes);
  app.use('/api/comprobante', comprobanteRoutes);
  app.use('/api/images', imagesRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api/settings', settingsRoutes);

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

// Verificar existencia del directorio al arrancar
import fs from 'fs';
if (fs.existsSync(adminPath)) {
  console.log('✅ Directorio admin encontrado');
  if (fs.existsSync(path.join(adminPath, 'index.html'))) {
    console.log('✅ index.html del admin encontrado');
  } else {
    console.warn('❌ index.html del admin NO encontrado en:', adminPath);
  }
} else {
  console.warn('❌ Directorio admin NO encontrado en:', adminPath);
}

// Servir archivos estáticos (JS, CSS, imágenes, etc.)
// "index: false" para evitar conflictos con el catch-all manual
app.use('/admin', express.static(adminPath, {
  maxAge: '1y',
  etag: true,
  index: ['index.html']
}));

// Catch-all para SPA: todas las rutas /admin/* que no sean archivos estáticos
// deben servir index.html para que React Router funcione
app.get(['/admin', '/admin/*'], (req, res) => {
  const indexPath = path.join(adminPath, 'index.html');
  console.log('📄 Sirviendo index.html del admin para:', req.path);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.warn('⚠️  No se pudo servir index.html del admin:', err.message);
      // Si no existe el admin panel, devolver 404
      res.status(404).json({
        success: false,
        error: 'Admin panel no encontrado. Asegúrate de que el build del admin panel se haya ejecutado.',
        path: indexPath
      });
    }
  });
});

// Servir archivos estáticos del frontend público (tienda de sorteos)
const frontendPath = path.join(__dirname, 'frontend');
if (fs.existsSync(frontendPath)) {
  console.log('✅ Directorio frontend encontrado');
  app.use('/', express.static(frontendPath, {
    index: false,
    maxAge: '1y',
    etag: true,
  }));
  // Catch-all para SPA: rutas que no sean /api, /admin, /health sirven index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path === '/health' || req.path === '/test-logging') {
      return next();
    }
    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        next(err);
      }
    });
  });
} else {
  console.warn('❌ Directorio frontend NO encontrado en:', frontendPath);
}

// Error handler
app.use(errorHandler);

// Manejo de procesos
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

// Iniciar servidor
// Railway inyecta la variable PORT automáticamente. Priorizamos process.env.PORT.
const finalPort = process.env.PORT || env.PORT || 8080;

const server = app.listen(Number(finalPort), '0.0.0.0', () => {
  console.log(`\n🚀 SERVIDOR INICIADO`);
  console.log(`📡 Puerto: ${finalPort}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Health check: /health`);
  console.log(`👨‍💼 Admin panel: /admin\n`);

  if (process.env.RAILWAY_STATIC_URL) {
    console.log(`🌐 URL Pública: https://${process.env.RAILWAY_STATIC_URL}`);
  }

  console.log(`📋 Rutas Principales:`);
  console.log(`   - GET /, /* (frontend público)`);
  console.log(`   - GET /health`);
  console.log(`   - GET /api/*`);
  console.log(`   - ALL /admin/*`);
});

server.on('error', (error: any) => {
  console.error('💥 [SERVER] error', error);
});

server.on('close', () => {
  console.error('🛑 [SERVER] close event');
});

