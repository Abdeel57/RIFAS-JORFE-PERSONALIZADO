import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

// 1. Health check inmediato - sin middleware
app.get('/health', (req, res) => {
    console.log('💚 [DIAGNOSTIC] Health check hit');
    res.status(200).send('OK');
});

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
