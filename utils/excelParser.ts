import * as XLSX from 'xlsx';
import { FreightRow, BatchInputRow, BatchResultRow } from '../types';

// Helper to normalize keys to snake_case for easier mapping
const normalizeKey = (key: string): string => {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, '_');
};

export const parseExcelFile = async (file: File): Promise<FreightRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          reject(new Error("Arquivo vazio ou formato inválido"));
          return;
        }

        const headers = (jsonData[0] as string[]).map(normalizeKey);
        const rows = jsonData.slice(1);

        const parsedRows: FreightRow[] = rows.map((row: any) => {
          const rowObj: any = {};
          
          headers.forEach((header, index) => {
            let value = row[index];
            
            // Normalize header names to match our interface
            let key = header;
            if (key.includes('extra_grande') && !key.includes('add')) key = 'cx_extra_grande';
            else if (key.includes('grande') && !key.includes('extra') && !key.includes('add')) key = 'cx_grande';
            else if (key.includes('media') && !key.includes('add')) key = 'cx_media';
            else if (key.includes('pequena') && !key.includes('add')) key = 'cx_pequena';
            else if (key.includes('micro') && !key.includes('add')) key = 'cx_micro';
            
            if (key.includes('add') && key.includes('extra_grande')) key = 'add_extra_grande';
            else if (key.includes('add') && key.includes('grande') && !key.includes('extra')) key = 'add_grande';
            else if (key.includes('add') && key.includes('media')) key = 'add_media';
            else if (key.includes('add') && key.includes('pequena')) key = 'add_pequena';
            else if (key.includes('add') && key.includes('micro')) key = 'add_micro';

            if (key === 'zoneamento' || key === 'cep' || key === 'zona') key = 'zoneamento';

            // GRIS mapping
            if (key.includes('gris') || key.includes('ad_valorem')) key = 'gris';

            // Parse numbers
            if (key !== 'zoneamento' && typeof value === 'string') {
                value = parseFloat(value.replace(',', '.')); // Handle PT-BR decimal format
            }

            rowObj[key] = value;
          });
          return rowObj;
        });

        const validRows = parsedRows.filter(r => r.zoneamento && (r.cx_media !== undefined || r.cx_grande !== undefined));
        
        resolve(validRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const parseBatchInputFile = async (file: File): Promise<BatchInputRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error("Arquivo de lote vazio"));
          return;
        }

        const headers = (jsonData[0] as string[]).map(normalizeKey);
        const rows = jsonData.slice(1);

        const parsedRows: BatchInputRow[] = rows.map((row: any) => {
          const rowObj: any = {
            cte: '',
            zoneamento: '',
            gris: 0,
            qtd_extra_grande: 0,
            qtd_grande: 0,
            qtd_media: 0,
            qtd_pequena: 0,
            qtd_micro: 0
          };

          headers.forEach((header, index) => {
            let value = row[index];
            
            // Clean number inputs
            if (typeof value === 'string' && !header.includes('zoneamento') && !header.includes('cte')) {
               value = parseFloat(value.replace(',', '.'));
            }
            const numVal = typeof value === 'number' && !isNaN(value) ? value : 0;

            if (header.includes('cte') || header.includes('nf') || header.includes('nota')) rowObj.cte = value || row[index];
            else if (header.includes('zoneamento') || header.includes('cep') || header.includes('zona')) rowObj.zoneamento = value || row[index];
            else if (header.includes('gris') || header.includes('ad_valorem')) rowObj.gris = numVal;

            // AGGREGATE LOGIC: Sum "CX" and "ADD" columns into the respective Total Qty
            
            // Extra Grande
            else if (header.includes('extra_grande')) {
                if (header.startsWith('cx') || header.startsWith('add') || header.includes('qtd')) {
                    rowObj.qtd_extra_grande += numVal;
                }
            }
            // Grande (Exclude Extra)
            else if (header.includes('grande') && !header.includes('extra')) {
                if (header.startsWith('cx') || header.startsWith('add') || header.includes('qtd')) {
                    rowObj.qtd_grande += numVal;
                }
            }
            // Media
            else if (header.includes('media')) {
                 if (header.startsWith('cx') || header.startsWith('add') || header.includes('qtd')) {
                    rowObj.qtd_media += numVal;
                }
            }
            // Pequena
            else if (header.includes('pequena')) {
                 if (header.startsWith('cx') || header.startsWith('add') || header.includes('qtd')) {
                    rowObj.qtd_pequena += numVal;
                }
            }
             // Micro
            else if (header.includes('micro')) {
                 if (header.startsWith('cx') || header.startsWith('add') || header.includes('qtd')) {
                    rowObj.qtd_micro += numVal;
                }
            }
          });
          return rowObj;
        });

        // Filter empty rows
        resolve(parsedRows.filter(r => r.cte || r.zoneamento));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const exportBatchToExcel = (results: BatchResultRow[], fileName: string = 'resultado_calculo_lote.xlsx') => {
  // Reorder and Rename columns for better Excel output
  const mappedResults = results.map(r => ({
    "CTE": r.cte,
    "Zoneamento": r.zoneamento,
    "Status": r.status,
    "Valor Com ICMS (R$)": r.frete_final, // Changed Label
    "Valor Sem ICMS (R$)": r.frete_bruto, // Changed Label
    "Valor 1º Vol (R$)": r.valor_primeiro_volume,
    "Valor Adicionais (R$)": r.valor_total_adicionais,
    "GRIS Aplicado (R$)": r.gris_aplicado,
    "Divisor ICMS": r.divisor_icms,
    "Obs": r.observacoes,
    // Include Total Calculated Quantities (Sum of CX+ADD)
    "Total Qtd Extra G.": r.qtd_extra_grande || 0,
    "Total Qtd Grande": r.qtd_grande || 0,
    "Total Qtd Media": r.qtd_media || 0,
    "Total Qtd Pequena": r.qtd_pequena || 0,
    "Total Qtd Micro": r.qtd_micro || 0
  }));

  const ws = XLSX.utils.json_to_sheet(mappedResults);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resultados");
  XLSX.writeFile(wb, fileName);
};