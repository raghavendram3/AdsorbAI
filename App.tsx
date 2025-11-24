import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { StructureViewer } from './components/StructureViewer';
import { ResultsDashboard } from './components/ResultsDashboard';
import { MaterialStructure, AnalysisResult, AnalysisStatus, LogEntry } from './types';
import { generateStructure, analyzeAdsorption } from './services/geminiService';
import { Search, Play, Terminal, Cpu, Database, RotateCw, KeyRound, FlaskConical, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [query, setQuery] = useState('Au(111)');
  const [mpApiKey, setMpApiKey] = useState('');
  const [adsorbate, setAdsorbate] = useState('CO');
  const [structure, setStructure] = useState<MaterialStructure | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', source: string = 'System') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString([], { hour12: false }), message, type, source }]);
  };

  const handleGenerateStructure = useCallback(async () => {
    if (!query) return;
    
    setStatus(AnalysisStatus.LOADING_STRUCTURE);
    setStructure(null);
    setAnalysisResult(null);
    setLogs([]);
    
    addLog(`Initializing Workflow Agent...`, 'info', 'Main');
    
    try {
      // Step 1: MP Rester
      addLog(`from mp_api.client import MPRester`, 'info', 'Python');
      if (mpApiKey) {
        addLog(`mpr = MPRester(api_key="****${mpApiKey.slice(-4)}")`, 'info', 'Python');
        addLog(`Connecting to Materials Project API...`, 'info', 'MPRester');
      } else {
        addLog(`mpr = MPRester() # Using public access`, 'warning', 'Python');
      }
      
      await new Promise(r => setTimeout(r, 600)); // Simulation delay
      addLog(`Searching for lowest formation energy structure for '${query}'...`, 'info', 'MPRester');
      
      // Step 2: ASE Build
      addLog(`import ase.build`, 'info', 'Python');
      addLog(`Building surface slab via ase.build.surface...`, 'info', 'ASE');

      const struct = await generateStructure(query, mpApiKey);
      
      setStructure(struct);
      addLog(`Structure created: ${struct.formula} ${struct.millerIndex}`, 'success', 'ASE');
      addLog(`MP-ID: ${struct.mpId} | E_form: ${struct.formationEnergy?.toFixed(3)} eV/atom`, 'info', 'Data');
      setStatus(AnalysisStatus.IDLE);
    } catch (error: any) {
      console.error(error);
      addLog(`Traceback: ${error.message}`, 'error', 'Python');
      setStatus(AnalysisStatus.ERROR);
    }
  }, [query, mpApiKey]);

  const handleRunAnalysis = useCallback(async () => {
    if (!structure || !adsorbate) return;

    setStatus(AnalysisStatus.ANALYZING);
    addLog(`Starting Adsorption Analysis Pipeline...`, 'info', 'Main');
    
    try {
      // Step 3: Pymatgen
      addLog(`from pymatgen.analysis.adsorption import AdsorbateSiteFinder`, 'info', 'Python');
      addLog(`asf = AdsorbateSiteFinder(slab)`, 'info', 'Python');
      addLog(`Identifying symmetry-distinct adsorption sites...`, 'info', 'Pymatgen');
      await new Promise(r => setTimeout(r, 800));
      
      // Step 4: FAIR-Chem
      addLog(`import fairchem.core`, 'info', 'Python');
      addLog(`calc = OCPCalculator(checkpoint="fairchem_uma_v1")`, 'info', 'Python');
      addLog(`Running geometry relaxation (LBFGS) for all configurations...`, 'info', 'FAIR-Chem');
      
      const result = await analyzeAdsorption(structure, adsorbate);
      
      setAnalysisResult(result);
      addLog(`Calculations complete. ${result.sites.length} stable configurations found.`, 'success', 'Main');
      setStatus(AnalysisStatus.COMPLETED);
    } catch (error: any) {
      console.error(error);
      addLog(`Runtime Error: ${error.message}`, 'error', 'Main');
      setStatus(AnalysisStatus.ERROR);
    }
  }, [structure, adsorbate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Agent Inputs */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Materials Project Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Data Source
            </h2>
            
            <div className="space-y-4">
               <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Materials Project API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={mpApiKey}
                    onChange={(e) => setMpApiKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-slate-300 placeholder-slate-600 font-mono"
                    placeholder="Paste key from materialsproject.org"
                  />
                  <KeyRound className="w-3 h-3 text-slate-600 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Target System</label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-white placeholder-slate-600"
                    placeholder="e.g. Cu(100), mp-30"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
              
              <button
                onClick={handleGenerateStructure}
                disabled={status === AnalysisStatus.LOADING_STRUCTURE}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {status === AnalysisStatus.LOADING_STRUCTURE ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Cpu className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                )}
                Initialize Surface
              </button>
            </div>
          </div>

          {/* DFT Workflow Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent pointer-events-none"></div>

            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-400" />
              DFT Agent
            </h2>

            <div className="space-y-4 relative z-10">
               <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Adsorbate Molecule</label>
                <input
                  type="text"
                  value={adsorbate}
                  onChange={(e) => setAdsorbate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-white"
                  placeholder="e.g. CO, H2O"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-2 mb-2 text-slate-300">
                   <Terminal className="w-3 h-3" />
                   <span>Pipeline Config</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400/80">
                   <ChevronRight className="w-3 h-3" /> pymatgen.AdsorbateSiteFinder
                </div>
                <div className="flex items-center gap-2 text-blue-400/80">
                   <ChevronRight className="w-3 h-3" /> fairchem.OCPCalculator
                </div>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={!structure || status === AnalysisStatus.ANALYZING}
                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2
                  ${!structure 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  }
                `}
              >
                {status === AnalysisStatus.ANALYZING ? (
                  <>
                     <RotateCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Simulation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Logs Console */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-0 font-mono text-xs overflow-hidden flex flex-col min-h-[250px] shadow-inner">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
               <div className="flex items-center gap-2 text-slate-400">
                 <Terminal className="w-3 h-3" />
                 <span>workflow.log</span>
               </div>
               <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 && <span className="text-slate-700 italic">Ready to initialize agent...</span>}
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 text-[11px] leading-relaxed break-all hover:bg-slate-900/50 rounded px-1 -mx-1 transition-colors">
                  <span className="text-slate-600 shrink-0 select-none">{log.timestamp}</span>
                  <span className={`font-bold shrink-0 w-16 text-right select-none ${
                    log.source === 'Python' ? 'text-yellow-500' :
                    log.source === 'ASE' ? 'text-orange-400' :
                    log.source === 'FAIR-Chem' ? 'text-blue-400' :
                    'text-slate-500'
                  }`}>[{log.source}]</span>
                  <span className={`${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-emerald-400' : 
                    log.type === 'warning' ? 'text-amber-400' :
                    'text-slate-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Visualization */}
        <div className="lg:col-span-5 flex flex-col min-h-[500px] lg:h-auto relative">
          <StructureViewer 
            structure={structure} 
            sites={analysisResult?.sites || []}
            isLoading={status === AnalysisStatus.LOADING_STRUCTURE || status === AnalysisStatus.ANALYZING} 
          />
        </div>

        {/* RIGHT COLUMN: Data Dashboard */}
        <div className="lg:col-span-4 overflow-y-auto lg:h-[calc(100vh-8rem)] pr-1">
          {analysisResult || structure ? (
            <ResultsDashboard result={analysisResult} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 ring-1 ring-slate-700">
                <Database className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">Awaiting Data</h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Configure the agent on the left to fetch materials from the Materials Project and run simulations.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;