import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Sphere, Cylinder, Box, ContactShadows, OrbitControls, Plane, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Fix for missing R3F types in this file context
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}

// --- Types ---
interface HumanModelProps {
  torsoAngle: number; // 90 (sit) to 0 (lie)
  bodyRoll: number;   // -90 (left side) to 90 (right side)
  bodyYaw?: number;   // Rotation of whole body relative to bed
  headYaw: number;    // -45 to 45 (relative to torso)
  headPitch: number;  // -30 (back) to 20 (tuck)
  legAngle?: number;  // 0 (legs aligned with torso), 90 (legs bent at hip 90deg)
  kneeAngle?: number; // 0 (straight), 90 (bent backward)
  armAngle?: number;  // 0 (down), 90 (forward/up)
  elbowAngle?: number;// 0 (straight), 90 (bent)
  yOffset?: number;   // Vertical adjustment
}

// --- Animated Body Parts ---

const Head: React.FC = () => {
  return (
    <group>
      {/* Cranium */}
      <Sphere args={[0.3, 32, 32]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#fcd34d" roughness={0.3} />
      </Sphere>
      {/* Face Flat */}
      <RoundedBox args={[0.45, 0.5, 0.2]} radius={0.05} position={[0, 0.4, 0.2]}>
          <meshStandardMaterial color="#fcd34d" roughness={0.3} />
      </RoundedBox>
      {/* Nose */}
      <Box args={[0.08, 0.15, 0.1]} position={[0, 0.4, 0.35]}>
        <meshStandardMaterial color="#eab308" />
      </Box>
      {/* Eyes */}
      <Box args={[0.08, 0.02, 0.05]} position={[-0.12, 0.45, 0.31]}>
         <meshStandardMaterial color="#78350f" />
      </Box>
      <Box args={[0.08, 0.02, 0.05]} position={[0.12, 0.45, 0.31]}>
         <meshStandardMaterial color="#78350f" />
      </Box>
      {/* Ears */}
      <group position={[-0.32, 0.4, 0]}>
         <RoundedBox args={[0.05, 0.15, 0.1]} radius={0.02}>
             <meshStandardMaterial color="#fbbf24" />
         </RoundedBox>
      </group>
      <group position={[0.32, 0.4, 0]}>
         <RoundedBox args={[0.05, 0.15, 0.1]} radius={0.02}>
             <meshStandardMaterial color="#fbbf24" />
         </RoundedBox>
      </group>
    </group>
  );
};

const Arm: React.FC<{ 
  side: 'left' | 'right', 
  armAngle: number, 
  elbowAngle: number 
}> = ({ side, armAngle, elbowAngle }) => {
  const upperArmRef = useRef<THREE.Group>(null);
  const forearmRef = useRef<THREE.Group>(null);
  
  const isLeft = side === 'left';
  const xPos = isLeft ? -0.7 : 0.7;

  useFrame((state, delta) => {
    const damp = 5.0;
    
    // Shoulder Rotation (Upper Arm)
    const targetShoulderX = THREE.MathUtils.degToRad(-armAngle);
    if (upperArmRef.current) {
        upperArmRef.current.rotation.x = THREE.MathUtils.damp(upperArmRef.current.rotation.x, targetShoulderX, damp, delta);
    }

    // Elbow Rotation (Forearm)
    const targetElbowX = THREE.MathUtils.degToRad(-elbowAngle);
    if (forearmRef.current) {
        forearmRef.current.rotation.x = THREE.MathUtils.damp(forearmRef.current.rotation.x, targetElbowX, damp, delta);
    }
  });

  return (
    <group position={[xPos, 0.9, 0]}> {/* Shoulder Pivot Point */}
        <group ref={upperArmRef}>
            {/* Upper Arm Geometry - Center shifted down so pivot is at top */}
            <RoundedBox args={[0.25, 0.5, 0.3]} radius={0.1} position={[0, -0.25, 0]}>
                <meshStandardMaterial color="#60a5fa" />
            </RoundedBox>

            {/* Elbow Pivot Point - At bottom of Upper Arm */}
            <group position={[0, -0.5, 0]} ref={forearmRef}>
                {/* Forearm Geometry - Center shifted down */}
                <RoundedBox args={[0.22, 0.5, 0.28]} radius={0.1} position={[0, -0.25, 0]}>
                    <meshStandardMaterial color="#60a5fa" />
                </RoundedBox>
                {/* Hand */}
                <RoundedBox args={[0.2, 0.2, 0.2]} radius={0.05} position={[0, -0.55, 0]}>
                    <meshStandardMaterial color="#fcd34d" />
                </RoundedBox>
            </group>
        </group>
    </group>
  );
}

const Leg: React.FC<{ 
    side: 'left' | 'right', 
    legAngle: number, 
    kneeAngle: number 
}> = ({ side, legAngle, kneeAngle }) => {
    const thighRef = useRef<THREE.Group>(null);
    const shinRef = useRef<THREE.Group>(null);
    
    const isLeft = side === 'left';
    const xPos = isLeft ? -0.25 : 0.25;

    useFrame((state, delta) => {
        const damp = 5.0;
        
        // Hip Rotation (Thigh)
        // legAngle 0 = Vertical/Straight (aligned with torso), 90 = Horizontal (sitting)
        const targetHipX = THREE.MathUtils.degToRad(-legAngle); // Negative to raise leg forward
        
        // Wait, if torso is lying down (horizontal), legAngle 0 means leg is horizontal (aligned).
        // If torso is sitting (vertical), legAngle 90 means leg is horizontal.
        // Rotation is relative to PELVIS.
        // Pelvis is part of BodyGroup.
        // Leg Geometry: Thigh box center at -0.5 (below pivot).
        // So at rot 0, thigh is pointing DOWN (-Y).
        // If we want thigh horizontal (Sitting), we rotate X by -90 or +90.
        // Forward flexion is typically -90 in this coordinate system (since facing Z?). 
        // Let's assume positive legAngle is flexion (forward). 
        // With current geometry, -90 X rotation brings the leg up to forward horizontal.
        
        // Let's correct direction based on observation. 
        // Previous code used `targetHipX = degToRad(legAngle)`. 
        // If legAngle=90, rot=90. Thigh goes BACKWARDS?
        // Let's stick to positive = flexion (forward/up) if the geometry allows.
        // Correcting: usually -90 X is forward lift.
        
        if (thighRef.current) {
            thighRef.current.rotation.x = THREE.MathUtils.damp(thighRef.current.rotation.x, -THREE.MathUtils.degToRad(legAngle), damp, delta);
        }

        // Knee Rotation (Shin)
        // kneeAngle 0 = Straight. 90 = Bent (backwards).
        // Positive X rotation swings lower leg BACK.
        const targetKneeX = THREE.MathUtils.degToRad(kneeAngle);
        if (shinRef.current) {
            shinRef.current.rotation.x = THREE.MathUtils.damp(shinRef.current.rotation.x, targetKneeX, damp, delta);
        }
    });

    return (
        <group position={[xPos, -0.4, 0]}> {/* Hip Joint Pivot */}
            <group ref={thighRef}>
                {/* Thigh Geometry - Shifted down */}
                <RoundedBox args={[0.4, 1.0, 0.4]} radius={0.1} position={[0, -0.5, 0]}>
                    <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
                </RoundedBox>

                {/* Knee Joint Pivot - At bottom of Thigh */}
                <group position={[0, -1.0, 0]} ref={shinRef}>
                    {/* Shin Geometry - Shifted down */}
                    <RoundedBox args={[0.38, 1.0, 0.38]} radius={0.1} position={[0, -0.5, 0]}>
                        <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
                    </RoundedBox>
                    {/* Foot */}
                    <RoundedBox args={[0.4, 0.15, 0.6]} radius={0.05} position={[0, -1.05, 0.2]}>
                        <meshStandardMaterial color="#0f172a" />
                    </RoundedBox>
                </group>
            </group>
        </group>
    );
};

const Torso: React.FC<{armAngle: number, elbowAngle: number}> = ({armAngle, elbowAngle}) => {
  return (
  <group>
    {/* Chest */}
    <RoundedBox args={[0.9, 1.0, 0.5]} radius={0.1} position={[0, 0.5, 0]}>
      <meshStandardMaterial color="#3b82f6" roughness={0.4} />
    </RoundedBox>
    {/* Shoulders */}
    <RoundedBox args={[1.3, 0.3, 0.5]} radius={0.1} position={[0, 0.9, 0]}>
       <meshStandardMaterial color="#2563eb" roughness={0.4} />
    </RoundedBox>
    {/* Neck Base */}
    <Cylinder args={[0.12, 0.15, 0.3]} position={[0, 1.1, 0]}>
        <meshStandardMaterial color="#fcd34d" />
    </Cylinder>
    
    <Arm side="left" armAngle={armAngle} elbowAngle={elbowAngle} />
    <Arm side="right" armAngle={armAngle} elbowAngle={elbowAngle} />
  </group>
  );
};

const LowerBody: React.FC<{legAngle: number, kneeAngle: number}> = ({legAngle, kneeAngle}) => {
  return (
  <group>
    {/* Pelvis/Hips */}
    <RoundedBox args={[0.95, 0.4, 0.5]} radius={0.1} position={[0, -0.2, 0]}>
      <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
    </RoundedBox>

    <Leg side="left" legAngle={legAngle} kneeAngle={kneeAngle} />
    <Leg side="right" legAngle={legAngle} kneeAngle={kneeAngle} />
  </group>
  );
};

const Bed: React.FC = () => (
    <group position={[0, -0.5, 0]}>
        {/* Mattress */}
        <RoundedBox args={[2.5, 0.4, 5]} radius={0.1} position={[0, 0, 0.5]}>
             <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
        </RoundedBox>
        {/* Pillow */}
        <RoundedBox args={[1.2, 0.2, 0.6]} radius={0.1} position={[0, 0.3, -1.2]}>
             <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </RoundedBox>
        <Plane args={[10, 10]} rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]}>
            <meshBasicMaterial color="#f8fafc" opacity={0.5} transparent />
        </Plane>
    </group>
);

// --- Main Scene Animation ---

const Scene: React.FC<HumanModelProps> = ({ 
    torsoAngle, bodyRoll, bodyYaw = 0, headYaw, headPitch, 
    legAngle = 0, kneeAngle = 0, armAngle = 0, elbowAngle = 0,
    yOffset = 0
}) => {
  const positionGroup = useRef<THREE.Group>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const headPivotGroup = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    const dampFactor = 5.0; 

    // Complex Body Rotation
    if (bodyGroup.current) {
        // torsoAngle: 90=Sit, 0=Lie. 
        // When lying (0), rotation should be -90 deg X (falling back).
        // When sitting (90), rotation should be 0 deg X (upright).
        const radTorso = THREE.MathUtils.degToRad(torsoAngle - 90); 
        
        const radYaw = THREE.MathUtils.degToRad(bodyYaw);
        const radRoll = THREE.MathUtils.degToRad(bodyRoll);

        const curRot = bodyGroup.current.rotation;
        
        const nextX = THREE.MathUtils.damp(curRot.x, radTorso, dampFactor, delta);
        const nextY = THREE.MathUtils.damp(curRot.y, radYaw, dampFactor, delta);
        const nextZ = THREE.MathUtils.damp(curRot.z, radRoll, dampFactor, delta);

        // Order YXZ: Turn (Yaw) -> Lean Back/Sit (Pitch/X) -> Roll (Z)
        bodyGroup.current.rotation.set(nextX, nextY, nextZ, 'YXZ');
    }

    // Head Animation
    if (headPivotGroup.current) {
        const targetYaw = THREE.MathUtils.degToRad(headYaw);
        const targetHeadPitch = THREE.MathUtils.degToRad(headPitch);
        headPivotGroup.current.rotation.y = THREE.MathUtils.damp(headPivotGroup.current.rotation.y, targetYaw, 5, delta);
        headPivotGroup.current.rotation.x = THREE.MathUtils.damp(headPivotGroup.current.rotation.x, targetHeadPitch, 5, delta);
    }

    // Position Animation (Sliding + Vertical Offset)
    if (positionGroup.current) {
        // Slide X based on Yaw (to stay on bed edge)
        let targetX = 0;
        if (bodyYaw > 45) targetX = 0.5; 
        if (bodyYaw < -45) targetX = -0.5; 
        
        // Vertical Offset (yOffset)
        const targetY = yOffset;

        positionGroup.current.position.x = THREE.MathUtils.damp(positionGroup.current.position.x, targetX, dampFactor, delta);
        positionGroup.current.position.y = THREE.MathUtils.damp(positionGroup.current.position.y, targetY, dampFactor, delta);
    }
  });

  return (
    <group position={[0, -0.5, 0]}> {/* Global Scene offset to lower the bed/floor */}
        {/* Bed stays static relative to the room */}
        <Bed />
        
        {/* Position Group moves the human relative to the bed (includes yOffset) */}
        <group ref={positionGroup}> 
            <group ref={bodyGroup}>
                <LowerBody legAngle={legAngle} kneeAngle={kneeAngle} />
                <Torso armAngle={armAngle} elbowAngle={elbowAngle} />
                <group ref={headPivotGroup} position={[0, 1.2, 0]}>
                    <Head />
                </group>
            </group>
        </group>
        <ContactShadows position={[0, 0.2, 0]} opacity={0.4} scale={10} blur={2} far={2} color="#0f172a" />
    </group>
  );
};

const HumanModel: React.FC<HumanModelProps> = (props) => {
  return (
    <div className="w-full h-full bg-slate-50 cursor-move">
      <Canvas shadows camera={{ position: [5.5, 4, 5.5], fov: 30 }}>
        <Environment preset="studio" />
        <ambientLight intensity={0.4} />
        <directionalLight position={[-5, 5, 5]} intensity={0.8} castShadow shadow-bias={-0.0001} />
        <Scene {...props} />
        <OrbitControls 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 1.9}
            enablePan={false}
            enableZoom={true}
            maxDistance={12}
            minDistance={3}
        />
      </Canvas>
    </div>
  );
};

export default HumanModel;