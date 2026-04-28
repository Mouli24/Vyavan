import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
  MapPin, Star, Shield, CheckCircle, Package,
  MessageCircle, Phone, Factory, Award, Users,
  ArrowLeft, ShoppingCart, Calendar, ExternalLink
} from 'lucide-react'

export default function CompanyStorefront() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'certifications' | 'reviews'>('products')
  const [canSchedule, setCanSchedule] = useState(false)
  const [holidayInfo, setHolidayInfo] = useState<any>(null)

  const handleAction = (type: string, productId?: string) => {
    if (!authUser) {
      navigate('/login')
      return
    }
    
    if (authUser.role !== 'buyer') {
      if (authUser.role === 'manufacturer') {
        navigate('/manufacturer/negotiation');
        return;
      }
      alert('Only buyers can initiate negotiations.')
      return
    }

    const mfrId = data.user._id
    if (type === 'negotiate' || type === 'contact') {
      navigate(`/buyer/negotiation?manufacturer=${mfrId}${productId ? `&product=${productId}` : ''}`)
    } else if (type === 'cart' && productId) {
      api.addToCart(productId, 1).then(() => {
        navigate('/buyer/checkout')
      }).catch(e => alert(e.message ?? 'Failed to add to cart'))
    } else if (type === 'schedule') {
      navigate(`/buyer/schedule?manufacturer=${mfrId}`)
    }
  }

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      try {
        // Try by company code first, then by ID
        let result
        if (id.startsWith('MFR-') || id.startsWith('MNG')) {
          const profile = await api.getCompanyByCode(id)
          result = await api.getCompany(profile.user._id)
        } else {
          result = await api.getCompany(id)
        }
        setData(result)
        
        // Fetch status info
        const mfrId = result.user._id
        api.checkManufacturerHoliday(mfrId).then(setHolidayInfo).catch(() => {})
        api.checkCallContext(mfrId).then(res => setCanSchedule(res.canSchedule)).catch(() => setCanSchedule(false))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-sp-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-sp-bg flex flex-col items-center justify-center text-center p-6" id="manufacturer-not-found">
        <Factory className="w-16 h-16 text-sp-border mb-4" />
        <h2 className="text-2xl font-bold text-sp-text mb-2">Company Not Found</h2>
        <p className="text-sp-muted mb-6">The manufacturer you're looking for doesn't exist or hasn't been approved yet.</p>
        <button onClick={() => navigate('/buyer/browse')} className="px-6 py-3 gradient-card-purple text-white rounded-xl font-bold hover:opacity-90 transition-all">
          Browse All Manufacturers
        </button>
      </div>
    )
  }

  const { user, profile, products } = data
  const isVerified = profile?.status === 'approved'

  return (
    <div className="min-h-screen bg-sp-bg" id="company-storefront">
      {/* Holiday Banner */}
      {holidayInfo?.isOnHoliday && (
        <div className="bg-amber-600 text-white px-4 py-3 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500">
          <Calendar className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm font-medium">
            <span className="font-black uppercase tracking-widest mr-2">Manufacturer on holiday:</span>
            {holidayInfo.autoResponse || "We are currently closed and will return soon."} 
            {holidayInfo.backInOfficeDate && ` We'll be back on ${new Date(holidayInfo.backInOfficeDate).toLocaleDateString()}.`}
          </div>
        </div>
      )}

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => handleAction('contact')} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:opacity-90">
          <MessageCircle className="w-4 h-4 inline mr-2" /> Contact
        </button>
      </header>

      {/* Hero / Banner */}
      <div className="relative">
        <div className="h-48 sm:h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
          {profile?.profileBanner ? (
             <img src={profile.profileBanner} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-slate-200" />
          )}
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="relative -mt-16 flex items-end gap-6 mb-8">
            {/* Logo */}
            <div className="w-28 h-28 bg-indigo-600 rounded-3xl border-4 border-white shadow-xl flex items-center justify-center flex-shrink-0">
               {profile?.logo ? (
                <img src={profile.logo} alt={user.company} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-4xl font-black text-white">{user.company?.[0] ?? 'M'}</span>
              )}
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-sp-text">{user.company ?? user.name}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-sp-mint text-sp-success rounded-full">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-sp-muted mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {user.location ?? 'India'}
                {profile?.companyCode && (
                  <span className="ml-2 text-xs font-mono bg-sp-bg border border-sp-border px-2 py-0.5 rounded">
                    {profile.companyCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          {[
            { icon: Package,  label: 'Products',    value: products?.length ?? 0 },
            { icon: Star,     label: 'Avg Rating',  value: profile?.stats?.avgRating?.toFixed(1) ?? '0.0' },
            { icon: Users,    label: 'Employees',   value: profile?.employeeCount ?? '—' },
            { icon: Award,    label: 'Est.',         value: profile?.yearEstablished ?? '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mb-10">
          <button
            onClick={() => handleAction('negotiate')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <MessageCircle className="w-5 h-5" /> Start Negotiation
          </button>
          <button
            onClick={() => handleAction('chat')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-indigo-600 font-bold rounded-2xl hover:border-indigo-600/30 transition-all"
          >
            <MessageCircle className="w-5 h-5" /> Chat Now
          </button>
          <button
            onClick={() => handleAction('schedule')}
            disabled={!canSchedule}
            className={`flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 font-bold rounded-2xl transition-all ${
              canSchedule 
                ? 'text-gray-900 hover:border-indigo-600/30' 
                : 'text-gray-300 cursor-not-allowed grayscale'
            }`}
          >
            <Calendar className="w-5 h-5" /> Schedule Call
          </button>
          <button
            onClick={() => handleAction('contact')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:border-indigo-600/30 transition-all"
          >
            <Phone className="w-5 h-5" /> Contact
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-sp-border">
          {(['products', 'reviews', 'about', 'certifications'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-sp-purple text-sp-purple'
                  : 'border-transparent text-sp-muted hover:text-sp-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Products */}
        {activeTab === 'products' && (
          <div>
            {(!products || products.length === 0) ? (
              <div className="text-center py-16 text-sp-muted">
                <Package className="w-12 h-12 mx-auto mb-3 text-sp-border" />
                <p className="font-medium">No products listed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((product: any) => (
                  <div key={product._id} className="bg-white rounded-2xl border border-sp-border shadow-card overflow-hidden group hover:border-sp-purple/30 hover:shadow-hover transition-all">
                    <div className="aspect-square overflow-hidden bg-sp-bg">
                      <img
                        src={product.image ?? `https://placehold.co/300x300/EDE9FE/7C3AED?text=${encodeURIComponent(product.name[0])}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/300x300/EDE9FE/7C3AED?text=${encodeURIComponent(product.name[0])}` }}
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-sp-muted uppercase tracking-wider mb-1">{product.category}</p>
                      <h3 className="font-bold text-sm text-sp-text mb-1">{product.name}</h3>
                      {product.material && <p className="text-xs text-sp-muted mb-2">Material: {product.material}</p>}
                      <div className="flex items-center justify-between pt-3 border-t border-sp-border">
                        <div>
                          <span className="text-base font-extrabold text-sp-purple">₹{product.price?.toLocaleString()}</span>
                          <span className="text-[10px] text-sp-muted"> /{product.unit ?? 'pc'}</span>
                          <p className="text-[10px] text-sp-muted">MOQ: {product.moq}</p>
                        </div>
                        <button
                          onClick={() => handleAction('cart', product._id)}
                          className="p-2 gradient-card-purple text-white rounded-lg hover:opacity-90 transition-all"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Rating Summary Card */}
            <div className="bg-white rounded-3xl border border-sp-border shadow-card p-8 grid md:grid-cols-3 gap-8">
              <div className="text-center md:border-r border-sp-border flex flex-col justify-center">
                <p className="text-6xl font-black text-sp-text">{profile?.stats?.avgRating?.toFixed(1) ?? '0.0'}</p>
                <div className="flex justify-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= (profile?.stats?.avgRating ?? 0) ? 'text-amber-500 fill-current' : 'text-sp-border'}`} />
                  ))}
                </div>
                <p className="text-sm text-sp-muted font-medium">Based on {profile?.stats?.totalReviews ?? 0} reviews</p>
              </div>

              <div className="md:col-span-2 space-y-4 py-2">
                {[
                  { label: 'Product Quality', value: profile?.stats?.avgQuality ?? 0 },
                  { label: 'Delivery Timeline', value: profile?.stats?.avgDelivery ?? 0 },
                  { label: 'Communication', value: profile?.stats?.avgCommunication ?? 0 },
                ].map(param => (
                  <div key={param.label}>
                    <div className="flex justify-between text-xs font-bold text-sp-text mb-1.5 uppercase tracking-wider">
                      <span>{param.label}</span>
                      <span className="text-sp-purple">{param.value.toFixed(1)}/5.0</span>
                    </div>
                    <div className="h-2 bg-sp-bg rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-card-purple rounded-full transition-all duration-1000" 
                        style={{ width: `${(param.value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <ReviewList manufacturerId={user._id} />
          </div>
        )}
        {activeTab === 'about' && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-sp-border shadow-card p-6">
              <h3 className="font-bold text-sp-text mb-4 flex items-center gap-2">
                <Factory className="w-4 h-4 text-sp-purple" /> Company Details
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Company Name', value: user.company },
                  { label: 'Contact Person', value: user.name },
                  { label: 'Location', value: user.location },
                  { label: 'Year Established', value: profile?.yearEstablished },
                  { label: 'Employee Count', value: profile?.employeeCount },
                  { label: 'Annual Turnover', value: profile?.annualTurnover },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-sp-border last:border-0">
                    <span className="text-sm text-sp-muted">{row.label}</span>
                    <span className="text-sm font-medium text-sp-text">{row.value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {profile?.address?.city && (
              <div className="bg-white rounded-2xl border border-sp-border shadow-card p-6">
                <h3 className="font-bold text-sp-text mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sp-purple" /> Address
                </h3>
                <p className="text-sm text-sp-text leading-relaxed">
                  {profile.address.street && <>{profile.address.street}<br /></>}
                  {profile.address.city}, {profile.address.state}<br />
                  {profile.address.pincode && <>{profile.address.pincode}<br /></>}
                  {profile.address.country}
                </p>
                {profile?.exportMarkets?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-sp-border">
                    <p className="text-xs text-sp-muted uppercase tracking-wider mb-2">Export Markets</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.exportMarkets.map((m: string) => (
                        <span key={m} className="text-xs px-2 py-1 bg-sp-purple-pale text-sp-purple rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {profile?.categories?.length > 0 && (
              <div className="bg-white rounded-2xl border border-sp-border shadow-card p-6">
                <h3 className="font-bold text-sp-text mb-4">Product Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.categories.map((c: string) => (
                    <span key={c} className="px-3 py-1.5 bg-sp-purple-pale text-sp-purple rounded-full text-xs font-medium">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Certifications */}
        {activeTab === 'certifications' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Verification documents */}
            {[
              { label: 'GST Verified', value: profile?.gstNumber, verified: !!profile?.gstNumber },
              { label: 'PAN Verified', value: profile?.panNumber, verified: !!profile?.panNumber },
              { label: 'MSME Registered', value: profile?.msmeNumber, verified: !!profile?.msmeNumber },
            ].map(cert => (
              <div key={cert.label} className="bg-white rounded-2xl border border-sp-border shadow-card p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cert.verified ? 'bg-sp-mint' : 'bg-sp-bg'}`}>
                  <CheckCircle className={`w-5 h-5 ${cert.verified ? 'text-sp-success' : 'text-sp-border'}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-sp-text">{cert.label}</p>
                  <p className="text-xs text-sp-muted">{cert.verified ? cert.value : 'Not provided'}</p>
                </div>
              </div>
            ))}

            {profile?.certifications?.map((cert: string) => (
              <div key={cert} className="bg-white rounded-2xl border border-sp-border shadow-card p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-sp-mint rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-sp-success" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-sp-text">{cert}</p>
                  <p className="text-xs text-sp-muted">Industry Certification</p>
                </div>
              </div>
            ))}

            {(!profile?.certifications?.length && !profile?.gstNumber) && (
              <div className="col-span-3 text-center py-16 text-sp-muted">
                <Shield className="w-12 h-12 mx-auto mb-3 text-sp-border" />
                <p>No certifications listed yet</p>
              </div>
            )}
          </div>
        )}

        {/* Factory images */}
        {activeTab === 'about' && profile?.factoryImages?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-sp-text mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-sp-purple" /> Factory Images
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.factoryImages.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-sp-border">
                  <img src={img} alt={`Factory ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewList({ manufacturerId }: { manufacturerId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReviews(manufacturerId)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [manufacturerId]);

  if (loading) return <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" /></div>;

  if (reviews.length === 0) return (
    <div className="bg-white rounded-3xl border border-sp-border p-16 text-center">
      <Star className="w-12 h-12 mx-auto mb-3 text-sp-border" />
      <p className="font-medium text-sp-text">No reviews yet</p>
      <p className="text-sm text-sp-muted">Be the first to share your experience after a delivered order.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <ReviewItem key={review._id} review={review} />
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: any }) {
  return (
    <div className="bg-white rounded-3xl border border-sp-border p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-card-purple rounded-full flex items-center justify-center font-bold text-white uppercase">
            {review.buyer?.name?.[0] ?? 'B'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sp-text">{review.buyer?.name ?? 'Verified Buyer'}</span>
              <span className="flex items-center gap-1 text-[10px] bg-sp-mint text-sp-success px-2 py-0.5 rounded-full font-bold">
                <CheckCircle className="w-2.5 h-2.5" /> Verified Purchase
              </span>
            </div>
            <p className="text-[10px] text-sp-muted">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.ratings.overall ? 'text-amber-500 fill-current' : 'text-sp-border'}`} />
          ))}
        </div>
      </div>

      <div className="pl-13">
        <p className="text-sm text-sp-text leading-relaxed mb-4">{review.comment || "No comment provided."}</p>
        
        {review.images?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {review.images.map((img: string, i: number) => (
              <img key={i} src={img} alt="Review" className="w-20 h-20 object-cover rounded-xl border border-sp-border" />
            ))}
          </div>
        )}

        {/* Breakdown Tooltip/Mini-stats */}
        <div className="flex gap-4 mb-4">
          {[
            { label: 'Quality', val: review.ratings.quality },
            { label: 'Delivery', val: review.ratings.delivery },
            { label: 'Comm.', val: review.ratings.communication },
          ].map(p => (
            <div key={p.label} className="text-[10px] font-bold text-sp-muted uppercase tracking-tighter">
              {p.label}: <span className="text-sp-purple">{p.val}</span>
            </div>
          ))}
        </div>

        {/* Manufacturer Reply */}
        {review.manufacturerReply?.text && (
          <div className="bg-sp-bg rounded-2xl p-4 border-l-4 border-sp-purple">
            <div className="flex items-center gap-2 mb-1">
              <Factory className="w-3.5 h-3.5 text-sp-purple" />
              <span className="text-xs font-black text-sp-text uppercase tracking-wider">Manufacturer's Reply</span>
            </div>
            <p className="text-sm text-sp-text italic leading-relaxed">"{review.manufacturerReply.text}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
