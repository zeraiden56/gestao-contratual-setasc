"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiDollarSign,
  FiTrendingUp,
  FiSend,
  FiPieChart,
  FiClock,
  FiSlash,
  FiSearch,
  FiLayers,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";

import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Progress } from "../../../components/ui/progress";

import { useContratos } from "../hooks/useContratos";
import { useBuscaInteligente } from "../hooks/useBuscaInteligente";

type ContratoItem = {
  id: string;
  slug: string;
  numero: string;
  contratada: string;
  objeto?: string;
  valorTotal?: number;
  empenhado?: number;
  liquidado?: number;
  dataVencimento?: string;
  dataInicio?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  // hook principal
  const { contratos, loading, refreshIndex, totais } = useContratos();

  // DERIVADOS SEGUROS a partir de 'totais' do hook
  const tot = useMemo(() => {
    const valorTotal = Number(totais?.valorTotal || 0);
    const empenhado = Number(totais?.empenhado || 0);
    const liquidado = Number(totais?.liquidado || 0);
    const pago = Number(totais?.pago || 0);
    const saldoAtual = Number(totais?.saldoAtual || 0);

    const percEmpenhado = valorTotal ? (empenhado / valorTotal) * 100 : 0;
    const percLiquidado = valorTotal ? (liquidado / valorTotal) * 100 : 0;
    const restosAPagar = Math.max(0, empenhado - liquidado);

    return {
      totalContratos: Number(totais?.totalContratos || contratos.length || 0),
      valorTotal,
      empenhado,
      liquidado,
      pago,
      saldoAtual,
      percEmpenhado,
      percLiquidado,
      restosAPagar,
    };
  }, [totais, contratos.length]);

  // busca global (dropdown)
  const [busca, setBusca] = useState("");
  const { filtrados, highlight, loading: buscando } = useBuscaInteligente(
    contratos as any[],
    busca,
    ["numero", "contratada", "objeto", "sigadoc"]
  );
  const buscaRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // atualizar (forçado)
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(
    localStorage.getItem("ultimaAtualizacao") || null
  );

  async function atualizarContratos() {
    try {
      setAtualizando(true);
      await refreshIndex();
      const agora = new Date().toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
      localStorage.setItem("ultimaAtualizacao", agora);
      setUltimaAtualizacao(agora);
    } catch (e) {
      console.error("Falha ao atualizar index:", e);
      alert("Não foi possível atualizar agora. Tente novamente.");
    } finally {
      setAtualizando(false);
    }
  }

  const fmtBRL = (v?: number | null) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  // agrupamentos calculados do index
  const hoje = new Date();
  const prox60 = new Date(hoje);
  prox60.setDate(hoje.getDate() + 60);

  const { vigenciaProxima, vencidos, empenhoSobrando, novos } = useMemo(() => {
    const vigenciaProxima: ContratoItem[] = [];
    const vencidos: ContratoItem[] = [];
    const empenhoSobrando: (ContratoItem & { saldo: number })[] = [];
    const novos: ContratoItem[] = [];

    for (const c of contratos as ContratoItem[]) {
      if (c.dataVencimento) {
        const d = new Date(c.dataVencimento);
        if (!isNaN(d.getTime())) {
          if (d >= hoje && d <= prox60) vigenciaProxima.push(c);
          if (d < hoje) vencidos.push(c);
        }
      }
      const emp = c.empenhado || 0;
      const liq = c.liquidado || 0;
      if (emp > liq) {
        empenhoSobrando.push({ ...c, saldo: emp - liq });
      }
      if (c.numero?.includes("/2025")) {
        novos.push(c);
      }
    }

    vigenciaProxima.sort(
      (a, b) =>
        new Date(a.dataVencimento || 0).getTime() - new Date(b.dataVencimento || 0).getTime()
    );
    vencidos.sort(
      (a, b) =>
        new Date(b.dataVencimento || 0).getTime() - new Date(a.dataVencimento || 0).getTime()
    );
    empenhoSobrando.sort((a, b) => b.saldo - a.saldo);
    novos.sort((a, b) => {
      const nA = parseInt(a.numero.replace(/\D/g, "")) || 0;
      const nB = parseInt(b.numero.replace(/\D/g, "")) || 0;
      return nB - nA;
    });

    return { vigenciaProxima, vencidos, empenhoSobrando, novos };
  }, [contratos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
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
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-white/95 to-white pointer-events-none" />

      <div className="relative z-10 p-6 space-y-8">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-7 py-3 bg-gradient-to-r from-blue-700 to-sky-500 rounded-full shadow-xl border border-blue-200">
            <FiFileText className="text-white text-2xl drop-shadow-sm" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Gestão de Contratos
            </h1>
          </div>

          <div className="flex justify-center items-center gap-3 mt-5">
            <button
              onClick={atualizarContratos}
              disabled={atualizando}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md transition disabled:opacity-50"
            >
              <FiRefreshCw className={atualizando ? "animate-spin" : ""} />
              {atualizando ? "Atualizando..." : "Atualizar Dados"}
            </button>
            {ultimaAtualizacao && (
              <span className="text-xs text-slate-600">
                Última atualização: {ultimaAtualizacao}
              </span>
            )}
          </div>
        </motion.div>

        {/* Busca global com dropdown */}
        <div className="flex justify-center" ref={buscaRef}>
          <div className="relative w-full sm:max-w-2xl">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Buscar contrato..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="pl-10 text-center rounded-full shadow-sm border-blue-300 bg-white/80 focus:ring-2 focus:ring-blue-400"
            />
            {showDropdown && busca && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto animate-fadeIn">
                {buscando && (
                  <div className="p-3 text-center text-slate-500 text-sm animate-pulse">
                    Buscando...
                  </div>
                )}
                {!buscando && filtrados.length > 0 && (
                  <>
                    {filtrados.slice(0, 12).map((c: any) => (
                      <div
                        key={c.id || c.slug || c.numero}
                        onClick={() => {
                          navigate(`/contratos/${c.slug || c.id}`);
                          setShowDropdown(false);
                          setBusca("");
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-none transition"
                      >
                        <p
                          className="font-semibold text-slate-800 text-sm"
                          dangerouslySetInnerHTML={{
                            __html: highlight(`${c.numero ?? ""} — ${c.contratada ?? ""}`),
                          }}
                        />
                        <p
                          className="text-sm text-slate-600 line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: highlight(c.objeto || ""),
                          }}
                        />
                      </div>
                    ))}
                  </>
                )}
                {!buscando && filtrados.length === 0 && (
                  <div className="p-3 text-center text-slate-500 text-sm italic">
                    Nenhum contrato encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cards principais (totais reais) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            {
              label: "Contratos Vigentes",
              valor: (tot.totalContratos || contratos.length).toString(),
              cor: "bg-gradient-to-r from-sky-500 to-blue-600",
              icone: <FiFileText className="text-white text-lg" />,
            },
            {
              label: "Valor Total",
              valor: fmtBRL(tot.valorTotal),
              cor: "bg-gradient-to-r from-emerald-500 to-green-600",
              icone: <FiDollarSign className="text-white text-lg" />,
            },
            {
              label: "Empenhado",
              valor: fmtBRL(tot.empenhado),
              cor: "bg-gradient-to-r from-violet-500 to-purple-600",
              icone: <FiTrendingUp className="text-white text-lg" />,
              perc: tot.percEmpenhado,
            },
            {
              label: "Liquidado",
              valor: fmtBRL(tot.liquidado),
              cor: "bg-gradient-to-r from-orange-400 to-amber-500",
              icone: <FiSend className="text-white text-lg" />,
              perc: tot.percLiquidado,
            },
            {
              label: "Restos a Pagar",
              valor: fmtBRL(tot.restosAPagar),
              cor: "bg-gradient-to-r from-rose-400 to-pink-500",
              icone: <FiLayers className="text-white text-lg" />,
            },
            {
              label: "Saldo dos Contratos",
              valor: fmtBRL(tot.saldoAtual),
              cor: "bg-gradient-to-r from-yellow-400 to-yellow-600",
              icone: <FiPieChart className="text-white text-lg" />,
            },
          ].map((c, i) => (
            <Card key={i} className={`${c.cor} text-white shadow-md rounded-xl`}>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {c.icone}
                      <span className="text-sm font-semibold">{c.label}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold mt-1">{c.valor}</p>
                </div>
                {"perc" in c && typeof c.perc === "number" && (
                  <div className="mt-3">
                    <Progress value={c.perc} className="h-2 bg-white/25" />
                    <p className="text-xs text-white/80 mt-1 text-right">
                      {isFinite(c.perc) ? c.perc.toFixed(1) : "0.0"}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listas analíticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Lista
            titulo="Vigência Próxima (60 dias)"
            cor="yellow"
            icone={<FiClock />}
            contratos={vigenciaProxima}
            navigate={navigate}
          />
          <Lista
            titulo="Contratos Vencidos"
            cor="red"
            icone={<FiSlash />}
            contratos={vencidos}
            navigate={navigate}
          />
          <Lista
            titulo="Empenhos Não Utilizados"
            cor="violet"
            icone={<FiTrendingUp />}
            contratos={empenhoSobrando}
            navigate={navigate}
          />
          <Lista
            titulo="Novos Contratos (2025)"
            cor="green"
            icone={<FiCheckCircle />}
            contratos={novos}
            navigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}

/* ------ Lista reutilizável ------ */
function Lista({
  titulo,
  cor,
  icone,
  contratos,
  navigate,
}: {
  titulo: string;
  cor: "yellow" | "violet" | "green" | "red";
  icone: React.ReactNode;
  contratos: ContratoItem[] | (ContratoItem & { saldo?: number })[];
  navigate: (path: string) => void;
}) {
  const cores: Record<typeof cor, string> = {
    yellow: "text-yellow-700 border-yellow-200 bg-yellow-50",
    violet: "text-violet-700 border-violet-200 bg-violet-50",
    green: "text-green-700 border-green-200 bg-green-50",
    red: "text-red-700 border-red-200 bg-red-50",
  };

  return (
    <Card className="bg-white/90 border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${cores[cor]}`}>{icone}</div>
            <h2 className={`text-lg font-semibold ${cores[cor].split(" ")[0]}`}>{titulo}</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">{contratos.length}</span>
        </div>

        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {contratos.slice(0, 8).map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/contratos/${c.slug}`)}
              className="p-4 bg-slate-50 rounded-lg hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-200 shadow-sm transition"
            >
              <p className="font-semibold text-slate-800 text-sm">
                {(c as any).numero || "—"} — {(c as any).contratada || "—"}
              </p>
              <p className="text-sm text-slate-600 line-clamp-2">
                {(c as any).objeto || "Sem descrição"}
              </p>
              {c.dataVencimento && (
                <p className={`text-xs ${cores[cor].split(" ")[0]} mt-1`}>
                  Vencimento: {c.dataVencimento}
                </p>
              )}
              {"saldo" in c && typeof (c as any).saldo === "number" && (
                <p className="text-xs text-slate-600 mt-1">
                  Saldo empenho não utilizado:{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format((c as any).saldo)}
                </p>
              )}
            </div>
          ))}
          {contratos.length === 0 && (
            <p className="text-center text-slate-400 italic text-sm">Nenhum contrato encontrado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
