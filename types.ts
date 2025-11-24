
export interface Atom {
  id: number;
  element: string;
  x: number;
  y: number;
  z: number;
  color?: string;
  radius?: number;
}

export interface AdsorptionSite {
  id: string;
  type: 'Top' | 'Bridge' | 'Hollow' | 'fcc' | 'hcp';
  coordinates: [number, number, number]; // x, y, z
  energy: number; // Binding energy in eV
  description: string;
}

export interface MaterialStructure {
  formula: string;
  description: string;
  mpId?: string;       // Materials Project ID
  millerIndex?: string; // e.g., (1 1 1)
  atoms: Atom[];
  latticeVectors?: number[][];
  // New fields for MP data
  formationEnergy?: number;
  bandGap?: number;
  symmetry?: string;
}

export interface AnalysisResult {
  sites: AdsorptionSite[];
  summary: string;
  potentialUsed: string; // e.g., "FAIR-Chem UMA-v1"
  calculationTime: string;
  // OCP Specific
  systemId?: string;
  model?: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING_STRUCTURE = 'LOADING_STRUCTURE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source?: string; // e.g., 'ASE', 'Pymatgen', 'System'
}
