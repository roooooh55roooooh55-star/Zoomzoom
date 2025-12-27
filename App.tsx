
import React, { useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react';
import { Video, AppView, UserInteractions } from './types.ts';
import { fetchCloudinaryVideos } from './cloudinaryClient.ts';
import { getRecommendedFeed } from './geminiService.ts';
import AppBar from './AppBar.tsx';
import MainContent from './MainContent.tsx';
import SavedPage from './SavedPage.tsx';

const ShortsPlayerOverlay = lazy(() => import('./ShortsPlayerOverlay.tsx'));
const LongPlayerOverlay = lazy(() => import('./LongPlayerOverlay.tsx'));
const AdminDashboard = lazy(() => import('./AdminDashboard.tsx'));
const AIOracle = lazy(() => import('./AIOracle.tsx'));
const TrendPage = lazy(() => import('./TrendPage.tsx'));
const PrivacyPage = lazy(() => import('./PrivacyPage.tsx'));
const HiddenVideosPage = lazy(() => import('./HiddenVideosPage.tsx'));

const DEFAULT_CATEGORIES = [
  'رعب حقيقي ✴️', 
  'رعب الحيوانات 🔱', 
  'هجمات مرعبة ✴️', 
  'أخطر المشاهد 🔱', 
  'رعب الحديقة ⚠️', 
  'رعب كوميدي 😂 ⚠️', 
  'لحظات مرعبة'
];

const SearchOverlay: React.FC<{ 
  videos: Video[], 
  onClose: () => void, 
  onPlayShort: (v: Video, l: Video[]) => void, 
  onPlayLong: (v: Video) => void 
}> = ({ videos, onClose, onPlayShort, onPlayLong }) => {
  const [query, setQuery] = useState('');
  const filtered = videos.filter(v => 
    v.title.toLowerCase().includes(query.toLowerCase()) || 
    v.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1200] bg-black/98 backdrop-blur-3xl p-6 flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-8 pt-6">
        <div className="relative flex-1">
          <input 
            autoFocus
            type="text" 
            placeholder="ابحث عن كابوسك..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border-2 border-red-600/20 rounded-2xl py-4 px-12 text-white outline-none focus:border-red-600 transition-all shadow-inner"
          />
          <svg className="w-6 h-6 absolute right-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <button onClick={onClose} className="p-4 bg-red-600 rounded-2xl text-white font-black active:scale-95 shadow-[0_0_20px_red]">إغلاق</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pb-20">
        {filtered.map(v => (
          <div key={v.id} onClick={() => v.type === 'short' ? onPlayShort(v, [v]) : onPlayLong(v)} className="flex gap-4 p-4 bg-white/5 rounded-3xl border border-white/5 active:scale-95 transition-all hover:bg-white/10">
            <div className={`w-28 shrink-0 bg-black rounded-2xl overflow-hidden border border-white/10 ${v.type === 'short' ? 'aspect-[9/16]' : 'aspect-video'}`}>
              <video src={v.video_url} className="w-full h-full object-cover opacity-40" />
            </div>
            <div className="flex flex-col justify-center gap-1">
              <h3 className="text-sm font-black text-white line-clamp-2 italic">{v.title}</h3>
              <span className="text-[9px] text-red-500 font-black uppercase bg-red-600/10 px-2 py-0.5 rounded w-fit border border-red-600/20">{v.category}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-600 mt-20 font-black italic tracking-widest uppercase text-xs">No records found in current sector</p>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rawVideos, setRawVideos] = useState<Video[]>([]); 
  const [loading, setLoading] = useState(true);
  const [selectedShort, setSelectedShort] = useState<{ video: Video, list: Video[] } | null>(null);
  const [selectedLong, setSelectedLong] = useState<{ video: Video, list: Video[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTitleYellow, setIsTitleYellow] = useState(false);

  const isOverlayActive = useMemo(() => !!selectedShort || !!selectedLong, [selectedShort, selectedLong]);

  const [interactions, setInteractions] = useState<UserInteractions>(() => {
    try {
      const saved = localStorage.getItem('al-hadiqa-interactions-v5');
      return saved ? JSON.parse(saved) : { likedIds: [], dislikedIds: [], savedIds: [], watchHistory: [] };
    } catch (e) {
      return { likedIds: [], dislikedIds: [], savedIds: [], watchHistory: [] };
    }
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async (isHardRefresh = false) => {
    if (isHardRefresh) setLoading(true);
    try {
      const data = await fetchCloudinaryVideos();
      if (!data || data.length === 0) {
        setRawVideos([]);
        return;
      }
      
      const recommendedOrder = await getRecommendedFeed(data, interactions);
      const orderedVideos = recommendedOrder
        .map(id => data.find(v => v.id === id || v.public_id === id))
        .filter((v): v is Video => !!v);

      const remaining = data.filter(v => !recommendedOrder.includes(v.id));
      setRawVideos([...orderedVideos, ...remaining]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (isHardRefresh) {
        setIsTitleYellow(true);
        setTimeout(() => setIsTitleYellow(false), 2500);
      }
    }
  }, [interactions]);

  useEffect(() => { loadData(false); }, [loadData]);
  useEffect(() => { localStorage.setItem('al-hadiqa-interactions-v5', JSON.stringify(interactions)); }, [interactions]);

  useEffect(() => {
    if (!isOverlayActive && rawVideos.length > 0) {
      loadData(false);
    }
  }, [isOverlayActive, loadData]);

  const updateWatchHistory = (id: string, progress: number) => {
    setInteractions(prev => {
      const history = [...prev.watchHistory];
      const index = history.findIndex(h => h.id === id);
      if (index > -1) { if (progress > history[index].progress) history[index].progress = progress; }
      else { history.push({ id, progress }); }
      return { ...prev, watchHistory: history };
    });
  };

  const handleLikeToggle = (id: string) => {
    setInteractions(p => {
      if (p.likedIds.includes(id)) {
        return { ...p, likedIds: p.likedIds.filter(x => x !== id) };
      }
      return { ...p, likedIds: [...p.likedIds, id], dislikedIds: p.dislikedIds.filter(x => x !== id) };
    });
    if (!interactions.likedIds.includes(id)) {
      showToast("الأرواح تعتز بإعجابك! 💀");
    }
  };

  const handleDislike = (id: string) => {
    setInteractions(p => ({
      ...p,
      dislikedIds: Array.from(new Set([...p.dislikedIds, id])),
      likedIds: p.likedIds.filter(x => x !== id)
    }));
    showToast("تم نفي الفيديو إلى النسيان ⚰️");
    setSelectedShort(null);
    setSelectedLong(null);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentView(AppView.CATEGORY);
    setSelectedShort(null);
    setSelectedLong(null);
  };

  const handleSwitchLongVideo = (v: Video) => {
    setSelectedLong(prev => prev ? { ...prev, video: v } : null);
  };

  const renderContent = () => {
    const longsOnly = rawVideos.filter(v => v.type === 'long');

    switch(currentView) {
      case AppView.ADMIN:
        return <Suspense fallback={null}><AdminDashboard onClose={() => setCurrentView(AppView.HOME)} categories={DEFAULT_CATEGORIES} initialVideos={rawVideos} /></Suspense>;
      case AppView.TREND:
        return <TrendPage onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} excludedIds={interactions.dislikedIds} />;
      case AppView.LIKES:
        return <SavedPage savedIds={interactions.likedIds} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} title="الإعجابات" />;
      case AppView.SAVED:
        return <SavedPage savedIds={interactions.savedIds} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} title="المحفوظات" />;
      case AppView.HIDDEN:
        return <HiddenVideosPage interactions={interactions} allVideos={rawVideos} onRestore={(id) => setInteractions(prev => ({...prev, dislikedIds: prev.dislikedIds.filter(x => x !== id)}))} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} />;
      case AppView.PRIVACY:
        return <PrivacyPage onOpenAdmin={() => setCurrentView(AppView.ADMIN)} />;
      case AppView.CATEGORY:
        const categoryVideos = rawVideos.filter(v => v.category === selectedCategory);
        return <SavedPage savedIds={categoryVideos.map(v => v.id)} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} title={selectedCategory || "القسم"} />;
      default:
        return (
          <MainContent 
            videos={rawVideos} 
            categoriesList={DEFAULT_CATEGORIES} 
            interactions={interactions}
            onPlayShort={(v, l) => setSelectedShort({video:v, list:l.filter(x => x.type === 'short')})}
            onPlayLong={(v, l) => setSelectedLong({video:v, list:l.filter(x => x.type === 'long')})}
            onHardRefresh={() => loadData(true)}
            loading={loading}
            isTitleYellow={isTitleYellow}
            onSearchToggle={() => setIsSearchOpen(true)}
            isOverlayActive={isOverlayActive}
            onCategorySelect={handleCategorySelect}
            onLike={handleLikeToggle}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AppBar onViewChange={setCurrentView} onRefresh={() => loadData(false)} currentView={currentView} />
      <main className="pt-20 max-w-lg mx-auto overflow-x-hidden">{renderContent()}</main>

      <Suspense fallback={null}><AIOracle /></Suspense>
      {toast && <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[1100] bg-red-600 px-8 py-3 rounded-2xl font-black shadow-2xl shadow-red-600/40 text-[10px] italic border border-red-400/30 backdrop-blur-md">{toast}</div>}
      
      {isSearchOpen && (
        <SearchOverlay 
          videos={rawVideos} 
          onClose={() => setIsSearchOpen(false)} 
          onPlayShort={(v, l) => { setSelectedShort({video:v, list:l}); setIsSearchOpen(false); }}
          onPlayLong={(v) => { setSelectedLong({video:v, list:rawVideos.filter(x => x.type === 'long')}); setIsSearchOpen(false); }}
        />
      )}

      {selectedShort && (
        <Suspense fallback={null}>
          <ShortsPlayerOverlay 
            initialVideo={selectedShort.video} 
            videoList={selectedShort.list} 
            interactions={interactions} 
            onClose={() => setSelectedShort(null)} 
            onLike={handleLikeToggle} 
            onDislike={handleDislike} 
            onSave={(id) => setInteractions(p => p.savedIds.includes(id) ? p : ({...p, savedIds: [...p.savedIds, id]}))} 
            onProgress={updateWatchHistory} 
            onCategorySelect={handleCategorySelect}
          />
        </Suspense>
      )}
      
      {selectedLong && (
        <Suspense fallback={null}>
          <LongPlayerOverlay 
            video={selectedLong.video} 
            allLongVideos={selectedLong.list} 
            onClose={() => setSelectedLong(null)} 
            onLike={() => handleLikeToggle(selectedLong.video.id)} 
            onDislike={() => handleDislike(selectedLong.video.id)} 
            onSave={() => setInteractions(p => p.savedIds.includes(selectedLong.video.id) ? p : ({...p, savedIds: [...p.savedIds, selectedLong.video.id]}))} 
            onSwitchVideo={handleSwitchLongVideo} 
            isLiked={interactions.likedIds.includes(selectedLong.video.id)} 
            isDisliked={interactions.dislikedIds.includes(selectedLong.video.id)} 
            isSaved={interactions.savedIds.includes(selectedLong.video.id)} 
            onProgress={(p) => updateWatchHistory(selectedLong.video.id, p)} 
            onCategorySelect={handleCategorySelect}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
