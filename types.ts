export type VolumeSize = 'EXTRA GRANDE' | 'GRANDE' | 'MEDIA' | 'PEQUENA' | 'MICRO';

export const VOLUME_PRIORITY: Record<VolumeSize, number> = {
  'EXTRA GRANDE': 5,
  'GRANDE': 4,
  'MEDIA': 3,
  'PEQUENA': 2,
  'MICRO': 1,
};

export interface VolumeInput {
  id: string;
  type: VolumeSize;
  qtd: number;
}

export interface FreightRow {
  zoneamento: string;
  gris?: number; // Added GRIS support from DB
  // First Volume Prices
  cx_extra_grande: number;
  cx_grande: number;
  cx_media: number;
  cx_pequena: number;
  cx_micro: number;
  // Additional Volume Prices
  add_extra_grande: number;
  add_grande: number;
  add_media: number;
  add_pequena: number;
  add_micro: number;
  [key: string]: any; // Allow loose indexing for parsing
}

export interface CalculationResult {
  zoneamento: string;
  maior_tipo: string;
  primeiro_volume: number;
  adicionais: Record<string, { qtd: number; valor_unitario: number; subtotal: number }>;
  soma_adicionais: number;
  gris: number;
  icms_divisor: number;
  frete_bruto: number;
  frete_final_icms: number;
  passos: string[];
  error?: string;
}

export interface BatchInputRow {
  cte: string | number;
  zoneamento: string;
  gris?: number;
  qtd_extra_grande?: number;
  qtd_grande?: number;
  qtd_media?: number;
  qtd_pequena?: number;
  qtd_micro?: number;
  [key: string]: any;
}

export interface BatchResultRow extends BatchInputRow {
  frete_final: number | string;
  frete_bruto: number | string;
  divisor_icms: number | string;
  valor_primeiro_volume: number | string;
  valor_total_adicionais: number | string;
  gris_aplicado: number | string;
  status: 'SUCESSO' | 'ERRO';
  observacoes: string;
}