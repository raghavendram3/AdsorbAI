import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { AnalysisResult } from '../types';
import { Download, FileText, Activity, Database, Box, Zap, Layers } from 'lucide-react';

interface ResultsDashboardProps {
  result: AnalysisResult | null;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result }) => {
  if (!result) return null;

  const sites = result.sites;
  
  // Prepare data for chart
  const chartData = sites.map(site => ({
    name: `${site.type}-${site.id.slice(0,4)}`,
    energy: site.energy,
    type: site.type
  })).sort((a, b) => a.energy - b.energy);

  const getBarColor = (energy: number) => {
    if (energy < -2.0) return '#10b981';
    if (energy < -1.0) return '#3b82f6';
    return '#ef4444';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Simulated Materials Project Data Card */}
      <div className="p-0 bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-2">
           <Database className="w-3.5 h-3.5 text-blue-400" />
           <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Materials Project Data</h3>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4">
           <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Formation E.</span>
              <span className="text-sm text-slate-200 font-mono flex items-center gap-1">
                 <Zap className="w-3 h-3 text-yellow-500" /> -0.12<span className="text-xs text-slate-500">eV</span>
              </span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Band Gap</span>
              <span className="text-sm text-slate-200 font-mono flex items-center gap-1">
                 <Activity className="w-3 h-3 text-emerald-500" /> 0.00<span className="text-xs text-slate-500">eV</span>
              </span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Symmetry</span>
              <span className="text-sm text-slate-200 font-mono flex items-center gap-1">
                 <Box className="w-3 h-3 text-purple-500" /> Fm-3m
              </span>
           </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">Simulation Report</h3>
            </div>
            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-mono">
                AGENT_V1.0
            </div>
        </div>
        
        <p className="text-sm text-slate-400 leading-relaxed font-light">
          {result.summary}
        </p>

        <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-700/50 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-400">Workflow Active</span>
             </div>
             <div className="text-xs text-slate-500 font-mono">
               {result.potentialUsed}
             </div>
        </div>
      </div>

      {/* Energy Chart */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl h-64">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Binding Energies (E_ads)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#64748b" tick={{fontSize: 10}} />
            <YAxis type="category" dataKey="name" width={80} stroke="#94a3b8" tick={{fontSize: 10, fontFamily: 'monospace'}} />
            <Tooltip 
              cursor={{fill: '#334155', opacity: 0.4}}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl">
                      <p className="text-xs text-slate-300 mb-1">{payload[0].payload.name}</p>
                      <p className="text-sm font-bold text-emerald-400">
                        {Number(payload[0].value).toFixed(3)} eV
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="energy" radius={[0, 4, 4, 0]} barSize={12}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.energy)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sites Table */}
      <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800/30">
        <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Relaxed Configurations</h3>
          <button className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition">
            <Download className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 font-semibold">
              <tr>
                <th className="px-4 py-2">Site ID</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">E_ads (eV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-4 py-2 font-mono text-xs text-slate-400 group-hover:text-slate-200">
                    {site.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      site.type === 'Hollow' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                      site.type === 'Bridge' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                      {site.type}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-right font-mono text-xs ${
                    site.energy < -2 ? 'text-emerald-400' : 
                    site.energy < -1 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {site.energy.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};