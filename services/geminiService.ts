import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, CanalType, Side, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 增加 testSide 参数
export const analyzeEyeMovement = async (
  frames: string[], 
  lang: Language = 'en',
  testSide: Side | 'UNKNOWN' = 'UNKNOWN' 
): Promise<DiagnosisResult> => {
  
  // 构造针对不同语言的输出要求
  const langInstruction = lang === 'zh' 
    ? "Provide the 'reasoning' field in Simplified Chinese (简体中文)." 
    : "Provide the 'reasoning' field in English.";

  const systemInstruction = `
    You are an expert Otolaryngologist analyzing a video recording of a Dix-Hallpike or Roll test.
    
    **CONTEXT:**
    - The video shows a close-up of a patient's eyes during a provocation maneuver.
    - **Test Side:** The patient is testing the **${testSide}** side.
    - **Environment:** Front-facing selfie camera, likely low light. 
    - **Focus:** Track the movement of the pupil, iris striations, or scleral blood vessels (red veins) to detect rotation.

    **DIAGNOSTIC CRITERIA (Classify based on Nystagmus Direction):**
    
    1. **POSTERIOR Canal (BPPV Type: Common)**
       - **Visual Sign:** Mixed **UP-beating** (vertical) AND **Torsional** (rotary) nystagmus.
       - The top pole of the eye beats toward the affected ear (ground).
    
    2. **HORIZONTAL Canal (BPPV Type: Less Common)**
       - **Visual Sign:** Pure **HORIZONTAL** nystagmus.
       - Can be Geotropic (beating towards ground) or Apogeotropic (beating towards sky).
    
    3. **ANTERIOR Canal (BPPV Type: Rare)**
       - **Visual Sign:** Mainly **DOWN-beating** nystagmus.
       - Sometimes with a slight torsional component.

    **ANALYSIS TASKS:**
    1. **Detection:** Is there ANY rhythmic, involuntary eye movement? (Ignore blinks or voluntary looking around).
    2. **Classification:** If movement exists, identify the primary direction (Up/Down/Horizontal/Rotary).
    3. **Conclusion:** 
       - If **Upbeating + Torsional**: Set canal="Posterior".
       - If **Horizontal**: Set canal="Horizontal".
       - If **Downbeating**: Set canal="Anterior".
       - If **No Nystagmus**: Set hasBPPV=false.

    **OUTPUT RULES:**
    - **hasBPPV**: true only if specific nystagmus patterns are identified.
    - **side**: If hasBPPV is true, usually matches the **${testSide}**. If the nystagmus is clearly contradictory to the test side (e.g., strong downbeating suggesting Anterior contralateral), output the medically deduced side.
    - **reasoning**: ${langInstruction} Explain strictly what you see (e.g., "Detected upbeating torsional nystagmus...").
  `;

  try {
    // 限制帧数以符合 Payload 大小，取前 150 帧通常足够覆盖 10 秒
    const framesToSend = frames.slice(0, 150);
    const parts = framesToSend.map(frame => ({
        inlineData: { mimeType: "image/jpeg", data: frame.split(',')[1] }
    }));

    parts.push({ 
        text: `Patient is testing the ${testSide} side. Analyze the eye movement pattern (Up/Down/Horizontal/Torsional) and identify the affected canal.` 
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
            confidence: { type: Type.NUMBER, description: "0.0 to 1.0" },
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
      // 如果 AI 检测出病变但未指明侧别，且我们知道测试侧，则兜底使用测试侧
      side: result.side as Side || (result.hasBPPV && testSide !== 'UNKNOWN' ? testSide : undefined),
      canal: result.canal as CanalType, // 现在 AI 会根据眼震方向准确返回类型
      confidence: result.confidence,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      hasBPPV: false,
      confidence: 0,
      reasoning: lang === 'zh' ? "AI 分析服务连接中断，请检查网络或稍后重试。" : "AI Analysis interrupted. Please check network."
    };
  }
};