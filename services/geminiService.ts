import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, CanalType, Side, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 增加 testSide 参数
export const analyzeEyeMovement = async (
  frames: string[], 
  lang: Language = 'en',
  testSide: Side | 'UNKNOWN' = 'UNKNOWN' 
): Promise<DiagnosisResult> => {
  
  const systemInstruction = `
    You are an expert Otolaryngologist analyzing a Dix-Hallpike test video.
    
    **CONTEXT:**
    - Patient is performing the Dix-Hallpike maneuver on the **${testSide}** side.
    - Camera: Front-facing, low light conditions expected.
    
    **YOUR TASK: VERIFY THE HYPOTHESIS**
    Hypothesis: "The patient has BPPV in the ${testSide} ear."
    
    **ANALYSIS LOGIC:**
    1.  **Look for Nystagmus:** Scrutinize the eyes for ANY rhythmic beating (vertical, torsional, or horizontal).
        - *Tip:* In low light, track scleral vessels (red veins) or pupil edges.
    
    2.  **Evaluate Findings against Context:**
        - **SCENARIO A (Consistent):** You see nystagmus. 
          -> CONCLUSION: The maneuver on the ${testSide} side PROVOKED symptoms. **Confirm ${testSide} BPPV.**
          -> Set \`hasBPPV: true\`, \`side: ${testSide}\`.
          
        - **SCENARIO B (Negative):** You see NO nystagmus (eyes are stable), even if the patient claims dizziness.
          -> CONCLUSION: The maneuver on the ${testSide} side did NOT provoke objective signs.
          -> Set \`hasBPPV: false\`.
          
        - **SCENARIO C (Contradictory - Rare):** You see clear nystagmus, but the direction strongly suggests the *opposite* canal (e.g., pure downbeating).
          -> CONCLUSION: Complex case. Report the nystagmus but lower confidence on the side.
    
    **OUTPUT RULES:**
    - **hasBPPV**: true only if objective nystagmus is visible.
    - **side**: If hasBPPV is true, verify if it aligns with **${testSide}**. (In 95% of home cases, Provocation Side = Affected Side).
    - **reasoning**: Explain clearly based on the context.
      - Example (Positive): "在${testSide === 'Left' ? '左' : '右'}侧卧位激发出了明显的眼震，确认是${testSide === 'Left' ? '左' : '右'}侧耳石症。"
      - Example (Negative): "虽然您可能感到眩晕，但未检测到眼震。请尝试测试另一侧。"
  `;

  try {
    const framesToSend = frames.slice(0, 150);
    const parts = framesToSend.map(frame => ({
        inlineData: { mimeType: "image/jpeg", data: frame.split(',')[1] }
    }));

    parts.push({ 
        text: `Patient is testing ${testSide} side. Verify if this maneuver provokes nystagmus.` 
    } as any);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: { parts: parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasBPPV: { type: Type.BOOLEAN },
            side: { type: Type.STRING, enum: ["Left", "Right"] },
            canal: { type: Type.STRING, enum: ["Posterior", "Horizontal", "Anterior"] },
            confidence: { type: Type.NUMBER },
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
      // 这里的逻辑稍微放松，如果 AI 明确返回了 Side 就用 AI 的，
      // 如果 AI 没返回 Side 但确认有病，才兜底使用 testSide
      side: result.side as Side || (result.hasBPPV && testSide !== 'UNKNOWN' ? testSide : undefined),
      canal: result.canal as CanalType,
      confidence: result.confidence,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      hasBPPV: false,
      confidence: 0,
      reasoning: lang === 'zh' ? "分析中断，请重试。" : "Analysis failed."
    };
  }
};