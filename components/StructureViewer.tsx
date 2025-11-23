import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MaterialStructure, AdsorptionSite } from '../types';

interface StructureViewerProps {
  structure: MaterialStructure | null;
  sites: AdsorptionSite[];
  isLoading: boolean;
}

const AtomMesh: React.FC<{ 
  position: [number, number, number]; 
  color: string; 
  radius: number; 
  element: string; 
}> = ({ position, color, radius, element }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius * 0.4, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      {/* Optional: Add text label if needed, or tooltip logic */}
    </mesh>
  );
};

const SiteMarker: React.FC<{
  position: [number, number, number];
  type: string;
  energy: number;
}> = ({ position, type, energy }) => {
  // Color scale for energy: Blue (stable, very negative) -> Red (unstable, less negative/positive)
  // Assuming range -3.0 to 0.0 eV roughly
  const getColor = (e: number) => {
    if (e < -2.0) return '#10b981'; // Emerald
    if (e < -1.0) return '#3b82f6'; // Blue
    return '#ef4444'; // Red
  };

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={getColor(energy)} transparent opacity={0.6} />
      </mesh>
      <Html distanceFactor={10}>
        <div className="bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap pointer-events-none">
          {type} ({energy.toFixed(2)} eV)
        </div>
      </Html>
    </group>
  );
};

const SceneContent: React.FC<{ 
  structure: MaterialStructure; 
  sites: AdsorptionSite[]; 
}> = ({ structure, sites }) => {
  // Center the structure
  const center = useMemo(() => {
    if (structure.atoms.length === 0) return [0,0,0];
    const xs = structure.atoms.map(a => a.x);
    const ys = structure.atoms.map(a => a.y);
    const zs = structure.atoms.map(a => a.z);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    return [-cx, -cy, -cz] as [number, number, number];
  }, [structure]);

  return (
    <group position={center}>
      {/* Bonds generation is complex without connectivity graph, omitting for simplicity or could simulate based on distance */}
      
      {/* Atoms */}
      {structure.atoms.map((atom) => (
        <AtomMesh
          key={`atom-${atom.id}`}
          position={[atom.x, atom.y, atom.z]}
          color={atom.color || '#ccc'}
          radius={atom.radius || 1}
          element={atom.element}
        />
      ))}

      {/* Adsorption Sites */}
      {sites.map((site) => (
        <SiteMarker
          key={`site-${site.id}`}
          position={site.coordinates}
          type={site.type}
          energy={site.energy}
        />
      ))}
    </group>
  );
};

export const StructureViewer: React.FC<StructureViewerProps> = ({ structure, sites, isLoading }) => {
  return (
    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span className="text-blue-400 font-medium animate-pulse">Running Simulation...</span>
          </div>
        </div>
      )}
      
      {!structure && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          <p>Load a material to visualize structure</p>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 0, 15], fov: 45 }}>
        {structure && (
          <Stage environment="city" intensity={0.6}>
            <SceneContent structure={structure} sites={sites} />
          </Stage>
        )}
        <OrbitControls makeDefault autoRotate={!!structure} autoRotateSpeed={1} />
      </Canvas>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 p-3 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700 text-xs">
        <h4 className="font-semibold text-slate-300 mb-2">Energy Scale (eV)</h4>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-400">Strong (&lt; -2.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Moderate (&lt; -1.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">Weak / Unstable</span>
          </div>
        </div>
      </div>
    </div>
  );
};