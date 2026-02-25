# 🔍 Cómo Interpretar los Logs de Login

## 📋 Logs que Deberías Ver en Railway

Después de intentar hacer login, deberías ver estos mensajes en los logs del backend:

### 1. Petición HTTP Recibida
```
📥 [POST] /api/admin/auth/login { origin: '...', 'content-type': 'application/json', body: { email: '...', passwordLength: ... } }
```

**Qué significa:** El servidor recibió la petición de login.

**Si NO aparece:** La petición no está llegando al backend (problema de CORS o red).

### 2. Inicio del Login
```
🔐 [LOGIN] Intento de login iniciado { body: { email: '...', password: '...' } }
```

**Qué significa:** El controlador de login comenzó a procesar la petición.

**Si NO aparece:** La petición llegó pero no se está procesando (problema de routing).

### 3. Email Parseado
```
📧 [LOGIN] Email parseado { email: 'admin@rifasnao.com', passwordLength: 12 }
```

**Qué significa:** Los datos fueron validados correctamente por Zod.

**Si NO aparece:** Hay un error de validación (email o password inválidos).

### 4. Búsqueda de Admin
```
👤 [LOGIN] Resultado de búsqueda de admin { adminFound: true, adminId: '...', adminEmail: 'admin@rifasnao.com' }
```

**Qué significa:** Se encontró el admin en la base de datos.

**Si `adminFound: false`:** El admin no existe o el email es incorrecto.

### 5. Comparación de Contraseña
```
🔑 [LOGIN] Comparación de contraseña { isValidPassword: true, passwordHashLength: 60 }
```

**Qué significa:** La contraseña es válida.

**Si `isValidPassword: false`:** La contraseña es incorrecta.

### 6. Generación de Token
```
🎫 [JWT] Generando token { payload: { adminId: '...', email: '...', role: 'admin' }, expiresIn: '7d', jwtSecretLength: ... }
✅ [JWT] Token generado exitosamente { tokenLength: ... }
```

**Qué significa:** El token JWT se generó correctamente.

**Si aparece un error:** `JWT_SECRET` no está configurado o es muy corto.

### 7. Login Exitoso
```
✅ [LOGIN] Login exitoso { tokenLength: ..., adminId: '...' }
```

**Qué significa:** El login fue exitoso y se devolvió el token.

### 8. Errores
```
❌ [LOGIN] Admin no encontrado { email: '...' }
❌ [LOGIN] Contraseña inválida { email: '...' }
❌ [ERROR HANDLER] { path: '/api/admin/auth/login', method: 'POST', errorType: '...', errorMessage: '...' }
```

**Qué significa:** Hubo un error en el proceso de login.

## 🔍 Qué Buscar en los Logs

### Si NO ves NINGÚN log de `[LOGIN]`:
- **Problema:** La petición no está llegando al backend
- **Causas posibles:**
  - Error de CORS (la petición se bloquea antes de llegar)
  - URL incorrecta del backend
  - El servidor no está corriendo

### Si ves `📥 [POST]` pero NO ves `🔐 [LOGIN]`:
- **Problema:** La ruta no está configurada correctamente
- **Solución:** Verificar que `/api/admin/auth/login` esté registrada

### Si ves `❌ [LOGIN] Admin no encontrado`:
- **Problema:** El email no existe en la base de datos
- **Solución:** Verificar que el admin exista con `npm run check:admin`

### Si ves `❌ [LOGIN] Contraseña inválida`:
- **Problema:** La contraseña es incorrecta
- **Solución:** Verificar que uses exactamente `admin123456`

### Si ves error en `🎫 [JWT]`:
- **Problema:** `JWT_SECRET` no está configurado o es muy corto
- **Solución:** Verificar que `JWT_SECRET` tenga al menos 32 caracteres en Railway

## 📝 Pasos para Diagnosticar

1. **Intenta hacer login** desde el admin panel
2. **Ve a Railway** → Servicio Backend → Deployments → View Logs
3. **Busca los mensajes** que empiezan con `📥`, `🔐`, `📧`, `👤`, `🔑`, `🎫`, `✅`, o `❌`
4. **Copia TODOS los logs** relacionados con `[LOGIN]` o `[JWT]`
5. **Compártelos** para que pueda analizarlos

Los logs te dirán exactamente en qué paso está fallando el proceso de login.





