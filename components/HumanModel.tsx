import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Sphere, Cylinder, Box, ContactShadows, OrbitControls, Plane, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Fix for React Three Fiber intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// --- Types ---
interface HumanModelProps {
  torsoAngle: number; // 90 (sit) to 0 (lie)
  bodyRoll: number;   // -90 (left side) to 90 (right side)
  bodyYaw?: number;   // Rotation of whole body relative to bed (0=longitudinal, 90=facing side)
  headYaw: number;    // -45 to 45 (relative to torso)
  headPitch: number;  // -30 (back) to 20 (tuck)
  legAngle?: number;  // 0 (horizontal on bed) to 90 (hanging down)
}

// --- Geometry Components ---

const Head: React.FC = () => {
  return (
    <group>
      {/* Cranium */}
      <Sphere args={[0.3, 32, 32]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#fcd34d" roughness={0.3} />
      </Sphere>
      {/* Face Flat (to help orient direction) */}
      <RoundedBox args={[0.45, 0.5, 0.2]} radius={0.05} position={[0, 0.4, 0.2]}>
          <meshStandardMaterial color="#fcd34d" roughness={0.3} />
      </RoundedBox>
      
      {/* Nose */}
      <Box args={[0.08, 0.15, 0.1]} position={[0, 0.4, 0.35]}>
        <meshStandardMaterial color="#eab308" />
      </Box>
      
      {/* Eyes (Closed/Neutral) */}
      <Box args={[0.08, 0.02, 0.05]} position={[-0.12, 0.45, 0.31]}>
         <meshStandardMaterial color="#78350f" />
      </Box>
      <Box args={[0.08, 0.02, 0.05]} position={[0.12, 0.45, 0.31]}>
         <meshStandardMaterial color="#78350f" />
      </Box>

      {/* Ears (Critical for context) */}
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

const Torso: React.FC = () => (
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
    {/* Arms (Simplified, tucked) */}
    <RoundedBox args={[0.25, 1.0, 0.3]} radius={0.1} position={[-0.7, 0.4, 0.1]}>
       <meshStandardMaterial color="#60a5fa" />
    </RoundedBox>
    <RoundedBox args={[0.25, 1.0, 0.3]} radius={0.1} position={[0.7, 0.4, 0.1]}>
       <meshStandardMaterial color="#60a5fa" />
    </RoundedBox>
  </group>
);

const LowerBody: React.FC = () => (
  <group>
    {/* 
        Simplified Lower Body Geometry 
        Origin (0,0,0) is at the Pivot (Hips).
        Y+ is Up, Y- is Down (Legs direction).
    */}
    
    {/* Hips - Centered at -0.2 to hang below pivot */}
    <RoundedBox args={[0.95, 0.4, 0.5]} radius={0.1} position={[0, -0.2, 0]}>
      <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
    </RoundedBox>

    {/* Left Leg */}
    <RoundedBox args={[0.4, 2.0, 0.4]} radius={0.1} position={[-0.25, -1.4, 0]}>
       <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
    </RoundedBox>
    {/* Left Foot */}
    <RoundedBox args={[0.42, 0.15, 0.6]} radius={0.05} position={[-0.25, -2.45, 0.2]}>
        <meshStandardMaterial color="#0f172a" />
    </RoundedBox>

    {/* Right Leg */}
    <RoundedBox args={[0.4, 2.0, 0.4]} radius={0.1} position={[0.25, -1.4, 0]}>
       <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
    </RoundedBox>
    {/* Right Foot */}
    <RoundedBox args={[0.42, 0.15, 0.6]} radius={0.05} position={[0.25, -2.45, 0.2]}>
        <meshStandardMaterial color="#0f172a" />
    </RoundedBox>
  </group>
);

const Bed: React.FC = () => (
    <group position={[0, -0.5, 0]}>
        {/* Mattress - Top surface at roughly -0.3 
            Width (X) = 2.5
            Length (Z) = 5
        */}
        <RoundedBox args={[2.5, 0.4, 5]} radius={0.1} position={[0, 0, 0.5]}>
             <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
        </RoundedBox>
        {/* Pillow */}
        <RoundedBox args={[1.2, 0.2, 0.6]} radius={0.1} position={[0, 0.3, -1.2]}>
             <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </RoundedBox>
        {/* Floor shadow */}
        <Plane args={[10, 10]} rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]}>
            <meshBasicMaterial color="#f8fafc" opacity={0.5} transparent />
        </Plane>
    </group>
);

// --- Main Scene Animation ---

const Scene: React.FC<HumanModelProps> = ({ torsoAngle, bodyRoll, bodyYaw = 0, headYaw, headPitch, legAngle = 0 }) => {
  const positionGroup = useRef<THREE.Group>(null);
  const yawGroup = useRef<THREE.Group>(null);
  const bodyRollGroup = useRef<THREE.Group>(null);
  const torsoPivotGroup = useRef<THREE.Group>(null);
  const headPivotGroup = useRef<THREE.Group>(null);
  const legsPivotGroup = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Faster, responsive damp factor
    const dampFactor = 5.0; 

    // --- Rotations ---
    if (yawGroup.current) {
        // Rotation of whole body on bed (Y axis)
        const targetYaw = THREE.MathUtils.degToRad(bodyYaw);
        yawGroup.current.rotation.y = THREE.MathUtils.damp(yawGroup.current.rotation.y, targetYaw, dampFactor, delta);
    }

    if (bodyRollGroup.current) {
        // Side rolling (Z axis)
        const targetRoll = THREE.MathUtils.degToRad(bodyRoll);
        bodyRollGroup.current.rotation.z = THREE.MathUtils.damp(bodyRollGroup.current.rotation.z, targetRoll, dampFactor, delta);
    }

    if (torsoPivotGroup.current) {
        // Sit Up (X axis)
        // torsoAngle: 90 = Sit (Upright), 0 = Lie (Flat)
        const targetPitch = THREE.MathUtils.degToRad(torsoAngle - 90);
        torsoPivotGroup.current.rotation.x = THREE.MathUtils.damp(torsoPivotGroup.current.rotation.x, targetPitch, dampFactor, delta);
    }

    if (headPivotGroup.current) {
        const targetYaw = THREE.MathUtils.degToRad(headYaw);
        const targetHeadPitch = THREE.MathUtils.degToRad(headPitch);
        
        headPivotGroup.current.rotation.y = THREE.MathUtils.damp(headPivotGroup.current.rotation.y, targetYaw, 5, delta);
        headPivotGroup.current.rotation.x = THREE.MathUtils.damp(headPivotGroup.current.rotation.x, targetHeadPitch, 5, delta);
    }

    if (legsPivotGroup.current) {
        // Leg Logic:
        // legAngle = 0  -> Horizontal on bed.
        // legAngle = 90 -> Hanging Down.
        const targetRot = THREE.MathUtils.degToRad(legAngle - 90);
        legsPivotGroup.current.rotation.x = THREE.MathUtils.damp(legsPivotGroup.current.rotation.x, targetRot, dampFactor, delta);
    }

    // --- Position Logic (Slide to edge) ---
    if (positionGroup.current) {
        // If bodyYaw is significant (meaning we are turning to sit on the side),
        // we move the body to the edge of the bed so legs don't clip.
        // Bed Width = 2.5 (Edge at 1.25). Hips width ~0.9.
        // Target position ~ 1.0 or -1.0 depending on Yaw direction.
        
        let targetX = 0;
        
        // Threshold check for intended "Side Sit"
        if (bodyYaw > 45) targetX = 1.0;  // Facing Left -> Move to Left Edge (X+)
        if (bodyYaw < -45) targetX = -1.0; // Facing Right -> Move to Right Edge (X-)

        // Smoothly slide
        positionGroup.current.position.x = THREE.MathUtils.damp(positionGroup.current.position.x, targetX, dampFactor, delta);
    }
  });

  return (
    <group position={[0, -0.2, 0]}> {/* Shift whole scene vertically */}
        <Bed />
        
        {/* Animated Position Group (Slides to edge) */}
        <group ref={positionGroup}> 
             {/* Animated Yaw Group (Turns to face side) */}
            <group ref={yawGroup}>
                 {/* Animated Roll Group (Lying on side) */}
                <group ref={bodyRollGroup}>
                    
                    {/* Legs Group - Sibling to Torso, rotates independently on X */}
                    <group ref={legsPivotGroup} position={[0, 0, 0]}>
                         <LowerBody />
                    </group>

                    {/* Torso Group */}
                    <group ref={torsoPivotGroup} position={[0, 0, 0]}>
                        <Torso />
                        <group ref={headPivotGroup} position={[0, 1.2, 0]}>
                            <Head />
                        </group>
                    </group>

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
      <Canvas shadows camera={{ position: [3.5, 2.5, 3.5], fov: 30 }}>
        <Environment preset="studio" />
        <ambientLight intensity={0.4} />
        <directionalLight position={[-5, 5, 5]} intensity={0.8} castShadow shadow-bias={-0.0001} />
        <Scene {...props} />
        <OrbitControls 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 1.9}
            enablePan={false}
            enableZoom={true}
            maxDistance={10}
            minDistance={3}
        />
      </Canvas>
    </div>
  );
};

export default HumanModel;