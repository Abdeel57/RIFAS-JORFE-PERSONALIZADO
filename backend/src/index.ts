import express from 'express';
import path from 'path';

const app = express();
// Limpiamos el puerto por si Railway envía espacios o caracteres raros
const RAW_PORT = process.env.PORT || '8080';
const PORT = parseInt(String(RAW_PORT).trim(), 10);

console.log('--- DEEP DIAGNOSTIC START ---');
console.log(`RAW_PORT variable: "${RAW_PORT}"`);
console.log(`Parsed PORT: ${PORT}`);
console.log(`Node Version: ${process.version}`);

// 1. Health check con info de red
app.get('/health', (req, res) => {
    const info = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        protocol: req.protocol,
        host: req.get('host'),
        remoteIp: req.ip,
        headers: req.headers
    };
    console.log('💚 [HEALTH] Serving request:', info);
    res.status(200).json(info);
});

// 2. Heartbeat para confirmar que el proceso NO está colgado
setInterval(() => {
    console.log(`💓 [HEARTBEAT] Server still alive at ${new Date().toISOString()} on port ${PORT}`);
}, 30000);

app.get('/diag', (req, res) => {
    res.json({
        message: 'Diagnostic endpoint active',
        port: PORT,
        env: process.env.NODE_ENV,
        cwd: process.cwd(),
        dirname: __dirname,
        files_in_admin: require('fs').existsSync(path.join(__dirname, 'admin')) ? 'Exists' : 'Not found'
    });
});

// 2. Logging mínimo
app.use((req, res, next) => {
    console.log(`📥 [${req.method}] ${req.url}`);
    next();
});

// 3. Servir estáticos
const adminPath = path.join(__dirname, 'admin');
app.use('/admin', express.static(adminPath));
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
});

// 4. Fallback root
app.get('/', (req, res) => {
    res.send('<h1>Backend Diagnostic Mode</h1><p>Visit /health or /admin</p>');
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🚀 DIAGNOSTIC SERVER RUNNING`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`📂 Admin Path: ${adminPath}`);
});
