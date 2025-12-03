
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, CanalType, Side, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEyeMovement = async (frames: string[], lang: Language = 'en'): Promise<DiagnosisResult> => {
  // We receive a sequence of frames (captured ~300ms apart) to detect movement.
  
  const systemInstruction = `
    You are an expert Otolaryngologist and Vestibular Specialist.
    Analyze the provided sequence of video frames (captured consecutively with ~300ms intervals) of a patient's eyes during a Dix-Hallpike maneuver or Roll test.
    
    Your task is to identify NYSTAGMUS (involuntary eye movement).
    Because you have multiple frames, look for changes in pupil position, torsion (rotation of the iris), or blur direction between frames.
    
    Determine:
    1. Is there nystagmus visible? (Look for pupil displacement or rotation between frames).
    2. What is the direction? (Upbeating, Downbeating, Torsional/Rotary, Horizontal).
    3. Based on the direction, diagnose the likely affected semicircular canal.
       - Upbeating + Torsional: Posterior Canal.
       - Downbeating + Torsional: Anterior Canal.
       - Horizontal (Geotropic/Apogeotropic): Horizontal Canal.
    4. Determine the side (Left or Right) if possible from the context of the eye position or iris torsion.

    If the images are unclear, too dark, or show no movement (eyes completely static across frames), report low confidence or "noBPPV".
    
    LANGUAGE REQUIREMENT:
    The output 'reasoning' field MUST be in ${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}.
    The enum values for side and canal MUST remain in English as defined in the schema, but the explanation should be localized.
  `;

  try {
    // Construct parts from multiple frames
    const parts = frames.map(frame => ({
        inlineData: { mimeType: "image/jpeg", data: frame.split(',')[1] }
    }));

    // Add the text prompt as the last part
    parts.push({ 
        text: "Analyze this sequence of frames for nystagmus eye movement patterns suitable for BPPV diagnosis." 
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
        ? "分析因技术错误失败。请检查网络或 API 密钥，并确保摄像头光线充足。" 
        : "Analysis failed due to technical error. Please check your network or API key and ensure good lighting."
    };
  }
};
