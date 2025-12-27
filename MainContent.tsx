
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Video, UserInteractions } from './types.ts';

export const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

export const getDeterministicStats = (seed: string) => {
  let hash = 0;
  if (!seed) return { views: 0, likes: 0 };
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const baseViews = Math.abs(hash % 900000) + 500000; 
  const views = baseViews * (Math.abs(hash % 5) + 2); 
  const likes = Math.abs(Math.floor(views * (0.12 + (Math.abs(hash % 15) / 100)))); 
  return { views, likes };
};

export const formatBigNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const VideoCardThumbnail: React.FC<{ 
  video: Video, 
  isOverlayActive: boolean, 
  progress?: number, 
  showNewBadge?: boolean,
  onCategorySelect?: (cat: string) => void,
  onLike?: (id: string) => void,
  isLiked?: boolean
}> = ({ video, isOverlayActive, progress, showNewBadge, onCategorySelect, onLike, isLiked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const stats = useMemo(() => getDeterministicStats(video.video_url), [video.video_url]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !video.video_url) return;

    if (v.src !== video.video_url) {
      v.src = video.video_url;
      v.load();
    }

    if (isOverlayActive) {
      v.pause();
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // تجاهل أخطاء المقاطعة الناتجة عن التمرير السريع
          });
        }
      } else {
        v.pause();
      }
    }, { threshold: 0.1 });

    observerRef.current.observe(v);
    return () => {
      observerRef.current?.disconnect();
      v.pause();
    };
  }, [video.video_url, isOverlayActive]);

  return (
    <div className="w-full h-full relative bg-neutral-900 overflow-hidden group rounded-[2rem] shadow-2xl border border-white/5 pointer-events-auto transition-all duration-500 hover:border-red-600/50 hover:shadow-red-600/10">
      <video 
        ref={videoRef}
        poster={video.poster_url}
        muted 
        loop 
        playsInline 
        preload="metadata"
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 pointer-events-none scale-105 group-hover:scale-100"
      />
      
      <div className="absolute top-3 left-3 z-30">
        {showNewBadge && (
          <div className="backdrop-blur-xl bg-red-600/40 border border-red-500/50 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse">
            <span className="text-[7px] font-black text-white italic tracking-widest uppercase">جديد</span>
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); onLike?.(video.id); }}
          className={`p-2.5 rounded-2xl backdrop-blur-xl border transition-all active:scale-75 ${isLiked ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_red]' : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-white/30'}`}
        >
          <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-start">
          <button 
            onClick={(e) => { e.stopPropagation(); onCategorySelect?.(video.category); }}
            className="border border-red-600/30 bg-red-600/10 px-3 py-1 rounded-lg backdrop-blur-md pointer-events-auto active:scale-95 transition-transform"
          >
            <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">
              {video.category}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-[10px] font-black line-clamp-1 italic text-right drop-shadow-2xl leading-tight flex-1">
            {video.title}
          </p>
          
          <div className="flex items-center gap-2 shrink-0 bg-white/5 px-2 py-1 rounded-full border border-white/10 backdrop-blur-2xl">
             <div className="flex items-center gap-1">
                <svg className="w-2.5 h-2.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span className="text-[8px] font-black text-white">{formatBigNumber(stats.likes)}</span>
             </div>
             <div className="w-px h-2 bg-white/20"></div>
             <div className="flex items-center gap-1">
                <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <span className="text-[8px] font-black text-white">{formatBigNumber(stats.views)}</span>
             </div>
          </div>
        </div>
      </div>

      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5 z-30">
          <div className="h-full bg-red-600 shadow-[0_0_15px_red] transition-all duration-500" style={{ width: `${progress * 100}%` }}></div>
        </div>
      )}
    </div>
  );
};

const SmartMarquee: React.FC<{ 
  items: Video[], 
  onPlay: (v: Video) => void, 
  isOverlayActive: boolean,
  isShort?: boolean,
  direction?: 'ltr' | 'rtl',
  onCategorySelect?: (cat: string) => void,
  onLike?: (id: string) => void,
  likedIds?: string[]
}> = ({ items, onPlay, isOverlayActive, isShort = true, direction = 'rtl', onCategorySelect, onLike, likedIds = [] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);
  
  const tripledItems = useMemo(() => items.length > 0 ? [...items, ...items, ...items] : [], [items]);

  useEffect(() => {
    if (!scrollRef.current || isOverlayActive || isPaused || isInteracting || items.length === 0) return;

    const scroll = () => {
      if (scrollRef.current) {
        const step = direction === 'rtl' ? 1.5 : -1.5;
        scrollRef.current.scrollLeft += step;
        
        const scrollWidth = scrollRef.current.scrollWidth / 3;
        if (Math.abs(scrollRef.current.scrollLeft) >= scrollWidth * 2 || scrollRef.current.scrollLeft >= 0) {
           scrollRef.current.scrollLeft = -scrollWidth;
        }
      }
    };

    const timer = setInterval(scroll, 30);
    return () => clearInterval(timer);
  }, [isOverlayActive, isPaused, isInteracting, items, direction]);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    setIsPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 2000); 
  };

  return (
    <div 
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-3 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      style={{ direction: 'rtl' }}
    >
      {tripledItems.map((v, i) => (
        <div key={`${v.id}-${i}`} onClick={() => onPlay(v)} className={`${isShort ? 'w-36 aspect-[9/16]' : 'w-64 aspect-video'} shrink-0 active:scale-95 transition-transform`}>
          <VideoCardThumbnail 
            video={v} 
            isOverlayActive={isOverlayActive} 
            onCategorySelect={onCategorySelect} 
            onLike={onLike}
            isLiked={likedIds.includes(v.id)}
          />
        </div>
      ))}
    </div>
  );
};

const UnwatchedMarquee: React.FC<{ 
  items: { video: Video, progress: number }[], 
  onPlayShort: (v: Video, list: Video[]) => void, 
  onPlayLong: (v: Video) => void,
  isOverlayActive: boolean,
  onCategorySelect?: (cat: string) => void,
  onLike?: (id: string) => void,
  likedIds?: string[]
}> = ({ items, onPlayShort, onPlayLong, isOverlayActive, onCategorySelect, onLike, likedIds = [] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);

  const tripledItems = useMemo(() => items.length > 0 ? [...items, ...items, ...items] : [], [items]);

  useEffect(() => {
    if (!scrollRef.current || isOverlayActive || isPaused || isInteracting || items.length === 0) return;

    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += 1.5; 
        const scrollWidth = scrollRef.current.scrollWidth / 3;
        if (Math.abs(scrollRef.current.scrollLeft) >= scrollWidth * 2) {
          scrollRef.current.scrollLeft = -scrollWidth;
        }
      }
    };

    const timer = setInterval(scroll, 30);
    return () => clearInterval(timer);
  }, [isOverlayActive, isPaused, isInteracting, items]);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    setIsPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  return (
    <div 
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-3 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      style={{ direction: 'rtl' }}
    >
      {tripledItems.map((item, i) => (
        <div 
          key={`${item.video.id}-${i}`} 
          onClick={() => item.video.type === 'short' ? onPlayShort(item.video, items.map(it => it.video)) : onPlayLong(item.video)} 
          className={`${item.video.type === 'short' ? 'w-36 aspect-[9/16]' : 'w-64 aspect-video'} shrink-0 active:scale-95 transition-transform`}
        >
          <VideoCardThumbnail 
            video={item.video} 
            isOverlayActive={isOverlayActive} 
            progress={item.progress} 
            onCategorySelect={onCategorySelect} 
            onLike={onLike}
            isLiked={likedIds.includes(item.video.id)}
          />
        </div>
      ))}
    </div>
  );
};

interface MainContentProps {
  videos: Video[];
  categoriesList: string[];
  interactions: UserInteractions;
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video, list: Video[]) => void;
  onHardRefresh: () => void;
  loading: boolean;
  isTitleYellow: boolean;
  onShowToast?: (msg: string) => void;
  onSearchToggle?: () => void;
  isOverlayActive: boolean;
  onCategorySelect?: (category: string) => void;
  onLike?: (id: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  videos, categoriesList, interactions, onPlayShort, onPlayLong, onHardRefresh, loading, isTitleYellow, onSearchToggle, isOverlayActive, onCategorySelect, onLike
}) => {
  const [startY, setStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);

  const filteredVideos = useMemo(() => {
    const excludedIds = interactions.dislikedIds;
    return videos.filter(v => !excludedIds.includes(v.id || v.video_url));
  }, [videos, interactions.dislikedIds]);

  const shorts = useMemo(() => filteredVideos.filter(v => v.type === 'short'), [filteredVideos]);
  const longs = useMemo(() => filteredVideos.filter(v => v.type === 'long'), [filteredVideos]);

  const unwatchedData = useMemo(() => {
    const seen = new Set();
    const result: { video: Video, progress: number }[] = [];
    const history = [...interactions.watchHistory].reverse();
    for (const h of history) {
      if (h.progress > 0.05 && h.progress < 0.95) {
        const video = videos.find(v => v.id === h.id || v.video_url === h.id);
        if (video && !seen.has(video.id)) {
          seen.add(video.id);
          result.push({ video, progress: h.progress });
        }
      }
    }
    return result;
  }, [interactions.watchHistory, videos]);

  const shortsGroup1 = useMemo(() => shorts.slice(0, 4), [shorts]);
  const shortsGroup2 = useMemo(() => shorts.slice(4, 8), [shorts]);
  const shortsHappyTrip = useMemo(() => shorts.slice(8, 18), [shorts]);
  const shortsNewAdventure = useMemo(() => shorts.slice(18, 28).reverse(), [shorts]);

  const longsFeatured = useMemo(() => longs.slice(0, 3), [longs]);
  const longsInsight = useMemo(() => {
    return longs.slice(-10).reverse();
  }, [longs]);

  // رسالة المساعدة عند عدم وجود فيديوهات
  const isEmpty = videos.length === 0 && !loading;

  return (
    <div 
      onTouchStart={(e) => window.scrollY === 0 && setStartY(e.touches[0].pageY)}
      onTouchMove={(e) => startY !== 0 && (e.touches[0].pageY - startY) > 0 && (e.touches[0].pageY - startY) < 120 && setPullOffset(e.touches[0].pageY - startY)}
      onTouchEnd={() => { pullOffset > 70 && onHardRefresh(); setPullOffset(0); setStartY(0); }}
      className="flex flex-col pb-48 pt-0 px-4 w-full bg-black min-h-screen relative transition-all duration-300"
      style={{ transform: `translateY(${pullOffset / 2}px)` }}
      dir="rtl"
    >
      <section className="flex items-center justify-between py-2 border-b border-white/5 bg-black/80 backdrop-blur-3xl sticky top-0 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHardRefresh}>
          <img src={LOGO_URL} className="w-9 h-9 rounded-full border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]" alt="Logo" />
          <div className="flex flex-col text-right">
            <h1 className={`text-base font-black italic transition-all duration-500 tracking-tighter ${isTitleYellow ? 'text-yellow-400 drop-shadow-[0_0_20px_#facc15]' : 'text-red-600 drop-shadow-[0_0_10px_red]'}`}>
              الحديقة المرعبة
            </h1>
            <p className="text-[6px] text-blue-400 font-black tracking-widest uppercase -mt-0.5 opacity-70">AI INTELLIGENT STREAM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => window.open('https://snaptubeapp.com', '_blank')} className="w-11 h-11 rounded-2xl border border-yellow-600/30 flex items-center justify-center text-yellow-600 bg-yellow-600/10 active:scale-90 transition-transform shadow-inner">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M15.5,13.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5 s1.5,0.67,1.5,1.5S16.33,13.5,15.5,13.5z M8.5,13.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S9.33,13.5,8.5,13.5z M12,18c-2.33,0-4.39-1.39-5.33-3.41c-0.12-0.27,0.01-0.59,0.28-0.71c0.27-0.12,0.59,0.01,0.71,0.28C8.42,15.89,10.1,17,12,17 s3.58-1.11,4.34-2.84c0.12-0.27,0.44-0.4,0.71-0.28c0.27,0.12,0.4,0.44,0.28,0.71C16.39,16.61,14.33,18,12,18z"/></svg>
           </button>
           <button onClick={onSearchToggle} className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 active:scale-90 transition-transform shadow-inner">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </button>
        </div>
      </section>

      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center pt-24 text-center gap-6 animate-in fade-in duration-1000">
           <div className="w-20 h-20 rounded-full border-2 border-red-600/30 flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
           </div>
           <div className="space-y-2">
              <h2 className="text-xl font-black text-white italic">خطأ في جلب السجلات</h2>
              <p className="text-[10px] text-gray-500 leading-relaxed max-w-xs mx-auto">
                يرجى التأكد من تفعيل خاصية <span className="text-red-500">Resource List</span> في إعدادات Cloudinary لفتح المستودع المحرم.
              </p>
           </div>
           <button onClick={onHardRefresh} className="px-8 py-3 bg-red-600 rounded-2xl font-black text-sm shadow-[0_0_30px_rgba(220,38,38,0.4)] active:scale-95 transition-all">تحديث المستودع</button>
        </div>
      )}

      {/* 1. مختارات سريعة */}
      {shortsGroup1.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_red]"></span>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic bg-red-600/20 px-3 py-1 rounded-lg border border-red-600/30">مختارات سريعة</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {shortsGroup1.map(v => (
              <div key={v.id} onClick={() => onPlayShort(v, shorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail 
                  video={v} 
                  isOverlayActive={isOverlayActive} 
                  showNewBadge={true} 
                  onCategorySelect={onCategorySelect} 
                  onLike={onLike}
                  isLiked={interactions.likedIds.includes(v.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. نواصل الحكاية */}
      {unwatchedData.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce shadow-[0_0_15px_yellow]"></span>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-500/30">نواصل الحكاية</h2>
          </div>
          <UnwatchedMarquee 
            items={unwatchedData} 
            onPlayShort={onPlayShort} 
            onPlayLong={(v) => onPlayLong(v, longs)} 
            isOverlayActive={isOverlayActive} 
            onCategorySelect={onCategorySelect}
            onLike={onLike}
            likedIds={interactions.likedIds}
          />
        </section>
      )}

      {/* 3. كوابيس مطولة */}
      {longsFeatured.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-2 h-2 bg-purple-600 rounded-full shadow-[0_0_15px_purple] animate-pulse"></span>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic bg-purple-600/20 px-3 py-1 rounded-lg border border-purple-600/30">كوابيس مطولة</h2>
          </div>
          <div className="flex flex-col gap-6">
            {longsFeatured.map((video) => (
              <div key={video.id} onClick={() => onPlayLong(video, longs)} className="aspect-video cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail 
                  video={video} 
                  isOverlayActive={isOverlayActive} 
                  onCategorySelect={onCategorySelect} 
                  onLike={onLike}
                  isLiked={interactions.likedIds.includes(video.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. جرعة رعب مكثفة */}
      {shortsGroup2.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_red]"></span>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic bg-red-600/20 px-3 py-1 rounded-lg border border-red-600/30">جرعة رعب مكثفة</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {shortsGroup2.map(v => (
              <div key={v.id} onClick={() => onPlayShort(v, shorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail 
                  video={v} 
                  isOverlayActive={isOverlayActive} 
                  onCategorySelect={onCategorySelect} 
                  onLike={onLike}
                  isLiked={interactions.likedIds.includes(v.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. رحلة سعيدة (شورتس LTR) */}
      {shortsHappyTrip.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_15px_cyan] animate-pulse"></span>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic bg-cyan-500/20 px-3 py-1 rounded-lg border border-cyan-500/30">رحلة سعيدة</h2>
          </div>
          <SmartMarquee 
            items={shortsHappyTrip} 
            onPlay={(v) => onPlayShort(v, shorts)} 
            isOverlayActive={isOverlayActive} 
            isShort={true} 
            direction="ltr" 
            onCategorySelect={onCategorySelect}
            onLike={onLike}
            likedIds={interactions.likedIds}
          />
        </section>
      )}

      {/* 6. نبذة (طويل LTR) */}
      {longsInsight.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_15px_green] animate-pulse"></span>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic bg-green-500/20 px-3 py-1 rounded-lg border border-green-500/30">نبذة</h2>
          </div>
          <SmartMarquee 
            items={longsInsight} 
            onPlay={(v) => onPlayLong(v, longs)} 
            isOverlayActive={isOverlayActive} 
            isShort={false} 
            direction="ltr"
            onCategorySelect={onCategorySelect}
            onLike={onLike}
            likedIds={interactions.likedIds}
          />
        </section>
      )}

      {/* 7. رحلة جديدة (شورتس LTR) */}
      {shortsNewAdventure.length > 0 && (
        <section className="mt-10 mb-16">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-2 h-2 bg-orange-600 rounded-full shadow-[0_0_15px_orange] animate-bounce"></span>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic bg-orange-600/20 px-3 py-1 rounded-lg border border-orange-600/30">رحلة جديدة</h2>
          </div>
          <SmartMarquee 
            items={shortsNewAdventure} 
            onPlay={(v) => onPlayShort(v, shorts)} 
            isOverlayActive={isOverlayActive} 
            isShort={true} 
            direction="ltr" 
            onCategorySelect={onCategorySelect}
            onLike={onLike}
            likedIds={interactions.likedIds}
          />
        </section>
      )}

      {loading && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50">
           <span className="text-yellow-400 font-black text-[9px] animate-pulse bg-black/90 px-5 py-2 rounded-full border border-yellow-400/30 backdrop-blur-3xl shadow-2xl tracking-widest uppercase">Syncing Cloud Database...</span>
        </div>
      )}
    </div>
  );
};

export default MainContent;
