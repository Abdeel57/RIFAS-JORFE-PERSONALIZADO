# 🔧 Solución Error 502 - Backend No Responde

## ❌ Problema Actual

El backend está desplegado pero no responde:
```
https://paginas-production.up.railway.app/health
→ Error 502: Application failed to respond
```

---

## 🔍 Causas Posibles

### 1. Variables de Entorno Faltantes en Railway

El backend necesita estas variables para iniciar:

```env
DATABASE_URL=<ya está configurada>
JWT_SECRET=be8512578a3184c1582728f41048c693b8375d603406d0983c6eaae9d09d2dfe
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Verifica que `JWT_SECRET` esté configurada en Railway.

### 2. El Servicio No Está Iniciando Correctamente

Railway puede estar intentando iniciar pero fallando por falta de variables.

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar Variables en Railway

1. Ve a Railway → Tu Servicio Backend (PAGINAS-)
2. Click en **"Variables"**
3. Verifica que tengas:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | ✅ Debe estar (Railway la genera) |
| `JWT_SECRET` | `be8512578a3184c1582728f41048c693b8375d603406d0983c6eaae9d09d2dfe` |
| `NODE_ENV` | `production` |

**Si falta `JWT_SECRET`:**
1. Click en **"+ New Variable"**
2. Name: `JWT_SECRET`
3. Value: `be8512578a3184c1582728f41048c693b8375d603406d0983c6eaae9d09d2dfe`
4. Click **"Add"**

### Paso 2: Revisar los Logs de Deploy

1. Ve a Railway → Tu Servicio → **"Deployments"**
2. Click en el deployment más reciente
3. Click en **"View Logs"** o **"Deploy Logs"**
4. Busca estos mensajes:

✅ **Si ves esto, está bien:**
```
🚀 Server running on http://0.0.0.0:XXXX
📊 Environment: production
```

❌ **Si ves errores, cópialos aquí**

### Paso 3: Verificar Build Settings

Railway → Tu Servicio → **"Settings"** → **"Build"**:

- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run prisma:generate && npm run build`
- **Start Command:** `npm run railway:deploy` o `npm start`

### Paso 4: Reiniciar el Servicio

1. Railway → Tu Servicio
2. Click en los **tres puntos (⋯)**
3. Selecciona **"Restart"**
4. Espera a que termine el deploy
5. Revisa los logs nuevamente

---

## 🔍 Qué Buscar en los Logs

### Error Común 1: Variables Faltantes
```
❌ Error en variables de entorno:
  - JWT_SECRET: Required
```

**Solución:** Agrega `JWT_SECRET` en Railway Variables

### Error Común 2: Build Fallido
```
Error: Cannot find module...
```

**Solución:** Verifica que Root Directory sea `backend`

### Error Común 3: Puerto Incorrecto
```
Error: Port already in use
```

**Solución:** Railway maneja esto automáticamente, pero verifica los logs

---

## 📋 Checklist de Verificación

- [ ] `JWT_SECRET` está configurada en Railway Variables
- [ ] `DATABASE_URL` está configurada (Railway la genera)
- [ ] `NODE_ENV=production` está configurada
- [ ] Root Directory está configurado como `backend`
- [ ] Build Command es correcto
- [ ] Start Command es correcto
- [ ] El servicio muestra "Online" (punto verde)
- [ ] Revisé los logs de deploy
- [ ] Reinicié el servicio después de agregar variables

---

## 🆘 Si Aún No Funciona

Comparte esta información:

1. **¿Qué aparece en los "Deploy Logs"?**
   - Busca mensajes de Node.js
   - Busca errores en rojo
   - Busca el mensaje "Server running"

2. **¿El servicio muestra "Online" o "Offline"?**

3. **¿Tienes configuradas todas las variables?**
   - Especialmente `JWT_SECRET`

4. **¿Qué dice en "Build Logs"?**
   - ¿Se completó el build exitosamente?

---

## 💡 Próximos Pasos

Una vez que el backend responda:

1. ✅ Prueba el health check: `https://paginas-production.up.railway.app/health`
2. ✅ Prueba listar rifas: `https://paginas-production.up.railway.app/api/raffles`
3. ✅ Configura el frontend con `.env.local`
4. ✅ Prueba el admin panel

---

## 📝 Archivos de Configuración Creados

He creado estos archivos para el frontend:

### Frontend (`.env.local`):
```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

### Admin Panel (`admin-panel/.env`):
```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

**Nota:** Si los archivos `.env` no se crearon automáticamente, créalos manualmente con el contenido de arriba.





