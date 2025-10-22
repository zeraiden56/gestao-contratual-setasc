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
} from "react-icons/fi";

// 🧩 Função auxiliar para extrair datas de uma string tipo "01/01/2024 a 31/12/2025"
function extrairDatas(vigenciaStr?: string | null) {
  if (!vigenciaStr) return { inicio: null, fim: null };

  const limpa = vigenciaStr
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a");

  const regex =
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:a|ate|à)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i;
  const match = limpa.match(regex);
  if (!match) return { inicio: null, fim: null };

  const [_, ini, fim] = match;
  const [di, mi, ai] = ini.split("/").map(Number);
  const [df, mf, af] = fim.split("/").map(Number);
  const inicio = new Date(ai < 100 ? 2000 + ai : ai, mi - 1, di);
  const final = new Date(af < 100 ? 2000 + af : af, mf - 1, df);
  return { inicio, fim: final };
}

// 🔹 Formata valores em R$
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0
  );

// 🔹 Formata data no padrão brasileiro
const fmtData = (d?: Date | null) =>
  d ? d.toLocaleDateString("pt-BR") : "Não informada";

// 🔍 Função de normalização (para busca)
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function Relatorios() {
  const { contratos, loading } = useContratos();
  const navigate = useNavigate();
  const hoje = new Date();

  const [busca, setBusca] = useState("");

  const resultados = useMemo(() => {
    if (!busca.trim()) return [];
    const termos = normalizar(busca).split(/\s+/);
    return contratos.filter((c) => {
      const texto = normalizar(
        `${c.numero} ${c.contratada} ${c.objeto} ${c.sigadoc}`
      );
      return termos.every((t) => texto.includes(t));
    });
  }, [busca, contratos]);

  const destaque = (texto: string) => {
    if (!busca.trim()) return texto;
    const termos = normalizar(busca).split(/\s+/);
    return texto.replace(
      new RegExp(
        `(${termos
          .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")})`,
        "gi"
      ),
      (m) => `<mark class="bg-yellow-200">${m}</mark>`
    );
  };

  // 🔹 Identifica irregularidades
  const irregularidades = useMemo(() => {
    return contratos
      .map((c) => {
        const { inicio, fim } = extrairDatas(c.vigencia);
        const vencido = fim && fim < hoje;
        const diasVencido = vencido
          ? Math.floor((hoje.getTime() - fim.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const irregular = {
          ...c,
          vigenciaInicio: inicio,
          vigenciaFim: fim,
          vencido,
          diasVencido,
          valorNegativo:
            (c.valorTotal || 0) < 0 ||
            (c.saldoUtilizado || 0) < 0 ||
            (c.saldoEmpenhado || 0) < 0 ||
            (c.restoEmpenhar || 0) < 0,
          empenhoExcedente:
            (c.saldoEmpenhado || 0) > (c.valorTotal || 0) ||
            (c.saldoUtilizado || 0) > (c.valorTotal || 0),
          semAditivos: vencido && (!c.aditivos || c.aditivos === 0),
          empenhoNaoLiquidado:
            vencido &&
            (c.saldoEmpenhado || 0) > (c.saldoUtilizado || 0) &&
            (c.saldoUtilizado || 0) < (c.valorTotal || 0),
        };

        const houveIrregularidade =
          irregular.valorNegativo ||
          irregular.empenhoExcedente ||
          irregular.vencido ||
          irregular.semAditivos ||
          irregular.empenhoNaoLiquidado;

        return houveIrregularidade ? irregular : null;
      })
      .filter(Boolean);
  }, [contratos]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-slate-500">
        Carregando relatórios...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-8 space-y-6">
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
          Relatório de Irregularidades
        </h1>
      </div>

      {/* 🔍 Barra de busca */}
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
                    __html: destaque(r.objeto),
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {irregularidades.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          Nenhuma irregularidade encontrada 🎉
        </Card>
      ) : (
        <Card className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-100 px-6 py-3 border-b">
            <CardTitle className="flex items-center gap-2 text-md font-bold text-slate-700">
              <FiAlertTriangle className="text-red-600" />
              Contratos com Irregularidades ({irregularidades.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 border-b text-slate-700 font-semibold">
                <tr>
                  <th className="p-3 text-left">Nº Contrato</th>
                  <th className="p-3 text-left">Contratada</th>
                  <th className="p-3 text-left">Vigência</th>
                  <th className="p-3 text-left">Valor Total</th>
                  <th className="p-3 text-left">Irregularidades</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {irregularidades.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">
                      {c.numero}
                    </td>
                    <td className="p-3">{c.contratada}</td>
                    <td className="p-3">
                      {c.vigenciaInicio
                        ? `${fmtData(c.vigenciaInicio)} — ${fmtData(
                            c.vigenciaFim
                          )}`
                        : "Não informada"}
                    </td>
                    <td className="p-3">{fmtBRL(c.valorTotal)}</td>
                    <td className="p-3">
                      <ul className="list-disc list-inside space-y-1">
                        {c.valorNegativo && (
                          <li className="text-red-600">
                            Valores negativos detectados
                          </li>
                        )}
                        {c.empenhoExcedente && (
                          <li className="text-orange-600">
                            Empenhos acima do valor total
                          </li>
                        )}
                        {c.vencido && (
                          <li className="text-yellow-600">
                            Contrato vencido há {c.diasVencido} dias
                          </li>
                        )}
                        {c.semAditivos && (
                          <li className="text-rose-600">
                            Vencido e sem aditivos registrados
                          </li>
                        )}
                        {c.empenhoNaoLiquidado && (
                          <li className="text-red-600">
                            Empenhos não liquidados após vencimento
                          </li>
                        )}
                      </ul>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/contratos/${c.id}`)}
                        className="flex items-center gap-1"
                      >
                        <FiFileText />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
