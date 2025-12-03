
import React, { useState, useEffect } from 'react';
import { Maneuver, Language } from '../types';
import HumanModel from './HumanModel';
import { ChevronRight, ChevronLeft, Check, AlertTriangle, Home, Play, Pause, RotateCcw } from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 bg-white border-b border-slate-200 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-base font-medium px-2">
                &larr; {t.exit}
            </button>
            <h2 className="font-bold text-slate-800 text-base md:text-lg truncate max-w-[200px]">{maneuver.name}</h2>
            <div className="w-8" />
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className="bg-medical-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Main Content Area - Full Screen Human Model */}
      <div className="flex-1 relative overflow-hidden bg-slate-100">
         <div className="w-full h-full relative">
            <HumanModel 
                torsoAngle={step.torsoAngle}
                bodyRoll={step.bodyRoll}
                bodyYaw={step.bodyYaw}
                headYaw={step.headYaw}
                headPitch={step.headPitch}
                legAngle={step.legAngle}
            />
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-sm font-bold text-slate-700 shadow-sm pointer-events-none z-10">
                 {t.humanView}
            </div>
         </div>
      </div>

      {/* Controls Footer */}
      <div className="flex-none bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="p-5 safe-pb max-w-4xl mx-auto w-full">
            
            {/* Step Info */}
            <div className="mb-6">
                <span className="text-sm font-black text-medical-600 uppercase tracking-widest mb-2 block">
                    {t.step} {currentStepIndex + 1} / {maneuver.steps.length}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">{step.title}</h3>
                <p className="text-slate-600 text-lg md:text-xl leading-relaxed">{step.description}</p>
            </div>

            {/* Action Bar */}
            <div className="flex items-stretch gap-4 h-20 md:h-24">
                
                {/* Back Button */}
                <button 
                    onClick={handlePrev}
                    className="w-16 flex items-center justify-center rounded-2xl border-2 border-slate-100 text-slate-400 font-bold hover:bg-slate-50 active:scale-95 transition"
                >
                    <ChevronLeft size={32} />
                </button>

                {/* Main Action Area */}
                <div className="flex-1 flex gap-4">
                    {/* Timer Button */}
                    <button 
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`
                            relative flex-1 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 overflow-hidden
                            ${isTimerDone 
                                ? 'bg-slate-100 text-slate-400 border-2 border-slate-100' // Finished state
                                : isTimerRunning 
                                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' // Running state
                                    : 'bg-orange-500 text-white shadow-xl shadow-orange-200 animate-pulse' // Ready to start
                            }
                        `}
                    >   
                        {/* Background Progress Bar effect for timer */}
                        {isTimerRunning && (
                             <div 
                                className="absolute left-0 top-0 bottom-0 bg-amber-200/50 transition-all duration-1000 ease-linear"
                                style={{ width: `${((step.durationSeconds - timer) / step.durationSeconds) * 100}%` }}
                             />
                        )}

                        <div className="relative flex items-center gap-3 z-10">
                            {isTimerDone ? (
                                <>
                                    <Check size={32} />
                                    <span className="text-xl">{lang === 'zh' ? '计时结束' : 'Complete'}</span>
                                </>
                            ) : (
                                <>
                                    {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={40} fill="currentColor" />}
                                    <span className="text-4xl md:text-5xl font-mono tabular-nums tracking-wider">{timer}s</span>
                                    {/* Text always visible */}
                                    {!isTimerRunning && <span className="text-lg uppercase tracking-wide ml-2 font-bold whitespace-nowrap">{t.startTimer}</span>}
                                </>
                            )}
                        </div>
                    </button>

                    {/* Reset Timer (Mini) */}
                    <button 
                         onClick={() => { setTimer(step.durationSeconds); setIsTimerRunning(false); }}
                         className="w-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                         title="Reset Timer"
                    >
                        <RotateCcw size={24} />
                    </button>

                    {/* Next Button - Always Enabled */}
                    <button 
                        onClick={handleNext}
                        className={`
                            px-8 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95
                            ${isTimerDone 
                                ? 'bg-medical-600 hover:bg-medical-700 shadow-xl shadow-medical-200 ring-4 ring-medical-100' 
                                : 'bg-slate-800 hover:bg-slate-700 opacity-90'
                            }
                        `}
                    >
                        <span className="text-lg">{currentStepIndex === maneuver.steps.length - 1 ? t.finish : t.nextStep}</span>
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentGuide;
