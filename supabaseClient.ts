
// تم تعطيل Supabase لصالح Cloudinary
export const supabase = null;

export const incrementViewsInDB = async (id: string) => {
  // مشاهدات وهمية أو محلية
  console.log('View incremented for:', id);
};

export const updateLikesInDB = async (id: string, inc: boolean) => {
  console.log('Like updated for:', id, inc);
};
