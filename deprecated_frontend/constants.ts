
import { Raffle } from './types';

/** ID de la rifa de demostración cuando la API no responde. No existe en el backend; no se puede comprar. */
export const FALLBACK_RAFFLE_ID = 'iphone-16-pro-max-fallback';

export const FEATURED_RAFFLE: Raffle = {
  id: FALLBACK_RAFFLE_ID,
  title: 'iPhone 16 Pro Max 256GB',
  subtitle: '¡El smartphone más potente de Apple!',
  description: 'iPhone 16 Pro Max en color Titanio Natural, 256GB de almacenamiento. Incluye cargador, cable USB-C, AirPods y garantía Apple de 1 año. Solo 999 boletos disponibles — ¡tus probabilidades son increíbles!',
  prizeImage: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771009201',
  videoUrl: null,
  galleryImages: [
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771009201',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771018484',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-model-unselect-gallery-2-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726771018484'
  ],
  features: [
    { title: 'Chip A18 Pro', desc: 'El chip más rápido en un smartphone', icon: '⚡' },
    { title: 'Cámara Pro 48MP', desc: 'Zoom Tetraprism 5x + modo Apple Intelligence', icon: '📷' },
    { title: 'Pantalla 6.9"', desc: 'Super Retina XDR, 120Hz ProMotion', icon: '🖥️' },
    { title: 'Titanio Premium', desc: 'Diseño en titanio grado aeroespacial + USB-C', icon: '🔩' }
  ],
  ticketPrice: 1,
  totalTickets: 999,
  drawDate: '2026-12-15',
  status: 'active'
};

export const CONTACT_INFO = {
  whatsapp: '+521234567890',
  email: 'contacto@bismark.com',
  instagram: '@bismark_oficial'
};
