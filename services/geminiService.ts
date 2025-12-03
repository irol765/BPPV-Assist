
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, CanalType, Side, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEyeMovement = async (frames: string[], lang: Language = 'en'): Promise<DiagnosisResult> => {
  // We receive a sequence of frames (captured ~100ms apart) to detect movement.
  
  const systemInstruction = `
    You are an expert Otolaryngologist and Vestibular Specialist.
    You are provided with a sequence of video frames (30-40 frames covering 3-4 seconds) of a patient's eyes during a Dix-Hallpike maneuver.
    
    Your task is to identify **NYSTAGMUS** (involuntary eye movement).
    
    **CRITICAL SENSITIVITY INSTRUCTION:**
    *   Many BPPV cases involve **SUBTLE** nystagmus. 
    *   If you see **ANY** rhythmic slight jerking, rotation, or torsion of the iris, report it as Positive.
    *   Do not dismiss slight movements as "stable" unless the eye is absolutely still.
    *   Look specifically for **Torsional (Rotary)** nystagmus, where the iris rotates like a wheel. This is easily missed if you only look for pupil position changes.
    
    **Analysis Steps:**
    1.  **Compare Frames:** Look at frame T vs T+5 vs T+10. Is the iris landmark in the same rotation? 
    2.  **Identify Direction**:
        *   **Torsional/Rotary**: The iris rotates (clockwise/counter-clockwise). Hallmark of Posterior Canal.
        *   **Vertical**: Upbeating or Downbeating.
        *   **Horizontal**: Side-to-side.
    3.  **Diagnose**:
        *   **Posterior Canal BPPV**: Upbeating AND Torsional.
        *   **Anterior Canal BPPV**: Downbeating and Torsional.
        *   **Horizontal Canal BPPV**: Horizontal.

    **Output Rules:**
    *   **hasBPPV**: Set to true if ANY rhythmic movement is detected.
    *   **confidence**: If movement is subtle but rhythmic, give 0.6-0.8. If obvious, 0.9+.
    *   'reasoning' MUST be in ${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}. Explain WHAT you saw (e.g., "Detected slight clockwise rotation of the left iris...").
  `;

  try {
    // Construct parts from multiple frames
    // frames are data URLs: "data:image/jpeg;base64,..."
    // Limit to 45 frames max to be safe with token limits (though Gemini 2.5 Flash has huge context)
    const framesToSend = frames.slice(0, 45);

    const parts = framesToSend.map(frame => ({
        inlineData: { mimeType: "image/jpeg", data: frame.split(',')[1] }
    }));

    // Add the text prompt as the last part
    parts.push({ 
        text: `Analyze this ${framesToSend.length}-frame sequence (approx 3-4 seconds). Is there ANY nystagmus? Be highly sensitive to torsional movement.` 
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
        ? "分析因网络或技术错误中断。请尝试上传本地录制的清晰视频。" 
        : "Analysis failed. Please try uploading a clear video file."
    };
  }
};
