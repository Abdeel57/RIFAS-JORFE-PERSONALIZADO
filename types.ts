
export interface Raffle {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  prizeImage: string;
  galleryImages: string[];
  videoUrl?: string; // Nuevo campo para el video de YouTube
  features: { title: string; desc: string; icon: string }[];
  ticketPrice: number;
  totalTickets: number;
  drawDate: string;
  status: 'active' | 'completed';
}

export interface Ticket {
  number: number;
  status: 'available' | 'reserved' | 'sold';
}

export type AiToolType = 'edit' | 'analyze';
