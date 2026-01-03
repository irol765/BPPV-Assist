
import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, ArrowLeft, ArrowRight, SwitchCamera, Upload, Film, ScanEye, Zap, ZapOff } from 'lucide-react';
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
  
  // 新增：屏幕补光开关（默认开启）
  const [enableScreenFlash, setEnableScreenFlash] = useState(true);
  
  const t = translations[lang];

  // 核心参数：感兴趣区域 (ROI) 占比
  // 截取画面中心 40% 的区域。这对于前置摄像头拍摄眼睛特写至关重要。
  // 既能去除无关背景，又能保证发给 AI 的图片保留了原始分辨率的像素密度。
  const ROI_FACTOR = 0.4; 

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
            // 请求尽可能高的分辨率，以便裁剪后依然清晰
            width: { ideal: 1920 }, 
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
    setTimeout(() => {
        processVideoOnMainElement(videoUrl);
    }, 500);
  };

  /**
   * 辅助函数：绘制 ROI (裁剪中心区域)
   * 这一步极大地提高了 AI 在手机前置摄像头场景下的准确率
   */
  const drawRoiFrame = (
    ctx: CanvasRenderingContext2D, 
    video: HTMLVideoElement, 
    targetWidth: number, 
    targetHeight: number
  ) => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    
    // 计算裁剪区域 (源图像的中心部分)
    const sWidth = vw * ROI_FACTOR;
    const sHeight = vh * ROI_FACTOR;
    const sx = (vw - sWidth) / 2;
    const sy = (vh - sHeight) / 2;

    // 绘制：将源图像中心的一小块 (sx, sy, sWidth, sHeight) 
    // 放大/绘制到整个 Canvas 上 (0, 0, targetWidth, targetHeight)
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
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

          // 设置 Canvas 尺寸
          // 裁剪后的逻辑像素尺寸。保持源视频的纵横比，但只取中心区域。
          // 比如 1920x1080 -> 裁剪中心 40% -> 实际有效像素约 768x432
          // 我们将 Canvas 设为这个尺寸，保证像素 1:1 映射，不浪费带宽也不损失精度
          const roiWidth = video.videoWidth * ROI_FACTOR;
          const roiHeight = video.videoHeight * ROI_FACTOR;
          
          // 限制最大传输尺寸 (Gemini Payload Limit & Bandwidth)
          // 如果裁剪后的尺寸依然巨大 (如 4K 视频)，则限制在 640px 宽，等比缩放
          const MAX_CANVAS_WIDTH = 640;
          const scale = Math.min(1, MAX_CANVAS_WIDTH / roiWidth);
          
          canvas.width = roiWidth * scale;
          canvas.height = roiHeight * scale;

          // Wake up decoder
          try {
              await video.play();
              video.pause();
          } catch(e) { console.log("Autoplay blocked, continuing...", e); }

          const duration = (!video.duration || video.duration === Infinity) ? 10 : video.duration;
          const analyzeDuration = Math.min(duration, 10); 
          
          // 提高 FPS 至 20，以捕捉更细腻的眼震
          const FPS = 20; 
          const totalFrames = Math.floor(analyzeDuration * FPS);
          const frames: string[] = [];

          for (let i = 0; i < totalFrames; i++) {
              const targetTime = Math.min(i * (1 / FPS), duration - 0.1); 
              video.currentTime = targetTime;

              await new Promise<void>(resolve => {
                  const onSeek = () => {
                      video.removeEventListener('seeked', onSeek);
                      resolve();
                  };
                  video.addEventListener('seeked', onSeek);
                  setTimeout(onSeek, 300); 
              });

              // Force paint
              await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
              
              // 使用 ROI 裁剪绘制
              drawRoiFrame(ctx, video, canvas.width, canvas.height);
              
              frames.push(canvas.toDataURL('image/jpeg', 0.85));
              
              setCaptureProgress(Math.round(((i + 1) / totalFrames) * 80));
          }

          setCaptureProgress(100);
          URL.revokeObjectURL(url);
          
          await performAnalysis(frames);

      } catch (err) {
          console.error("Processing failed:", err);
          setError("Failed to process video file.");
          setIsAnalyzing(false);
          setIsProcessingUpload(false);
          startCamera(); 
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
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
            // 逻辑与上传处理一致：只处理 ROI 区域
            const roiWidth = videoRef.current.videoWidth * ROI_FACTOR;
            const roiHeight = videoRef.current.videoHeight * ROI_FACTOR;
            
            const MAX_CANVAS_WIDTH = 640;
            const scale = Math.min(1, MAX_CANVAS_WIDTH / roiWidth);
            
            canvasRef.current.width = roiWidth * scale;
            canvasRef.current.height = roiHeight * scale;

            // 提高 FPS 至 20 (interval 50ms), 录制 10 秒 (200帧)
            const frameCount = 200;
            const interval = 50; // ms

            for (let i = 0; i < frameCount; i++) {
                // 使用 ROI 裁剪绘制
                drawRoiFrame(ctx, videoRef.current, canvasRef.current.width, canvasRef.current.height);

                frames.push(canvasRef.current.toDataURL('image/jpeg', 0.85)); 
                
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
        const currentTestSide = selectedSide || 'UNKNOWN';
        const result = await analyzeEyeMovement(frames, lang, currentTestSide);

        if (result.hasBPPV && !result.side && selectedSide) {
             result.side = selectedSide;
        }

        onDiagnosisComplete(result);
      } catch (err) {
        console.error("Gemini API Error", err);
        setError(lang === 'zh' 
          ? "AI 服务连接失败，请检查网络或稍后重试。" 
          : "AI Service unavailable. Please check network or try again.");
      } finally {
        setIsAnalyzing(false);
        setIsProcessingUpload(false);
        setCaptureProgress(0);
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

      // Ensure correct sitting posture (legs horizontal) for Step 1
      const legAngle = isTurn ? 90 : 0; 
      const kneeAngle = 0; 
      const armAngle = 0;
      const elbowAngle = isTurn ? 10 : 0;
      const yOffset = 0;

      return (
          <div className="flex flex-col w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="h-64 bg-slate-100 relative">
                  <HumanModel 
                    torsoAngle={torsoAngle}
                    bodyRoll={bodyRoll}
                    headYaw={headYaw} 
                    headPitch={headPitch}
                    legAngle={legAngle}
                    kneeAngle={kneeAngle}
                    armAngle={armAngle}
                    elbowAngle={elbowAngle}
                    yOffset={yOffset}
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
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 bg-white rounded-2xl shadow-lg border border-slate-100 relative">
      
      {/* 
        SCREEN LIGHT (补光灯) 
        当开启倒计时或录制时，全屏显示一个高亮白色覆盖层。
        使用 radial-gradient 创建一个中间透明（透出视频引导框）但四周纯白的遮罩。
        pointer-events-none 确保不阻挡点击。
        z-index 设为 60 以覆盖大部分 UI。
      */}
      {enableScreenFlash && (isAnalyzing || countdown > 0) && !isProcessingUpload && (
        <div 
          className="fixed inset-0 z-[60] pointer-events-none transition-opacity duration-300"
          style={{
            // 中间透明圆孔，四周纯白
            background: 'radial-gradient(circle, transparent 25%, #ffffff 45%, #ffffff 100%)',
            opacity: 0.95 
          }}
        />
      )}

      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef} 
          accept="video/*" 
          className="hidden" 
          onChange={handleFileChange}
      />

      <div className="flex items-center justify-between w-full mb-4 relative z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-6 h-6 text-medical-600" />
            {t.nystagmusAnalysis}
        </h2>
        
        <div className="flex gap-2">
             {/* Screen Flash Toggle */}
            <button
              onClick={() => setEnableScreenFlash(!enableScreenFlash)}
              disabled={isAnalyzing}
              className={`p-2 rounded-full transition border ${enableScreenFlash ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-slate-100 text-slate-400 border-transparent'}`}
              title={lang === 'zh' ? '屏幕补光' : 'Screen Light'}
            >
              {enableScreenFlash ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
            </button>

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
      
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-inner transform-gpu z-10">
        {!stream && !videoFileSrc ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <RefreshCw className="animate-spin text-slate-500" />
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            // @ts-ignore
            webkit-playsinline="true"
            muted
            className={`w-full h-full object-cover transition-transform ${facingMode === 'user' && !videoFileSrc ? 'scale-x-[-1]' : ''}`}
          />
        )}
        
        {/* Eye Alignment Guide Overlay - 改为绿色增强对比度，并根据 ROI 比例调整大小示意 */}
        {!isAnalyzing && !videoFileSrc && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {/* 
                假设 ROI 是 40% (0.4)。
                如果视频容器宽 W，引导框应该是 0.4W 左右。
                Tailwind w-1/2 (50%) 或 w-2/5 (40%) 比较合适。
             */}
             <div className="w-2/5 aspect-video border-2 border-dashed border-green-400/80 rounded-xl flex items-center justify-center bg-black/10 backdrop-blur-[1px] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
                <div className="flex flex-col items-center gap-1 opacity-90">
                    <ScanEye className="text-green-400 w-8 h-8 drop-shadow-md" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider drop-shadow-md">{lang === 'en' ? 'Place Eye Here' : '眼睛对准此处'}</span>
                </div>
             </div>
          </div>
        )}
        
        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-30">
            <span className="text-8xl font-black text-white animate-bounce drop-shadow-lg">{countdown}</span>
          </div>
        )}

        {/* Capturing / Analyzing Overlay */}
        {isAnalyzing && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 transition-opacity duration-300 ${
                        (!isProcessingUpload && captureProgress < 100) 
                            ? 'bg-transparent opacity-0' 
                            : 'bg-black/80 backdrop-blur-sm opacity-100'
                    }`} 
                />

                {/* Status Box */}
                <div className="relative z-10 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl flex flex-col items-center shadow-2xl border border-white/10 max-w-[80%] pointer-events-auto">
                    <div className="w-12 h-12 relative flex items-center justify-center mb-4">
                        <RefreshCw className="w-8 h-8 text-medical-400 animate-spin absolute" />
                    </div>
                    
                    {captureProgress < 100 ? (
                        <div className="flex flex-col items-center">
                            <p className="text-white font-bold text-lg mb-1 tabular-nums">
                                {isProcessingUpload ? t.processingVideo : t.capturing} {captureProgress}%
                            </p>
                            <p className="text-slate-300 text-xs text-center">
                                {isProcessingUpload ? "Cropping ROI..." : t.keepSteady}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-pulse">
                            <p className="text-white font-bold text-lg mb-1">{t.analyzing}</p>
                            <p className="text-slate-300 text-xs">AI Processing...</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      <canvas 
        ref={canvasRef} 
        style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            opacity: 0, 
            pointerEvents: 'none', 
            zIndex: -1,
            width: '1px',
            height: '1px'
        }} 
      />

      {error && (
        <div className="w-full p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 mb-4 text-sm border border-red-100 relative z-10">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-3 w-full relative z-10">
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

      <button onClick={() => { setStep('side-select'); }} disabled={isAnalyzing} className="mt-4 text-slate-400 text-sm hover:text-slate-600 relative z-10">
          {t.exit}
      </button>
    </div>
  );
};

export default EyeAnalysis;
