
import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { analyzeEyeMovement } from '../services/geminiService';
import { DiagnosisResult, Language, Side } from '../types';
import { translations } from '../translations';
import HumanModel from './HumanModel';

interface EyeAnalysisProps {
  onDiagnosisComplete: (result: DiagnosisResult) => void;
  lang: Language;
}

const EyeAnalysis: React.FC<EyeAnalysisProps> = ({ onDiagnosisComplete, lang }) => {
  const [step, setStep] = useState<'side-select' | 'instruction-turn' | 'instruction-lie' | 'camera'>('side-select');
  const [selectedSide, setSelectedSide] = useState<Side | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const t = translations[lang];

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // FIX: Attach stream to video element securely and ensure playback
  useEffect(() => {
    let mounted = true;
    if (step === 'camera' && videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      // Explicitly handle playback to prevent black screen issues
      const handleMetadata = () => {
         if (mounted) {
             video.play().catch(e => console.error("Video play failed:", e));
         }
      };
      
      video.addEventListener('loadedmetadata', handleMetadata);
      
      // Attempt to play immediately just in case metadata already loaded
      video.play().catch(() => {}); 

      return () => {
          mounted = false;
          video.removeEventListener('loadedmetadata', handleMetadata);
      };
    }
  }, [step, stream]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countInterval);
          executeAnalysis();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Safety check: Ensure video has dimensions and data
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0 || videoRef.current.readyState < 2) {
        setError(t.cameraInactive || "Camera not ready");
        return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
        const frames: string[] = [];
        const context = canvasRef.current.getContext('2d');
        
        if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;

            // Capture 3 frames over ~1 second to detect movement
            for (let i = 0; i < 3; i++) {
                context.drawImage(videoRef.current, 0, 0);
                frames.push(canvasRef.current.toDataURL('image/jpeg', 0.7));
                if (i < 2) await new Promise(r => setTimeout(r, 300));
            }
            
            const result = await analyzeEyeMovement(frames, lang);
            
            // Inject the selected side into the result if AI is unsure
            if (result.hasBPPV && !result.side && selectedSide) {
                 result.side = selectedSide;
            }
            onDiagnosisComplete(result);
        }
    } catch (err) {
        console.error("Diagnosis error:", err);
        setError("Analysis failed. Please try again.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- Step 1: Select Side ---
  if (step === 'side-select') {
      return (
          <div className="flex flex-col items-center w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6">{t.selectSide}</h2>
              <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => { setSelectedSide(Side.LEFT); setStep('instruction-turn'); }}
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-medical-500 hover:bg-medical-50 transition group"
                  >
                      <ArrowLeft className="w-10 h-10 text-slate-400 group-hover:text-medical-600 mb-3" />
                      <span className="font-bold text-slate-700">{t.testLeft}</span>
                  </button>
                  <button 
                    onClick={() => { setSelectedSide(Side.RIGHT); setStep('instruction-turn'); }}
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-medical-500 hover:bg-medical-50 transition group"
                  >
                      <ArrowRight className="w-10 h-10 text-slate-400 group-hover:text-medical-600 mb-3" />
                      <span className="font-bold text-slate-700">{t.testRight}</span>
                  </button>
              </div>
          </div>
      )
  }

  // --- Step 2 & 3: Interactive Instructions ---
  if (step === 'instruction-turn' || step === 'instruction-lie') {
      const isLeft = selectedSide === Side.LEFT;
      const isTurn = step === 'instruction-turn';
      
      // Determine Pose Props
      const torsoAngle = isTurn ? 90 : 0;
      const bodyRoll = 0;
      // Head Turn Logic: If testing Left, turn Left (positive). If testing Right, turn Right (negative).
      const headYaw = isLeft ? 45 : -45; 
      const headPitch = isTurn ? 0 : -20;

      return (
          <div className="flex flex-col w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="h-64 bg-slate-100 relative">
                  <HumanModel 
                    torsoAngle={torsoAngle}
                    bodyRoll={bodyRoll}
                    headYaw={headYaw} 
                    headPitch={headPitch} 
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-medical-600 border border-medical-100">
                      {isTurn ? 'Step 1' : 'Step 2'}
                  </div>
              </div>
              <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {isTurn ? t.diagStep1Title : t.diagStep2Title}
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                      {isTurn 
                        ? t.diagStep1Desc.replace('【测试侧】', isLeft ? (lang === 'en' ? 'LEFT' : '【左】') : (lang === 'en' ? 'RIGHT' : '【右】'))
                        : t.diagStep2Desc
                      }
                  </p>
                  
                  <div className="flex gap-3">
                      {isTurn && (
                          <button onClick={() => setStep('side-select')} className="px-4 py-3 text-slate-400 hover:text-slate-600 font-bold">
                              {t.back}
                          </button>
                      )}
                      <button 
                        onClick={() => {
                            if (isTurn) setStep('instruction-lie');
                            else {
                                setStep('camera');
                                startCamera();
                            }
                        }}
                        className="flex-1 bg-medical-600 text-white py-3 rounded-xl font-bold hover:bg-medical-700 transition flex items-center justify-center gap-2"
                      >
                         {isTurn ? t.nextStep : t.diagReady} <ArrowRight size={18} />
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  // --- Step 4: Camera & Analysis ---
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Camera className="w-6 h-6 text-medical-600" />
        {t.nystagmusAnalysis}
      </h2>
      
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-inner">
        {!stream ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <RefreshCw className="animate-spin text-slate-500" />
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
        )}
        
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <span className="text-6xl font-bold text-white animate-bounce">{countdown}</span>
          </div>
        )}

        {isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
                <RefreshCw className="w-10 h-10 text-white animate-spin mb-2" />
                <p className="text-white font-medium">{t.analyzing}</p>
            </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="w-full p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 mb-4 text-sm border border-red-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button 
        onClick={captureAndAnalyze}
        disabled={!stream || isAnalyzing || countdown > 0}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition flex items-center justify-center gap-2
          ${!stream || isAnalyzing 
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
            : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg active:scale-95'
          }`}
      >
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        {t.analyzeButton}
      </button>

      <button onClick={() => { setStep('side-select'); }} className="mt-4 text-slate-400 text-sm hover:text-slate-600">
          {t.exit}
      </button>
    </div>
  );
};

export default EyeAnalysis;
