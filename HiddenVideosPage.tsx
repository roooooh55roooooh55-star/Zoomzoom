
import React from 'react';
import { Video, UserInteractions } from '../types';

interface HiddenVideosPageProps {
  interactions: UserInteractions;
  allVideos: Video[];
  onRestore: (id: string) => void;
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video) => void;
}

const HiddenVideosPage: React.FC<HiddenVideosPageProps> = ({ interactions, allVideos, onRestore, onPlayShort, onPlayLong }) => {
  const hiddenVideos = allVideos.filter(v => interactions.dislikedIds.includes(v.id || v.video_url));

  if (hiddenVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 text-center gap-6 opacity-30">
        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeWidth="1" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        <p className="text-lg font-bold">لا توجد فيديوهات مستبعدة حالياً.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in duration-500">
      <div className="p-6 rounded-3xl bg-red-600/10 border border-red-600/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <h1 className="text-2xl font-black italic text-red-600 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">الفيديوهات المستبعدة</h1>
        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Hidden from Main Feed</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {hiddenVideos.map((video) => (
          <div key={video.id || video.video_url} className="flex flex-col gap-2 relative">
            <div 
              onClick={() => video.type === 'short' ? onPlayShort(video, [video]) : onPlayLong(video)}
              className={`relative rounded-2xl overflow-hidden border border-white/10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all ${video.type === 'short' ? 'aspect-[9/16]' : 'aspect-video'}`}
            >
              <video 
                src={video.video_url} 
                muted autoPlay loop playsInline 
                className="w-full h-full object-cover" 
                onTimeUpdate={(e) => {
                  if (e.currentTarget.currentTime >= 5) e.currentTarget.currentTime = 0;
                }}
              />
            </div>
            <button 
              onClick={() => onRestore(video.id || video.video_url)}
              className="absolute -top-2 -right-2 bg-green-600 text-white p-2 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.7)] border border-green-400 active:scale-90 transition-transform"
              title="استعادة الفيديو"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
            </button>
            <p className="text-[10px] font-bold line-clamp-1 text-center mt-1 px-1">{video.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HiddenVideosPage;
