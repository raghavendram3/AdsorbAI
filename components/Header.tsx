import React from 'react';
import { Microscope, Github, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Microscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              AdsorbAI
            </h1>
            <p className="text-xs text-slate-400">Automated Materials Analysis</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Workflows
          </a>
          <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Datasets
          </a>
          <div className="h-4 w-px bg-slate-700"></div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </nav>
      </div>
    </header>
  );
};