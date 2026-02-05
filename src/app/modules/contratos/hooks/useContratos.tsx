"use client";
import { useEffect, useMemo, useState } from "react";

const API_BASE =
  "https://script.google.com/macros/s/AKfycbxLrRWVrnW8O5a0sBqB9nHnYijl4v1W6OGQllN8bXh3sJxaen4aH4-_LDvyFPCoPfruOw/exec";

export interface Contrato {
  id: string;
  numero: string;
  slug: string;
  contratada: string;
  sigadoc?: string;
  tipo?: string;
  objeto?: string;
  unidade?: string;

  // valores normalizados a partir do GAS (index)
  valorTotal?: number;     // VALOR TOTAL DO CONTRATO (A)
  empenhado?: number;      // SALDO EMPENHADO 2025
  liquidado?: number;      // SALDO  UTILIZADO  (no index é isso que chega)
  pago?: number;           // geralmente 0 no index (fica para o detalhe)
  saldoAtual?: number;     // SALDO ATUAL DO CONTRATO
  restoEmpenhar?: number;  // RESTO A  SER EMPENHADO
  extornado?: number;

  gestor?: string;
  fiscal?: string;
  suplente?: string;
  dataInicio?: string;
  dataVencimento?: string;
  nomeAba?: string;

  detalhes?: Record<string, any>;
}

export interface ContratoDetalhado {
  CONTRATO: string;
  DETALHES: {
    CABECALHO?: Record<string, any>;
    ADITIVOS?: any[];
    LOTES?: any[];
    EMPENHOS?: any[];
    PAGAMENTOS?: any[];
  };
  atualizado_em?: string;
}

/* ------------------------ utils ------------------------ */
const toNum = (v: any) => {
  if (v === null || v === undefined || v === "") return 0;
  // já lida com number, string com milhar/ponto e decimal/vírgula
  if (typeof v === "number") return v;
  const s = String(v).replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

const slugify = (s: string) =>
  encodeURIComponent(s.trim().replace(/\s+/g, "_"));

const splitVigencia = (vig?: string | null) => {
  if (!vig) return { inicio: undefined, fim: undefined };
  const [a, b] = String(vig).split("a").map((x) => x?.trim());
  return { inicio: a, fim: b };
};

function coerceRows(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row) => {
    const o: Record<string, any> = {};
    Object.entries(row || {}).forEach(([k, v]) => {
      if (
        /valor|total|unit.rio|quantidade|empenhado|liquidado|estornado|saldo/i.test(
          k
        )
      ) {
        o[k] = toNum(v);
      } else {
        o[k] = v;
      }
    });
    return o;
  });
}

function normalizarDetalhes(json: any): ContratoDetalhado | null {
  if (!json || (!json.DETALHES && !json.detalhes)) return null;
  const D = json.DETALHES || json.detalhes;

  return {
    CONTRATO: json.CONTRATO || json.contrato || "",
    DETALHES: {
      CABECALHO: D.CABECALHO || D.Cabecalho || {},
      ADITIVOS: coerceRows(D.ADITIVOS || D.Aditivos || []),
      LOTES: coerceRows(D.LOTES || D.Lotes || []),
      EMPENHOS: coerceRows(D.EMPENHOS || D.Empenhos || []),
      PAGAMENTOS: coerceRows(D.PAGAMENTOS || D.Pagamentos || []),
    },
    atualizado_em: json.atualizado_em || json.atualizadoEm,
  };
}

/* ------------------------ hook ------------------------ */
export function useContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  // cache do índice
  const INDEX_CACHE = "contratos_index_cache_v3";
  const INDEX_TTL = 6 * 60 * 60 * 1000; // 6h

  // cache por contrato (detalhe)
  const DET_PREFIX = "contrato_det_"; // + encodeURIComponent(ident)

  useEffect(() => {
    let ativo = true;

    async function loadIndex() {
      setLoading(true);
      try {
        // cache
        const raw = localStorage.getItem(INDEX_CACHE);
        const ts = Number(localStorage.getItem(INDEX_CACHE + "_ts") || 0);
        if (raw && Date.now() - ts < INDEX_TTL) {
          const lista = JSON.parse(raw) as Contrato[];
          if (ativo) setContratos(lista);
          return;
        }

        // remoto
        const rsp = await fetch(API_BASE);
        if (!rsp.ok) throw new Error("Falha ao carregar índice");
        const data = await rsp.json();

        const base: any[] = data.CONTRATOS || data.contratos || [];
        const mapped: Contrato[] = base.map((row) => {
          const numero =
            row["Nº CONTRATO"] ||
            row["Nº_CONTRATO"] ||
            row["N CONTRATO"] ||
            row.numero ||
            "";

          const { inicio, fim } = splitVigencia(row["VIGÊNCIA"] || row.VIGENCIA);

          // ⚠️ MAPEAMENTO EXPLÍCITO (sem “somar duas vezes”)
          const valorTotal = toNum(row["VALOR TOTAL DO CONTRATO (A)"]);
          const empenhado = toNum(row["SALDO EMPENHADO 2025"]);
          const liquidado = toNum(row["SALDO  UTILIZADO"]);
          const saldoAtual = toNum(row["SALDO ATUAL DO CONTRATO"]);
          const restoEmpenhar = toNum(row["RESTO A  SER EMPENHADO"]);
          const pago = toNum(row["PAGO"]); // geralmente 0 no index

          return {
            id: Math.abs(
              Array.from(String(numero)).reduce(
                (acc, ch) => (acc << 5) - acc + ch.charCodeAt(0),
                0
              )
            ).toString(),
            numero,
            slug: slugify(numero),
            contratada:
              row["CONTRATADA"] || row["EMPRESA"] || row.contratada || "",
            sigadoc: row["Nº CONTRATO SIGADOC"] || row["PROCESSO"] || "",
            tipo: row["TIPO DE CONTRATO"] || row.tipo || "",
            objeto: row["OBJETO DO CONTRATO"] || row.objeto || "",
            unidade: row["UNIDADE ORÇAMENTÁRIA"] || "",

            valorTotal,
            empenhado,
            liquidado,
            pago,
            saldoAtual,
            restoEmpenhar,
            extornado: toNum(row["ESTORNADO"]),

            dataInicio: inicio,
            dataVencimento: fim,
            nomeAba: row["NOME ABA"] || row["NOME_ABA"] || undefined,
          };
        });

        if (ativo) {
          setContratos(mapped);
          localStorage.setItem(INDEX_CACHE, JSON.stringify(mapped));
          localStorage.setItem(INDEX_CACHE + "_ts", String(Date.now()));
        }
      } catch (e) {
        console.error("Erro ao carregar índice de contratos:", e);
        if (ativo) setContratos([]);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    loadIndex();
    return () => {
      ativo = false;
    };
  }, []);

  /** Busca um contrato detalhado no Apps Script e normaliza campos */
  async function getContratoDetalhado(
    nomeAbaOuNumero: string
  ): Promise<ContratoDetalhado | null> {
    if (!nomeAbaOuNumero) return null;

    const ident = encodeURIComponent(nomeAbaOuNumero);
    const cacheKey = DET_PREFIX + ident;
    const cacheTsKey = cacheKey + "_ts";

    // cache por 6h
    const cached = localStorage.getItem(cacheKey);
    const ts = Number(localStorage.getItem(cacheTsKey) || 0);
    if (cached && Date.now() - ts < 6 * 60 * 60 * 1000) {
      try {
        return JSON.parse(cached);
      } catch {}
    }

    const url = `${API_BASE}?contrato=${ident}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Falha ao buscar detalhe: ${resp.status}`);
    const data = await resp.json();

    const det = normalizarDetalhes(data);
    if (det) {
      localStorage.setItem(cacheKey, JSON.stringify(det));
      localStorage.setItem(cacheTsKey, String(Date.now()));
    }
    return det;
  }

  // totais derivados do índice (sem percentuais aqui)
  const totais = useMemo(() => {
    const soma = (getter: (c: Contrato) => number) =>
      contratos.reduce((acc, c) => acc + getter(c), 0);

    return {
      totalContratos: contratos.length,
      valorTotal: soma((c) => Number(c.valorTotal || 0)),
      empenhado: soma((c) => Number(c.empenhado || 0)),
      liquidado: soma((c) => Number(c.liquidado || 0)),
      pago: soma((c) => Number(c.pago || 0)),
      saldoAtual: soma((c) => Number(c.saldoAtual || 0)), // 👈 saldo dos contratos vem do campo certo
    };
  }, [contratos]);

  // atualizar índice manualmente (mesmo mapeamento do loadIndex)
  async function refreshIndex() {
    localStorage.removeItem(INDEX_CACHE);
    localStorage.removeItem(INDEX_CACHE + "_ts");

    const rsp = await fetch(API_BASE);
    if (!rsp.ok) throw new Error("Falha ao recarregar índice");
    const data = await rsp.json();
    const base: any[] = data.CONTRATOS || data.contratos || [];

    const mapped: Contrato[] = base.map((row) => {
      const numero =
        row["Nº CONTRATO"] || row["Nº_CONTRATO"] || row["N CONTRATO"] || row.numero || "";
      const { inicio, fim } = splitVigencia(row["VIGÊNCIA"] || row.VIGENCIA);

      const valorTotal = toNum(row["VALOR TOTAL DO CONTRATO (A)"]);
      const empenhado = toNum(row["SALDO EMPENHADO 2025"]);
      const liquidado = toNum(row["SALDO  UTILIZADO"]);
      const saldoAtual = toNum(row["SALDO ATUAL DO CONTRATO"]);
      const restoEmpenhar = toNum(row["RESTO A  SER EMPENHADO"]);
      const pago = toNum(row["PAGO"]);

      return {
        id: Math.abs(
          Array.from(String(numero)).reduce(
            (acc, ch) => (acc << 5) - acc + ch.charCodeAt(0),
            0
          )
        ).toString(),
        numero,
        slug: slugify(numero),
        contratada: row["CONTRATADA"] || row["EMPRESA"] || "",
        sigadoc: row["Nº CONTRATO SIGADOC"] || row["PROCESSO"] || "",
        tipo: row["TIPO DE CONTRATO"] || "",
        objeto: row["OBJETO DO CONTRATO"] || "",
        unidade: row["UNIDADE ORÇAMENTÁRIA"] || "",

        valorTotal,
        empenhado,
        liquidado,
        pago,
        saldoAtual,
        restoEmpenhar,
        extornado: toNum(row["ESTORNADO"]),

        dataInicio: inicio,
        dataVencimento: fim,
        nomeAba: row["NOME ABA"] || row["NOME_ABA"] || undefined,
      } as Contrato;
    });

    setContratos(mapped);
    localStorage.setItem(INDEX_CACHE, JSON.stringify(mapped));
    localStorage.setItem(INDEX_CACHE + "_ts", String(Date.now()));
    return mapped;
  }

  return { contratos, loading, refreshIndex, getContratoDetalhado, totais };
}
