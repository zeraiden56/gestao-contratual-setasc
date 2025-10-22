import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export interface Aditivo {
  tipo?: string;
  numero?: string;
  dataAssinatura?: string;
  novaVigenciaFinal?: string;
  valorNovo?: number;
  observacoes?: string;
  processoProrrogacao?: string;
}

export interface Lote {
  numero?: string;
  item?: string;
  descricao?: string;
  unidade?: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
}

export interface Empenho {
  numero?: string;
  data?: string;
  dotacao?: string;
  valorEmpenhado?: number;
  valorLiquidado?: number;
  valorEstornado?: number;
  saldo?: number;
}

export interface Pagamento {
  data?: string;
  processo?: string;
  mesReferencia?: string;
  empenho?: string;
  valor?: number;
  observacoes?: string;
}

export interface Contrato {
  id: number;
  numero: string;
  sigadoc: string;
  contratada: string;
  tipo: string;
  objeto: string;
  unidade: string;
  valorTotal: number;
  aditivos: number;
  empenhado: number;
  liquidado: number;
  pago: number;
  restoEmpenhar: number;
  extornado: number;
  nomeAba?: string;
  gestor?: string;
  fiscal?: string;
  suplente?: string;
  dataInicio?: string;
  dataVencimento?: string;
  aditivosDetalhe?: Aditivo[];
  lotes?: Lote[];
  empenhos?: Empenho[];
  pagamentos?: Pagamento[];
  totais?: {
    lotes: number;
    empenhos: number;
    pagamentos: number;
    aditivos: number;
  };
}

export function useContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = "contratos_cache_v3";
  const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 horas

  useEffect(() => {
    async function carregar() {
      const cache = localStorage.getItem(CACHE_KEY);
      const cacheTime = localStorage.getItem(`${CACHE_KEY}_time`);

      // 🧠 Se o cache for recente, usa ele
      if (cache && cacheTime && Date.now() - Number(cacheTime) < CACHE_TIME) {
        console.log("⚡ Usando cache local de contratos");
        const parsed = JSON.parse(cache);
        setContratos(parsed);
        setLoading(false);
        return;
      }

      try {
        console.log("🟦 Carregando Excel completo...");
        const resp = await fetch("/controle_contratos_empenhos_setasc.xlsx");
        if (!resp.ok) throw new Error("Arquivo Excel não encontrado em /public");

        const blob = await resp.arrayBuffer();
        const wb = XLSX.read(blob, { type: "array" });
        console.log("📘 Abas encontradas:", wb.SheetNames.length);

        const excelParaData = (v: any): string => {
          if (!v) return "";
          if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().split("T")[0];
          if (typeof v === "number") {
            const base = new Date(1899, 11, 30);
            base.setDate(base.getDate() + v);
            return base.toISOString().split("T")[0];
          }
          if (typeof v === "string" && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v)) {
            const [d, m, a] = v.split("/");
            const ano = a.length === 2 ? "20" + a : a;
            return `${ano}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          return String(v);
        };

        const limparNumero = (v: any) => {
          if (v == null || v === "") return 0;
          return Number(v.toString().replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
        };

        const normalizar = (s?: string) =>
          (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\/\\]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

        // 🔹 Aba principal (resumo de contratos)
        const primeira = wb.SheetNames[0];
        const planilhaPrincipal = XLSX.utils.sheet_to_json<any>(wb.Sheets[primeira]);

        const contratosBase: Contrato[] = planilhaPrincipal.map((d: any, i: number) => ({
          id: i + 1,
          numero: String(d["Nº CONTRATO"] || "").trim(),
          sigadoc: String(d["Nº CONTRATO SIGADOC "] || d["Nº CONTRATO SIGADOC"] || "").trim(),
          contratada: String(d["CONTRATADA"] || "").trim(),
          tipo: String(d["TIPO DE CONTRATO "] || d["TIPO DE CONTRATO"] || "").trim(),
          objeto: String(d["OBJETO DO CONTRATO"] || "").trim(),
          unidade: String(d["UNIDADE ORÇAMENTÁRIA"] || "").trim(),
          valorTotal: limparNumero(d["VALOR TOTAL DO CONTRATO (A)"]),
          aditivos: limparNumero(d["VALOR TOTAL DOS ADITIVOS"]),
          empenhado: limparNumero(d["SALDO EMPENHADO 2025"]),
          liquidado: limparNumero(d["SALDO  UTILIZADO"]),
          pago: limparNumero(d["PAGO"]),
          restoEmpenhar: limparNumero(d["RESTO A  SER EMPENHADO"]),
          extornado: limparNumero(d["EXTORNADO"]),
          nomeAba: String(d["NOME ABA"] || "").trim(),
          gestor: String(d["Gestor"] || d["GESTOR"] || "").trim(),
          fiscal: String(d["Fiscal"] || d["FISCAL"] || "").trim(),
          suplente: String(d["Suplente"] || d["SUPLENTE"] || "").trim(),
          dataInicio: excelParaData(
            d["Data de Início"] ||
              d["Data Inicio"] ||
              d["DATA DE INÍCIO"] ||
              d["DATA INICIO"] ||
              d["Início"] ||
              d["Inicio"]
          ),
          dataVencimento: excelParaData(
            d["Data de Vencimento"] ||
              d["DATA DE VENCIMENTO"] ||
              d["Vencimento"] ||
              d["Término"] ||
              d["Termino"]
          ),
          aditivosDetalhe: [],
          lotes: [],
          empenhos: [],
          pagamentos: [],
          totais: { lotes: 0, empenhos: 0, pagamentos: 0, aditivos: 0 },
        }));

        console.log("📄 Total de contratos:", contratosBase.length);

        // 🔹 Processa TODAS as abas de detalhe
        wb.SheetNames.slice(1).forEach((nomeAba) => {
          const dados = XLSX.utils.sheet_to_json<any>(wb.Sheets[nomeAba], { header: 1 });
          if (!dados.length) return;

          const contrato = contratosBase.find(
            (c) => normalizar(c.nomeAba) === normalizar(nomeAba)
          );
          if (!contrato) return;

          const idxAditivos = dados.findIndex((r) => String(r[0] || "").includes("ADITIVOS"));
          const idxLotes = dados.findIndex((r) => String(r[0] || "").includes("LOTES"));
          const idxEmpenhos = dados.findIndex((r) => String(r[0] || "").includes("EMPENHOS"));
          const idxPagamentos = dados.findIndex((r) => String(r[0] || "").includes("PAGAMENTOS"));

          const pegarTabela = (ini: number, fim: number) => {
            const cab = (dados[ini] || []).map((c: any) => String(c || "").trim());
            return dados.slice(ini + 1, fim).map((r: any[]) => {
              const obj: Record<string, any> = {};
              cab.forEach((chave, i) => (obj[chave] = r[i]));
              return obj;
            });
          };

          const fimAditivos = idxLotes > 0 ? idxLotes : dados.length;
          const fimLotes = idxEmpenhos > 0 ? idxEmpenhos : dados.length;
          const fimEmpenhos = idxPagamentos > 0 ? idxPagamentos : dados.length;

          if (idxAditivos >= 0) {
            contrato.aditivosDetalhe = pegarTabela(idxAditivos, fimAditivos);
            contrato.totais!.aditivos = contrato.aditivosDetalhe.length;
          }
          if (idxLotes >= 0) {
            contrato.lotes = pegarTabela(idxLotes, fimLotes);
            contrato.totais!.lotes = contrato.lotes.length;
          }
          if (idxEmpenhos >= 0) {
            contrato.empenhos = pegarTabela(idxEmpenhos, fimEmpenhos);
            contrato.totais!.empenhos = contrato.empenhos.length;
          }
          if (idxPagamentos >= 0) {
            contrato.pagamentos = pegarTabela(idxPagamentos, dados.length);
            contrato.totais!.pagamentos = contrato.pagamentos.length;
          }
        });

        console.log("✅ Contratos carregados:", contratosBase.length);

        // 🧩 Salva no cache local
        localStorage.setItem(CACHE_KEY, JSON.stringify(contratosBase));
        localStorage.setItem(`${CACHE_KEY}_time`, String(Date.now()));

        setContratos(contratosBase);
      } catch (err) {
        console.error("❌ Erro ao carregar contratos:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return { contratos, loading };
}
