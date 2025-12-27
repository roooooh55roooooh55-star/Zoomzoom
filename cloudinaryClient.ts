
import { Video } from './types';

const CLOUD_NAME = 'dlrvn33p0'.trim();
const COMMON_TAG = 'hadiqa_v4';

/**
 * جلب الفيديوهات مع تحسين روابط البث لضمان السرعة وعدم التقطيع
 */
export const fetchCloudinaryVideos = async (): Promise<Video[]> => {
  try {
    const timestamp = new Date().getTime();
    const targetUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${COMMON_TAG}.json?t=${timestamp}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store' 
    });

    if (!response || !response.ok) {
      const cached = localStorage.getItem('app_videos_cache');
      return cached ? JSON.parse(cached) : [];
    }

    const data = await response.json();
    const resources = data.resources || [];
    
    return mapCloudinaryData(resources);
  } catch (error) {
    const cached = localStorage.getItem('app_videos_cache');
    return cached ? JSON.parse(cached) : [];
  }
};

const mapCloudinaryData = (resources: any[]): Video[] => {
  const mapped = resources.map((res: any) => {
    const videoType: 'short' | 'long' = (res.height > res.width) ? 'short' : 'long';
    const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload`;
    
    /**
     * إصلاح خطأ المصدر:
     * نستخدم f_auto للتحسين ولكن ننهي الرابط بـ .mp4 لضمان قبول المتصفح للمصدر كفيديو مدعوم.
     * br_1.0m: يضمن تشغيل سلس حتى على الشبكات الضعيفة.
     */
    const optimizedUrl = `${baseUrl}/q_auto,f_auto,vc_h264,br_1.0m/v${res.version}/${res.public_id}.mp4`;
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

  if (mapped.length > 0) {
    localStorage.setItem('app_videos_cache', JSON.stringify(mapped));
  }
  return mapped;
};
