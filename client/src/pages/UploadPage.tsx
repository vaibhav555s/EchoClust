import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { uploadBatch, runClustering } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Music, UploadCloud, X, Play, Pause } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { cn } from '@/lib/utils';

interface AudioFile extends File {
  previewUrl: string;
}

function WaveformPreview({ file, onRemove }: { file: AudioFile; onRemove: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(255,255,255,0.2)',
      progressColor: 'rgb(139, 92, 246)', // Tailwind Violet-500
      height: 40,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorColor: 'transparent',
    });

    ws.load(file.previewUrl);
    
    ws.on('ready', () => {
      const d = ws.getDuration();
      const mins = Math.floor(d / 60);
      const secs = Math.floor(d % 60).toString().padStart(2, '0');
      setDuration(`${mins}:${secs}`);
    });

    ws.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [file.previewUrl]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="p-3 bg-white/5 border-white/10 hover:bg-white/10 transition-colors group flex items-center gap-4">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 shrink-0 rounded-full bg-primary/20 hover:bg-primary/40 flex items-center justify-center text-primary transition-colors"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium truncate text-white/90">{file.name}</p>
          <span className="text-xs text-white/50">{duration}</span>
        </div>
        <div ref={containerRef} className="w-full" />
      </div>

      <button 
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-400 transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </Card>
  );
}

export default function UploadPage() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.wav', '.mp3'] }
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].previewUrl);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleProcess = async () => {
    if (files.length < 3) return;

    setIsProcessing(true);
    setProgress(10);
    
    try {
      // 1. Upload files
      toast({ title: "Uploading files...", description: "Transferring audio clips to server." });
      const uploadRes = await uploadBatch(files);
      setProgress(40);
      
      // 2. Start clustering
      toast({ title: "Processing audio...", description: "Extracting MFCCs and running K-Means clustering." });
      
      // Fake progress for UX
      const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 5 : p));
      }, 500);

      const clusterRes = await runClustering(uploadRes.batchId, 4);
      clearInterval(interval);
      setProgress(100);
      
      toast({ 
        title: "Success!", 
        description: "Clustering complete. Loading results..." 
      });

      // Cleanup local URLs
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));

      setTimeout(() => navigate(`/results/${uploadRes.batchId}`), 500);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error processing batch",
        description: error?.response?.data?.error || "An unexpected error occurred.",
        variant: "destructive"
      });
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Unsupervised Sound Clustering
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload environmental audio clips to extract MFCC features and automatically group them using K-Means clustering.
        </p>
      </div>

      <Card 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer p-12 flex flex-col items-center justify-center gap-4 text-center group",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10"
        )}
      >
        <input {...getInputProps()} />
        <div className="bg-background/50 p-4 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-xl border border-white/5">
          <UploadCloud className="w-8 h-8 text-primary/80" />
        </div>
        <div>
          <p className="text-lg font-medium">Drag & drop audio files here</p>
          <p className="text-sm text-muted-foreground mt-1">Supports .wav and .mp3 (Minimum 3 files required)</p>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Ready to process ({files.length} files)
            </h3>
            
            <Button 
              onClick={handleProcess} 
              disabled={files.length < 3 || isProcessing}
              className="gap-2 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Clustering Pipeline
                </>
              )}
            </Button>
          </div>

          {files.length < 3 && (
            <p className="text-sm text-amber-500 bg-amber-500/10 px-4 py-2 rounded-md border border-amber-500/20">
              Please upload at least {3 - files.length} more file(s) to enable clustering.
            </p>
          )}

          {isProcessing && (
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {files.map((file, index) => (
              <WaveformPreview 
                key={`${file.name}-${index}`} 
                file={file} 
                onRemove={() => removeFile(index)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
