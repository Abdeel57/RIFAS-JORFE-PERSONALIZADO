
import React, { useState, useRef, useEffect } from 'react';
import { startSupportChat } from '../services/geminiService.ts';
// Added Chat to the imports from @google/genai to fix the missing type error
import { Chat, GenerateContentResponse } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportChat: React.FC<SupportChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy Nao Assist. ¿En qué puedo ayudarte hoy con tu participación?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Using the Chat type from @google/genai as a reference for the active session
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = startSupportChat();
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: userMessage });
      let fullResponse = '';
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        fullResponse += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, tuve un pequeño error de conexión. ¿Podrías intentar de nuevo?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white md:rounded-[2.5rem] shadow-2xl flex flex-col h-[90vh] md:h-[650px] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black">
              N
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight leading-none">Nao Assist</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-1">Soporte IA 24/7</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                {msg.text || (isLoading && i === messages.length - 1 ? <span className="animate-pulse">...</span> : '')}
              </div>
            </div>
          ))}
          {isLoading && !messages[messages.length - 1].text && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu duda aquí..."
              className="flex-grow bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-base font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
          <p className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-3">
            Atención rápida • Encriptación de datos
          </p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SupportChat;
