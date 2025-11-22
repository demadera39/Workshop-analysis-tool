import React from 'react';
import { WorkshopImage } from '../types';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageGridProps {
  images: WorkshopImage[];
  onRemove: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onRemove }) => {
  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="mx-auto h-12 w-12 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No images yet</h3>
        <p className="mt-1 text-sm text-gray-500">Upload photos of your workshop materials to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((img) => (
        <div key={img.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <img 
            src={img.url} 
            alt="Workshop material" 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
               onClick={() => onRemove(img.id)}
               className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transform scale-90 hover:scale-100 transition-all shadow-lg"
               title="Remove image"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </button>
          </div>

          <div className="absolute bottom-2 right-2">
            {img.status === 'analyzing' && (
              <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-indigo-600" title="Analyzing content...">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {img.status === 'done' && (
              <div className="bg-green-100/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-green-600" title="Analysis complete">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
             {img.status === 'error' && (
              <div className="bg-red-100/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-red-600" title="Analysis failed">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          
          {img.description && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
               <p className="text-xs text-white line-clamp-2">{img.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};