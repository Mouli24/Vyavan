import React, { useState } from 'react'
import {
  X, Plus, Trash2, Check, ChevronLeft, ChevronRight,
  Image as ImageIcon, ToggleLeft, ToggleRight, Eye, Loader2, GripHorizontal, ArrowLeftRight
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

  function reorderPhotos(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= form.photos.length) return
    const next = [...form.photos]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    set('photos', next)
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
                {step === 0 && <Step1 form={form} set={set} />}
                {step === 1 && <Step2 form={form} set={set} addPhoto={addPhoto} removePhoto={removePhoto} reorderPhotos={(p) => set('photos', p)} />}
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
  form, set, addPhoto, removePhoto, reorderPhotos
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  addPhoto: () => void
  removePhoto: (i: number) => void
  reorderPhotos: (p: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
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
            onClick={addPhoto}
            disabled={!form.photoInput.trim() || form.photos.length >= 12}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5D4037] text-white text-sm font-bold hover:bg-[#5D4037]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Plus size={16} /> Add Photo
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
          <ArrowLeftRight size={12} /> Drag photos to reorder. First photo is always the main display image.
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
              className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 cursor-grab active:cursor-grabbing"
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
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white text-red-500 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </Reorder.Item>
          ))}
          {form.photos.length < 12 && (
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
              <ImageIcon size={24} />
            </div>
          )}
        </Reorder.Group>
      ) : (
        <div className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300 gap-2">
          <ImageIcon size={32} />
          <span className="text-xs font-medium text-slate-400">No photos added yet</span>
        </div>
      )}
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
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 gap-4"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check size={36} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-serif font-bold text-slate-900">
          {publishing ? 'Saving...' : 'Product Published!'}
        </h3>
        <p className="text-slate-500 text-sm text-center max-w-xs">
          Your product is now live and visible to buyers on the marketplace.
        </p>
      </motion.div>
    )
  }

  const filledSpecs = form.specs.filter(s => s.key.trim() && s.value.trim())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-1">
        <Eye size={18} className="text-[#5D4037]" />
        <h3 className="text-sm font-bold text-slate-700">Buyer Preview</h3>
      </div>

      {/* Preview card */}
      <div className="rounded-[24px] border border-slate-200 overflow-hidden bg-white shadow-sm">
        {/* Photo strip */}
        <div className="h-48 bg-slate-100 relative overflow-hidden">
          {form.photos[0] ? (
            <img src={form.photos[0]} alt="Main" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageIcon size={48} />
            </div>
          )}
          {form.category && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-[#5D4037] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              {form.category}
            </span>
          )}
        </div>

        <div className="p-6">
          <h4 className="text-xl font-serif font-bold text-slate-900 mb-1">
            {form.name || <span className="text-slate-300">Product Name</span>}
          </h4>

          {form.description && (
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{form.description}</p>
          )}

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-serif font-bold text-slate-900">
              {form.basePrice !== '' ? `₹${Number(form.basePrice).toLocaleString('en-IN')}` : '₹—'}
            </span>
            <span className="text-xs text-slate-400 font-medium">per unit</span>
            {form.moq !== '' && (
              <span className="ml-auto text-xs font-bold text-[#5D4037] bg-[#F5E6D3] px-3 py-1 rounded-full">
                MOQ: {form.moq} units
              </span>
            )}
          </div>

          {filledSpecs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filledSpecs.slice(0, 6).map((s, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                  {s.key}: {s.value}
                </span>
              ))}
              {filledSpecs.length > 6 && (
                <span className="px-3 py-1 bg-slate-100 text-slate-400 text-xs rounded-full">
                  +{filledSpecs.length - 6} more
                </span>
              )}
            </div>
          )}

          {form.paymentTerms.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {form.paymentTerms.map(t => (
                <span key={t} className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  t === form.defaultTerm
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-[#F5E6D3] text-[#5D4037]'
                }`}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Publish actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onDraft}
          disabled={publishing}
          className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
        >
          {publishing ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save as Draft'}
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex-1 py-3 rounded-2xl bg-[#5D4037] text-white font-bold text-sm hover:bg-[#5D4037]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {publishing ? (
            <><Loader2 size={16} className="animate-spin" /> Publishing...</>
          ) : (
            'Publish Now'
          )}
        </button>
      </div>
    </div>
  )
}
