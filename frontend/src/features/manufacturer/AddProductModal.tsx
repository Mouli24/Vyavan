import React, { useState, useRef } from 'react'
import {
  X, Plus, Trash2, Check, ChevronLeft, ChevronRight,
  Image as ImageIcon, ToggleLeft, ToggleRight, Eye, Loader2, GripHorizontal, ArrowLeftRight, Sparkles, AlertCircle, Upload, Camera
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
  photoInput: string
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
}

const initialForm: FormState = {
  name: '',
  category: '',
  description: '',
  photos: [],
  photoInput: '',
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
}

export default function AddProductModal({ open, onClose, onPublished, editProduct }: Props) {
  const isEdit = !!editProduct

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  
  // New AI listing state
  const [listingMode, setListingMode] = useState<'ai' | 'manual' | null>(isEdit ? 'manual' : null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiImages, setAiImages] = useState<{ front: File | null; back: File | null }>({ front: null, back: null })

  // Populate form when editing
  React.useEffect(() => {
    if (editProduct && open) {
      setForm({
        ...initialForm,
        name: editProduct.name ?? '',
        category: editProduct.category ?? '',
        // @ts-ignore
        description: editProduct.description ?? '',
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

  // ── AI Extraction ────────────────────────────────────────────────────────
  const handleAiExtract = async () => {
    if (!aiImages.front) return
    setAiLoading(true)
    try {
      const imgs = [aiImages.front]
      if (aiImages.back) imgs.push(aiImages.back)
      
      const res = await api.extractProductDetails(imgs)
      if (res.success) {
        const { analysis, imageUrls } = res
        // Update form state with AI analysis
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
        setListingMode('manual') // Switch to manual to show the pre-filled fields
        setStep(0) // Start at Step 1 (Basic Details) to review
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

  // ── Step validation ──────────────────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 0) return form.name.trim() !== '' && form.category !== ''
    if (step === 1) return form.photos.length >= 1
    if (step === 3) return form.basePrice !== '' && form.moq !== ''
    if (step === 4) return form.stock !== ''
    if (step === 5) return form.paymentTerms.length > 0
    return true
  }

  // ── Photo helpers ────────────────────────────────────────────────────────
  function addPhoto() {
    const url = form.photoInput.trim()
    if (!url || form.photos.length >= 12) return
    set('photos', [...form.photos, url])
    set('photoInput', '')
  }

  function removePhoto(idx: number) {
    set('photos', form.photos.filter((_, i) => i !== idx))
  }

  // ── Spec helpers ─────────────────────────────────────────────────────────
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

  // ── Bulk slab helpers ────────────────────────────────────────────────────
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

  // ── Payment term helpers ─────────────────────────────────────────────────
  function toggleTerm(term: string) {
    const next = form.paymentTerms.includes(term)
      ? form.paymentTerms.filter(t => t !== term)
      : [...form.paymentTerms, term]
    set('paymentTerms', next)
    if (form.defaultTerm === term) set('defaultTerm', '')
  }

  // ── Publish / Update ─────────────────────────────────────────────────────
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
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {listingMode === null ? 'Choose how you want to start' : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
              </p>
            </div>

            {/* Mode selection or Steps */}
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
                      Upload front & back photos. Our AI will automatically detect details, specs & categories for you.
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
                      The traditional way. Fill in every detail manually step-by-step with full control over the listing.
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <>
                {/* Step indicator */}
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

                {/* Step content */}
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
                    {step === 1 && <Step2 form={form} set={set} addPhoto={addPhoto} removePhoto={removePhoto} reorderPhotos={(p: any) => set('photos', p)} />}
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
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {/* Navigation */}
            {listingMode !== null && !published && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (step === 0 && listingMode !== 'manual') setListingMode(null)
                    else if (step === 0 && isEdit) handleClose()
                    else if (step === 0) setListingMode(null)
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

// ── AI Extraction Step ────────────────────────────────────────────────────────
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
            Upload clear photos of your product's front and back sides. Our AI will analyze the texture, labels, and features to write a professional B2B listing for you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Front side */}
        <div 
          onClick={() => frontInputRef.current?.click()}
          className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden ${
            images.front ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input type="file" ref={frontInputRef} className="hidden" accept="image/*" onChange={e => handleFile('front', e.target.files?.[0] || null)} />
          {images.front ? (
            <>
              <img src={URL.createObjectURL(images.front)} className="w-full h-full object-cover" alt="Front" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={32} className="text-white" />
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Upload size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">Front Side</p>
              <p className="text-[10px] text-slate-400">Click to upload photo</p>
            </>
          )}
        </div>

        {/* Back side */}
        <div 
          onClick={() => backInputRef.current?.click()}
          className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden ${
            images.back ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input type="file" ref={backInputRef} className="hidden" accept="image/*" onChange={e => handleFile('back', e.target.files?.[0] || null)} />
          {images.back ? (
            <>
              <img src={URL.createObjectURL(images.back)} className="w-full h-full object-cover" alt="Back" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={32} className="text-white" />
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Upload size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">Back Side</p>
              <p className="text-[10px] text-slate-400">Optional but recommended</p>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onExtract}
        disabled={!images.front || loading}
        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing Product Magic...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Listing Details
          </>
        )}
      </button>
    </div>
  )
}

// ── Step 1: Basic Details ─────────────────────────────────────────────────────
function Step1({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Product Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Industrial High-Torque Gear"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm appearance-none"
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
          placeholder="Detailed description for buyers"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm resize-none"
        />
      </div>
    </div>
  )
}

// ── Step 2: Photos ────────────────────────────────────────────────────────────
function Step2({
  form, set, addPhoto, removePhoto, reorderPhotos
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  addPhoto: () => void
  removePhoto: (i: number) => void
  reorderPhotos: (p: string[]) => void
}) {
  const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const runAIEnhancer = async (url: string, index: number) => {
    try {
      setAnalyzingIndex(index);
      const res = await api.analyzeProductImage(url, aiInstruction);
      setAiReport({ index, url, data: res });
    } catch (err: any) {
      alert(`AI Enhancement Failed:\n\n${err.message}`);
    } finally {
      setAnalyzingIndex(null);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    const validFiles = files.filter(f => f.type.startsWith('image/')).slice(0, 12 - form.photos.length);
    if (validFiles.length === 0) return;

    let processed = 0;
    const newPhotos: string[] = [];
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) newPhotos.push(ev.target.result as string);
        processed++;
        if (processed === validFiles.length) set('photos', [...form.photos, ...newPhotos]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  function reorder(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= form.photos.length) return
    const next = [...form.photos]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    reorderPhotos(next)
  }

  return (
    <div 
      className={`flex flex-col gap-6 p-2 rounded-3xl transition-all ${isDragging ? 'bg-purple-50 ring-4 ring-purple-200 border border-dashed border-purple-400' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
    >
      <div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={handleFileSelect} 
        />
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Add Photo URL <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={form.photoInput}
            onChange={e => set('photoInput', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPhoto()}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm"
          />
          <button
            onClick={() => runAIEnhancer(form.photoInput, -1)}
            disabled={!form.photoInput.trim() || analyzingIndex === -1}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0"
          >
            {analyzingIndex === -1 ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            AI Enhancer
          </button>
          <button
            onClick={addPhoto}
            disabled={!form.photoInput.trim() || form.photos.length >= 12}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5D4037] text-white text-sm font-bold hover:bg-[#5D4037]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Plus size={16} /> Add Photo
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
          <ArrowLeftRight size={12} /> Drag photos to reorder. First photo is always the main display image.
        </p>
      </div>

      <div className="mb-2">
        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-purple-500" /> Tell the AI what you want to improve <span className="text-xs text-slate-400 font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={aiInstruction}
          onChange={e => setAiInstruction(e.target.value)}
          placeholder="e.g. How can I make this lighting look more professional and luxurious?"
          className="w-full px-4 py-3 rounded-2xl border border-purple-200 bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-800 placeholder:text-purple-300 text-sm transition-all shadow-inner"
        />
      </div>

      {form.photos.length > 0 ? (
        <Reorder.Group 
          axis="x" 
          values={form.photos} 
          onReorder={reorderPhotos} 
          className="flex flex-wrap gap-3"
        >
          {form.photos.map((url, i) => (
            <Reorder.Item 
              key={url} 
              value={url}
              className="relative group w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 cursor-grab active:cursor-grabbing"
            >
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-[#5D4037] text-white py-0.5">
                  Main
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <GripHorizontal size={20} className="text-white" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewPhoto(url); }}
                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-slate-800/80 hover:bg-slate-900 text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Eye size={12} />
              </button>
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); runAIEnhancer(url, i); }}
                disabled={analyzingIndex === i}
                className="absolute bottom-1 right-1 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[9px] font-bold px-2 py-1 shadow-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                {analyzingIndex === i ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                AI
              </button>
            </Reorder.Item>
          ))}
          {form.photos.length < 12 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-36 h-36 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-50 hover:text-slate-500 transition-colors"
            >
              <ImageIcon size={32} />
            </div>
          )}
        </Reorder.Group>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 gap-2 cursor-pointer hover:bg-slate-100 hover:text-slate-500 transition-colors"
        >
          <ImageIcon size={32} />
          <span className="text-xs font-medium">No photos added yet. Click to browse or drop an image here.</span>
        </div>
      )}

      {/* AI Enhancer Report Modal (rest of the component follows...) */}
      <AnimatePresence>
        {aiReport && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 relative overflow-hidden"
          >
            <button 
              onClick={() => setAiReport(null)}
              className="absolute top-4 right-4 text-purple-400 hover:text-purple-600 bg-white rounded-full p-1 shadow-sm transition-all"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                <Sparkles size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">AI Enhancer Report</h3>
            </div>

            {/* Before & After Visuals */}
            <div className="flex gap-6 mb-8">
              <div className="flex-1 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Original Upload</span>
                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={aiReport.url} alt="Before" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider pl-1 flex items-center justify-between">
                  AI Enhanced 
                  <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[9px]">PRO</span>
                </span>
                <div className="aspect-square rounded-2xl overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white border-2 border-purple-300 relative shadow-[0_0_30px_rgba(168,85,247,0.2)] group">
                  <img 
                    src={aiReport.url} 
                    alt="After" 
                    className="w-full h-full object-contain mix-blend-multiply"
                    style={{ filter: 'brightness(1.1) contrast(1.15) saturate(1.2)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3 pointer-events-none">
                     <span className="text-white text-[10px] font-bold">Auto-Color Corrected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 flex flex-col gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-purple-600 mb-1">{aiReport.data.quality_score}<span className="text-lg text-purple-300">/10</span></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quality Score</span>
                </div>
                
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-purple-100">
                  <p className="text-xs font-bold text-slate-700 mb-1">Product Details</p>
                  <p className="text-xs text-slate-500"><strong>Type:</strong> <span className="capitalize">{aiReport.data.product_type}</span></p>
                  <p className="text-xs text-slate-500"><strong>Lighting:</strong> <span className="capitalize">{aiReport.data.lighting_quality}</span></p>
                  <p className="text-xs text-slate-500"><strong>Bg:</strong> <span className="capitalize">{aiReport.data.background_type}</span></p>
                </div>
              </div>

              <div className="col-span-2 flex flex-col gap-3">
                {aiReport.data.issues?.length > 0 && (
                  <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
                    <h4 className="text-xs font-bold text-red-600 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                      <AlertCircle size={14} /> Issues Found
                    </h4>
                    <ul className="text-sm text-red-800 space-y-1 pl-5 list-disc marker:text-red-300">
                      {aiReport.data.issues.map((issue: string, idx: number) => (
                        <li key={idx} className="leading-snug">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReport.data.suggestions?.length > 0 && (
                  <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                    <h4 className="text-xs font-bold text-green-600 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                      <Check size={14} /> Enhancement Suggestions
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1 pl-5 list-disc marker:text-green-300">
                      {aiReport.data.suggestions.map((sug: string, idx: number) => (
                        <li key={idx} className="leading-snug">{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
               <button 
                 onClick={() => setPreviewPhoto(null)} 
                 className="absolute -top-12 right-0 text-white/70 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all"
               >
                 <X size={24} />
               </button>
               <img src={previewPhoto} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Step 3: Specifications ────────────────────────────────────────────────────
function Step3({
  form, updateSpec, addSpec, removeSpec
}: {
  form: FormState
  updateSpec: (i: number, f: 'key' | 'value', v: string) => void
  addSpec: () => void
  removeSpec: (i: number) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-700">Product Specifications</h3>
          <p className="text-xs text-slate-400 mt-0.5">Add key-value pairs describing your product</p>
        </div>
        <button
          onClick={addSpec}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5E6D3] text-[#5D4037] text-xs font-bold hover:bg-[#F5E6D3]/80 transition-colors"
        >
          <Plus size={14} /> Add Specification
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {form.specs.map((spec, i) => (
          <div key={i} className="flex gap-3 items-center">
            <input
              type="text"
              value={spec.key}
              onChange={e => updateSpec(i, 'key', e.target.value)}
              placeholder="e.g. Material"
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm"
            />
            <input
              type="text"
              value={spec.value}
              onChange={e => updateSpec(i, 'value', e.target.value)}
              placeholder="e.g. Cotton"
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm"
            />
            <button
              onClick={() => removeSpec(i)}
              disabled={form.specs.length === 1}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 4: Pricing ───────────────────────────────────────────────────────────
function Step4({
  form, set, updateSlab, addSlab, removeSlab
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  updateSlab: (i: number, f: keyof BulkSlab, v: number | null) => void
  addSlab: () => void
  removeSlab: (i: number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Base Price per Unit <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
            <input
              type="number"
              min={0}
              value={form.basePrice}
              onChange={e => set('basePrice', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            MOQ (Min. Order Qty) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={form.moq}
            onChange={e => set('moq', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 50"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
          />
        </div>
      </div>

      {/* Bulk pricing slabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-700">Bulk Pricing Slabs</h4>
            <p className="text-xs text-slate-400 mt-0.5">Set discounted prices for larger orders</p>
          </div>
          <button
            onClick={addSlab}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5E6D3] text-[#5D4037] text-xs font-bold hover:bg-[#F5E6D3]/80 transition-colors"
          >
            <Plus size={14} /> Add Bulk Slab
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {form.bulkSlabs.map((slab, i) => (
            <div key={i} className="flex gap-3 items-center bg-[#F5E6D3]/20 p-3 rounded-2xl border border-slate-100">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Qty</label>
                <input
                  type="number"
                  min={0}
                  value={slab.from}
                  onChange={e => updateSlab(i, 'from', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Qty (blank = ∞)</label>
                <input
                  type="number"
                  min={0}
                  value={slab.to ?? ''}
                  onChange={e => updateSlab(i, 'to', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="∞"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price / Unit (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={slab.price}
                  onChange={e => updateSlab(i, 'price', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30"
                />
              </div>
              <button
                onClick={() => removeSlab(i)}
                className="mt-5 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Stock ─────────────────────────────────────────────────────────────
function Step5({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Current Stock Level</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={e => set('stock', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 500"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Low Stock Alert at</label>
          <input
            type="number"
            min={0}
            value={form.lowStockAlert}
            onChange={e => set('lowStockAlert', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 50"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
          />
        </div>
      </div>
      
      <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-orange-800 leading-relaxed">
          Setting a low stock alert will notify you when your inventory drops below the threshold, helping you avoid out-of-stock situations.
        </p>
      </div>
    </div>
  )
}

// ── Step 6: Payment Terms ─────────────────────────────────────────────────────
function Step6({ form, set, toggleTerm }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void; toggleTerm: (t: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-4">Accepted Payment Terms</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map(term => (
            <button
              key={term}
              onClick={() => toggleTerm(term)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                form.paymentTerms.includes(term)
                  ? 'bg-[#5D4037] border-[#5D4037] text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {form.paymentTerms.includes(term) && <Check size={14} />}
                {term}
              </div>
            </button>
          ))}
        </div>
      </div>

      {form.paymentTerms.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-sm font-bold text-slate-700 mb-2">Default Payment Term</label>
          <select
            value={form.defaultTerm}
            onChange={e => set('defaultTerm', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
          >
            <option value="">Select default</option>
            {form.paymentTerms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Additional Payment Notes (Optional)</label>
        <textarea
          rows={3}
          value={form.paymentNotes}
          onChange={e => set('paymentNotes', e.target.value)}
          placeholder="e.g. 100% advance for first-time buyers"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm resize-none"
        />
      </div>
    </div>
  )
}

// ── Step 7: Preview & Publish ─────────────────────────────────────────────────
function Step7({
  form, publishing, published, onDraft, onPublish
}: {
  form: FormState
  publishing: boolean
  published: boolean
  onDraft: () => void
  onPublish: () => void
}) {
  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check size={40} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Product Published!</h3>
        <p className="text-slate-500 max-w-sm mb-8">
          Your product is now live on the marketplace and available for buyers to discover.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
        <div className="flex gap-6">
          <div className="w-40 h-40 rounded-2xl bg-white border border-slate-200 overflow-hidden flex-shrink-0">
            {form.photos[0] ? (
              <img src={form.photos[0]} className="w-full h-full object-cover" alt="Main" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ImageIcon size={40} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Badge variant="outline" className="mb-2 bg-[#F5E6D3] text-[#5D4037] border-none font-bold uppercase tracking-widest text-[9px] px-3 py-1">
              {form.category || 'NO CATEGORY'}
            </Badge>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{form.name || 'Untitled Product'}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{form.description || 'No description provided.'}</p>
            
            <div className="flex items-end gap-1">
               <span className="text-2xl font-black text-slate-900">₹{form.basePrice || '0.00'}</span>
               <span className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">/ unit</span>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-slate-200/50" />

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">MOQ</p>
            <p className="text-sm font-bold text-slate-800">{form.moq || 'None'} Units</p>
          </div>
          <div className="bg-white/50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current Stock</p>
            <p className="text-sm font-bold text-slate-800">{form.stock || '0'} Units</p>
          </div>
          <div className="bg-white/50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Terms</p>
            <p className="text-sm font-bold text-slate-800">{form.defaultTerm || 'Standard'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onDraft}
          disabled={publishing}
          className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex-[2] py-4 px-6 rounded-2xl bg-[#5D4037] text-white font-bold text-sm hover:bg-[#4E342E] shadow-lg shadow-[#5D4037]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {publishing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Confirm & Publish Product
        </button>
      </div>
    </div>
  )
}

// ── Reused Components ─────────────────────────────────────────────────────────
function Badge({ children, variant = 'default', className = '' }: any) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>
}
function Separator({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-slate-200 ${className}`} />
}
