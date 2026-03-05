
import React, { useState, useEffect, useRef } from 'react';
import { Raffle } from '../types';
import { DetailsSkeleton } from './SkeletonLoader.tsx';

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
}

const FacebookSection: React.FC<FacebookSectionProps> = ({ facebookUrl }) => {
  const [iframeReady, setIframeReady] = useState(false);

  if (!facebookUrl) return null;

  // Facebook Page Plugin embed URL.
  // NOTE: adapt_container_width is intentionally FALSE so the plugin always
  // renders at 500px width, which triggers the large-header mode with the
  // real cover photo. With adapt=true the narrow mobile container causes FB
  // to fall back to the small header (no cover photo).
  const pluginSrc =
    `https://www.facebook.com/plugins/page.php` +
    `?href=${encodeURIComponent(facebookUrl)}` +
    `&tabs=` +
    `&width=500` +
    `&height=230` +
    `&small_header=false` +
    `&adapt_container_width=false` +
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
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Página de Facebook</p>
              <p className="text-[10px] text-slate-400 font-medium">Síguenos para estar informado</p>
            </div>
          </div>

          {/* Open in FB button */}
          <a
            href={facebookUrl}
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
        <div className="mx-5 md:mx-8 h-px bg-slate-100" />

        {/* Facebook Page Plugin iframe — fixed 500px width so FB always
            renders the large-header mode (cover photo + profile + followers) */}
        <div className="relative px-3 md:px-5 py-3 md:py-4 overflow-x-auto">

          {/* Skeleton while iframe loads */}
          {!iframeReady && (
            <div className="rounded-2xl bg-slate-100 animate-pulse overflow-hidden" style={{ height: 230 }}>
              <div className="h-28 bg-slate-200" />
              <div className="flex items-end gap-3 -mt-7 px-3">
                <div className="w-14 h-14 bg-slate-300 rounded-full border-4 border-white flex-shrink-0" />
                <div className="space-y-1 pb-1">
                  <div className="h-3 w-36 bg-slate-200 rounded-full" />
                  <div className="h-2.5 w-24 bg-slate-200 rounded-full" />
                </div>
              </div>
            </div>
          )}

          <iframe
            src={pluginSrc}
            width="500"
            height="230"
            className="rounded-xl border-0 block mx-auto"
            style={{
              width: '500px',         /* fixed: forces FB large-header with cover photo */
              height: '230px',
              maxWidth: '100%',
              opacity: iframeReady ? 1 : 0,
              transition: 'opacity 0.4s ease',
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
  siteName = 'RIFAS NAO',
  logoUrl = '',
}) => {
  const [isSectionLoading, setIsSectionLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsSectionLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
      question: '¿Es seguro participar con Rifas Nao?',
      answer: 'Sí, somos una comunidad verificada con cientos de entregas reales documentadas en nuestras redes sociales. Tu pago y tus boletos están siempre protegidos.',
    },
  ];

  if (isSectionLoading) return <DetailsSkeleton />;

  const gallery = Array.isArray(raffle.galleryImages) ? raffle.galleryImages : [];
  const image2 = gallery[0];
  const image3 = gallery[1];
  const hasVideo = !!raffle.videoUrl?.trim();

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
          {hasVideo ? (
            <div className="group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-black">
              <iframe
                ref={videoRef}
                className="w-full h-full object-cover scale-[1.01]"
                src={raffle.videoUrl!}
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
          ) : image2 ? (
            <div className="group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-slate-100">
              <SafeImage src={image2} alt="Detalle 1" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                <span className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em]">Detalle 1</span>
              </div>
            </div>
          ) : null}

          {image3 ? (
            <div className="group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-slate-100">
              <SafeImage src={image3} alt="Detalle 2" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                <span className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em]">Detalle 2</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Facebook + FAQ agrupados sin espacio entre ellos ── */}
      <div className="flex flex-col gap-4 md:gap-6">

        {/* Facebook Page Plugin */}
        <FacebookSection facebookUrl={facebookUrl} />

        {/* FAQ — pegado directamente a Facebook */}
        <div className="max-w-4xl mx-auto w-full px-1 md:px-4 pb-4 md:pb-10">
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
