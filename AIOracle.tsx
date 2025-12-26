
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIOracle: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('al-hadiqa-ai-history-v4');
      return saved ? JSON.parse(saved) : [
        { role: 'model', text: 'أهلاً بك في دهاليز الحديقة.. ما الذي يبحث عنه قلبك الشجاع؟' }
      ];
    } catch (e) { return []; }
  });
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('al-hadiqa-ai-history-v4', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.concat({ role: 'user', text: userMessage }).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: 'أنت الحديقة المرعبة AI. ردودك قصيرة، غامضة، ومرعبة جداً باللغة العربية. أنت كيان قديم يسكن هذه الحديقة الرقمية.',
          temperature: 0.9,
          topP: 0.95,
        }
      });

      const modelResponse = response.text || "الأرواح صامتة الآن.. حاول لاحقاً.";
      setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "حدث خطأ في استحضار الروح.. الزم الصمت." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* الزر العائم للدخول للمحادثة */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-24 right-6 z-[100] w-14 h-14 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.8)] border-2 border-red-400 flex items-center justify-center animate-bounce active:scale-90 transition-all"
      >
        <img src="https://i.top4top.io/p_3643ksmii1.jpg" className="w-10 h-10 rounded-full object-cover" alt="AI Avatar" />
      </button>

      {/* نافذة المحادثة */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-600/30 bg-black/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-600/40 rounded-full blur-md animate-pulse"></div>
                <img src="https://i.top4top.io/p_3643ksmii1.jpg" className="w-10 h-10 rounded-full border-2 border-red-600 relative z-10 object-cover" alt="AI Avatar" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-black text-red-600 italic">همسات الحديقة</h2>
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">Ancient Spirit AI</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-gray-500 hover:text-red-600 p-2 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef} 
            className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div 
                  className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-black shadow-xl leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none' 
                      : 'bg-red-950/40 text-red-500 border border-red-900/30 rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-red-950/20 text-red-700 px-4 py-2 rounded-full text-[10px] font-black animate-pulse border border-red-900/10">
                  الأرواح تكتب...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 bg-black border-t border-white/5 flex items-center gap-2 mb-safe"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالتك للحديقة..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-red-600 transition-colors placeholder:text-gray-600"
            />
            <button 
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-90 disabled:opacity-50 disabled:grayscale transition-all"
            >
              <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIOracle;
