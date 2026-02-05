"use client";

import { useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "../../../components/ui/card";

/** Formata número/strings como moeda BRL */
const fmtBRL = (v: any) => {
  if (v === null || v === undefined) return "—";
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\./g, "").replace(",", "."));
  if (isNaN(n)) return String(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function Detalhes() {
  const { id } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const anoQuery = params.get("ano");

  const [anoSelecionado, setAnoSelecionado] = useState(anoQuery || "2025");
  const [dados, setDados] = useState<any[]>([]);
  const [anos, setAnos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const response = await fetch("/orcamento_fiplan_setasc.xlsx");
        if (!response.ok) throw new Error("Arquivo .xlsx não encontrado");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets["FIPLAN"];
        if (!sheet) throw new Error("Aba 'FIPLAN' não encontrada");

        const json = XLSX.utils.sheet_to_json<any>(sheet);

        // anos únicos
        const anosUnicos = Array.from(
          new Set(json.map((r) => String(r["Ano"] ?? "2025")))
        ).sort();
        if (ativo) setAnos(anosUnicos);

        // filtro pela UO e ano
        const filtrados = json.filter(
          (r) =>
            String(r["UO"]).trim() === String(id) &&
            String(r["Ano"] ?? "2025") === String(anoSelecionado)
        );
        if (ativo) setDados(filtrados);
      } catch (err: any) {
        console.error("Erro ao carregar:", err);
        if (ativo) setErro(err?.message || "Falha ao carregar dados");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [id, anoSelecionado]);

  // Totais principais (robustos para string/number)
  const totais = useMemo(() => {
    const toNum = (v: any) =>
      typeof v === "number"
        ? v
        : Number(String(v ?? 0).replace(/\./g, "").replace(",", "."));
    return dados.reduce(
      (acc, d) => {
        acc.orcado += toNum(d["Orçado Atual"]);
        acc.empenhado += toNum(d["Empenhado"]);
        acc.liquidado += toNum(d["Liquidado"]);
        acc.pago += toNum(d["Pago"]);
        return acc;
      },
      { orcado: 0, empenhado: 0, liquidado: 0, pago: 0 }
    );
  }, [dados]);

  // Colunas que devem ser tratadas como valores monetários
  const colunasMoeda = useMemo(
    () =>
      [
        "Orçado Inicial",
        "Orçado Atual",
        "Bloqueado Créditos",
        "Contingenciado",
        "Indisponível",
        "PED",
        "Empenhado",
        "Liquidado",
        "Pago",
        "Destaque",
        "Saldo com Destaque",
      ].map((c) => c.toLowerCase()),
    []
  );

  const headers = Object.keys(dados[0] || {});

  if (loading)
    return (
      <div className="p-8 flex justify-center items-center min-h-screen text-slate-600">
        Carregando...
      </div>
    );

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-white"
      style={{
        backgroundImage: "url('/brasao-estado-mt.jpeg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay translúcido (mesmo padrão dos outros módulos) */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-white/95 to-white pointer-events-none" />

      {/* Conteúdo */}
      <div className="relative z-10 p-8">
        <h1 className="text-3xl font-bold mb-4 text-slate-800">
          Detalhamento da UO {id} — {anoSelecionado}
        </h1>

        {/* Botões de ano */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {anos.map((a) => (
            <button
              key={a}
              onClick={() => setAnoSelecionado(a)}
              className={`px-3 py-1 rounded-full border transition-all ${
                anoSelecionado === a
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-blue-50 border-slate-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-blue-600 text-white p-4 rounded-2xl shadow-md">
            <p className="text-sm opacity-90">Orçado Atual</p>
            <p className="text-lg font-bold">{fmtBRL(totais.orcado)}</p>
          </Card>
          <Card className="bg-yellow-500 text-white p-4 rounded-2xl shadow-md">
            <p className="text-sm opacity-90">Empenhado</p>
            <p className="text-lg font-bold">{fmtBRL(totais.empenhado)}</p>
          </Card>
          <Card className="bg-orange-500 text-white p-4 rounded-2xl shadow-md">
            <p className="text-sm opacity-90">Liquidado</p>
            <p className="text-lg font-bold">{fmtBRL(totais.liquidado)}</p>
          </Card>
          <Card className="bg-green-600 text-white p-4 rounded-2xl shadow-md">
            <p className="text-sm opacity-90">Pago</p>
            <p className="text-lg font-bold">{fmtBRL(totais.pago)}</p>
          </Card>
        </div>

        {/* Erro / Nenhum dado */}
        {erro && (
          <div className="mb-6 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700">
            {erro}
          </div>
        )}
        {!erro && dados.length === 0 && (
          <div className="mb-6 p-3 rounded-lg border border-slate-200 bg-white/80 text-slate-600">
            Nenhum registro encontrado para este ano/UO.
          </div>
        )}

        {/* Tabela detalhada */}
        {dados.length > 0 && (
          <div className="overflow-x-auto bg-white/90 backdrop-blur-sm shadow rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100/90 text-slate-700 sticky top-0 z-10">
                <tr>
                  {headers.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b border-slate-200"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((linha, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-100 ${
                      i % 2 ? "bg-slate-50/50" : "bg-white/0"
                    } hover:bg-blue-50/50 transition`}
                  >
                    {headers.map((k) => {
                      const deveMoeda = colunasMoeda.includes(k.toLowerCase());
                      const valor = linha[k];
                      return (
                        <td
                          key={k}
                          className={`px-3 py-2 whitespace-nowrap ${
                            deveMoeda ? "text-right font-medium" : ""
                          }`}
                        >
                          {deveMoeda ? fmtBRL(valor) : String(valor ?? "—")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
