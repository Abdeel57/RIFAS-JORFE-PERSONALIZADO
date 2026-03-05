# Confirmación de pagos al cliente

---

## Mismo dominio

Cuando frontend, admin y API están en el mismo dominio (ej. `example.com`):

- **Frontend**: `example.com/` — usa `config.json` con `"apiUrl": "/api"`
- **Admin**: `example.com/admin/` — usa `VITE_API_URL` o fallback `/api` en producción
- **API**: `example.com/api/*`

Los enlaces del comprobante y verificador usan `window.location.origin` automáticamente.

---

## Implementado (versión manual con WhatsApp)

### Flujo actual

1. Admin marca una compra como **Pagado** (desde la lista o el modal).
2. El modal **se mantiene abierto** y muestra:
   - El **comprobante de pago** (imagen que subió el cliente).
   - Botón **Enviar por WhatsApp** — abre WhatsApp con el número del cliente y un mensaje predefinido.
   - Botón **Copiar mensaje** — copia el texto al portapapeles.

3. El admin hace clic en **Enviar por WhatsApp** → se abre WhatsApp Web/app con el mensaje listo.
4. El admin puede adjuntar manualmente el comprobante (imagen visible en el modal) si lo desea.

### Mensaje predefinido

```
✅ ¡Boletos pagados!

Tu pago fue confirmado correctamente.
🎫 Boletos: #046, #047
📍 Descárgalos aquí: [link comprobante digital]
🔗 Verifica aquí: [link verificador]

¡Gracias por participar! 🎉
```

- Si hay más de 5 boletos: se muestran los primeros 5 y "+N más".
- **Link comprobante**: `{FRONTEND_URL}/#comprobante?purchase={ID}` — página con comprobante digital descargable en PDF y QR.
- **Link verificador**: `{FRONTEND_URL}/#verify` — página donde el cliente consulta sus boletos por teléfono y ve estado "Pagado".
- Si admin y frontend están en dominios distintos, configura `VITE_FRONTEND_URL` en el admin (ej. `https://naorifas.netlify.app`).

### Comprobante digital

Al abrir el link "Descárgalos aquí", el cliente ve una página con:

- Logo y nombre del sitio
- Datos del cliente (nombre, teléfono, email)
- Rifa y fecha de sorteo
- Lista de boletos
- Total pagado
- Botones: **Copiar enlace** y **Descargar PDF**
- Código QR que lleva al verificador (`/#verify`)

### Dónde está

- **Admin → Compras** → Ver detalle de una compra **pagada**.
- También visible justo después de marcar "Marcar como Pagado" (el modal no se cierra).

---

## Pendiente (automatización futura)

- Envío automático de SMS/WhatsApp por API cuando se confirma el pago (Gemini o admin).
- Requiere: Twilio, WhatsApp Business API, o similar.
