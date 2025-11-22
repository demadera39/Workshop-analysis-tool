import React from 'react';
import { Session } from '../types';
import { Calendar, Image as ImageIcon, FileText, ChevronRight } from 'lucide-react';

interface SessionCardProps {
  session: Session;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick, onDelete }) => {
  const dateStr = new Date(session.date).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-900 truncate pr-8">{session.title}</h3>
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                className="text-gray-400 hover:text-red-500 absolute top-4 right-4 p-1 rounded-md hover:bg-gray-50 transition-colors"
                title="Delete Session"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" />
            <span>{session.images.length} Photos</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            {session.report ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <FileText className="w-3 h-3 mr-1" />
                Report Ready
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Draft
              </span>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-indigo-500 transition-all"></div>
    </div>
  );
};