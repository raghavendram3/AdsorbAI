import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Bounds, AccumulativeShadows, RandomizedLight, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { MaterialStructure, AdsorptionSite, Atom } from '../types';

interface StructureViewerProps {
  structure: MaterialStructure | null;
  sites: AdsorptionSite[];
  isLoading: boolean;
}

// -- VISUALIZATION CONSTANTS --
const BOND_RADIUS = 0.15;
const ATOM_SCALE = 0.5; // Scale factor for atomic radii to look nice
const BOND_TOLERANCE = 1.25; // Multiplier for covalent radii sum

// -- HELPER COMPONENTS --

const AtomMesh: React.FC<{ 
  position: [number, number, number]; 
  color: string; 
  radius: number;
  element: string;
  hovered: boolean;
  onHover: (state: boolean) => void;
}> = ({ position, color, radius, element, hovered, onHover }) => {
  return (
    <mesh 
      position={position} 
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(false); }}
    >
      <sphereGeometry args={[radius * ATOM_SCALE, 32, 32]} />
      <meshPhysicalMaterial 
        color={color} 
        roughness={0.2} 
        metalness={0.3} 
        clearcoat={0.8}
        clearcoatRoughness={0.1}
      />
      {hovered && (
        <Html distanceFactor={8}>
          <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded border border-white/20 pointer-events-none backdrop-blur">
            {element}
          </div>
        </Html>
      )}
    </mesh>
  );
};

const BondMesh: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
}> = ({ start, end }) => {
  const curve = useMemo(() => {
    return new THREE.LineCurve3(start, end);
  }, [start, end]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 1, BOND_RADIUS, 8, false]} />
      <meshStandardMaterial color="#888" roughness={0.5} metalness={0.5} />
    </mesh>
  );
};

const UnitCellBox: React.FC<{ vectors?: number[][] }> = ({ vectors }) => {
  if (!vectors || vectors.length !== 3) return null;

  // Convert to Vector3
  const a = new THREE.Vector3(...vectors[0]);
  const b = new THREE.Vector3(...vectors[1]);
  const c = new THREE.Vector3(...vectors[2]);
  const origin = new THREE.Vector3(0, 0, 0);

  // Calculate all 8 corners
  const p0 = origin.clone();
  const p1 = a.clone();
  const p2 = b.clone();
  const p3 = c.clone();
  const p4 = a.clone().add(b);
  const p5 = a.clone().add(c);
  const p6 = b.clone().add(c);
  const p7 = a.clone().add(b).add(c);

  // Define edges for LineSegments
  const points = useMemo(() => [
    p0, p1, p0, p2, p0, p3, // Origin connections
    p1, p4, p1, p5,         // from a
    p2, p4, p2, p6,         // from b
    p3, p5, p3, p6,         // from c
    p4, p7, p5, p7, p6, p7  // to corner
  ], [p0, p1, p2, p3, p4, p5, p6, p7]);

  return (
    <lineSegments>
      <bufferGeometry>
        <float32BufferAttribute attach="attributes-position" args={[points.flatMap(v => [v.x, v.y, v.z]), 3]} count={points.length} />
      </bufferGeometry>
      <lineBasicMaterial color="#475569" opacity={0.5} transparent dashSize={0.2} gapSize={0.1} />
    </lineSegments>
  );
};

const SiteMarker: React.FC<{
  position: [number, number, number];
  type: string;
  energy: number;
}> = ({ position, type, energy }) => {
  const getColor = (e: number) => {
    if (e < -2.0) return '#10b981'; 
    if (e < -1.0) return '#3b82f6';
    return '#ef4444';
  };

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshStandardMaterial 
            color={getColor(energy)} 
            emissive={getColor(energy)} 
            emissiveIntensity={0.5} 
            transparent 
            opacity={0.9} 
        />
      </mesh>
      <mesh visible={false}>
         <sphereGeometry args={[0.5]} /> {/* Hitbox */}
         <Html distanceFactor={12} zIndexRange={[100, 0]}>
           <div className="bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded border border-slate-600 whitespace-nowrap shadow-xl transform -translate-y-8">
             <div className="font-bold">{type}</div>
             <div className="font-mono text-slate-300">{energy.toFixed(2)} eV</div>
           </div>
         </Html>
      </mesh>
    </group>
  );
};

// -- MAIN SCENE CONTENT --

const MolecularScene: React.FC<{ 
  structure: MaterialStructure; 
  sites: AdsorptionSite[]; 
}> = ({ structure, sites }) => {
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);

  // Calculate Bonds
  const bonds = useMemo(() => {
    const bondsList: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const atoms = structure.atoms;
    
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a1 = atoms[i];
        const a2 = atoms[j];
        const v1 = new THREE.Vector3(a1.x, a1.y, a1.z);
        const v2 = new THREE.Vector3(a2.x, a2.y, a2.z);
        const dist = v1.distanceTo(v2);
        
        // Simple threshold: sum of radii * tolerance
        const threshold = ((a1.radius || 1) + (a2.radius || 1)) * ATOM_SCALE * BOND_TOLERANCE;
        
        if (dist < threshold && dist > 0.1) {
          bondsList.push({ start: v1, end: v2 });
        }
      }
    }
    return bondsList;
  }, [structure]);

  // Center of mass for camera targeting
  const center = useMemo(() => {
    if (structure.atoms.length === 0) return new THREE.Vector3(0,0,0);
    let x=0, y=0, z=0;
    structure.atoms.forEach(a => { x+=a.x; y+=a.y; z+=a.z; });
    return new THREE.Vector3(x, y, z).divideScalar(structure.atoms.length);
  }, [structure]);

  return (
    <group position={center.clone().negate()}>
      {/* Unit Cell */}
      <UnitCellBox vectors={structure.latticeVectors} />

      {/* Atoms */}
      {structure.atoms.map((atom) => (
        <AtomMesh
          key={`atom-${atom.id}`}
          position={[atom.x, atom.y, atom.z]}
          color={atom.color || '#ccc'}
          radius={atom.radius || 1.5}
          element={atom.element}
          hovered={hoveredAtom === atom.id}
          onHover={(h) => setHoveredAtom(h ? atom.id : null)}
        />
      ))}

      {/* Bonds */}
      {bonds.map((bond, idx) => (
        <BondMesh key={`bond-${idx}`} start={bond.start} end={bond.end} />
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
      
      {/* Shadows for depth perception */}
      <AccumulativeShadows temporal frames={100} color="#000000" colorBlend={2} opacity={0.4} scale={20} position={[0, -2, 0]}>
        <RandomizedLight amount={8} radius={4} ambient={0.5} intensity={1} position={[5, 5, -10]} bias={0.001} />
      </AccumulativeShadows>
    </group>
  );
};

export const StructureViewer: React.FC<StructureViewerProps> = ({ structure, sites, isLoading }) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl overflow-hidden relative border border-slate-800 shadow-2xl">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-t-2 border-emerald-500 rounded-full animate-spin reverse"></div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-semibold tracking-wide">SIMULATING</div>
              <div className="text-xs text-slate-500 font-mono mt-1">Running DFT Calculations...</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!structure && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 z-10">
          <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center mb-3">
             <div className="w-2 h-2 bg-slate-600 rounded-full animate-ping"></div>
          </div>
          <p className="font-medium">No structure loaded</p>
          <p className="text-xs opacity-60">Use the Agent to generate a surface</p>
        </div>
      )}

      <Canvas shadows dpr={[1, 2]} camera={{ position: [8, 8, 8], fov: 45 }}>
        {/* Lighting Setup */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#aabbcc" />
        
        <Environment preset="city" />

        {structure && (
          <Bounds fit clip observe margin={0.8}>
            <MolecularScene structure={structure} sites={sites} />
          </Bounds>
        )}
        
        <OrbitControls 
          makeDefault 
          autoRotate={!isLoading && !!structure} 
          autoRotateSpeed={0.5} 
          enablePan={true} 
          enableZoom={true}
          minDistance={2}
          maxDistance={50}
        />
      </Canvas>
      
      {/* Legend / HUD */}
      <div className="absolute top-4 right-4 pointer-events-none z-10">
          <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-md text-xs font-mono text-slate-400 shadow-lg">
            {structure ? `${structure.atoms.length} Atoms` : 'System Ready'}
          </div>
      </div>
      
      <div className="absolute bottom-4 left-4 pointer-events-auto z-10">
        <div className="p-3 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Energy Map</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] bg-emerald-500"></div>
              <span className="text-xs text-slate-300">Strong Binding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] bg-blue-500"></div>
              <span className="text-xs text-slate-300">Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] bg-red-500"></div>
              <span className="text-xs text-slate-300">Unstable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};