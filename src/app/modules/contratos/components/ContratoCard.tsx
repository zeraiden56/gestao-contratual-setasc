"use client";

import { Card } from "@/app/components/ui/card";
import { FiCalendar, FiChevronRight, FiAlertTriangle } from "react-icons/fi";
import { Progress } from "@/app/components/ui/progress";

export interface ContratoCardProps {
  id: string;
  numero: string;
  contratada: string;
  objeto: string;
  query?: string;
  dataInicio?: string | null;
  dataVencimento?: string | null;
  onClick?: () => void;
}

// 🔹 Destaca termos buscados (suporta múltiplas palavras)
function highlightTerm(text: string, query?: string) {
  if (!query?.trim()) return text;
  const termos = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/\s+/)
    .filter(Boolean);

  let resultado = text;
  termos.forEach((t) => {
    const regex = new RegExp(`(${t})`, "gi");
    resultado = resultado.replace(
      regex,
      `<mark class='bg-yellow-200'>$1</mark>`
    );
  });
  return resultado;
}

// 🔹 Calcula progresso e status do contrato com base nas datas reais
function calcularPrazo(dataInicio?: string | null, dataVencimento?: string | null) {
  if (!dataVencimento) return null;

  const hoje = new Date();
  const inicio = dataInicio ? new Date(dataInicio) : null;
  const fim = new Date(dataVencimento);

  if (isNaN(fim.getTime())) return null;

  hoje.setHours(0, 0, 0, 0);
  fim.setHours(0, 0, 0, 0);

  const diffDias = Math.floor((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrazo = inicio
    ? Math.max(1, Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)))
    : 365;
  const progresso = Math.min(100, Math.max(0, ((totalPrazo - diffDias) / totalPrazo) * 100));

  const textoPrazo =
    diffDias > 0
      ? `vence em ${diffDias} dia${diffDias === 1 ? "" : "s"}`
      : `vencido há ${Math.abs(diffDias)} dia${Math.abs(diffDias) === 1 ? "" : "s"}`;

  let status: "vencido" | "vencendo" | "normal" = "normal";
  if (diffDias < 0) status = "vencido";
  else if (diffDias <= 30) status = "vencendo";

  return {
    diffDias,
    dataFinal: fim.toLocaleDateString("pt-BR"),
    textoPrazo,
    status,
    progresso,
  };
}

export default function ContratoCard({
  numero,
  contratada,
  objeto,
  query,
  dataInicio,
  dataVencimento,
  onClick,
}: ContratoCardProps) {
  const prazo = calcularPrazo(dataInicio, dataVencimento);

  const statusColor =
    prazo?.status === "vencido"
      ? "bg-red-100 text-red-700 border-red-300"
      : prazo?.status === "vencendo"
      ? "bg-orange-100 text-orange-700 border-orange-300"
      : "bg-green-100 text-green-700 border-green-300";

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer bg-white border border-slate-200 hover:border-blue-500 transition hover:shadow-md rounded-xl p-4 group relative overflow-hidden"
    >
      {/* Indicador lateral de status */}
      <div
        className={`absolute left-0 top-0 h-full w-1 transition-all duration-300 ${
          prazo?.status === "vencido"
            ? "bg-red-500"
            : prazo?.status === "vencendo"
            ? "bg-orange-400"
            : "bg-green-400"
        }`}
      />

      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p
            className="text-base font-bold text-blue-700 leading-tight truncate"
            dangerouslySetInnerHTML={{ __html: highlightTerm(numero, query) }}
          />
          <p
            className="text-sm font-semibold text-slate-700 leading-snug truncate"
            dangerouslySetInnerHTML={{
              __html: highlightTerm(contratada, query),
            }}
          />
        </div>

        <FiChevronRight className="text-slate-400 mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Objeto */}
      <p
        className="text-xs text-slate-500 mt-1 line-clamp-2"
        dangerouslySetInnerHTML={{
          __html: highlightTerm(objeto || "Sem descrição do objeto", query),
        }}
      />

      {/* Prazo e status */}
      {prazo ? (
        <div className="flex flex-col mt-3 gap-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-600">
              <FiCalendar className="text-slate-400" />
              <span>
                até <strong>{prazo.dataFinal}</strong>
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${statusColor}`}
            >
              {prazo.textoPrazo}
            </span>
          </div>

          <Progress
            value={prazo.progresso}
            className={`h-1.5 ${
              prazo.status === "vencido"
                ? "bg-red-100"
                : prazo.status === "vencendo"
                ? "bg-orange-100"
                : "bg-green-100"
            }`}
          />
        </div>
      ) : (
        <div className="text-xs text-slate-500 mt-2 italic">
          Vigência não informada
        </div>
      )}

      {/* Alerta se vencido */}
      {prazo?.status === "vencido" && (
        <div className="flex items-center gap-1 text-[11px] text-red-600 mt-2">
          <FiAlertTriangle className="shrink-0" />
          <span>Contrato vencido — verificar prorrogação ou encerramento</span>
        </div>
      )}
    </Card>
  );
}
