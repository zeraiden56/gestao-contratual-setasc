"use client";

import { useEffect, useState } from "react";

export interface DadosIBGE {
  // --- campos já usados hoje no painel ---
  populacao: number | null;
  pib: number | null;
  /**
   * Mantemos esse campo como "PIB per capita" pra compatibilidade
   * com o que o dashboard já espera.
   */
  renda: number | null;
  anoReferencia: number | null;
  rotuloLocal: string; // "Mato Grosso" ou nome do município

  // --- demografia ---
  proporcaoUrbana?: number | null;        // % população em área urbana
  proporcaoRural?: number | null;         // % população em área rural
  densidadeDemografica?: number | null;   // hab/km²

  percentualCriancas0a5?: number | null;  // % da população 0–5 anos
  percentualCriancas0a14?: number | null; // % da população 0–14 anos
  percentualIdosos60Mais?: number | null; // % da população 60+ anos

  // --- renda / pobreza / trabalho ---
  rendaDomiciliarPerCapita?: number | null;        // renda média per capita
  rendaDomiciliarMediana?: number | null;
  percentualBaixaRendaAteMeioSM?: number | null;   // % até 1/2 SM per capita
  indiceGiniRenda?: number | null;                 // 0–1
  taxaDesocupacao?: number | null;                 // %

  // --- saneamento / infraestrutura de domicílio ---
  percentualDomiciliosComAguaRede?: number | null;
  percentualDomiciliosComEsgotamentoAdequado?: number | null;
  percentualDomiciliosComColetaLixo?: number | null;
  percentualDomiciliosComBanheiroExclusivo?: number | null;

  // --- educação ---
  taxaAnalfabetismo15Mais?: number | null; // %
  taxaEscolarizacao6a14?: number | null;   // %
  taxaEscolarizacao15a17?: number | null;  // %
  percentualNemNem15a24?: number | null;   // %

  // --- anos de referência por bloco (pra mostrar no UI) ---
  anoReferenciaPopulacao?: number | null;
  anoReferenciaEconomia?: number | null;
  anoReferenciaSaneamento?: number | null;
  anoReferenciaEducacao?: number | null;
}

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function fetchJsonSafe(url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/**
 * Converte string numérica do IBGE ("3.452.001", "1.234,56") para number.
 */
function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  if (typeof raw === "string") {
    const cleaned = raw.replace(/\./g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

export function useIBGE(cidade: string) {
  const [dados, setDados] = useState<DadosIBGE | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let abort = false;

    async function run() {
      setLoading(true);
      try {
        // UF 51 = Mato Grosso
        let locType = "N3"; // N3 = UF
        let locId = "51";
        let rotuloLocal = "Mato Grosso";

        // Se veio município, tenta mapear para N6 (código IBGE)
        if (cidade && norm(cidade) !== norm("Mato Grosso")) {
          const lista = (await fetchJsonSafe(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios"
          )) as any[] | null;

          if (!lista) throw new Error("Falha ao listar municípios do IBGE.");

          const alvo = norm(cidade);
          const muni =
            lista.find((m) => norm(m.nome) === alvo) ||
            lista.find((m) => norm(m.nome).startsWith(alvo)) ||
            lista.find((m) => norm(m.nome).includes(alvo));

          if (muni) {
            locType = "N6"; // município
            locId = String(muni.id);
            rotuloLocal = muni.nome;
          }
        }

        // anos usados em cada série
        const POP_ANO = "2024";   // Estimativa populacional mais recente
        const PIB_ANO = "2021";   // Último PIB municipal publicado
        const DENS_ANO = "2010";  // Densidade demográfica (Censo 2010)

        // População estimada — tabela 6579 / variável 9324
        const popUrl =
          `https://servicodados.ibge.gov.br/api/v3/agregados/6579` +
          `/periodos/${POP_ANO}/variaveis/9324` +
          `?localidades=${locType}[${locId}]`;

        // PIB a preços correntes — tabela 5938 / variável 37 (em MIL REAIS)
        const pibUrl =
          `https://servicodados.ibge.gov.br/api/v3/agregados/5938` +
          `/periodos/${PIB_ANO}/variaveis/37` +
          `?localidades=${locType}[${locId}]`;

        // Densidade demográfica — tabela 1298 / variável 614 (Censo 2010)
        const densUrl =
          `https://servicodados.ibge.gov.br/api/v3/agregados/1298` +
          `/periodos/${DENS_ANO}/variaveis/614` +
          `?localidades=${locType}[${locId}]`;

        const [popJson, pibJson, densJson] = await Promise.all([
          fetchJsonSafe(popUrl),
          fetchJsonSafe(pibUrl),
          fetchJsonSafe(densUrl),
        ]);

        const popStr =
          popJson?.[0]?.resultados?.[0]?.series?.[0]?.serie?.[POP_ANO] ??
          null;
        const pibStr =
          pibJson?.[0]?.resultados?.[0]?.series?.[0]?.serie?.[PIB_ANO] ??
          null;
        const densStr =
          densJson?.[0]?.resultados?.[0]?.series?.[0]?.serie?.[DENS_ANO] ??
          null;

        const populacao = toNumber(popStr);

        // PIB vem em MIL REAIS → converte pra R$
        const pibMil = toNumber(pibStr);
        const pib = pibMil != null ? pibMil * 1000 : null;

        let densidadeDemografica = toNumber(densStr);

        // Se não tiver densidade pro município, tenta cair pro valor do estado
        if (densidadeDemografica === null && locType === "N6") {
          const densUfJson = await fetchJsonSafe(
            `https://servicodados.ibge.gov.br/api/v3/agregados/1298/periodos/${DENS_ANO}/variaveis/614?localidades=N3[51]`
          );
          const densUfStr =
            densUfJson?.[0]?.resultados?.[0]?.series?.[0]?.serie?.[DENS_ANO] ??
            null;
          densidadeDemografica = toNumber(densUfStr);
        }

        // PIB per capita (anual)
        const pibPerCapita =
          pib !== null && populacao !== null && populacao > 0
            ? pib / populacao
            : null;

        const out: DadosIBGE = {
          rotuloLocal,

          // campos antigos (já usados hoje)
          populacao,
          pib,
          renda: pibPerCapita,
          anoReferencia: pib !== null
            ? Number(PIB_ANO)
            : populacao !== null
            ? Number(POP_ANO)
            : null,

          // anos por bloco
          anoReferenciaPopulacao: populacao !== null ? Number(POP_ANO) : null,
          anoReferenciaEconomia: pib !== null ? Number(PIB_ANO) : null,
          anoReferenciaSaneamento: null,
          anoReferenciaEducacao: null,

          // demografia
          proporcaoUrbana: null,
          proporcaoRural: null,
          densidadeDemografica,
          percentualCriancas0a5: null,
          percentualCriancas0a14: null,
          percentualIdosos60Mais: null,

          // renda / pobreza / trabalho
          rendaDomiciliarPerCapita: pibPerCapita, // por enquanto usa PIB per capita
          rendaDomiciliarMediana: null,
          percentualBaixaRendaAteMeioSM: null,
          indiceGiniRenda: null,
          taxaDesocupacao: null,

          // saneamento
          percentualDomiciliosComAguaRede: null,
          percentualDomiciliosComEsgotamentoAdequado: null,
          percentualDomiciliosComColetaLixo: null,
          percentualDomiciliosComBanheiroExclusivo: null,

          // educação
          taxaAnalfabetismo15Mais: null,
          taxaEscolarizacao6a14: null,
          taxaEscolarizacao15a17: null,
          percentualNemNem15a24: null,
        };

        if (!abort) setDados(out);
      } catch {
        if (!abort) setDados(null);
      } finally {
        if (!abort) setLoading(false);
      }
    }

    run();

    return () => {
      abort = true;
    };
  }, [cidade]);

  return { dados, loading };
}
