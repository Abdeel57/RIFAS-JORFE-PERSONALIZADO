# 🔧 Solución Error 502 Bad Gateway en Railway

## ❌ Error Actual

```
502 Bad Gateway
Application failed to respond
```

Este error significa que Railway no puede conectarse a tu aplicación backend.

---

## 🔍 Paso 1: Revisar los Logs

### En Railway:

1. Ve a tu servicio backend
2. Click en la pestaña **"Deployments"**
3. Click en el deployment más reciente
4. Click en **"View Logs"** o **"Logs"**

### Busca estos errores comunes:

#### Error 1: Variables de entorno faltantes
```
❌ Error en variables de entorno:
  - JWT_SECRET: Required
  - GEMINI_API_KEY: Required
```

**Solución:** Configura todas las variables requeridas en Railway → Variables

#### Error 2: Error de conexión a base de datos
```
Error: Can't reach database server
```

**Solución:** Verifica que `DATABASE_URL` esté correctamente configurada

#### Error 3: Error de Prisma
```
Error: Prisma Client not generated
```

**Solución:** Verifica que el build incluya `npm run prisma:generate`

#### Error 4: Puerto incorrecto
```
Error: Port already in use
```

**Solución:** Usa `process.env.PORT` (ya está configurado en el código)

---

## ✅ Soluciones Comunes

### Solución 1: Verificar Variables de Entorno

En Railway → Tu Servicio → Variables, asegúrate de tener:

```env
DATABASE_URL=<debe estar configurada>
JWT_SECRET=<mínimo 32 caracteres>
GEMINI_API_KEY=<tu API key>
NODE_ENV=production
```

**Generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Solución 2: Verificar Build Settings

En Railway → Tu Servicio → Settings → Build:

**Build Command:**
```bash
npm install && npm run prisma:generate && npm run build
```

**Start Command:**
```bash
npm run railway:deploy
```

O simplemente:
```bash
npm start
```

**Root Directory:**
```
backend
```

### Solución 3: Ejecutar Migraciones Manualmente

Si las migraciones fallan, ejecútalas manualmente:

1. Ve a Railway → Tu Servicio → Terminal
2. Ejecuta:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Solución 4: Verificar que el Servicio Esté Online

1. Ve a Railway → Tu Servicio
2. Verifica que haya un **punto verde** y diga **"Online"**
3. Si dice "Offline" o tiene un error, revisa los logs

---

## 🔍 Diagnóstico Paso a Paso

### 1. Revisa los Logs de Build

En Railway → Deployments → View Logs, busca:

✅ **Si ves esto, está bien:**
```
🚀 Server running on http://0.0.0.0:3001
📊 Environment: production
```

❌ **Si ves errores, cópialos y busca la solución**

### 2. Verifica el Estado del Servicio

- ✅ **Online** (verde) = El servicio está corriendo
- ❌ **Offline** (rojo) = El servicio no está corriendo
- ⚠️ **Building** (amarillo) = Está construyendo

### 3. Verifica la Base de Datos

1. Ve a tu servicio PostgreSQL en Railway
2. Verifica que esté **"Online"**
3. Copia la `DATABASE_URL` y verifica que esté correcta

---

## 🛠️ Solución Rápida

### Si el servicio no está corriendo:

1. **Revisa los logs** para ver el error específico
2. **Verifica las variables de entorno** (especialmente JWT_SECRET y GEMINI_API_KEY)
3. **Verifica el build command** en Settings
4. **Reinicia el servicio** (click en el servicio → tres puntos → Restart)

### Si las migraciones fallan:

1. Ve a Terminal en Railway
2. Ejecuta:
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Si hay errores de código:

1. Revisa los logs completos
2. Busca el error específico
3. Verifica que el código compile correctamente

---

## 📋 Checklist de Diagnóstico

- [ ] Revisé los logs en Railway
- [ ] Verifiqué que todas las variables de entorno estén configuradas
- [ ] Verifiqué que el servicio PostgreSQL esté Online
- [ ] Verifiqué que el build command sea correcto
- [ ] Verifiqué que el start command sea correcto
- [ ] Verifiqué que Root Directory sea `backend`
- [ ] Intenté reiniciar el servicio

---

## 🆘 Si Nada Funciona

1. **Copia los logs completos** del error
2. **Toma captura** de las variables de entorno (sin mostrar valores sensibles)
3. **Verifica** que el código compile localmente:
   ```bash
   cd backend
   npm install
   npm run build
   ```

---

## 💡 Errores Más Comunes

### Error: "JWT_SECRET must be at least 32 characters"
**Solución:** Genera una clave más larga:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Error: "GEMINI_API_KEY not found"
**Solución:** Agrega la variable `GEMINI_API_KEY` en Railway

### Error: "Cannot connect to database"
**Solución:** Verifica que `DATABASE_URL` esté correcta y que PostgreSQL esté Online

### Error: "Port 3001 already in use"
**Solución:** Railway maneja los puertos automáticamente, usa `process.env.PORT` (ya está configurado)

---

## 📞 Próximos Pasos

1. **Revisa los logs** y comparte el error específico que ves
2. **Verifica las variables de entorno**
3. **Reinicia el servicio** si es necesario
4. **Prueba el health check** nuevamente




