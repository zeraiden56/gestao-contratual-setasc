import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export interface DadosSetasc {
  contratos: any[];
  entregas: any[];
  orcamento: any[];
}

export function usePlanilhas() {
  const [dados, setDados] = useState<DadosSetasc>({
    contratos: [],
    entregas: [],
    orcamento: [],
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPlanilhas() {
      try {
        const paths = [
          { key: "contratos", file: "/controle_contratos_empenhos_setasc.xlsx" },
          { key: "entregas", file: "/entregas_setasc_nger.xlsx" },
          { key: "orcamento", file: "/orcamento_fiplan_setasc.xlsx" },
        ];

        const resultados: any = {};

        for (const { key, file } of paths) {
          const resp = await fetch(file);
          const blob = await resp.arrayBuffer();
          const workbook = XLSX.read(blob, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          resultados[key] = data;
        }

        setDados(resultados);
      } catch (error) {
        console.error("Erro ao carregar planilhas:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarPlanilhas();
  }, []);

  return { dados, carregando };
}
