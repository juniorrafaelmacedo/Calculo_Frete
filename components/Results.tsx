import React from 'react';
import { CalculationResult } from '../types';
import { CheckCircle2, Copy, ArrowRight } from 'lucide-react';

interface ResultsProps {
  result: CalculationResult | null;
}

const Results: React.FC<ResultsProps> = ({ result }) => {
  if (!result) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    alert("JSON copiado!");
  };

  if (result.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
        <h3 className="text-red-800 font-bold text-lg mb-2">Erro no Cálculo</h3>
        <p className="text-red-600">{result.error}</p>
        <div className="mt-4 text-xs font-mono bg-white p-3 rounded border border-red-100 text-red-500">
          {result.passos.map((step, i) => (
            <div key={i}>{step}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
        {/* Header Comparison Section */}
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
            <div className="text-slate-400 text-sm font-medium">Zona: <span className="text-white">{result.zoneamento}</span></div>
            <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
              Divisor aplicado: {result.icms_divisor}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Valor SEM Imposto */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Valor Sem ICMS</div>
              <div className="text-2xl font-bold text-slate-300">
                R$ {result.frete_bruto.toFixed(2)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Base + Adicionais + GRIS</p>
            </div>

            {/* Seta Visual (Desktop) */}
            <div className="hidden md:flex justify-center text-slate-600">
               <ArrowRight className="w-6 h-6" />
            </div>

            {/* Valor COM Imposto */}
            <div className="bg-blue-600 p-4 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
              <div className="relative z-10">
                <div className="text-blue-100 text-xs uppercase tracking-wider mb-1 font-semibold">Valor Com ICMS</div>
                <div className="text-3xl font-bold text-white">
                  R$ {result.frete_final_icms.toFixed(2)}
                </div>
                <p className="text-[10px] text-blue-200 mt-1">
                  {result.frete_bruto.toFixed(2)} ÷ {result.icms_divisor}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Detalhamento
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Primeiro Volume ({result.maior_tipo})</span>
                <span className="font-medium text-slate-900">R$ {result.primeiro_volume.toFixed(2)}</span>
              </li>
              <li className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Soma Adicionais</span>
                <span className="font-medium text-slate-900">R$ {result.soma_adicionais.toFixed(2)}</span>
              </li>
              {result.gris > 0 && (
                <li className="flex justify-between p-3 bg-slate-50 rounded-lg border-l-4 border-l-yellow-400">
                  <span className="text-slate-600">GRIS (Adicionado)</span>
                  <span className="font-medium text-slate-900">R$ {result.gris.toFixed(2)}</span>
                </li>
              )}
               <li className="flex justify-between p-3 bg-slate-100 rounded-lg border border-slate-200 font-semibold">
                <span className="text-slate-700">Total Sem ICMS</span>
                <span className="text-slate-900">R$ {result.frete_bruto.toFixed(2)}</span>
              </li>
            </ul>
          </div>

          <div>
             <h4 className="font-semibold text-slate-800 mb-4">Memória de Cálculo</h4>
             <div className="bg-slate-50 rounded-lg p-4 h-56 overflow-y-auto text-xs font-mono text-slate-600 space-y-1 border border-slate-200">
               {result.passos.map((step, idx) => (
                 <div key={idx} className="border-b border-slate-100 last:border-0 pb-1 mb-1">
                   {step}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 text-slate-200 font-mono text-sm relative group">
        <button 
          onClick={copyToClipboard}
          className="absolute top-4 right-4 p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
          title="Copiar JSON"
        >
          <Copy className="w-4 h-4" />
        </button>
        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">JSON Output</h4>
        <pre className="whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default Results;