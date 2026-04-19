import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search, Star, MapPin, ChevronRight, Factory, Shield, Zap,
  TrendingUp, Package, Users, CheckCircle, ArrowRight, Globe,
  Headphones, Award, BarChart2, ShoppingBag, MessageCircle, Sparkles,
} from "lucide-react"
import { motion, useInView, useScroll, useTransform } from "motion/react"
import Masonry from "@/components/Masonry"

// ── Data ──────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { name: "Textiles",        icon: "🧵", bg: "#FFF3E8", border: "#FDDCB8", count: "320+ suppliers", desc: "Saree, Denim, Knits, Technical Fabrics" },
  { name: "Electronics",     icon: "⚡", bg: "#EFF6FF", border: "#BFDBFE", count: "180+ suppliers", desc: "Consumer, Industrial, PCB, Semiconductors" },
  { name: "Machinery",       icon: "⚙️", bg: "#F0FDF4", border: "#BBF7D0", count: "240+ suppliers", desc: "CNC, Packaging, Food Processing" },
  { name: "FMCG",            icon: "🛒", bg: "#FFF7ED", border: "#FED7AA", count: "150+ suppliers", desc: "Personal Care, Food & Beverage, Household" },
  { name: "Automotive",      icon: "🚗", bg: "#FDF4FF", border: "#E9D5FF", count: "90+ suppliers",  desc: "Auto Parts, EV Components, Tyres" },
  { name: "Construction",    icon: "🏗️", bg: "#FFFBEB", border: "#FDE68A", count: "110+ suppliers", desc: "Cement, Steel, Tiles, Plumbing" },
  { name: "Chemicals",       icon: "🧪", bg: "#F0FDFA", border: "#99F6E4", count: "75+ suppliers",  desc: "Industrial, Agrochemicals, Specialty" },
  { name: "Agriculture",     icon: "🌾", bg: "#F7FEE7", border: "#BEF264", count: "130+ suppliers", desc: "Seeds, Fertilizers, Farm Equipment" },
  { name: "Pharmaceuticals", icon: "💊", bg: "#FFF1F2", border: "#FECDD3", count: "60+ suppliers",  desc: "Formulations, APIs, Medical Devices" },
  { name: "Home & Furniture",icon: "🛋️", bg: "#F5F3FF", border: "#DDD6FE", count: "95+ suppliers",  desc: "Wooden, Metal, Upholstered, Outdoor" },
]

const MASONRY_ITEMS = [
  { id:"m1",  img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=900&fit=crop",  height:480, label:"Sharma Textiles",      sublabel:"Mumbai · Textiles" },
  { id:"m2",  img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=600&fit=crop", height:320, label:"Delhi Electronics",    sublabel:"Delhi · Electronics" },
  { id:"m3",  img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=800&fit=crop", height:420, label:"Pune Machinery",       sublabel:"Pune · Machinery" },
  { id:"m4",  img:"https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=700&fit=crop",    height:360, label:"Gujarat FMCG",         sublabel:"Surat · FMCG" },
  { id:"m5",  img:"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=900&fit=crop", height:460, label:"Chennai Auto Parts",   sublabel:"Chennai · Automotive" },
  { id:"m6",  img:"https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600&h=600&fit=crop", height:300, label:"Rajasthan Woodcraft",  sublabel:"Jaipur · Furniture" },
  { id:"m7",  img:"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=750&fit=crop", height:380, label:"Mumbai Chemicals",     sublabel:"Mumbai · Chemicals" },
  { id:"m8",  img:"https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=850&fit=crop", height:440, label:"Punjab Agriculture",   sublabel:"Ludhiana · Agriculture" },
  { id:"m9",  img:"https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=700&fit=crop", height:360, label:"Hyderabad Pharma",     sublabel:"Hyderabad · Pharma" },
  { id:"m10", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=800&fit=crop",    height:400, label:"Bangalore Furniture",  sublabel:"Bangalore · Furniture" },
  { id:"m11", img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop", height:300, label:"Surat Textiles",       sublabel:"Surat · Textiles" },
  { id:"m12", img:"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=900&fit=crop",    height:460, label:"Coimbatore Machinery", sublabel:"Coimbatore · Machinery" },
]

const FEATURED_COMPANIES = [
  { name:"Sharma Textiles",    location:"Mumbai, India",   category:"Textiles",    rating:4.8, moq:"200 pcs",   verified:true,  initials:"ST", bg:"#FFF3E8", tc:"#C2410C" },
  { name:"Pune Ceramics",      location:"Pune, India",     category:"Home Décor",  rating:4.6, moq:"50 pcs",    verified:true,  initials:"PC", bg:"#EFF6FF", tc:"#1D4ED8" },
  { name:"Delhi Electronics",  location:"Delhi, India",    category:"Electronics", rating:4.9, moq:"100 units", verified:true,  initials:"DE", bg:"#F0FDF4", tc:"#15803D" },
  { name:"Rajasthan Woodcraft",location:"Jaipur, India",   category:"Furniture",   rating:4.7, moq:"10 pcs",    verified:false, initials:"RW", bg:"#FDF4FF", tc:"#7E22CE" },
  { name:"Gujarat Chemicals",  location:"Surat, India",    category:"Chemicals",   rating:4.5, moq:"500 kg",    verified:true,  initials:"GC", bg:"#F0FDFA", tc:"#0F766E" },
  { name:"Chennai Auto Parts", location:"Chennai, India",  category:"Automotive",  rating:4.8, moq:"200 units", verified:true,  initials:"CA", bg:"#FFFBEB", tc:"#B45309" },
]

const STATS = [
  { label:"Verified Manufacturers", value:"1,250+", icon:Factory,       bg:"#F5F3FF", color:"#7C3AED" },
  { label:"Orders Placed",          value:"12,000+",icon:Package,       bg:"#ECFDF5", color:"#059669" },
  { label:"Active Negotiations",    value:"400+",   icon:MessageCircle, bg:"#FFF7ED", color:"#D97706" },
  { label:"Trusted Buyers",         value:"3,500+", icon:Users,         bg:"#EFF6FF", color:"#2563EB" },
]

const TESTIMONIALS = [
  { name:"Priya Sharma",  company:"TechRetail India",  role:"Procurement Head",    text:"The negotiation module saved us 23% on bulk orders. The verified manufacturer badge gives us complete confidence.", rating:5, avatar:"PS", bg:"#F5F3FF", tc:"#7C3AED" },
  { name:"James Nordic",  company:"EuroTrade GmbH",    role:"Operations Director", text:"Found 3 reliable manufacturers within a week. The structured RFQ process is far better than endless WhatsApp chats.", rating:5, avatar:"JN", bg:"#EFF6FF", tc:"#2563EB" },
  { name:"Sarah Chen",    company:"Pacific Imports",   role:"CEO",                 text:"Real-time order tracking and complaint resolution makes this platform indispensable for our business.", rating:5, avatar:"SC", bg:"#ECFDF5", tc:"#059669" },
]

// ── Animation helpers ─────────────────────────────────────────────────────────
function FadeIn({ children, delay=0, direction="up", className="" }: {
  children: React.ReactNode; delay?: number; direction?: "up"|"left"|"right"|"none"; className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y: direction==="up"?32:0, x: direction==="left"?-32:direction==="right"?32:0 }}
      animate={inView ? { opacity:1, y:0, x:0 } : {}}
      transition={{ duration:0.6, delay, ease:[0.22,1,0.36,1] }}
      className={className}>
      {children}
    </motion.div>
  )
}

function StaggerGrid({ children, className="" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div ref={ref} className={className}
      variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.07 } } }}
      initial="hidden" animate={inView ? "visible" : "hidden"}>
      {children}
    </motion.div>
  )
}

function StaggerItem({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className}
      variants={{ hidden:{ opacity:0, y:24 }, visible:{ opacity:1, y:0, transition:{ duration:0.5, ease:[0.22,1,0.36,1] } } }}>
      {children}
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeIndustry, setActiveIndustry] = useState<string|null>(null)
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start","end start"] })
  const heroY = useTransform(scrollYProgress, [0,1], ["0%","25%"])
  const heroOpacity = useTransform(scrollYProgress, [0,0.7], [1,0])

  const handleIndustryClick = (name: string) => {
    setActiveIndustry(name)
    setTimeout(() => navigate("/login"), 280)
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 rounded-lg gradient-card-purple flex items-center justify-center">
                <Factory className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-sp-purple">B2BHarat</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {["Collections","Artisans","Services","Inquiry","Tracking"].map(item => (
                <button key={item} onClick={() => navigate("/login")}
                  className="px-4 py-2 text-sm font-medium text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all">
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={e => { e.preventDefault(); navigate("/login") }} className="hidden lg:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search manufacturers..."
                  className="pl-10 pr-4 py-2 bg-sp-bg border border-sp-border rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-sp-purple/20 focus:border-sp-purple transition-all" />
              </div>
            </form>
            <button onClick={() => navigate("/login")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sp-muted hover:text-sp-purple border border-sp-border hover:border-sp-purple rounded-xl transition-all">
              Sign In
            </button>
            <button onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white gradient-card-purple rounded-xl hover:opacity-90 transition-all shadow-sm">
              Partner Portal
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden"
        style={{ background:"linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 30%,#FFF3E8 65%,#ECFDF5 100%)", minHeight:"92vh", display:"flex", alignItems:"center" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sp-purple/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sp-success/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sp-purple-pale border border-sp-purple/20 rounded-full text-sm font-medium text-sp-purple mb-6">
                  <Sparkles className="w-3.5 h-3.5" /> India&apos;s Premier B2B Marketplace
                </div>
              </motion.div>
              <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.65, delay:0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-sp-text leading-[1.08] tracking-tight mb-6">
                Source Smarter.<br /><span className="text-sp-purple">Buy Direct.</span>
              </motion.h1>
              <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
                className="text-lg text-sp-muted max-w-lg mb-10 leading-relaxed">
                Connect with 1,250+ verified Indian manufacturers. Negotiate pricing, place bulk orders, and track everything — all in one platform.
              </motion.p>
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <button onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 px-8 py-4 gradient-card-purple text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-purple text-sm">
                  Start Sourcing <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-sp-text font-bold rounded-2xl border border-sp-border hover:border-sp-purple hover:text-sp-purple transition-all text-sm shadow-card">
                  <Factory className="w-4 h-4" /> List Your Business
                </button>
              </motion.div>
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
                className="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                {["GST Verified","Secure Payments","Real-time Tracking"].map(b => (
                  <div key={b} className="flex items-center gap-2 text-sm text-sp-muted">
                    <CheckCircle className="w-4 h-4 text-sp-success" /> {b}
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.7, delay:0.2 }}
              className="flex-shrink-0 relative">
              <div className="w-80 h-80 lg:w-96 lg:h-96 bg-white rounded-3xl shadow-card p-6 relative">
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-card p-3 flex items-center gap-2 border border-sp-border">
                  <div className="w-8 h-8 gradient-card-green rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sp-text">Order Confirmed</p>
                    <p className="text-[10px] text-sp-muted">₹2,40,000</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-card p-3 flex items-center gap-2 border border-sp-border">
                  <div className="w-8 h-8 gradient-card-orange rounded-lg flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sp-text">Negotiations</p>
                    <p className="text-[10px] text-sp-muted">23 active</p>
                  </div>
                </div>
                <div className="w-full h-full gradient-hero rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 gradient-card-purple rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-purple">
                      <ShoppingBag className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm font-bold text-sp-text">B2B Marketplace</p>
                    <p className="text-xs text-sp-muted mt-1">Factory → Business</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-sp-muted font-medium">Scroll to explore</span>
          <motion.div animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:1.5 }}
            className="w-5 h-8 border-2 border-sp-muted/30 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-sp-muted/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="bg-white border-y border-sp-border py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map(stat => (
              <StaggerItem key={stat.label}>
                <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: stat.bg }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: stat.color + "20", color: stat.color }}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-sp-text">{stat.value}</p>
                    <p className="text-xs text-sp-muted font-medium">{stat.label}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* INDUSTRY CATALOG */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background:"#FAFAF9" }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sp-purple-pale border border-sp-purple/20 rounded-full text-sm font-medium text-sp-purple mb-4">
              <Globe className="w-3.5 h-3.5" /> Browse by Industry
            </div>
            <h2 className="text-4xl font-extrabold text-sp-text tracking-tight mb-3">Explore Every Sector</h2>
            <p className="text-sp-muted max-w-xl mx-auto">Click any industry to discover verified manufacturers. Sign in to browse, negotiate, and place orders.</p>
          </FadeIn>
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {INDUSTRIES.map(ind => (
              <StaggerItem key={ind.name}>
                <motion.button
                  onClick={() => handleIndustryClick(ind.name)}
                  whileHover={{ y:-4, scale:1.02 }}
                  whileTap={{ scale:0.97 }}
                  animate={activeIndustry === ind.name ? { scale:0.95, opacity:0.7 } : {}}
                  className="w-full text-left p-5 rounded-2xl border-2 transition-all group"
                  style={{ background: ind.bg, borderColor: ind.border }}>
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{ind.icon}</div>
                  <h3 className="font-bold text-sm text-sp-text mb-1">{ind.name}</h3>
                  <p className="text-[10px] text-sp-muted leading-relaxed mb-2">{ind.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-sp-purple bg-white/70 px-2 py-0.5 rounded-full">{ind.count}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-sp-muted group-hover:text-sp-purple group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerGrid>
          <FadeIn delay={0.3} className="text-center mt-10">
            <button onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 px-6 py-3 gradient-card-purple text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm text-sm">
              View All Industries <ArrowRight className="w-4 h-4" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* MASONRY GALLERY */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-sp-text tracking-tight mb-3">Manufacturers Across India</h2>
            <p className="text-sp-muted max-w-xl mx-auto">A glimpse into the factories and workshops powering Indian industry</p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <Masonry
              items={MASONRY_ITEMS}
              animateFrom="bottom"
              stagger={0.04}
              duration={0.6}
              ease="power3.out"
              scaleOnHover
              hoverScale={0.97}
              blurToFocus
              colorShiftOnHover={false}
              gap={14}
              onItemClick={() => navigate("/login")}
            />
          </FadeIn>
        </div>
      </section>

      {/* FEATURED COMPANIES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background:"#FAFAF9" }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-sp-text tracking-tight mb-2">Featured Suppliers</h2>
              <p className="text-sp-muted">Handpicked verified manufacturers across India</p>
            </div>
            <button onClick={() => navigate("/login")}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-sp-purple hover:underline">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </FadeIn>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED_COMPANIES.map(co => (
              <StaggerItem key={co.name}>
                <motion.div whileHover={{ y:-3 }}
                  className="bg-white rounded-2xl border border-sp-border shadow-card overflow-hidden cursor-pointer group"
                  onClick={() => navigate("/login")}>
                  <div className="h-28 relative flex items-center justify-center" style={{ background: co.bg }}>
                    <span className="text-5xl font-black opacity-20" style={{ color: co.tc }}>{co.initials}</span>
                    {co.verified && (
                      <span className="absolute top-3 right-3 bg-white/90 text-sp-success text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                    <div className="absolute -bottom-5 left-5 w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-black"
                      style={{ background: co.bg, color: co.tc }}>
                      {co.initials}
                    </div>
                  </div>
                  <div className="pt-8 px-5 pb-5">
                    <h3 className="font-bold text-sp-text text-base mb-1">{co.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-sp-muted mb-3">
                      <MapPin className="w-3 h-3" /> {co.location}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-sp-bg rounded-xl p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-sp-muted font-semibold mb-1">Rating</p>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-sp-text">{co.rating}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                      <div className="bg-sp-bg rounded-xl p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-sp-muted font-semibold mb-1">Min Order</p>
                        <p className="text-sm font-bold text-sp-text">{co.moq}</p>
                      </div>
                    </div>
                    <button className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-sp-border text-sp-text hover:border-sp-purple hover:text-sp-purple transition-all">
                      View Company
                    </button>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-hero">
        <div className="max-w-7xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl font-extrabold text-sp-text tracking-tight mb-3">How It Works</h2>
            <p className="text-sp-muted mb-14 max-w-xl mx-auto">From discovery to delivery in 4 simple steps</p>
          </FadeIn>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step:"01", icon:Search,        title:"Discover",  desc:"Browse verified manufacturers by industry, location, or keyword." },
              { step:"02", icon:MessageCircle, title:"Negotiate", desc:"Structured rounds — no WhatsApp chaos. Up to 5 rounds, 48h per round." },
              { step:"03", icon:Package,       title:"Order",     desc:"Place bulk orders with MOQ enforcement and automatic pricing slabs." },
              { step:"04", icon:TrendingUp,    title:"Track",     desc:"Real-time shipment tracking with courier integration and invoices." },
            ].map(s => (
              <StaggerItem key={s.step}>
                <div className="bg-white rounded-2xl p-6 shadow-card border border-sp-border text-left h-full">
                  <div className="text-4xl font-black text-sp-border mb-4">{s.step}</div>
                  <div className="w-10 h-10 gradient-card-purple rounded-xl flex items-center justify-center mb-4">
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sp-text mb-2">{s.title}</h3>
                  <p className="text-sm text-sp-muted leading-relaxed">{s.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <h2 className="text-3xl font-extrabold text-sp-text tracking-tight mb-4">
                Everything you need for<br /><span className="text-sp-purple">successful B2B procurement</span>
              </h2>
              <p className="text-sp-muted mb-8 leading-relaxed">From manufacturer verification to complaint resolution — a complete ecosystem for factory-to-business trade.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon:Shield,        title:"Verified Manufacturers",  desc:"GST, PAN, MSME verification with admin review" },
                  { icon:MessageCircle, title:"Structured Negotiation",  desc:"5 rounds with 48h expiry, counter-offer support" },
                  { icon:BarChart2,     title:"Analytics Dashboard",     desc:"Revenue, order stats, top products insights" },
                  { icon:Headphones,    title:"24/7 Complaint System",   desc:"Raise, respond, escalate disputes with evidence" },
                  { icon:Globe,         title:"Schedule Calls",          desc:"Book slots with manufacturer availability" },
                  { icon:Award,         title:"Admin Controls",          desc:"Platform-level approval, verification, dispute resolution" },
                ].map(f => (
                  <div key={f.title} className="flex gap-3 p-4 bg-sp-bg rounded-xl border border-sp-border">
                    <div className="w-8 h-8 bg-sp-purple-pale text-sp-purple rounded-lg flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-sp-text">{f.title}</h4>
                      <p className="text-xs text-sp-muted mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn direction="right">
              <div className="grid grid-cols-2 gap-4">
                <div className="gradient-card-purple rounded-2xl p-6 text-white">
                  <Users className="w-8 h-8 mb-4 opacity-80" />
                  <p className="text-3xl font-black">1,250+</p>
                  <p className="text-sm opacity-80 mt-1">Active Manufacturers</p>
                </div>
                <div className="bg-sp-mint rounded-2xl p-6">
                  <TrendingUp className="w-8 h-8 text-sp-success mb-4" />
                  <p className="text-3xl font-black text-sp-text">98%</p>
                  <p className="text-sm text-sp-muted mt-1">Order Fulfillment</p>
                </div>
                <div className="bg-sp-peach rounded-2xl p-6">
                  <Package className="w-8 h-8 text-amber-600 mb-4" />
                  <p className="text-3xl font-black text-sp-text">12K+</p>
                  <p className="text-sm text-sp-muted mt-1">Orders Placed</p>
                </div>
                <div className="gradient-card-blue rounded-2xl p-6 text-white">
                  <Shield className="w-8 h-8 mb-4 opacity-80" />
                  <p className="text-3xl font-black">100%</p>
                  <p className="text-sm opacity-80 mt-1">Secure Transactions</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sp-bg">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-sp-text tracking-tight mb-3">What our buyers say</h2>
            <p className="text-sp-muted">Join thousands of businesses sourcing smarter</p>
          </FadeIn>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <StaggerItem key={t.name}>
                <div className="bg-white rounded-2xl p-6 border border-sp-border shadow-card h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.rating)].map((_,i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-sp-text text-sm leading-relaxed mb-6 flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: t.bg, color: t.tc }}>{t.avatar}</div>
                    <div>
                      <p className="font-semibold text-sm text-sp-text">{t.name}</p>
                      <p className="text-xs text-sp-muted">{t.role}, {t.company}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-card-purple text-white">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Ready to transform your procurement?</h2>
            <p className="text-white/80 mb-8 text-lg">Join 1,250+ manufacturers and thousands of buyers on India&apos;s leading B2B marketplace.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => navigate("/login")}
                className="px-8 py-4 bg-white text-sp-purple font-bold rounded-2xl hover:bg-white/90 transition-all shadow-lg text-sm">
                Get Started Free
              </motion.button>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => navigate("/login")}
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-sm">
                Schedule a Demo
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-sp-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-card-purple flex items-center justify-center">
                  <Factory className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-sp-purple">B2BHarat</span>
              </div>
              <p className="text-sm text-sp-muted leading-relaxed max-w-xs">India&apos;s premier factory-to-business marketplace. Connecting verified manufacturers with global buyers.</p>
              <div className="flex flex-wrap items-center gap-2 mt-6">
                {["GST Verified","MSME Partner","Secure Pay"].map(b => (
                  <span key={b} className="text-[10px] font-medium text-sp-muted bg-sp-bg border border-sp-border px-2 py-1 rounded-full">{b}</span>
                ))}
              </div>
            </div>
            {[
              { title:"Platform",           links:["Catalog","Trending","Negotiations","Analytics"] },
              { title:"For Buyers",         links:["Browse Suppliers","Place Orders","Track Shipments","File Complaints"] },
              { title:"For Manufacturers",  links:["List Products","Manage Orders","Payment Reports","Onboarding Guide"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sp-text text-sm mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}>
                      <button onClick={() => navigate("/login")} className="text-sm text-sp-muted hover:text-sp-purple transition-colors">{link}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-sp-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-sp-muted">© 2024 B2BHarat. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {["Privacy Policy","Terms of Service","Contact Us"].map(l => (
                <button key={l} onClick={() => navigate("/login")} className="text-xs text-sp-muted hover:text-sp-purple transition-colors">{l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
