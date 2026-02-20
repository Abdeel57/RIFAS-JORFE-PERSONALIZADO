
import { Raffle } from './types';

export const FEATURED_RAFFLE: Raffle = {
  id: '1',
  title: 'Camioneta Raptor 2024',
  subtitle: 'La bestia del asfalto puede ser tuya hoy mismo',
  description: 'Participa para ganar la camioneta de tus sueños. Equipada con motor V6 Twin-Turbo de 450 HP, suspensión Fox Live Valve y el paquete más lujoso disponible. No es solo un vehículo, es un estilo de vida.',
  prizeImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1200',
  // Se habilita JS API y se quita el mute forzado para permitir audio
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&enablejsapi=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1', 
  galleryImages: [
    'https://images.unsplash.com/photo-1542362567-b05486f69246?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'
  ],
  features: [
    { title: 'Motor V6 3.5L', desc: '450 Caballos de fuerza listos para rugir en cualquier terreno.', icon: '⚡' },
    { title: 'Interior Cuero', desc: 'Asientos deportivos con calefacción y acabados premium.', icon: '🛋️' },
    { title: 'Tecnología', desc: 'Pantalla táctil de 12", Apple CarPlay y sonido Bang & Olufsen.', icon: '📱' },
    { title: 'Off-Road Ready', desc: 'Llantas de 37" y blindaje de bajos original de fábrica.', icon: '⛰️' }
  ],
  ticketPrice: 500,
  totalTickets: 500,
  drawDate: '2024-12-24',
  status: 'active'
};

export const CONTACT_INFO = {
  whatsapp: '+521234567890',
  email: 'contacto@rifasnao.com',
  instagram: '@rifasnao_oficial'
};
