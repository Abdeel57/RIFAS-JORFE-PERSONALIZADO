# 🔗 Construir DATABASE_URL Completa

## Información que tienes:
- Host: `yamabiko.proxy.rlwy.net`
- Puerto: `33083`

## Formato de DATABASE_URL para PostgreSQL:

```
postgresql://USUARIO:PASSWORD@HOST:PUERTO/DATABASE
```

## Para Railway PostgreSQL, normalmente es:

```
postgresql://postgres:PASSWORD@yamabiko.proxy.rlwy.net:33083/railway
```

---

## 📋 Cómo obtener la contraseña completa:

1. Ve a **Railway** → Tu servicio **PostgreSQL**
2. Click en la pestaña **"Variables"**
3. Busca `DATABASE_URL` o `POSTGRES_PASSWORD`
4. Si encuentras `DATABASE_URL`, cópiala completa (ya tiene todo)
5. Si solo encuentras `POSTGRES_PASSWORD`, úsala para construir la URL

---

## 🔍 Opciones:

### Opción 1: Si Railway ya tiene DATABASE_URL configurada
Simplemente cópiala completa y úsala.

### Opción 2: Si solo tienes la contraseña
Construye la URL así:
```
postgresql://postgres:TU_PASSWORD@yamabiko.proxy.rlwy.net:33083/railway
```

### Opción 3: Si no encuentras la contraseña
Railway la genera automáticamente. Busca en las variables del servicio PostgreSQL.





