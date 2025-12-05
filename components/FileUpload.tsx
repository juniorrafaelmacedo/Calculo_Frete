import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseExcelFile } from '../utils/excelParser';
import { FreightRow } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: FreightRow[], fileName: string) => void;
  currentFileName: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, currentFileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      onDataLoaded(data, file.name);
    } catch (err: any) {
      setError(err.message || "Erro ao processar arquivo");
    } finally {
      setLoading(false);
    }
  };

  const handleUseExampleData = () => {
    const sampleData: FreightRow[] = [{
      zoneamento: "SP0626900",
      gris: 5.50,
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
    onDataLoaded(sampleData, "Base de Dados Interna (Exemplo)");
    setError(null);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "ZONEAMENTO", "GRIS",
      "CX EXTRA GRANDE", "CX GRANDE", "CX MEDIA", "CX PEQUENA", "CX MICRO",
      "ADD EXTRA GRANDE", "ADD GRANDE", "ADD MEDIA", "ADD PEQUENA", "ADD MICRO"
    ];
    const sampleRow = [
      "SP0626900", 5.50,
      9.16, 8.50, 7.20, 6.10, 5.00,
      1.65, 1.40, 1.20, 1.00, 0.80
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, "Tabela Frete");
    XLSX.writeFile(wb, "modelo_tabela_frete.xlsx");
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
        1. Base de Dados de Frete
      </h2>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative group">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors border border-slate-300"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload Tabela Nova
            </button>
          </div>

          <span className="text-slate-400 text-sm">ou</span>

          <button
            onClick={handleUseExampleData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors border border-blue-200"
          >
            <Database className="w-4 h-4" />
            Restaurar Padrão
          </button>
          
          <button 
            onClick={handleDownloadTemplate}
            className="ml-auto text-sm text-slate-500 hover:text-blue-600 underline decoration-dotted"
          >
            Baixar modelo da Base
          </button>
        </div>

        {currentFileName && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium animate-in fade-in duration-300">
            <CheckCircle className="w-4 h-4" />
            <span>Base Ativa: {currentFileName}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default FileUpload;