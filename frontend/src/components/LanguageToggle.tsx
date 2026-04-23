import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
];

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const { user, setUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);

    // Persist to backend if logged in
    if (user) {
      try {
        const updatedUser = await api.updateLanguage(lng);
        if (setUser) setUser(updatedUser);
      } catch (err) {
        console.error('Failed to save language preference:', err);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-gray-700 bg-white shadow-sm ring-1 ring-black/5"
      >
        <Languages size={16} className="text-purple-600" />
        <span className="text-xs font-medium hidden sm:inline-block">{currentLanguage.native}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[9999] animate-in fade-in zoom-in duration-200">
          <div className="px-3 py-1 mb-1 border-b border-gray-50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Select Language</span>
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                i18n.language === lang.code 
                  ? 'bg-purple-50 text-purple-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-xs">{lang.native}</span>
                <span className="text-[10px] opacity-60 font-normal">{lang.label}</span>
              </div>
              {i18n.language === lang.code && <Check size={14} className="text-purple-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
