
import React, { useState, useRef } from 'react';
import { editImage, analyzeImage } from '../services/geminiService';

const AiTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'edit' | 'analyze'>('edit');
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResultImage(null);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    if (!image) return;
    setLoading(true);
    try {
      if (activeTab === 'edit') {
        const edited = await editImage(image, prompt || "Mejora la calidad de esta foto de sorteo");
        setResultImage(edited);
      } else {
        const text = await analyzeImage(image);
        setAnalysis(text);
      }
    } catch (err) {
      console.error(err);
      alert("Error en el servidor de IA. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => { setActiveTab('edit'); setAnalysis(null); }}
          className={`flex-1 py-4 text-[10px] md:text-sm font-black uppercase tracking-widest transition-all
            ${activeTab === 'edit' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-400'}`}
        >
          Editar con IA
        </button>
        <button
          onClick={() => { setActiveTab('analyze'); setResultImage(null); }}
          className={`flex-1 py-4 text-[10px] md:text-sm font-black uppercase tracking-widest transition-all
            ${activeTab === 'analyze' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-400'}`}
        >
          Analizar Foto
        </button>
      </div>

      <div className="p-4 md:p-8">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 md:p-12 text-center cursor-pointer hover:border-blue-400 transition-colors group bg-slate-50/50"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:bg-blue-50 transition-colors">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-700 font-bold text-sm md:text-base">Subir imagen</p>
            <p className="text-slate-400 text-xs mt-1">Sube una captura de tu pago o del premio</p>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original</p>
                <img src={image} alt="Original" className="w-full h-48 md:h-64 object-cover rounded-xl shadow-sm border border-slate-100" />
                <button 
                  onClick={() => { setImage(null); setResultImage(null); setAnalysis(null); }}
                  className="text-xs text-red-500 font-bold uppercase py-2"
                >
                  Eliminar y cambiar
                </button>
              </div>

              {(resultImage || analysis) && (
                <div className="space-y-1 animate-in zoom-in-95 duration-300">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">IA Generada</p>
                  {activeTab === 'edit' && resultImage ? (
                    <img src={resultImage} alt="Resultado" className="w-full h-48 md:h-64 object-cover rounded-xl shadow-lg border border-blue-100" />
                  ) : (
                    <div className="w-full h-48 md:h-64 bg-blue-50 p-4 rounded-xl border border-blue-100 overflow-y-auto text-xs md:text-sm text-blue-900 leading-relaxed italic">
                      {analysis}
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeTab === 'edit' && !resultImage && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">¿Qué quieres cambiar?</label>
                <input
                  type="text"
                  placeholder='Ej: "Mejora los colores", "Filtro brillante"'
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
                />
              </div>
            )}

            <button
              onClick={handleAction}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-3 transition-all
                ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95'}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
                  Procesando...
                </>
              ) : (
                activeTab === 'edit' ? 'Transformar Foto' : 'Analizar ahora'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiTools;
