"use client";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContratos } from "../hooks/useContratos";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiHome,
  FiFileText,
  FiSearch,
  FiBarChart2,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0
  );

const fmtData = (d?: string | Date | null) => {
  if (!d) return "—";
  const data = new Date(d);
  if (isNaN(data.getTime())) return String(d);
  return data.toLocaleDateString("pt-BR");
};

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function RelatoriosAvancados() {
  const { contratos, loading } = useContratos();
  const navigate = useNavigate();
  const hoje = new Date();
  const [busca, setBusca] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState<"irregularidades" | "empenhos" | "executados2025" | "avencer">("irregularidades");

  // =====================================
  // Busca simples
  // =====================================
  const resultados = useMemo(() => {
    if (!busca.trim()) return [];
    const termos = normalizar(busca).split(/\s+/);
    return contratos.filter((c) => {
      const texto = normalizar(`${c.numero} ${c.contratada} ${c.objeto} ${c.sigadoc}`);
      return termos.every((t) => texto.includes(t));
    });
  }, [busca, contratos]);

  const destaque = (texto: string) => {
    if (!busca.trim()) return texto;
    const termos = normalizar(busca).split(/\s+/);
    return texto.replace(
      new RegExp(`(${termos.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi"),
      (m) => `<mark class="bg-yellow-200">${m}</mark>`
    );
  };

  // =====================================
  // Relatórios
  // =====================================
  const relatorio = useMemo(() => {
    switch (tipoRelatorio) {
      case "irregularidades": {
        return contratos
          .map((c) => {
            const fim = c.dataVencimento ? new Date(c.dataVencimento) : null;
            const vencido = fim && fim < hoje;
            const diasVencido = vencido ? Math.floor((hoje.getTime() - fim.getTime()) / (1000 * 60 * 60 * 24)) : 0;

            const valorTotal = c.valorTotal || 0;
            const empenhado = c.empenhado || 0;
            const liquidado = c.liquidado || 0;
            const pago = c.pago || 0;
            const resto = c.restoEmpenhar || 0;

            const irregular = {
              ...c,
              vencido,
              diasVencido,
              valorNegativo: valorTotal < 0 || empenhado < 0 || liquidado < 0 || resto < 0,
              empenhoExcedente: empenhado > valorTotal || liquidado > valorTotal || pago > valorTotal,
              empenhoNaoLiquidado: vencido && empenhado > liquidado,
            };

            const houveIrregularidade =
              irregular.valorNegativo ||
              irregular.empenhoExcedente ||
              irregular.vencido ||
              irregular.empenhoNaoLiquidado;

            return houveIrregularidade ? irregular : null;
          })
          .filter(Boolean);
      }

      case "empenhos": {
        return contratos
          .filter((c) => {
            const total = c.valorTotal || 0;
            const empenhado = c.empenhado || 0;
            const proporcao = total ? empenhado / total : 0;
            return proporcao >= 1 || proporcao === 0; // totalmente empenhado ou nada empenhado
          })
          .map((c) => ({
            ...c,
            proporcao: ((c.empenhado || 0) / (c.valorTotal || 1)) * 100,
          }));
      }

      case "executados2025": {
        return contratos.filter((c) => {
          const data = c.dataVencimento ? new Date(c.dataVencimento) : null;
          const ano = data?.getFullYear();
          return ano === 2025 && (c.pago || 0) > 0;
        });
      }

      case "avencer": {
        return contratos.filter((c) => {
          const fim = c.dataVencimento ? new Date(c.dataVencimento) : null;
          if (!fim) return false;
          const diff = (fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
          return diff > 0 && diff <= 90;
        });
      }

      default:
        return [];
    }
  }, [tipoRelatorio, contratos]);

  // =====================================
  // Renderização
  // =====================================
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-slate-500">
        Carregando relatórios...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <FiHome />
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-blue-700 text-center flex-1">
          Relatórios de Contratos
        </h1>
      </div>

      {/* Tipo de relatório */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Button
          variant={tipoRelatorio === "irregularidades" ? "default" : "outline"}
          onClick={() => setTipoRelatorio("irregularidades")}
          className="flex items-center gap-2"
        >
          <FiAlertTriangle /> Irregularidades
        </Button>
        <Button
          variant={tipoRelatorio === "empenhos" ? "default" : "outline"}
          onClick={() => setTipoRelatorio("empenhos")}
          className="flex items-center gap-2"
        >
          <FiBarChart2 /> Empenhos
        </Button>
        <Button
          variant={tipoRelatorio === "executados2025" ? "default" : "outline"}
          onClick={() => setTipoRelatorio("executados2025")}
          className="flex items-center gap-2"
        >
          <FiTrendingUp /> Executados 2025
        </Button>
        <Button
          variant={tipoRelatorio === "avencer" ? "default" : "outline"}
          onClick={() => setTipoRelatorio("avencer")}
          className="flex items-center gap-2"
        >
          <FiClock /> A vencer
        </Button>
      </div>

      {/* Busca */}
      <div className="relative flex-1 max-w-3xl mx-auto mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Buscar contrato..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 bg-white/70 border-blue-300 text-center rounded-full shadow-sm"
        />
        {busca && resultados.length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
            {resultados.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  navigate(`/contratos/${r.id}`);
                  setBusca("");
                }}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b"
              >
                <p
                  className="font-medium"
                  dangerouslySetInnerHTML={{
                    __html: destaque(`${r.numero} — ${r.contratada}`),
                  }}
                />
                <p
                  className="text-xs text-slate-600"
                  dangerouslySetInnerHTML={{
                    __html: destaque(r.objeto || ""),
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela principal */}
      <Card className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-100 px-6 py-3 border-b">
          <CardTitle className="flex items-center gap-2 text-md font-bold text-slate-700">
            <FiFileText />
            {tipoRelatorio === "irregularidades" && "Contratos com Irregularidades"}
            {tipoRelatorio === "empenhos" && "Análise de Empenhos"}
            {tipoRelatorio === "executados2025" && "Contratos Executados em 2025"}
            {tipoRelatorio === "avencer" && "Contratos a Vencer"}
            ({relatorio.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {relatorio.length === 0 ? (
            <p className="text-center text-slate-500 py-6">
              Nenhum contrato encontrado.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 border-b text-slate-700 font-semibold">
                <tr>
                  <th className="p-3 text-left">Nº</th>
                  <th className="p-3 text-left">Contratada</th>
                  <th className="p-3 text-left">Vigência</th>
                  <th className="p-3 text-left">Valor Total</th>
                  {tipoRelatorio === "empenhos" && <th className="p-3">%</th>}
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{c.numero}</td>
                    <td className="p-3">{c.contratada}</td>
                    <td className="p-3">
                      {fmtData(c.dataInicio)} — {fmtData(c.dataVencimento)}
                    </td>
                    <td className="p-3">{fmtBRL(c.valorTotal)}</td>
                    {tipoRelatorio === "empenhos" && (
                      <td className="p-3 text-center">{c.proporcao?.toFixed(1)}%</td>
                    )}
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/contratos/${c.id}`)}
                        className="flex items-center gap-1"
                      >
                        <FiFileText /> Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
