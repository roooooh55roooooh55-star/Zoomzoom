
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

    // إعداد الفيديو للتشغيل التلقائي المكتوم
    v.muted = true;
    v.defaultMuted = true;

    if (isOverlayActive) {
      v.pause();
      return;
    }

    // استخدام IntersectionObserver لضمان التشغيل عند الرؤية فقط
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        v.play().catch(() => {
          // محاولة ثانية إذا فشل التشغيل
          v.muted = true;
          v.play().catch(() => {});
        });
      } else {
        v.pause();
      }
    }, { threshold: 0.1 });

    observerRef.current.observe(v);
    return () => observerRef.current?.disconnect();
  }, [video.video_url, isOverlayActive]);

  return (
    <div className="w-full h-full relative bg-neutral-900 overflow-hidden group rounded-[2.5rem] shadow-2xl border border-white/5 transition-all duration-500 hover:border-red-600/50">
      <video 
        ref={videoRef}
        src={video.video_url}
        poster={video.poster_url}
        muted 
        loop 
        playsInline 
        autoPlay
        preload="auto"
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
      />
      
      <div className="absolute top-3 left-3 z-30">
        {showNewBadge && (
          <div className="backdrop-blur-xl bg-red-600/40 border border-red-500/50 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <span className="text-[7px] font-black text-white italic tracking-widest uppercase">نشط</span>
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); onLike?.(video.id); }}
          className={`p-2.5 rounded-2xl backdrop-blur-xl border transition-all active:scale-75 ${isLiked ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_red]' : 'bg-black/40 border-white/10 text-white/70 hover:text-white'}`}
        >
          <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-start">
          <button 
            onClick={(e) => { e.stopPropagation(); onCategorySelect?.(video.category); }}
            className="border border-red-600/30 bg-red-600/10 px-3 py-1 rounded-lg backdrop-blur-md pointer-events-auto"
          >
            <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">
              {video.category}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-[10px] font-black line-clamp-1 italic text-right flex-1">
            {video.title}
          </p>
          <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full border border-white/10">
             <span className="text-[8px] font-black text-white">{formatBigNumber(stats.likes)}</span>
             <div className="w-px h-2 bg-white/20"></div>
             <span className="text-[8px] font-black text-white">{formatBigNumber(stats.views)}</span>
          </div>
        </div>
      </div>
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
  
  const tripledItems = useMemo(() => items.length > 0 ? [...items, ...items, ...items] : [], [items]);

  useEffect(() => {
    if (!scrollRef.current || isOverlayActive || items.length === 0) return;

    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += direction === 'rtl' ? 1 : -1;
        const scrollWidth = scrollRef.current.scrollWidth / 3;
        if (Math.abs(scrollRef.current.scrollLeft) >= scrollWidth * 2 || scrollRef.current.scrollLeft >= 0) {
           scrollRef.current.scrollLeft = -scrollWidth;
        }
      }
    };

    const timer = setInterval(scroll, 30);
    return () => clearInterval(timer);
  }, [isOverlayActive, items, direction]);

  return (
    <div 
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-3"
      style={{ direction: 'rtl' }}
    >
      {tripledItems.map((v, i) => (
        <div key={`${v.id}-${i}`} onClick={() => onPlay(v)} className={`${isShort ? 'w-40 aspect-[9/16]' : 'w-64 aspect-video'} shrink-0 active:scale-95 transition-transform`}>
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

interface MainContentProps {
  videos: Video[];
  interactions: UserInteractions;
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video, list: Video[]) => void;
  onHardRefresh: () => void;
  loading: boolean;
  isTitleYellow: boolean;
  onSearchToggle?: () => void;
  isOverlayActive: boolean;
  onCategorySelect?: (category: string) => void;
  onLike?: (id: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  videos, interactions, onPlayShort, onPlayLong, onHardRefresh, loading, isTitleYellow, onSearchToggle, isOverlayActive, onCategorySelect, onLike
}) => {
  const filteredVideos = useMemo(() => {
    return videos.filter(v => !interactions.dislikedIds.includes(v.id));
  }, [videos, interactions.dislikedIds]);

  const shorts = useMemo(() => filteredVideos.filter(v => v.type === 'short'), [filteredVideos]);
  const longs = useMemo(() => filteredVideos.filter(v => v.type === 'long'), [filteredVideos]);

  return (
    <div className="flex flex-col pb-48 pt-0 px-4 w-full bg-black min-h-screen relative" dir="rtl">
      <section className="flex items-center justify-between py-3 border-b border-white/5 sticky top-0 bg-black/90 backdrop-blur-3xl z-40">
        <div className="flex items-center gap-3" onClick={onHardRefresh}>
          <img src={LOGO_URL} className="w-10 h-10 rounded-full border border-red-600" alt="Logo" />
          <div className="flex flex-col text-right">
            <h1 className={`text-lg font-black italic tracking-tighter ${isTitleYellow ? 'text-yellow-400' : 'text-red-600'}`}>
              الحديقة المرعبة
            </h1>
            <p className="text-[6px] text-gray-500 font-bold tracking-widest uppercase">PREMIUM HORROR STREAM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onSearchToggle} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-red-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </button>
        </div>
      </section>

      {/* المحتوى الرئيسي */}
      <div className="mt-8 space-y-12">
        {/* قسم 1: رعب سريعة */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></span>
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">مختارات سريعة</h2>
          </div>
          <SmartMarquee items={shorts.slice(0, 10)} onPlay={(v) => onPlayShort(v, shorts)} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>

        {/* قسم 2: أفلام مطولة */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-pulse"></span>
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">كوابيس مطولة</h2>
          </div>
          <SmartMarquee items={longs.slice(0, 10)} onPlay={(v) => onPlayLong(v, longs)} isOverlayActive={isOverlayActive} isShort={false} onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>

        {/* قسم 3: جرعة مكثفة */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></span>
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">جرعة رعب مكثفة</h2>
          </div>
          <SmartMarquee items={shorts.slice(10, 20)} onPlay={(v) => onPlayShort(v, shorts)} isOverlayActive={isOverlayActive} direction="ltr" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      </div>

      {loading && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50">
           <span className="text-red-600 font-black text-[10px] animate-pulse bg-black/80 px-6 py-2 rounded-full border border-red-600/30 backdrop-blur-md">جاري فتح المستودع...</span>
        </div>
      )}
    </div>
  );
};

export default MainContent;
