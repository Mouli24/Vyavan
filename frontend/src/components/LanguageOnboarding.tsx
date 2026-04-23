import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Globe, ArrowRight } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
];

export default function LanguageOnboarding() {
  const { user, setUser } = useAuth();
  const { i18n, t } = useTranslation();
  const [selected, setSelected] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(false);

  // Only show if user is logged in AND hasn't set their language preference
  if (!user || user.languagePreferenceSet) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await api.updateLanguage(selected);
      i18n.changeLanguage(selected);
      if (setUser) setUser(updatedUser); // Update user state with languagePreferenceSet: true
    } catch (err) {
      console.error('Failed to save language choice:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        <div className="p-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Globe size={32} className="text-purple-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Welcome to Vyawan
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Please select your preferred language to continue
          </p>

          <div className="grid grid-cols-1 gap-3 mb-8">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selected === lang.code
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-100 bg-white text-gray-600 hover:border-purple-200'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{lang.native}</span>
                  <span className="text-xs opacity-60">{lang.label}</span>
                </div>
                {selected === lang.code && (
                  <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-200"
          >
            {loading ? 'Saving...' : 'Get Started'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Check({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

