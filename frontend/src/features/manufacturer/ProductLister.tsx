import React, { useState, useRef } from 'react';
import { 
  Upload, Sparkles, Loader2, Check, AlertCircle, 
  RefreshCcw, ArrowRight, Image as ImageIcon,
  Save, X, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';

const CATEGORIES = [
  'Textiles', 'Electronics', 'Machinery', 'FMCG', 'Automotive',
  'Construction', 'Chemicals', 'Agriculture', 'Pharmaceuticals',
  'Furniture', 'Leather Goods', 'Plastics', 'Metal Products', 'Paper Products',
];

interface AnalysisResult {
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  specifications: Record<string, string>;
  keyFeatures: string[];
  seoTags: string[];
  hsCode: string;
  packagingType: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductLister({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Processing, 3: Edit/Review
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<string>('');
  const [moq, setMoq] = useState<string>('');
  const [publishing, setPublishing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError(null);
    } else {
      setError('Please upload a valid image file.');
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStep(2);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const apiUrl = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

      const response = await fetch(`${apiUrl}/product-lister/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setImageUrl(data.imageUrl);
        setStep(3);
      } else {
        throw new Error(data.message || 'AI analysis failed.');
      }
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!analysis || !price || !moq) return;
    setPublishing(true);
    try {
      const payload = {
        ...analysis,
        price: Number(price),
        moq: Number(moq),
        image: imageUrl,
        photos: [imageUrl],
        specs: analysis.specifications,
        isActive: true
      };
      
      await api.createProduct(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Publication failed. Please check your data.');
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Sparkles className="text-indigo-600" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Smart Lister</h2>
              <p className="text-sm text-slate-500 font-medium">Auto-generate professional B2B listings in seconds</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#FAF7F4]">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Upload */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto py-10"
              >
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-4 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                    isDragging ? 'border-indigo-400 bg-indigo-50/50 scale-[1.02]' : 
                    file ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  
                  {preview ? (
                    <div className="relative w-48 h-48 mb-6">
                      <img src={preview} className="w-full h-full object-cover rounded-2xl shadow-xl border-4 border-white" alt="Preview" />
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
                        <Check size={20} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload size={32} className={`${isDragging ? 'text-indigo-600' : 'text-slate-400'} group-hover:text-indigo-500 transition-colors`} />
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {file ? 'Photo Ready!' : 'Upload your product'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 max-w-sm">
                    Just upload one clear photo. Our AI will identify the model, material, and features automatically.
                  </p>

                  <button 
                    onClick={(e) => {
                      if (file) {
                        e.stopPropagation();
                        startAnalysis();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    disabled={!file}
                    className="w-full h-14 bg-slate-900 hover:bg-black disabled:opacity-30 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg"
                  >
                    {file ? (
                      <><Sparkles size={20} className="text-indigo-400" /> Start AI Analysis</>
                    ) : (
                      'Choose Image'
                    )}
                  </button>
                </div>
                
                {error && (
                  <p className="text-red-500 text-sm font-bold text-center mt-6 flex items-center justify-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 2: Processing */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="text-indigo-600 animate-pulse" size={40} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">AI soch raha hai...</h3>
                <p className="text-slate-500 max-w-md">
                  Analyzing textures, estimating HS codes, and writing professional copy for your B2B listing. Please wait.
                </p>
              </motion.div>
            )}

            {/* Step 3: Review & Edit */}
            {step === 3 && analysis && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Visual Summary */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2.5fr] gap-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-50 shadow-inner">
                    <img src={imageUrl} className="w-full h-full object-cover" alt="Product" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">AI Generated</span>
                      <span className="bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Image Hosted</span>
                    </div>
                    <input 
                      className="text-3xl font-bold text-slate-900 border-none p-0 focus:ring-0 w-full mb-2" 
                      value={analysis.name}
                      onChange={e => setAnalysis({...analysis, name: e.target.value})}
                    />
                    <textarea 
                      className="text-slate-500 text-sm border-none p-0 focus:ring-0 w-full resize-none h-12"
                      value={analysis.shortDescription}
                      onChange={e => setAnalysis({...analysis, shortDescription: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Core Data */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Long Description</label>
                      <textarea 
                        rows={6}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={analysis.description}
                        onChange={e => setAnalysis({...analysis, description: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">List Price (₹)</label>
                        <input 
                          type="number"
                          placeholder="Ex: 499"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Min Order (MOQ)</label>
                        <input 
                          type="number"
                          placeholder="Ex: 50"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none"
                          value={moq}
                          onChange={e => setMoq(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 outline-none"
                          value={analysis.category}
                          onChange={e => setAnalysis({...analysis, category: e.target.value})}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">HS Code (Est.)</label>
                        <input 
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 outline-none"
                          value={analysis.hsCode}
                          onChange={e => setAnalysis({...analysis, hsCode: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Specs & Features */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                        <Info size={16} className="text-indigo-400" /> Specifications
                      </h4>
                      <div className="grid gap-3">
                        {Object.entries(analysis.specifications).map(([key, value], i) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              className="flex-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-none rounded-lg px-2 py-1" 
                              value={key} 
                              readOnly 
                            />
                            <input 
                              className="flex-[2] text-xs font-medium text-slate-700 border-b border-slate-100 focus:border-indigo-500 outline-none px-1" 
                              value={value}
                              onChange={e => {
                                const next = { ...analysis.specifications, [key]: e.target.value };
                                setAnalysis({...analysis, specifications: next});
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">SEO Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.seoTags.map((tag, i) => (
                          <span key={i} className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-100">
                            #{tag.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Check size={14} className="text-indigo-300" /> Ready to Publish
                      </h4>
                      <p className="text-[10px] text-indigo-100 leading-relaxed mb-4">
                        Analysis complete. You've verified the descriptions and set the MOQ. Your product will go live immediately.
                      </p>
                      <button 
                        onClick={handlePublish}
                        disabled={publishing || !price || !moq}
                        className="w-full bg-white text-indigo-600 h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      >
                        {publishing ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <><Save size={18} /> Publish Final Listing</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
