
import React, { useState, useEffect, useRef } from 'react';
import { Raffle } from '../types';
import { DetailsSkeleton } from './SkeletonLoader.tsx';

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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white"></div>
        <div className="absolute inset-0 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
              <span className="text-2xl md:text-3xl grayscale opacity-40">🖼️</span>
            </div>
          </div>
          <span className="mt-4 text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group active:bg-slate-50/50 transition-colors px-2 rounded-lg"
      >
        <span className="text-sm md:text-base font-bold text-slate-700 group-hover:text-blue-600 transition-colors tracking-tight">{question}</span>
        <span className={`transform transition-transform duration-300 text-blue-500 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed pr-8 pl-2">
          {answer}
        </p>
      </div>
    </div>
  );
};

interface RaffleDetailsProps {
  raffle: Raffle;
  onOpenSupport: () => void;
}

const RaffleDetails: React.FC<RaffleDetailsProps> = ({ raffle, onOpenSupport }) => {
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
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const faqs = [
    {
      question: "¿Cómo se eligen a los ganadores?",
      answer: "Nuestros sorteos se basan legalmente en los últimos dígitos del Premio Mayor de la Lotería Nacional para la Asistencia Pública. Transparencia total garantizada."
    },
    {
      question: "¿Cómo recibo mis boletos?",
      answer: "Una vez confirmado tu pago, recibirás un mensaje automático por WhatsApp y SMS con tu boleto digital foliado y el comprobante de participación."
    },
    {
      question: "¿Qué pasa si resulto ganador?",
      answer: "Nos pondremos en contacto contigo de inmediato al teléfono registrado. La entrega del vehículo se coordina personalmente y se transmite en vivo por Facebook."
    },
    {
      question: "¿Es seguro participar con Rifas Nao?",
      answer: "Sí, somos una comunidad verificada con cientos de entregas reales documentadas en nuestras redes sociales. Tu pago y tus boletos están siempre protegidos."
    }
  ];

  if (isSectionLoading) return <DetailsSkeleton />;

  return (
    <div className="space-y-8 md:space-y-16 py-2 animate-in fade-in duration-700">

      <div className="grid grid-cols-4 md:grid-cols-12 gap-2 md:gap-5 px-1 md:px-0">

        <div className="col-span-4 md:col-span-12 group relative overflow-hidden rounded-[2rem] md:rounded-[3.5rem] shadow-2xl h-64 md:h-[650px] border-2 md:border-[6px] border-white bg-black will-change-transform">
          {raffle.videoUrl ? (
            <>
              <iframe
                ref={videoRef}
                className="w-full h-full object-cover scale-[1.01]"
                src={raffle.videoUrl}
                title="Video del Premio"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              ></iframe>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:bottom-8 z-20">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white text-slate-900 hover:scale-105 transition-transform active:scale-95"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  {isMuted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11.707 5.293L7 10H4a1 1 0 00-1 1v2a1 1 0 001 1h3l4.707 4.707A1 1 0 0013 18V6a1 1 0 00-1.293-.707z" /></svg>
                  )}
                </button>

                <div className="w-[1px] h-6 bg-white/20 mx-1"></div>

                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                </button>
              </div>
            </>
          ) : (
            <SafeImage
              src={raffle.galleryImages[0]}
              alt="Imagen del premio"
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-blue-600/90 backdrop-blur-md px-3 md:px-5 py-1 md:py-2 rounded-xl md:rounded-2xl text-[7px] md:text-[11px] text-white font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-1.5 md:gap-2 z-10 pointer-events-none">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></span>
            Video Oficial
          </div>
        </div>
      </div>

      {/* Sección de Descripción Detallada e Imágenes de Galería */}
      <div className="max-w-5xl mx-auto px-4 space-y-12 md:space-y-20">
        <div className="space-y-6 md:space-y-10 text-center md:text-left">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Descripción del Premio
          </div>
          <h3 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
            Conoce cada <span className="text-blue-600 italic">Detalle</span>
          </h3>
          <p className="text-slate-500 text-sm md:text-xl leading-relaxed max-w-4xl font-medium">
            {raffle.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-slate-100">
            <SafeImage
              src={raffle.galleryImages[1]}
              alt="Detalle 1"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
              <span className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em]">Vista Detallada</span>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 md:border-8 border-white h-64 md:h-[450px] bg-slate-100">
            <SafeImage
              src={raffle.galleryImages[2]}
              alt="Detalle 2"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
              <span className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em]">Acabados Premium</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative group max-w-5xl mx-auto px-1 md:px-4 pt-4 md:pt-6">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-400/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative overflow-hidden bg-white/60 backdrop-blur-[20px] border border-white/70 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] p-6 md:p-12 transition-all duration-500 hover:shadow-[0_25px_50px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-6 md:mb-12 pb-6 md:pb-12 border-b border-slate-200/30">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
              <div className="relative">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-600 rounded-2xl md:rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-blue-100 transform hover:rotate-6 transition-transform">
                  <span className="text-white font-black text-2xl md:text-4xl italic">N</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 border-2 md:border-4 border-white rounded-full"></div>
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h4 className="text-lg md:text-2xl font-black text-slate-800 tracking-tighter">Rifas Nao Oficial</h4>
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-[#1877F2] rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white fill-current" viewBox="0 0 20 20"><path d="M19.43 3.42l-2.85-2.85c-.78-.78-2.05-.78-2.83 0l-10.4 10.4-3.13-3.13c-.78-.78-2.05-.78-2.83 0-.78.78-.78 2.05 0 2.83l4.54 4.54c.39.39.9.59 1.41.59s1.02-.2 1.41-.59l11.82-11.82c.78-.78.78-2.05 0-2.83z" /></svg>
                  </div>
                </div>
                <p className="text-slate-500 font-bold text-[9px] md:text-xs uppercase tracking-[0.2em]">Comunidad Verificada</p>
              </div>
            </div>

            <a
              href="https://facebook.com"
              target="_blank"
              className="w-full md:w-auto bg-[#1877F2] hover:bg-[#166fe5] text-white px-8 py-4 md:px-10 md:py-5 rounded-2xl md:rounded-[1.8rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95"
            >
              Seguir en Facebook
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-14 items-center">
            <div className="bg-white/70 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/90 shadow-sm space-y-4 md:space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-full border border-slate-200"></div>
                <div className="flex-1">
                  <div className="h-2 w-24 md:w-28 bg-slate-100 rounded mb-1"></div>
                  <div className="h-1.5 w-16 md:w-20 bg-slate-50 rounded"></div>
                </div>
              </div>
              <p className="text-[11px] md:text-base text-slate-600 font-medium leading-relaxed italic">
                "¡Increíble ambiente en la entrega de ayer! Gracias por la confianza."
              </p>
              <div className="grid grid-cols-2 gap-2 md:gap-3 h-28 md:h-36">
                <div className="bg-slate-100 rounded-xl md:rounded-2xl overflow-hidden border border-white">
                  <SafeImage src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=300" alt="Entrega" className="w-full h-full object-cover" />
                </div>
                <div className="bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-[9px] md:text-[10px] font-black uppercase tracking-tighter border border-white">
                  En Vivo
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-8 text-center md:text-left">
              <h5 className="text-2xl md:text-5xl font-black text-slate-800 tracking-tighter leading-[0.9]">
                Transparencia <span className="text-blue-600 italic">Total</span>
              </h5>
              <p className="text-slate-500 text-xs md:text-lg leading-relaxed">
                Únete a nuestras transmisiones. Sorteos certificados en tiempo real con la Lotería Nacional.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                <span className="bg-slate-50 text-slate-400 text-[8px] md:text-[10px] font-black px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-100 uppercase tracking-widest">#RifasNao</span>
                <span className="bg-blue-50 text-blue-600 text-[8px] md:text-[10px] font-black px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-blue-100 uppercase tracking-widest">#EnVivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-1 md:px-4 py-6 md:py-20">
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-5 mb-8 md:mb-16">
          <div className="text-3xl md:text-4xl">🤔</div>
          <h2 className="text-2xl md:text-5xl font-black text-slate-800 tracking-tighter">Preguntas Frecuentes</h2>
          <p className="text-slate-500 text-sm md:text-lg font-medium">Resolvemos todas tus dudas con transparencia.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-xl md:shadow-2xl border border-slate-50 p-6 md:p-14">
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>

          <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-slate-50 flex flex-col items-center">
            <button
              onClick={onOpenSupport}
              className="group flex items-center gap-3 text-blue-600 font-black text-[10px] md:text-sm uppercase tracking-[0.3em] hover:text-blue-700 transition-all py-3 px-6 rounded-2xl active:bg-blue-50"
            >
              Hablar con Nao Assist
              <span className="transform group-hover:translate-x-2 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleDetails;
