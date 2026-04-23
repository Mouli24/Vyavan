import React, { useState, useRef } from 'react'
import {
  X, Plus, Trash2, Check, ChevronLeft, ChevronRight,
  Image as ImageIcon, Eye, Loader2, GripHorizontal, Sparkles, AlertCircle, Upload, Camera
} from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { api, Product } from '@/lib/api'

interface Props {
  open: boolean
  onClose: () => void
  onPublished?: () => void
  editProduct?: Product | null
}

const CATEGORIES = [
  'Textiles', 'Electronics', 'Machinery', 'FMCG', 'Automotive',
  'Construction', 'Chemicals', 'Agriculture', 'Pharmaceuticals',
  'Furniture', 'Leather Goods', 'Plastics', 'Metal Products', 'Paper Products',
]

const PAYMENT_OPTIONS = [
  'Advance Payment', '50-50 Split', 'Net 15', 'Net 30', 'Net 45', 'Letter of Credit',
]

const STEPS = [
  'Basic Details', 'Photos', 'Specifications', 'Pricing', 'Stock', 'Payment Terms', 'Preview & Publish',
]

interface Spec { key: string; value: string }
interface BulkSlab { from: number; to: number | null; price: number }

interface FormState {
  name: string
  category: string
  description: string
  photos: string[]
  specs: Spec[]
  basePrice: number | ''
  moq: number | ''
  bulkSlabs: BulkSlab[]
  sampleEnabled: boolean
  samplePrice: number | ''
  sampleMaxUnits: number
  stock: number | ''
  lowStockAlert: number | ''
  paymentTerms: string[]
  defaultTerm: string
  paymentNotes: string
  photoInput: string
  isAnalyzing: boolean
  enhancedPhotos: Record<string, boolean>
}

const initialForm: FormState = {
  name: '',
  category: '',
  description: '',
  photos: [],
  specs: [{ key: '', value: '' }],
  basePrice: '',
  moq: '',
  bulkSlabs: [{ from: 100, to: 499, price: 0 }],
  sampleEnabled: false,
  samplePrice: '',
  sampleMaxUnits: 1,
  stock: '',
  lowStockAlert: '',
  paymentTerms: [],
  defaultTerm: '',
  paymentNotes: '',
  photoInput: '',
  isAnalyzing: false,
  enhancedPhotos: {},
}

export default function AddProductModal({ open, onClose, onPublished, editProduct }: Props) {
  const isEdit = !!editProduct

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  
  const [listingMode, setListingMode] = useState<'ai' | 'manual' | null>(isEdit ? 'manual' : null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiImages, setAiImages] = useState<{ front: File | null; back: File | null }>({ front: null, back: null })

  React.useEffect(() => {
    if (editProduct && open) {
      setForm({
        ...initialForm,
        name: editProduct.name ?? '',
        category: editProduct.category ?? '',
        description: (editProduct as any).description ?? '',
        photos: editProduct.image ? [editProduct.image] : [],
        basePrice: editProduct.price ?? '',
        moq: editProduct.moq ?? '',
        stock: editProduct.stock ?? '',
      })
      setListingMode('manual')
    } else if (open && !editProduct) {
      setForm(initialForm)
      setListingMode(null)
      setStep(0)
    }
  }, [editProduct, open])

  const handleAiExtract = async () => {
    if (!aiImages.front) return
    setAiLoading(true)
    try {
      const imgs = [aiImages.front]
      if (aiImages.back) imgs.push(aiImages.back)
      
      const res = await api.extractProductDetails(imgs)
      if (res.success) {
        const { analysis, imageUrls } = res
        setForm(f => ({
          ...f,
          name: analysis.name || f.name,
          category: CATEGORIES.includes(analysis.category) ? analysis.category : f.category,
          description: analysis.description || f.description,
          photos: [...imageUrls, ...f.photos],
          basePrice: analysis.pricing_guess || f.basePrice,
          moq: analysis.moq_guess || f.moq,
          specs: analysis.specs ? Object.entries(analysis.specs).map(([key, value]) => ({ key: String(key), value: String(value) })) : f.specs,
          paymentTerms: (analysis.payment_terms_guess && Array.isArray(analysis.payment_terms_guess)) 
            ? analysis.payment_terms_guess.filter(t => PAYMENT_OPTIONS.includes(t)) 
            : f.paymentTerms,
        }))
        setListingMode('manual')
        setStep(0)
      }
    } catch (err: any) {
      console.error(err)
      alert(`AI Extraction failed: ${err.message}. Please try again or fill manually.`)
    } finally {
      setAiLoading(false)
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function canProceed(): boolean {
    if (listingMode === 'ai' && step === 0) return aiImages.front !== null
    if (step === 0) return form.name.trim() !== '' && form.category !== ''
    if (step === 1) return form.photos.length >= 1
    if (step === 3) return form.basePrice !== '' && form.moq !== ''
    if (step === 4) return form.stock !== ''
    if (step === 5) return form.paymentTerms.length > 0
    return true
  }

  function addPhoto() {
    const url = form.photoInput.trim()
    if (!url || form.photos.length >= 12) return
    set('photos', [...form.photos, url])
    set('photoInput', '')
  }

  function removePhoto(idx: number) {
    set('photos', form.photos.filter((_, i) => i !== idx))
  }

  function updateSpec(idx: number, field: 'key' | 'value', val: string) {
    const next = form.specs.map((s, i) => i === idx ? { ...s, [field]: val } : s)
    set('specs', next)
  }

  function addSpec() {
    set('specs', [...form.specs, { key: '', value: '' }])
  }

  function removeSpec(idx: number) {
    set('specs', form.specs.filter((_, i) => i !== idx))
  }

  function updateSlab(idx: number, field: keyof BulkSlab, val: number | null) {
    const next = form.bulkSlabs.map((s, i) => i === idx ? { ...s, [field]: val } : s)
    set('bulkSlabs', next)
  }

  function addSlab() {
    set('bulkSlabs', [...form.bulkSlabs, { from: 0, to: null, price: 0 }])
  }

  function removeSlab(idx: number) {
    set('bulkSlabs', form.bulkSlabs.filter((_, i) => i !== idx))
  }

  function toggleTerm(term: string) {
    const next = form.paymentTerms.includes(term)
      ? form.paymentTerms.filter(t => t !== term)
      : [...form.paymentTerms, term]
    set('paymentTerms', next)
    if (form.defaultTerm === term) set('defaultTerm', '')
  }

  async function handlePublish(draft = false) {
    setPublishing(true)
    try {
      const specsObj = Object.fromEntries(
        form.specs.filter(s => s.key.trim()).map(s => [s.key, s.value])
      )
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.basePrice),
        moq: Number(form.moq),
        stock: Number(form.stock),
        image: form.photos[0] ?? '',
        isActive: !draft,
        description: form.description,
        photos: form.photos,
        specs: specsObj,
        bulkSlabs: form.bulkSlabs,
        sampleEnabled: form.sampleEnabled,
        samplePrice: form.samplePrice !== '' ? Number(form.samplePrice) : undefined,
        sampleMaxUnits: form.sampleMaxUnits,
        lowStockAlert: form.lowStockAlert !== '' ? Number(form.lowStockAlert) : undefined,
        paymentTerms: form.paymentTerms,
        defaultTerm: form.defaultTerm,
        paymentNotes: form.paymentNotes,
      }
      if (isEdit && editProduct) {
        await api.updateProduct(editProduct._id, payload)
      } else {
        await api.createProduct(payload)
      }
      setPublished(true)
      onPublished?.()
    } catch (e) {
      console.error(e)
    } finally {
      setPublishing(false)
    }
  }

  function handleClose() {
    setStep(0)
    setForm(initialForm)
    setPublished(false)
    setListingMode(null)
    setAiImages({ front: null, back: null })
    onClose()
  }

  if (!open) return null

  const reorderPhotos = (p: string[]) => set('photos', p)

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        >
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {listingMode === null ? 'Choose how you want to start' : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
              </p>
            </div>

            {listingMode === null ? (
              <div className="grid grid-cols-2 gap-6 my-12">
                <button
                  onClick={() => setListingMode('ai')}
                  className="flex flex-col items-center gap-6 p-8 rounded-[32px] border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Sparkles size={40} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Magic AI Wizard</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Upload photos. AI will detect details, specs & categories for you.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setListingMode('manual')}
                  className="flex flex-col items-center gap-6 p-8 rounded-[32px] border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#5D4037]/30 hover:shadow-xl transition-all group"
                >
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Plus size={40} className="text-slate-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Manual Entry</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Fill in every detail manually step-by-step with full control.
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
                  {STEPS.map((label, i) => (
                    <div key={i} className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => i < step && setStep(i)}
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                          i === step
                            ? 'bg-[#5D4037] border-[#5D4037] text-white'
                            : i < step
                            ? 'bg-[#5D4037] border-[#5D4037] text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}>
                          {i < step ? <Check size={16} /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap ${
                          i === step ? 'text-[#5D4037]' : i < step ? 'text-[#5D4037]/70' : 'text-slate-400'
                        }`}>{label}</span>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className={`w-6 h-0.5 mb-4 rounded-full transition-colors ${i < step ? 'bg-[#5D4037]' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === 0 && (
                      listingMode === 'ai' ? (
                        <AiExtractionStep 
                          images={aiImages} 
                          setImages={setAiImages} 
                          onExtract={handleAiExtract} 
                          loading={aiLoading} 
                        />
                      ) : (
                        <Step1 form={form} set={set} />
                      )
                    )}
                    {step === 1 && <Step2 form={form} set={set} removePhoto={removePhoto} reorderPhotos={reorderPhotos} />}
                    {step === 2 && <Step3 form={form} updateSpec={updateSpec} addSpec={addSpec} removeSpec={removeSpec} />}
                    {step === 3 && <Step4 form={form} set={set} updateSlab={updateSlab} addSlab={addSlab} removeSlab={removeSlab} />}
                    {step === 4 && <Step5 form={form} set={set} />}
                    {step === 5 && <Step6 form={form} set={set} toggleTerm={toggleTerm} />}
                    {step === 6 && (
                      <Step7
                        form={form}
                        publishing={publishing}
                        published={published}
                        onDraft={() => handlePublish(true)}
                        onPublish={() => handlePublish(false)}
                        set={set}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {listingMode !== null && !published && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (step === 0) setListingMode(null)
                    else setStep(s => s - 1)
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                >
                  <ChevronLeft size={18} /> {step === 0 ? 'Change Mode' : 'Previous'}
                </button>

                {step < STEPS.length - 1 && (listingMode === 'manual' || step > 0) ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-[#5D4037] text-white hover:bg-[#5D4037]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function AiExtractionStep({ images, setImages, onExtract, loading }: any) {
  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (side: 'front' | 'back', file: File | null) => {
    if (file && !file.type.startsWith('image/')) return
    setImages((prev: any) => ({ ...prev, [side]: file }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles size={20} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 mb-1">How it works</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload product photos. AI will analyze details to write a professional B2B listing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div 
          onClick={() => frontInputRef.current?.click()}
          className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden ${
            images.front ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input type="file" ref={frontInputRef} className="hidden" accept="image/*" onChange={e => handleFile('front', e.target.files?.[0] || null)} />
          {images.front ? (
            <img src={URL.createObjectURL(images.front)} className="w-full h-full object-cover" alt="Front" />
          ) : (
            <>
              <Upload size={24} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-700">Front Photo</p>
            </>
          )}
        </div>
        <div 
          onClick={() => backInputRef.current?.click()}
          className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden ${
            images.back ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input type="file" ref={backInputRef} className="hidden" accept="image/*" onChange={e => handleFile('back', e.target.files?.[0] || null)} />
          {images.back ? (
            <img src={URL.createObjectURL(images.back)} className="w-full h-full object-cover" alt="Back" />
          ) : (
            <>
              <Upload size={24} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-700">Back (Optional)</p>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onExtract}
        disabled={!images.front || loading}
        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Sparkles size={18} /> Generate Details</>}
      </button>
    </div>
  )
}

function Step1({ form, set }: { form: FormState; set: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Product Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm resize-none"
        />
      </div>
    </div>
  )
}

function Step2({ form, set, removePhoto, reorderPhotos }: any) {
  const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    const validFiles = files.filter(f => f.type.startsWith('image/')).slice(0, 12 - form.photos.length);
    if (validFiles.length === 0) return;
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) set('photos', [...form.photos, ev.target.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const runAIEnhancer = async (url: string, index: number) => {
    setAnalyzingIndex(index);
    try {
      const res = await api.analyzeProductImage(url);
      setAiReport({ index, url, data: res });
    } catch (err) {
      setAiReport({ index, url, data: { quality_score: "—", product_type: "Manual", errors: ["AI Unavailable"]} });
    } finally {
      setAnalyzingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <input type="file" ref={fileInputRef} onChange={e => e.target.files && processFiles(e.target.files)} multiple accept="image/*" className="hidden" />
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-bold text-slate-700">Product Photos *</label>
        <p className="text-xs text-slate-400">Drag to reorder. First is main.</p>
      </div>

      <Reorder.Group axis="x" values={form.photos} onReorder={reorderPhotos} className="flex flex-wrap gap-3">
        {form.photos.map((url, i) => (
          <Reorder.Item key={url} value={url} className="relative group w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100">
            <img src={url} alt="Photo" className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 flex gap-1">
              <button 
                onClick={() => runAIEnhancer(url, i)}
                className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg"
              >
                {analyzingIndex === i ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              </button>
              <button onClick={() => removePhoto(i)} className="w-6 h-6 rounded-full bg-white text-red-500 flex items-center justify-center shadow-lg"><Trash2 size={12} /></button>
            </div>
            {form.enhancedPhotos[url] && <div className="absolute bottom-1 right-1 bg-purple-500 text-white p-1 rounded-full"><Check size={10} /></div>}
          </Reorder.Item>
        ))}
        {form.photos.length < 12 && (
          <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-50 transition-colors">
            <Plus size={24} />
          </div>
        )}
      </Reorder.Group>

      {aiReport && (
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 relative">
          <button onClick={() => setAiReport(null)} className="absolute top-2 right-2 text-purple-400"><X size={16} /></button>
          <h4 className="font-bold text-purple-900 mb-2">Enhancement Preview</h4>
          <div className="grid grid-cols-2 gap-4">
             <div onClick={() => set('enhancedPhotos', { ...form.enhancedPhotos, [aiReport.url]: false })} className="cursor-pointer">
               <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Original</p>
               <img src={aiReport.url} className={`rounded-xl border-2 ${!form.enhancedPhotos[aiReport.url] ? 'border-purple-500' : 'border-transparent'}`} />
             </div>
             <div onClick={() => set('enhancedPhotos', { ...form.enhancedPhotos, [aiReport.url]: true })} className="cursor-pointer">
               <p className="text-[10px] uppercase font-bold text-purple-600 mb-1">Enhanced</p>
               <img src={aiReport.url} style={{ filter: 'brightness(1.1) contrast(1.15) saturate(1.2)' }} className={`rounded-xl border-2 ${form.enhancedPhotos[aiReport.url] ? 'border-purple-500' : 'border-transparent'}`} />
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Step3({ form, updateSpec, addSpec, removeSpec }: any) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">Specifications</h3>
        <button onClick={addSpec} className="px-3 py-1 rounded-full bg-[#F5E6D3] text-[#5D4037] text-xs font-bold">Add</button>
      </div>
      {form.specs.map((spec, i) => (
        <div key={i} className="flex gap-2">
          <input value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Key" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          <input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          <button onClick={() => removeSpec(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  )
}

function Step4({ form, set, updateSlab, addSlab, removeSlab }: any) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Base Price (₹) *</label>
          <input type="number" value={form.basePrice} onChange={e => set('basePrice', e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">MOQ *</label>
          <input type="number" value={form.moq} onChange={e => set('moq', e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Bulk Pricing</h4>
        {form.bulkSlabs.map((slab, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="number" value={slab.from} onChange={e => updateSlab(i, 'from', Number(e.target.value))} placeholder="From" className="flex-1 px-2 py-1.5 rounded-lg border text-xs" />
            <input type="number" value={slab.to ?? ''} onChange={e => updateSlab(i, 'to', e.target.value === '' ? null : Number(e.target.value))} placeholder="To" className="flex-1 px-2 py-1.5 rounded-lg border text-xs" />
            <input type="number" value={slab.price} onChange={e => updateSlab(i, 'price', Number(e.target.value))} placeholder="Price" className="flex-1 px-2 py-1.5 rounded-lg border text-xs" />
            <button onClick={() => removeSlab(i)}><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={addSlab} className="text-xs font-bold text-blue-600">+ Add Slab</button>
      </div>
    </div>
  )
}

function Step5({ form, set }: any) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Current Stock *</label>
        <input type="number" value={form.stock} onChange={e => set('stock', e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Low Stock Alert Threshold</label>
        <input type="number" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
      </div>
    </div>
  )
}

function Step6({ form, set, toggleTerm }: any) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3">Accepted Terms</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map(t => (
            <button key={t} onClick={() => toggleTerm(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${form.paymentTerms.includes(t) ? 'bg-[#5D4037] text-white border-[#5D4037]' : 'bg-white border-slate-200 text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Default Term</label>
        <select value={form.defaultTerm} onChange={e => set('defaultTerm', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm">
          <option value="">Select default</option>
          {form.paymentTerms.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  )
}

function Step7({ form, publishing, published, onDraft, onPublish }: any) {
  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Check size={48} className="text-green-500 mb-4" />
        <h3 className="text-2xl font-bold">Product Live!</h3>
        <p className="text-slate-500 mb-6">Successfully listed in marketplace.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-xl bg-[#5D4037] text-white font-bold">Dashboard</button>
      </div>
    )
  }

  const mainPhoto = form.photos[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
        <div className="flex gap-4">
          <div className="w-32 h-32 rounded-xl bg-white border border-slate-200 overflow-hidden">
            {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="m-auto" />}
          </div>
          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{form.category || 'NO CATEGORY'}</span>
            <h3 className="text-lg font-bold text-slate-900">{form.name || 'Untitled'}</h3>
            <p className="text-xs text-slate-500 line-clamp-2">{form.description}</p>
            <p className="text-xl font-black mt-2">₹{form.basePrice || '—'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onDraft} disabled={publishing} className="flex-1 py-3 rounded-xl border-2 border-slate-200 font-bold hover:bg-slate-50">Draft</button>
        <button onClick={onPublish} disabled={publishing} className="flex-[2] py-3 rounded-xl bg-[#5D4037] text-white font-bold hover:bg-[#4E342E] flex items-center justify-center gap-2">
          {publishing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Confirm & Publish
        </button>
      </div>
    </div>
  )
}

function Badge({ children, className = '' }: any) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>
}

function Separator({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-slate-200 ${className}`} />
}
