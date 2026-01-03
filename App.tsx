import React, { useState } from 'react';
import { Activity, Brain, Rotate3D, ShieldCheck, Globe, ArrowLeft, ChevronRight, Play, Home, Info, AlertTriangle } from 'lucide-react';
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

  const renderManeuverButton = (maneuver: Maneuver, labelOverride?: string, subLabelOverride?: string) => (
      <button 
          key={maneuver.id}
          onClick={() => startTreatment(maneuver)}
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-medical-500 transition group mb-3 w-full"
      >
          <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{labelOverride || maneuver.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                      ${maneuver.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
                        maneuver.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {maneuver.difficulty}
                  </span>
              </div>
              <span className="text-xs text-slate-500 mt-1 line-clamp-1">{subLabelOverride || maneuver.description}</span>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-medical-600 w-5 h-5 flex-shrink-0" />
      </button>
  );

  const renderSideSelect = () => {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 shadow-sm flex items-center gap-3">
                <button 
                    onClick={() => setAppState(AppState.HOME)} 
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-900">{lang === 'zh' ? '选择复位方案' : 'Select Treatment'}</h2>
            </div>

            <div className="p-4 max-w-md mx-auto w-full">
                
                {/* Posterior Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        {lang === 'zh' ? '后半规管 (最常见)' : 'Posterior Canal (Common)'}
                        <Info size={14} />
                    </h3>
                    <div className="space-y-3">
                        {/* Epley Group */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                             <div className="text-medical-600 font-bold mb-3 text-sm flex items-center gap-2">
                                <ShieldCheck size={16} /> Epley (Standard)
                             </div>
                             {renderManeuverButton(MANEUVERS.EPLEY_RIGHT)}
                             {renderManeuverButton(MANEUVERS.EPLEY_LEFT)}
                        </div>

                        {/* Foster Group */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                             <div className="text-indigo-600 font-bold mb-3 text-sm flex items-center gap-2">
                                <Home size={16} /> Foster (Home Friendly)
                             </div>
                             {renderManeuverButton(MANEUVERS.FOSTER_RIGHT)}
                             {renderManeuverButton(MANEUVERS.FOSTER_LEFT)}
                        </div>
                    </div>
                </div>

                {/* Horizontal Section */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        {lang === 'zh' ? '水平半规管 (躺下晕)' : 'Horizontal Canal'}
                        <Info size={14} />
                    </h3>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <div className="text-orange-600 font-bold mb-3 text-sm flex items-center gap-2">
                             <Rotate3D size={16} /> BBQ Roll
                        </div>
                        {renderManeuverButton(MANEUVERS.BBQ_RIGHT)}
                        {renderManeuverButton(MANEUVERS.BBQ_LEFT)}
                    </div>
                </div>

            </div>
        </div>
    );
  };

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

    // 判断状态以设置不同的样式
    const isPositive = diagnosis.hasBPPV;
    const resultBgClass = isPositive ? 'bg-amber-50' : 'bg-slate-50';
    const iconColorClass = isPositive ? 'text-amber-600' : 'text-slate-400';

    // 辅助函数：根据侧别获取该侧所有的复位法对象
    const getManeuversForSide = (s: Side) => {
        const suffix = s === Side.LEFT ? 'LEFT' : 'RIGHT';
        return {
            epley: MANEUVERS[`EPLEY_${suffix}`],
            foster: MANEUVERS[`FOSTER_${suffix}`],
            bbq: MANEUVERS[`BBQ_${suffix}`]
        };
    };

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
                                    {/* 优先显示 Canal Type，如果没有则显示疑似 */}
                                    {diagnosis.canal ? 
                                        (lang === 'zh' 
                                            ? (diagnosis.canal === CanalType.POSTERIOR ? '后半规管 (Posterior)' 
                                              : diagnosis.canal === CanalType.HORIZONTAL ? '水平半规管 (Horizontal)' 
                                              : '上半规管 (Anterior)')
                                            : diagnosis.canal
                                        )
                                        : (lang === 'zh' ? '后半规管 (疑似)' : 'Posterior (Suspected)')}
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
                {isPositive && diagnosis.side ? (
                    <div className="animate-pulse-slow">
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            ✅ {t.recommendedTreatment}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            {lang === 'zh' 
                                ? "根据诊断结果，以下是适合您的复位方案：" 
                                : "Based on diagnosis, choose a treatment:"}
                        </p>

                        {/* --- Posterior Canal (or Unknown/Default) Logic --- */}
                        {(diagnosis.canal === CanalType.POSTERIOR || !diagnosis.canal) && (() => {
                            const { epley, foster } = getManeuversForSide(diagnosis.side!);
                            return (
                                <div className="space-y-3">
                                    {/* Epley Option */}
                                    <button 
                                        onClick={() => startTreatment(epley)}
                                        className="w-full p-4 bg-medical-50 border border-medical-200 rounded-xl hover:bg-medical-100 transition text-left flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-bold text-medical-700 flex items-center gap-2">
                                                <ShieldCheck size={18} />
                                                {lang === 'zh' ? 'Epley 复位法 (标准)' : 'Epley (Standard)'}
                                            </div>
                                            <div className="text-xs text-medical-600/70 mt-1">
                                                {lang === 'zh' ? '诊所常用，需头部悬空，成功率高' : 'Clinic standard. High success rate.'}
                                            </div>
                                        </div>
                                        <ChevronRight className="text-medical-400 group-hover:text-medical-700" />
                                    </button>

                                    {/* Foster Option */}
                                    <button 
                                        onClick={() => startTreatment(foster)}
                                        className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition text-left flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-bold text-indigo-700 flex items-center gap-2">
                                                <Home size={18} />
                                                {lang === 'zh' ? 'Foster 半筋斗法 (推荐自救)' : 'Foster (Home Friendly)'}
                                            </div>
                                            <div className="text-xs text-indigo-600/70 mt-1">
                                                {lang === 'zh' ? '无需悬头，操作舒适，适合在家进行' : 'Easier neck position. Good for home.'}
                                            </div>
                                        </div>
                                        <ChevronRight className="text-indigo-400 group-hover:text-indigo-700" />
                                    </button>
                                </div>
                            );
                        })()}

                        {/* --- Horizontal Canal Logic --- */}
                        {diagnosis.canal === CanalType.HORIZONTAL && (() => {
                            const { bbq } = getManeuversForSide(diagnosis.side!);
                            return (
                                <div>
                                     <button 
                                        onClick={() => startTreatment(bbq)}
                                        className="w-full p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition text-left flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-bold text-orange-700 flex items-center gap-2">
                                                <Rotate3D size={18} />
                                                {lang === 'zh' ? 'BBQ 翻滚法' : 'BBQ Roll'}
                                            </div>
                                            <div className="text-xs text-orange-600/70 mt-1">
                                                {lang === 'zh' ? '针对水平半规管的特效复位法' : 'Specific for Horizontal Canal BPPV.'}
                                            </div>
                                        </div>
                                        <ChevronRight className="text-orange-400 group-hover:text-orange-700" />
                                    </button>
                                </div>
                            );
                        })()}

                         {/* --- Anterior Canal Logic --- */}
                         {diagnosis.canal === CanalType.ANTERIOR && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-red-700 text-sm">
                                        {lang === 'zh' ? '上半规管复位较为复杂' : 'Complex Maneuver Required'}
                                    </div>
                                    <div className="text-xs text-red-600/80 mt-1 leading-relaxed">
                                        {lang === 'zh' 
                                            ? '上半规管耳石症较为少见，通常需要 Yacovino 法或深悬头法，建议您前往医院由专业医生进行复位。' 
                                            : 'Anterior canal BPPV is rare. Deep Head Hanging maneuvers are recommended to be performed by a professional.'}
                                    </div>
                                </div>
                            </div>
                        )}

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
                                {lang === 'zh' ? '查看所有复位法' : 'View Maneuvers'}
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
          onBack={() => setAppState(AppState.SIDE_SELECT)}
          lang={lang}
        />
      )}
    </div>
  );
}

export default App;