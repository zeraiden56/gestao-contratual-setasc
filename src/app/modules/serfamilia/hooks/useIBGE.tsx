"use client";

import { useEffect, useState } from "react";

export interface DadosIBGE {
  populacao: number | null;
  pib: number | null;
  renda: number | null;
  cadunico: number | null;
  urbanizacao: number | null;
  densidade: number | null;
  anoReferencia: number | null;
}

export function useIBGE(cidade: string) {
  const [dados, setDados] = useState<DadosIBGE | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cidade) {
      setDados(null);
      return;
    }

    async function carregar() {
      setLoading(true);
      try {
        // Tenta cache local primeiro
        const cacheResp = await fetch("/ibge_cache.json", { cache: "no-store" }).catch(() => null);
        let cache: Record<string, DadosIBGE> = {};
        if (cacheResp?.ok) {
          try {
            cache = await cacheResp.json();
          } catch(e) {
            console.warn("Cache IBGE inválido:", e);
            cache = {};
          }
        }

        if (cache[cidade]) {
          setDados(cache[cidade]);
          setLoading(false);
          return;
        }

        // Busca código do município
        const nomeBusca = encodeURIComponent(cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        const locResp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${nomeBusca}`);
        const locJson = await locResp.json();
        if (!Array.isArray(locJson) || locJson.length === 0) {
          throw new Error("Município não encontrado no IBGE: " + cidade);
        }
        const cod = locJson[0].id;

        // População estimativa (exemplo tabela 6579) – ano 2022
        const popResp = await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324?localidades=N6[${cod}]`).catch(() => null);
        const popJson = popResp ? await popResp.json() : null;
        const populacao = popJson?.[0]?.resultados?.[0]?.series?.[0]?.serie?.["2022"] ?? null;

        // PIB município – último dado disponível (ex: ano 2021) – tabela exemplo
        const pibResp = await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N6[${cod}]`).catch(() => null);
        const pibJson = pibResp ? await pibResp.json() : null;
        const pib = pibJson?.[0]?.resultados?.[0]?.series?.[0]?.serie?.["2021"] ?? null;

        // Calcular renda per capita se possível
        const renda = (populacao && pib) ? pib / populacao : null;

        // Montar objeto de dados
        const result: DadosIBGE = {
          populacao: populacao !== null ? Number(populacao) : null,
          pib: pib !== null ? Number(pib) : null,
          renda: renda !== null ? Number(renda) : null,
          cadunico: null,       // Pode adicionar se tiver endpoint
          urbanizacao: null,    // Pode adicionar se tiver fonte
          densidade: null,       // Pode calcular se tiver área
          anoReferencia: (populacao !== null && pib !== null) ? 2021 : null
        };

        setDados(result);

        // Gravar cache atualizado (se possível)
        const novoCache = { ...cache, [cidade]: result };
        await fetch("/api/save-ibge-cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoCache),
        }).catch(() => {
          console.warn("Não foi possível gravar cache IBGE.");
        });
      } catch (err) {
        console.error("Erro ao carregar IBGE:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [cidade]);

  return { dados, loading };
}
