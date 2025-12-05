import React, { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2, RotateCcw, Play, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseBatchInputFile, exportBatchToExcel } from '../utils/excelParser';
import { BatchResultRow, FreightRow, VolumeInput } from '../types';
import { calculateFreight } from '../utils/calculationLogic';

interface BatchProcessorProps {
  freightData: FreightRow[];
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ freightData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<BatchResultRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, success: 0, error: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessedData([]); // Clear previous results if any
      setSummary({ total: 0, success: 0, error: 0 });
    }
    // Reset input value to allow re-selecting the same file immediately if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProcessedData([]);
    setSummary({ total: 0, success: 0, error: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessBatch = async () => {
    if (!selectedFile) return;

    if (freightData.length === 0) {
      alert("⚠️ Carregue a Base de Dados de Frete (Passo 1) antes de processar o lote.");
      return;
    }

    setLoading(true);
    setProcessedData([]);

    try {
      const rows = await parseBatchInputFile(selectedFile);
      const results: BatchResultRow[] = [];
      let successCount = 0;
      let errorCount = 0;

      rows.forEach(row => {
        // 1. Construct Volumes Array
        const volumes: VolumeInput[] = [];
        if (row.qtd_extra_grande) volumes.push({ id: 'eg', type: 'EXTRA GRANDE', qtd: Number(row.qtd_extra_grande) });
        if (row.qtd_grande) volumes.push({ id: 'g', type: 'GRANDE', qtd: Number(row.qtd_grande) });
        if (row.qtd_media) volumes.push({ id: 'm', type: 'MEDIA', qtd: Number(row.qtd_media) });
        if (row.qtd_pequena) volumes.push({ id: 'p', type: 'PEQUENA', qtd: Number(row.qtd_pequena) });
        if (row.qtd_micro) volumes.push({ id: 'mi', type: 'MICRO', qtd: Number(row.qtd_micro) });

        const grisInput = Number(row.gris) || 0;
        
        // 2. Calculate
        const result = calculateFreight(row.zoneamento, volumes, freightData, grisInput);

        // 3. Map to Output
        const outputRow: BatchResultRow = {
          ...row,
          frete_bruto: result.frete_bruto,
          frete_final: result.frete_final_icms,
          divisor_icms: result.icms_divisor,
          valor_primeiro_volume: result.primeiro_volume,
          valor_total_adicionais: result.soma_adicionais,
          gris_aplicado: result.gris,
          status: result.error ? 'ERRO' : 'SUCESSO',
          observacoes: result.error ? (result.error + ' - ' + result.passos[result.passos.length -1]) : `Maior: ${result.maior_tipo}`
        };

        if (result.error) errorCount++;
        else successCount++;

        results.push(outputRow);
      });

      setProcessedData(results);
      setSummary({ total: rows.length, success: successCount, error: errorCount });
    } catch (err: any) {
      alert("Erro ao processar arquivo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "CTE", "ZONEAMENTO", 
      "CX EXTRA GRANDE", "CX GRANDE", "CX MEDIA", "CX PEQUENA", "CX MICRO",
      "ADD EXTRA GRANDE", "ADD GRANDE", "ADD MEDIA", "ADD PEQUENA", "ADD MICRO"
    ];
    // Example row
    const sampleRow = [
      "123456", "SP0626900", 
      1, 0, 0, 0, 0,
      10, 5, 0, 0, 0
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, "Input Lote");
    XLSX.writeFile(wb, "modelo_input_lote.xlsx");
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-purple-600" />
        Processamento em Lote (Excel)
      </h2>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-sm text-purple-800">
          <p className="font-semibold mb-1">Instruções:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Colunas Obrigatórias: <strong>CTE</strong> e <strong>ZONEAMENTO</strong>.</li>
            <li>Colunas de Volumes: <strong>CX ...</strong> e <strong>ADD ...</strong> para cada tamanho.</li>
            <li>O sistema somará as colunas CX e ADD do mesmo tipo para o cálculo.</li>
            <li>O <strong>GRIS</strong> será buscado automaticamente na Base de Frete pelo Zoneamento.</li>
          </ul>
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Hidden File Input */}
             <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            
            {/* Select Button - Only shown if no file is selected */}
            {!selectedFile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Selecionar Arquivo Excel
              </button>
            )}

            {/* Template Link */}
            <button 
              onClick={handleDownloadTemplate}
              className="text-sm text-purple-600 hover:text-purple-800 underline decoration-dotted ml-auto"
            >
              Baixar modelo de input
            </button>
          </div>

          {/* Selected File Card & Process Button */}
          {selectedFile && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row gap-4 md:items-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFile}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover arquivo"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

                  <button
                    onClick={handleProcessBatch}
                    disabled={loading}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    Processar Lote
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        {processedData.length > 0 && (
          <div className="animate-in fade-in duration-300 space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm font-medium">
                <span className="px-3 py-1 bg-slate-100 rounded text-slate-600">Total: {summary.total}</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded border border-green-200">Sucesso: {summary.success}</span>
                {summary.error > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded border border-red-200">Erros: {summary.error}</span>
                )}
              </div>
              <button 
                onClick={clearFile}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Nova Consulta
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80 shadow-inner">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 border-b">CTE</th>
                    <th className="p-3 border-b">Zona</th>
                    <th className="p-3 border-b">Status</th>
                    <th className="p-3 border-b text-right bg-blue-50/50 text-blue-800">Vlr Com ICMS</th>
                    <th className="p-3 border-b text-right bg-slate-50/80">Vlr Sem ICMS</th>
                    <th className="p-3 border-b text-right">GRIS</th>
                    <th className="p-3 border-b text-right">1º Vol</th>
                    <th className="p-3 border-b text-right">Adicionais</th>
                    <th className="p-3 border-b">Obs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {processedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-700">{row.cte}</td>
                      <td className="p-3">{row.zoneamento}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          row.status === 'SUCESSO' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/30">
                        {typeof row.frete_final === 'number' 
                          ? `R$ ${row.frete_final.toFixed(2)}` 
                          : '-'}
                      </td>
                       <td className="p-3 text-right font-medium text-slate-600 bg-slate-50/30">
                        {typeof row.frete_bruto === 'number' 
                          ? `R$ ${row.frete_bruto.toFixed(2)}` 
                          : '-'}
                      </td>
                      <td className="p-3 text-right text-slate-500">
                         {typeof row.gris_aplicado === 'number' && row.gris_aplicado > 0
                          ? `R$ ${row.gris_aplicado.toFixed(2)}` 
                          : '-'}
                      </td>
                      <td className="p-3 text-right text-slate-500">
                        {typeof row.valor_primeiro_volume === 'number' 
                          ? `R$ ${row.valor_primeiro_volume.toFixed(2)}` 
                          : '-'}
                      </td>
                      <td className="p-3 text-right text-slate-500">
                        {typeof row.valor_total_adicionais === 'number' 
                          ? `R$ ${row.valor_total_adicionais.toFixed(2)}` 
                          : '-'}
                      </td>
                      <td className="p-3 text-slate-400 max-w-[150px] truncate" title={row.observacoes}>
                        {row.observacoes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => exportBatchToExcel(processedData)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Baixar Planilha Completa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProcessor;