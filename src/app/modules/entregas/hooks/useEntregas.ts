// src/app/modules/entregas/hooks/useEntregas.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type Entrega = {
  id: string;
  ano: number | null;

  local: string | null; // cidade
  cod_ibge: number | null;

  produto: string | null;
  produto_tipo: string | null;
  acao: string | null;
  classificacao: string | null;
  plano_acao: string | null;

  valor_total: number | null;
  qtde: number | null;

  data_inicio: string | null;    // dd/mm/aaaa
  data_conclusao: string | null; // dd/mm/aaaa

  grupo: string | null;
  orgao: string | null;
};

type GasDumpResponse = { rows: any[]; count: number };
type GasChunkResponse = {
  rows: any[];
  count: number;
  total: number;
  totalChunks: number;
  chunkIndex: number;
};

// COLE AQUI O SEU ENDPOINT DO GAS:
const GAS_BASE =
  "https://script.google.com/macros/s/AKfycbw3Mr6Thz_jgZqRmEnFof8BjhnCW4Puam6bSDkPyXYUu99_HTeosrznaLJVW9rN-imzTw/exec";

/** Helpers de coerção (tipos estritos) */
const toStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  // evita objetos acidentais (ex.: {}), arrays, etc.
  if (typeof v === "object") return null;
  const s = String(v).trim();
  return s.length ? s : null;
};
const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
};
const toInt = (v: unknown): number | null => {
  const num = toNum(v);
  return num === null ? null : Math.round(num);
};

function safeId(row: any): string {
  const base =
    row?.id ??
    row?.codent ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Math.random()).slice(2));
  return String(base);
}

/** Mapeia a linha bruta do GAS para o tipo Entrega */
function toEntrega(row: any): Entrega {
  return {
    id: safeId(row),
    ano: toInt(row?.ano),

    local: toStr(row?.local) ?? toStr(row?.municipio),
    cod_ibge: toInt(row?.cod_ibge),

    produto: toStr(row?.produto),
    produto_tipo: toStr(row?.produto_tipo),
    acao: toStr(row?.acao),
    classificacao: toStr(row?.classificacao),
    plano_acao: toStr(row?.plano_acao),

    valor_total: toNum(row?.valor_total),
    qtde: toNum(row?.qtde),

    data_inicio: toStr(row?.data_inicio),
    data_conclusao: toStr(row?.data_conclusao),

    grupo: toStr(row?.grupo),
    orgao: toStr(row?.orgao),
  };
}

export type GroupByKey =
  | "produto"
  | "produto_tipo"
  | "acao"
  | "classificacao"
  | "plano_acao";

export function useEntregas(options?: {
  chunkSize?: number;      // use >0 para /dumpChunks
  groupBy?: GroupByKey;    // chave padrão de agrupamento
}) {
  const chunkSize = options?.chunkSize ?? 0;
  const groupBy = options?.groupBy ?? "produto_tipo";

  const [raw, setRaw] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let rows: any[] = [];

        if (chunkSize > 0) {
          const firstUrl = `${GAS_BASE}?action=dumpChunks&chunkSize=${chunkSize}&chunk=1`;
          const first = (await (await fetch(firstUrl)).json()) as GasChunkResponse;
          rows = first.rows ?? [];
          const totalChunks = Number(first.totalChunks ?? 1);
          for (let i = 2; i <= totalChunks; i++) {
            if (cancelled) return;
            const url = `${GAS_BASE}?action=dumpChunks&chunkSize=${chunkSize}&chunk=${i}`;
            const r = (await (await fetch(url)).json()) as GasChunkResponse;
            rows = rows.concat(r.rows ?? []);
          }
        } else {
          const url = `${GAS_BASE}?action=dump`;
          const data = (await (await fetch(url)).json()) as GasDumpResponse;
          rows = data.rows ?? [];
        }

        if (cancelled) return;
        setRaw(rows.map(toEntrega));
      } catch (e: any) {
        if (cancelled) return;
        setError(String(e?.message || e));
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [chunkSize]);

  /** cidades únicas (ordenadas) */
  const cidades = useMemo(() => {
    const set = new Set<string>();
    raw.forEach((r) => {
      if (r.local) set.add(r.local);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [raw]);

  /** anos disponíveis (ordenados) */
  const anos = useMemo(() => {
    const set = new Set<number>();
    raw.forEach((r) => {
      if (typeof r.ano === "number") set.add(r.ano);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [raw]);

  /** agregação de soma */
  function aggregate(list: Entrega[]) {
    return list.reduce(
      (acc, it) => {
        acc.valor += it.valor_total || 0;
        acc.qtde += it.qtde || 0;
        return acc;
      },
      { valor: 0, qtde: 0 }
    );
  }

  /** gera “programas” (cards) para um ano e cidade */
  function getProgramas(params: {
    ano?: number;
    cidade?: string;
    key?: GroupByKey; // default: groupBy
  }) {
    const k = params.key ?? groupBy;

    let base = raw;
    if (typeof params.ano === "number") base = base.filter((r) => r.ano === params.ano);
    if (params.cidade) base = base.filter((r) => r.local === params.cidade);

    const map = new Map<
      string,
      { nome: string; valor: number; qtd: number; amostras: Entrega[] }
    >();

    base.forEach((r) => {
      const prim = (r as any)[k] as string | null;
      const fallback = k === "produto" ? r.acao : r.produto;
      const keyValue = prim ?? fallback ?? "(sem valor)";
      const nome = keyValue;
      const b = map.get(nome) ?? { nome, valor: 0, qtd: 0, amostras: [] };
      b.valor += r.valor_total || 0;
      b.qtd += r.qtde || 0;
      if (b.amostras.length < 5) b.amostras.push(r);
      map.set(nome, b);
    });

    const items = Array.from(map.values()).sort((a, b) => b.valor - a.valor);
    const tot = aggregate(base);
    return { items, totalValor: tot.valor, totalQtd: tot.qtde, totalReg: base.length };
  }

  /** lista detalhada dos itens de um “programa” */
  function getItensDoPrograma(params: {
    ano?: number;
    cidade?: string;
    nome: string;
    key?: GroupByKey;
  }) {
    const k = params.key ?? groupBy;
    let base = raw;
    if (typeof params.ano === "number") base = base.filter((r) => r.ano === params.ano);
    if (params.cidade) base = base.filter((r) => r.local === params.cidade);
    return base.filter((r) => {
      const prim = (r as any)[k] as string | null;
      const fallback = k === "produto" ? r.acao : r.produto;
      return (prim ?? fallback ?? "(sem valor)") === params.nome;
    });
  }

  return {
    loading,
    error,
    data: raw,
    cidades,
    anos,
    getProgramas,
    getItensDoPrograma,
  };
}
