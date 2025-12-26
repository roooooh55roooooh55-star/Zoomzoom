
import { Video } from './types';

const CLOUD_NAME = 'dlrvn33p0'.trim();
const COMMON_TAG = 'hadiqa_v4';

/**
 * جلب الفيديوهات باستخدام القائمة العامة JSON (Tag List)
 * تم تحسينه لتجنب أخطاء الشبكة و CORS وتقديم تجربة مستخدم مستقرة
 */
export const fetchCloudinaryVideos = async (): Promise<Video[]> => {
  try {
    const timestamp = new Date().getTime();
    // الرابط المباشر لقائمة الفيديوهات بناءً على التاغ
    const targetUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${COMMON_TAG}.json?t=${timestamp}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      mode: 'cors', // تأكيد وضع CORS لتجنب أخطاء المتصفح
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store' 
    }).catch(err => {
      console.warn("Network error or fetch failed:", err);
      return null;
    });

    if (!response || !response.ok) {
      // محاولة جلب البيانات من الكاش المحلي كحل بديل ذكي
      const cached = localStorage.getItem('app_videos_cache');
      if (cached) {
        console.log("Serving from local cache due to connection failure.");
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
      return [];
    }

    const data = await response.json();
    const resources = data.resources || [];
    
    return mapCloudinaryData(resources);
  } catch (error) {
    console.warn('Critical fetch failure - Using cache:', error);
    const cached = localStorage.getItem('app_videos_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
};

const mapCloudinaryData = (resources: any[]): Video[] => {
  const mapped = resources.map((res: any) => {
    const videoType: 'short' | 'long' = (res.height > res.width) ? 'short' : 'long';
    const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload`;
    
    // تحسين الرابط للجودة التلقائية والتنسيق الأسرع لتقليل استهلاك البيانات وسرعة التحميل
    const optimizedUrl = `${baseUrl}/q_auto,f_auto/v${res.version}/${res.public_id}.${res.format}`;
    
    // إنشاء رابط صورة (Poster) من الفيديو لتجنب ظهور شاشة سوداء عند التحميل الأول
    const posterUrl = `${baseUrl}/q_auto,f_auto,so_0/v${res.version}/${res.public_id}.jpg`;
    
    const categoryTag = res.context?.custom?.caption || 'غموض';
    const title = res.context?.custom?.caption || 'فيديو مرعب';

    return {
      id: res.public_id,
      public_id: res.public_id,
      video_url: optimizedUrl,
      poster_url: posterUrl,
      type: videoType,
      title: title,
      likes: 0,
      views: 0,
      category: categoryTag,
      created_at: res.created_at
    } as Video;
  });

  // تحديث الكاش المحلي لضمان توفر الفيديوهات في المرة القادمة حتى بدون إنترنت
  if (mapped.length > 0) {
    localStorage.setItem('app_videos_cache', JSON.stringify(mapped));
  }
  return mapped;
};

export const deleteCloudinaryVideo = async (publicId: string) => {
  console.warn("Delete requires Admin API credentials.");
  return false;
};

export const updateCloudinaryMetadata = async (publicId: string, title: string, category: string) => {
  console.warn("Update requires Admin API credentials.");
  return false;
};
