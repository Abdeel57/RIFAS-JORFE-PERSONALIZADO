
import React, { useState, useRef } from 'react';
import { Raffle } from '../types';

// ─── SafeImage ────────────────────────────────────────────────────────────────

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 relative overflow-hidden group ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-blue-500 flex items-center justify-center animate-pulse">
            <span className="text-2xl md:text-3xl grayscale opacity-40">🖼️</span>
          </div>
          <span className="mt-4 text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Cargando...</span>
        </div>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setHasError(true)} />;
};

// ─── FAQItem ──────────────────────────────────────────────────────────────────

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full py-5 flex items-center justify-between text-left group active:bg-slate-50/50 transition-colors px-2 rounded-lg"
      >
        <span
          className="text-sm md:text-base font-bold transition-colors tracking-tight"
          style={{ color: isHovered ? 'var(--brand-primary)' : undefined }}
        >
          {question}
        </span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--brand-primary)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed pr-8 pl-2">{answer}</p>
      </div>
    </div>
  );
};

// ─── FacebookSection ──────────────────────────────────────────────────────────
// Uses the official Facebook Page Plugin (iframe) which renders the real
// cover photo, profile picture, page name, follower/like count and description.
// No App ID needed for public pages.

interface FacebookSectionProps {
  facebookUrl: string;
  logoUrl?: string;
  siteName?: string;
}

const FacebookSection: React.FC<FacebookSectionProps> = ({ facebookUrl, logoUrl, siteName }) => {
  const [iframeReady, setIframeReady] = useState(false);

  if (!facebookUrl) return null;

  // Garantizamos que Bismark sea el nombre por defecto si no ha cargado
  const activeSiteName = siteName || 'Bismark';

  // Clean URL to ensure it is a valid Facebook Page URL
  const cleanUrl = facebookUrl.includes('facebook.com')
    ? (facebookUrl.startsWith('http') ? facebookUrl : `https://${facebookUrl}`)
    : `https://www.facebook.com/${facebookUrl}`;

  // Facebook Page Plugin embed URL.
  const pluginSrc =
    `https://www.facebook.com/plugins/page.php` +
    `?href=${encodeURIComponent(cleanUrl)}` +
    `&tabs=` +
    `&width=500` +
    `&height=130` +
    `&small_header=false` +
    `&adapt_container_width=true` +
    `&hide_cover=false` +
    `&show_facepile=false` +
    `&appid=`;

  return (
    <div className="relative max-w-5xl mx-auto px-1 md:px-4 pt-4 md:pt-6">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#1877F2]/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Outer card — matches the rest of the page glassmorphism */}
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-[20px] border border-white/70 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.06)] transition-all duration-500">

        {/* Header strip */}
        <div className="flex items-center justify-between gap-3 px-5 md:px-8 pt-5 md:pt-6 pb-3">
          <div className="flex items-center gap-2.5">
            {/* Facebook 'f' icon */}
            <div className="w-8 h-8 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-md flex-shrink-0">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest leading-none mb-1">Facebook Oficial</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">En Línea</p>
              </div>
            </div>
          </div>

          {/* Open in FB button */}
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] active:scale-95 text-white px-4 py-2 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-100 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5 fill-white flex-shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Seguir
          </a>
        </div>

        {/* Divider */}
        <div className="mx-5 md:mx-8 h-px bg-slate-100/50" />

        {/* Facebook Page Plugin iframe container */}
        <div className="relative px-3 md:px-5 py-2 overflow-hidden min-h-[135px]">

          {/* 
            CAPA 1: RESPALDO PROFESIONAL (Siempre está ahí)
            Se ve inmediatamente y sirve como cargador o como versión final si FB es bloqueado por Safari/iPhone
          */}
          <div className="absolute inset-x-3 md:inset-x-5 top-2 flex items-center gap-4 bg-white/40 rounded-2xl px-5 h-[130px] border border-blue-50/50">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-4 border-white shadow-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={activeSiteName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1877F2] to-blue-700 flex items-center justify-center text-white font-black text-2xl italic">
                  {activeSiteName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h4 className="text-base md:text-xl font-black text-slate-800 truncate tracking-tight uppercase">
                  {activeSiteName}
                </h4>
                <div className="w-4 h-4 bg-[#1877F2] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">Página de Facebook Verificada</p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-slate-700">Comunidad</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-[10px] font-black text-slate-700">Seguro</span>
                </div>
              </div>
            </div>
          </div>

          {/* 
            CAPA 2: IFRAME OFICIAL (Aparece sobre la capa 1 gradualmente)
            Si el navegador lo permite y carga, ocultará suavemente la capa base.
          */}
          <iframe
            src={pluginSrc}
            width="500"
            height="130"
            className="rounded-xl border-0 block mx-auto relative z-10"
            style={{
              width: '100%',
              height: '130px',
              maxWidth: '500px',
              opacity: iframeReady ? 1 : 0,
              transition: 'opacity 0.6s ease-in-out',
            }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            onLoad={() => setIframeReady(true)}
          />
        </div>
      </div>
    </div>
  );
};

// ─── RaffleDetails ────────────────────────────────────────────────────────────

interface RaffleDetailsProps {
  raffle: Raffle;
  onOpenSupport: () => void;
  facebookUrl?: string;
  siteName?: string;
  logoUrl?: string;
}

const RaffleDetails: React.FC<RaffleDetailsProps> = ({
  raffle,
  onOpenSupport,
  facebookUrl = '',
  siteName = 'Bismark',
  logoUrl = '',
}) => {
  // Sin delay artificial — el componente renderiza inmediatamente
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const sendVideoCommand = (command: string, args: any[] = []) => {
    if (videoRef.current?.contentWindow) {
      videoRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args }),
        '*'
      );
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    sendVideoCommand(nextMute ? 'mute' : 'unMute');
    setIsMuted(nextMute);
  };

  const togglePlay = () => {
    const nextPlay = !isPlaying;
    sendVideoCommand(nextPlay ? 'playVideo' : 'pauseVideo');
    setIsPlaying(nextPlay);
  };

  const toggleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
  };

  const faqs = [
    {
      question: '¿Cómo se eligen a los ganadores?',
      answer: 'Nuestros sorteos se basan legalmente en los últimos dígitos del Premio Mayor de la Lotería Nacional para la Asistencia Pública. Transparencia total garantizada.',
    },
    {
      question: '¿Cómo recibo mis boletos?',
      answer: 'Una vez confirmado tu pago, recibirás un mensaje automático por WhatsApp y SMS con tu boleto digital foliado y el comprobante de participación.',
    },
    {
      question: '¿Qué pasa si resulto ganador?',
      answer: 'Nos pondremos en contacto contigo de inmediato al teléfono registrado. La entrega del vehículo se coordina personalmente y se transmite en vivo por Facebook.',
    },
    {
      question: `¿Es seguro participar con ${siteName}?`,
      answer: 'Sí, somos una comunidad verificada con cientos de entregas reales documentadas en nuestras redes sociales. Tu pago y tus boletos están siempre protegidos.',
    },
  ];


  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      videoId = new URLSearchParams(new URL(url).search).get('v') || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1].split('?')[0];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
    }
    return url;
  };

  const gallery = Array.isArray(raffle.galleryImages) ? raffle.galleryImages : [];
  const image2 = gallery[0];
  const image3 = gallery[1];
  const hasVideo = !!raffle.videoUrl?.trim();
  const videoEmbedUrl = getEmbedUrl(raffle.videoUrl || '');

  return (
    <div className="py-2 animate-in fade-in duration-700 space-y-8 md:space-y-16">

      {/* Sección "Conoce cada Detalle" */}
      <div className="max-w-5xl mx-auto px-4 space-y-12 md:space-y-20">
        <div className="space-y-6 md:space-y-10 text-center md:text-left">
          <div
            className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--brand-primary)', backgroundColor: 'rgba(var(--brand-primary-rgb, 59, 130, 246), 0.08)' }}
          >
            Descripción del Premio
          </div>
          <h3 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
            Conoce cada <span className="italic" style={{ color: 'var(--brand-primary)' }}>Detalle</span>
          </h3>
          <p className="text-slate-500 text-sm md:text-xl leading-relaxed max-w-4xl font-medium">
            {raffle.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {hasVideo && (
            <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-black">
              <iframe
                ref={videoRef}
                className="w-full h-full object-cover scale-[1.01]"
                src={videoEmbedUrl}
                title="Video del Premio"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
              <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded-xl text-[10px] text-white font-black uppercase tracking-wider flex items-center gap-1.5 z-10">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Video
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <button type="button" onClick={togglePlay} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-slate-900 hover:scale-105 transition-transform">
                  {isPlaying
                    ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    : <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                </button>
                <button type="button" onClick={toggleMute} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
                  {isMuted
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11.707 5.293L7 10H4a1 1 0 00-1 1v2a1 1 0 001 1h3l4.707 4.707A1 1 0 0013 18V6a1 1 0 00-1.293-.707z" /></svg>}
                </button>
                <button type="button" onClick={toggleFullscreen} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                </button>
              </div>
            </div>
          )}

          {image2 && (
            <div className="group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-slate-100">
              <SafeImage src={image2} alt="Detalle 1" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                <span className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em]">Detalle 1</span>
              </div>
            </div>
          )}

          {image3 && (
            <div className="group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-slate-100">
              <SafeImage src={image3} alt="Detalle 2" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                <span className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em]">Detalle 2</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Facebook + FAQ agrupados sin espacio entre ellos ── */}
      <div className="flex flex-col gap-2 md:gap-3">

        {/* Facebook Page Plugin */}
        <FacebookSection facebookUrl={facebookUrl} logoUrl={logoUrl} siteName={siteName} />

        {/* FAQ — pegado directamente a Facebook */}
        <div className="max-w-4xl mx-auto w-full px-1 md:px-4 pb-0">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-5 mb-8 md:mb-16">
            <div className="text-3xl md:text-4xl">🤔</div>
            <h2 className="text-2xl md:text-5xl font-black text-slate-800 tracking-tighter">Preguntas Frecuentes</h2>
            <p className="text-slate-500 text-sm md:text-lg font-medium">Resolvemos todas tus dudas con transparencia.</p>
          </div>
          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-xl md:shadow-2xl border border-slate-50 p-6 md:p-14">
            <div className="divide-y divide-slate-100">
              {faqs.map((faq, i) => <FAQItem key={i} question={faq.question} answer={faq.answer} />)}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RaffleDetails;
