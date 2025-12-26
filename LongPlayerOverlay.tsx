
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Video } from './types.ts';
import { incrementViewsInDB } from './supabaseClient.ts';
import { getDeterministicStats, formatBigNumber, LOGO_URL } from './MainContent.tsx';

interface LongPlayerOverlayProps {
  video: Video;
  allLongVideos: Video[];
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  onSwitchVideo: (v: Video) => void;
  isLiked: boolean;
  isDisliked: boolean;
  isSaved: boolean;
  onProgress: (p: number) => void;
  onCategorySelect?: (category: string) => void;
}

const LongPlayerOverlay: React.FC<LongPlayerOverlayProps> = ({ 
  video, allLongVideos, onClose, onLike, onDislike, onSave, onSwitchVideo, isLiked, isDisliked, isSaved, onProgress, onCategorySelect
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0); 
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showStatusIcon, setShowStatusIcon] = useState<'play' | 'pause' | null>(null);
  const [showControls, setShowControls] = useState(true);
  
  const stats = useMemo(() => getDeterministicStats(video.video_url), [video.video_url]);
  const suggestions = useMemo(() => allLongVideos.filter(v => v.id !== video.id && v.type === 'long'), [allLongVideos, video]);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    if (isFullScreen) {
      hideTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (isFullScreen) {
      resetHideTimer();
      setZoomLevel(1);
    } else {
      setShowControls(true);
      setZoomLevel(0);
    }
  }, [isFullScreen]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isFullScreen && !showControls) { resetHideTimer(); return; }
    resetHideTimer();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    
    incrementViewsInDB(video.id);
    v.load();
    v.play().then(() => setIsPlaying(true)).catch(() => {
      v.muted = true;
      v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    });
  }, [video.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnd = () => { 
      if (isAutoPlay && suggestions.length > 0) onSwitchVideo(suggestions[0]);
    };
    const onPlayEvent = () => setIsPlaying(true);
    const onPauseEvent = () => setIsPlaying(false);
    const onTimeUpdate = () => { if (v.duration) onProgress(v.currentTime / v.duration); };

    v.addEventListener('ended', handleEnd);
    v.addEventListener('play', onPlayEvent);
    v.addEventListener('pause', onPauseEvent);
    v.addEventListener('timeupdate', onTimeUpdate);
    
    return () => {
      v.removeEventListener('ended', handleEnd);
      v.removeEventListener('play', onPlayEvent);
      v.removeEventListener('pause', onPauseEvent);
      v.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [video.id, isAutoPlay, suggestions, onSwitchVideo, onProgress]);

  const getScale = () => {
    if (!isFullScreen) return 1;
    const scales = [1.1, 1.25, 1.4, 1.6, 1.8, 2.0];
    return scales[zoomLevel] || 1.1;
  };

  return (
    <div className="fixed inset-0 bg-black z-[500] flex flex-col overflow-hidden" dir="rtl">
      <style>{`
        @keyframes marquee-rtl { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-marquee-custom { display: flex; animation: marquee-rtl 25s linear infinite; }
        .neon-btn-red { box-shadow: 0 0 20px #ff0000, 0 0 40px #ff000066, inset 0 0 10px #ff0000; }
        .neon-btn-purple { box-shadow: 0 0 20px #a855f7, 0 0 40px #a855f766, inset 0 0 10px #a855f7; }
        .neon-btn-green { box-shadow: 0 0 20px #22c55e, 0 0 40px #22c55e66, inset 0 0 10px #22c55e; }
        .neon-btn-blue { box-shadow: 0 0 20px #3b82f6, 0 0 40px #3b82f666, inset 0 0 10px #3b82f6; }
        .fullscreen-rotate-container { position: fixed !important; inset: 0 !important; z-index: 1000 !important; background: black !important; display: flex !important; align-items: center !important; justify-content: center !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; }
        .fullscreen-rotate-container video { width: 100vh !important; height: 100vw !important; transform: rotate(90deg) scale(${getScale()}) !important; object-fit: contain !important; transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) !important; }
      `}</style>

      <div 
        className={`relative bg-black cursor-pointer overflow-hidden flex items-center justify-center ${isFullScreen ? 'fullscreen-rotate-container' : 'h-[35dvh]'}`}
        onClick={() => togglePlay()}
      >
        <video ref={videoRef} src={video.video_url} className="max-w-full max-h-full object-contain" playsInline preload="auto" />
        
        {isFullScreen && (
          <div className={`absolute top-8 left-8 right-8 z-[1100] flex items-center justify-between transition-opacity duration-700 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }} className="p-5 bg-black/80 rounded-[1.5rem] border-2 border-purple-600 text-purple-400 neon-btn-purple active:scale-75 transition-all shadow-2xl"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5"/></svg></button>
              <button onClick={(e) => { e.stopPropagation(); setZoomLevel((p) => (p + 1) % 6); resetHideTimer(); }} className="p-5 bg-black/80 rounded-[1.5rem] border-2 border-purple-600 text-purple-400 neon-btn-purple active:scale-75 transition-all shadow-2xl relative"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">{zoomLevel + 1}</span></button>
              <button onClick={(e) => { e.stopPropagation(); resetHideTimer(); setIsAutoPlay(!isAutoPlay); }} className={`p-5 rounded-[1.5rem] border-2 active:scale-75 transition-all shadow-2xl ${isAutoPlay ? 'bg-green-600/20 border-green-600 text-green-500 neon-btn-green' : 'bg-blue-600/20 border-blue-600 text-blue-500 neon-btn-blue'}`}><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-5 bg-black/80 rounded-[1.5rem] border-2 border-red-600 text-red-600 neon-btn-red active:scale-75 transition-all shadow-2xl"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        {!isFullScreen && (
          <div className="absolute top-6 left-6 z-[1100]">
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-3 bg-black/80 rounded-2xl border-2 border-red-600 text-red-600 neon-btn-red active:scale-75 transition-all shadow-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}
      </div>

      {!isFullScreen && (
        <div className="flex-1 overflow-y-auto bg-[#020202] p-6 space-y-6 scrollbar-hide">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-inner">
             <div className="relative shrink-0"><div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-red-600 opacity-30"></div><img src={LOGO_URL} className="w-14 h-14 rounded-full border-2 border-red-600 relative z-10 shadow-2xl" alt="Logo" /></div>
             <div className="flex flex-col text-right flex-1 overflow-hidden">
                <h1 className="text-xl font-black text-white leading-tight line-clamp-2 italic">{video.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCategorySelect?.(video.category); }}
                    className="bg-red-600/10 border border-red-600 px-3 py-0.5 rounded-full active:scale-95 transition-transform"
                  >
                    <span className="text-[9px] font-black text-red-500 italic uppercase tracking-tighter">{video.category}</span>
                  </button>
                  <span className="text-[9px] font-bold text-gray-400 tracking-tight">{formatBigNumber(stats.views)} مشاهدة فورية</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-6 items-center bg-neutral-900/40 p-3 rounded-[2rem] border border-white/5 gap-1.5 shadow-inner">
             <button onClick={(e) => { e.stopPropagation(); onLike(); }} className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${isLiked ? 'bg-red-600 border-red-400 text-white neon-btn-red' : 'border-white/10 bg-white/5 text-gray-400'}`}><svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg><span className="text-[7px] mt-1 font-black uppercase">أعجبني</span></button>
             <button onClick={(e) => { e.stopPropagation(); onSave(); }} className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${isSaved ? 'bg-yellow-500 border-yellow-300 text-white shadow-[0_0_20px_yellow]' : 'border-white/10 bg-white/5 text-gray-400'}`}><svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg><span className="text-[7px] mt-1 font-black uppercase">حفظ</span></button>
             <button onClick={() => togglePlay()} className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${isPlaying ? 'border-white bg-white/20 text-white scale-110 z-10 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-red-600 bg-red-600/10 text-red-500 neon-btn-red'}`}>{isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}<span className="text-[7px] mt-1 font-black uppercase">{isPlaying ? 'إيقاف' : 'تشغيل'}</span></button>
             <button onClick={(e) => { e.stopPropagation(); setIsAutoPlay(!isAutoPlay); }} className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${isAutoPlay ? 'bg-green-600 border-green-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg><span className="text-[7px] mt-1 font-black uppercase">{isAutoPlay ? 'Auto' : 'Off'}</span></button>
             <button onClick={(e) => { e.stopPropagation(); onDislike(); }} className="flex flex-col items-center py-3 rounded-xl border-2 border-white/10 bg-white/5 text-gray-400 active:bg-red-950 transition-all"><svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg><span className="text-[7px] mt-1 font-black uppercase">استبعاد</span></button>
             <button onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); }} className="flex flex-col items-center py-3 rounded-xl border-2 border-purple-600 bg-purple-600/10 text-purple-400 neon-btn-purple active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5"/></svg><span className="text-[7px] mt-1 font-black uppercase">تكبير</span></button>
          </div>

          <div className="space-y-8">
             <div className="space-y-3">
                <div className="flex items-center gap-2 px-2"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_red]"></span><h3 className="text-xs font-black text-red-600 uppercase tracking-widest italic">سكة الكوابيس (فيديوهات طويلة)</h3></div>
                <div className="w-full overflow-hidden bg-neutral-900/20 py-5 border-y border-white/5 relative rounded-[2rem]"><div className="animate-marquee-custom flex gap-6">{[...suggestions.slice(0, 8), ...suggestions.slice(0, 8)].map((s, idx) => (<div key={`${s.id}-${idx}`} onClick={() => onSwitchVideo(s)} className="w-44 aspect-video shrink-0 rounded-2xl overflow-hidden border-2 border-red-600/20 relative active:scale-95 transition-all shadow-2xl bg-black group"><video src={s.video_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /><div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent p-3 flex items-end"><p className="text-[9px] text-white font-black line-clamp-1 italic tracking-tight">{s.title}</p></div></div>))}</div></div>
             </div>
             <div className="space-y-5 px-2">
                <div className="flex items-center gap-3 opacity-60"><div className="h-0.5 flex-1 bg-gradient-to-l from-red-600/40 to-transparent"></div><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">المزيد من الرعب</span><div className="h-0.5 flex-1 bg-gradient-to-r from-red-600/40 to-transparent"></div></div>
                <div className="flex flex-col gap-5 pb-20">{suggestions.map((s) => (<div key={s.id} onClick={() => onSwitchVideo(s)} className="flex gap-4 p-3 bg-white/5 rounded-[2rem] border border-white/10 hover:border-red-600/40 active:scale-95 transition-all group shadow-sm"><div className="w-32 h-20 bg-black rounded-2xl overflow-hidden border-2 border-white/5 shrink-0 relative"><video src={s.video_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" /></div><div className="flex flex-col justify-center flex-1 overflow-hidden"><h4 className="text-sm font-black text-white group-hover:text-red-600 transition-colors line-clamp-2 leading-tight mb-2 italic">{s.title}</h4><div className="flex items-center justify-between"><span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">ULTRA HD CONTENT</span><span className="text-[8px] text-red-500 font-black italic">{formatBigNumber(getDeterministicStats(s.video_url).views)} VIEWS</span></div></div></div>))}</div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LongPlayerOverlay;
