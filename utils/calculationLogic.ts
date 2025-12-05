import { CalculationResult, FreightRow, VolumeInput, VOLUME_PRIORITY, VolumeSize } from '../types';

export const calculateFreight = (
  zoneamento: string, 
  volumes: VolumeInput[], 
  data: FreightRow[],
  grisInput: number = 0
): CalculationResult => {
  const steps: string[] = [];
  steps.push(`Buscando zoneamento: "${zoneamento}"...`);

  // Detect logic for RJ (No ICMS division, or divisor = 1)
  const isRJ = String(zoneamento).trim().toUpperCase().startsWith('RJ');
  const icmsDivisor = isRJ ? 1.00 : 0.88;

  const row = data.find(r => 
    String(r.zoneamento).trim().toUpperCase() === String(zoneamento).trim().toUpperCase()
  );

  if (!row) {
    return {
      zoneamento,
      maior_tipo: 'N/A',
      primeiro_volume: 0,
      adicionais: {},
      soma_adicionais: 0,
      gris: 0,
      icms_divisor: 0.88,
      frete_bruto: 0,
      frete_final_icms: 0,
      passos: [...steps, `ERRO: Zoneamento "${zoneamento}" não encontrado na tabela.`],
      error: 'Zoneamento não encontrado'
    };
  }

  steps.push("Zoneamento encontrado.");
  if (isRJ) steps.push("Zona RJ detectada: Divisor ICMS ajustado para 1.0 (Isento).");
  else steps.push("Zona padrão: Aplicação de ICMS (Divisor 0.88).");

  // Determine GRIS: Table value takes precedence over Input value if present
  const tableGris = Number(row.gris) || 0;
  let finalGris = 0;
  
  if (tableGris > 0) {
    finalGris = tableGris;
    steps.push(`GRIS encontrado na tabela de frete: R$ ${finalGris.toFixed(2)}`);
  } else if (grisInput > 0) {
    finalGris = grisInput;
    steps.push(`GRIS utilizado do input manual/lote: R$ ${finalGris.toFixed(2)}`);
  } else {
    steps.push("Nenhum valor de GRIS aplicável.");
  }

  // 1. Identify types present with quantities > 0
  const activeVolumes = volumes.filter(v => v.qtd > 0);
  
  if (activeVolumes.length === 0) {
     return {
      zoneamento,
      maior_tipo: 'Nenhum',
      primeiro_volume: 0,
      adicionais: {},
      soma_adicionais: 0,
      gris: finalGris,
      icms_divisor: 0.88,
      frete_bruto: finalGris,
      frete_final_icms: finalGris / icmsDivisor,
      passos: [...steps, "Nenhum volume informado."],
    };
  }

  // 2. Find Highest Priority Type
  let maxPriorityVal = -1;
  let maxPriorityType: VolumeSize | null = null;

  activeVolumes.forEach(v => {
    const p = VOLUME_PRIORITY[v.type];
    if (p > maxPriorityVal) {
      maxPriorityVal = p;
      maxPriorityType = v.type;
    }
  });

  if (!maxPriorityType) throw new Error("Erro inesperado na prioridade de volumes");

  steps.push(`Maior tipo identificado: ${maxPriorityType} (Prioridade ${maxPriorityVal})`);

  // 3. Get Base Price for First Volume
  const typeToPropMap: Record<VolumeSize, keyof FreightRow> = {
    'EXTRA GRANDE': 'cx_extra_grande',
    'GRANDE': 'cx_grande',
    'MEDIA': 'cx_media',
    'PEQUENA': 'cx_pequena',
    'MICRO': 'cx_micro'
  };

  const firstVolPrice = Number(row[typeToPropMap[maxPriorityType]]) || 0;
  steps.push(`Valor do 1º Volume (${maxPriorityType}): R$ ${firstVolPrice.toFixed(2)}`);

  // 4. Calculate Additionals
  let totalAdditionals = 0;
  const additionalsDetail: any = {};
  let firstVolumeConsumed = false;

  const typeToAddPropMap: Record<VolumeSize, keyof FreightRow> = {
    'EXTRA GRANDE': 'add_extra_grande',
    'GRANDE': 'add_grande',
    'MEDIA': 'add_media',
    'PEQUENA': 'add_pequena',
    'MICRO': 'add_micro'
  };

  const aggregatedVolumes: Record<string, number> = {};
  activeVolumes.forEach(v => {
    aggregatedVolumes[v.type] = (aggregatedVolumes[v.type] || 0) + v.qtd;
  });

  Object.entries(aggregatedVolumes).forEach(([typeStr, qtd]) => {
    const type = typeStr as VolumeSize;
    let countForAdditional = qtd;
    
    // If this is the max priority type, remove 1 for the base price
    if (!firstVolumeConsumed && type === maxPriorityType) {
      countForAdditional = qtd - 1;
      firstVolumeConsumed = true;
      steps.push(`Removido 1 unidade de ${type} para compor o valor base.`);
    }

    if (countForAdditional > 0) {
      const addPrice = Number(row[typeToAddPropMap[type]]) || 0;
      const subtotal = countForAdditional * addPrice;
      totalAdditionals += subtotal;
      
      additionalsDetail[type.toLowerCase().replace(' ', '_')] = {
        qtd: countForAdditional,
        valor_unitario: addPrice,
        subtotal: subtotal
      };
      steps.push(`Adicionais ${type}: ${countForAdditional} x R$ ${addPrice.toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
    }
  });

  // 5. Finalize
  steps.push(`Soma Parcial (1º Vol + Adicionais): R$ ${(firstVolPrice + totalAdditionals).toFixed(2)}`);
  
  if (finalGris > 0) {
    steps.push(`Adicionando GRIS: R$ ${finalGris.toFixed(2)}`);
  }

  const freteBruto = firstVolPrice + totalAdditionals + finalGris;
  steps.push(`Frete Bruto (Base + Adicionais + GRIS): R$ ${freteBruto.toFixed(2)}`);

  const freteFinal = freteBruto / icmsDivisor;
  steps.push(`Cálculo ICMS: ${freteBruto.toFixed(2)} / ${icmsDivisor}`);
  steps.push(`Frete Final: R$ ${freteFinal.toFixed(2)}`);

  return {
    zoneamento,
    maior_tipo: `${maxPriorityType} (${maxPriorityVal})`,
    primeiro_volume: Number(firstVolPrice.toFixed(2)),
    adicionais: additionalsDetail,
    soma_adicionais: Number(totalAdditionals.toFixed(2)),
    gris: finalGris,
    icms_divisor: icmsDivisor,
    frete_bruto: Number(freteBruto.toFixed(2)),
    frete_final_icms: Number(freteFinal.toFixed(2)),
    passos: steps
  };
};