"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export interface Contrato {
  id: number;
  numero: string;
  sigadoc: string;
  contratada: string;
  tipo: string;
  objeto: string;
  vigencia: string | null;
  unidade: string;
  valorTotal: number;
  aditivos: number;
  empenhado: number;
  liquidado: number;
  pago: number;
  restoEmpenhar: number;
  extornado: number;
  vencido?: boolean;
}

export function useContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const CACHE_KEY = "contratos_excel_cache_v5";
  const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

  useEffect(() => {
    async function carregar() {
      try {
        // 🧩 Cache local
        const cache = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(`${CACHE_KEY}_time`);
        if (cache && cacheTime && Date.now() - Number(cacheTime) < CACHE_TIME) {
          setContratos(JSON.parse(cache));
          setLoading(false);
          return;
        }

        // 📘 Lê o Excel
        const response = await fetch("/controle_contratos_empenhos_setasc.xlsx");
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // Abas
        const sheetContratos = workbook.Sheets["CONTRATOS"];
        const sheetVigentes = workbook.Sheets["CONTRATOS VIGENTES"];
        const contratosBase = sheetContratos ? XLSX.utils.sheet_to_json<any>(sheetContratos) : [];
        const contratosVigentes = sheetVigentes ? XLSX.utils.sheet_to_json<any>(sheetVigentes) : [];

        // Funções auxiliares
        const parseNum = (v: any): number => {
          if (v === undefined || v === null || v === "") return 0;
          const num = Number(String(v).replace(/[^\d,-]/g, "").replace(",", "."));
          return isNaN(num) ? 0 : num;
        };

        const normalizarNum = (n: any) => String(n || "").replace(/[^\d]/g, "").trim();

        // 🔹 Mapeia contratos
        const mapa = new Map<string, Contrato>();

        contratosBase.forEach((d: any, i: number) => {
          const numRaw = d["Nº CONTRATO"] || d["CONTRATO"];
          const num = normalizarNum(numRaw);
          if (!num) return;

          // 🔧 Garante formato “NNN/AAAA”
          const numeroFormatado = (() => {
            const n = String(numRaw || "");
            if (/\d+\/\d{4}$/.test(n)) return n.trim();
            const apenasNumeros = n.replace(/[^\d]/g, "");
            if (apenasNumeros.length >= 6) {
              const parteNum = apenasNumeros.slice(0, apenasNumeros.length - 4);
              const ano = apenasNumeros.slice(-4);
              return `${parteNum}/${ano}`;
            }
            return n;
          })();

          mapa.set(num, {
            id: i + 1,
            numero: numeroFormatado,
            sigadoc: String(d["Nº CONTRATO SIGADOC "] || d["Nº CONTRATO SIGADOC"] || "").trim(),
            contratada: String(d["CONTRATADA"] || "").trim(),
            tipo: String(d["TIPO DE CONTRATO "] || d["TIPO DE CONTRATO"] || "").trim(),
            objeto: String(d["OBJETO DO CONTRATO"] || "").trim(),
            vigencia: d["VIGÊNCIA"] || d["VIGENCIA"] || null,
            unidade: String(d["UNIDADE ORÇAMENTÁRIA"] || "").trim(),
            valorTotal: parseNum(d["VALOR TOTAL DO CONTRATO (A)"]),
            aditivos: parseNum(d["VALOR TOTAL DOS ADITIVOS"]),
            empenhado: parseNum(d["SALDO EMPENHADO 2025"]),
            liquidado: parseNum(d["SALDO  UTILIZADO"]),
            pago: parseNum(d["PAGO"]),
            restoEmpenhar: parseNum(d["RESTO A  SER EMPENHADO"]),
            extornado: parseNum(d["EXTORNADO"]),
          });
        });

        // 🔹 Junta com “CONTRATOS VIGENTES”
        contratosVigentes.forEach((d: any) => {
          const numRaw = d["Nº CONTRATO"] || d["CONTRATO"];
          const num = normalizarNum(numRaw);
          if (!num) return;

          const existente = mapa.get(num);
          const aditivoFlag =
            String(d["ADITIVO"] || "").toLowerCase().includes("sim") ||
            parseNum(d["VALOR TOTAL DOS ADITIVOS"]) > 0
              ? 1
              : 0;

          const numeroFormatado = (() => {
            const n = String(numRaw || "");
            if (/\d+\/\d{4}$/.test(n)) return n.trim();
            const apenasNumeros = n.replace(/[^\d]/g, "");
            if (apenasNumeros.length >= 6) {
              const parteNum = apenasNumeros.slice(0, apenasNumeros.length - 4);
              const ano = apenasNumeros.slice(-4);
              return `${parteNum}/${ano}`;
            }
            return n;
          })();

          if (existente) {
            mapa.set(num, {
              ...existente,
              numero: existente.numero || numeroFormatado,
              contratada: existente.contratada || String(d["CONTRATADA"] || "").trim(),
              objeto: existente.objeto || String(d["OBJETO DO CONTRATO"] || "").trim(),
              vigencia: existente.vigencia || d["VIGÊNCIA"] || null,
              valorTotal: existente.valorTotal || parseNum(d["VALOR TOTAL DO CONTRATO (A)"]),
              aditivos: existente.aditivos || aditivoFlag,
            });
          } else {
            mapa.set(num, {
              id: mapa.size + 1,
              numero: numeroFormatado,
              sigadoc: String(d["Nº CONTRATO SIGADOC "] || "").trim(),
              contratada: String(d["CONTRATADA"] || "").trim(),
              tipo: String(d["TIPO DE CONTRATO "] || "").trim(),
              objeto: String(d["OBJETO DO CONTRATO"] || "").trim(),
              vigencia: d["VIGÊNCIA"] || null,
              unidade: String(d["UNIDADE ORÇAMENTÁRIA"] || "").trim(),
              valorTotal: parseNum(d["VALOR TOTAL DO CONTRATO (A)"]),
              aditivos: aditivoFlag,
              empenhado: 0,
              liquidado: 0,
              pago: 0,
              restoEmpenhar: 0,
              extornado: 0,
            });
          }
        });

        // 🔹 Calcula vencimento
        const hoje = new Date();
        const lista = Array.from(mapa.values()).map((c) => {
          const texto = String(c.vigencia || "");
          const match = texto.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:a|ate)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
          if (match) {
            const [, , fim] = match;
            const [df, mf, af] = fim.split("/").map(Number);
            const dataFim = new Date(af < 100 ? 2000 + af : af, mf - 1, df);
            c.vencido = dataFim < hoje;
          } else {
            c.vencido = false;
          }
          return c;
        });

        // 💾 Cacheia e retorna
        setContratos(lista);
        localStorage.setItem(CACHE_KEY, JSON.stringify(lista));
        localStorage.setItem(`${CACHE_KEY}_time`, String(Date.now()));
      } catch (err) {
        console.error("Erro ao carregar contratos:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return { contratos, loading };
}
