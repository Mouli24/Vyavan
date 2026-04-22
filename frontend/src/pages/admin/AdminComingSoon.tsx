import React from 'react'
import { motion } from 'motion/react'
import { Construction, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminComingSoon() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md"
      >
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-amber-100">
          <Construction className="w-10 h-10 text-amber-600" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
          Module Under Construction
        </h1>
        
        <p className="text-slate-500 mb-8 leading-relaxed font-medium">
          Our team is currently building this advanced administrative module to provide better platform governance. Stay tuned for powerful management tools!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl w-full sm:w-auto transition-all shadow-lg hover:shadow-amber-200"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          
          <button className="px-6 py-3 bg-white border border-amber-200 text-amber-700 font-bold rounded-2xl w-full sm:w-auto hover:bg-amber-50 transition-all">
            Notify me when ready
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-1.5">
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
