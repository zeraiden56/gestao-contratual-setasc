"use client";

import * as XLSX from "xlsx";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import KPICard from "../components/KPICard";
import { Filters } from "../components/Filters";
import { Mapa } from "../components/Mapa";

interface Linha {
  Programa: string;
  Municipio: string;
  Ano: number;
  Valor: number;
  Quantidade: number;
}

export default function DetalhesPrograma() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const nomePrograma = decodeURIComponent(params.get("programa") || "");

  const [dados, setDados] = useState<Linha[]>([]);
  const [ano, setAno] = useState(2024);
  const [cidade, setCidade] = useState("");

  useEffect(() => {
    async function carregar() {
      const res = await fetch("/entregas_setasc_nger.xlsx");
      const buf = await res.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Linha>(sheet);
      setDados(json.filter((r) => r.Programa === nomePrograma));
    }
    carregar();
  }, [nomePrograma]);

  const cidades = useMemo(
    () => Array.from(new Set(dados.map((d) => d.Municipio))).sort(),
    [dados]
  );

  const filtrados = useMemo(() => {
    let arr = dados.filter((d) => d.Ano === ano);
    if (cidade) arr = arr.filter((d) => d.Municipio === cidade);
    return arr;
  }, [dados, ano, cidade]);

  const totalValor = filtrados.reduce((sum, d) => sum + (d.Valor || 0), 0);
  const totalQtd = filtrados.reduce((sum, d) => sum + (d.Quantidade || 0), 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">
        📊 Detalhes do Programa: {nomePrograma}
      </h1>

      <Filters ano={ano} setAno={setAno} cidade={cidade} setCidade={setCidade} cidades={cidades} />

      <div className="flex flex-wrap justify-between items-center gap-4">
        <KPICard title="Total de Entregas" value={totalQtd.toLocaleString("pt-BR")} color="bg-blue-700 text-white" />
        <KPICard title="Valor Total" value={`R$ ${totalValor.toLocaleString("pt-BR")}`} color="bg-green-700 text-white" />
        <div className="flex-1 max-w-sm">
          <Mapa cidadeSelecionada={cidade} onSelectCidade={setCidade} />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mt-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 text-left">Município</th>
              <th className="p-2 text-right">Ano</th>
              <th className="p-2 text-right">Entregas</th>
              <th className="p-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((f, i) => (
              <tr key={i} className="border-b hover:bg-slate-50">
                <td className="p-2">{f.Municipio}</td>
                <td className="p-2 text-right">{f.Ano}</td>
                <td className="p-2 text-right">{f.Quantidade.toLocaleString("pt-BR")}</td>
                <td className="p-2 text-right">R$ {f.Valor.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filtrados.length && (
        <p className="text-center text-slate-500 mt-6">
          Nenhum registro encontrado para os filtros selecionados.
        </p>
      )}
    </div>
  );
}
