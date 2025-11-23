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
import { Download, FileText, Activity, Database, Layers } from 'lucide-react';

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
      
      {/* Summary Card */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">Simulation Report</h3>
            </div>
            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300">
                AI Simulated
            </div>
        </div>
        
        <p className="text-sm text-slate-400 leading-relaxed">
          {result.summary}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-2 bg-slate-900/50 rounded border border-slate-700/50 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Potential
                </span>
                <span className="text-xs text-slate-300 font-medium truncate" title={result.potentialUsed}>
                    {result.potentialUsed}
                </span>
            </div>
            <div className="p-2 bg-slate-900/50 rounded border border-slate-700/50 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Database className="w-3 h-3" /> Workflow
                </span>
                <span className="text-xs text-slate-300 font-medium truncate">
                    MP + ASE + Pymatgen
                </span>
            </div>
        </div>
      </div>

      {/* Energy Chart */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl h-80">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Calculated Binding Energies</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" label={{ value: 'Binding Energy (eV)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={80} stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{fill: '#334155', opacity: 0.4}}
            />
            <Bar dataKey="energy" radius={[0, 4, 4, 0]} barSize={20}>
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
          <h3 className="text-sm font-semibold text-slate-200">Relaxed Configurations</h3>
          <button className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition">
            <Download className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-4 py-3">Site ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Position (Å)</th>
                <th className="px-4 py-3 text-right">E_ads (eV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-300">
                    {site.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                      site.type === 'Hollow' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                      site.type === 'Bridge' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                      'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                      {site.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    [{site.coordinates.map(c => c.toFixed(2)).join(', ')}]
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
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