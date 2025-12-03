import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, CanalType, Side, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEyeMovement = async (imageBase64: string, lang: Language = 'en'): Promise<DiagnosisResult> => {
  // We are taking a single frame or a composite grid of frames in a real scenario.
  
  const systemInstruction = `
    You are an expert Otolaryngologist and Vestibular Specialist.
    Analyze the provided image of a patient's eyes (extracted from a video during a Dix-Hallpike maneuver or Roll test).
    Look for signs of Nystagmus (involuntary eye movement).
    
    Determine:
    1. Is there nystagmus visible? (In a static image, look for blur consistent with fast phase motion or pupil position indicating extreme torsion).
    2. What is the direction? (Upbeating, Downbeating, Torsional/Rotary, Horizontal).
    3. Based on the direction, diagnose the likely affected semicircular canal.
       - Upbeating + Torsional: Posterior Canal.
       - Downbeating + Torsional: Anterior Canal.
       - Horizontal (Geotropic/Apogeotropic): Horizontal Canal.
    4. Determine the side (Left or Right) if possible from the context of the eye position or iris torsion.

    If the image is unclear or shows no abnormal eyes, report low confidence.
    
    LANGUAGE REQUIREMENT:
    The output 'reasoning' field MUST be in ${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}.
    The enum values for side and canal MUST remain in English as defined in the schema, but the explanation should be localized.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } },
          { text: "Analyze the eye movement pattern for BPPV diagnosis." }
        ]
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
        ? "分析因技术错误失败。请检查网络或 API 密钥。" 
        : "Analysis failed due to technical error. Please check your network or API key."
    };
  }
};
