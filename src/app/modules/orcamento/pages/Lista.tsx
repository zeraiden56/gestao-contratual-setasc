"use client";

import { useOrcamentoLocal } from "../hooks/useOrcamentoLocal";

/** formata valores em BRL, aceitando number ou string com . e , */
const fmtBRL = (v: any) => {
  if (v === null || v === undefined) return "—";
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\./g, "").replace(",", "."));
  if (isNaN(n)) return String(v ?? "—");
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function Lista() {
  const { dados, loading } = useOrcamentoLocal();

  // totais
  const totais = dados.reduce(
    (acc, d) => {
      const toNum = (x: any) =>
        typeof x === "number"
          ? x
          : Number(String(x ?? 0).replace(/\./g, "").replace(",", "."));
      acc.inicial += toNum(d.orcado_inicial);
      acc.atual += toNum(d.orcado_atual);
      acc.emp += toNum(d.empenhado);
      acc.liq += toNum(d.liquidado);
      acc.pago += toNum(d.pago);
      acc.livre += toNum(d.livre);
      return acc;
    },
    { inicial: 0, atual: 0, emp: 0, liq: 0, pago: 0, livre: 0 }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 bg-white">
        Carregando...
      </div>
    );
  }

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
      {/* overlay translúcido igual aos outros módulos */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-white/95 to-white pointer-events-none" />

      <div className="relative z-10 p-6">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">
          Tabela Orçamentária
        </h1>

        {/* tabela */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow">
          {dados.length === 0 ? (
            <div className="p-6 text-slate-500">Nenhum registro encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100/90 text-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="p-2 text-left">UO</th>
                  <th className="p-2 text-left">Sigla</th>
                  <th className="p-2 text-right">Orçado Inicial</th>
                  <th className="p-2 text-right">Orçado Atual</th>
                  <th className="p-2 text-right">Empenhado</th>
                  <th className="p-2 text-right">Liquidado</th>
                  <th className="p-2 text-right">Pago</th>
                  <th className="p-2 text-right">Livre</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((d) => (
                  <tr
                    key={`${d.UO}-${d.SIGLA}`}
                    className="border-b border-slate-100 hover:bg-blue-50/50 transition"
                  >
                    <td className="p-2">{d.UO}</td>
                    <td className="p-2">{d.SIGLA}</td>
                    <td className="p-2 text-right">{fmtBRL(d.orcado_inicial)}</td>
                    <td className="p-2 text-right">{fmtBRL(d.orcado_atual)}</td>
                    <td className="p-2 text-right">{fmtBRL(d.empenhado)}</td>
                    <td className="p-2 text-right">{fmtBRL(d.liquidado)}</td>
                    <td className="p-2 text-right">{fmtBRL(d.pago)}</td>
                    <td className="p-2 text-right">{fmtBRL(d.livre)}</td>
                  </tr>
                ))}

                {/* linha de totais */}
                <tr className="bg-blue-50 font-semibold">
                  <td className="p-2" colSpan={2}>
                    Totais
                  </td>
                  <td className="p-2 text-right">{fmtBRL(totais.inicial)}</td>
                  <td className="p-2 text-right">{fmtBRL(totais.atual)}</td>
                  <td className="p-2 text-right">{fmtBRL(totais.emp)}</td>
                  <td className="p-2 text-right">{fmtBRL(totais.liq)}</td>
                  <td className="p-2 text-right">{fmtBRL(totais.pago)}</td>
                  <td className="p-2 text-right">{fmtBRL(totais.livre)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
