import React, { useState } from 'react'
import {
  X, Plus, Trash2, Check, ChevronLeft, ChevronRight,
  Image as ImageIcon, ToggleLeft, ToggleRight, Eye, Loader2, GripHorizontal, Sparkles, AlertCircle
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
  'AI Smart Lister', 'Basic Details', 'Photos', 'Specifications', 'Pricing', 'Stock', 'Payment Terms', 'Preview & Publish',
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
  // AI fields
  frontPhotoFile?: File
  backPhotoFile?: File
  isAnalyzing: boolean
  // Enhanced photos tracking: {[url]: boolean}
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
  isAnalyzing: false,
  enhancedPhotos: {},
}

export default function AddProductModal({ open, onClose, onPublished, editProduct }: Props) {
  const isEdit = !!editProduct

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  // Populate form when editing
  useState(() => {
    if (editProduct) {
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
    } else {
      setForm(initialForm)
    }
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Step validation ──────────────────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 0) return true // Analysis is optional but recommended
    if (step === 1) return form.name.trim() !== '' && form.category !== ''
    if (step === 2) return form.photos.length >= 1
    if (step === 4) return form.basePrice !== '' && form.moq !== ''
    if (step === 5) return form.stock !== ''
    if (step === 6) return form.paymentTerms.length > 0
    return true
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
        // @ts-ignore
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
              <p className="text-sm text-slate-400 mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
            </div>

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
                  <Step0 
                    form={form} 
                    set={set} 
                    onSkip={() => setStep(1)}
                    onAnalyze={async () => {
                      set('isAnalyzing', true)
                      try {
                        const res = await api.smartListerAnalyze(form.frontPhotoFile, form.backPhotoFile)
                        const cloudUrls = []
                        if (res.cloudinaryUrls.front) cloudUrls.push(res.cloudinaryUrls.front)
                        if (res.cloudinaryUrls.back) cloudUrls.push(res.cloudinaryUrls.back)
                        
                        setForm(f => ({
                          ...f,
                          name: res.analysis.name,
                          category: res.analysis.category,
                          description: res.analysis.description,
                          photos: [...f.photos, ...cloudUrls],
                          specs: Object.entries(res.analysis.specs).map(([key, value]) => ({ key, value })),
                          basePrice: res.analysis.suggestedPrice || f.basePrice,
                          moq: res.analysis.suggestedMoq || f.moq,
                          isAnalyzing: false
                        }))
                        setStep(1) // Advance to review
                      } catch (err: any) {
                        alert('Magic Analysis Failed: ' + (err.message || 'Unknown error') + '. \n\nStarting manual entry...');
                        set('isAnalyzing', false)
                        setStep(1) // Fallback to manual entry
                      }
                    }}
                  />
                )}
                {step === 1 && <Step1 form={form} set={set} />}
                {step === 2 && <Step2 form={form} set={set} removePhoto={(idx) => set('photos', form.photos.filter((_, i) => i !== idx))} reorderPhotos={(p) => set('photos', p)} />}
                {step === 3 && <Step3 form={form} updateSpec={updateSpec} addSpec={addSpec} removeSpec={removeSpec} />}
                {step === 4 && <Step4 form={form} set={set} updateSlab={updateSlab} addSlab={addSlab} removeSlab={removeSlab} />}
                {step === 5 && <Step5 form={form} set={set} />}
                {step === 6 && <Step6 form={form} set={set} toggleTerm={toggleTerm} />}
                {step === 7 && (
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

            {/* Navigation */}
            {!published && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} /> Previous
                </button>

                {step < STEPS.length - 1 ? (
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
  form, set, removePhoto, reorderPhotos
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
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
      setAiReport({ index, url, data: res, isManual: false });
    } catch (err: any) {
      console.error("AI Enhancement Failed, switching to manual fallback:", err);
      // Fallback: Show a manual comparison report
      setAiReport({ 
        index, 
        url, 
        isManual: true,
        data: { 
          quality_score: "—", 
          product_type: "Manual Adjustment",
          lighting_quality: "Standard",
          background_type: "Preserved",
          issues: ["AI analysis unavailable. You can still apply a manual visual fix."],
          suggestions: ["Click 'AI Enhanced' to apply instant brightness/contrast/saturate filters."]
        } 
      });
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

  return (
    <div 
      className={`relative flex flex-col gap-6 p-2 rounded-3xl transition-all ${isDragging ? 'bg-purple-50 ring-4 ring-purple-200 border border-dashed border-purple-400' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        multiple 
        accept="image/*" 
        className="hidden" 
      />
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-bold text-slate-700">
          Product Photos <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-slate-400">
          Upload at least 1 photo. Drag photos to reorder. First photo is the main display.
        </p>
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
                onClick={(e) => { e.stopPropagation(); runAIEnhancer(url, i); }}
                disabled={analyzingIndex === i}
                className="absolute top-1 left-8 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                {analyzingIndex === i ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              </button>
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 size={12} />
              </button>
              {form.enhancedPhotos[url] && (
                <div className="absolute bottom-1 right-1 bg-purple-500 text-white p-1 rounded-full shadow-lg">
                  <Sparkles size={10} />
                </div>
              )}
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

      {/* AI Enhancer Report Modal */}
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
              <h3 className="font-bold text-slate-800 text-lg">
                {aiReport.isManual ? 'Manual Visual Adjustment' : 'AI Enhancer Report'}
              </h3>
            </div>

            {aiReport.isManual && (
              <div className="mb-4 bg-amber-50 text-amber-700 p-3 rounded-2xl text-[11px] font-bold flex items-center gap-2 border border-amber-100 italic">
                <AlertCircle size={14} /> AI Analysis is currently unavailable. Using manual visual presets.
              </div>
            )}

            {/* Before & After Visuals with Comparison Selection */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div 
                onClick={() => set('enhancedPhotos', { ...form.enhancedPhotos, [aiReport.url]: false })}
                className={`flex flex-col gap-2 cursor-pointer group/card transition-all ${!form.enhancedPhotos[aiReport.url] ? 'scale-[1.02]' : 'opacity-60 grayscale-[0.5]'}`}
              >
                <div className="flex items-center justify-between pl-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Original Upload</span>
                  {!form.enhancedPhotos[aiReport.url] && <div className="w-5 h-5 rounded-full bg-[#5D4037] text-white flex items-center justify-center"><Check size={12} /></div>}
                </div>
                <div className={`aspect-square rounded-2xl overflow-hidden bg-slate-100 border-2 transition-all ${!form.enhancedPhotos[aiReport.url] ? 'border-[#5D4037] shadow-lg' : 'border-slate-200'}`}>
                  <img src={aiReport.url} alt="Before" className="w-full h-full object-contain" />
                </div>
              </div>

              <div 
                onClick={() => set('enhancedPhotos', { ...form.enhancedPhotos, [aiReport.url]: true })}
                className={`flex flex-col gap-2 cursor-pointer group/card transition-all ${form.enhancedPhotos[aiReport.url] ? 'scale-[1.02]' : 'opacity-60 grayscale-[0.5]'}`}
              >
                <div className="flex items-center justify-between pl-1">
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                    AI Enhanced <Sparkles size={10} />
                  </span>
                  {form.enhancedPhotos[aiReport.url] && <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center"><Check size={12} /></div>}
                </div>
                <div className={`aspect-square rounded-2xl overflow-hidden bg-white border-2 transition-all relative shadow-sm ${form.enhancedPhotos[aiReport.url] ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'border-slate-200'}`}>
                  <img 
                    src={aiReport.url} 
                    alt="After" 
                    className="w-full h-full object-contain"
                    style={{ filter: 'brightness(1.1) contrast(1.15) saturate(1.2)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex items-end justify-center p-3 pointer-events-none">
                     <span className="text-white text-[10px] font-bold">Recommended Enhancement</span>
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

      {/* Lightbox Preview Modal */}
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

      {/* Sample toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5E6D3]/30 border border-slate-100">
        <div>
          <p className="text-sm font-bold text-slate-700">Offer Sample</p>
          <p className="text-xs text-slate-400 mt-0.5">Allow buyers to order a sample before bulk purchase</p>
        </div>
        <button
          onClick={() => set('sampleEnabled', !form.sampleEnabled)}
          className="text-[#5D4037] transition-colors"
        >
          {form.sampleEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} className="text-slate-300" />}
        </button>
      </div>

      {form.sampleEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Sample Price (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                min={0}
                value={form.samplePrice}
                onChange={e => set('samplePrice', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Max Sample Units</label>
            <select
              value={form.sampleMaxUnits}
              onChange={e => set('sampleMaxUnits', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Step 5: Stock ─────────────────────────────────────────────────────────────
function Step5({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Current Available Stock <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          min={0}
          value={form.stock}
          onChange={e => set('stock', e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="e.g. 5000"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Low Stock Alert Threshold</label>
        <input
          type="number"
          min={0}
          value={form.lowStockAlert}
          onChange={e => set('lowStockAlert', e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="Alert when below X units"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm"
        />
        <p className="text-xs text-slate-400 mt-2">You'll be notified when stock drops below this number</p>
      </div>
    </div>
  )
}

// ── Step 6: Payment Terms ─────────────────────────────────────────────────────
function Step6({
  form, set, toggleTerm
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  toggleTerm: (t: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3">
          Accepted Payment Terms <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_OPTIONS.map(term => (
            <button
              key={term}
              onClick={() => toggleTerm(term)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-medium text-left transition-all ${
                form.paymentTerms.includes(term)
                  ? 'border-[#5D4037] bg-[#F5E6D3]/50 text-[#5D4037]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                form.paymentTerms.includes(term) ? 'border-[#5D4037] bg-[#5D4037]' : 'border-slate-300'
              }`}>
                {form.paymentTerms.includes(term) && <Check size={12} className="text-white" />}
              </div>
              {term}
            </button>
          ))}
        </div>
      </div>

      {form.paymentTerms.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Default Payment Term</label>
          <select
            value={form.defaultTerm}
            onChange={e => set('defaultTerm', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 text-sm"
          >
            <option value="">Select default term</option>
            {form.paymentTerms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Additional Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          rows={3}
          value={form.paymentNotes}
          onChange={e => set('paymentNotes', e.target.value)}
          placeholder="Any special payment conditions or instructions..."
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F5E6D3]/30 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/30 text-slate-800 placeholder:text-slate-400 text-sm resize-none"
        />
      </div>
    </div>
  )
}

// ── Step 7: Preview & Publish ─────────────────────────────────────────────────
function Step7({
  form, publishing, published, onDraft, onPublish, set
}: {
  form: FormState
  publishing: boolean
  published: boolean
  onDraft: () => void
  onPublish: () => void
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
}) {
  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-inner">
          <Check size={40} strokeWidth={3} />
        </div>
        <h3 className="text-3xl font-serif font-bold text-slate-900 mb-2">Product Live!</h3>
        <p className="text-slate-500 mb-8 max-w-sm">
          Your product has been successfully listed in the marketplace and is now visible to buyers.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-2xl bg-[#5D4037] text-white font-bold hover:bg-[#5D4037]/90 transition-all shadow-lg"
        >
          View in Storefront
        </button>
      </div>
    )
  }

  const mainPhoto = form.photos[0]
  const isEnhanced = mainPhoto && form.enhancedPhotos[mainPhoto]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Review & Publish</h3>
          <p className="text-sm text-slate-400">Final buyer-side storefront preview</p>
        </div>
      </div>

      {/* Buyer Preview Layout */}
      <div className="bg-[#FAF7F4] rounded-[32px] overflow-hidden border border-slate-200 shadow-xl group">
        <div className="grid grid-cols-5 gap-0">
          {/* Main Photo Card */}
          <div className="col-span-2 relative aspect-square bg-white border-r border-slate-100 p-8 flex items-center justify-center">
            {mainPhoto ? (
              <img 
                src={mainPhoto} 
                className="w-full h-full object-contain transition-all duration-1000" 
                style={isEnhanced ? { filter: 'brightness(1.1) contrast(1.15) saturate(1.2)' } : {}}
                alt="Preview" 
              />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                  <ImageIcon size={64} />
               </div>
            )}
            {isEnhanced && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 shadow-sm">
                <Sparkles size={12} className="text-purple-500" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider italic">AI Enhanced Visuals</span>
              </div>
            )}
          </div>

          {/* Product Info Card */}
          <div className="col-span-3 p-10 flex flex-col">
             <div className="flex items-center gap-2 mb-3">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5D4037] bg-white px-3 py-1 rounded-full border border-[#5D4037]/20 shadow-sm">
                 {form.category || 'Standard Category'}
               </span>
               <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">Verified Listing</span>
             </div>

             <div className="group/edit relative">
               <h2 
                 className="text-3xl font-serif font-bold text-slate-900 mb-2 hover:bg-white transition-colors p-1 -ml-1 rounded-lg cursor-text"
                 onClick={() => {
                   const n = prompt("Edit Product Name:", form.name);
                   if (n !== null) set('name', n);
                 }}
               >
                 {form.name || 'Untitled Product'}
               </h2>
             </div>

             <div 
               className="mb-6 cursor-text"
               onClick={() => {
                 const d = prompt("Edit Description:", form.description);
                 if (d !== null) set('description', d);
               }}
             >
               <p className="text-sm text-slate-500 leading-relaxed line-clamp-4 hover:bg-white p-1 -ml-1 rounded-lg transition-colors">
                 {form.description || 'No description provided yet.'}
               </p>
             </div>

             <div className="mt-auto">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-serif font-bold text-slate-900" onClick={() => {
                    const p = prompt("Edit Price:", String(form.basePrice));
                    if (p !== null) set('basePrice', p === '' ? '' : Number(p));
                  }}>
                    {form.basePrice ? `₹${Number(form.basePrice).toLocaleString('en-IN')}` : '₹—'}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">/ unit (Excl. Tax)</span>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white rounded-2xl px-6 py-3 border border-slate-100 shadow-sm transition-all hover:border-slate-300">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Minimum Order</p>
                    <p className="text-lg font-bold text-slate-800">{form.moq || 1} Units</p>
                  </div>
                  <div className="bg-white rounded-2xl px-6 py-3 border border-slate-100 shadow-sm flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Available</p>
                    <p className="text-lg font-bold text-slate-800">{form.stock || 0} Units</p>
                  </div>
                </div>

                <div className="flex gap-3">
                   <button className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm tracking-widest uppercase hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2">
                     <Plus size={18} /> Request Quote
                   </button>
                   <button className="w-14 h-14 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
                     <X size={20} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Publish actions */}
      <div className="flex gap-4 pt-4 border-t border-slate-100">
        <button
          onClick={onDraft}
          disabled={publishing}
          className="px-8 py-4 rounded-[2rem] border-2 border-slate-200 text-slate-600 font-bold text-sm tracking-widest uppercase hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {publishing ? <Loader2 size={16} className="animate-spin" /> : 'Save Draft'}
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex-1 py-4 rounded-[2rem] bg-gradient-to-r from-[#5D4037] to-[#4E342E] text-white font-bold text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-2xl relative group overflow-hidden"
        >
          {publishing ? (
            <><Loader2 size={18} className="animate-spin" /> Finalizing...</>
          ) : (
            <>
              <Check size={20} />
              Approve & Publish to Storefront
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Step 0: AI Smart Lister (Restored) ─────────────────────────────────────────────
function Step0({ 
  form, set, onAnalyze, onSkip 
}: { 
  form: FormState; 
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onAnalyze: () => void;
  onSkip: () => void;
}) {
  const frontInputRef = React.useRef<HTMLInputElement>(null)
  const backInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      set(side === 'front' ? 'frontPhotoFile' : 'backPhotoFile', file)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-100 text-[#5D4037] mb-2">
          <Sparkles size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 font-serif">AI-Powered Listing Assistant</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Upload photos of the front and back of your product. Our AI will automatically identify materials, specs, and details!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Front Photo */}
        <div 
          onClick={() => frontInputRef.current?.click()}
          className={`relative aspect-[4/3] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
            form.frontPhotoFile ? 'border-[#5D4037] bg-[#F5E6D3]/20' : 'border-slate-200 hover:border-[#5D4037] bg-slate-50 hover:bg-white'
          }`}
        >
          <input type="file" ref={frontInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange('front', e)} />
          {form.frontPhotoFile ? (
            <div className="absolute inset-0 p-3">
              <img src={URL.createObjectURL(form.frontPhotoFile)} className="w-full h-full object-contain rounded-2xl" alt="Front" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-[#5D4037] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Front Side</span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-sm group-hover:text-[#5D4037]">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Front Photo</span>
              <span className="text-[10px] text-slate-400 mt-1">(Product Branding)</span>
            </>
          )}
        </div>

        {/* Back Photo */}
        <div 
          onClick={() => backInputRef.current?.click()}
          className={`relative aspect-[4/3] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
            form.backPhotoFile ? 'border-[#5D4037] bg-[#F5E6D3]/20' : 'border-slate-200 hover:border-[#5D4037] bg-slate-50 hover:bg-white'
          }`}
        >
          <input type="file" ref={backInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange('back', e)} />
          {form.backPhotoFile ? (
            <div className="absolute inset-0 p-3">
              <img src={URL.createObjectURL(form.backPhotoFile)} className="w-full h-full object-contain rounded-2xl" alt="Back" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-[#5D4037] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Back Side</span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-sm group-hover:text-[#5D4037]">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Back Photo</span>
              <span className="text-[10px] text-slate-400 mt-1">(Specs & Labels)</span>
            </>
          )}
        </div>
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <button
          onClick={onAnalyze}
          disabled={(!form.frontPhotoFile && !form.backPhotoFile) || form.isAnalyzing}
          className="w-full py-4 rounded-[2rem] bg-[#5D4037] text-white font-bold text-lg hover:bg-[#4E342E] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden"
        >
          {form.isAnalyzing ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Analyzing Packets...
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 animate-pulse w-full" />
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Magic Analysis
            </>
          )}
        </button>
        
        <button
          onClick={onSkip}
          disabled={form.isAnalyzing}
          className="w-full py-4 rounded-[2rem] border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          Skip & Fill Details Manually
        </button>

        <p className="text-[10px] text-slate-400 text-center font-medium">
          Note: This uses high-precision AI vision. It may take 5-10 seconds to process.
        </p>
      </div>
    </div>
  )
}
