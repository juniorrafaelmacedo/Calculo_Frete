import React, { useState } from 'react';
import { VolumeInput, VolumeSize } from '../types';
import { Plus, Trash2, Calculator, Package, ShieldCheck } from 'lucide-react';

interface CalculatorFormProps {
  onCalculate: (zoneamento: string, volumes: VolumeInput[], gris: number) => void;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculate }) => {
  const [zoneamento, setZoneamento] = useState('SP0626900'); // Set default for convenience
  const [gris, setGris] = useState(''); // State for GRIS input
  const [volumes, setVolumes] = useState<VolumeInput[]>([
    { id: '1', type: 'EXTRA GRANDE', qtd: 16 } // Set default for convenience
  ]);

  const volumeTypes: VolumeSize[] = ['EXTRA GRANDE', 'GRANDE', 'MEDIA', 'PEQUENA', 'MICRO'];

  const addVolumeRow = () => {
    setVolumes([...volumes, { id: Date.now().toString(), type: 'MEDIA', qtd: 0 }]);
  };

  const removeVolumeRow = (id: string) => {
    if (volumes.length === 1) return;
    setVolumes(volumes.filter(v => v.id !== id));
  };

  const updateVolume = (id: string, field: keyof VolumeInput, value: any) => {
    setVolumes(volumes.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse GRIS (replace comma with dot if user inputs PT-BR format)
    const grisValue = parseFloat(gris.replace(',', '.')) || 0;
    onCalculate(zoneamento, volumes, grisValue);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        2. Dados do Frete
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Zoneamento (CEP/Zona)</label>
          <input
            type="text"
            value={zoneamento}
            onChange={(e) => setZoneamento(e.target.value)}
            placeholder="Ex: SP0626900 ou RJ..."
            required
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <p className="text-xs text-slate-500 mt-1">Para RJ, o cálculo de ICMS será isento automaticamente.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-slate-500" /> Valor GRIS (R$) <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <input
            type="text"
            value={gris}
            onChange={(e) => setGris(e.target.value)}
            placeholder="0,00"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <p className="text-xs text-slate-500 mt-1">Somado antes do cálculo do ICMS.</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-slate-700">Volumes</label>
        {volumes.map((vol, index) => (
          <div key={vol.id} className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[150px]">
              <select
                value={vol.type}
                onChange={(e) => updateVolume(vol.id, 'type', e.target.value)}
                className="w-full appearance-none pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {volumeTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="w-32">
              <input
                type="number"
                min="0"
                value={vol.qtd}
                onChange={(e) => updateVolume(vol.id, 'qtd', parseInt(e.target.value) || 0)}
                placeholder="Qtd"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => removeVolumeRow(vol.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              disabled={volumes.length === 1}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addVolumeRow}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
        >
          <Plus className="w-4 h-4" /> Adicionar outro tipo de volume
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          Calcular Frete
        </button>
      </div>
    </form>
  );
};

export default CalculatorForm;