
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Wand2, UploadCloud, ChevronLeft, FileText } from 'lucide-react';
import { Session, WorkshopImage } from './types';
import { Header } from './components/Header';
import { SessionCard } from './components/SessionCard';
import { ImageGrid } from './components/ImageGrid';
import { Button } from './components/Button';
import { ReportView } from './components/ReportView';
import { analyzeImageContent, generateWorkshopReport, generateAudioOverview } from './services/geminiService';

// Main App Container
export default function App() {
  // --- State ---
  // Note: No local storage usage to ensure "No sensitive documents remain" (Ephemeral/RAM only)
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'report'>('photos');
  
  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Warn user before leaving page that data will be lost
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessions.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessions]);

  // --- Derived State ---
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // --- Handlers ---

  const handleCreateSession = () => {
    const newSession: Session = {
      id: uuidv4(),
      title: `Workshop ${new Date().toLocaleDateString()}`,
      date: Date.now(),
      images: [],
      report: null,
      isGeneratingReport: false,
      isGeneratingAudio: false,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) setCurrentSessionId(null);
    }
  };

  const handleRenameSession = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!currentSession) return;
      const newTitle = e.target.value;
      setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, title: newTitle } : s));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !currentSession) return;
    
    const files: File[] = Array.from(e.target.files);
    
    const newImages: WorkshopImage[] = [];

    // Process each file
    for (const file of files) {
        // Basic validation
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        const promise = new Promise<WorkshopImage>((resolve) => {
            reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                // Only keep the data part for API
                const base64Data = base64.split(',')[1];
                resolve({
                    id: uuidv4(),
                    url: base64, // Kept in memory for display
                    base64: base64Data,
                    mimeType: file.type, // Capture the correct mime type
                    description: null,
                    status: 'pending',
                    timestamp: Date.now()
                });
            };
            reader.readAsDataURL(file);
        });
        
        const img = await promise;
        newImages.push(img);
    }

    // Update state with pending images
    setSessions(prev => prev.map(s => 
        s.id === currentSession.id 
            ? { ...s, images: [...s.images, ...newImages] }
            : s
    ));

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Trigger analysis for each new image individually
    newImages.forEach(img => analyzeSingleImage(currentSession.id, img));
  };

  const analyzeSingleImage = async (sessionId: string, image: WorkshopImage) => {
      // Set status to analyzing
      setSessions(prev => prev.map(s => s.id === sessionId ? {
          ...s,
          images: s.images.map(i => i.id === image.id ? { ...i, status: 'analyzing' } : i)
      } : s));

      try {
          // Call Gemini Flash with correct mimeType
          const description = await analyzeImageContent(image.base64, image.mimeType);
          
          // Update with result
          setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            images: s.images.map(i => i.id === image.id ? { ...i, status: 'done', description } : i)
        } : s));

      } catch (error) {
          setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            images: s.images.map(i => i.id === image.id ? { ...i, status: 'error' } : i)
        } : s));
      }
  };

  const handleGenerateReport = async () => {
      if (!currentSession) return;
      
      const completedImages = currentSession.images.filter(i => i.status === 'done' && i.description);
      
      if (completedImages.length === 0) {
          alert("Please wait for images to finish analyzing before generating a report.");
          return;
      }

      setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isGeneratingReport: true } : s));

      try {
          const descriptions = completedImages.map(i => i.description as string);
          const markdown = await generateWorkshopReport(descriptions);
          
          setSessions(prev => prev.map(s => s.id === currentSession.id ? { 
              ...s, 
              isGeneratingReport: false,
              report: { markdown, generatedAt: Date.now() }
          } : s));
          
          setActiveTab('report');

      } catch (error) {
          alert("Failed to generate report. Please try again.");
          setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isGeneratingReport: false } : s));
      }
  };

  const handleGenerateAudio = async () => {
      if (!currentSession?.report) return;
      
      setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isGeneratingAudio: true } : s));

      try {
          const audioData = await generateAudioOverview(currentSession.report.markdown);
          
          setSessions(prev => prev.map(s => s.id === currentSession.id ? {
              ...s,
              isGeneratingAudio: false,
              report: { ...s.report!, audioOverview: audioData }
          } : s));

      } catch (error) {
          console.error(error);
          alert("Failed to generate audio overview.");
          setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isGeneratingAudio: false } : s));
      }
  };

  const handleRemoveImage = (imageId: string) => {
      if(!currentSession) return;
      setSessions(prev => prev.map(s => s.id === currentSession.id ? {
          ...s,
          images: s.images.filter(i => i.id !== imageId)
      } : s));
  };


  // --- Render ---

  if (!currentSession) {
    // Dashboard View
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Workshops</h2>
              <p className="text-gray-500 mt-1">Manage and analyze your session documentation.</p>
            </div>
            <Button onClick={handleCreateSession} icon={<Plus className="w-5 h-5" />}>
              New Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
               <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Wand2 className="w-8 h-8 text-indigo-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your first analysis</h3>
               <p className="text-gray-500 max-w-md mx-auto mb-8">
                 Create a temporary session, upload photos of your sticky notes, and let Gemini generate actionable insights instantly. <br/>
                 <span className="text-xs text-gray-400 block mt-2 font-medium bg-gray-100 py-1 px-2 rounded-full inline-block">
                    Privacy Mode: Data is cleared on reload
                 </span>
               </p>
               <Button onClick={handleCreateSession} icon={<Plus className="w-5 h-5" />}>
                 Create Session
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map(session => (
                <SessionCard 
                    key={session.id} 
                    session={session} 
                    onClick={() => {
                        setCurrentSessionId(session.id);
                        setActiveTab(session.report ? 'report' : 'photos');
                    }}
                    onDelete={(e) => handleDeleteSession(session.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Session Detail View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onBack={() => setCurrentSessionId(null)} 
        title={currentSession.title} 
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Session Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex-1">
                <input 
                    type="text" 
                    value={currentSession.title}
                    onChange={handleRenameSession}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none w-full transition-colors pb-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                    {new Date(currentSession.date).toLocaleDateString()} • {currentSession.images.length} items
                </p>
            </div>
            <div className="flex gap-3">
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileUpload}
                 />
                 <Button 
                    variant="secondary" 
                    onClick={() => fileInputRef.current?.click()}
                    icon={<UploadCloud className="w-4 h-4" />}
                 >
                    Add Photos
                 </Button>
                 
                 <Button 
                    onClick={handleGenerateReport}
                    disabled={currentSession.images.length === 0}
                    isLoading={currentSession.isGeneratingReport}
                    icon={<Wand2 className="w-4 h-4" />}
                 >
                    Generate Report
                 </Button>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
            <button
                onClick={() => setActiveTab('photos')}
                className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'photos' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                Photos & Analysis
            </button>
            <button
                onClick={() => setActiveTab('report')}
                className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'report' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                Final Report
            </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
            {activeTab === 'photos' && (
                <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                             <Wand2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-indigo-900">AI Processing Active</h4>
                            <p className="text-sm text-indigo-800 mt-1">
                                Photos are automatically analyzed by Gemini Flash as you upload them. Once analysis is complete, click "Generate Report" to synthesize insights using Gemini Pro.
                            </p>
                        </div>
                    </div>
                    <ImageGrid images={currentSession.images} onRemove={handleRemoveImage} />
                </div>
            )}

            {activeTab === 'report' && (
                currentSession.report ? (
                    <ReportView 
                        markdown={currentSession.report.markdown} 
                        audioData={currentSession.report.audioOverview}
                        onGenerateAudio={handleGenerateAudio}
                        isGeneratingAudio={currentSession.isGeneratingAudio}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No report generated yet</h3>
                        <p className="text-gray-500 mt-2 max-w-sm">
                            Upload photos and let the AI analyze them. When you're ready, click "Generate Report" to create your summary.
                        </p>
                        <div className="mt-6">
                            <Button 
                                onClick={handleGenerateReport} 
                                isLoading={currentSession.isGeneratingReport}
                                disabled={currentSession.images.length === 0}
                            >
                                Generate Report Now
                            </Button>
                        </div>
                    </div>
                )
            )}
        </div>
      </main>
    </div>
  );
}
