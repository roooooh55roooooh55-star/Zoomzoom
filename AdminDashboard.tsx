
import React, { useState, useEffect, useMemo } from 'react';
import { Video } from './types';
import { fetchCloudinaryVideos } from './cloudinaryClient';
import { suggestTags } from './geminiService';

const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

interface AdminDashboardProps {
  onClose: () => void;
  categories: string[];
  onNewVideo?: (v: Video) => void;
  onUpdateVideo?: (v: Video) => void;
  onDeleteVideo?: (id: string) => void;
  initialVideos: Video[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, categories, onNewVideo, onUpdateVideo, onDeleteVideo, initialVideos 
}) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState(categories[0] || '');

  const handleAuth = () => {
    if (passcode === '506070') {
      setIsAuthenticated(true);
    } else {
      alert("رمز الحماية خاطئ. الأرواح تراقبك.");
      setPasscode('');
    }
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(v => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videos, searchQuery]);

  const openUploadWidget = () => {
    const cloudinary = (window as any).cloudinary;
    if (!cloudinary) return;
    setIsUploading(true);
    cloudinary.openUploadWidget({
      cloudName: 'dlrvn33p0',
      uploadPreset: 'Good.zooo',
      folder: 'app_videos',
      tags: ['hadiqa_v4', uploadCategory],
      context: { custom: { caption: uploadTitle || "بدون عنوان" } },
      resourceType: 'video'
    }, (err: any, res: any) => {
      if (!err && res?.event === "success") {
        const newV: Video = {
          id: res.info.public_id,
          public_id: res.info.public_id,
          video_url: res.info.secure_url,
          title: uploadTitle || "فيديو جديد",
          category: uploadCategory,
          type: res.info.height > res.info.width ? 'short' : 'long',
          likes: 0, views: 0, tags: []
        };
        setVideos(p => [newV, ...p]);
        if (onNewVideo) onNewVideo(newV);
        setUploadTitle('');
        setIsUploading(false);
      } else if (res?.event === "close") setIsUploading(false);
    });
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من مسح هذا الكابوس نهائياً؟ لن يظهر مرة أخرى أبداً.")) {
      setVideos(prev => prev.filter(v => v.id !== id && v.public_id !== id));
      onDeleteVideo?.(id);
    }
  };

  const saveEdit = (v: Video) => {
    setVideos(p => p.map(item => item.id === v.id ? v : item));
    if (onUpdateVideo) onUpdateVideo(v);
    setEditingVideo(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={LOGO_URL} className="w-24 h-24 rounded-full border-4 border-red-600 mb-8 shadow-[0_0_40px_red]" />
        <h2 className="text-2xl font-black text-red-600 mb-8 italic tracking-tighter">منطقة محظورة - أدخل الرمز</h2>
        <div className="flex gap-3 mb-12">
          {[1,2,3,4,5,6].map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 border-red-600 ${passcode.length > i ? 'bg-red-600 shadow-[0_0_15px_red]' : 'bg-transparent'}`}></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-5 max-w-[300px]">
          {[1,2,3,4,5,6,7,8,9,0].map(num => (
            <button key={num} onClick={() => passcode.length < 6 && setPasscode(p => p + num)} className="w-20 h-20 bg-neutral-900/50 rounded-3xl text-3xl font-black border-2 border-white/5 active:bg-red-600 active:border-white transition-all">
              {num}
            </button>
          ))}
          <button onClick={() => setPasscode('')} className="w-20 h-20 bg-red-950/30 rounded-3xl text-sm font-black border-2 border-red-600/20 text-red-500">مسح</button>
          <button onClick={handleAuth} className="col-span-2 w-full bg-red-600 rounded-3xl text-xl font-black shadow-[0_0_30px_red] active:scale-95">دخول</button>
        </div>
        <button onClick={onClose} className="mt-16 text-gray-600 font-bold underline hover:text-white transition-colors">العودة للحديقة</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[900] bg-[#020202] overflow-hidden flex flex-col" dir="rtl">
      {/* Header */}
      <div className="h-24 border-b-2 border-red-600/20 flex items-center justify-between px-8 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} className="w-12 h-12 rounded-full border-2 border-red-600" />
          <h1 className="text-xl font-black text-red-600 italic tracking-widest">HADIQA STUDIO</h1>
        </div>
        <div className="flex-1 max-w-lg mx-10">
          <div className="relative">
            <input 
              type="text" placeholder="بحث في المستودع الرقمي..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/50 border-2 border-white/5 rounded-2xl py-3 px-12 text-sm outline-none focus:border-red-600 transition-all"
            />
            <svg className="w-5 h-5 absolute right-4 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
        <button onClick={onClose} className="p-3 text-gray-500 hover:text-red-600 transition-colors"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 pb-40">
        {/* Upload Section */}
        <div className="bg-neutral-900/30 border-2 border-white/5 p-8 rounded-[3rem] mb-12 shadow-2xl">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black flex items-center gap-3"><span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span> رفع استدعاء جديد</h2>
              <span className="text-xs text-gray-500 font-black tracking-widest uppercase">Cloudinary V4 Core</span>
           </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <input 
              type="text" placeholder="عنوان الكابوس" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
              className="bg-black border-2 border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-red-600 shadow-inner"
            />
            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="bg-black border-2 border-white/10 rounded-2xl p-5 text-sm text-red-500 font-black outline-none appearance-none">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={openUploadWidget} disabled={isUploading} className="bg-red-600 rounded-2xl font-black text-sm py-5 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_red] transition-all">
              {isUploading ? "جاري الاستحضار..." : "بدء الرفع السحابي"}
            </button>
          </div>
        </div>

        {/* Video List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.4em]">المستودع المحرم ({filteredVideos.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVideos.map(v => (
              <div key={v.id} className="bg-neutral-900/40 border-2 border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between group hover:border-red-600/30 transition-all shadow-xl hover:shadow-red-600/5">
                <div className="flex items-center gap-6 flex-1 overflow-hidden">
                  <div className="w-32 h-20 bg-black rounded-3xl overflow-hidden border-2 border-white/5 shrink-0 relative">
                    <video src={v.video_url} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                       <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-black text-white line-clamp-1">{v.title}</h3>
                    <div className="flex gap-3">
                      <span className="text-[10px] bg-red-600/10 text-red-500 px-3 py-1 rounded-full uppercase font-black border border-red-600/20">{v.category}</span>
                      <span className="text-[10px] text-gray-500 font-black italic tracking-widest">{v.type.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingVideo(v)} className="p-4 text-blue-500 hover:bg-blue-600/10 rounded-2xl transition-all active:scale-90">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(v.id)} 
                    className="p-4 text-red-600 hover:bg-red-600/10 rounded-2xl transition-all active:scale-90"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editingVideo && (
        <VideoEditor 
          video={editingVideo} 
          categories={categories}
          onClose={() => setEditingVideo(null)} 
          onSave={saveEdit} 
        />
      )}
    </div>
  );
};

const VideoEditor: React.FC<{ video: Video, categories: string[], onClose: () => void, onSave: (v: Video) => void }> = ({ video, categories, onClose, onSave }) => {
  const [v, setV] = useState<Video>({ ...video });
  const [tagInput, setTagInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiTags = async () => {
    setIsAiLoading(true);
    const suggested = await suggestTags(v.title, v.category);
    setV(prev => ({ ...prev, tags: Array.from(new Set([...(prev.tags || []), ...suggested])) }));
    setIsAiLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl p-10 flex flex-col animate-in fade-in duration-500" dir="rtl">
      <div className="flex items-center justify-between mb-12 border-b-2 border-white/10 pb-6">
        <h2 className="text-3xl font-black italic text-red-600 tracking-tighter shadow-red-600">تعديل سجل الكابوس</h2>
        <button onClick={onClose} className="p-4 text-gray-500 hover:text-white transition-colors active:rotate-90 duration-300"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-12 max-w-4xl mx-auto w-full pb-32 scrollbar-hide">
        {/* Live Preview - منطقة المعاينة الحية للفيديو */}
        <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_0_50px_rgba(0,0,0,1)] relative group">
          <video src={v.video_url} controls className="w-full h-full object-contain" />
          <div className="absolute top-6 right-6 bg-red-600/80 backdrop-blur-md px-5 py-2 rounded-full text-[12px] text-white font-black border border-white/20 shadow-2xl">LIVE PREVIEW</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] px-4">عنوان الكابوس</label>
            <input 
              type="text" value={v.title} onChange={e => setV({...v, title: e.target.value})}
              className="w-full bg-neutral-900 border-2 border-white/5 rounded-[2rem] p-6 text-white text-lg font-black outline-none focus:border-red-600 shadow-inner transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] px-4">التصنيف المحرم</label>
            <select value={v.category} onChange={e => setV({...v, category: e.target.value})} className="w-full bg-neutral-900 border-2 border-white/5 rounded-[2rem] p-6 text-red-600 text-lg font-black outline-none focus:border-red-600 transition-all appearance-none">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <label className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">الأوسمة الرقمية (Tags)</label>
              <button onClick={handleAiTags} disabled={isAiLoading} className="text-[12px] bg-red-600 text-white px-6 py-2 rounded-full font-black active:scale-95 flex items-center gap-3 shadow-[0_0_20px_red] transition-all">
                {isAiLoading ? 'جاري الاستحضار...' : '✨ استدعاء بذكاء Gemini'}
              </button>
            </div>
            <div className="flex flex-wrap gap-3 p-8 bg-neutral-900/40 rounded-[2.5rem] border-2 border-white/5 min-h-[120px] shadow-inner">
              {v.tags?.map((tag, i) => (
                <span key={i} className="bg-red-600/10 text-red-500 border-2 border-red-600/30 text-xs font-black px-5 py-2.5 rounded-2xl flex items-center gap-3 group/tag hover:bg-red-600 hover:text-white transition-all">
                  #{tag}
                  <button onClick={() => setV({...v, tags: v.tags?.filter((_,idx)=>idx!==i)})} className="text-red-900 group-hover/tag:text-white font-black text-lg">×</button>
                </span>
              ))}
              <input 
                type="text" placeholder="أضف وسماً جديداً واضغط Enter..." value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter' && tagInput) { setV({...v, tags: [...(v.tags||[]), tagInput.replace('#','') ]}); setTagInput(''); } }}
                className="bg-transparent border-none outline-none text-base text-gray-300 min-w-[200px] p-2"
              />
            </div>
          </div>
        </div>

        <button onClick={() => onSave(v)} className="w-full bg-red-600 py-8 rounded-[2.5rem] font-black text-white shadow-[0_0_40px_red] active:scale-95 transition-all text-2xl mt-12 hover:tracking-widest duration-500 uppercase">
          حفظ السجلات النهائية
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
