
// This service is deprecated in favor of deterministic simulation in services/physicsEngine.ts
// To use LLM features, reimplement using GoogleGenAI here.

import { MaterialStructure, AnalysisResult } from "../types";

export const generateStructure = async (query: string, mpApiKey?: string): Promise<MaterialStructure> => {
  throw new Error("Generative AI structure generation is disabled. Use physicsEngine.");
};

export const analyzeAdsorption = async (
  structure: MaterialStructure,
  adsorbate: string
): Promise<AnalysisResult> => {
    throw new Error("Generative AI analysis is disabled. Use physicsEngine.");
};
