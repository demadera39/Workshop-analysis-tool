import React from 'react';
import { Layout, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onBack, title }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">WorkshopDoc AI</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            {title && (
                <span className="text-sm font-medium text-gray-500 hidden sm:block">
                    {title}
                </span>
            )}
            
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium border border-green-100" title="Data is stored in-memory only and cleared on reload.">
                <ShieldCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Privacy Mode: On</span>
            </div>
        </div>
      </div>
    </header>
  );
};
