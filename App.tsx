import React, { useState } from 'react';
import { Truck, Calculator, Layers } from 'lucide-react';
import FileUpload from './components/FileUpload';
import CalculatorForm from './components/CalculatorForm';
import Results from './components/Results';
import BatchProcessor from './components/BatchProcessor';
import { FreightRow, VolumeInput, CalculationResult } from './types';
import { calculateFreight } from './utils/calculationLogic';

const DEFAULT_DATA: FreightRow[] = [{
  zoneamento: "SP0626900",
  cx_extra_grande: 9.16,
  cx_grande: 8.50,
  cx_media: 7.20,
  cx_pequena: 6.10,
  cx_micro: 5.00,
  add_extra_grande: 1.65,
  add_grande: 1.40,
  add_media: 1.20,
  add_pequena: 1.00,
  add_micro: 0.80
}];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'individual' | 'batch'>('individual');
  const [freightData, setFreightData] = useState<FreightRow[]>(DEFAULT_DATA);
  const [activeFileName, setActiveFileName] = useState<string>("Base de Dados Interna (Padrão)");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const handleDataLoaded = (data: FreightRow[], fileName: string) => {
    setFreightData(data);
    setActiveFileName(fileName);
    setResult(null); 
  };

  const handleCalculate = (zoneamento: string, volumes: VolumeInput[], gris: number) => {
    if (freightData.length === 0) {
      alert("⚠️ Nenhuma tabela de frete carregada.");
      return;
    }
    const res = calculateFreight(zoneamento, volumes, freightData, gris);
    setResult(res);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <Truck className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CalcFrete Brasil</h1>
              <p className="text-slate-500 text-sm">Sistema de Cálculo Logístico Avançado</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
             <div className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-semibold">
               v1.4.0 (Batch)
             </div>
          </div>
        </header>

        {/* Base Data Section (Shared) */}
        <FileUpload 
          onDataLoaded={handleDataLoaded} 
          currentFileName={activeFileName}
        />

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'individual' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300/50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Calculadora Individual
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'batch' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Processamento em Lote
          </button>
        </div>

        {/* Tab Content */}
        <main className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'individual' ? (
            <div className="space-y-6">
              <CalculatorForm onCalculate={handleCalculate} />
              <Results result={result} />
            </div>
          ) : (
            <BatchProcessor freightData={freightData} />
          )}
        </main>

        <footer className="text-center text-slate-400 text-sm pt-8">
          <p>© {new Date().getFullYear()} CalcFrete Brasil.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;