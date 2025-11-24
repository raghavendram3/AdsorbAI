
export const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Na: '#AB5CF2',
  Mg: '#8AFF00',
  Al: '#BFA6A6',
  Si: '#F0C8A0',
  P: '#FF8000',
  S: '#FFFF30',
  Cl: '#1FF01F',
  K: '#8F40D4',
  Ca: '#3DFF00',
  Ti: '#BFC2C7',
  Fe: '#E06633',
  Ni: '#50D050',
  Cu: '#C88033',
  Zn: '#7D80B0',
  Au: '#FFD123',
  Ag: '#C0C0C0',
  Pt: '#D0D0E0',
  Pd: '#006985',
  // Default fallback
  X: '#FF00FF'
};

export const ATOMIC_RADII: Record<string, number> = {
  H: 0.37,
  C: 0.77,
  N: 0.75,
  O: 0.73,
  F: 0.71,
  Na: 1.54,
  Mg: 1.30,
  Al: 1.18,
  Si: 1.11,
  P: 1.06,
  S: 1.02,
  Cl: 0.99,
  K: 1.96,
  Ca: 1.74,
  Ti: 1.36,
  Fe: 1.25,
  Ni: 1.21,
  Cu: 1.28,
  Zn: 1.31,
  Au: 1.44,
  Ag: 1.44,
  Pt: 1.38,
  Pd: 1.37,
  X: 1.0
};

// Physical properties for deterministic generation
export interface ElementData {
  latticeConstant: number; // in Angstroms (FCC)
  mpId: string;
  formationEnergy: number; // eV/atom
  bandGap: number; // eV
  symmetry: string;
  electronegativity: number; // Pauling scale (for binding energy heuristics)
}

export const ELEMENT_PROPERTIES: Record<string, ElementData> = {
  Au: { latticeConstant: 4.078, mpId: 'mp-81', formationEnergy: 0.0, bandGap: 0.0, symmetry: 'Fm-3m', electronegativity: 2.54 },
  Ag: { latticeConstant: 4.085, mpId: 'mp-124', formationEnergy: 0.0, bandGap: 0.0, symmetry: 'Fm-3m', electronegativity: 1.93 },
  Cu: { latticeConstant: 3.615, mpId: 'mp-30', formationEnergy: 0.0, bandGap: 0.0, symmetry: 'Fm-3m', electronegativity: 1.90 },
  Pt: { latticeConstant: 3.924, mpId: 'mp-126', formationEnergy: 0.0, bandGap: 0.0, symmetry: 'Fm-3m', electronegativity: 2.28 },
  Pd: { latticeConstant: 3.890, mpId: 'mp-2', formationEnergy: 0.0, bandGap: 0.0, symmetry: 'Fm-3m', electronegativity: 2.20 },
  Ni: { latticeConstant: 3.524, mpId: 'mp-23', formationEnergy: 0.0, bandGap: 0.0, symmetry: 'Fm-3m', electronegativity: 1.91 },
  Al: { latticeConstant: 4.049, mpId: 'mp-134', formationEnergy: 0.0, bandGap: 0.0, symmetry: 'Fm-3m', electronegativity: 1.61 }
};

export const DEFAULT_CAMERA_POSITION: [number, number, number] = [10, 10, 10];
