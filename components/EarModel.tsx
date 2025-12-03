import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Language } from '../types';

// Fix for React Three Fiber intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface EarModelProps {
  torsoAngle: number;
  bodyRoll: number;
  headYaw: number;
  headPitch: number;
  stoneProgress: number; 
  lang: Language;
}

// --- Organic Canal Geometry ---

const CanalTube: React.FC<{ 
  points: THREE.Vector3[], 
  color: string, 
  opacity?: number, 
  radius?: number
}> = ({ points, color, opacity = 0.3, radius = 0.12 }) => {
    const curve = useMemo(() => new THREE.CatmullRomCurve3(points, true, 'centripetal'), [points]);
    
    return (
        <mesh>
            <tubeGeometry args={[curve, 64, radius, 16, true]} />
            <meshPhysicalMaterial 
                color={color} 
                transparent 
                opacity={opacity} 
                roughness={0.1} 
                metalness={0.1}
                transmission={0.6}
                thickness={0.5}
                clearcoat={1}
            />
        </mesh>
    );
};

const Otoliths: React.FC<{ curvePoints: THREE.Vector3[], progress: number }> = ({ curvePoints, progress }) => {
    const stonesRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();
    const stoneCount = 15;
    
    // Create the curve once
    const curve = useMemo(() => new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal'), [curvePoints]);

    useFrame(() => {
        if (!stonesRef.current) return;

        // Map progress (0..1) to a section of the tube.
        // In this specific geometry, we assume the path of the stones matches the Epley flow.
        // We add a little offset to each stone so they look like a clump.
        
        const baseT = progress; 

        for (let i = 0; i < stoneCount; i++) {
            // Scatter stones along the curve near the progress point
            const spread = 0.08; // How spread out the clump is
            const noise = (i / stoneCount) * spread - (spread/2);
            
            // Calculate position on curve (looping 0..1)
            let t = (baseT + noise);
            if (t > 1) t -= 1;
            if (t < 0) t += 1;

            const position = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            
            // Add slight random radial jitter to keep them inside the tube but not in a single line
            const up = new THREE.Vector3(0, 1, 0);
            const axis = new THREE.Vector3().crossVectors(up, tangent).normalize();
            const jitterX = (Math.random() - 0.5) * 0.08;
            const jitterY = (Math.random() - 0.5) * 0.08;
            
            dummy.position.copy(position).add(new THREE.Vector3(jitterX, jitterY, 0));
            dummy.scale.setScalar(0.04 + Math.random() * 0.03);
            dummy.rotation.x = Math.random() * Math.PI;
            dummy.rotation.z = Math.random() * Math.PI;
            
            dummy.updateMatrix();
            stonesRef.current.setMatrixAt(i, dummy.matrix);
        }
        stonesRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={stonesRef} args={[undefined, undefined, stoneCount]}>
            <dodecahedronGeometry args={[1, 0]} /> {/* Low poly stones look like crystals */}
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} toneMapped={false} />
        </instancedMesh>
    );
}

const LabyrinthSystem: React.FC<{ stoneProgress: number }> = ({ stoneProgress }) => {
    // Define geometries relative to a central Utricle at (0,0,0)
    // Scale: roughly 1 unit = 1 canal diameter
    
    // 1. Posterior Canal (The one affected in this app)
    // It loops backward and downward from the utricle.
    // Points define the loop shape.
    const posteriorPoints = useMemo(() => [
        new THREE.Vector3(0.1, 0.2, 0),    // Common Crus
        new THREE.Vector3(0.6, 0.8, -0.5), // Top Arch
        new THREE.Vector3(1.2, 0, -0.8),   // Back Most
        new THREE.Vector3(0.6, -1.0, -0.4),// Bottom Loop
        new THREE.Vector3(0.1, -0.4, 0),   // Ampulla
        new THREE.Vector3(0, 0, 0)         // Return to Hub
    ], []);

    // 2. Anterior Canal (Superior)
    // Loops upward and forward
    const anteriorPoints = useMemo(() => [
        new THREE.Vector3(0.1, 0.2, 0),    // Common Crus
        new THREE.Vector3(0.5, 1.2, 0.4),  // Top
        new THREE.Vector3(0.8, 0.5, 0.8),  // Front
        new THREE.Vector3(0.2, 0, 0.4),    // Ampulla
        new THREE.Vector3(0, 0, 0)
    ], []);

    // 3. Horizontal Canal (Lateral)
    // Loops sideways
    const horizontalPoints = useMemo(() => [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.5, 0, 0.5),
        new THREE.Vector3(1.2, 0, 0),
        new THREE.Vector3(0.6, 0, -0.6),
        new THREE.Vector3(0.1, -0.1, -0.1)
    ], []);

    return (
        <group>
             {/* Utricle / Saccule Hub */}
             <mesh position={[0, -0.1, 0]}>
                <sphereGeometry args={[0.35, 32, 32]} />
                <meshPhysicalMaterial color="#fbbf24" transmission={0.4} roughness={0.2} />
             </mesh>

             {/* Canals */}
             <CanalTube points={posteriorPoints} color="#ef4444" radius={0.14} opacity={0.4} /> {/* Red = Affected */}
             <CanalTube points={anteriorPoints} color="#10b981" radius={0.11} opacity={0.15} />
             <CanalTube points={horizontalPoints} color="#3b82f6" radius={0.11} opacity={0.15} />

             {/* Otoliths inside Posterior Canal */}
             {/* We need to reverse the points or reorder them depending on the direction of flow for Epley. 
                 Epley moves stones from Ampulla (bottom/front) -> Top -> Common Crus -> Utricle.
                 Our points defined above go Common -> Top -> Bottom -> Ampulla.
                 So we reverse the array for the stones to follow the therapeutic path.
             */}
             <Otoliths curvePoints={[...posteriorPoints].reverse()} progress={stoneProgress} />
             
             <Text position={[1.4, -0.5, -0.5]} fontSize={0.15} color="white" anchorX="center" anchorY="middle">
                Posterior
             </Text>
        </group>
    );
};

const Scene: React.FC<EarModelProps> = (props) => {
    const innerEarRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (innerEarRef.current) {
            // Smooth rotations
            const rotTorsoX = THREE.MathUtils.degToRad(props.torsoAngle - 90);
            const rotBodyZ = THREE.MathUtils.degToRad(props.bodyRoll);
            const rotHeadY = THREE.MathUtils.degToRad(props.headYaw);
            const rotHeadX = THREE.MathUtils.degToRad(props.headPitch);

            const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotBodyZ);
            const qSit = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotTorsoX);
            const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotHeadY);
            const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotHeadX);
            
            const targetQ = new THREE.Quaternion().copy(qRoll).multiply(qSit).multiply(qYaw).multiply(qPitch);
            
            innerEarRef.current.quaternion.slerp(targetQ, 4 * delta);
        }
    });

    return (
        <>
            <group ref={innerEarRef}>
                <LabyrinthSystem stoneProgress={props.stoneProgress} />
            </group>

            {/* Gravity Indicator */}
            <group position={[2.5, 2, 0]}>
                <Float speed={2} floatIntensity={0.2}>
                    <Text position={[0, 0.6, 0]} fontSize={0.2} color="#94a3b8" anchorX="center">
                        {props.lang === 'zh' ? '重力方向' : 'GRAVITY'}
                    </Text>
                    <mesh rotation={[0, 0, Math.PI]}>
                        <arrowHelper args={[new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 0), 1, 0xef4444]} />
                    </mesh>
                </Float>
            </group>
        </>
    );
}

const EarModel: React.FC<EarModelProps> = (props) => {
  return (
    <div className="w-full h-full relative bg-slate-900">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
        
        <Environment preset="city" />
        
        <Scene {...props} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
      
      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 pointer-events-none text-right bg-black/30 p-2 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-end gap-2 mb-1">
              <span className="text-white/90 text-xs font-bold">{props.lang === 'zh' ? '后半规管 (复位目标)' : 'Posterior Canal (Target)'}</span>
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
          </div>
          <div className="flex items-center justify-end gap-2">
              <span className="text-white/60 text-xs">{props.lang === 'zh' ? '耳石 (晶体)' : 'Otoliths (Crystals)'}</span>
              <div className="w-2 h-2 rounded-full bg-white border border-white/50"></div>
          </div>
      </div>
    </div>
  );
};

export default EarModel;