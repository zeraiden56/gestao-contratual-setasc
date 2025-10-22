"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiCopy,
  FiFileText,
  FiCalendar,
} from "react-icons/fi";
import { Card, CardContent } from "@/app/components/ui/card";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { Progress } from "@/app/components/ui/progress";
import { Input } from "@/app/components/ui/input";
import { motion } from "framer-motion";
import ContratoCard from "../components/ContratoCard";
import { useDebounce } from "use-debounce";
import * as XLSX from "xlsx";

// 🔹 Normaliza texto (para busca acentuada e case-insensitive)
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function destacarTexto(textoOriginal: string, termosBusca: string[]) {
  if (!termosBusca.length) return textoOriginal;
  const textoNormalizado = normalizar(textoOriginal);
  const indices: [number, number][] = [];

  termosBusca.forEach((termo) => {
    const termoNorm = normalizar(termo);
    let idx = textoNormalizado.indexOf(termoNorm);
    while (idx !== -1) {
      indices.push([idx, idx + termoNorm.length]);
      idx = textoNormalizado.indexOf(termoNorm, idx + termoNorm.length);
    }
  });

  if (indices.length === 0) return textoOriginal;
  const unidos: [number, number][] = [];
  indices
    .sort((a, b) => a[0] - b[0])
    .forEach(([ini, fim]) => {
      const ultimo = unidos[unidos.length - 1];
      if (!ultimo || ini > ultimo[1]) unidos.push([ini, fim]);
      else ultimo[1] = Math.max(ultimo[1], fim);
    });

  let resultado = "";
  let pos = 0;
  unidos.forEach(([ini, fim]) => {
    resultado += textoOriginal.slice(pos, ini);
    resultado += `<mark class="bg-yellow-200">${textoOriginal.slice(ini, fim)}</mark>`;
    pos = fim;
  });
  resultado += textoOriginal.slice(pos);
  return resultado;
}

interface Contrato {
  id: number;
  numero: string;
  sigadoc: string;
  contratada: string;
  tipo: string;
  objeto: string;
  vigencia: string | null;
  valorTotal: number;
  saldoEmpenhado: number;
  saldoUtilizado: number;
  saldoAtual: number;
  restoEmpenhar: number;
}

export default function DashboardContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [filtrados, setFiltrados] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [queryDebounced] = useDebounce(query, 300);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const navigate = useNavigate();

  const CACHE_KEY = "contratos_cache_excel_v2";
  const CACHE_TIME = 5 * 60 * 1000; // 5 min

  const fmtBRL = (v?: number | null) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  const parseNumber = (valor: any): number => {
    if (typeof valor === "number") return valor;
    if (typeof valor === "string") {
      const clean = valor.replace(/\./g, "").replace(",", ".").trim();
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // 🔹 Carrega o Excel
  const carregarDoExcel = async () => {
    setLoading(true);
    try {
      const res = await fetch("/controle_contratos_empenhos_setasc.xlsx");
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      const dados: Contrato[] = json.map((d: any, i: number) => ({
        id: i + 1,
        numero: d["Nº CONTRATO"] || "",
        sigadoc: d["Nº CONTRATO SIGADOC "] || "",
        contratada: (d["CONTRATADA"] || "").trim(),
        tipo: d["TIPO DE CONTRATO "] || "",
        objeto: d["OBJETO DO CONTRATO"] || "",
        vigencia: d["VIGÊNCIA"] || null,
        valorTotal: parseNumber(d["VALOR TOTAL DO CONTRATO (A)"]),
        saldoEmpenhado: parseNumber(d["SALDO EMPENHADO 2025"]),
        saldoUtilizado: parseNumber(d["SALDO  UTILIZADO"]),
        saldoAtual: parseNumber(d["SALDO ATUAL DO CONTRATO"]),
        restoEmpenhar: parseNumber(d["RESTO A  SER EMPENHADO"]),
      }));

      setContratos(dados);
      setFiltrados(dados);
      localStorage.setItem(CACHE_KEY, JSON.stringify(dados));
      localStorage.setItem(`${CACHE_KEY}_time`, String(Date.now()));
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erro ao carregar Excel:", err);
    } finally {
      setLoading(false);
    }
  };

  const carregarDados = async () => {
    const cache = localStorage.getItem(CACHE_KEY);
    const cacheTime = localStorage.getItem(`${CACHE_KEY}_time`);
    if (cache && cacheTime && Date.now() - Number(cacheTime) < CACHE_TIME) {
      const parsed = JSON.parse(cache);
      setContratos(parsed);
      setFiltrados(parsed);
      setLastUpdate(new Date(Number(cacheTime)));
      setLoading(false);
      return;
    }
    await carregarDoExcel();
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // 🔹 Busca com destaque
  const resultados = useMemo(() => {
    if (!queryDebounced.trim()) return [];
    const termos = normalizar(queryDebounced).split(/\s+/);
    return contratos.filter((c) => {
      const texto = normalizar(
        `${c.numero} ${c.contratada} ${c.objeto} ${c.sigadoc}`
      );
      return termos.every((t) => texto.includes(t));
    });
  }, [queryDebounced, contratos]);

  useEffect(() => {
    if (!queryDebounced.trim()) {
      setFiltrados(contratos);
      return;
    }
    setFiltrados(resultados);
  }, [queryDebounced, resultados, contratos]);

  // 🔹 Totais ajustados
  const totais = useMemo(() => {
    const totalContratos = contratos.length;
    const valorTotal = contratos.reduce((a, c) => a + (c.valorTotal || 0), 0);
    const empenhado = contratos.reduce((a, c) => a + (c.saldoEmpenhado || 0), 0);
    const liquidado = contratos.reduce((a, c) => a + (c.saldoUtilizado || 0), 0);
    const saldoAtual = contratos.reduce(
      (a, c) => a + ((c.valorTotal || 0) - (c.saldoEmpenhado || 0)),
      0
    );

    return {
      totalContratos,
      valorTotal,
      empenhado,
      liquidado,
      saldoAtual,
      percEmpenhado: valorTotal ? (empenhado / valorTotal) * 100 : 0,
      percLiquidado: empenhado ? (liquidado / empenhado) * 100 : 0,
    };
  }, [contratos]);

  const agora = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + 60);

  const contratosAVencer = useMemo(() => {
    return filtrados.filter((c) => {
      const fimTexto = c.vigencia?.split(" a ")[1];
      if (!fimTexto) return false;
      const fim = new Date(fimTexto);
      return !isNaN(fim.getTime()) && fim >= agora && fim <= limite;
    });
  }, [filtrados]);

  const contratosSaldoUtilizar = useMemo(() => {
    return filtrados
      .map((c) => ({
        ...c,
        saldoUtilizar: (c.saldoEmpenhado || 0) - (c.saldoUtilizado || 0),
      }))
      .filter((c) => c.saldoUtilizar > 0)
      .sort((a, b) => b.saldoUtilizar - a.saldoUtilizar);
  }, [filtrados]);

  if (loading) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-[#f7f9fc]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white p-6 space-y-8">
        {/* Título */}
        <div className="flex items-center justify-center gap-3 border-b pb-3 mb-2">
          <FiFileText className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">
            Gestão de Contratos
          </h1>
        </div>

        {/* 🔎 Barra de busca */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 relative">
          <div className="relative w-full sm:max-w-2xl">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Buscar contrato..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-white/70 border-blue-300 text-center rounded-full shadow-sm"
            />
            {query && resultados.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {resultados.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      navigate(`/contratos/${r.id}`);
                      setQuery("");
                    }}
                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b"
                  >
                    <p
                      className="font-medium"
                      dangerouslySetInnerHTML={{
                        __html: destacarTexto(
                          `${r.numero} — ${r.contratada}`,
                          query.split(/\s+/)
                        ),
                      }}
                    />
                    <p
                      className="text-xs text-slate-600"
                      dangerouslySetInnerHTML={{
                        __html: destacarTexto(r.objeto, query.split(/\s+/)),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarDoExcel}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <FiRefreshCw />
              Atualizar
            </button>
            {lastUpdate && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <FiClock /> Atualizado há{" "}
                {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s
              </span>
            )}
          </div>
        </div>

        {/* 📊 Cards ajustados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Contratos Vigentes", valor: totais.totalContratos.toString(), cor: "bg-blue-600" },
            { label: "Valor Total", valor: fmtBRL(totais.valorTotal), cor: "bg-green-600" },
            { label: "Empenhado", valor: fmtBRL(totais.empenhado), cor: "bg-purple-600", perc: totais.percEmpenhado },
            { label: "Encaminhado para Pagamento", valor: fmtBRL(totais.liquidado), cor: "bg-orange-500", perc: totais.percLiquidado },
            { label: "Saldo dos Contratos", valor: fmtBRL(totais.saldoAtual), cor: "bg-yellow-600" },
          ].map((c, i) => (
            <Card
              key={i}
              className={`${c.cor} text-white shadow-md rounded-xl hover:shadow-lg transition`}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">{c.label}</span>
                    <FiCopy
                      className="cursor-pointer text-white/70 hover:text-white"
                      onClick={() => navigator.clipboard.writeText(String(c.valor))}
                    />
                  </div>
                  <p className="text-lg font-bold mt-1">{c.valor}</p>
                </div>
                {c.perc && (
                  <div className="mt-3">
                    <Progress value={c.perc} className="h-2 bg-white/20" />
                    <p className="text-xs text-white/80 mt-1 text-right">
                      {c.perc.toFixed(1)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listas de contratos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-[#f9fafc]">
            <CardContent>
              <div className="text-center mb-4 flex items-center justify-center gap-2">
                <FiCalendar className="text-blue-600 text-lg" />
                <p className="font-semibold text-blue-700 text-lg">
                  Contratos a Vencer
                </p>
              </div>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {contratosAVencer.map((c) => (
                  <ContratoCard
                    key={c.id}
                    id={c.id}
                    numero={c.numero}
                    contratada={c.contratada}
                    objeto={c.objeto}
                    vigencia={c.vigencia}
                    query={queryDebounced}
                    onClick={() => navigate(`/contratos/${c.id}`)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#f9fafc]">
            <CardContent>
              <div className="text-center mb-4 flex items-center justify-center gap-2">
                <FiFileText className="text-blue-600 text-lg" />
                <p className="font-semibold text-blue-700 text-lg">
                  Contratos com Saldo a Utilizar
                </p>
              </div>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {contratosSaldoUtilizar.map((c) => (
                  <ContratoCard
                    key={c.id}
                    id={c.id}
                    numero={c.numero}
                    contratada={c.contratada}
                    objeto={c.objeto}
                    vigencia={c.vigencia}
                    query={queryDebounced}
                    onClick={() => navigate(`/contratos/${c.id}`)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
