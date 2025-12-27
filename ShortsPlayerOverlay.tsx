
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Video, UserInteractions } from './types';
import { getDeterministicStats, formatBigNumber, LOGO_URL } from './MainContent';

interface ShortsPlayerOverlayProps {
  initialVideo: Video;
  videoList: Video[];
  interactions: UserInteractions;
  onClose: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onSave: (id: string) => void;
  onProgress: (id: string, progress: number) => void;
  onCategorySelect?: (category: string) => void;
}

const ShortsPlayerOverlay: React.FC<ShortsPlayerOverlayProps> = ({ 
  initialVideo, videoList, interactions, onClose, onLike, onDislike, onSave, onProgress, onCategorySelect
}) => {
  const smartList = useMemo(() => {
    if (!initialVideo) return [];
    const likedCategories = new Set(videoList.filter(v => interactions.likedIds.includes(v.id)).map(v => v.category));
    const pool = videoList.filter(v => !interactions.dislikedIds.includes(v.id) && v.id !== initialVideo.id);
    const shuffledPool = pool.sort(() => Math.random() - 0.5).map(v => {
      let score = Math.random();
      if (likedCategories.has(v.category)) score += 10; 
      return { video: v, score };
    }).sort((a, b) => b.score - a.score).map(s => s.video);
    return [initialVideo, ...shuffledPool];
  }, [initialVideo, videoList, interactions.likedIds, interactions.dislikedIds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    const currentVid = videoRefs.current[currentIndex];
    
    // إيقاف الفيديوهات الأخرى
    Object.keys(videoRefs.current).forEach((key) => {
      const idx = parseInt(key);
      const v = videoRefs.current[idx];
      if (v && idx !== currentIndex) {
        v.pause();
      }
    });

    if (currentVid) {
      setIsBuffering(true);
      // التحميل فقط إذا لزم الأمر
      if (currentVid.readyState < 2) {
        currentVid.load();
      }

      const playPromise = currentVid.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsBuffering(false);
        }).catch(() => {
          // التعامل مع خطأ المقاطعة بصمت، أو المحاولة لاحقاً
          currentVid.muted = true;
          currentVid.play().catch(() => {});
        });
      }
    }

    // تحميل مسبق للفيديو التالي
    const nextIdx = currentIndex + 1;
    if (nextIdx < smartList.length) {
      const nextVid = videoRefs.current[nextIdx];
      if (nextVid && nextVid.preload !== "auto") {
        nextVid.preload = "auto";
      }
    }
  }, [currentIndex, smartList]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = e.currentTarget.clientHeight;
    if (height === 0) return;
    const index = Math.round(e.currentTarget.scrollTop / height);
    if (index !== currentIndex && index >= 0 && index < smartList.length) {
      setCurrentIndex(index);
    }
  };

  const playNext = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < smartList.length && containerRef.current) {
      containerRef.current.scrollTo({
        top: nextIdx * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, smartList.length]);

  return (
    <div className="fixed inset-0 bg-black z-[500] flex flex-col overflow-hidden">
      <div className="absolute top-12 right-6 z-[600]">
        <button onClick={onClose} className="p-4 rounded-[1.5rem] bg-black/50 backdrop-blur-2xl text-red-600 border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-75 transition-all">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-grow overflow-y-scroll snap-y snap-mandatory scrollbar-hide h-full w-full">
        {smartList.map((video, idx) => {
          const stats = getDeterministicStats(video.video_url);
          const isLiked = interactions.likedIds.includes(video.id);
          const isSaved = interactions.savedIds.includes(video.id);
          const isActive = idx === currentIndex;

          return (
            <div key={`${video.id}-${idx}`} className="h-full w-full snap-start relative bg-black">
              <video 
                  ref={el => { videoRefs.current[idx] = el; }}
                  src={video.video_url} 
                  poster={video.poster_url}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${isActive && isBuffering ? 'opacity-50' : 'opacity-100'}`}
                  playsInline
                  loop={false}
                  preload={isActive ? "auto" : (Math.abs(idx - currentIndex) === 1 ? "metadata" : "none")}
                  onWaiting={() => isActive && setIsBuffering(true)}
                  onPlaying={() => isActive && setIsBuffering(false)}
                  onEnded={playNext}
                  onTimeUpdate={(e) => isActive && onProgress(video.id, e.currentTarget.currentTime / e.currentTarget.duration)}
                  onClick={() => {
                    const v = videoRefs.current[idx];
                    if (v) v.paused ? v.play().catch(() => {}) : v.pause();
                  }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none z-20" />
              
              <div className="absolute bottom-28 left-6 flex flex-col items-center gap-7 z-40">
                <button onClick={(e) => { e.stopPropagation(); onLike(video.id); }} className="flex flex-col items-center">
                  <div className={`p-4 rounded-full border-2 transition-all duration-300 ${isLiked ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_red]' : 'bg-black/50 border-white/20 text-white backdrop-blur-2xl'}`}>
                    <svg className="w-7 h-7" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                  </div>
                  <span className="text-[10px] font-black text-white mt-1">{formatBigNumber(stats.likes)}</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); onDislike(video.id); }} className="flex flex-col items-center">
                  <div className="p-4 rounded-full border-2 bg-black/50 border-white/20 text-white backdrop-blur-2xl active:bg-red-900 transition-all">
                    <svg className="w-7 h-7 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                  </div>
                  <span className="text-[10px] font-black text-white mt-1">استبعاد</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); onSave(video.id); }} className="flex flex-col items-center">
                   <div className={`p-4 rounded-full border-2 transition-all duration-300 ${isSaved ? 'bg-yellow-500 border-yellow-300 text-white shadow-[0_0_30px_yellow]' : 'bg-black/50 border-white/20 text-white backdrop-blur-2xl'}`}>
                     <svg className="w-7 h-7" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                   </div>
                   <span className="text-[10px] font-black text-white mt-1">حفظ</span>
                </button>
              </div>

              <div className="absolute bottom-28 right-6 left-28 z-40 text-right">
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCategorySelect?.(video.category); }}
                    className="border border-red-600 bg-red-600/10 px-3 py-1 rounded-md backdrop-blur-md active:scale-95 transition-transform"
                  >
                    <span className="text-[9px] font-black text-red-500 uppercase italic tracking-widest">{video.category}</span>
                  </button>
                  <div className="flex items-center justify-end gap-4 w-full">
                    <img 
                      src={LOGO_URL} 
                      onClick={(e) => { e.stopPropagation(); onClose(); }}
                      className="w-14 h-14 rounded-full border-2 border-red-600 shadow-2xl cursor-pointer active:scale-90 transition-transform" 
                      alt="Channel" 
                    />
                    <div className="flex flex-col items-end flex-1">
                      <h3 className="text-white text-xl font-black drop-shadow-[0_2px_15px_black] leading-tight line-clamp-2 italic">{video.title}</h3>
                      <p className="text-red-600 text-[10px] font-black italic mt-1">@HADIQA_STUDIO</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShortsPlayerOverlay;
