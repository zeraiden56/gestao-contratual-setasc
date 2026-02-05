// src/app/modules/pte/hooks/usePTE.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Modalidade = "AQUISICOES" | "PREGOES" | "OBRAS" | "INDEFINIDO";

export type PTE = {
  id: string;

  descricao: string | null;
  produto: string | null;
  qtidade_produto: number | null;
  local: string | null;
  programa: string | null;
  acao: string | null;

  fase_01_marco_zero: string | null;
  fase_02_projeto_elaborado: string | null;
  fase_03_tr_elaborado: string | null;
  fase_04_edital_publicado: string | null;
  fase_05_licitacao_realizada: string | null;
  fase_06_licitacao_homologada: string | null;
  fase_07_contrato_assinado: string | null;
  fase_08_os_of: string | null;

  duracao_fase_adm_dias: number | null;
  data_conclusao_entrega: string | null;

  tesouro: number | null;
  recurso_vinculado: number | null;
  outras_fontes: number | null;

  necessidade_suplementacao_pta: string | null;
  num_no_entregas_mt: string | null;

  modalidade: Modalidade; // vindo do GAS
};

type GasDumpResponse  = { rows: any[]; count: number };
type GasChunkResponse = {
  rows: any[];
  count: number;
  total: number;
  totalChunks: number;
  chunkIndex: number;
};

const GAS_BASE =
  "https://script.google.com/macros/s/AKfycbw5PpfViurXfkWplpdS_j9SVorj-c0xzI5_U8cX-jSz3cTqyELHWKATizRQmgK3Figz/exec";

/* ---------- normalização ---------- */
const toStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return null;
  const s = String(v).trim();
  return s.length ? s : null;
};
const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(String(v).replace(/\s|R\$/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(num) ? num : null;
};
const toModalidade = (v: unknown): Modalidade => {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "OBRAS") return "OBRAS";
  if (s === "PREGOES" || s === "PREGÕES" || s === "PREGÃO") return "PREGOES";
  if (s === "AQUISICOES" || s === "AQUISIÇÕES" || s === "AQUISIÇÃO") return "AQUISICOES";
  return "INDEFINIDO";
};

function toPTE(row: any): PTE {
  return {
    id: String(row?.id ?? crypto.randomUUID()),
    descricao: toStr(row?.descricao),
    produto: toStr(row?.produto),
    qtidade_produto: toNum(row?.qtidade_produto),
    local: toStr(row?.local),
    programa: toStr(row?.programa),
    acao: toStr(row?.acao),

    fase_01_marco_zero: toStr(row?.fase_01_marco_zero),
    fase_02_projeto_elaborado: toStr(row?.fase_02_projeto_elaborado),
    fase_03_tr_elaborado: toStr(row?.fase_03_tr_elaborado),
    fase_04_edital_publicado: toStr(row?.fase_04_edital_publicado),
    fase_05_licitacao_realizada: toStr(row?.fase_05_licitacao_realizada),
    fase_06_licitacao_homologada: toStr(row?.fase_06_licitacao_homologada),
    fase_07_contrato_assinado: toStr(row?.fase_07_contrato_assinado),
    fase_08_os_of: toStr(row?.fase_08_os_of),

    duracao_fase_adm_dias: toNum(row?.duracao_fase_adm_dias),
    data_conclusao_entrega: toStr(row?.data_conclusao_entrega),

    tesouro: toNum(row?.tesouro),
    recurso_vinculado: toNum(row?.recurso_vinculado),
    outras_fontes: toNum(row?.outras_fontes),

    necessidade_suplementacao_pta: toStr(row?.necessidade_suplementacao_pta),
    num_no_entregas_mt: toStr(row?.num_no_entregas_mt),

    modalidade: toModalidade(row?.modalidade),
  };
}

export function usePTE(options?: { chunkSize?: number }) {
  const chunkSize = options?.chunkSize ?? 0;
  const [rows, setRows] = useState<PTE[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: any[] = [];
      if (chunkSize > 0) {
        const firstUrl = `${GAS_BASE}?action=dumpChunks&chunkSize=${chunkSize}&chunk=1&_=${Date.now()}`;
        const first = (await (await fetch(firstUrl)).json()) as GasChunkResponse;
        data = first.rows ?? [];
        const totalChunks = Number(first.totalChunks ?? 1);
        for (let i = 2; i <= totalChunks; i++) {
          const u = `${GAS_BASE}?action=dumpChunks&chunkSize=${chunkSize}&chunk=${i}&_=${Date.now()}`;
          const r = (await (await fetch(u)).json()) as GasChunkResponse;
          data = data.concat(r.rows ?? []);
        }
      } else {
        const url = `${GAS_BASE}?action=dump&_=${Date.now()}`;
        const r = (await (await fetch(url)).json()) as GasDumpResponse;
        data = r.rows ?? [];
      }
      setRows(data.map(toPTE));
      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [chunkSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totais = useMemo(
    () =>
      rows.reduce(
        (acc, it) => {
          acc.tesouro += it.tesouro || 0;
          acc.vinculado += it.recurso_vinculado || 0;
          acc.outras += it.outras_fontes || 0;
          return acc;
        },
        { tesouro: 0, vinculado: 0, outras: 0 }
      ),
    [rows]
  );

  const cidades = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.local && s.add(r.local));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rows]);

  const programas = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.programa && s.add(r.programa));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rows]);

  const refresh = useCallback(() => fetchAll(), [fetchAll]);

  return { loading, error, rows, totais, cidades, programas, refresh, updatedAt };
}
