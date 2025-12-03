

import { Maneuver, CanalType, Language } from './types';

export const getManeuvers = (lang: Language): Record<string, Maneuver> => {
  const isZh = lang === 'zh';

  const commonPrecautions = isZh 
    ? [
        "复位后静坐 10 分钟，不要立刻大幅度移动。",
        "今晚睡觉时将枕头垫高，保持头部抬高 45 度。",
        "24 小时内避免低头捡东西或仰头看天花板。",
        "一周内避免剧烈运动或头部剧烈晃动。",
        "如果眩晕持续或加重，请立即就医。"
      ]
    : [
        "Sit quietly for 10 minutes after the maneuver.",
        "Sleep with your head elevated (use extra pillows) tonight.",
        "Avoid bending over or looking up high for 24 hours.",
        "Avoid vigorous exercise for one week.",
        "Seek medical attention if dizziness persists or worsens."
      ];

  return {
    EPLEY_RIGHT: {
      id: 'epley_right',
      name: isZh ? "Epley 复位法 (右耳)" : "Epley Maneuver (Right Ear)",
      description: isZh 
        ? "治疗右侧后半规管耳石症的标准复位方法。"
        : "The standard maneuver for treating right posterior canal BPPV.",
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.POSTERIOR,
        side: Object.values(CanalType).includes('Right' as any) ? undefined : undefined
      },
      steps: [
        {
          id: 1,
          title: isZh ? "步骤 1: 端坐转头" : "Step 1: Sit & Turn",
          description: isZh 
            ? "坐在床边，双腿伸直。头部向【右】转 45 度。此举是为了让右后半规管与身体纵轴平行。"
            : "Sit on the bed with legs extended. Turn your head 45 degrees to the RIGHT. This aligns the posterior canal.",
          durationSeconds: 15,
          torsoAngle: 90, 
          bodyRoll: 0,
          bodyYaw: 0,
          headYaw: -45,   
          headPitch: 0,
          legAngle: 0,
          otolithProgressStart: 0,
          otolithProgressEnd: 0.05,
        },
        {
          id: 2,
          title: isZh ? "步骤 2: 快速仰卧 (悬头位)" : "Step 2: Lie Back (Head Hanging)",
          description: isZh
            ? "保持头部向右 45 度，快速向后躺下。务必让头部悬空或枕在肩下，使头后仰约 30 度。这是最关键的一步，耳石开始从壶腹滑出。"
            : "Quickly lie back keeping head turned right. Head must hang extended 30 degrees over the edge/pillow. Stones move away from ampulla.",
          durationSeconds: 60,
          torsoAngle: 0,  
          bodyRoll: 0,
          bodyYaw: 0,
          headYaw: -45,   
          headPitch: -30,
          legAngle: 0,
          otolithProgressStart: 0.05,
          otolithProgressEnd: 0.35,
        },
        {
          id: 3,
          title: isZh ? "步骤 3: 向左转头" : "Step 3: Turn Head Left",
          description: isZh
            ? "身体不要动，缓慢将头向【左】转 90 度。此时你的头应向左偏 45 度。耳石继续沿着管壁滑动。"
            : "Without moving body, turn head 90 degrees to LEFT. You are now looking 45 degrees left. Stones traverse the canal arc.",
          durationSeconds: 60,
          torsoAngle: 0,
          bodyRoll: 0,
          bodyYaw: 0,
          headYaw: 45,    
          headPitch: -20,
          legAngle: 0,
          otolithProgressStart: 0.35,
          otolithProgressEnd: 0.65,
        },
        {
          id: 4,
          title: isZh ? "步骤 4: 身体左转 (侧卧)" : "Step 4: Roll Body Left",
          description: isZh
            ? "身体向【左】转 90 度，变为左侧卧。头部跟随身体转动，下巴收紧贴向肩膀，视线看向地面。耳石进入总脚。"
            : "Turn body 90 degrees LEFT onto shoulder. Head turns with body, tuck chin to look at floor. Stones enter common crus.",
          durationSeconds: 60,
          torsoAngle: 0,
          bodyRoll: -90,  
          bodyYaw: 0,
          headYaw: 45,    
          headPitch: 15,
          legAngle: 0,
          otolithProgressStart: 0.65,
          otolithProgressEnd: 0.85,
        },
        {
          id: 5,
          title: isZh ? "步骤 5: 垂腿侧身坐起" : "Step 5: Drop Legs & Side Sit Up",
          description: isZh
            ? "保持下巴内收。将双腿移出床沿自然下垂。用手臂支撑，侧身坐起，最终坐在床边。"
            : "Keep chin tucked. Swing your legs off the side of the bed. Push up with your arms to sit up on the edge of the bed.",
          durationSeconds: 60,
          // Physics: Side Sit Up. 
          // Move body to edge (BodyYaw 90 implies facing Left edge).
          torsoAngle: 90, 
          bodyRoll: 0,    
          bodyYaw: 90, // Face Left Edge
          headYaw: 0,
          headPitch: 20, 
          legAngle: 85, // Legs drop down
          otolithProgressStart: 0.85,
          otolithProgressEnd: 1.0,
        }
      ]
    },
    EPLEY_LEFT: {
      id: 'epley_left',
      name: isZh ? "Epley 复位法 (左耳)" : "Epley Maneuver (Left Ear)",
      description: isZh
        ? "治疗左侧后半规管耳石症的标准复位方法。"
        : "Standard maneuver for Left Posterior Canal BPPV.",
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.POSTERIOR,
      },
      steps: [
        {
          id: 1,
          title: isZh ? "步骤 1: 端坐转头" : "Step 1: Sit & Turn",
          description: isZh
            ? "坐在床边。头部向【左】转 45 度。"
            : "Sit on bed. Turn head 45 degrees LEFT.",
          durationSeconds: 15,
          torsoAngle: 90,
          bodyRoll: 0,
          bodyYaw: 0,
          headYaw: 45, // Left
          headPitch: 0,
          legAngle: 0,
          otolithProgressStart: 0,
          otolithProgressEnd: 0.05,
        },
        {
          id: 2,
          title: isZh ? "步骤 2: 快速仰卧" : "Step 2: Lie Back",
          description: isZh
            ? "保持头左偏，快速向后躺下。头部后仰悬空 30 度。"
            : "Lie back quickly keeping head turned left. Head hanging extended 30 deg.",
          durationSeconds: 60,
          torsoAngle: 0,
          bodyRoll: 0,
          bodyYaw: 0,
          headYaw: 45,
          headPitch: -30,
          legAngle: 0,
          otolithProgressStart: 0.05,
          otolithProgressEnd: 0.35,
        },
        {
          id: 3,
          title: isZh ? "步骤 3: 向右转头" : "Step 3: Turn Head Right",
          description: isZh
            ? "缓慢将头向【右】转 90 度。此时头向右偏 45 度。"
            : "Turn head 90 deg RIGHT. Now looking 45 deg right.",
          durationSeconds: 60,
          torsoAngle: 0,
          bodyRoll: 0,
          bodyYaw: 0,
          headYaw: -45,
          headPitch: -20,
          legAngle: 0,
          otolithProgressStart: 0.35,
          otolithProgressEnd: 0.65,
        },
        {
          id: 4,
          title: isZh ? "步骤 4: 身体右转" : "Step 4: Roll Body Right",
          description: isZh
            ? "身体向【右】转 90 度侧卧。低头看地面。"
            : "Roll body 90 deg RIGHT. Tuck chin, look at floor.",
          durationSeconds: 60,
          torsoAngle: 0,
          bodyRoll: 90,
          bodyYaw: 0,
          headYaw: -45,
          headPitch: 15,
          legAngle: 0,
          otolithProgressStart: 0.65,
          otolithProgressEnd: 0.85,
        },
        {
          id: 5,
          title: isZh ? "步骤 5: 垂腿侧身坐起" : "Step 5: Drop Legs & Side Sit Up",
          description: isZh
            ? "保持下巴内收。将双腿移出床沿自然下垂。用手臂支撑，侧身坐起，最终坐在床边。"
            : "Keep chin tucked. Swing your legs off the side of the bed. Push up with your arms to sit up on the edge of the bed.",
          durationSeconds: 60,
          // Physics: Side Sit Up
          torsoAngle: 90,
          bodyRoll: 0,
          bodyYaw: -90, // Face Right Edge
          headYaw: 0,
          headPitch: 20,
          legAngle: 85,
          otolithProgressStart: 0.85,
          otolithProgressEnd: 1.0,
        }
      ]
    }
  };
};
