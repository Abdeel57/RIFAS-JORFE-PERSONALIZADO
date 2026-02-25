# 🔍 Cómo Verificar los Logs del Backend

## 📋 Pasos para Diagnosticar el Problema

### Paso 1: Ver los Logs del Backend

1. **Railway → Tu Proyecto**
2. **Click en el servicio Backend (PAGINAS-)**
3. **Click en la pestaña "Logs"** (arriba)
4. Busca los mensajes de inicio del servidor

### Paso 2: Buscar Mensajes Específicos

En los logs, busca estos mensajes:

**✅ Si ves esto, el código nuevo está funcionando:**
```
🔧 Configurando CORS...
✅ CORS configurado para permitir todos los orígenes
🚀 Server running on...
```

**❌ Si NO ves estos mensajes, el código nuevo NO se desplegó:**
- No ves "🔧 Configurando CORS..."
- No ves "✅ CORS configurado para permitir todos los orígenes"

### Paso 3: Verificar el Build

En los logs del deploy, busca:

**✅ Build exitoso:**
```
> rifas-nao-backend@1.0.0 build
> tsc
```

**❌ Si hay errores de compilación:**
```
error TS...
```

---

## 🚨 Si No Ves los Mensajes de CORS

Esto significa que el código nuevo NO se está ejecutando. Posibles causas:

1. **El build no se completó correctamente**
2. **Railway está usando código en caché**
3. **El código compilado (dist/) está desactualizado**

---

## ✅ Solución: Limpiar y Rebuild

He actualizado el código para limpiar el build antes de compilar. Esto asegura que no se use código viejo.

**Pasos:**

1. **Railway → Backend → Deployments**
2. **Click en "Redeploy"**
3. **Espera a que termine el build** (2-3 minutos)
4. **Verifica los logs** - Deberías ver los mensajes de CORS
5. **Reinicia el backend** (Settings → Restart)
6. **Prueba el login**

---

## 📋 Qué Buscar en los Logs

### Logs Correctos (Código Nuevo):

```
🔍 Iniciando servidor Express...
PORT: 3001
NODE_ENV: production
🔧 Configurando CORS...
ADMIN_PANEL_URL: https://fantastic-amazement-production.up.railway.app
FRONTEND_URL: undefined
✅ CORS configurado para permitir todos los orígenes
📦 Cargando configuración...
✅ Configuración cargada
📦 Cargando rutas...
✅ Todas las rutas cargadas correctamente
🚀 Server running on http://0.0.0.0:3001
```

### Logs Incorrectos (Código Viejo):

```
🚀 Server running on...
```

(Sin los mensajes de CORS)

---

## 🎯 Próximos Pasos

1. **Ver los logs del backend** (Railway → Backend → Logs)
2. **Comparte qué mensajes ves** - Especialmente busca los mensajes de CORS
3. **Si NO ves los mensajes de CORS**, el código nuevo no se desplegó
4. **Haz otro redeploy** después de que se actualice el código

¡Con los logs podremos ver exactamente qué está pasando!





