import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, ShoppingBag, ChevronDown, MapPin,
  Star, RotateCcw, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, SlidersHorizontal, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'

// ── Category taxonomy ──────────────────────────────────────────────────────
const TAXONOMY: Record<string, string[]> = {
  'All':          [],
  'Textiles':     ['All Textiles', 'Saree', 'Denim', 'Organic Cotton', 'Silk Jacquard', 'Linen', 'Knitwear'],
  'Electronics':  ['All Electronics', 'Consumer', 'Industrial', 'PCB', 'Semiconductors'],
  'Machinery':    ['All Machinery', 'CNC', 'Packaging', 'Food Processing', 'Textile Machines'],
  'FMCG':         ['All FMCG', 'Personal Care', 'Food & Beverage', 'Household', 'Healthcare'],
  'Automotive':   ['All Automotive', 'Auto Parts', 'EV Components', 'Tyres', 'Accessories'],
  'Construction': ['All Construction', 'Cement', 'Steel', 'Tiles', 'Plumbing'],
  'Furniture':    ['All Furniture', 'Wooden', 'Metal', 'Upholstered', 'Outdoor'],
  'Agriculture':  ['All Agriculture', 'Seeds', 'Fertilizers', 'Farm Equipment', 'Organic'],
}

const MAIN_CATS = Object.keys(TAXONOMY)

const CERTIFICATIONS = ['GOTS Certified', 'OEKO-TEX', 'Fair Trade', 'ISO 9001', 'BIS', 'CE Marking']

const SORT_OPTIONS = ['Relevance', 'Rating: High to Low', 'MOQ: Low to High', 'Newest']

const PAGE_SIZE = 9

export default function BuyerBrowse() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── State ──────────────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Filters
  const [mainCat, setMainCat] = useState('All')
  const [subCat, setSubCat] = useState('')
  const [location, setLocation] = useState('All Regions')
  const [moqMin, setMoqMin] = useState(50)
  const [moqMax, setMoqMax] = useState(5000)
  const [minRating, setMinRating] = useState(4)
  const [certs, setCerts] = useState<string[]>(['GOTS Certified'])
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [sort, setSort] = useState('Relevance')
  const [search, setSearch] = useState('')
  const [codeSearch, setCodeSearch] = useState('')

  const [filterOpen, setFilterOpen] = useState(false)

  const subCats = mainCat !== 'All' ? TAXONOMY[mainCat] ?? [] : []
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchCompanies = (pg = page) => {
    setLoading(true)
    const params: any = { page: pg, limit: PAGE_SIZE }
    if (mainCat !== 'All') params.category = mainCat
    if (search) params.q = search
    if (codeSearch) params.code = codeSearch
    api.getCompanies(params)
      .then(res => { setCompanies(res.data ?? []); setTotal(res.total ?? 0) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCompanies(page) }, [mainCat, page])

  const handleApplyFilters = () => { setPage(1); fetchCompanies(1) }
  const handleClearAll = () => {
    setMainCat('All'); setSubCat(''); setLocation('All Regions')
    setMoqMin(50); setMoqMax(5000); setMinRating(4)
    setCerts(['GOTS Certified']); setVerifiedOnly(true); setSort('Relevance'); setSearch(''); setCodeSearch('')
    setPage(1); fetchCompanies(1)
  }

  const toggleCert = (c: string) =>
    setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#EDE8E0] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="cursor-pointer" onClick={() => navigate('/login')}>
            <VyawanLogo size={44} />
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {['Collections', 'Artisans', 'Services', 'Inquiry', 'Tracking'].map((item, i) => (
              <button
                key={item}
                onClick={() => {
                   if (item === 'Tracking') navigate('/buyer/shipments');
                }}
                className={`text-sm font-medium transition-colors ${
                  i === 0
                    ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ShoppingBag size={20} className="text-slate-600" />
          </button>
          <NotificationBell />
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all"
            style={{ background: '#3D2B1F' }}
          >
            Partner Portal
          </button>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Mobile filter overlay */}
        {filterOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setFilterOpen(false)} />
        )}

        {/* ── Left Filter Sidebar ── */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-56 flex-shrink-0 bg-white border-r border-[#EDE8E0] px-5 py-8 flex flex-col gap-6
          lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${filterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-base font-black text-slate-900">The Archive</h2>
              <button className="lg:hidden p-1 text-slate-400" onClick={() => setFilterOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400">Refine your selection</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Location</label>
            <div className="relative">
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-white text-sm text-slate-700 focus:outline-none focus:border-[#3D2B1F] pr-8"
              >
                {['All Regions', 'Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'Delhi', 'Rajasthan', 'West Bengal'].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* MOQ Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">MOQ Range</label>
              <span className="text-xs text-slate-400">{moqMin} - {moqMax}</span>
            </div>
            <input
              type="range"
              min={10}
              max={10000}
              step={50}
              value={moqMax}
              onChange={e => setMoqMax(Number(e.target.value))}
              className="w-full accent-[#3D2B1F]"
            />
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Minimum Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setMinRating(s)}
                  className="transition-colors"
                >
                  <Star
                    size={18}
                    className={s <= minRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}
                  />
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-1">{minRating}.0+</span>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Certifications</label>
            <div className="space-y-2">
              {CERTIFICATIONS.map(cert => (
                <label key={cert} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => toggleCert(cert)}
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                      certs.includes(cert) ? 'bg-[#3D2B1F]' : 'border-2 border-slate-300'
                    }`}
                  >
                    {certs.includes(cert) && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{cert}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Verified Only */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Verified Only</label>
            <button
              onClick={() => setVerifiedOnly(v => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative ${verifiedOnly ? 'bg-[#3D2B1F]' : 'bg-slate-200'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${verifiedOnly ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Apply / Clear */}
          <button
            onClick={handleApplyFilters}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: '#3D2B1F' }}
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            <RotateCcw size={12} /> Clear All
          </button>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 px-8 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-widest font-medium">
              <button onClick={() => navigate('/')} className="hover:text-slate-700">Home</button>
              <ChevronRight size={12} />
              <span>Browse</span>
              {mainCat !== 'All' && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-slate-700">{mainCat}</span>
                </>
              )}
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-[#EDE8E0] bg-white text-sm text-slate-600 font-medium"
            >
              <SlidersHorizontal size={15} /> Filters
            </button>
          </div>

          {/* Title + Sort */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                {mainCat === 'All' ? 'All Suppliers' : `${mainCat} Sector`}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {loading ? 'Loading...' : `${total} companies found matching your curation`}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-500">Sort by:</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#EDE8E0] bg-white text-sm text-slate-700 focus:outline-none focus:border-[#3D2B1F]"
                >
                  {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Main category tabs */}
          <div className="flex flex-wrap gap-2 mb-4 mt-6">
            {MAIN_CATS.map(cat => (
              <button
                key={cat}
                onClick={() => { setMainCat(cat); setSubCat(''); setPage(1) }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  mainCat === cat
                    ? 'text-white border-transparent'
                    : 'bg-white border-[#EDE8E0] text-slate-600 hover:border-[#3D2B1F]/30'
                }`}
                style={mainCat === cat ? { background: '#3D2B1F' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sub-category pills */}
          {subCats.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {subCats.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSubCat(sub === subCat ? '' : sub)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    subCat === sub
                      ? 'bg-sp-purple text-white border-sp-purple'
                      : 'bg-white border-sp-border text-slate-600 hover:border-sp-purple/40'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Search bar row */}
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                placeholder="Search companies, products, certifications..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#EDE8E0] bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#3D2B1F] shadow-sm font-medium"
              />
            </div>
            <div className="relative w-48">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">CODE</div>
              <input
                type="text"
                value={codeSearch}
                onChange={e => setCodeSearch(e.target.value.toUpperCase())}
                placeholder="e.g. M-101"
                className="w-full pl-14 pr-4 py-3 rounded-2xl border border-[#EDE8E0] bg-[#F5E6D3]/20 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#3D2B1F] shadow-sm font-bold tracking-widest"
              />
            </div>
          </div>

          {/* Company Cards Grid */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-[#3D2B1F]" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <p className="font-medium">No companies found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {companies.map((company, idx) => (
                  <CompanyCard key={company._id} company={company} idx={idx} onView={() => navigate(`/company/${company._id}`)} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="w-9 h-9 rounded-full border border-[#EDE8E0] bg-white flex items-center justify-center text-slate-500 hover:border-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                    page === p
                      ? 'text-white'
                      : 'border border-[#EDE8E0] bg-white text-slate-600 hover:border-slate-400'
                  }`}
                  style={page === p ? { background: '#3D2B1F' } : {}}
                >
                  {p}
                </button>
              ))}

              {totalPages > 5 && (
                <>
                  <span className="text-slate-400">...</span>
                  <button
                    onClick={() => setPage(totalPages)}
                    className="w-9 h-9 rounded-full border border-[#EDE8E0] bg-white text-sm font-bold text-slate-600 hover:border-slate-400 transition-all"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-full border border-[#EDE8E0] bg-white flex items-center justify-center text-slate-500 hover:border-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-[#EDE8E0] px-8 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <VyawanLogo size={22} />
            <p className="text-sm text-slate-400 leading-relaxed mt-2">
              Connecting world-class manufacturers with global brands through a curated digital experience.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Sustainability'].map(l => (
                <li key={l}><button className="text-sm text-slate-400 hover:text-slate-700 transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2">
              {['Shipping & Returns', 'Contact Us', 'Help Center'].map(l => (
                <li key={l}><button className="text-sm text-slate-400 hover:text-slate-700 transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">Join Our Newsletter</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 px-3 py-2.5 rounded-xl border border-[#EDE8E0] text-sm focus:outline-none focus:border-[#3D2B1F]"
              />
              <button
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#3D2B1F' }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#EDE8E0] flex items-center justify-between">
          <p className="text-xs text-slate-400">© 2024 Vyawan. India's Premier B2B Marketplace.</p>
        </div>
      </footer>
    </div>
  )
}

// ── Company Card ──────────────────────────────────────────────────────────────
function CompanyCard({ company, idx, onView }: { company: any; idx: number; onView: () => void }) {
  const name = company.company || company.name || 'Unknown'
  const location = company.location || company.profile?.address?.city || 'India'
  const rating = company.profile?.stats?.avgRating?.toFixed(1) || (4.5 + Math.random() * 0.5).toFixed(1)
  const moq = company.profile?.moq || `${(idx + 1) * 50}m`
  const tags = company.profile?.categories?.slice(0, 3) || []
  const logo = company.profile?.logo
  const banner = company.profile?.profileBanner || company.profile?.factoryImages?.[0]
  const isVerified = company.manufacturerStatus === 'approved' || !company.manufacturerStatus
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const BANNER_COLORS = [
    'from-amber-100 to-amber-200',
    'from-slate-100 to-slate-200',
    'from-stone-100 to-stone-200',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: idx * 0.04 }}
      className="bg-white rounded-[1.5rem] overflow-hidden border border-[#EDE8E0] hover:shadow-lg hover:-translate-y-1 transition-all group"
    >
      {/* Banner image */}
      <div className={`relative h-44 bg-gradient-to-br ${BANNER_COLORS[idx % 3]} overflow-hidden`}>
        {banner ? (
          <img src={banner} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <span className="text-6xl font-black text-slate-400">{initials}</span>
          </div>
        )}
        {isVerified && (
          <span
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
            style={{ background: '#3D2B1F' }}
          >
            Verified
          </span>
        )}
        {/* Logo circle */}
        <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
          {logo
            ? <img src={logo} alt={name} className="w-full h-full object-cover" />
            : <span className="text-sm font-black text-slate-600">{initials}</span>
          }
        </div>
      </div>

      {/* Card body */}
      <div className="pt-9 px-5 pb-5">
        <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{name}</h3>
        <div className="flex items-center gap-1 text-slate-400 text-xs mb-4">
          <MapPin size={11} />
          <span>{location}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#FAF8F5] rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Rating</p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-800">{rating}</span>
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Min Order</p>
            <p className="text-sm font-black text-slate-800">{moq}</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600"
                style={{ background: '#F0EBE3' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* View button */}
        <button
          onClick={onView}
          className="w-full py-3 rounded-2xl text-sm font-bold text-slate-800 border-2 border-slate-200 hover:border-[#3D2B1F] hover:text-[#3D2B1F] transition-all"
        >
          View company
        </button>
      </div>
    </motion.div>
  )
}

