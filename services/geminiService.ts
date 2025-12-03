
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, CanalType, Side, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEyeMovement = async (frames: string[], lang: Language = 'en'): Promise<DiagnosisResult> => {
  // We receive a sequence of frames (captured ~100ms apart) to detect movement.
  
  const systemInstruction = `
    You are an expert Otolaryngologist and Vestibular Specialist.
    You are provided with a sequence of video frames (sampled at approx 10 frames per second) of a patient's eyes during a Dix-Hallpike maneuver.
    
    Your task is to identify NYSTAGMUS (involuntary eye movement) by analyzing the *temporal changes* across these frames.
    
    1.  **Look for Rhythmic Oscillation**: Nystagmus is a repetitive, to-and-fro movement. Do not look at just one frame. Look for shifting pupils or rotating irises across the sequence.
    2.  **Identify Direction**:
        *   **Torsional/Rotary**: The iris rotates like a wheel (clockwise or counter-clockwise). This is the hallmark of Posterior Canal BPPV.
        *   **Vertical**: Upbeating (pupil jerks up) or Downbeating (pupil jerks down).
        *   **Horizontal**: Pupil moves side-to-side (usually Lateral Canal).
    3.  **Diagnose**:
        *   **Posterior Canal BPPV** (Most common): Typically **Upbeating AND Torsional** nystagmus (top pole of eye beats toward affected ear).
        *   **Anterior Canal BPPV**: Downbeating and Torsional.
        *   **Horizontal Canal BPPV**: Pure horizontal nystagmus.

    **Output Rules:**
    *   If the video is stable/static (no rhythmic jerking), return hasBPPV: false.
    *   If the video quality is too poor to see the iris details, report low confidence.
    *   'reasoning' MUST be in ${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}.
  `;

  try {
    // Construct parts from multiple frames
    // frames are data URLs: "data:image/jpeg;base64,..."
    const parts = frames.map(frame => ({
        inlineData: { mimeType: "image/jpeg", data: frame.split(',')[1] }
    }));

    // Add the text prompt as the last part
    parts.push({ 
        text: `Analyze this ${frames.length}-frame sequence. Is there nystagmus? If so, which canal is affected?` 
    } as any);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasBPPV: { type: Type.BOOLEAN },
            side: { type: Type.STRING, enum: ["Left", "Right"] },
            canal: { type: Type.STRING, enum: ["Posterior", "Horizontal", "Anterior"] },
            confidence: { type: Type.NUMBER, description: "0 to 1 score" },
            reasoning: { type: Type.STRING }
          },
          required: ["hasBPPV", "confidence", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);

    return {
      hasBPPV: result.hasBPPV,
      side: result.side as Side,
      canal: result.canal as CanalType,
      confidence: result.confidence,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      hasBPPV: false,
      confidence: 0,
      reasoning: lang === 'zh' 
        ? "分析因技术错误失败。请检查网络或光线，并确保拍摄到了清晰的眼部特写。" 
        : "Analysis failed. Please ensure good lighting and a clear close-up of the eyes."
    };
  }
};
