
import React, { useRef, useEffect, useMemo } from 'react';
import { Video } from '../types';

interface UnwatchedPageProps {
  watchHistory: { id: string, progress: number }[];
  allVideos: Video[];
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video) => void;
}

const LiveThumbnail: React.FC<{ url: string, isShort: boolean, progress: number }> = ({ url, isShort, progress }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { 
    const v = videoRef.current;
    if (!v) return;
    
    const p = v.play();
    if (p !== undefined) p.catch(() => {});
    
    const handleTimeUpdate = () => {
      if (v.currentTime >= 5) v.currentTime = 0;
    };
    v.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.pause();
    };
  }, [url]);

  return (
    <div className="relative w-full h-full fluo-portal">
      <video ref={videoRef} src={url} muted loop playsInline autoPlay className="w-full h-full object-cover opacity-80 relative z-10" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20">
         <div className="h-full bg-red-600 shadow-[0_0_8px_red]" style={{ width: `${progress * 100}%` }}></div>
      </div>
    </div>
  );
};

const UnwatchedPage: React.FC<UnwatchedPageProps> = ({ watchHistory, allVideos, onPlayShort, onPlayLong }) => {
  const unwatchedData = useMemo(() => {
    const uniqueMap = new Map();
    watchHistory
      .filter(h => h.progress > 0.05 && h.progress < 0.95)
      .forEach(h => {
        const video = allVideos.find(v => (v.id === h.id || v.video_url === h.id));
        if (video) {
          uniqueMap.set(video.id || video.video_url, { video, progress: h.progress });
        }
      });
    return Array.from(uniqueMap.values()).reverse();
  }, [watchHistory, allVideos]);

  if (unwatchedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 text-center gap-6">
        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center opacity-30">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p className="text-gray-500 font-bold">كل الفيديوهات مكتملة! حديقة نظيفة.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-yellow-600/20 to-transparent border border-yellow-500/20 shadow-2xl">
         <div className="flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest opacity-60">Session Recovery</p>
               <h1 className="text-3xl font-black italic">نواصل الحكاية</h1>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500 flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {unwatchedData.map(({ video, progress }) => (
          video && (
            <div 
              key={video.id || video.video_url}
              onClick={() => video.type === 'short' ? onPlayShort(video, unwatchedData.map(d => d.video).filter(v => v.type === 'short')) : onPlayLong(video)}
              className="flex flex-col gap-2 group cursor-pointer"
            >
              <div className={`relative rounded-3xl overflow-hidden border border-white/10 shadow-xl ${video.type === 'short' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                <LiveThumbnail url={video.video_url} isShort={video.type === 'short'} progress={progress} />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] text-white font-black border border-white/10 z-20">
                  {Math.round(progress * 100)}%
                </div>
              </div>
              <p className="text-[11px] font-bold line-clamp-1 px-2">{video.title}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default UnwatchedPage;
