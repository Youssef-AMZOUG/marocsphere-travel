import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Flag, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StarRating({ rating, onChange, size = 'sm' }) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          data-testid={`star-${i}`}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`${sz} ${(hover || rating) >= i ? 'fill-saffron-400 text-saffron-400' : 'text-stone-300'}`} />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-stone-500">{label}</span>
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-saffron-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-stone-400">{count}</span>
    </div>
  );
}

export function ReviewSummary({ stats }) {
  if (!stats || stats.total === 0) return null;
  return (
    <div data-testid="review-summary" className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-midnight-500">{stats.avg_rating?.toFixed(1)}</span>
        <div>
          <StarRating rating={Math.round(stats.avg_rating || 0)} />
          <p className="text-xs text-stone-400 mt-0.5">{stats.total} review{stats.total !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="space-y-1">
        <RatingBar label="5" count={stats.five || 0} total={stats.total} />
        <RatingBar label="4" count={stats.four || 0} total={stats.total} />
        <RatingBar label="3" count={stats.three || 0} total={stats.total} />
        <RatingBar label="2" count={stats.two || 0} total={stats.total} />
        <RatingBar label="1" count={stats.one || 0} total={stats.total} />
      </div>
    </div>
  );
}

export function ReviewCard({ review }) {
  const token = localStorage.getItem('token');
  const [helpful, setHelpful] = useState(false);

  const markHelpful = async () => {
    if (!token) { toast.error('Sign in to mark reviews as helpful'); return; }
    try {
      await axios.post(`${API}/reviews/${review.id}/helpful`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setHelpful(true);
    } catch { /* ignore */ }
  };

  return (
    <div data-testid={`review-card-${review.id}`} className="py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-terracotta-100 flex items-center justify-center text-xs font-bold text-terracotta-600">
            {(review.user_name || 'T')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium text-midnight-500">{review.user_name || 'Traveler'}</p>
            <p className="text-[10px] text-stone-400">{new Date(review.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.title && <p className="text-sm font-medium text-midnight-500 mt-2">{review.title}</p>}
      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{review.content}</p>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={markHelpful}
          disabled={helpful}
          className={`flex items-center gap-1 text-[10px] ${helpful ? 'text-terracotta-500' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <ThumbsUp className="w-3 h-3" /> {helpful ? 'Helpful' : `Helpful (${review.helpful_count || 0})`}
        </button>
      </div>
    </div>
  );
}

export default function ReviewSection({ targetType, targetId, compact = false }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!targetType || !targetId) return;
    setLoading(true);
    axios.get(`${API}/reviews`, { params: { target_type: targetType, target_id: targetId } })
      .then(r => {
        setReviews(r.data.reviews || []);
        setStats(r.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetType, targetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { toast.error('Please sign in to leave a review'); return; }
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (!content.trim()) { toast.error('Please write your review'); return; }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/reviews`, {
        target_type: targetType,
        target_id: targetId,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setReviews(prev => [res.data.review, ...prev]);
      setStats(prev => prev ? {
        ...prev,
        total: prev.total + 1,
        avg_rating: ((prev.avg_rating * prev.total) + rating) / (prev.total + 1),
        [['', 'one', 'two', 'three', 'four', 'five'][rating]]: (prev[['', 'one', 'two', 'three', 'four', 'five'][rating]] || 0) + 1,
      } : { total: 1, avg_rating: rating, five: rating === 5 ? 1 : 0, four: rating === 4 ? 1 : 0, three: rating === 3 ? 1 : 0, two: rating === 2 ? 1 : 0, one: rating === 1 ? 1 : 0 });
      setRating(0); setTitle(''); setContent(''); setShowForm(false);
      toast.success('Review published!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-2 text-center"><Loader2 className="w-4 h-4 animate-spin text-stone-400 mx-auto" /></div>;

  const displayReviews = compact ? reviews.slice(0, 2) : reviews;

  return (
    <div data-testid="review-section" className="mt-3">
      {compact && (
        <button
          data-testid="toggle-reviews"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-xs font-medium text-midnight-500 py-1"
        >
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-saffron-400 text-saffron-400" />
            {stats?.total > 0 ? `${stats.avg_rating?.toFixed(1)} (${stats.total} reviews)` : 'No reviews yet'}
          </span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {expanded && (
        <div className="space-y-3">
          {!compact && stats?.total > 0 && <ReviewSummary stats={stats} />}

          {displayReviews.map(r => <ReviewCard key={r.id} review={r} />)}

          {reviews.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-2">No reviews yet. Be the first!</p>
          )}

          {!showForm ? (
            <Button
              data-testid="write-review-btn"
              onClick={() => token ? setShowForm(true) : toast.error('Please sign in to leave a review')}
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-lg border-terracotta-200 text-terracotta-600 hover:bg-terracotta-50"
            >
              Write a review
            </Button>
          ) : (
            <form onSubmit={handleSubmit} data-testid="review-form" className="space-y-2 bg-stone-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Your rating:</span>
                <StarRating rating={rating} onChange={setRating} />
              </div>
              <input
                type="text"
                data-testid="review-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-terracotta-300"
              />
              <textarea
                data-testid="review-content-input"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your experience..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-terracotta-300 resize-none"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} size="sm" className="flex-1 bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs rounded-lg">
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />} Submit
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} variant="ghost" size="sm" className="text-xs">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
