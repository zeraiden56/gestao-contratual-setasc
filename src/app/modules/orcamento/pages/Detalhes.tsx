"use client";

import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "../../../components/ui/card";

export default function Detalhes() {
  const { id } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const anoQuery = params.get("ano");

  const [anoSelecionado, setAnoSelecionado] = useState(anoQuery || "2025");
  const [dados, setDados] = useState<any[]>([]);
  const [anos, setAnos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const response = await fetch("/orcamento_fiplan_setasc.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets["FIPLAN"];
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        const anosUnicos = Array.from(new Set(json.map((r) => String(r["Ano"] || "2025")))).sort();
        setAnos(anosUnicos);

        const filtrados = json.filter(
          (r) => String(r["UO"]).trim() === String(id) && String(r["Ano"] || "2025") === anoSelecionado
        );
        setDados(filtrados);
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id, anoSelecionado]);

  const fmt = (v: number) =>
    v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="p-8">Carregando...</div>;

  const totais = dados.reduce(
    (acc, d) => {
      acc.orcado += Number(d["Orçado Atual"]) || 0;
      acc.empenhado += Number(d["Empenhado"]) || 0;
      acc.liquidado += Number(d["Liquidado"]) || 0;
      acc.pago += Number(d["Pago"]) || 0;
      return acc;
    },
    { orcado: 0, empenhado: 0, liquidado: 0, pago: 0 }
  );

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-slate-800">
        Detalhamento da UO {id} - {anoSelecionado}
      </h1>

      <div className="flex gap-2 mb-6">
        {anos.map((a) => (
          <button
            key={a}
            onClick={() => setAnoSelecionado(a)}
            className={`px-3 py-1 rounded-full border ${
              anoSelecionado === a
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 hover:bg-blue-50 border-slate-300"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-blue-600 text-white p-4 rounded-2xl">
          <p className="text-sm">Orçado Atual</p>
          <p className="text-lg font-bold">{fmt(totais.orcado)}</p>
        </Card>
        <Card className="bg-yellow-500 text-white p-4 rounded-2xl">
          <p className="text-sm">Empenhado</p>
          <p className="text-lg font-bold">{fmt(totais.empenhado)}</p>
        </Card>
        <Card className="bg-orange-500 text-white p-4 rounded-2xl">
          <p className="text-sm">Liquidado</p>
          <p className="text-lg font-bold">{fmt(totais.liquidado)}</p>
        </Card>
        <Card className="bg-green-600 text-white p-4 rounded-2xl">
          <p className="text-sm">Pago</p>
          <p className="text-lg font-bold">{fmt(totais.pago)}</p>
        </Card>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-200 text-slate-700">
            <tr>
              {Object.keys(dados[0] || {}).map((col) => (
                <th key={col} className="px-3 py-2 text-left">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((linha, i) => (
              <tr key={i} className="border-b hover:bg-blue-50">
                {Object.keys(linha).map((k) => (
                  <td key={k} className="px-3 py-2 whitespace-nowrap">
                    {linha[k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
