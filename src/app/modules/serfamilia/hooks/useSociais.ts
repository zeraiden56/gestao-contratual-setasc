"use client";

import { useEffect, useMemo, useState } from "react";

export type SociaisInput = {
  uf?: string;              // "MT" (default)
  cidade?: string;          // nome exato do município (opcional)
  ano?: number | "todos";   // ex: 2025 | "todos"
  ckan?: {
    host: string;           // ex: "https://dados.mds.gov.br" ou "https://dados.gov.br"
    familiasCadRID?: string;        // resource_id do recurso familias cadúnico por município
    pessoasCadRID?: string;         // resource_id pessoas cadúnico
    crasRID?: string;               // censo suas - número de CRAS
    creasRID?: string;              // censo suas - número de CREAS
    centrosPopRID?: string;         // censo suas - número de Centros POP
    beneficiosEventuaisRID?: string;// censo suas - benefícios eventuais
  };
  transparencia?: {
    token?: string;                 // header chave-api-dados
    bolsaFamiliaURL?: string;       // endpoint do Portal (por município/ano)
    bpcURL?: string;                // endpoint do Portal (por município/ano)
  };
};

export type SociaisOut = {
  familiasCad?: number | null;
  pessoasCad?: number | null;
  bolsaFamiliaBenef?: number | null;
  bpcBenef?: number | null;
  cras?: number | null;
  creas?: number | null;
  centrosPop?: number | null;
  benefEventuais?: number | null;
  loading: boolean;
};

async function fetchCKANCount(
  host: string,
  resourceId: string,
  filters: Record<string, string | number> = {}
) {
  const url =
    host.replace(/\/$/, "") +
    "/api/3/action/datastore_search?limit=1&resource_id=" +
    encodeURIComponent(resourceId) +
    (Object.keys(filters).length
      ? "&filters=" + encodeURIComponent(JSON.stringify(filters))
      : "");
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    // alguns recursos já trazem count total:
    if (typeof j?.result?.total === "number") return Number(j.result.total);
    // ou somatório em algum campo — nesse caso teria de buscar full/aggregate (depende do recurso)
    return j?.result?.records?.length ? j.result.records.length : 0;
  } catch {
    return null;
  }
}

async function fetchTransparencia(
  url: string,
  token?: string
): Promise<number | null> {
  try {
    const r = await fetch(url, {
      headers: token ? { "chave-api-dados": token } : {},
    });
    if (!r.ok) return null;
    const data = await r.json();
    // cada API do Portal tem formato próprio; aqui assumo que venha um array e somo um campo "quantidadeBeneficiarios"
    if (Array.isArray(data)) {
      const k = ["quantidadeBeneficiarios", "qtdBeneficiarios", "quantidade"];
      for (const key of k) {
        if (typeof data[0]?.[key] === "number") {
          return data.reduce((s, it) => s + (Number(it[key]) || 0), 0);
        }
      }
      return data.length;
    }
    // fallback
    return typeof data?.quantidade === "number" ? data.quantidade : null;
  } catch {
    return null;
  }
}

export function useSociais(input: SociaisInput): SociaisOut {
  const [out, setOut] = useState<SociaisOut>({
    loading: true,
  });

  const uf = input.uf || "MT";
  const filtrosCKAN = useMemo(() => {
    const f: Record<string, string | number> = { UF: uf };
    if (input.cidade) f["Municipio"] = input.cidade;
    if (typeof input.ano === "number") f["Ano"] = input.ano;
    return f;
  }, [uf, input.cidade, input.ano]);

  useEffect(() => {
    let abort = false;
    async function run() {
      setOut((s) => ({ ...s, loading: true }));

      const ckanHost = input.ckan?.host?.replace(/\/$/, "");
      const hasCKAN = !!ckanHost;

      const [
        familiasCad,
        pessoasCad,
        cras,
        creas,
        centrosPop,
        benefEventuais,
      ] = await Promise.all([
        hasCKAN && input.ckan?.familiasCadRID
          ? fetchCKANCount(ckanHost!, input.ckan!.familiasCadRID!, filtrosCKAN)
          : null,
        hasCKAN && input.ckan?.pessoasCadRID
          ? fetchCKANCount(ckanHost!, input.ckan!.pessoasCadRID!, filtrosCKAN)
          : null,
        hasCKAN && input.ckan?.crasRID
          ? fetchCKANCount(ckanHost!, input.ckan!.crasRID!, filtrosCKAN)
          : null,
        hasCKAN && input.ckan?.creasRID
          ? fetchCKANCount(ckanHost!, input.ckan!.creasRID!, filtrosCKAN)
          : null,
        hasCKAN && input.ckan?.centrosPopRID
          ? fetchCKANCount(ckanHost!, input.ckan!.centrosPopRID!, filtrosCKAN)
          : null,
        hasCKAN && input.ckan?.beneficiosEventuaisRID
          ? fetchCKANCount(
              ckanHost!,
              input.ckan!.beneficiosEventuaisRID!,
              filtrosCKAN
            )
          : null,
      ]);

      const bolsaFamiliaBenef = input.transparencia?.bolsaFamiliaURL
        ? await fetchTransparencia(
            input.transparencia.bolsaFamiliaURL,
            input.transparencia.token
          )
        : null;

      const bpcBenef = input.transparencia?.bpcURL
        ? await fetchTransparencia(
            input.transparencia.bpcURL,
            input.transparencia.token
          )
        : null;

      if (!abort) {
        setOut({
          familiasCad: familiasCad ?? null,
          pessoasCad: pessoasCad ?? null,
          bolsaFamiliaBenef: bolsaFamiliaBenef ?? null,
          bpcBenef: bpcBenef ?? null,
          cras: cras ?? null,
          creas: creas ?? null,
          centrosPop: centrosPop ?? null,
          benefEventuais: benefEventuais ?? null,
          loading: false,
        });
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [JSON.stringify(filtrosCKAN), JSON.stringify(input)]);

  return out;
}
