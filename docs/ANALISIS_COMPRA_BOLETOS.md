# Análisis: compra de boletos en la web pública

## Flujo completo

1. **Frontend (Netlify)** → Usuario entra a https://naorifas.netlify.app
2. **Carga inicial** → La app pide `/config.json` (mismo origen) para obtener la URL del API. Si no existe o falla, usa la URL por defecto o la variable de build `VITE_API_URL`.
3. **Rifas** → `GET /api/raffles?status=active` → Si falla, se muestra la rifa de **demostración** (id `iphone-16-pro-max-fallback`), que **no existe en el backend**.
4. **Boletos** → `GET /api/raffles/:id/tickets` → Si la rifa es la de demostración, el usuario ve todos como “disponibles” pero son ficticios.
5. **Checkout** → Usuario elige boletos, abre el modal, rellena datos y comprobante.
6. **Crear orden** → `POST /api/purchases` con `raffleId`, `ticketNumbers`, `user`.
7. **Comprobante** → `POST /api/purchases/:id/payment-proof` con la imagen en base64.

## Qué se corrigió en código

| Problema | Solución |
|----------|----------|
| URL del API como ruta relativa (404 en Netlify) | Base URL en **runtime** desde `/config.json`; si falla, uso de URL por defecto absoluta. |
| Compra con rifa de demostración | Si `raffleId === FALLBACK_RAFFLE_ID` se muestra aviso y **no se llama** al API de compra. |
| Usuario sin saber por qué falla | Aviso “Sin conexión con el servidor” cuando se usa la rifa fallback; mensajes de error integrados en el modal. |
| CORS en producción | Backend permite `naorifas.netlify.app` y patrones `*.netlify.app`, `*.railway.app`. |

## Qué debe estar bien configurado

1. **Backend (Railway)**  
   - Variable `FRONTEND_URL` = `https://naorifas.netlify.app` (para CORS).  
   - Base de datos con al menos una rifa **activa** y sus boletos creados.

2. **Frontend (Netlify)**  
   - En la raíz del sitio (o en `public/` antes del build) debe existir **`config.json`** con la URL real del API, por ejemplo:  
     `{ "apiUrl": "https://paginas-production.up.railway.app/api" }`  
   - Tras cambiar `config.json`, hacer un nuevo deploy (y opcionalmente limpiar caché de build en Netlify).

3. **Red**  
   - El backend debe ser accesible desde internet (Railway con dominio público).  
   - Sin bloqueos de firewall que impidan que el navegador llame al backend.

## Cómo comprobar que la compra funciona

1. Abrir https://naorifas.netlify.app y **no** ver el aviso “Sin conexión con el servidor”.
2. Ver una rifa real (título e imagen que coincidan con lo creado en el admin).
3. Elegir boletos, abrir checkout, rellenar datos y adjuntar comprobante.
4. Pulsar “Confirmar y Enviar”: no debe aparecer error y debe mostrarse la pantalla de confirmación.
5. En el admin (Railway), en compras, debe aparecer la nueva orden en estado “pendiente”.

Si algo falla, revisar en el navegador (F12 → Red) la URL exacta de las peticiones y el código de respuesta (200, 404, CORS, etc.).
