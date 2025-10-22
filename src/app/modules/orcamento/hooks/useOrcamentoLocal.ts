"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export interface Despesa {
  UO: string;
  SIGLA: string;
  Ano: string;
  orcado_inicial: number;
  orcado_atual: number;
  empenhado: number;
  liquidado: number;
  pago: number;
  livre: number;
}

export function useOrcamentoLocal() {
  const [dados, setDados] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState<string>("");
  const [anos, setAnos] = useState<string[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        const response = await fetch("/orcamento_fiplan_setasc.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets["FIPLAN"];
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        const mapa = new Map<string, Despesa>();
        const anosEncontrados = new Set<string>();

        json.forEach((row) => {
          const UO = String(row["UO"] || "").trim();
          const SIGLA = String(row["SIGLA"] || "").trim();
          const Ano = String(row["Ano"] || "2025").trim();
          anosEncontrados.add(Ano);

          const orcado_inicial = Number(row["Orçado Inicial"]) || 0;
          const orcado_atual = Number(row["Orçado Atual"]) || 0;

          const empenhado =
            (Number(row["Empenhado"]) || 0) +
            (Number(row["PED"]) || 0) +
            (Number(row["Destaque"]) || 0) +
            (Number(row["Contingenciado"]) || 0);

          const liquidado = Number(row["Liquidado"]) || 0;
          const pago = Number(row["Pago"]) || 0;
          const livre = orcado_atual - empenhado;

          const key = `${UO}-${Ano}`;
          if (!mapa.has(key)) {
            mapa.set(key, {
              UO,
              SIGLA,
              Ano,
              orcado_inicial,
              orcado_atual,
              empenhado,
              liquidado,
              pago,
              livre,
            });
          } else {
            const atual = mapa.get(key)!;
            atual.orcado_inicial += orcado_inicial;
            atual.orcado_atual += orcado_atual;
            atual.empenhado += empenhado;
            atual.liquidado += liquidado;
            atual.pago += pago;
            atual.livre += livre;
          }
        });

        const anosArray = Array.from(anosEncontrados).sort();
        setAnos(anosArray);
        setAnoSelecionado(anosArray[anosArray.length - 1]);
        setDados(Array.from(mapa.values()));
      } catch (e) {
        console.error("Erro ao carregar planilha:", e);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return { dados, loading, anoSelecionado, setAnoSelecionado, anos };
}
