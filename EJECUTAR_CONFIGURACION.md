# Ejecutar Configuración Manual - Instrucciones

## 🚀 Configuración Automatizada

He creado un script de PowerShell que hace todo automáticamente. Sigue estos pasos:

### Paso 1: Abrir PowerShell en la carpeta backend

1. Abre PowerShell
2. Navega a la carpeta backend:
   ```powershell
   cd C:\Users\Admin\Desktop\rifas-nao---sorteos-y-herramientas-ai\backend
   ```

### Paso 2: Ejecutar el script

```powershell
.\configurar-local.ps1
```

El script te pedirá:
1. **DATABASE_URL**: Pega la URL de Railway Database o usa una local
2. Automáticamente generará el JWT_SECRET

### Paso 3: El script hará todo automáticamente

- ✅ Instalará dependencias
- ✅ Creará el archivo .env
- ✅ Generará Prisma Client
- ✅ Ejecutará migraciones
- ✅ Creará el usuario administrador

### Paso 4: Probar que funcione

Después de que el script termine, ejecuta:

```powershell
npm run dev
```

Luego abre en tu navegador:
- `http://localhost:3001/health`
- `http://localhost:3001/api/raffles`

## 📋 Configuración Manual (Si prefieres hacerlo paso a paso)

Si prefieres hacerlo manualmente, sigue `CONFIGURACION_MANUAL_COMPLETA.md`

## 🔑 Obtener DATABASE_URL de Railway

1. Ve a Railway → DATABASE → "Variables"
2. Busca `DATABASE_URL`
3. Copia el valor completo
4. Pégalo cuando el script te lo pida

## ✅ Después de que funcione localmente

1. **Actualiza variables en Railway:**
   - Ve a Railway → BACKEND → "Variables"
   - Actualiza `DATABASE_URL` y `JWT_SECRET` con los mismos valores del .env local

2. **Haz commit y push:**
   ```powershell
   git add .
   git commit -m "Configuración completa"
   git push origin main
   ```

3. **Railway redesplegará automáticamente**

## 🆘 Si el script da error

1. Verifica que estés en la carpeta `backend/`
2. Verifica que tengas Node.js instalado: `node --version`
3. Verifica que tengas npm: `npm --version`
4. Si hay errores, compártelos y te ayudo a solucionarlos

