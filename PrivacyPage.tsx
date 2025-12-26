
import React from 'react';

interface PrivacyPageProps {
  onOpenAdmin: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onOpenAdmin }) => {
  const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";
  const EXTERNAL_URL = "https://www.termsfeed.com/live/privacy-policy-dark-hadiqa";

  return (
    <div className="flex flex-col gap-8 pb-40 text-right" dir="rtl">
      <div className="p-8 rounded-[2.5rem] bg-neutral-900 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full"></div>
        <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col">
              <span className="text-[9px] text-red-600 font-black uppercase tracking-widest">Security Partition</span>
              <h2 className="text-2xl font-black text-white italic">سياسة الخصوصية</h2>
           </div>
           <img src={LOGO_URL} className="w-14 h-14 rounded-full grayscale opacity-50" />
        </div>
        
        <div className="space-y-6 text-gray-400 text-sm font-bold leading-relaxed">
           <p className="border-r-2 border-red-600/40 pr-4">
              نحن في "الحديقة المرعبة" نحترم خصوصيتك تماماً. لا يتم رفع أي من بيانات تصفحك إلى خوادم خارجية، بل يتم تخزين كل شيء (إعجابات، محفوظات، وسجل مشاهدة) محلياً على جهازك فقط.
           </p>
           <p>
              يتم جلب الفيديوهات من مخزن سحابي آمن، ولا يمكن لأي طرف ثالث الوصول إلى هويتك داخل التطبيق.
           </p>
        </div>

        <div className="mt-10">
           <a 
             href={EXTERNAL_URL} 
             target="_blank" 
             rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 w-full py-4 bg-red-600/10 border border-red-600/30 text-red-500 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.1)]"
           >
              <span>قراءة السياسة الشاملة</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
           </a>
        </div>
      </div>

      {/* الزر الخفي للمطور في الأسفل */}
      <div className="mt-20 flex flex-col items-center">
         <div 
           onClick={onOpenAdmin}
           className="w-full h-24 opacity-0 cursor-default"
           title="Developer Access"
         >
           {/* زر مخفي تماماً يظهر فقط عند النقر أو الهوفر */}
         </div>
         <div className="w-12 h-1 bg-white/5 rounded-full"></div>
         <p className="text-[8px] text-gray-800 font-black uppercase tracking-[0.5em] mt-4">System ID: 0x506070-GATE</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
