
import React, { useState, useEffect } from 'react';
import { Maneuver, Language } from '../types';
import HumanModel from './HumanModel';
import { ChevronRight, ChevronLeft, Check, AlertTriangle, Home, Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react';
import { translations } from '../translations';

interface TreatmentGuideProps {
  maneuver: Maneuver;
  onComplete: () => void;
  onBack: () => void;
  lang: Language;
}

const TreatmentGuide: React.FC<TreatmentGuideProps> = ({ maneuver, onComplete, onBack, lang }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showPrecautions, setShowPrecautions] = useState(false);
  
  const t = translations[lang];
  const step = maneuver.steps[currentStepIndex];

  // Initialize timer for the step
  useEffect(() => {
    setTimer(step.durationSeconds);
    setIsTimerRunning(false);
  }, [step]);

  // Timer Loop
  useEffect(() => {
    let interval: any;
    
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleNext = () => {
    if (currentStepIndex < maneuver.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setShowPrecautions(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
        onBack();
    }
  };

  if (showPrecautions) {
      return (
          <div className="flex flex-col h-screen bg-white">
              <div className="p-6 bg-amber-50 border-b border-amber-100">
                  <div className="flex items-center gap-3 text-amber-700 mb-2">
                      <AlertTriangle size={32} />
                      <h2 className="text-2xl font-bold">{t.precautionsTitle}</h2>
                  </div>
                  <p className="text-amber-800 opacity-80">{t.precautionsDesc}</p>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                  <ul className="space-y-4">
                      {maneuver.precautions.map((p, i) => (
                          <li key={i} className="flex gap-3 items-start p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="w-8 h-8 rounded-full bg-medical-100 text-medical-600 flex items-center justify-center flex-shrink-0 font-bold text-lg mt-0.5">
                                  {i+1}
                              </div>
                              <span className="text-slate-700 leading-relaxed font-medium text-lg">{p}</span>
                          </li>
                      ))}
                  </ul>
              </div>
              <div className="p-6 border-t border-slate-200 safe-pb">
                  <button 
                    onClick={onComplete}
                    className="w-full py-4 bg-medical-600 text-white rounded-xl font-bold text-xl hover:bg-medical-700 shadow-lg flex items-center justify-center gap-2"
                  >
                      <Home size={24} />
                      {t.done}
                  </button>
              </div>
          </div>
      )
  }

  const progress = ((currentStepIndex + 1) / maneuver.steps.length) * 100;
  const isTimerDone = timer === 0;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden landscape:flex-row">
      
      {/* 
        LAYOUT STRATEGY: 
        Portrait: Header -> Model -> Controls
        Landscape: Model (Left) -> Sidebar (Right: Header + Text + Controls)
      */}

      {/* --- SECTION 1: 3D MODEL (Flex Grow) --- */}
      <div className="flex-1 relative bg-slate-100 order-2 landscape:order-1 landscape:h-full">
         <div className="w-full h-full relative">
            <HumanModel 
                torsoAngle={step.torsoAngle}
                bodyRoll={step.bodyRoll}
                bodyYaw={step.bodyYaw}
                headYaw={step.headYaw}
                headPitch={step.headPitch}
                legAngle={step.legAngle}
            />
            
            {/* Overlay Title for Landscape (since header is in sidebar) */}
            <div className="absolute top-4 left-4 hidden landscape:block bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-sm font-bold shadow-sm pointer-events-none z-10">
                 {maneuver.name}
            </div>

            {/* View Indicator */}
            <div className="absolute top-4 right-4 landscape:hidden bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm pointer-events-none z-10">
                 {t.humanView}
            </div>
         </div>
      </div>

      {/* --- SECTION 2: CONTROLS & INFO (Sidebar in Landscape) --- */}
      <div className="flex-none flex flex-col z-40 bg-white shadow-xl order-1 landscape:order-2 landscape:w-[400px] landscape:h-full landscape:border-l landscape:border-slate-200">
        
        {/* Header (Portrait Only) */}
        <div className="landscape:hidden p-3 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
                <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{maneuver.name}</h2>
                <div className="w-6" /> 
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-medical-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
        </div>

        {/* Info Content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto bg-white landscape:flex landscape:flex-col landscape:justify-center">
             {/* Progress Bar (Landscape Only) */}
             <div className="hidden landscape:block w-full bg-slate-100 rounded-full h-1.5 mb-6">
              <div 
                className="bg-medical-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>

            <div className="mb-4">
                <span className="text-xs font-black text-medical-600 uppercase tracking-widest mb-1 block">
                    {t.step} {currentStepIndex + 1} / {maneuver.steps.length}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 leading-tight">{step.title}</h3>
                <p className="text-slate-600 text-base leading-relaxed">{step.description}</p>
            </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 md:p-5 border-t border-slate-200 bg-slate-50 safe-pb">
            <div className="flex items-stretch gap-2 md:gap-4 h-14 md:h-20">
                
                {/* Back Button */}
                <button 
                    onClick={handlePrev}
                    className="w-12 md:w-16 flex-none flex items-center justify-center rounded-xl md:rounded-2xl border border-slate-200 text-slate-400 hover:bg-white active:scale-95 transition bg-white"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Timer Button */}
                <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`
                        relative flex-1 min-w-0 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 overflow-hidden
                        ${isTimerDone 
                            ? 'bg-slate-200 text-slate-500 border border-slate-200' 
                            : isTimerRunning 
                                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                : 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                        }
                    `}
                >   
                    {isTimerRunning && (
                            <div 
                            className="absolute left-0 top-0 bottom-0 bg-amber-200/50 transition-all duration-1000 ease-linear"
                            style={{ width: `${((step.durationSeconds - timer) / step.durationSeconds) * 100}%` }}
                            />
                    )}

                    <div className="relative flex items-center gap-1 md:gap-2 z-10 px-1">
                        {isTimerDone ? (
                            <Check size={24} />
                        ) : (
                            <>
                                {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                <span className="text-2xl md:text-3xl font-mono tabular-nums">{timer}s</span>
                                {!isTimerRunning && <span className="text-xs md:text-sm uppercase font-bold hidden sm:inline">{t.startTimer}</span>}
                            </>
                        )}
                    </div>
                </button>

                {/* Reset (Small) */}
                <button 
                        onClick={() => { setTimer(step.durationSeconds); setIsTimerRunning(false); }}
                        className="w-10 md:w-12 flex-none rounded-xl md:rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                    <RotateCcw size={18} />
                </button>

                {/* Next Button */}
                <button 
                    onClick={handleNext}
                    className={`
                        px-3 md:px-6 flex-none rounded-xl md:rounded-2xl font-bold text-white flex items-center justify-center gap-1 transition-all active:scale-95
                        ${isTimerDone 
                            ? 'bg-medical-600 hover:bg-medical-700 shadow-lg shadow-medical-200 ring-2 ring-medical-100' 
                            : 'bg-slate-800 hover:bg-slate-700 opacity-90'
                        }
                    `}
                >
                    <span className="text-sm md:text-lg hidden sm:inline">{currentStepIndex === maneuver.steps.length - 1 ? t.finish : t.nextStep}</span>
                    <ChevronRight size={24} />
                </button>
            </div>
            
            <div className="mt-2 text-center landscape:hidden">
                 <button onClick={onBack} className="text-xs text-slate-400 py-1 px-2">
                     {t.exit}
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TreatmentGuide;
