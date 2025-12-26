
import React, { useEffect, useState, useMemo } from 'react';
import { Video } from '../types';
import { fetchCloudinaryVideos } from '../cloudinaryClient';
import { getDeterministicStats, formatBigNumber } from './MainContent';

const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

interface TrendPageProps {
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video) => void;
  excludedIds: string[];
}

const TrendPage: React.FC<TrendPageProps> = ({ onPlayShort, onPlayLong, excludedIds }) => {
  const [rawTrends, setRawTrends] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCloudinaryVideos().then(data => { setRawTrends(data); setLoading(false); });
  }, []);

  const filteredTrends = useMemo(() => {
    const pool = rawTrends.filter(v => !excludedIds.includes(v.id || v.video_url));
    return pool.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  }, [rawTrends, excludedIds]);

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center">
      <span className="text-red-600 font-black text-xs italic animate-pulse drop-shadow-[0_0_10px_red]">تحديث...</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="flex items-center justify-between border-b border-red-600/20 pb-4">
        <div className="flex items-center gap-4">
           <img src={LOGO_URL} className="w-12 h-12 rounded-full border-2 border-red-600 shadow-[0_0_15px_red]" />
           <div className="flex flex-col text-right">
              <h1 className="text-2xl font-black text-red-600 italic">الرائج الآن</h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Horror Garden Ranking</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {filteredTrends.map((video, idx) => (
          <div 
            key={video.id}
            onClick={() => video.type === 'short' ? onPlayShort(video, filteredTrends.filter(v=>v.type==='short')) : onPlayLong(video)}
            className="group relative bg-[#1a1a1a]/50 border border-white/5 rounded-[2.5rem] overflow-hidden cursor-pointer"
          >
            <div className="aspect-video relative overflow-hidden">
              <video src={video.video_url} muted autoPlay loop playsInline className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[3s]" />
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl shadow-lg z-20">{idx + 1}</div>
            </div>
            <div className="p-6 bg-[#0f0f0f]/60 backdrop-blur-sm flex items-center justify-between">
              <h3 className="font-black text-lg text-white">{video.title}</h3>
              <img src={LOGO_URL} className="w-6 h-6 rounded-full opacity-30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendPage;
