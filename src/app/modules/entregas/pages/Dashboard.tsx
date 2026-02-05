// src/app/modules/entregas/pages/Dashboard.tsx
"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntregas } from "../hooks/useEntregas";
import { Filters } from "../components/Filters";
import KPICard from "../components/KPICard";
import { Mapa } from "../components/Mapa";
import {
  Search,
  TrendingUp,
  Package,
  MapPin,
  Filter as FilterIcon,
  ArrowUpDown,
} from "lucide-react";

/**
 * Este dashboard usa apenas a API já exposta pelo teu hook:
 *   useEntregas({ chunkSize, groupBy })
 *   -> anos, cidades, getProgramas({ ano, cidade }) => { items, totalValor, totalQtd, totalReg }
 *
 * A tabela é construída com base em "programas" (agregado) para manter compatibilidade
 * sem precisar do dataset detalhado.
 */

type OrderBy = "valor" | "qtd" | "nome";
type OrderDir = "desc" | "asc";

export default function EntregasDashboard() {
  // para bases grandes, use chunkSize: 1000 ou 2000
  const { loading, error, anos, cidades, getProgramas } = useEntregas({
    chunkSize: 0,
    // agrupa os cards por tipo de produto (ajuste se quiser outra visão)
    groupBy: "produto_tipo",
  });

  const [ano, setAno] = useState<number | undefined>(undefined);
  const [cidade, setCidade] = useState<string>("");

  // busca rápida: filtra client-side o nome do programa
  const [q, setQ] = useState("");

  // ordenação da tabela-resumo
  const [orderBy, setOrderBy] = useState<OrderBy>("valor");
  const [orderDir, setOrderDir] = useState<OrderDir>("desc");

  // agrega conforme filtros ano/cidade
  const { items: baseProgramas, totalValor, totalQtd, totalReg } = useMemo(
    () => getProgramas({ ano, cidade }),
    [getProgramas, ano, cidade]
  );

  // aplica busca e ordenação no agregado
  const programas = useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = baseProgramas.filter((p) =>
      term ? (p.nome ?? "").toLowerCase().includes(term) : true
    );

    arr.sort((a, b) => {
      if (orderBy === "valor") {
        const d = (a.valor ?? 0) - (b.valor ?? 0);
        return orderDir === "asc" ? d : -d;
      }
      if (orderBy === "qtd") {
        const d = (a.qtd ?? 0) - (b.qtd ?? 0);
        return orderDir === "asc" ? d : -d;
      }
      // nome
      const d = String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
      return orderDir === "asc" ? d : -d;
    });

    return arr;
  }, [baseProgramas, q, orderBy, orderDir]);

  const navigate = useNavigate();

  const goDetails = (programaNome: string) => {
    navigate(
      `/entregas/detalhes?programa=${encodeURIComponent(programaNome)}${
        ano ? `&ano=${ano}` : ""
      }${cidade ? `&cidade=${encodeURIComponent(cidade)}` : ""}`
    );
  };

  const toggleOrder = (key: OrderBy) => {
    setOrderBy((prev) => {
      if (prev !== key) return key;
      // se clicar na mesma coluna, alterna direção
      setOrderDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
    if (orderBy !== key) setOrderDir("desc");
  };

  return (
    <div className="relative min-h-screen">
      {/* Fundo com brasão e overlay ~90% */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(248,250,252,0.9), rgba(248,250,252,0.9)), url('/brasao-estado-mt.jpeg')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "contain",
          backgroundAttachment: "fixed",
        }}
      />

      <div className="p-6 md:p-8 space-y-8">
        {/* Topo */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Package className="text-blue-700" />
            <h1 className="text-3xl font-extrabold text-[#1f3a8a]">
              Entregas
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {loading && <span>carregando…</span>}
            {error && <span className="text-red-600">Erro: {error}</span>}
          </div>
        </div>

        {/* Barra de filtros + busca rápida */}
        <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 md:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex items-center gap-2 text-gray-700">
              <FilterIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
            </div>

            <div className="flex-1">
              <Filters
                ano={ano ?? 0}
                setAno={(v) => setAno(v || undefined)}
                cidade={cidade}
                setCidade={setCidade}
                cidades={cidades}
                anos={anos}
              />
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por programa…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white shadow-sm placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const top = programas[0]?.nome;
                    if (top) goDetails(top);
                  }
                }}
              />
            </div>
          </div>

          {/* Legenda rápida */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {totalReg.toLocaleString("pt-BR")} registros
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> {totalQtd.toLocaleString("pt-BR")} itens
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {cidades.length.toLocaleString("pt-BR")} municípios
            </span>
          </div>
        </div>

        {/* Cards + Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <KPICard
            title="Registros"
            value={totalReg.toLocaleString("pt-BR")}
            color="bg-blue-600 text-white"
          />
          <KPICard
            title="Valor Total"
            value={`R$ ${totalValor.toLocaleString("pt-BR")}`}
            color="bg-green-600 text-white"
          />
          <KPICard
            title="Qtde Total"
            value={totalQtd.toLocaleString("pt-BR")}
            color="bg-indigo-600 text-white"
          />
          <div className="min-h-[116px] rounded-2xl border bg-white/80 backdrop-blur p-2">
            <Mapa cidadeSelecionada={cidade} onSelectCidade={setCidade} />
          </div>
        </div>

        {/* Top Programas (cards compactos com progress bar) */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Top Programas por Valor
          </h2>
          <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm">
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {programas.slice(0, 6).map((p) => {
                const share = totalValor > 0 ? (p.valor / totalValor) * 100 : 0;
                return (
                  <li
                    key={p.nome}
                    className="p-4 rounded-xl border hover:border-blue-300 transition cursor-pointer bg-white/70"
                    onClick={() => goDetails(p.nome)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-medium text-gray-800 truncate">
                        {p.nome}
                      </div>
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        R$ {p.valor.toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${Math.min(100, share)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {p.qtd.toLocaleString("pt-BR")} entregas • {share.toFixed(1)}%
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Tabela-resumo (responsiva, sticky head, ordenável, linha clicável) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Programas</h2>
            <button
              onClick={() => toggleOrder(orderBy)}
              className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
              title="Alternar ordenação"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              ordenar por <b className="ml-1">{orderBy}</b> ({orderDir})
            </button>
          </div>

          <div className="rounded-2xl border shadow-sm overflow-hidden bg-white/80 backdrop-blur">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col style={{ width: "60%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead className="bg-slate-50/80 text-slate-700 sticky top-0 z-10">
                  <tr>
                    <ThBtn
                      active={orderBy === "nome"}
                      dir={orderDir}
                      onClick={() => toggleOrder("nome")}
                    >
                      Programa
                    </ThBtn>
                    <ThBtn
                      className="text-right"
                      active={orderBy === "qtd"}
                      dir={orderDir}
                      onClick={() => toggleOrder("qtd")}
                    >
                      Qtde
                    </ThBtn>
                    <ThBtn
                      className="text-right"
                      active={orderBy === "valor"}
                      dir={orderDir}
                      onClick={() => toggleOrder("valor")}
                    >
                      Valor (R$)
                    </ThBtn>
                  </tr>
                </thead>
                <tbody>
                  {programas.map((p, idx) => {
                    const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/60";
                    return (
                      <tr
                        key={p.nome}
                        onClick={() => goDetails(p.nome)}
                        className={`${rowBg} border-t hover:bg-blue-50/40 cursor-pointer transition-colors`}
                      >
                        <Td className="h-12 align-middle">
                          <div className="truncate">{p.nome}</div>
                        </Td>
                        <Td className="h-12 align-middle text-right tabular-nums">
                          {p.qtd.toLocaleString("pt-BR")}
                        </Td>
                        <Td className="h-12 align-middle text-right tabular-nums">
                          {p.valor.toLocaleString("pt-BR")}
                        </Td>
                      </tr>
                    );
                  })}
                  {programas.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={3}>
                        Nada encontrado para os filtros/busca atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- helpers de UI ---------- */

function ThBtn({
  children,
  className = "",
  active,
  dir,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  dir?: "asc" | "desc";
  onClick?: () => void;
}) {
  return (
    <th className={`px-4 py-3 font-semibold ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 ${
          active ? "text-blue-700" : "text-slate-700"
        }`}
      >
        <span className="truncate">{children}</span>
        <ArrowUpDown className="w-3.5 h-3.5" />
        {active && (
          <span className="text-xs opacity-60">({dir})</span>
        )}
      </button>
    </th>
  );
}
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 ${className}`}>{children}</td>;
}
