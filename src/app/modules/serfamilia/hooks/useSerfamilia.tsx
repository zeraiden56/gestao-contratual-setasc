"use client";

import { useEffect, useState } from "react";

/* ---------------- tipos públicos ---------------- */

export interface Programa {
  codProduto: number;
  nome: string;
  quantidade: number;
  valor: number;
  icone: string;
}

export interface Cidade {
  cidade: string;
  ano: number;
  quantidade: number;
  valor: number;
  programas: Programa[];
}

export interface DadosSerFamilia {
  total: number;          // soma de quantidades (todas as cidades/anos)
  valor: number;          // soma de valores (todas as cidades/anos)
  programas: Programa[];  // agregado geral por programa
  cidades: Cidade[];      // tabela cidade x ano (com detalhe por programa)
  anos: number[];         // anos disponíveis (desc ou asc, tanto faz pro painel)
}

/* -------------- produtos usados no painel -------------- */

// todos os códigos de produto que entram no SER Família (painel)
const CODIGOS_SER_FAMILIA: number[] = [
  // "novos" programas
  763,  // Carteira do autista emitida
  365,  // Casamento Abençoado
  79,   // Cobertor Fornecido (Aconchego)
  618,  // Ser Família Capacita / Pessoas capacitadas
  289,  // Auxílio Emergencial
  406,  // Habitação construída - Programa Ser Família Habitação
  943,  // Auxílio Moradia Ser Mulher

  // benefícios SER Família (os mesmos do GAS)
  1054, // Benefício Ser Família - Família
  1055, // Benefício Ser Família - Idoso
  1056, // Benefício Ser Família - Criança
  1057, // Benefício Ser Família - Inclusivo
  1058, // Benefício Ser Família - Indígena
];

/* -------------- mapeamento de nomes/ícones -------------- */

const nomesPorCodigo: Record<number, { nome: string; icone: string }> = {
  // benefícios clássicos
  1054: {
    nome: "SER Família Criança",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Crian%C3%A7a.png",
  },
  1055: {
    nome: "SER Família Idoso",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Idoso.png",
  },
  1056: {
    nome: "SER Família Inclusivo",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Inclusivo.png",
  },
  1057: {
    nome: "SER Família Indígena",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Indigena.png",
  },
  1058: {
    nome: "SER Família",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia.png",
  },

  // programas novos – nomes iguais aos cards do painel
  763: {
    nome: "Carteira do Autista",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Carteira+Autista.png",
  },
  365: {
    nome: "Casamento Abençoado",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Casamento+Aben%C3%A7oado.png",
  },
  79: {
    nome: "SER Família Aconchego",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Aconchego.png",
  },
  618: {
    nome: "SER Família Capacita",
    icone: "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia.png",
  },
  289: {
    nome: "SER Família Emergencial",
    icone: "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia.png",
  },
  406: {
    nome: "SER Família Habitação",
    icone: "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia.png",
  },
  943: {
    nome: "SER Família Mulher",
    icone:
      "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Mulher.png",
  },
};

/* -------------- endpoint da API Laravel -------------- */
/**
 * Em produção o nginx já faz proxy de /api/entregas -> Laravel.
 * No navegador sempre vamos usar caminho relativo.
 */
const API_URL = "/api/entregas";

/* -------------- tipos do JSON vindo da API Laravel -------------- */

type EntregaRow = {
  id: number;
  local_nome: string | null;
  entrega_anodeinicio: number | null;
  entrega_anodeconclusao: number | null;
  entrega_quantidade: number | string | null;
  entrega_valororgao: number | string | null;
  entrega_valorentrega: number | string | null;
  produto_codigo: number | string | null;
  produto_nome: string | null;
};

/* -------------- utils -------------- */

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

// escolhe o ano da entrega: preferimos o ano de conclusão, se existir
function anoDaEntrega(r: EntregaRow): number | null {
  const fim = toInt(r.entrega_anodeconclusao);
  if (fim && fim > 0) return fim;
  const ini = toInt(r.entrega_anodeinicio);
  return ini && ini > 0 ? ini : null;
}

/* -------------- cache em memória -------------- */
let cacheDados: DadosSerFamilia | null = null;

/* -------------- hook principal -------------- */

export function useSerfamilia() {
  const [dados, setDados] = useState<DadosSerFamilia | null>(cacheDados);
  const [loading, setLoading] = useState(!cacheDados);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (cacheDados) {
        setDados(cacheDados);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // pega TUDO da API e filtramos no front
        const resp = await fetch(`${API_URL}?all=1`);
        const raw = await resp.text();

        if (!resp.ok) {
          console.error(
            "Resposta da API de entregas não OK:",
            resp.status,
            raw.slice(0, 200)
          );
          throw new Error(`HTTP ${resp.status}`);
        }

        let rows: EntregaRow[];
        try {
          rows = JSON.parse(raw) as EntregaRow[];
        } catch (e) {
          console.error(
            "Resposta da API não é JSON válido. Início do corpo:",
            raw.slice(0, 200)
          );
          throw e;
        }

        const codigosValidos = new Set(CODIGOS_SER_FAMILIA);

        // só os produtos que interessam ao painel
        const registros = rows.filter(
          (r) =>
            r &&
            r.produto_codigo != null &&
            codigosValidos.has(Number(r.produto_codigo))
        );

        // anos disponíveis (vou deixar crescente pra aparecer 2019..2025 bonitinho)
        const anosSet = new Set<number>();
        for (const r of registros) {
          const ano = anoDaEntrega(r);
          if (ano) anosSet.add(ano);
        }
        const anos = Array.from(anosSet).sort((a, b) => a - b);

        // cidades
        const cidadesSet = new Set<string>();
        for (const r of registros) {
          if (r.local_nome) cidadesSet.add(r.local_nome.trim());
        }

        const codigosArray = Array.from(codigosValidos);

        // agregado geral por programa
        const agregGeralPorPrograma: Record<
          number,
          { quantidade: number; valor: number }
        > = {};
        for (const cod of codigosArray) {
          agregGeralPorPrograma[cod] = { quantidade: 0, valor: 0 };
        }

        const cidades: Cidade[] = [];

        // monta cidade x ano
        cidadesSet.forEach((cidade) => {
          anos.forEach((ano) => {
            const subset = registros.filter(
              (r) =>
                (r.local_nome ?? "").trim() === cidade &&
                anoDaEntrega(r) === ano
            );

            if (!subset.length) return;

            const programas: Programa[] = [];

            for (const cod of codigosArray) {
              const subsetProg = subset.filter(
                (r) => Number(r.produto_codigo) === cod
              );

              // se não tem nenhuma entrega desse produto pra cidade/ano, pula
              if (!subsetProg.length) continue;

              const quantidade = subsetProg.reduce(
                (acc, it) => acc + toNumber(it.entrega_quantidade),
                0
              );
              const valor = subsetProg.reduce(
                (acc, it) => acc + toNumber(it.entrega_valororgao),
                0
              );

              agregGeralPorPrograma[cod].quantidade += quantidade;
              agregGeralPorPrograma[cod].valor += valor;

              const meta = nomesPorCodigo[cod] ?? {
                nome: subsetProg[0]?.produto_nome ?? `Produto ${cod}`,
                icone: "",
              };

              programas.push({
                codProduto: cod,
                nome: meta.nome,
                icone: meta.icone,
                quantidade,
                valor,
              });
            }

            const quantidadeTotal = programas.reduce(
              (a, p) => a + p.quantidade,
              0
            );
            const valorTotal = programas.reduce((a, p) => a + p.valor, 0);

            cidades.push({
              cidade,
              ano,
              quantidade: quantidadeTotal,
              valor: valorTotal,
              programas,
            });
          });
        });

        // totais gerais
        const total = cidades.reduce((a, c) => a + c.quantidade, 0);
        const valor = cidades.reduce((a, c) => a + c.valor, 0);

        // agregado geral por programa (todos os anos / todas as cidades)
        const programas: Programa[] = codigosArray.map((cod) => {
          const meta = nomesPorCodigo[cod] ?? {
            nome: `Produto ${cod}`,
            icone: "",
          };
          return {
            codProduto: cod,
            nome: meta.nome,
            icone: meta.icone,
            quantidade: agregGeralPorPrograma[cod].quantidade,
            valor: agregGeralPorPrograma[cod].valor,
          };
        });

        const result: DadosSerFamilia = {
          total,
          valor,
          programas,
          cidades,
          anos,
        };

        cacheDados = result;
        if (!cancelled) setDados(result);
      } catch (err) {
        console.error("Erro ao carregar dados do Ser Família (API):", err);
        if (!cancelled) setDados(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { dados, loading };
}
