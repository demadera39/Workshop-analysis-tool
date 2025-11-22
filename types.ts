
export interface WorkshopImage {
  id: string;
  url: string;
  base64: string; // Stored for API transmission
  mimeType: string; // e.g., 'image/jpeg', 'image/png'
  description: string | null;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  timestamp: number;
}

export interface Report {
  markdown: string;
  generatedAt: number;
  audioOverview?: string; // Base64 raw PCM audio
}

export interface Session {
  id: string;
  title: string;
  date: number;
  images: WorkshopImage[];
  report: Report | null;
  isGeneratingReport: boolean;
  isGeneratingAudio?: boolean;
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  TTS = 'gemini-2.5-flash-preview-tts',
}
