
import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, ArrowLeft, ArrowRight, SwitchCamera, Upload, Film, ScanEye } from 'lucide-react';
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoFileSrc, setVideoFileSrc] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const t = translations[lang];

  // Cleanup function
  const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
  };

  useEffect(() => {
    return stopStream;
  }, []);

  // --- Video Source Management ---
  // We use the SAME video element for both Camera Stream and File Upload
  // to ensure the browser actually renders the frames (avoiding black screens).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
        // Camera Mode
        video.src = "";
        video.srcObject = stream;
        video.play().catch(e => console.error("Stream play error:", e));
    } else if (videoFileSrc) {
        // Upload Mode
        video.srcObject = null;
        video.src = videoFileSrc;
        // We don't auto-play here; the processing function will handle seeking
    }
  }, [stream, videoFileSrc]);


  // Initialize Camera when entering camera step
  useEffect(() => {
    if (step === 'camera' && !videoFileSrc) {
        startCamera();
    } else {
        stopStream();
    }
  }, [step, facingMode]);


  const startCamera = async () => {
    stopStream();
    setVideoFileSrc(null); // Clear any file
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: facingMode,
            width: { ideal: 1920 }, // Request higher res
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
        } 
      });
      setStream(mediaStream);
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Prepare UI
    stopStream(); 
    setIsAnalyzing(true);
    setIsProcessingUpload(true);
    setError(null);
    setCaptureProgress(0);

    // 2. Load Video into Main Element
    const videoUrl = URL.createObjectURL(file);
    setVideoFileSrc(videoUrl);

    // 3. Trigger processing once video is ready
    // We wait a brief moment for React to update the DOM with the new src
    setTimeout(() => {
        processVideoOnMainElement(videoUrl);
    }, 500);
  };

  const processVideoOnMainElement = async (url: string) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
          setError("Video element missing");
          setIsAnalyzing(false);
          setIsProcessingUpload(false);
          return;
      }

      try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error("No canvas context");

          // Wait for metadata
          await new Promise<void>((resolve, reject) => {
              if (video.readyState >= 1) resolve();
              else {
                  video.onloadedmetadata = () => resolve();
                  video.onerror = () => reject(new Error("Video load failed"));
              }
          });

          // Set dimensions - Higher Resolution for better accuracy
          // Limit max width to 800px to balance quality vs token usage/speed
          const MAX_WIDTH = 800; 
          canvas.width = Math.min(video.videoWidth, MAX_WIDTH);
          canvas.height = (video.videoHeight / video.videoWidth) * canvas.width;

          // Wake up decoder
          try {
              await video.play();
              video.pause();
          } catch(e) { console.log("Autoplay blocked, continuing..."); }

          const duration = (!video.duration || video.duration === Infinity) ? 10 : video.duration;
          const analyzeDuration = Math.min(duration, 10); // Cap at 10s
          const FPS = 12; // Slightly higher FPS
          const totalFrames = Math.floor(analyzeDuration * FPS);
          const frames: string[] = [];

          for (let i = 0; i < totalFrames; i++) {
              const targetTime = i * (1 / FPS);
              video.currentTime = targetTime;

              // Wait for seek
              await new Promise<void>(resolve => {
                  const onSeek = () => {
                      video.removeEventListener('seeked', onSeek);
                      resolve();
                  };
                  video.addEventListener('seeked', onSeek);
                  // Backup timeout if seeked doesn't fire
                  setTimeout(onSeek, 500); 
              });

              // Force paint wait
              await new Promise(r => requestAnimationFrame(r));
              
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL('image/jpeg', 0.85)); // Higher quality JPEG
              
              setCaptureProgress(Math.round(((i + 1) / totalFrames) * 80));
          }

          // Processing Done
          setCaptureProgress(100);
          URL.revokeObjectURL(url);
          
          await performAnalysis(frames);

      } catch (err) {
          console.error("Processing failed:", err);
          setError("Failed to process video file.");
          setIsAnalyzing(false);
          setIsProcessingUpload(false);
          startCamera(); // Reset to camera
      }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countInterval);
          executeLiveCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeLiveCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Safety check
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0 || videoRef.current.readyState < 2) {
        setError(t.cameraInactive || "Camera not ready");
        return;
    }

    setIsAnalyzing(true);
    setCaptureProgress(0);
    setError(null);
    
    try {
        const frames: string[] = [];
        const context = canvasRef.current.getContext('2d');
        
        if (context) {
            // Higher Resolution Capture for Live
            const MAX_WIDTH = 800;
            const scale = Math.min(1, MAX_WIDTH / videoRef.current.videoWidth); 
            canvasRef.current.width = videoRef.current.videoWidth * scale;
            canvasRef.current.height = videoRef.current.videoHeight * scale;

            // Capture 100 frames over ~10 seconds
            const frameCount = 100;
            const interval = 100; // ms

            for (let i = 0; i < frameCount; i++) {
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                frames.push(canvasRef.current.toDataURL('image/jpeg', 0.85)); // High quality
                
                setCaptureProgress(Math.round(((i + 1) / frameCount) * 100));
                
                if (i < frameCount - 1) await new Promise(r => setTimeout(r, interval));
            }
            
            await performAnalysis(frames);
        }
    } catch (err) {
        console.error("Diagnosis error:", err);
        setError("Analysis failed. Please try again.");
        setIsAnalyzing(false);
    }
  };

  const performAnalysis = async (frames: string[]) => {
      try {
        const result = await analyzeEyeMovement(frames, lang);
        // Inject the selected side into the result if AI is unsure
        if (result.hasBPPV && !result.side && selectedSide) {
             result.side = selectedSide;
        }
        onDiagnosisComplete(result);
      } catch (err) {
        console.error("Gemini API Error", err);
        setError("AI Service unavailable. Please try again.");
      } finally {
        setIsAnalyzing(false);
        setIsProcessingUpload(false);
        setCaptureProgress(0);
        // Don't auto-restart camera here, let the user see the result screen
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
      
      const torsoAngle = isTurn ? 90 : 0;
      const bodyRoll = 0;
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
      
      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef} 
          accept="video/*" 
          className="hidden" 
          onChange={handleFileChange}
      />

      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-6 h-6 text-medical-600" />
            {t.nystagmusAnalysis}
        </h2>
        
        <div className="flex gap-2">
            {/* Upload Button */}
            <button 
                onClick={handleUploadClick}
                disabled={isAnalyzing}
                className="p-2 bg-slate-100 rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition border border-transparent hover:border-blue-200"
                title={t.uploadVideo}
            >
                <Upload size={20} />
            </button>
            {/* Camera Switch */}
            <button 
                onClick={toggleCamera} 
                disabled={isAnalyzing || !!videoFileSrc}
                className={`p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition ${!!videoFileSrc ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={t.switchCamera}
            >
                <SwitchCamera size={20} />
            </button>
        </div>
      </div>
      
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-inner transform-gpu">
        {/* State: No Stream and No File */}
        {!stream && !videoFileSrc ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <RefreshCw className="animate-spin text-slate-500" />
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            // If facing user, mirror. If playing a file (videoFileSrc), NEVER mirror.
            className={`w-full h-full object-cover transition-transform ${facingMode === 'user' && !videoFileSrc ? 'scale-x-[-1]' : ''}`}
          />
        )}
        
        {/* Eye Alignment Guide Overlay */}
        {!isAnalyzing && !videoFileSrc && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-48 h-32 border-2 border-dashed border-white/50 rounded-2xl flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-1 opacity-70">
                    <ScanEye className="text-white w-8 h-8" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Place Eye Here' : '眼睛对准此处'}</span>
                </div>
             </div>
          </div>
        )}
        
        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
            <span className="text-6xl font-bold text-white animate-bounce">{countdown}</span>
          </div>
        )}

        {/* Capturing / Analyzing Overlay */}
        {isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-40 transition-opacity duration-300">
                <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                     <RefreshCw className="w-10 h-10 text-white animate-spin absolute" />
                </div>
                
                {captureProgress < 100 ? (
                    <div className="flex flex-col items-center">
                        <p className="text-white font-bold text-lg mb-2">
                            {isProcessingUpload ? t.processingVideo : t.capturing} {captureProgress}%
                        </p>
                        <p className="text-white/70 text-sm text-center px-4">
                             {isProcessingUpload ? "Extracting frames..." : t.keepSteady}
                        </p>
                    </div>
                ) : (
                    <p className="text-white font-medium animate-pulse">{t.analyzing}</p>
                )}
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

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
          {/* Capture Button */}
          <button 
            onClick={captureAndAnalyze}
            disabled={!stream || isAnalyzing || countdown > 0}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition flex items-center justify-center gap-2
              ${!stream || isAnalyzing 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg active:scale-95'
              }`}
          >
            <div className={`w-3 h-3 bg-white rounded-full ${isAnalyzing ? '' : 'animate-pulse'}`} />
            {t.analyzeButton}
          </button>

          {/* Upload Button */}
          <button 
              onClick={handleUploadClick}
              disabled={isAnalyzing}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition shadow-md flex items-center justify-center gap-2"
          >
              <Film size={20} />
              {lang === 'en' ? 'Upload existing video' : '上传已录制视频'}
          </button>
      </div>

      <button onClick={() => { setStep('side-select'); }} disabled={isAnalyzing} className="mt-4 text-slate-400 text-sm hover:text-slate-600">
          {t.exit}
      </button>
    </div>
  );
};

export default EyeAnalysis;
