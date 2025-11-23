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
    Act as an interface for the Materials Project API and the ASE (Atomic Simulation Environment) Python library.
    
    User Query: "${query}"
    Materials Project API Key Provided: ${mpApiKey ? "YES (Simulate authenticated request)" : "NO (Simulate public data)"}

    Task:
    1. Simulate calling the Materials Project API (MPRester) to find the most stable bulk crystal structure matching the query. Identify its MP-ID (e.g., mp-1234).
    2. Simulate using the 'ase.build.surface' function to cut a surface slab from this bulk structure.
       - Choose the most common stable facet if not specified (e.g., (111) for fcc).
       - Create a slab with at least 3 layers and 10Å vacuum.
    
    Return a JSON object with:
    1. 'formula': Chemical formula.
    2. 'mpId': The simulated Materials Project ID (e.g., 'mp-81').
    3. 'millerIndex': The miller index of the surface cut (e.g., '(1 1 1)').
    4. 'description': Technical description (e.g., "Gold (111) slab generated via ASE from mp-81").
    5. 'atoms': Array of objects with 'element', 'x', 'y', 'z' (Angstroms).
    
    Limit to approx 20-50 atoms for visualization performance.
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
          }
        },
        required: ["formula", "description", "atoms"]
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
    mpId: data.mpId,
    millerIndex: data.millerIndex,
    description: data.description,
    atoms: atoms
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
    Atom Count: ${structure.atoms.length}
  `;

  const prompt = `
    Act as a computational materials scientist expert in Pymatgen and FAIR-Chem models.
    
    Task: Perform a full automated adsorption analysis workflow.
    
    Workflow Steps to Simulate:
    1. **Pymatgen Analysis**: Use \`pymatgen.analysis.adsorption.AdsorbateSiteFinder\` to identify all symmetry-distinct adsorption sites (Top, Bridge, Hollow) on the provided surface.
    2. **Structure Generation**: Simulate placing the adsorbate molecule '${adsorbate}' at each identified site at a reasonable height (e.g., 2.0 Å).
    3. **Relaxation**: Simulate running a structural relaxation (geometry optimization) for each configuration using the **FAIR-Chem UMA (Universal ML Potential)**. 
       - Assume the UMA potential provides accuracy comparable to DFT.
    4. **Energy Calculation**: Calculate the binding energy $E_{ads} = E_{sys} - (E_{surf} + E_{mol})$.
    
    Structure Info:
    ${structureSummary}
    
    Returns:
    A JSON object containing:
    1. 'sites': A list of the relaxed sites found. For each:
       - 'id': unique string
       - 'type': Pymatgen site classification (Top, Bridge, Hollow, fcc, hcp)
       - 'coordinates': [x, y, z] of the adsorbate after UMA relaxation.
       - 'energy': Calculated binding energy in eV.
       - 'description': Brief chemical insight about the stability.
    2. 'summary': A technical summary mentioning the use of Pymatgen AdsorbateSiteFinder and FAIR-Chem UMA.
    3. 'potentialUsed': Specifically "FAIR-Chem UMA (Simulated)".
    
    Provide realistic data consistent with chemical intuition for ${adsorbate} on ${structure.formula}.
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
    potentialUsed: data.potentialUsed || "FAIR-Chem UMA (Simulated)",
    calculationTime: `${(Math.random() * 3 + 1.5).toFixed(2)}s` // Fake calculation time
  };
};