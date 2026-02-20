
import React from 'react';

interface TermsAndConditionsProps {
  onBack: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden mb-20">
      {/* Hero Términos */}
      <div className="bg-slate-900 px-8 py-16 text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50"></div>
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-white/60 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver
        </button>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter relative z-10">Términos y Condiciones</h1>
        <p className="text-blue-200/60 font-bold text-xs uppercase tracking-[0.3em] relative z-10">Última actualización: Noviembre 2024</p>
      </div>

      <div className="p-8 md:p-16 space-y-12">
        {/* Sección 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">01</span>
            Sobre el Sorteo
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Los sorteos realizados por <strong>Rifas Nao</strong> se basan estrictamente en los resultados de la Lotería Nacional para la Asistencia Pública de México. El número ganador se determinará tomando como referencia los últimos dígitos del premio mayor del sorteo especificado en cada dinámica.
          </p>
        </section>

        {/* Sección 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">02</span>
            Participación y Registro
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Para participar, el usuario debe seleccionar uno o más boletos disponibles y completar el proceso de pago. Es responsabilidad del usuario proporcionar información de contacto verídica (nombre, teléfono y correo electrónico). Rifas Nao no se hace responsable por errores en la captura de datos que impidan la localización del ganador.
          </p>
        </section>

        {/* Sección 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">03</span>
            Validación de Pagos
          </h2>
          <ul className="space-y-3">
            {[
              "Los boletos solo se considerarán activos una vez confirmado el pago.",
              "En pagos vía OXXO, el comprobante debe enviarse vía WhatsApp en un lapso no mayor a 24 horas.",
              "Rifas Nao se reserva el derecho de liberar boletos no liquidados en el tiempo estipulado.",
              "No existen devoluciones una vez emitido el boleto digital."
            ].map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-500 text-sm">
                <span className="text-blue-500 font-bold">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Sección 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">04</span>
            Entrega de Premios
          </h2>
          <p className="text-slate-500 leading-relaxed">
            La entrega de los vehículos o premios se realiza de manera presencial. Rifas Nao cubre los gastos de traslado del premio dentro del territorio mexicano (aplican restricciones por zonas de difícil acceso). El ganador deberá presentar identificación oficial vigente para reclamar su premio.
          </p>
        </section>

        {/* Footer del documento */}
        <div className="pt-12 border-t border-slate-50 text-center space-y-6">
          <p className="text-slate-400 text-xs italic">
            Al realizar la compra de un boleto, el usuario manifiesta haber leído y aceptado en su totalidad estos términos y condiciones.
          </p>
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-10 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            Acepto y deseo participar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
