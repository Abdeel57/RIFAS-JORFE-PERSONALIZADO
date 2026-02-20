# Solución Rápida: Backend No Funciona

## 🚨 Problema: No Puedo Acceder a Ninguna Página

Si no puedes acceder a ninguna página, sigue estos pasos en orden:

## ⚡ Solución Rápida (5 minutos)

### 1. Verificar que el Backend Esté Corriendo en Railway

1. Ve a Railway → BACKEND → "Logs"
2. Busca mensajes que digan:
   - `🚀 Server running on http://...`
   - `✅ Servidor iniciado correctamente`

3. Si NO ves estos mensajes:
   - El servidor no está corriendo
   - Revisa los errores en los logs
   - Haz un redeploy

### 2. Verificar Health Check

Abre en tu navegador:
```
https://tu-backend.up.railway.app/health
```

**Si funciona:** Verás `{"status":"ok",...}`
**Si NO funciona:** El servidor no está corriendo o hay un error

### 3. Verificar que las Migraciones se Ejecutaron

En Railway → BACKEND → Terminal, ejecuta:
```bash
npx tsx src/scripts/check-admin.ts
```

**Si ves el admin:** Las migraciones funcionaron
**Si ves error:** Ejecuta las migraciones:
```bash
npm run prisma:migrate
```

### 4. Crear Usuario Admin

En Railway → BACKEND → Terminal:
```bash
npx tsx src/scripts/seed.ts
```

Deberías ver:
```
✅ Admin creado:
   Email: admin@rifasnao.com
   Password: admin123456
```

### 5. Probar Login Directamente

Usa cURL o Postman para probar el login:

```bash
curl -X POST https://tu-backend.up.railway.app/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@rifasnao.com\",\"password\":\"admin123456\"}"
```

**Si funciona:** Recibirás un token JWT
**Si NO funciona:** Revisa los logs del backend para ver el error

## 🔍 Diagnóstico Detallado

### Verificar Logs del Backend

1. Ve a Railway → BACKEND → "Logs"
2. Busca errores en rojo
3. Busca mensajes que empiecen con:
   - `❌` (errores)
   - `⚠️` (advertencias)
   - `💥` (errores críticos)

### Errores Comunes y Soluciones

#### Error: "Cannot connect to database"

**Solución:**
1. Verifica que el servicio DATABASE esté "Online" en Railway
2. Verifica que `DATABASE_URL` esté configurada en BACKEND → Variables
3. Verifica que no tenga espacios extra

#### Error: "Admin panel no encontrado"

**Solución:**
1. El build del admin panel falló
2. Revisa los logs del deployment
3. Haz un redeploy manual

#### Error: "Prisma Client not generated"

**Solución:**
En Railway → BACKEND → Terminal:
```bash
npm run prisma:generate
```

#### Error 404 en todas las rutas

**Solución:**
1. Verifica que el servidor esté corriendo
2. Verifica los logs para ver qué rutas están registradas
3. Verifica que las rutas `/api/*` estén definidas antes de `/admin/*`

## 🛠️ Solución: Desarrollar Localmente Primero

Si Railway no funciona, desarrolla localmente primero:

### Paso 1: Clonar y Configurar

```bash
# Ya tienes el código, solo configura
cd backend

# Instalar dependencias
npm install

# Crear .env (ver GUIA_DESARROLLO_BACKEND_LOCAL.md)
# Copiar DATABASE_URL de Railway o usar una local

# Generar Prisma
npm run prisma:generate

# Migraciones
npm run prisma:migrate

# Crear admin
npx tsx src/scripts/seed.ts

# Ejecutar
npm run dev
```

### Paso 2: Probar Localmente

1. Abre: `http://localhost:3001/health`
2. Prueba login: `http://localhost:3001/api/admin/auth/login`
3. Si funciona localmente, el problema está en Railway

### Paso 3: Desplegar a Railway

Una vez que funcione localmente:
1. Commit y push
2. Railway redesplegará
3. Debería funcionar igual que localmente

## 📋 Checklist de Verificación Rápida

- [ ] Servidor corriendo (ver logs)
- [ ] Health check funciona (`/health`)
- [ ] Base de datos conectada (ver logs)
- [ ] Migraciones ejecutadas (verificar con check-admin)
- [ ] Usuario admin existe (ejecutar seed)
- [ ] Login funciona (probar con cURL)

## 🆘 Si Nada Funciona

1. **Desarrolla localmente primero** (ver `GUIA_DESARROLLO_BACKEND_LOCAL.md`)
2. **Una vez que funcione localmente**, despliega a Railway
3. **Comparte los logs específicos** si necesitas ayuda

## 📞 Información para Debugging

Si necesitas ayuda, comparte:

1. **Logs del backend** (últimas 50 líneas)
2. **Respuesta del health check** (`/health`)
3. **Resultado de check-admin** (`npx tsx src/scripts/check-admin.ts`)
4. **Error específico** que ves al intentar acceder

