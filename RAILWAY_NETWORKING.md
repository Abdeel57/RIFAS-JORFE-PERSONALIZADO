# 🌐 Configuración de Networking en Railway

## Generar Dominio Público para el Backend

### Paso 1: Identificar el Puerto

Tu backend está configurado para escuchar en el puerto que viene de la variable de entorno `PORT`, con un valor por defecto de **3001**.

### Paso 2: En Railway Networking

1. Ve a tu servicio backend en Railway
2. Click en la pestaña **"Settings"**
3. Ve a la sección **"Networking"**
4. En el campo **"Enter the port your app is listening on"**, ingresa:

```
3001
```

O el puerto que hayas configurado en la variable de entorno `PORT`.

### Paso 3: Generar Dominio

1. Click en el botón **"Generate Domain"** (botón morado)
2. Railway generará automáticamente una URL pública como:
   ```
   https://tu-backend-production.up.railway.app
   ```

### Paso 4: Verificar

Después de generar el dominio, prueba el health check:
```
https://tu-backend-production.up.railway.app/health
```

Debería responder: `{"status":"ok","timestamp":"..."}`

---

## 🔍 ¿Qué Puerto Usar?

### Opción 1: Puerto por Defecto (Recomendado)

Si no configuraste la variable `PORT` en Railway, usa:
```
3001
```

### Opción 2: Puerto Personalizado

Si configuraste `PORT` en las variables de entorno, usa ese valor.

**Ejemplo:**
- Si configuraste `PORT=8080` → usa `8080`
- Si configuraste `PORT=5000` → usa `5000`

### Opción 3: Puerto de Railway (Si hay dudas)

Railway puede asignar puertos dinámicamente. Para verificar:
1. Ve a los logs de tu servicio
2. Busca el mensaje: `🚀 Server running on http://0.0.0.0:XXXX`
3. El número después de `:` es tu puerto

---

## ⚠️ Notas Importantes

1. **Puerto Interno vs Externo:**
   - El puerto que ingresas es el **puerto interno** donde tu app escucha
   - Railway maneja automáticamente el puerto externo (80/443)
   - No necesitas configurar nada más

2. **Si tu app usa `process.env.PORT`:**
   - Railway asigna automáticamente un puerto
   - Usa ese puerto en el campo de Railway
   - O configura `PORT=3001` en las variables de entorno

3. **Después de generar el dominio:**
   - Railway te dará una URL pública HTTPS
   - Esta URL es la que usarás en `VITE_API_URL` del frontend
   - Formato: `https://tu-backend.up.railway.app/api`

---

## 📝 Ejemplo Completo

1. **En Railway Networking:**
   - Campo "Enter the port": `3001`
   - Click "Generate Domain"

2. **Railway genera:**
   ```
   https://rifas-nao-backend-production.up.railway.app
   ```

3. **Usa esta URL en:**
   - Frontend `.env.local`: `VITE_API_URL=https://rifas-nao-backend-production.up.railway.app/api`
   - Variables de entorno del backend (si necesitas CORS):
     - `FRONTEND_URL=https://tu-frontend.com`
     - `ADMIN_PANEL_URL=https://tu-admin.com`

---

## 🐛 Troubleshooting

### Error: "Connection refused"
- Verifica que el puerto sea correcto
- Revisa los logs para ver en qué puerto está escuchando tu app
- Asegúrate de que el servicio esté corriendo

### Error: "Port already in use"
- Railway maneja los puertos automáticamente
- Solo necesitas especificar el puerto interno
- Railway asignará el puerto externo (80/443) automáticamente

### El dominio no funciona
- Espera unos minutos después de generar el dominio
- Verifica que el servicio esté "Online" (punto verde)
- Revisa los logs para errores





