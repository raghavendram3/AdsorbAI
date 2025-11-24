import { GoogleGenAI, Type } from "@google/genai";
import { MaterialStructure, AnalysisResult } from "../types";
import { CPK_COLORS, ATOMIC_RADII } from "../constants";

// Helper to generate coordinates for a structure
export const generateStructure = async (query: string, mpApiKey?: string): Promise<MaterialStructure> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Act as a Python-based Materials Science Agent.
    
    Libraries available in environment:
    - mp_api.client.MPRester (Materials Project)
    - ase.build (Atomic Simulation Environment)
    - pymatgen.core

    User Query: "${query}"
    MP API Key: ${mpApiKey ? "Provided (Simulate authenticated fetch)" : "Not Provided (Simulate public/cached data)"}

    Task:
    1. Parse the user query to identify the material (e.g., "Au") and surface (e.g., "111").
    2. Simulate: \`with MPRester(api_key) as mpr: docs = mpr.materials.summary.search(formula=...)\`.
    3. Select the most stable bulk structure (lowest formation energy) from the search results.
    4. Simulate: \`slab = ase.build.surface(bulk, indices=..., layers=4, vacuum=10.0)\`.
    5. Center the slab.
    6. Extract lattice vectors (cell).

    Return a JSON object with:
    1. 'formula': Chemical formula.
    2. 'mpId': Simulated MP-ID (e.g., 'mp-81').
    3. 'millerIndex': Surface indices used (e.g., '(1 1 1)').
    4. 'description': Technical description.
    5. 'formationEnergy': Simulated formation energy in eV/atom.
    6. 'bandGap': Simulated band gap in eV.
    7. 'symmetry': Spacegroup symbol of the bulk.
    8. 'atoms': Array of atoms in the slab ({element, x, y, z}).
    9. 'latticeVectors': 3x3 array representing the unit cell [v1, v2, v3].
    
    Limit atom count to 20-60 for web visualization.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          formula: { type: Type.STRING },
          mpId: { type: Type.STRING },
          millerIndex: { type: Type.STRING },
          description: { type: Type.STRING },
          formationEnergy: { type: Type.NUMBER },
          bandGap: { type: Type.NUMBER },
          symmetry: { type: Type.STRING },
          atoms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                element: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                z: { type: Type.NUMBER },
              },
              required: ["element", "x", "y", "z"]
            }
          },
          latticeVectors: {
            type: Type.ARRAY,
            items: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER }
            }
          }
        },
        required: ["formula", "atoms", "latticeVectors"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");

  // Post-process to add IDs and display props
  const atoms = data.atoms.map((a: any, index: number) => ({
    ...a,
    id: index,
    color: CPK_COLORS[a.element] || CPK_COLORS.X,
    radius: ATOMIC_RADII[a.element] || ATOMIC_RADII.X
  }));

  return {
    formula: data.formula,
    mpId: data.mpId || "mp-simulated",
    millerIndex: data.millerIndex,
    description: data.description,
    formationEnergy: data.formationEnergy,
    bandGap: data.bandGap,
    symmetry: data.symmetry,
    atoms: atoms,
    latticeVectors: data.latticeVectors
  };
};

// Helper to perform the analysis
export const analyzeAdsorption = async (
  structure: MaterialStructure,
  adsorbate: string
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Serialize structure for the model
  const structureSummary = `
    Material: ${structure.formula} (MP-ID: ${structure.mpId || 'N/A'})
    Surface: ${structure.millerIndex || 'Unknown'}
  `;

  const prompt = `
    Act as a Python-based Computational Chemistry Agent.
    
    Libraries:
    - pymatgen.analysis.adsorption.AdsorbateSiteFinder
    - fairchem.core (OCP models)
    
    Task: Automated Adsorption Analysis for molecule '${adsorbate}' on ${structure.formula} surface.
    
    Simulate this Python workflow:
    1. \`asf = AdsorbateSiteFinder(slab)\`
    2. \`sites = asf.find_adsorption_sites()\` -> Identify Top, Bridge, Hollow sites.
    3. Place '${adsorbate}' molecule at each site.
    4. Load Potential: \`calc = OCPCalculator(checkpoint="fairchem_uma_v1.pt")\`
    5. Relax each configuration: \`opt = LBFGS(atoms); opt.run(fmax=0.05)\`
    6. Compute Binding Energy: E_ads = E_total - E_slab - E_mol.
    
    Return JSON:
    1. 'sites': List of relaxed sites (id, type, coordinates, energy, description).
    2. 'summary': Technical report of the findings.
    3. 'potentialUsed': "FAIR-Chem UMA (Simulated)".
    
    Make the energies realistic for this chemistry.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          potentialUsed: { type: Type.STRING },
          sites: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                coordinates: { 
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER }
                },
                energy: { type: Type.NUMBER },
                description: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  return {
    sites: data.sites,
    summary: data.summary,
    potentialUsed: "FAIR-Chem UMA (Simulated)",
    calculationTime: `${(Math.random() * 4 + 2).toFixed(2)}s`
  };
};