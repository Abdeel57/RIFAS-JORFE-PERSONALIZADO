# Confirmación de pagos al cliente

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
¡Boletos pagados! Tu pago fue confirmado. Boletos: #046, #047. Rifa: BOVEDA VIP. Verifica aquí: [link]
```

- Si hay más de 5 boletos: se muestran los primeros 5 y "+N más".
- Incluye enlace de verificación (origen del admin + `/#verify?purchase=ID`).

### Dónde está

- **Admin → Compras** → Ver detalle de una compra **pagada**.
- También visible justo después de marcar "Marcar como Pagado" (el modal no se cierra).

---

## Pendiente (automatización futura)

- Envío automático de SMS/WhatsApp por API cuando se confirma el pago (Gemini o admin).
- Requiere: Twilio, WhatsApp Business API, o similar.
