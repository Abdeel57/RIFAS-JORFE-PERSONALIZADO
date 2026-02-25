# 🤖 ¿Para qué se usa la API Key de Gemini?

## ✅ SÍ, es principalmente para el Chatbot de Soporte

La API key de Google Gemini se usa para **3 funciones principales** en tu aplicación:

### 1. 💬 **Chatbot de Soporte "Nao Assist"** (Principal)

**Dónde se usa:**
- Componente: `SupportChat.tsx`
- Servicio: `backend/src/services/gemini.service.ts`
- Endpoint: `POST /api/support/chat`

**Qué hace:**
- Responde preguntas de los usuarios sobre las rifas
- Explica el proceso de pago (transferencia BBVA, OXXO)
- Ayuda con la verificación de boletos
- Proporciona información sobre legalidad y sorteos
- Actúa como asistente virtual 24/7

**Ejemplo de uso:**
Cuando un usuario hace clic en "Chat de Soporte" en el frontend, se abre un chat donde puede preguntar:
- "¿Cómo pago mi boleto?"
- "¿Cuándo es el sorteo?"
- "¿Cómo verifico mis boletos?"

Y "Nao Assist" responde automáticamente usando Gemini AI.

---

### 2. 🖼️ **Edición de Imágenes con IA** (Opcional)

**Dónde se usa:**
- Componente: `AiTools.tsx`
- Función: `editImage()`

**Qué hace:**
- Permite a los usuarios subir imágenes (comprobantes de pago, fotos del premio)
- Mejora la calidad de las imágenes
- Aplica filtros o efectos según las instrucciones del usuario

**Ejemplo:**
Usuario sube una foto de un comprobante de pago y pide: "Mejora la calidad" → Gemini procesa y devuelve la imagen mejorada.

---

### 3. 🔍 **Análisis de Imágenes** (Opcional)

**Dónde se usa:**
- Componente: `AiTools.tsx`
- Función: `analyzeImage()`

**Qué hace:**
- Analiza imágenes subidas por los usuarios
- Describe lo que ve en la imagen
- Identifica colores, objetos, ambiente, etc.

**Ejemplo:**
Usuario sube una foto del premio (camioneta) → Gemini analiza y describe: "Veo una camioneta Ford Raptor 2024, color azul, con detalles específicos..."

---

## 🎯 ¿Es Obligatoria?

### Para el Chatbot: ✅ SÍ, es esencial

Si no configuras `GEMINI_API_KEY`:
- ❌ El chatbot de soporte **NO funcionará**
- ❌ Los usuarios no podrán usar el chat de ayuda
- ⚠️ Verás errores cuando intenten abrir el chat

### Para Edición/Análisis de Imágenes: ⚠️ Opcional

Si no configuras la key:
- ✅ El resto de la aplicación funciona normalmente
- ❌ Solo las funciones de IA de imágenes no funcionarán
- ⚠️ Los usuarios verán errores si intentan usar esas funciones

---

## 💡 Recomendación

**SÍ, configura la API key** porque:
1. El chatbot de soporte es una funcionalidad importante
2. Reduce la carga de atención al cliente
3. Proporciona respuestas instantáneas 24/7
4. Google Gemini tiene un plan gratuito generoso

---

## 🔑 Cómo Obtener la API Key

1. Ve a: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la clave generada
5. Pégala en Railway como `GEMINI_API_KEY`

**Nota:** La API key es gratuita hasta cierto límite de uso mensual. Para una aplicación de rifas pequeña/mediana, el plan gratuito suele ser suficiente.

---

## 📊 Resumen

| Función | ¿Obligatoria? | Impacto si falta |
|---------|---------------|------------------|
| Chatbot de Soporte | ✅ **SÍ** | ❌ Chat no funciona |
| Edición de Imágenes | ⚠️ Opcional | ⚠️ Solo esa función falla |
| Análisis de Imágenes | ⚠️ Opcional | ⚠️ Solo esa función falla |

**Conclusión:** Configura la API key para que el chatbot funcione correctamente. Es la funcionalidad más importante que usa Gemini.





