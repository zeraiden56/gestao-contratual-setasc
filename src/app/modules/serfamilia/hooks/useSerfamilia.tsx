import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

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
  total: number;
  valor: number;
  programas: Programa[];
  cidades: Cidade[];
  anos: number[];
}

const nomesPorCodigo: Record<number, { nome: string; icone: string }> = {
  1054: {
    nome: "SER FAMÍLIA CRIANÇA",
    icone: "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Crian%C3%A7a.png",
  },
  1055: {
    nome: "SER FAMÍLIA IDOSO",
    icone: "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Idoso.png",
  },
  1056: {
    nome: "SER FAMÍLIA INCLUSIVO",
    icone: "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Inclusivo.png",
  },
  1057: {
    nome: "SER FAMÍLIA INDÍGENA",
    icone: "",
  },
  1058: {
    nome: "SER FAMÍLIA",
    icone: "",
  },
};

let cacheDados: DadosSerFamilia | null = null;

export function useSerfamilia() {
  const [dados, setDados] = useState<DadosSerFamilia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (cacheDados) {
        setDados(cacheDados);
        setLoading(false);
        return;
      }

      try {
        const resp = await fetch("/entregas_setasc_nger.xlsx");
        const blob = await resp.arrayBuffer();
        const wb = XLSX.read(blob, { type: "array" });
        const planilha = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]]);

        const limparNumero = (v: any) => {
          if (!v) return 0;
          return Number(v.toString().replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
        };

        const registros = planilha.filter((r) => {
          const cod = Number(r["CodProduto"] || r["AE"]);
          return cod >= 1054 && cod <= 1058;
        });

        const anos = Array.from(
          new Set(registros.map((r) => Number(r["Ano conclusão"] || r["R"])))
        ).sort((a, b) => b - a);

        const cidadesPorAno: Cidade[] = [];
        const cidadesSet = new Set(registros.map((r) => String(r["Local"] || "").trim()));

        cidadesSet.forEach((cidade) => {
          anos.forEach((ano) => {
            const dadosCidadeAno = registros.filter(
              (r) =>
                String(r["Local"] || "").trim() === cidade &&
                Number(r["Ano conclusão"] || r["R"]) === ano
            );

            const programas: Programa[] = Object.keys(nomesPorCodigo).map((cod) => {
              const codNum = Number(cod);
              const subset = dadosCidadeAno.filter(
                (r) => Number(r["CodProduto"] || r["AE"]) === codNum
              );
              const quantidade = subset.reduce(
                (s, r) => s + limparNumero(r["Qtde"] || r["F"]),
                0
              );
              const valor = subset.reduce(
                (s, r) => s + limparNumero(r["R$ - Órgão"] || r["L"]),
                0
              );
              return {
                codProduto: codNum,
                nome: nomesPorCodigo[codNum].nome,
                icone: nomesPorCodigo[codNum].icone,
                quantidade,
                valor,
              };
            });

            const quantidade = programas.reduce((a, p) => a + p.quantidade, 0);
            const valor = programas.reduce((a, p) => a + p.valor, 0);

            cidadesPorAno.push({ cidade, ano, quantidade, valor, programas });
          });
        });

        const total = cidadesPorAno.reduce((a, c) => a + c.quantidade, 0);
        const valor = cidadesPorAno.reduce((a, c) => a + c.valor, 0);
        const programas = Object.values(nomesPorCodigo).map((p, i) => ({
          codProduto: 1054 + i,
          nome: p.nome,
          quantidade: 0,
          valor: 0,
          icone: p.icone,
        }));

        const resultado = { total, valor, programas, cidades: cidadesPorAno, anos };
        cacheDados = resultado;
        setDados(resultado);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return { dados, loading };
}
