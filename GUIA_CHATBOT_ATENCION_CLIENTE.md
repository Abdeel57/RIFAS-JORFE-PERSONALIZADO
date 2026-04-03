# 📋 GUÍA COMPLETA DE LA PLATAFORMA DE RIFAS — DOCUMENTO PARA CHATBOT DE ATENCIÓN AL CLIENTE

> **Propósito:** Este documento está diseñado para que un asistente de IA proporcione atención al cliente precisa sobre el funcionamiento de la plataforma de rifas. Incluye descripción de la página web pública, flujo de compra del usuario, y manejo completo del panel de administración.

---

## 🌐 PARTE 1 — PÁGINA WEB PÚBLICA (LO QUE VE EL CLIENTE)

### ¿Qué es la plataforma?

La plataforma es un sistema de rifas en línea donde los usuarios pueden:
1. Ver rifas activas con fotos del premio, precio por boleto y fecha de sorteo
2. Seleccionar los boletos que desean comprar
3. Pagar mediante transferencia bancaria SPEI
4. Subir su comprobante de pago
5. Recibir confirmación de sus boletos digitales

---

### 1.1 Página Principal — Información de la Rifa

Al ingresar al sitio, el cliente verá la rifa activa con los siguientes elementos:

| Elemento | Descripción |
|---|---|
| **Imagen del premio** | Foto principal del artículo rifado |
| **Título y subtítulo** | Nombre de la rifa |
| **Descripción** | Detalles completos del premio |
| **Precio por boleto** | Costo unitario en pesos mexicanos (MXN) |
| **Contador de tiempo** | Cuenta regresiva hasta la fecha del sorteo (si está activado) |
| **Galería de imágenes** | Fotos adicionales del premio (hasta 2 imágenes extra) |
| **Video** | Video del premio integrado desde YouTube (si existe) |
| **Progreso de venta** | Barra que muestra el porcentaje de boletos vendidos |

---

### 1.2 Selector de Boletos

El cliente puede elegir sus boletos de las siguientes formas:

- **Selección manual**: Hace clic en los números específicos que desea
- **Selección aleatoria**: La página selecciona boletos disponibles de forma automática

**Colores de estado de los boletos:**
- 🟢 **Verde / Disponible**: El boleto está libre para comprar
- 🔴 **Rojo / No disponible**: El boleto ya fue comprado o está reservado
- 🔵 **Azul / Seleccionado**: El cliente lo tiene seleccionado actualmente

**Importante:** Los boletos seleccionados se reservan temporalmente mientras el cliente completa su pago. Si no se paga en el tiempo establecido, los boletos se liberan automáticamente.

---

### 1.3 Promociones por Cantidad (Tiers)

La plataforma puede ofrecer descuentos escalonados. Ejemplo:
- 1 boleto = $50
- 3 boletos = $120 (ahorro de $30)
- 5 boletos = $180 (ahorro de $70)

Cuando hay promociones activas, el sistema calcula automáticamente el precio más barato según la cantidad seleccionada.

---

### 1.4 Proceso de Compra — Paso a Paso

#### **PASO 1 — Datos del Comprador**

El cliente debe llenar un formulario con:
- **Nombre completo** (requerido) — Se usa para identificar el pago
- **WhatsApp** (requerido, 10 dígitos) — Para recibir confirmaciones
- **Estado de residencia** (requerido) — Lista de todos los estados de México

> 💡 **Autocompletado:** Si el cliente ya compró antes, el sistema detecta su nombre o teléfono y rellena los datos automáticamente. Puede usar datos distintos si lo desea.

#### **PASO 2 — Pago y Comprobante**

El cliente verá los datos bancarios para hacer la transferencia:

| Campo | Descripción |
|---|---|
| **Banco** | Nombre de la institución bancaria |
| **CLABE** | Número interbancario de 18 dígitos (con botón para copiar) |
| **Beneficiario** | Nombre del titular de la cuenta |
| **Total a pagar** | Monto exacto en pesos MXN |

> ⚠️ **MUY IMPORTANTE para el cliente:** El cliente debe escribir su **nombre completo** en el **concepto/referencia** de la transferencia. Esto permite que el sistema identifique el pago automáticamente.

**Subir el comprobante:**
- El cliente toma foto o captura de pantalla de su comprobante bancario
- Lo sube directamente desde su teléfono o computadora
- Formatos aceptados: JPG, PNG, WEBP
- Tamaño máximo: 10 MB
- También puede arrastrar y soltar el archivo (drag & drop) desde la computadora

#### **PASO 3 — Verificación del Pago**

Existen dos flujos dependiendo de la configuración del administrador:

**Flujo A — Verificación Automática con IA (cuando está activada):**
1. El sistema analiza automáticamente el comprobante con inteligencia artificial
2. Verifica: nombre del cliente, monto, cuenta destino y fecha del pago
3. Si todo está correcto → el pago se **aprueba automáticamente** en segundos
4. El cliente ve una pantalla de confirmación con sus boletos
5. Si hay algún error → pasa a revisión manual

**Flujo B — Verificación Manual (cuando la IA está desactivada):**
1. El cliente sube el comprobante
2. Aparece un botón verde **"Validar pago"** de WhatsApp
3. Al hacer clic, se abre WhatsApp con un mensaje pre-llenado hacia el administrador, que incluye:
   - Nombre del cliente
   - Números de boletos reservados
   - Monto a pagar
   - Código de reservación
4. El administrador revisa y confirma manualmente

#### **PASO 4 — Confirmación Final**

Cuando el pago es aprobado:
- Se muestra una pantalla de éxito con los números de boletos confirmados
- El cliente puede descargar/imprimir su **boleto digital** como comprobante

---

### 1.5 Boleto Digital (Comprobante)

El boleto digital incluye:
- Nombre de la plataforma y logo
- Nombre del cliente
- Números de boletos asignados
- Nombre de la rifa
- Fecha y hora de la compra
- Código de verificación único

---

### 1.6 Verificador de Boletos

La plataforma cuenta con una sección de verificación pública donde cualquier persona puede consultar si un boleto está pagado o reservado, ingresando el número de teléfono del comprador.

---

### 1.7 Preguntas Frecuentes (FAQ) en la Página

La página incluye una sección de preguntas frecuentes con las siguientes respuestas oficiales:

**¿Cómo se eligen a los ganadores?**
Los sorteos se basan legalmente en los últimos dígitos del Premio Mayor de la Lotería Nacional para la Asistencia Pública. Transparencia total garantizada.

**¿Cómo recibo mis boletos?**
Una vez confirmado el pago, el cliente recibirá un mensaje automático por WhatsApp con su boleto digital foliado y comprobante de participación.

**¿Qué pasa si resulto ganador?**
Se pondrán en contacto de inmediato al teléfono registrado. La entrega del premio se coordina personalmente y se transmite en vivo por Facebook.

**¿Es seguro participar?**
Sí, es una comunidad verificada con cientos de entregas reales documentadas en redes sociales. El pago y los boletos siempre están protegidos.

---

### 1.8 Sección de Facebook

La página muestra la página oficial de Facebook del organizador con un plugin que permite al cliente seguir la página directamente desde el sitio web.

---

## 🛠️ PARTE 2 — PANEL DE ADMINISTRACIÓN

### 2.1 Acceso al Panel

El panel de administración está en una URL separada del sitio público (generalmente en `/admin`).

**Credenciales de acceso:**
- Se requiere **correo electrónico** (o nombre de usuario) y **contraseña**
- Sesión protegida con token JWT

**Roles de usuario en el panel:**
| Rol | Permisos |
|---|---|
| **super_admin** | Acceso completo a todo, incluyendo gestión de otros administradores |
| **admin** | Puede gestionar rifas, pagos, boletos y configuración |
| **vendedor** | Solo puede ver órdenes y boletos; no puede crear/editar rifas ni acceder a configuración avanzada |

---

### 2.2 Panel Principal (Dashboard)

Es la pantalla principal que muestra las **órdenes de compra** (ventas de boletos).

**Filtros disponibles:**
- **Pendientes**: Compras que esperan verificación de pago (se muestran con indicador ámbar parpadeante)
- **Todas**: Historial completo
- **Pagadas**: Solo compras confirmadas

**Información de cada orden:**
- Nombre del cliente
- Número de teléfono (WhatsApp)
- Tiempo transcurrido desde la compra
- Nombre de la rifa
- Números de boletos reservados
- Monto total
- Estado: Pendiente / Pagado / Liberado

**Acciones disponibles por orden:**

| Acción | Descripción |
|---|---|
| **👁 Ver comprobante** | Muestra la imagen del comprobante bancario subido por el cliente |
| **✅ Confirmar pago** | Marca la orden como pagada. Automáticamente abre WhatsApp para notificar al cliente con el link de su boleto digital |
| **✏️ Editar datos** | Permite corregir el nombre o teléfono del cliente |
| **❌ Liberar boletos** | Cancela la orden y libera los boletos para que otros puedan comprarlos |
| **💬 Enviar WhatsApp** | Abre WhatsApp con mensaje pre-llenado de confirmación hacia el cliente |

> **Nota sobre verificación automática:** Si la IA verificó el pago automáticamente, la orden aparecerá con la etiqueta **"Banxico ✓"** indicando verificación exitosa.

---

### 2.3 Gestión de Rifas

Esta sección permite crear, editar y gestionar todas las rifas.

#### Crear una Nueva Rifa

El proceso usa un asistente de 3 pasos (wizard):

**Paso 1 — Información General:**
| Campo | Descripción | Req. |
|---|---|---|
| Título | Nombre de la rifa | ✅ |
| Subtítulo | Descripción corta | ❌ |
| Descripción | Texto detallado del premio | ✅ |

**Paso 2 — Multimedia:**
| Campo | Descripción | Req. |
|---|---|---|
| Imagen del Premio | Foto principal (formato 16:9) | ✅ |
| Galería Imagen 1 | Foto adicional del premio | ❌ |
| Galería Imagen 2 | Segunda foto adicional | ❌ |
| URL de Video | Link de YouTube del premio | ❌ |

**Paso 3 — Configuración Final:**
| Campo | Descripción | Req. |
|---|---|---|
| Precio por boleto | Costo en pesos MXN | ✅ |
| Total de boletos | Número total disponibles | ✅ |
| Fecha del sorteo | Fecha y hora del sorteo | ✅ |
| Estado | Activa / Borrador / Completada | ✅ |
| Modo virtual | Si está activo, los boletos se crean al momento de la compra (no pre-generados) | ❌ |
| Oportunidades | Cuántas veces puede comprarse el mismo número de boleto | ❌ |

#### Estados de una Rifa:
- **🟡 Borrador**: Solo visible para el admin, no para el público
- **🟢 Activa**: Visible al público, aceptando compras
- **⚫ Completada**: Rifa finalizada, no acepta más compras

#### Acciones del Menú de Opciones (⋮) por Rifa:

| Opción | Descripción |
|---|---|
| **Ver emisiones** | Muestra todos los boletos con su estado (libre, apartado, pagado) |
| **Importar emisiones** | Permite registrar manualmente boletos de clientes (importación masiva) |
| **Promoción** | Configura descuentos por cantidad de boletos |
| **Ganador** | Herramienta para seleccionar al ganador del sorteo |
| **Eliminar** | Borra la rifa permanentemente (acción irreversible) |

---

### 2.4 Vista de Boletos de una Rifa

Al seleccionar "Ver emisiones" de una rifa, el administrador puede:

- **Buscar boletos** por número, nombre del cliente o teléfono
- **Ver el estado** de cada boleto: Libre, Apartado (reservado) o Pagado
- **Exportar a Excel** — Genera un archivo .xlsx con dos hojas:
  - "Boletería Completa": Todos los boletos con estado
  - "Solo Pagados": Lista filtrada de boletos pagados
  
  El Excel incluye: número de boleto, estado, nombre del cliente, teléfono, email, fecha de compra y método de pago.

---

### 2.5 Importar Boletos Manualmente

Esta función permite registrar compras que se hicieron fuera del sistema (por ejemplo, en efectivo o por otro medio).

**Proceso:**
1. Desde el menú ⋮ de la rifa, seleccionar "Importar emisiones"
2. Elegir entre importación **manual** (ingresar uno por uno) o **automática** (desde archivo)
3. Proporcionar los datos del cliente y los números de boletos
4. Confirmar la importación

---

### 2.6 Sorteo del Ganador

Desde el menú ⋮ de una rifa activa:

**Método 1 — Ruleta Aleatoria:**
1. Seleccionar "Ganador" → "Ruleta"
2. El sistema anima una ruleta entre todos los boletos **pagados**
3. El sistema va desacelerando gradualmente hasta seleccionar un ganador
4. Se muestra el número y nombre del ganador
5. El admin puede **confirmar oficialmente** al ganador

**Método 2 — Selección Manual:**
1. El admin busca el boleto ganador en la lista
2. Hace clic en "Seleccionar como ganador"
3. Confirma la selección

> Al declarar oficialmente un ganador, la rifa cambia automáticamente a estado **"Completada"** y se registra el ganador en la descripción de la rifa.

---

### 2.7 Promociones por Cantidad

Desde el menú ⋮ → "Promoción":

El administrador puede configurar precios especiales según la cantidad de boletos comprados:

- **Título de la promoción** (ej: "Oferta especial por tiempo limitado")
- **Descripción** 
- **Tiers de precio** — Agregar tantos niveles como se desee:
  - Ejemplo: 3 boletos = $100, 5 boletos = $150, 10 boletos = $250

Los tiers se muestran automáticamente en la página pública y el sistema aplica el descuento correspondiente.

---

### 2.8 Gestión de Compras (Módulo Purchases)

Vista detallada de todas las ventas con opciones de búsqueda y filtrado avanzado.

---

### 2.9 Gestión de Boletos (Módulo Tickets)

Vista global de boletos de todas las rifas con estado detallado.

---

### 2.10 Gestión de Usuarios (Clientes)

Lista de todos los clientes que han realizado compras en la plataforma.

**Información disponible por usuario:**
- Nombre completo
- Número de teléfono
- Estado/ciudad de residencia
- Historial de compras

---

## ⚙️ PARTE 3 — CONFIGURACIÓN DEL SISTEMA (Settings)

### 3.1 Identidad de Marca

#### Logo y Nombre del Sitio
- **Nombre del sitio**: Texto que aparece en el encabezado (máximo 30 caracteres)
- **Logo**: Imagen PNG/WebP transparente recomendada para mejor acabado
  - Se carga desde el panel y se comprime automáticamente
  - No puede superar 512px en ninguna dimensión
- **Tamaño del logo**: Control deslizante de 24px a 96px (recomendado: 44px)

#### Colores de Interfaz
- **Color Primario**: Color principal de botones y elementos interactivos
- **Color Secundario**: Se calcula automáticamente como complemento del primario
- **Vista previa en vivo**: El panel muestra cómo se verán los colores en la página antes de guardar

---

### 3.2 Métodos de Pago

Se pueden configurar **múltiples cuentas bancarias**. Los clientes podrán elegir a cuál transferir.

**Por cada método de pago se configura:**
| Campo | Descripción |
|---|---|
| Nombre del banco | Ej: BBVA, Banamex, HSBC... |
| CLABE | Número interbancario de 18 dígitos |
| Beneficiario | Nombre del titular de la cuenta |
| Número de cuenta | Opcional |
| Estado | Activo / Inactivo |

**Gestión:**
- **Agregar tarjeta**: Crear nuevo método de pago
- **Activar/Desactivar**: Controla si ese método está disponible para los clientes
- **Editar**: Modificar los datos bancarios
- **Eliminar**: Borrar un método de pago

> Si no hay ningún método activo, la plataforma usará los datos bancarios de la configuración general como respaldo.

---

### 3.3 Validación de Pagos (IA)

**Verificación Automática (IA):**
- Cuando está **Activa**: El sistema usa inteligencia artificial (Google Gemini Vision) para analizar los comprobantes automáticamente
  - Verifica el nombre del cliente en el concepto
  - Verifica que el monto coincida con el total de la compra
  - Verifica la cuenta/banco de destino
  - Verifica que la fecha no sea futura
  - Los pagos correctos se aprueban en segundos
  - Los pagos dudosos quedan para revisión manual del administrador
  
- Cuando está **Manual (Desactivada)**: Todos los pagos requieren confirmación manual del administrador. El cliente es dirigido a WhatsApp para enviar su comprobante directamente.

---

### 3.4 Contacto y Soporte

| Campo | Descripción |
|---|---|
| **WhatsApp** | Número de 10 dígitos (sin código de país) — aparece en el sitio y se usa para enviar mensajes automáticos |
| **Email de contacto** | Correo electrónico de la empresa |

---

### 3.5 Redes Sociales

| Campo | Descripción |
|---|---|
| **Instagram** | Usuario de Instagram (con o sin @) |
| **Facebook** | URL completa de la página de Facebook oficial |

---

### 3.6 Marketing — Meta Pixel (Facebook Pixel)

- **Facebook Pixel ID**: ID del pixel de seguimiento de Meta
- Permite rastrear conversiones, compras y comportamiento de usuarios para campañas de publicidad en Facebook/Instagram
- Se activa automáticamente en eventos clave: inicio de checkout, compra completada, etc.

---

### 3.7 Herramientas y Funciones Avanzadas

**Configuración de liberación automática de boletos:**
- Cada rifa puede tener un tiempo de expiración para reservas no pagadas
- Configuración en horas (ej: si un cliente reserva boletos y no paga en 2 horas, se liberan automáticamente)

**Números de la suerte:**
- Se pueden configurar números específicos que aparecen destacados en el selector de boletos

---

### 3.8 Notificaciones Push

El administrador puede recibir notificaciones en tiempo real cuando se realiza una nueva compra:

- **Activar**: El navegador solicita permiso para mostrar notificaciones
- **Desactivar**: Se detienen las notificaciones en ese dispositivo
- **Probar sonido**: Verifica que el audio de notificación funcione
- **Enviar Push de prueba**: Envía una notificación de prueba para verificar que todo funciona

> Las notificaciones son **por dispositivo** — si el admin usa varios dispositivos, debe activarlas en cada uno.

---

### 3.9 Control de Acceso — Gestión de Administradores

*(Solo disponible para super_admin)*

**Crear nuevo administrador:**
- Nombre (mínimo 2 caracteres)
- Correo/usuario (mínimo 3 caracteres)
- Contraseña (mínimo 6 caracteres)
- Rol: `admin` o `vendedor`
- Plan (opcional): `mensual` o `por_rifa`

**Tipos de plan:**
| Plan | Descripción |
|---|---|
| `mensual` | Acceso mensual con fecha de expiración |
| `por_rifa` | Acceso limitado al manejo de rifas individuales, no puede crear rifas nuevas |

**Acciones sobre administradores:**
- Ver información del plan y fecha de expiración
- Cambiar el plan asignado
- Eliminar el administrador

> ⚠️ Siempre debe existir al menos un administrador en el sistema.

---

## 📱 PARTE 4 — MENSAJES DE WHATSAPP AUTOMÁTICOS

### 4.1 Mensaje de Confirmación de Pago (Enviado por el Admin)

Cuando el admin hace clic en "Confirmar pago", se abre WhatsApp automáticamente con este mensaje al cliente:

```
✅ ¡Hola [Nombre del Cliente]! Tu pago ha sido confirmado correctamente.

¡Gracias por participar! 🎟️

🎫 Boletos: #001, #025, #087
📍 Boleto Digital: [Link al comprobante digital]
🔗 Verificar: [Link al verificador]

¡Mucha suerte! 🍀
```

### 4.2 Mensaje de Validación Manual (Enviado por el Cliente)

Cuando el cliente hace clic en "Validar pago" (modo sin verificación automática):

```
[NOMBRE DE LA PLATAFORMA] 🎟️

¡Hola! 👋 Soy [Nombre] de [Estado].

He reservado [N] boleto(s) para el evento:
🏆 [Nombre de la Rifa]

💰 Monto a pagar: $[Total]

🔢 Mis números:
🎟 000001
🎟 000025
...

📸 Por favor, envíame tu comprobante de pago por este medio para confirmar mi participación.
```

### 4.3 Mensaje de Soporte (Problema con verificación automática)

Si la IA rechaza el pago, el cliente puede contactar soporte vía WhatsApp con este mensaje pre-llenado:

```
¡Hola! 👋 Necesito ayuda con mi pago por favor.

👤 Nombre: [Nombre del Cliente]
🎟️ Boletos para: [Nombre de la Rifa]
📝 Situación: [Descripción del problema específico]

Me gustaría que verifiquen mi comprobante manualmente para confirmar mis boletos. ¡Muchas gracias! 🙏
```

---

## ❓ PARTE 5 — PREGUNTAS FRECUENTES PARA EL CHATBOT

### Preguntas sobre la Compra

**¿Cómo compro un boleto?**
1. Elige los números que quieres en el selector de boletos
2. Haz clic en "Apartar" o "Comprar"
3. Llena tus datos: nombre completo, WhatsApp y estado
4. Realiza la transferencia al banco indicado con tu nombre en el concepto
5. Toma foto de tu comprobante y súbelo en la plataforma
6. Espera la confirmación (automática o manual según configuración)

**¿Cuánto tiempo tengo para pagar después de reservar?**
Los boletos reservados se liberan automáticamente si no se completa el pago en el tiempo configurado por el administrador (generalmente 1-24 horas). Si tus boletos se liberaron, deberás seleccionarlos nuevamente si están disponibles.

**¿Puedo elegir mis números de boleto?**
Sí, puedes seleccionar manualmente los números que prefieras de entre los disponibles. También puedes usar la selección aleatoria si no tienes preferencia.

**¿Por qué mi pago no se verificó automáticamente?**
Las razones más comunes son:
- Tu nombre en la transferencia no coincide con el registrado en la plataforma
- El monto transferido es diferente al total indicado
- La cuenta de destino es diferente a la de la plataforma
- El comprobante está borroso o incompleto

En cualquiera de estos casos, el equipo puede revisar tu pago manualmente. Usa el botón de WhatsApp para contactar soporte.

**¿Cómo sé si mis boletos están confirmados?**
Puedes verificar el estado de tus boletos entrando al verificador de la plataforma con tu número de teléfono. También recibirás un mensaje de WhatsApp cuando el pago sea confirmado.

**¿Puedo comprar más de un boleto?**
Sí, puedes seleccionar múltiples boletos en una sola compra. Además, si hay promociones activas, comprar más boletos puede salirte más barato por unidad.

**¿Qué métodos de pago aceptan?**
La plataforma acepta únicamente transferencias bancarias (SPEI) a la(s) cuenta(s) indicadas. No se aceptan pagos en efectivo, tarjeta de débito/crédito directa ni PayPal a través del sitio web.

**¿Puedo cancelar mi compra?**
Una vez subido el comprobante, la compra no puede cancelarse directamente por el cliente. Para cualquier situación especial, contacta al administrador vía WhatsApp.

---

### Preguntas sobre el Sorteo

**¿Cuándo es el sorteo?**
La fecha y hora del sorteo se muestra en la página principal de la rifa. Si está activado el contador de tiempo, también verás cuánto falta.

**¿Cómo se determina el ganador?**
El ganador se decide basándose en los últimos dígitos del Premio Mayor de la Lotería Nacional. Esta información es pública y verificable, garantizando total transparencia.

**¿Cómo me avisan si gano?**
Si resultas ganador, el equipo se comunicará contigo inmediatamente al número de WhatsApp registrado en tu compra. La entrega del premio se coordina personalmente.

**¿El sorteo se transmite en vivo?**
Sí, el sorteo se transmite en vivo a través de la página de Facebook oficial para que todos los participantes puedan verlo.

---

### Preguntas sobre Problemas Técnicos

**No puedo subir mi comprobante, ¿qué hago?**
- Verifica que la imagen sea JPG, PNG o WEBP
- El archivo no debe superar los 10 MB
- Prueba reduciendo el tamaño de la imagen o tomando una foto con menor resolución
- Si el problema persiste, contacta a soporte vía WhatsApp

**La página no carga o hay error, ¿qué hago?**
- Recarga la página (F5 o el botón de recargar)
- Limpia el caché del navegador
- Prueba desde otro navegador
- Si sigues sin poder acceder, contacta soporte

**Mis boletos desaparecieron, ¿qué pasó?**
Si seleccionaste boletos pero no completaste el pago en el tiempo límite, el sistema los liberó automáticamente. Si ya pagaste y no ves tus boletos, contacta soporte con tu comprobante.

---

## 🔐 PARTE 6 — SEGURIDAD Y PRIVACIDAD

- Los datos personales (nombre, teléfono, estado) se usan únicamente para identificar y confirmar la compra
- Las imágenes de comprobantes se procesan de forma segura y confidencial
- La plataforma usa conexiones seguras (HTTPS)
- Los datos no se comparten con terceros
- El sistema usa tokens de seguridad (JWT) para proteger el acceso al panel de administración

---

## 📞 PARTE 7 — CONTACTO Y SOPORTE

Para cualquier problema o duda que este chatbot no pueda resolver, el cliente debe contactar al equipo de soporte directamente por **WhatsApp** usando el número visible en la página web.

**Horario de atención:** El equipo responderá lo antes posible. Los pagos pendientes de verificación manual son revisados regularmente durante el día.

---

*Documento generado para uso exclusivo del chatbot de atención al cliente.*
*Versión: 1.0 — Plataforma de Rifas en Línea*
