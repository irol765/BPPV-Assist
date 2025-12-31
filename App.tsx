import React, { useState } from 'react';
import { Activity, Brain, Rotate3D, ShieldCheck, Globe, ArrowLeft, ChevronRight, Play, Home } from 'lucide-react';
import EyeAnalysis from './components/EyeAnalysis';
import TreatmentGuide from './components/TreatmentGuide';
import { DiagnosisResult, Maneuver, CanalType, Side, Language } from './types';
import { getManeuvers } from './constants';
import { translations } from './translations';

enum AppState {
  HOME,
  DIAGNOSIS,
  RESULT,
  TREATMENT,
  SIDE_SELECT
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [selectedManeuver, setSelectedManeuver] = useState<Maneuver | null>(null);
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese

  const t = translations[lang];
  const MANEUVERS = getManeuvers(lang);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleDiagnosisComplete = (result: DiagnosisResult) => {
    setDiagnosis(result);
    setAppState(AppState.RESULT);
  };

  const startTreatment = (maneuver: Maneuver) => {
    setSelectedManeuver(maneuver);
    setAppState(AppState.TREATMENT);
  };

  // 修改：放宽推荐逻辑，只要有侧别就推荐 Epley
  const getRecommendedManeuver = (diag: DiagnosisResult): Maneuver | null => {
    // 如果没病，或者连左右都不知道，则无法推荐
    if (!diag.hasBPPV || !diag.side) return null;
    
    // 默认只要确定了左右，就推荐对应侧的 Epley 复位法 (针对最常见的后半规管 BPPV)
    if (diag.side === Side.RIGHT) {
        return MANEUVERS.EPLEY_RIGHT;
    } else {
        return MANEUVERS.EPLEY_LEFT;
    }
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-lg mx-auto relative">
      <button 
        onClick={toggleLang} 
        className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm"
      >
        <Globe size={14} />
        {lang === 'en' ? 'CN' : 'EN'}
      </button>

      <div className="w-20 h-20 bg-medical-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-medical-100">
        <Rotate3D className="w-10 h-10 text-medical-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.title}</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">
        {t.description}
      </p>

      <div className="grid gap-4 w-full">
        <button 
          onClick={() => setAppState(AppState.DIAGNOSIS)}
          className="flex items-center p-4 bg-white border border-medical-200 rounded-xl shadow-sm hover:shadow-md transition group text-left"
        >
          <div className="w-12 h-12 bg-medical-100 rounded-full flex items-center justify-center text-medical-600 group-hover:bg-medical-600 group-hover:text-white transition mr-4 flex-shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <div className="font-bold text-slate-800">{t.startDiagnosis}</div>
            <div className="text-sm text-slate-500">{t.startDiagnosisDesc}</div>
          </div>
        </button>

        <button 
          onClick={() => setAppState(AppState.SIDE_SELECT)}
          className="flex items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition group text-left"
        >
           <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition mr-4 flex-shrink-0">
            <Brain size={24} />
          </div>
          <div>
            <div className="font-bold text-slate-800">{t.directTreatment}</div>
            <div className="text-sm text-slate-500">{t.directTreatmentDesc}</div>
          </div>
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-400 max-w-xs">
        {t.disclaimer}
      </p>
    </div>
  );

  const renderSideSelect = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
      <button 
        onClick={() => setAppState(AppState.HOME)} 
        className="absolute top-6 left-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
      >
        <ArrowLeft size={24} />
      </button>

      <h2 className="text-2xl font-bold text-slate-900 mb-8">{t.selectSide}</h2>
      
      <div className="grid gap-4 w-full max-w-sm">
        <button 
          onClick={() => startTreatment(MANEUVERS.EPLEY_LEFT)}
          className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-medical-500 transition group"
        >
          <div className="flex flex-col text-left">
             <span className="font-bold text-xl text-slate-800">{t.repositionLeft}</span>
             <span className="text-sm text-slate-500">Left Ear</span>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-medical-600 w-6 h-6" />
        </button>

        <button 
          onClick={() => startTreatment(MANEUVERS.EPLEY_RIGHT)}
          className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-medical-500 transition group"
        >
           <div className="flex flex-col text-left">
             <span className="font-bold text-xl text-slate-800">{t.repositionRight}</span>
             <span className="text-sm text-slate-500">Right Ear</span>
          </div>
           <ChevronRight className="text-slate-300 group-hover:text-medical-600 w-6 h-6" />
        </button>
      </div>
    </div>
  );

  const renderDiagnosis = () => (
    <div className="min-h-screen bg-slate-50 pt-10 px-4">
        <div className="max-w-md mx-auto">
            <button onClick={() => setAppState(AppState.HOME)} className="mb-6 text-slate-500 flex items-center gap-1 hover:text-slate-800">
                <ArrowLeft size={20} /> {t.backHome}
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.nystagmusAnalysis}</h2>
            <p className="text-slate-600 mb-6">{t.nystagmusAnalysisDesc}</p>
            <EyeAnalysis onDiagnosisComplete={handleDiagnosisComplete} lang={lang} />
        </div>
    </div>
  );

  const renderResult = () => {
    if (!diagnosis) return null;
    const recommended = getRecommendedManeuver(diagnosis);

    // 判断状态以设置不同的样式
    const isPositive = diagnosis.hasBPPV;
    const resultBgClass = isPositive ? 'bg-amber-50' : 'bg-slate-50';
    const iconColorClass = isPositive ? 'text-amber-600' : 'text-slate-400';

    return (
      <div className="min-h-screen bg-slate-50 pt-10 px-4 flex flex-col items-center">
         <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            {/* 结果头部 */}
            <div className={`p-6 ${resultBgClass}`}>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ShieldCheck className={`w-6 h-6 ${iconColorClass}`} />
                    {t.analysisResults}
                </h2>
                
                <div className="space-y-4">
                    <div className="flex justify-between border-b border-black/5 pb-2">
                        <span className="text-slate-500">{t.confidence}</span>
                        <span className="font-mono font-bold text-slate-700">{(diagnosis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {isPositive ? (
                        <>
                             <div className="flex justify-between border-b border-black/5 pb-2">
                                <span className="text-slate-500">{t.affectedSide}</span>
                                {/* 显示大号的患侧提示 */}
                                <span className="font-bold text-red-600 text-xl">
                                    {diagnosis.side === Side.LEFT 
                                        ? (lang === 'zh' ? '左侧 (Left)' : 'Left') 
                                        : (lang === 'zh' ? '右侧 (Right)' : 'Right')}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-2">
                                <span className="text-slate-500">{t.affectedCanal}</span>
                                <span className="font-bold text-amber-700">
                                    {/* 如果没看清半规管，显示推测信息 */}
                                    {diagnosis.canal || (lang === 'zh' ? '后半规管 (疑似)' : 'Posterior (Suspected)')}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-600 font-medium py-2">
                            {t.noBppv}
                        </div>
                    )}
                </div>

                <div className="mt-4 p-3 bg-white/80 rounded-lg border border-black/5 text-sm text-slate-600 italic leading-relaxed">
                    "{diagnosis.reasoning}"
                </div>
            </div>

            {/* 操作区：根据结果显示不同按钮 */}
            <div className="p-6 bg-white safe-pb">
                {isPositive && recommended ? (
                    <div className="animate-pulse-slow">
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            ✅ {t.recommendedTreatment}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            {lang === 'zh' 
                                ? `检测到${diagnosis.side === Side.LEFT ? '左' : '右'}侧问题，请立即跟随指导进行 Epley 复位：` 
                                : `Detected ${diagnosis.side} side issue. Start Epley maneuver immediately:`}
                        </p>
                        <button 
                            onClick={() => startTreatment(recommended)}
                            className="w-full py-4 bg-medical-600 text-white rounded-xl font-bold text-lg hover:bg-medical-700 shadow-xl shadow-medical-200 transition transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Play className="fill-current" />
                            {lang === 'zh' ? '开始复位 (跟着做)' : 'Start Treatment'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">{t.nextSteps}</h3>
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                             {lang === 'zh' 
                                ? "当前侧未检测到明显眼震。如果您依然感到眩晕，强烈建议尝试测试另一侧。"
                                : "No nystagmus detected on this side. If you are still dizzy, please try testing the other side."}
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setAppState(AppState.HOME)}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2"
                            >
                                <Home size={18} />
                                {t.backHome}
                            </button>
                             {/* 方便用户直接去测另一边 */}
                             <button 
                                onClick={() => setAppState(AppState.SIDE_SELECT)}
                                className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-medical-500 hover:text-medical-600 transition flex items-center justify-center gap-2"
                            >
                                <Rotate3D size={18} />
                                {lang === 'zh' ? '测另一侧' : 'Test Other Side'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="font-sans text-slate-900">
      {appState === AppState.HOME && renderHome()}
      {appState === AppState.DIAGNOSIS && renderDiagnosis()}
      {appState === AppState.RESULT && renderResult()}
      {appState === AppState.SIDE_SELECT && renderSideSelect()}
      {appState === AppState.TREATMENT && selectedManeuver && (
        <TreatmentGuide 
          maneuver={selectedManeuver}
          onComplete={() => setAppState(AppState.HOME)}
          onBack={() => setAppState(AppState.HOME)}
          lang={lang}
        />
      )}
    </div>
  );
}

export default App;