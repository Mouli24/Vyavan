import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Star, CheckCircle, Factory, MessageSquare, Send } from 'lucide-react'

export default function ManufacturerReviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    // We need the manufacturer ID. We can get it from api.me() or just let the backend handle it via 'protect'
    // But getReviews() takes an ID. Let's get the user ID first.
    api.me().then(user => {
      api.getReviews(user._id)
        .then(setReviews)
        .catch(console.error)
        .finally(() => setLoading(false))
    })
  }, [])

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;

    try {
      setSubmitting(reviewId);
      const updatedReview = await api.replyToReview(reviewId, text);
      setReviews(prev => prev.map(r => r._id === reviewId ? updatedReview : r));
      setReplyText(prev => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
    } catch (e: any) {
      alert(e.message ?? 'Failed to send reply');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-mfr-brown border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-mfr-dark">Customer Reviews</h2>
          <p className="text-sm text-mfr-muted">Manage your public feedback and respond to buyers.</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-mfr-border p-20 text-center shadow-sm">
          <Star className="w-12 h-12 mx-auto mb-4 text-mfr-border" />
          <p className="text-lg font-bold text-mfr-dark">No reviews yet</p>
          <p className="text-sm text-mfr-muted">Reviews will appear here once buyers rate their delivered orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white rounded-3xl border border-mfr-border p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-card-purple rounded-full flex items-center justify-center font-bold text-white uppercase shadow-sm">
                    {review.buyer?.name?.[0] ?? 'B'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-mfr-dark">{review.buyer?.name ?? 'Verified Buyer'}</span>
                      <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full font-bold border border-green-100">
                        <CheckCircle className="w-2.5 h-2.5" /> Verified Purchase
                      </span>
                    </div>
                    <p className="text-[10px] text-mfr-muted uppercase tracking-wider font-semibold">
                      {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.ratings.overall ? 'text-amber-500 fill-current' : 'text-gray-200'}`} />
                  ))}
                  <span className="ml-2 text-sm font-black text-mfr-dark">{review.ratings.overall.toFixed(1)}</span>
                </div>
              </div>

              <div className="ml-0 sm:ml-13">
                <p className="text-mfr-dark leading-relaxed mb-4 text-sm bg-mfr-peach/20 p-4 rounded-2xl italic">
                  "{review.comment || "The buyer didn't leave a written comment."}"
                </p>

                {review.images?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {review.images.map((img: string, i: number) => (
                      <img key={i} src={img} alt="Review" className="w-24 h-24 object-cover rounded-xl border border-mfr-border shadow-sm hover:scale-105 transition-transform" />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-6 mb-6">
                  {[
                    { label: 'Quality', val: review.ratings.quality },
                    { label: 'Delivery', val: review.ratings.delivery },
                    { label: 'Comm.', val: review.ratings.communication },
                  ].map(p => (
                    <div key={p.label} className="flex flex-col">
                      <span className="text-[10px] font-bold text-mfr-muted uppercase tracking-widest">{p.label}</span>
                      <div className="flex items-center gap-1">
                         <span className="text-sm font-black text-mfr-brown">{p.val}</span>
                         <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-mfr-brown" style={{ width: `${(p.val/5)*100}%` }} />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manufacturer Reply Logic */}
                {review.manufacturerReply?.text ? (
                  <div className="bg-mfr-brown/5 rounded-2xl p-5 border-l-4 border-mfr-brown">
                    <div className="flex items-center gap-2 mb-2">
                       <Factory className="w-4 h-4 text-mfr-brown" />
                       <span className="text-xs font-black text-mfr-brown uppercase tracking-wider">Your Reply</span>
                       <span className="text-[10px] text-mfr-muted ml-auto italic">
                         {new Date(review.manufacturerReply.repliedAt).toLocaleDateString()}
                       </span>
                    </div>
                    <p className="text-sm text-mfr-dark leading-relaxed">"{review.manufacturerReply.text}"</p>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-dashed border-mfr-border">
                    <p className="text-xs font-bold text-mfr-muted uppercase mb-3 flex items-center gap-2">
                       <MessageSquare className="w-3 h-3" /> Write a Public Reply
                    </p>
                    <div className="relative">
                      <textarea
                        value={replyText[review._id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                        placeholder="Thank the buyer or address their concerns... (max 500 chars)"
                        maxLength={500}
                        className="w-full bg-gray-50 border border-mfr-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-mfr-brown/10 focus:border-mfr-brown transition-all pr-16"
                        rows={2}
                      />
                      <button
                        onClick={() => handleReply(review._id)}
                        disabled={submitting === review._id || !replyText[review._id]?.trim()}
                        className="absolute right-3 bottom-3 p-2 bg-mfr-brown text-white rounded-xl shadow-md hover:bg-mfr-brown-hover disabled:opacity-50 transition-all"
                      >
                         <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[9px] text-mfr-muted mt-2 italic">* You can only reply once. This reply will be visible to everyone on your storefront.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
