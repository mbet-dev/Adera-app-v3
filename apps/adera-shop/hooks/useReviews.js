import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@adera/auth/src/supabase';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [summary, setSummary] = useState({ average: 0, total: 0, distribution: [0, 0, 0, 0, 0] });

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at, updated_at,
          user_id,
          profiles (full_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        userId: r.user_id,
        userName: r.profiles?.full_name || 'Anonymous',
        userAvatar: r.profiles?.avatar_url || null,
      }));

      setReviews(mapped);

      // Compute summary
      const total = mapped.length;
      const avg = total > 0 ? mapped.reduce((s, r) => s + r.rating, 0) / total : 0;
      const distribution = [0, 0, 0, 0, 0];
      mapped.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
      });
      setSummary({ average: Math.round(avg * 10) / 10, total, distribution });

      // Check if current user already reviewed
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const existing = mapped.find((r) => r.userId === user.id);
          setUserReview(existing || null);
        }
      } catch {}
    } catch (err) {
      console.error('[useReviews] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(async (rating, comment = '') => {
    if (!productId || rating < 1 || rating > 5) return false;
    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be signed in');

      const { data, error } = await supabase
        .from('reviews')
        .upsert(
          { user_id: user.id, product_id: productId, rating, comment: comment.trim() || null },
          { onConflict: 'user_id,product_id' },
        )
        .select()
        .single();

      if (error) throw error;

      await fetchReviews();
      return true;
    } catch (err) {
      console.error('[useReviews] Submit error:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [productId, fetchReviews]);

  const deleteReview = useCallback(async () => {
    if (!userReview) return false;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', userReview.id);
      if (error) throw error;
      setUserReview(null);
      await fetchReviews();
      return true;
    } catch (err) {
      console.error('[useReviews] Delete error:', err);
      return false;
    }
  }, [userReview, fetchReviews]);

  return {
    reviews,
    summary,
    userReview,
    loading,
    submitting,
    submitReview,
    deleteReview,
    refresh: fetchReviews,
  };
};

export default useReviews;
