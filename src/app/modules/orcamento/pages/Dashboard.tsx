"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrcamentoLocal, Despesa } from "../hooks/useOrcamentoLocal";
import CardOrcamento from "../components/CardOrcamento";
import BuscaInteligente from "../components/BuscaInteligente";

export default function Dashboard() {
  const navigate = useNavigate();
  const { dados, loading, anos, anoSelecionado, setAnoSelecionado } = useOrcamentoLocal();
  const [busca, setBusca] = useState("");

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const UOS_PERMITIDAS = ["22101", "22603", "22605", "22607", "22608"];
  const NOMES_UO: Record<string, string> = {
    "22101": "SETASC",
    "22603": "FIAMT",
    "22605": "FEAT",
    "22607": "FEAS",
    "22608": "FUNDECON",
  };

  // Filtra os dados pelo ano selecionado
  const dadosFiltrados = useMemo(
    () => dados.filter((d) => d.Ano === anoSelecionado),
    [dados, anoSelecionado]
  );

  // Agrega por unidade
  const unidades = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nome: string;
        codigo: string;
        inicial: number;
        orcado: number;
        empenhado: number;
        liquidado: number;
        pago: number;
        livre: number;
      }
    >();

    dadosFiltrados.forEach((d: Despesa) => {
      const codigo = String(d.UO || "").trim();
      if (!UOS_PERMITIDAS.includes(codigo)) return;

      const nome = NOMES_UO[codigo] || codigo;
      const reg =
        mapa.get(codigo) || {
          nome,
          codigo,
          inicial: 0,
          orcado: 0,
          empenhado: 0,
          liquidado: 0,
          pago: 0,
          livre: 0,
        };

      reg.inicial += d.orcado_inicial;
      reg.orcado += d.orcado_atual;
      reg.empenhado += d.empenhado;
      reg.liquidado += d.liquidado;
      reg.pago += d.pago;
      reg.livre += d.livre;

      mapa.set(codigo, reg);
    });

    return Array.from(mapa.values());
  }, [dadosFiltrados]);

  // Totais gerais
  const totais = useMemo(() => {
    const sum = (campo: keyof (typeof unidades)[0]) =>
      unidades.reduce((a, b) => a + ((b[campo] as number) || 0), 0);

    const inicial = sum("inicial");
    const orcado = sum("orcado");
    const empenhado = sum("empenhado");
    const liquidado = sum("liquidado");
    const pago = sum("pago");
    const livre = sum("livre");

    const empenhadoNaoLiq = Math.max(empenhado - liquidado, 0);
    const pctEmp = orcado ? (empenhado / orcado) * 100 : 0;
    const pctLiq = empenhado ? (liquidado / empenhado) * 100 : 0;
    const pctPag = liquidado ? (pago / liquidado) * 100 : 0;
    const pctLivre = orcado ? (livre / orcado) * 100 : 0;
    const pctNaoLiq = empenhado ? (empenhadoNaoLiq / empenhado) * 100 : 0;

    return {
      inicial,
      orcado,
      empenhado,
      liquidado,
      pago,
      livre,
      empenhadoNaoLiq,
      pctEmp,
      pctLiq,
      pctPag,
      pctLivre,
      pctNaoLiq,
    };
  }, [unidades]);

  const unidadesFiltradas = unidades.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-8 flex justify-center items-center h-screen text-slate-600">
        Carregando dados orçamentários...
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
      {/* Overlay translúcido para legibilidade (igual ao de Contratos/Detalhes) */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-white/95 to-white pointer-events-none" />

      {/* Conteúdo */}
      <div className="relative z-10 p-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">
          Dashboard do Orçamento (FIPLAN) – {anoSelecionado}
        </h1>
        <p className="text-slate-700/90 mb-4">
          Clique em uma Unidade Gestora para visualizar o detalhamento orçamentário.
        </p>

        {/* Filtro de ano */}
        <div className="flex flex-wrap gap-2 mb-6">
          {anos.map((a) => (
            <button
              key={a}
              onClick={() => setAnoSelecionado(a)}
              className={`px-3 py-1 rounded-full border transition ${
                anoSelecionado === a
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-blue-50 border-slate-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Totais gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          <CardOrcamento titulo="Orçado Inicial" valor={totais.inicial} corFundo="bg-sky-700" />
          <CardOrcamento titulo="Orçado Atual" valor={totais.orcado} corFundo="bg-green-700" />
          <CardOrcamento
            titulo="Empenhado"
            valor={totais.empenhado}
            corFundo="bg-blue-600"
            percentual={totais.pctEmp}
          />
          <CardOrcamento
            titulo="Liquidado"
            valor={totais.liquidado}
            corFundo="bg-orange-500"
            percentual={totais.pctLiq}
          />
          <CardOrcamento
            titulo="Empenhado Não Liquidado"
            valor={totais.empenhadoNaoLiq}
            corFundo="bg-yellow-600"
            percentual={totais.pctNaoLiq}
          />
          <CardOrcamento
            titulo="Pago"
            valor={totais.pago}
            corFundo="bg-purple-600"
            percentual={totais.pctPag}
          />
          <CardOrcamento
            titulo="Livre para Empenho"
            valor={totais.livre}
            corFundo="bg-red-600"
            percentual={totais.pctLivre}
          />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200 mb-6">
          <BuscaInteligente onSearch={setBusca} />
        </div>

        {/* Cards de unidades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {unidadesFiltradas.map((u) => {
            const pctEmp = u.orcado ? (u.empenhado / u.orcado) * 100 : 0;
            const pctLiq = u.empenhado ? (u.liquidado / u.empenhado) * 100 : 0;
            const pctPag = u.liquidado ? (u.pago / u.liquidado) * 100 : 0;
            const pctLivre = u.orcado ? (u.livre / u.orcado) * 100 : 0;

            return (
              <div
                key={u.codigo}
                onClick={() => navigate(`/orcamento/${u.codigo}?ano=${anoSelecionado}`)}
                className="cursor-pointer p-4 rounded-2xl shadow hover:shadow-md bg-white/90 backdrop-blur-sm border border-slate-200 transition"
              >
                <div className="text-xl font-bold text-slate-800 mb-1">{u.nome}</div>
                <div className="text-sm text-slate-600 mb-2">UO {u.codigo}</div>
                <div className="text-sm text-slate-700 mb-3">
                  Orçado: {fmt(u.orcado)}
                </div>

                {/* Empenhado */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Empenhado</span>
                    <span>{pctEmp.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded">
                    <div
                      className="h-2 bg-yellow-500 rounded"
                      style={{ width: `${Math.min(pctEmp, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Liquidado */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Liquidado</span>
                    <span>{pctLiq.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded">
                    <div
                      className="h-2 bg-orange-500 rounded"
                      style={{ width: `${Math.min(pctLiq, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Pago */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Pago</span>
                    <span>{pctPag.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded">
                    <div
                      className="h-2 bg-purple-600 rounded"
                      style={{ width: `${Math.min(pctPag, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Livre */}
                <div>
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Livre</span>
                    <span>{pctLivre.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded">
                    <div
                      className="h-2 bg-green-600 rounded"
                      style={{ width: `${Math.min(pctLivre, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
