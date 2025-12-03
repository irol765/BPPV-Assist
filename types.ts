import React from 'react';

export enum CanalType {
  POSTERIOR = 'Posterior',
  HORIZONTAL = 'Horizontal',
  ANTERIOR = 'Anterior'
}

export enum Side {
  LEFT = 'Left',
  RIGHT = 'Right'
}

export interface DiagnosisResult {
  hasBPPV: boolean;
  side?: Side;
  canal?: CanalType;
  confidence: number;
  reasoning: string;
}

export interface ManeuverStep {
  id: number;
  title: string;
  description: string;
  durationSeconds: number;
  
  // Animation Physics Targets
  torsoAngle: number; // 90 = sitting up, 0 = lying flat
  bodyRoll: number;   // 0 = flat on back, 90 = right side, -90 = left side
  bodyYaw?: number;   // Rotation of the whole body on bed. 0 = feet at footboard. 90 = facing left edge.
  headYaw: number;    // Left/Right rotation (degrees). Positive = Left, Negative = Right
  headPitch: number;  // Up/Down tilt. Positive = Chin tuck, Negative = Extension (hanging back)
  legAngle?: number;  // 0 = Legs straight on bed, 80 = Legs hanging down (Sitting)
  
  // Otolith Simulation
  otolithProgressStart: number; // 0 to 1 path progress
  otolithProgressEnd: number;   // 0 to 1 path progress
}

export interface Maneuver {
  id: string;
  name: string;
  description: string;
  precautions: string[];
  recommendedFor: {
    canal: CanalType;
    side?: Side; 
  };
  steps: ManeuverStep[];
}

export type Language = 'en' | 'zh';

// Global JSX augmentation for React Three Fiber components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Basic Three.js elements used in R3F
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      tubeGeometry: any;
      dodecahedronGeometry: any;
      sphereGeometry: any;
      instancedMesh: any;
      arrowHelper: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
      directionalLight: any;
      
      // Catch-all to allow any other React Three Fiber elements
      [elemName: string]: any;
    }
  }
}