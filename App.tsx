import React, { useState } from 'react';
import { Activity, Brain, Rotate3D, ShieldCheck, Globe } from 'lucide-react';
import EyeAnalysis from './components/EyeAnalysis';
import TreatmentGuide from './components/TreatmentGuide';
import { DiagnosisResult, Maneuver, CanalType, Side, Language } from './types';
import { getManeuvers } from './constants';
import { translations } from './translations';

enum AppState {
  HOME,
  DIAGNOSIS,
  RESULT,
  TREATMENT
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

  const getRecommendedManeuver = (diag: DiagnosisResult): Maneuver | null => {
    if (!diag.hasBPPV || !diag.canal || !diag.side) return null;
    
    // Simple logic for demo
    if (diag.canal === CanalType.POSTERIOR) {
        return diag.side === Side.RIGHT ? MANEUVERS.EPLEY_RIGHT : MANEUVERS.EPLEY_LEFT;
    }
    return null; 
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
          onClick={() => startTreatment(MANEUVERS.EPLEY_RIGHT)} // Defaulting to right for the 'Direct' button example
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

  const renderDiagnosis = () => (
    <div className="min-h-screen bg-slate-50 pt-10 px-4">
        <div className="max-w-md mx-auto">
            <button onClick={() => setAppState(AppState.HOME)} className="mb-6 text-slate-500 flex items-center gap-1 hover:text-slate-800">
                &larr; {t.backHome}
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

    return (
      <div className="min-h-screen bg-slate-50 pt-10 px-4 flex flex-col items-center">
         <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className={`p-6 ${diagnosis.hasBPPV ? 'bg-medical-50' : 'bg-slate-50'}`}>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-medical-600" />
                    {t.analysisResults}
                </h2>
                
                <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">{t.confidence}</span>
                        <span className="font-mono font-bold text-slate-700">{(diagnosis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {diagnosis.hasBPPV ? (
                        <>
                             <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500">{t.affectedSide}</span>
                                <span className="font-bold text-red-600">{diagnosis.side}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500">{t.affectedCanal}</span>
                                <span className="font-bold text-medical-700">{diagnosis.canal}</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-600">
                            {t.noBppv}
                        </div>
                    )}
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 text-sm text-slate-600 italic">
                    "{diagnosis.reasoning}"
                </div>
            </div>

            <div className="p-6 bg-white safe-pb">
                {diagnosis.hasBPPV && recommended ? (
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">{t.recommendedTreatment}</h3>
                        <p className="text-sm text-slate-500 mb-4">{t.recommendedTreatmentDesc}</p>
                        <button 
                            onClick={() => startTreatment(recommended)}
                            className="w-full py-3 bg-medical-600 text-white rounded-xl font-bold hover:bg-medical-700 shadow-lg shadow-medical-200 transition"
                        >
                            {t.startManeuver} {recommended.name}
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">{t.nextSteps}</h3>
                        <p className="text-sm text-slate-500 mb-4">{t.consultDoctor}</p>
                        <button 
                            onClick={() => setAppState(AppState.HOME)}
                            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                        >
                            {t.backHome}
                        </button>
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
