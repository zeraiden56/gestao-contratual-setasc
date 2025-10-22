"use client";

import { useEffect, useState, useMemo } from "react";
import { useSerfamilia } from "../hooks/useSerfamilia";
import { useIBGE } from "../hooks/useIBGE";
import { Mapa } from "../components/Mapa";

interface Bandeira {
  cidade: string;
  url: string;
}

export default function SerfamiliaDashboard() {
  const [cidade, setCidade] = useState("");
  const [ano, setAno] = useState<number>(2025);
  const [bandeiras, setBandeiras] = useState<Bandeira[]>([]);
  const { dados, loading } = useSerfamilia(ano);
  const { dados: ibge, loading: loadingIBGE } = useIBGE(cidade);

  useEffect(() => {
    fetch("/bandeiras_mt.json")
      .then((res) => res.json())
      .then(setBandeiras)
      .catch(console.error);
  }, []);

  const bandeiraSrc = useMemo(() => {
    if (!cidade) return "/bandeiras/mt.png";
    const b = bandeiras.find(
      (b) => b.cidade.toLowerCase() === cidade.toLowerCase()
    );
    return b?.url || "/bandeiras/mt.png";
  }, [cidade, bandeiras]);

  const [bandeiraErro, setBandeiraErro] = useState(false);

  if (loading || !dados)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-700">
        Carregando SER Família...
      </div>
    );

  const cidades = [...new Set(dados.cidades.map((c) => c.cidade))].sort(
    (a, b) => a.localeCompare(b, "pt-BR")
  );

  const anos = [...new Set(dados.cidades.map((c) => c.ano))]
    .filter(Boolean)
    .sort((a, b) => b - a);

  const cidadeDados =
    cidade && cidade !== "Mato Grosso"
      ? dados.cidades.find((c) => c.cidade === cidade && c.ano === ano)
      : null;

  const totalCartoes = cidadeDados
    ? cidadeDados.quantidade
    : dados.cidades
        .filter((c) => c.ano === ano)
        .reduce((a, c) => a + c.quantidade, 0);

  const totalValor = cidadeDados
    ? cidadeDados.valor
    : dados.cidades
        .filter((c) => c.ano === ano)
        .reduce((a, c) => a + c.valor, 0);

  const programas = cidadeDados
    ? cidadeDados.programas
    : (() => {
        const progAgg: Record<number, any> = {};
        dados.cidades
          .filter((c) => c.ano === ano)
          .forEach((c) =>
            c.programas.forEach((p) => {
              if (!progAgg[p.codProduto]) {
                progAgg[p.codProduto] = { ...p, quantidade: 0, valor: 0 };
              }
              progAgg[p.codProduto].quantidade += p.quantidade;
              progAgg[p.codProduto].valor += p.valor;
            })
          );
        return Object.values(progAgg);
      })();

  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
  );

  const formatarMoeda = (v: number) =>
    v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  const formatarNumero = (v: number) => (v ? v.toLocaleString("pt-BR") : "—");

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800 space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-6 bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1 block">
            Município
          </label>
          <select
            className="border rounded px-3 py-2 w-64 shadow-sm focus:ring focus:ring-blue-200"
            value={cidade}
            onChange={(e) => {
              setCidade(e.target.value);
              setBandeiraErro(false);
            }}
          >
            <option value="">Mato Grosso</option>
            {cidades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1 block">
            Ano
          </label>
          <select
            className="border rounded px-3 py-2 w-40 shadow-sm focus:ring focus:ring-blue-200"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="flex justify-between items-start bg-white p-8 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-4">
            {!bandeiraErro && (
              <img
                src={bandeiraSrc}
                alt={`Bandeira de ${cidade || "Mato Grosso"}`}
                className="w-20 h-14 border rounded object-contain transition-opacity duration-200"
                loading="lazy"
                onError={() => setBandeiraErro(true)}
              />
            )}
            <h1 className="text-4xl font-bold text-gray-800">
              {cidade || "Mato Grosso"}
            </h1>
          </div>

          {/* Dados IBGE */}
          {cidade && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              {[
                { label: "População", value: ibge?.populacao, tipo: "num" },
                { label: "PIB", value: ibge?.pib, tipo: "moeda" },
                { label: "Renda per capita", value: ibge?.renda, tipo: "moeda" },
                { label: "CadÚnico", value: ibge?.cadunico, tipo: "num" },
                { label: "Urbanização (%)", value: ibge?.urbanizacao, tipo: "num" },
                { label: "Densidade (hab/km²)", value: ibge?.densidade, tipo: "num" },
              ].map((d) => (
                <div
                  key={d.label}
                  className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center hover:bg-blue-100/60 transition-colors"
                >
                  <span className="block font-semibold text-blue-800 mb-1">
                    {d.label}
                  </span>
                  {loadingIBGE ? (
                    <Spinner />
                  ) : d.tipo === "moeda" ? (
                    <span>{formatarMoeda(d.value || 0)}</span>
                  ) : (
                    <span>{formatarNumero(d.value || 0)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Mapa
          dados={dados}
          cidadeSelecionada={cidade}
          onSelectCidade={setCidade}
        />
      </div>

      {/* Cards inferiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-gray-700 text-sm font-semibold">
            Cartões entregues
          </h2>
          <p className="text-4xl font-bold text-gray-900 mt-1">
            {totalCartoes.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-gray-700 text-sm font-semibold">
            Valor investido
          </h2>
          <p className="text-4xl font-bold text-gray-900 mt-1">
            {formatarMoeda(totalValor)}
          </p>
        </div>
      </div>

      {/* Programas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {programas.map((p) => (
          <div
            key={`${p.codProduto}-${p.nome}`}
            className="bg-white p-4 rounded-lg border shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <img
              src={
                p.nome.includes("CRIANÇA")
                  ? "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Crian%C3%A7a.png"
                  : p.nome.includes("IDOSO")
                  ? "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Idoso.png"
                  : p.nome.includes("INCLUSIVO")
                  ? "https://www.setasc.mt.gov.br/documents/364148/0/SER+Familia+Inclusivo.png"
                  : "/bandeiras/mt.png"
              }
              alt={p.nome}
              className="h-12 mx-auto mb-2 object-contain"
              loading="lazy"
            />
            <h3 className="text-gray-800 font-semibold text-sm uppercase">
              {p.nome}
            </h3>
            <p className="text-2xl font-bold mt-1">
              {p.quantidade.toLocaleString("pt-BR")}
            </p>
            <p className="text-green-600 font-semibold text-sm">
              {formatarMoeda(p.valor)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
