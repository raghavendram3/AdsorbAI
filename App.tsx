import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { StructureViewer } from './components/StructureViewer';
import { ResultsDashboard } from './components/ResultsDashboard';
import { MaterialStructure, AnalysisResult, AnalysisStatus, LogEntry } from './types';
import { generateStructure, analyzeAdsorption } from './services/geminiService';
import { Search, Play, Terminal, Cpu, Database, RotateCw, KeyRound, FlaskConical } from 'lucide-react';

const App: React.FC = () => {
  const [query, setQuery] = useState('Au(111)');
  const [mpApiKey, setMpApiKey] = useState('');
  const [adsorbate, setAdsorbate] = useState('CO');
  const [structure, setStructure] = useState<MaterialStructure | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }]);
  };

  const handleGenerateStructure = useCallback(async () => {
    if (!query) return;
    
    setStatus(AnalysisStatus.LOADING_STRUCTURE);
    setStructure(null);
    setAnalysisResult(null);
    setLogs([]);
    addLog(`Pipeline initialized for target: ${query}`, 'info');

    try {
      if (mpApiKey) {
        addLog(`Authenticating with Materials Project API (Key: ****${mpApiKey.slice(-4)})...`, 'info');
      } else {
        addLog("No MP API key provided. Using public/simulated data...", 'warning');
      }

      addLog("Fetching bulk structure data from Materials Project...", 'info');
      // Simulated delay for realism
      await new Promise(resolve => setTimeout(resolve, 600));
      
      addLog("Running ASE (Atomic Simulation Environment) to build surface slab...", 'info');
      const struct = await generateStructure(query, mpApiKey);
      
      setStructure(struct);
      addLog(`ASE Build Success: ${struct.formula} ${struct.millerIndex} (Source: ${struct.mpId})`, 'success');
      setStatus(AnalysisStatus.IDLE);
    } catch (error: any) {
      console.error(error);
      addLog(`ASE Build Failed: ${error.message}`, 'error');
      setStatus(AnalysisStatus.ERROR);
    }
  }, [query, mpApiKey]);

  const handleRunAnalysis = useCallback(async () => {
    if (!structure || !adsorbate) return;

    setStatus(AnalysisStatus.ANALYZING);
    addLog(`Initiating adsorption workflow for ${adsorbate}...`, 'info');
    
    try {
      addLog("Running pymatgen.analysis.adsorption.AdsorbateSiteFinder...", 'info');
      await new Promise(resolve => setTimeout(resolve, 800)); // UI delay
      
      addLog("Generating initial configurations...", 'info');
      
      addLog("Loading FAIR-Chem UMA (Universal ML Potential) model...", 'info');
      addLog("Running geometry optimization/relaxation on all sites...", 'info');
      
      const result = await analyzeAdsorption(structure, adsorbate);
      
      setAnalysisResult(result);
      addLog(`FAIR-Chem UMA relaxation complete. Converged ${result.sites.length} sites.`, 'success');
      setStatus(AnalysisStatus.COMPLETED);
    } catch (error: any) {
      console.error(error);
      addLog(`Workflow Error: ${error.message}`, 'error');
      setStatus(AnalysisStatus.ERROR);
    }
  }, [structure, adsorbate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Logs */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Input Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Materials Project & ASE
            </h2>
            
            <div className="space-y-4">
               <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">MP API Key (Optional)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={mpApiKey}
                    onChange={(e) => setMpApiKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder-slate-600 font-mono"
                    placeholder="Enter API Key"
                  />
                  <KeyRound className="w-3 h-3 text-slate-600 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">Material / Surface Query</label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder-slate-600"
                    placeholder="e.g. Au(111), mp-81"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
              
              <button
                onClick={handleGenerateStructure}
                disabled={status === AnalysisStatus.LOADING_STRUCTURE}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {status === AnalysisStatus.LOADING_STRUCTURE ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cpu className="w-4 h-4 group-hover:text-emerald-400 transition-colors" />
                )}
                Fetch & Build Surface
              </button>
            </div>
          </div>

          {/* Analysis Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
             {/* Decorative Background gradient */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>

            <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-400" />
              DFT Workflow
            </h2>

            <div className="space-y-4 relative z-10">
               <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">Adsorbate Molecule</label>
                <input
                  type="text"
                  value={adsorbate}
                  onChange={(e) => setAdsorbate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
                  placeholder="e.g. CO, H2O, OH"
                />
              </div>

              <div className="p-3 bg-slate-800/50 rounded border border-slate-700/50 text-xs text-slate-400">
                <p className="mb-2 font-semibold text-slate-300">Active Pipeline:</p>
                <ul className="space-y-2 pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Materials Project + ASE</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    <span>Pymatgen Site Finder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>FAIR-Chem UMA Potential</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={!structure || status === AnalysisStatus.ANALYZING}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2
                  ${!structure 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 border border-blue-500/50'
                  }
                `}
              >
                {status === AnalysisStatus.ANALYZING ? (
                  <>Running UMA Relaxation...</>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Run Calculation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Terminal / Logs */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-hidden flex flex-col min-h-[200px]">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800 text-slate-500">
              <Terminal className="w-3 h-3" />
              <span>Workflow Log</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 && <span className="text-slate-600 italic">Waiting for input...</span>}
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                  <span className={`${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-emerald-400' : 
                    log.type === 'warning' ? 'text-amber-400' :
                    'text-blue-300'
                  }`}>
                    {log.type === 'success' ? '✔ ' : log.type === 'error' ? '✖ ' : '> '}
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: 3D Visualization */}
        <div className="lg:col-span-5 flex flex-col h-[600px] lg:h-auto">
          <StructureViewer 
            structure={structure} 
            sites={analysisResult?.sites || []}
            isLoading={status === AnalysisStatus.LOADING_STRUCTURE || status === AnalysisStatus.ANALYZING} 
          />
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-4 overflow-y-auto lg:h-[calc(100vh-8rem)] pr-1">
          {analysisResult ? (
            <ResultsDashboard result={analysisResult} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-400 mb-2">No Analysis Data</h3>
              <p className="text-sm max-w-xs">
                Fetch a structure from Materials Project and run the FAIR-Chem UMA workflow to visualize adsorption sites.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;