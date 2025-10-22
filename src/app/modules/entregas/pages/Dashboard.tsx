"use client";

import * as XLSX from "xlsx";
import { useEffect, useMemo, useState } from "react";
import { Filters } from "../components/Filters";
import KPICard from "../components/KPICard";
import { Mapa } from "../components/Mapa";
import { useNavigate } from "react-router-dom";

interface Linha {
  Programa: string;
  Municipio: string;
  Ano: number;
  Valor: number;
  Quantidade: number;
}

export default function DashboardEntregas() {
  const [dados, setDados] = useState<Linha[]>([]);
  const [ano, setAno] = useState(2024);
  const [cidade, setCidade] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function carregar() {
      const res = await fetch("/entregas_setasc_nger.xlsx");
      const buf = await res.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Linha>(sheet);
      setDados(json);
    }
    carregar();
  }, []);

  const cidades = useMemo(
    () => Array.from(new Set(dados.map((d) => d.Municipio))).sort(),
    [dados]
  );

  const programas = useMemo(() => {
    let filtrados = dados.filter((d) => d.Ano === ano);
    if (cidade) filtrados = filtrados.filter((d) => d.Municipio === cidade);

    const agrupado = filtrados.reduce<Record<string, { valor: number; qtd: number }>>(
      (acc, d) => {
        if (!acc[d.Programa]) acc[d.Programa] = { valor: 0, qtd: 0 };
        acc[d.Programa].valor += d.Valor || 0;
        acc[d.Programa].qtd += d.Quantidade || 0;
        return acc;
      },
      {}
    );

    return Object.entries(agrupado).map(([nome, { valor, qtd }]) => ({
      nome,
      valor,
      qtd,
    }));
  }, [dados, ano, cidade]);

  const totalValor = programas.reduce((sum, p) => sum + p.valor, 0);
  const totalQtd = programas.reduce((sum, p) => sum + p.qtd, 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">📦 Entregas e Programas</h1>

      <Filters ano={ano} setAno={setAno} cidade={cidade} setCidade={setCidade} cidades={cidades} />

      <div className="flex flex-wrap justify-between items-center gap-4">
        <KPICard title="Total de Entregas" value={totalQtd.toLocaleString("pt-BR")} color="bg-blue-700 text-white" />
        <KPICard title="Valor Total Investido" value={`R$ ${totalValor.toLocaleString("pt-BR")}`} color="bg-green-700 text-white" />
        <div className="flex-1 max-w-sm">
          <Mapa cidadeSelecionada={cidade} onSelectCidade={setCidade} />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-700 mt-8">Programas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {programas.map((p) => (
          <div
            key={p.nome}
            className="cursor-pointer transition transform hover:scale-[1.02]"
            onClick={() =>
              navigate(`/entregas/detalhes?programa=${encodeURIComponent(p.nome)}`)
            }
          >
            <KPICard
              title={p.nome}
              value={`${p.qtd.toLocaleString("pt-BR")} entregas`}
              subtitle={`R$ ${p.valor.toLocaleString("pt-BR")}`}
              color="bg-white text-gray-800 border"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
