import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, FileText, Share2, Play, Pause, Headphones } from 'lucide-react';
import { Button } from './Button';

interface ReportViewProps {
  markdown: string;
  audioData?: string;
  onGenerateAudio: () => void;
  isGeneratingAudio?: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  markdown, 
  audioData, 
  onGenerateAudio, 
  isGeneratingAudio 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Decode audio data when it becomes available
  useEffect(() => {
    if (audioData) {
      const initAudio = async () => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioContextRef.current = ctx;
          
          // Decode base64 to array buffer
          const binaryString = atob(audioData);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Decode PCM data
          // Note: Gemini TTS returns raw PCM at 24kHz
          const dataInt16 = new Int16Array(bytes.buffer);
          const numChannels = 1;
          const frameCount = dataInt16.length / numChannels;
          const buffer = ctx.createBuffer(numChannels, frameCount, 24000);
          
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < frameCount; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
          }
          
          setAudioBuffer(buffer);
        } catch (e) {
          console.error("Error decoding audio", e);
        }
      };
      initAudio();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioData]);

  const togglePlayback = () => {
    if (!audioContextRef.current || !audioBuffer) return;

    if (isPlaying) {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceRef.current = source;
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(markdown);
      alert("Report copied to clipboard!");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-indigo-900">
          <FileText className="w-5 h-5" />
          <h2 className="font-semibold">Workshop Intelligence Report</h2>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopy} title="Copy to clipboard" className="!px-3">
                <Share2 className="w-4 h-4" />
            </Button>
          <Button variant="outline" onClick={handleDownload} icon={<Download className="w-4 h-4"/>}>
            Download .md
          </Button>
        </div>
      </div>

      {/* Audio Overview Section - NotebookLM Style */}
      <div className="px-8 pt-6 pb-2">
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-full text-white shadow-md">
                    <Headphones className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-indigo-900">Audio Overview</h3>
                    <p className="text-sm text-indigo-700">Deep dive discussion (Hosted by Alex & Sam)</p>
                </div>
            </div>
            
            <div>
                {!audioData ? (
                     <Button 
                        onClick={onGenerateAudio} 
                        isLoading={isGeneratingAudio}
                        variant="primary"
                        className="shadow-indigo-200"
                     >
                        Generate Audio
                     </Button>
                ) : (
                    <Button 
                        onClick={togglePlayback} 
                        variant="primary"
                        className={isPlaying ? "bg-red-500 hover:bg-red-600" : ""}
                        icon={isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    >
                        {isPlaying ? "Pause Summary" : "Play Summary"}
                    </Button>
                )}
            </div>
        </div>
      </div>
      
      <div className="overflow-y-auto p-8 prose prose-indigo max-w-none">
        <ReactMarkdown
            components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1 text-gray-600" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 text-gray-600 leading-relaxed" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-indigo-900" {...props} />,
            }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};
