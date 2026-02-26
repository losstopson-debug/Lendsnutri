import React, { useRef, useState } from 'react';
import { Camera, Upload, X, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  isAnalyzing: boolean;
  externalPreview?: string | null;
  onReset?: () => void;
}

export default function ImageUpload({ onImageSelect, isAnalyzing, externalPreview, onReset }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const currentPreview = externalPreview || preview;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageSelect(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      
      // Stop camera stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      
      setPreview(base64);
      onImageSelect(base64);
      setIsCameraOpen(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setIsCameraOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onReset?.();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!currentPreview && !isCameraOpen ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <Upload className="w-8 h-8 mb-2 text-zinc-400 group-hover:text-emerald-500" />
            <span className="text-sm font-medium text-zinc-600 group-hover:text-emerald-700">Upload Foto</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </button>
          
          <button
            onClick={startCamera}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <Camera className="w-8 h-8 mb-2 text-zinc-400 group-hover:text-emerald-500" />
            <span className="text-sm font-medium text-zinc-600 group-hover:text-emerald-700">Tirar Foto</span>
          </button>
        </div>
      ) : isCameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={() => {
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
                setIsCameraOpen(false);
              }}
              className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={capturePhoto}
              className="p-4 bg-emerald-500 rounded-full text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition-transform"
            >
              <Camera className="w-8 h-8" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-xl group">
          <img src={currentPreview!} alt="Preview" className="w-full aspect-[3/4] object-cover" />
          <div className={cn(
            "absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-500",
            isAnalyzing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isAnalyzing ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                {/* Scanning Line Effect */}
                <motion.div 
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
                />
                
                {/* Pulse Effect */}
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />

                <div className="relative z-20 flex flex-col items-center text-white px-6 text-center">
                  <div className="mb-4 p-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                  </div>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-bold text-lg mb-1"
                  >
                    Analisando Alimento
                  </motion.p>
                  <p className="text-zinc-300 text-sm">
                    Identificando nutrientes e calorias...
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={reset}
                className="p-3 bg-white rounded-full text-zinc-900 shadow-lg hover:bg-zinc-100 transition-transform hover:scale-110 active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
