# 🔍 Cómo Verificar los Logs en Railway

## 📋 Problema: No Aparecen Logs

Si no ves logs en Railway después de intentar hacer login, puede ser por varias razones:

### 1. Verificar que el Backend Esté Corriendo

**Pasos:**
1. Ve a Railway → Tu Proyecto → Servicio Backend
2. Abre la pestaña **Deployments**
3. Verifica que el último deployment tenga estado **"Active"** (verde)
4. Si está en rojo o amarillo, hay un error en el build o inicio

### 2. Verificar los Logs del Servidor

**Pasos:**
1. Ve a Railway → Tu Proyecto → Servicio Backend
2. Abre la pestaña **Deployments**
3. Haz clic en el deployment más reciente
4. Haz clic en **"View Logs"** o **"Logs"**
5. Deberías ver logs que empiezan con:
   - `🔍 Iniciando servidor Express...`
   - `🚀 Server running on...`
   - `✅ Servidor iniciado correctamente`

**Si NO ves estos logs:** El servidor no está iniciando correctamente.

### 3. Probar el Endpoint de Health Check

**Desde tu navegador o Postman:**
```
GET https://paginas-production.up.railway.app/health
```

**Deberías ver:**
- Una respuesta JSON: `{ "status": "ok", ... }`
- En los logs de Railway: `🏥 [HEALTH] Health check llamado`

**Si NO funciona:** El servidor no está respondiendo.

### 4. Probar el Endpoint de Test de Logging

**Desde tu navegador:**
```
GET https://paginas-production.up.railway.app/test-logging
```

**Deberías ver:**
- Una respuesta JSON con `success: true`
- En los logs de Railway: `🧪 [TEST] Endpoint de prueba de logging llamado`

**Si NO ves los logs:** Hay un problema con el logging en Railway.

### 5. Verificar la URL del API en el Admin Panel

**Problema común:** El admin panel está usando una URL incorrecta del backend.

**Verificar:**
1. Ve a Railway → Tu Proyecto → Servicio Admin Panel
2. Abre la pestaña **Variables**
3. Busca `VITE_API_URL`
4. Debe ser: `https://paginas-production.up.railway.app/api`

**Si NO está configurada:**
1. Agrega la variable `VITE_API_URL` con valor `https://paginas-production.up.railway.app/api`
2. Haz un redeploy del admin panel

### 6. Verificar que la Petición Llegue al Backend

**Pasos:**
1. Abre las **Developer Tools** en tu navegador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Busca la petición a `/api/admin/auth/login`
5. Verifica:
   - **Status:** Debe ser 200 (éxito) o 401/400 (error, pero llegó)
   - **Request URL:** Debe ser `https://paginas-production.up.railway.app/api/admin/auth/login`
   - **Response:** Debe tener contenido

**Si la petición aparece como "failed" o "blocked":**
- Problema de CORS o red
- La URL del backend es incorrecta

**Si la petición NO aparece:**
- El admin panel no está haciendo la petición
- Hay un error en el código del frontend

### 7. Verificar los Logs en Tiempo Real

**Pasos:**
1. Ve a Railway → Tu Proyecto → Servicio Backend
2. Abre la pestaña **Deployments** → **View Logs**
3. Mantén la ventana abierta
4. Intenta hacer login desde otra ventana
5. Los logs deberían aparecer en tiempo real

**Si los logs NO aparecen en tiempo real:**
- Railway puede tener un delay
- Refresca la página de logs
- Verifica que estés viendo los logs del deployment correcto

## 🐛 Problemas Comunes

### Problema: "No veo ningún log"

**Causas posibles:**
1. El servidor no está corriendo
2. Estás viendo los logs del deployment incorrecto
3. Railway tiene un delay en mostrar logs

**Solución:**
- Verifica que el deployment esté "Active"
- Prueba el endpoint `/health` para confirmar que el servidor responde
- Espera 1-2 minutos y refresca los logs

### Problema: "Veo logs del servidor pero no de login"

**Causas posibles:**
1. La petición no está llegando al backend (CORS o URL incorrecta)
2. El admin panel está usando una URL incorrecta

**Solución:**
- Verifica `VITE_API_URL` en Railway
- Abre Developer Tools → Network y verifica la petición
- Prueba hacer login y revisa si aparece la petición en Network

### Problema: "Los logs aparecen pero muy tarde"

**Causa:** Railway puede tener un delay de 10-30 segundos en mostrar logs

**Solución:**
- Espera un momento después de hacer login
- Refresca la página de logs
- Usa el endpoint `/test-logging` para probar inmediatamente

## 📝 Próximos Pasos

1. **Prueba el endpoint `/health`** para confirmar que el servidor responde
2. **Prueba el endpoint `/test-logging`** para verificar que los logs funcionan
3. **Verifica `VITE_API_URL`** en Railway para el admin panel
4. **Abre Developer Tools → Network** y verifica la petición de login
5. **Comparte los resultados** de estas pruebas para diagnosticar el problema
