import { DiagnosisResult, CanalType, Side, Language } from '../types';

// 注意：前端不再引入 @google/genai，也不再需要 API_KEY
// 所有的 AI 交互逻辑已移动到 /api/analyze

export const analyzeEyeMovement = async (
  frames: string[], 
  lang: Language = 'en',
  testSide: Side | 'UNKNOWN' = 'UNKNOWN' 
): Promise<DiagnosisResult> => {
  
  try {
    // 限制帧数以符合 Payload 大小，取前 150 帧通常足够覆盖 10 秒
    // 这一点必须在前端做，减少网络传输量，避免 Vercel Function Body Size Limit (4.5MB)
    const step = Math.max(1, Math.floor(frames.length / 30));
    const framesToSend = frames.filter((_, i) => i % step === 0).slice(0, 30);

    // 调用后端接口
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frames: framesToSend,
        lang,
        testSide
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `Server error: ${response.status}`);
    }

    const result = await response.json();

    return {
      hasBPPV: result.hasBPPV,
      // 如果 AI 检测出病变但未指明侧别，且我们知道测试侧，则兜底使用测试侧
      side: result.side as Side || (result.hasBPPV && testSide !== 'UNKNOWN' ? testSide : undefined),
      canal: result.canal as CanalType, 
      confidence: result.confidence,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error("Analysis Failed:", error);
    return {
      hasBPPV: false,
      confidence: 0,
      reasoning: lang === 'zh' ? "AI 分析服务连接中断，请检查网络或稍后重试。" : "AI Analysis interrupted. Please check network."
    };
  }
};