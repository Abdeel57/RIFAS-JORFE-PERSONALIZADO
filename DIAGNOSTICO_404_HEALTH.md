# Diagnóstico: Error 404 en /health

## 🔴 Problema

Cuando accedes a `https://tu-backend.up.railway.app/health` ves un error 404 "Not Found" de Railway.

## 🔍 Causas Posibles

1. **El servidor no está corriendo** (más probable)
2. **El build falló** y no se generó el código compilado
3. **Error al iniciar el servidor** (crash al arrancar)
4. **Puerto incorrecto** o servidor no escuchando

## ✅ Solución Paso a Paso

### Paso 1: Verificar los Logs del Deployment

1. Ve a Railway → BACKEND → "Deployments"
2. Haz clic en el último deployment
3. Revisa los logs del **build** y del **runtime**

**Busca estos mensajes:**

✅ **Si el servidor está corriendo, deberías ver:**
```
🚀 Server running on http://0.0.0.0:XXXX
✅ Servidor iniciado correctamente
```

❌ **Si hay errores, verás:**
```
💥 [SERVER] error
❌ Error...
⚠️ Warning...
```

### Paso 2: Verificar que el Build se Completó

En los logs del deployment, busca:

✅ **Build exitoso:**
```
Building admin panel...
Admin panel built successfully
Building backend...
Backend built successfully
```

❌ **Build fallido:**
```
npm error...
Build failed...
```

### Paso 3: Verificar que el Servidor Está Iniciando

En los logs de runtime (después del build), busca:

✅ **Servidor iniciando:**
```
=== STARTUP: begin ===
=== STARTUP: migrate deploy ===
=== STARTUP: migrate ok ===
=== STARTUP: launching node ===
🚀 Server running on...
```

❌ **Error al iniciar:**
```
=== STARTUP: migrate failed ===
Error: Cannot connect to database
Error: Module not found
```

### Paso 4: Verificar Variables de Entorno

En Railway → BACKEND → "Variables", verifica que tengas:

- ✅ `DATABASE_URL` (debe existir y ser válida)
- ✅ `JWT_SECRET` (mínimo 32 caracteres)
- ✅ `NODE_ENV=production` (opcional pero recomendado)
- ✅ `PORT` (Railway lo asigna automáticamente, no necesitas configurarlo)

### Paso 5: Verificar Root Directory

En Railway → BACKEND → "Settings":

- ✅ **Root Directory** debe ser: `backend`
- ❌ Si está vacío o es otra cosa, cámbialo a `backend`

## 🛠️ Soluciones Específicas

### Solución 1: El Servidor No Inicia

**Síntoma:** No ves "Server running" en los logs.

**Causa común:** Error en el código o falta una variable de entorno.

**Solución:**
1. Revisa los logs para ver el error específico
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que `DATABASE_URL` sea válida
4. Intenta hacer un redeploy

### Solución 2: El Build Falla

**Síntoma:** Ves errores durante el build.

**Causa común:** 
- El `package.json` está mal
- Faltan dependencias
- Error en el código TypeScript

**Solución:**
1. Revisa los errores del build en los logs
2. Verifica que `backend/package.json` exista y sea válido
3. Si el build del admin panel falla, verifica `admin-panel/package.json`
4. Haz commit y push de los cambios

### Solución 3: Error de Migraciones

**Síntoma:** Ves "migrate failed" en los logs.

**Solución:**
1. Verifica que `DATABASE_URL` sea correcta
2. Verifica que el servicio DATABASE esté "Online"
3. En la terminal de Railway, ejecuta:
   ```bash
   npm run prisma:migrate
   ```

### Solución 4: El Servidor Se Cae Inmediatamente

**Síntoma:** El servidor inicia pero se cae al instante.

**Causa común:** Error no capturado en el código.

**Solución:**
1. Revisa los logs para ver el error específico
2. Verifica que todas las dependencias estén instaladas
3. Verifica que Prisma Client esté generado

## 🔧 Verificación Rápida

Ejecuta estos comandos en Railway → BACKEND → Terminal:

```bash
# 1. Verificar que el código compilado existe
ls -la dist/

# 2. Verificar que Prisma Client está generado
ls -la node_modules/.prisma/client/

# 3. Verificar variables de entorno
echo $DATABASE_URL
echo $JWT_SECRET
echo $PORT

# 4. Intentar iniciar manualmente
node dist/index.js
```

## 📋 Checklist de Diagnóstico

- [ ] Revisé los logs del deployment
- [ ] El build se completó sin errores
- [ ] Veo "Server running" en los logs
- [ ] Las variables de entorno están configuradas
- [ ] Root Directory está configurado como `backend`
- [ ] El servicio DATABASE está "Online"
- [ ] No hay errores en los logs de runtime

## 🆘 Si Nada Funciona

1. **Haz un redeploy manual:**
   - Railway → BACKEND → "Deployments" → "Redeploy"

2. **Verifica que el código esté actualizado:**
   - Asegúrate de que el último commit esté en GitHub
   - Railway debería detectar los cambios automáticamente

3. **Desarrolla localmente primero:**
   - Sigue `GUIA_DESARROLLO_BACKEND_LOCAL.md`
   - Una vez que funcione localmente, despliega a Railway

## 📞 Información para Debugging

Si necesitas ayuda, comparte:

1. **Últimas 50 líneas de los logs** del deployment
2. **Mensajes de error específicos** que veas
3. **Estado del servicio** (Online/Offline)
4. **Variables de entorno** (sin mostrar valores sensibles)

