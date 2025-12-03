
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, CanalType, Side, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEyeMovement = async (frames: string[], lang: Language = 'en'): Promise<DiagnosisResult> => {
  // We receive a sequence of frames (captured ~100ms apart) to detect movement.
  
  const systemInstruction = `
    You are an expert Otolaryngologist and Vestibular Specialist.
    You are provided with a sequence of video frames (approx 10 seconds) of a patient's eyes during a Dix-Hallpike maneuver.
    
    Your task is to identify **NYSTAGMUS** (involuntary eye movement).
    
    **CRITICAL ANALYSIS INSTRUCTIONS (CHAIN OF THOUGHT):**

    1.  **LANDMARK IDENTIFICATION (CRUCIAL):**
        *   Do not just look at the pupil center.
        *   Find a distinct landmark on the IRIS (e.g., a pigment spot, a crypt, or a blood vessel on the sclera near the iris). 
        *   You MUST track this landmark to detect **TORSIONAL (Rotary)** movement. 

    2.  **MOVEMENT PATTERN RECOGNITION:**
        *   **True Nystagmus** is a "Sawtooth" waveform: A slow drift in one direction, followed by a fast corrective jerk (beat) in the opposite direction.
        *   **Random Shaking** (from hand tremor) affects the whole frame/face. **Nystagmus** affects the eye position relative to the eyelids/face.
        *   **Torsion:** Imagine the iris is a clock face. Does 12 o'clock rotate to 1 o'clock and snap back? This is the hallmark of Posterior Canal BPPV.
        *   **Vertical:** Purely Upbeating or Downbeating.
        *   **Horizontal:** Purely Side-to-side.

    3.  **DIAGNOSIS LOGIC:**
        *   **Posterior Canal BPPV:** Upbeating AND Torsional (Rotary) nystagmus. (Most Common).
        *   **Anterior Canal BPPV:** Downbeating AND Torsional. (Rare).
        *   **Horizontal Canal BPPV:** Horizontal (Geotropic or Apogeotropic).
        *   **Negative:** Eye remains fixed relative to eyelids. No rhythmic beats.

    **Output Rules:**
    *   **hasBPPV**: Set to true if ANY rhythmic nystagmus is detected.
    *   **confidence**: 
        *   0.9+ if you see clear, defining beats (slow drift/fast jerk).
        *   0.6-0.8 if subtle movement or poor video quality.
        *   <0.5 if video is too blurry or dark (return hasBPPV: false).
    *   'reasoning' MUST be in ${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}. 
    *   **Reasoning Format:** "Observed [Direction] nystagmus. Landmark at [Position] rotated [Direction]..."

  `;

  try {
    // Construct parts from multiple frames
    // frames are data URLs: "data:image/jpeg;base64,..."
    // We increase limit to allow ~150 frames (approx 12-15s at 10-12fps) for better temporal resolution.
    const framesToSend = frames.slice(0, 150);

    const parts = framesToSend.map(frame => ({
        inlineData: { mimeType: "image/jpeg", data: frame.split(',')[1] }
    }));

    // Add the text prompt as the last part
    parts.push({ 
        text: `Analyze this ${framesToSend.length}-frame sequence. Focus intently on IRIS ROTATION (Torsion) and VERTICAL beats. Is there BPPV nystagmus?` 
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
        ? "分析因网络或技术错误中断。请确保网络通畅或尝试上传本地录制的清晰视频。" 
        : "Analysis failed. Please check connection or try uploading a clear video file."
    };
  }
};
