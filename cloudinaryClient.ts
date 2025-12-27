
import { Video } from './types';

const CLOUD_NAME = 'dlrvn33p0'.trim();
const COMMON_TAG = 'hadiqa_v4';

/**
 * بيانات تجريبية في حال فشل الجلب من السحابة
 */
const MOCK_VIDEOS: Video[] = [
  {
    id: 'mock1',
    public_id: 'mock1',
    video_url: 'https://res.cloudinary.com/dlrvn33p0/video/upload/q_auto,f_auto/v1/app_videos/sample_horror.mp4',
    poster_url: '',
    type: 'short',
    title: 'جاري استحضار الأرواح...',
    category: 'غموض',
    likes: 0,
    views: 0
  }
];

export const fetchCloudinaryVideos = async (): Promise<Video[]> => {
  try {
    const timestamp = new Date().getTime();
    // الرابط يتطلب تفعيل Resource List في إعدادات Cloudinary -> Security
    const targetUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${COMMON_TAG}.json?t=${timestamp}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store' 
    });

    if (!response || !response.ok) {
      console.error("Cloudinary Error: Make sure 'Resource List' is enabled in Cloudinary Security settings.");
      const cached = localStorage.getItem('app_videos_cache');
      return cached ? JSON.parse(cached) : MOCK_VIDEOS;
    }

    const data = await response.json();
    const resources = data.resources || [];
    
    if (resources.length === 0) return MOCK_VIDEOS;

    return mapCloudinaryData(resources);
  } catch (error) {
    console.error("Fetch Connection Error:", error);
    const cached = localStorage.getItem('app_videos_cache');
    return cached ? JSON.parse(cached) : MOCK_VIDEOS;
  }
};

const mapCloudinaryData = (resources: any[]): Video[] => {
  const mapped = resources.map((res: any) => {
    const videoType: 'short' | 'long' = (res.height > res.width) ? 'short' : 'long';
    const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload`;
    
    // استخدام روابط MP4 مباشرة لضمان التشغيل في كافة المتصفحات
    const optimizedUrl = `${baseUrl}/q_auto:good,f_mp4,vc_h264/v${res.version}/${res.public_id}.mp4`;
    const posterUrl = `${baseUrl}/q_auto,f_jpg,so_0/v${res.version}/${res.public_id}.jpg`;
    
    const title = res.context?.custom?.caption || 'كابوس مجهول';

    return {
      id: res.public_id,
      public_id: res.public_id,
      video_url: optimizedUrl,
      poster_url: posterUrl,
      type: videoType,
      title: title,
      likes: 0,
      views: 0,
      category: res.context?.custom?.caption ? 'مرعب' : 'غموض',
      created_at: res.created_at
    } as Video;
  });

  localStorage.setItem('app_videos_cache', JSON.stringify(mapped));
  return mapped;
};
