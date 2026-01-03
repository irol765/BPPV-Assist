import { Maneuver, CanalType, Language, Side } from './types';

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

  const fosterDescription = isZh
    ? "Foster 半筋斗复位法。不需要像 Epley 那样头部悬空，适合颈椎不适或在家自救的患者。动作类似跪姿翻跟头。"
    : "The Foster (Half-Somersault) maneuver. An alternative to Epley that doesn't require hanging the head off the bed. Easier to perform alone.";

  const bbqDescription = isZh
    ? "BBQ 翻滚法 (Lempert)。专门用于治疗【水平半规管】耳石症（表现为躺下翻身时晕）。需要全身 360 度翻滚。"
    : "The BBQ (Lempert) Roll. Designed for Horizontal Canal BPPV. Involves rolling 360 degrees while lying down.";

  return {
    // --- EPLEY (Posterior Canal) ---
    EPLEY_RIGHT: {
      id: 'epley_right',
      name: isZh ? "Epley 复位法 (右耳)" : "Epley Maneuver (Right)",
      description: isZh 
        ? "治疗右侧后半规管耳石症的金标准方法。需要床沿悬头。"
        : "Gold standard for Right Posterior Canal BPPV. Requires head hanging.",
      difficulty: 'Medium',
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.POSTERIOR,
        side: Side.RIGHT
      },
      steps: [
        {
          id: 1,
          title: isZh ? "步骤 1: 端坐转头" : "Step 1: Sit & Turn",
          description: isZh 
            ? "坐在床边，双腿伸直。头部向【右】转 45 度。"
            : "Sit on the bed with legs extended. Turn your head 45 degrees to the RIGHT.",
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
          title: isZh ? "步骤 2: 快速仰卧 (悬头)" : "Step 2: Lie Back",
          description: isZh
            ? "保持头部向右 45 度，快速向后躺下。头部悬空后仰约 30 度。这是最关键的一步。"
            : "Quickly lie back keeping head turned right. Head must hang extended 30 degrees.",
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
            ? "身体不动，缓慢将头向【左】转 90 度。此时头向左偏 45 度。"
            : "Turn head 90 degrees to LEFT. You are now looking 45 degrees left.",
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
          title: isZh ? "步骤 4: 侧身低头" : "Step 4: Roll Body Left",
          description: isZh
            ? "身体向【左】转 90 度变为侧卧。头部跟随转动，下巴收紧贴向肩膀，视线看地面。"
            : "Turn body 90 degrees LEFT onto shoulder. Tuck chin to look at floor.",
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
          title: isZh ? "步骤 5: 坐起" : "Step 5: Sit Up",
          description: isZh
            ? "保持下巴内收，将双腿移出床沿，侧身坐起。"
            : "Keep chin tucked. Swing legs off bed and push up to sit.",
          durationSeconds: 60,
          torsoAngle: 90, 
          bodyRoll: 0,    
          bodyYaw: 90, 
          headYaw: 0,
          headPitch: 20, 
          legAngle: 85,
          otolithProgressStart: 0.85,
          otolithProgressEnd: 1.0,
        }
      ]
    },
    EPLEY_LEFT: {
      id: 'epley_left',
      name: isZh ? "Epley 复位法 (左耳)" : "Epley Maneuver (Left)",
      description: isZh
        ? "治疗左侧后半规管耳石症的金标准方法。需要床沿悬头。"
        : "Gold standard for Left Posterior Canal BPPV.",
      difficulty: 'Medium',
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.POSTERIOR,
        side: Side.LEFT
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
          headYaw: 45,
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
          title: isZh ? "步骤 4: 侧身低头" : "Step 4: Roll Body Right",
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
          title: isZh ? "步骤 5: 坐起" : "Step 5: Sit Up",
          description: isZh
            ? "保持下巴内收，侧身坐起。"
            : "Keep chin tucked and sit up.",
          durationSeconds: 60,
          torsoAngle: 90,
          bodyRoll: 0,
          bodyYaw: -90,
          headYaw: 0,
          headPitch: 20,
          legAngle: 85,
          otolithProgressStart: 0.85,
          otolithProgressEnd: 1.0,
        }
      ]
    },

    // --- FOSTER (Half-Somersault) ---
    FOSTER_RIGHT: {
      id: 'foster_right',
      name: isZh ? "Foster 半筋斗法 (右耳)" : "Foster Maneuver (Right)",
      description: fosterDescription,
      difficulty: 'Easy',
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.POSTERIOR,
        side: Side.RIGHT
      },
      steps: [
        {
          id: 1,
          title: isZh ? "步骤 1: 跪姿仰头" : "Step 1: Kneel & Look Up",
          description: isZh 
            ? "跪在地上（或坐在脚后跟上）。双手撑地，头部尽量向后仰，以此作为起始位置。"
            : "Kneel on the floor. Hands on floor. Tip head straight UP at ceiling.",
          durationSeconds: 15,
          torsoAngle: 90, 
          bodyRoll: 0,
          headYaw: 0,
          headPitch: -45, // Looking up
          legAngle: 90, // Vertical Thighs
          kneeAngle: 90, // Kneeling
          otolithProgressStart: 0,
          otolithProgressEnd: 0.1,
        },
        {
          id: 2,
          title: isZh ? "步骤 2: 低头翻跟头" : "Step 2: Somersault Tuck",
          description: isZh
            ? "像翻跟头一样，将头顶顶在地上，下巴尽量向膝盖处收紧（倒立位）。保持这个姿势。"
            : "Tuck head completely under like doing a somersault. Top of head on floor, chin tucked to knees.",
          durationSeconds: 30,
          torsoAngle: 135, // Leaning forward
          bodyRoll: 0,
          headYaw: 0,
          headPitch: 85, // Max tuck
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.1,
          otolithProgressEnd: 0.4,
        },
        {
          id: 3,
          title: isZh ? "步骤 3: 转头看向患侧" : "Step 3: Turn Head Right",
          description: isZh
            ? "保持头顶在地上的姿势不变，将面部向【右】侧手肘方向转动 45 度。"
            : "While keeping head on floor, turn face 45 degrees to the RIGHT elbow.",
          durationSeconds: 30,
          torsoAngle: 135,
          bodyRoll: 0,
          headYaw: -45, // Right
          headPitch: 85, 
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.4,
          otolithProgressEnd: 0.6,
        },
        {
          id: 4,
          title: isZh ? "步骤 4: 快速抬头平背" : "Step 4: Raise Head to Level",
          description: isZh
            ? "保持头部向右偏转的角度，利用双手支撑，快速将头部和背部抬起至水平位置（像四脚桌一样）。"
            : "Keeping head turned right, quickly raise head/back to horizontal (tabletop position).",
          durationSeconds: 30,
          torsoAngle: 170, // Horizontal back
          bodyRoll: 0,
          headYaw: -45,
          headPitch: -80, // Extended neck to look level
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.6,
          otolithProgressEnd: 0.8,
        },
        {
          id: 5,
          title: isZh ? "步骤 5: 直立" : "Step 5: Upright",
          description: isZh
            ? "保持头部偏转，慢慢直立起上身。最后将头转回正前方。"
            : "Slowly kneel upright. Then turn head forward.",
          durationSeconds: 30,
          torsoAngle: 90, // Upright
          bodyRoll: 0,
          headYaw: 0,
          headPitch: 0,
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.8,
          otolithProgressEnd: 1.0,
        }
      ]
    },
    FOSTER_LEFT: {
      id: 'foster_left',
      name: isZh ? "Foster 半筋斗法 (左耳)" : "Foster Maneuver (Left)",
      description: fosterDescription,
      difficulty: 'Easy',
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.POSTERIOR,
        side: Side.LEFT
      },
      steps: [
        {
          id: 1,
          title: isZh ? "步骤 1: 跪姿仰头" : "Step 1: Kneel & Look Up",
          description: isZh 
            ? "跪在地上。双手撑地，头部尽量向后仰。"
            : "Kneel on floor. Look straight up at ceiling.",
          durationSeconds: 15,
          torsoAngle: 90,
          bodyRoll: 0,
          headYaw: 0,
          headPitch: -45,
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0,
          otolithProgressEnd: 0.1,
        },
        {
          id: 2,
          title: isZh ? "步骤 2: 低头翻跟头" : "Step 2: Somersault Tuck",
          description: isZh
            ? "头顶触地，下巴尽量收向膝盖（倒立位）。"
            : "Tuck head under like a somersault. Chin to knees.",
          durationSeconds: 30,
          torsoAngle: 135,
          bodyRoll: 0,
          headYaw: 0,
          headPitch: 85,
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.1,
          otolithProgressEnd: 0.4,
        },
        {
          id: 3,
          title: isZh ? "步骤 3: 转头看向患侧" : "Step 3: Turn Head Left",
          description: isZh
            ? "保持头顶在地，将面部向【左】侧手肘转动 45 度。"
            : "Turn face 45 degrees to the LEFT elbow.",
          durationSeconds: 30,
          torsoAngle: 135,
          bodyRoll: 0,
          headYaw: 45, // Left
          headPitch: 85,
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.4,
          otolithProgressEnd: 0.6,
        },
        {
          id: 4,
          title: isZh ? "步骤 4: 快速抬头平背" : "Step 4: Raise Head to Level",
          description: isZh
            ? "保持头左偏，快速抬起头背至水平位置（四脚桌姿势）。"
            : "Raise head/back to tabletop position, keeping head turned left.",
          durationSeconds: 30,
          torsoAngle: 170,
          bodyRoll: 0,
          headYaw: 45,
          headPitch: -80,
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.6,
          otolithProgressEnd: 0.8,
        },
        {
          id: 5,
          title: isZh ? "步骤 5: 直立" : "Step 5: Upright",
          description: isZh
            ? "慢慢直立起上身，最后回正头部。"
            : "Sit upright. Center head.",
          durationSeconds: 30,
          torsoAngle: 90,
          bodyRoll: 0,
          headYaw: 0,
          headPitch: 0,
          legAngle: 90,
          kneeAngle: 90,
          otolithProgressStart: 0.8,
          otolithProgressEnd: 1.0,
        }
      ]
    },

    // --- BBQ ROLL (Horizontal Canal) ---
    BBQ_RIGHT: {
      id: 'bbq_right',
      name: isZh ? "BBQ 翻滚法 (右耳)" : "BBQ Roll (Right)",
      description: bbqDescription,
      difficulty: 'Hard',
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.HORIZONTAL,
        side: Side.RIGHT
      },
      steps: [
        {
          id: 1,
          title: isZh ? "步骤 1: 患侧卧位" : "Step 1: Lie on Right Side",
          description: isZh
            ? "平躺，将头部向【右】转 90 度（患侧）。"
            : "Lie on your back. Turn head 90 degrees to the RIGHT.",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: 0,
          headYaw: -90, // Right
          headPitch: 0,
          otolithProgressStart: 0,
          otolithProgressEnd: 0.2,
        },
        {
          id: 2,
          title: isZh ? "步骤 2: 回正头部" : "Step 2: Face Up",
          description: isZh
            ? "将头部回正，面朝天花板。"
            : "Turn head back to center (face up).",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: 0,
          headYaw: 0,
          headPitch: 0,
          otolithProgressStart: 0.2,
          otolithProgressEnd: 0.4,
        },
        {
          id: 3,
          title: isZh ? "步骤 3: 转头向健侧" : "Step 3: Turn Head Left",
          description: isZh
            ? "将头部向【左】转 90 度（健侧）。"
            : "Turn head 90 degrees to the LEFT.",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: 0,
          headYaw: 90, // Left
          headPitch: 0,
          otolithProgressStart: 0.4,
          otolithProgressEnd: 0.6,
        },
        {
          id: 4,
          title: isZh ? "步骤 4: 翻身趴下 (肘部支撑)" : "Step 4: Face Down (On Elbows)",
          description: isZh
            ? "身体向【左】翻转，直到面部朝下（趴在床上）。用双肘支撑床面，保持头部稍稍抬起，不要闷在枕头里。"
            : "Roll body to the LEFT until facing down. Support yourself on your elbows. Keep head slightly up, don't bury face in pillow.",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: -180, // Face down
          armAngle: 45,   // Arms forward
          elbowAngle: 90, // Elbows bent
          headYaw: 0,
          headPitch: -30, // Head up
          otolithProgressStart: 0.6,
          otolithProgressEnd: 0.8,
        },
        // NEW STEP: Intermediate transition for BBQ Right (Rolling onto Left Side)
        {
          id: 5,
          title: isZh ? "步骤 4b: 转为侧卧" : "Step 4b: Roll to Side",
          description: isZh
            ? "先从趴着的姿势转回左侧卧，并将双腿移出床沿，自然下垂，准备坐起。"
            : "Roll from face down onto your LEFT side. Swing legs off the edge to hang down, preparing to sit up.",
          durationSeconds: 15,
          torsoAngle: 0,
          bodyRoll: -90, // Left Side
          armAngle: 0,
          elbowAngle: 0,
          headYaw: 0,
          headPitch: 0,
          legAngle: 45, // Legs starting to hang
          otolithProgressStart: 0.8,
          otolithProgressEnd: 0.9,
        },
        {
          id: 6,
          title: isZh ? "步骤 5: 侧身坐起" : "Step 5: Sit Up",
          description: isZh
            ? "用手推床，从侧面坐起，保持直立。"
            : "Push up with your hands to sit up from the side. Stay upright.",
          durationSeconds: 30,
          torsoAngle: 90,
          bodyRoll: -90, 
          headYaw: 0,
          headPitch: 0,
          legAngle: 90,
          kneeAngle: 90, // Legs hanging down
          otolithProgressStart: 0.9,
          otolithProgressEnd: 1.0,
        }
      ]
    },
    BBQ_LEFT: {
      id: 'bbq_left',
      name: isZh ? "BBQ 翻滚法 (左耳)" : "BBQ Roll (Left)",
      description: bbqDescription,
      difficulty: 'Hard',
      precautions: commonPrecautions,
      recommendedFor: {
        canal: CanalType.HORIZONTAL,
        side: Side.LEFT
      },
      steps: [
        {
          id: 1,
          title: isZh ? "步骤 1: 患侧卧位" : "Step 1: Lie on Left Side",
          description: isZh
            ? "平躺，将头部向【左】转 90 度（患侧）。"
            : "Lie on your back. Turn head 90 degrees to the LEFT.",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: 0,
          headYaw: 90, // Left
          headPitch: 0,
          otolithProgressStart: 0,
          otolithProgressEnd: 0.2,
        },
        {
          id: 2,
          title: isZh ? "步骤 2: 回正头部" : "Step 2: Face Up",
          description: isZh
            ? "将头部回正，面朝天花板。"
            : "Turn head back to center (face up).",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: 0,
          headYaw: 0,
          headPitch: 0,
          otolithProgressStart: 0.2,
          otolithProgressEnd: 0.4,
        },
        {
          id: 3,
          title: isZh ? "步骤 3: 转头向健侧" : "Step 3: Turn Head Right",
          description: isZh
            ? "将头部向【右】转 90 度（健侧）。"
            : "Turn head 90 degrees to the RIGHT.",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: 0,
          headYaw: -90, // Right
          headPitch: 0,
          otolithProgressStart: 0.4,
          otolithProgressEnd: 0.6,
        },
        {
          id: 4,
          title: isZh ? "步骤 4: 翻身趴下 (肘部支撑)" : "Step 4: Face Down (On Elbows)",
          description: isZh
            ? "身体向【右】翻转，直到面部朝下（趴在床上）。用双肘支撑床面，保持头部稍稍抬起，不要闷在枕头里。"
            : "Roll body to the RIGHT until facing down. Support yourself on your elbows. Keep head slightly up.",
          durationSeconds: 30,
          torsoAngle: 0,
          bodyRoll: 180, // Face down
          armAngle: 45,   // Arms forward
          elbowAngle: 90, // Elbows bent
          headYaw: 0,
          headPitch: -30, // Head up
          otolithProgressStart: 0.6,
          otolithProgressEnd: 0.8,
        },
        // NEW STEP: Intermediate transition for BBQ Left (Rolling onto Right Side)
        {
          id: 5,
          title: isZh ? "步骤 4b: 转为侧卧" : "Step 4b: Roll to Side",
          description: isZh
            ? "先从趴着的姿势转回右侧卧，并将双腿移出床沿，自然下垂，准备坐起。"
            : "Roll from face down onto your RIGHT side. Swing legs off the edge to hang down, preparing to sit up.",
          durationSeconds: 15,
          torsoAngle: 0,
          bodyRoll: 90, // Right Side
          armAngle: 0,
          elbowAngle: 0,
          headYaw: 0,
          headPitch: 0,
          legAngle: 45, // Legs starting to hang
          otolithProgressStart: 0.8,
          otolithProgressEnd: 0.9,
        },
        {
          id: 6,
          title: isZh ? "步骤 5: 侧身坐起" : "Step 5: Sit Up",
          description: isZh
            ? "用手推床，从侧面坐起，保持直立。"
            : "Push up with your hands to sit up from the side. Stay upright.",
          durationSeconds: 30,
          torsoAngle: 90,
          bodyRoll: 90,
          headYaw: 0,
          headPitch: 0,
          legAngle: 85,
          kneeAngle: 90, // Legs hanging down
          otolithProgressStart: 0.9,
          otolithProgressEnd: 1.0,
        }
      ]
    }
  };
};