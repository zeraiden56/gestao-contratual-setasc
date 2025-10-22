"use client";

import { Card } from "@/app/components/ui/card";
import { FiCalendar, FiChevronRight } from "react-icons/fi";

export interface ContratoCardProps {
  id: number;
  numero: string;
  contratada: string;
  objeto: string;
  query?: string;
  vigencia?: string | null;
  onClick?: () => void;
}

// Função para destacar termo buscado (usa <mark>)
function highlightTerm(text: string, term?: string) {
  if (!term) return text;
  const regex = new RegExp(`(${term})`, "gi");
  return text.replace(regex, `<mark class='bg-yellow-200'>$1</mark>`);
}

/**
 * Função para interpretar corretamente o campo de vigência no formato brasileiro (dd/mm/yyyy a dd/mm/yyyy)
 * e calcular o prazo até o vencimento.
 */
function parsePrazo(vigencia?: string | null) {
  if (!vigencia) return null;

  const partes = vigencia.split(" a ");
  if (partes.length < 2) return null;

  // Faz parse da data final no formato dd/mm/yyyy
  const fimTexto = partes[1].trim();
  const [dia, mes, ano] = fimTexto.split("/");

  // Cria a data corretamente em formato americano, com mês indexado em 0
  const fim = new Date(Number(ano), Number(mes) - 1, Number(dia));

  if (isNaN(fim.getTime())) return null;

  const hoje = new Date();

  // Zera horas pra cálculo exato de dias
  fim.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);

  const diffDias = Math.floor(
    (fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  const textoPrazo =
    diffDias > 0
      ? `vence em ${diffDias} dia${diffDias === 1 ? "" : "s"}`
      : `vencido há ${Math.abs(diffDias)} dia${Math.abs(diffDias) === 1 ? "" : "s"}`;

  return {
    dataFinal: fim.toLocaleDateString("pt-BR"),
    diffDias,
    textoPrazo,
  };
}

export default function ContratoCard({
  numero,
  contratada,
  objeto,
  query,
  vigencia,
  onClick,
}: ContratoCardProps) {
  const prazo = parsePrazo(vigencia);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer bg-white border border-slate-200 hover:border-blue-500 transition hover:shadow-md rounded-xl p-3"
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p
            className="text-base font-bold text-blue-700 leading-tight"
            dangerouslySetInnerHTML={{ __html: highlightTerm(numero, query) }}
          />
          <p
            className="text-sm font-semibold text-slate-700 leading-snug truncate"
            dangerouslySetInnerHTML={{ __html: highlightTerm(contratada, query) }}
          />
          <p
            className="text-xs text-slate-500 mt-1 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: highlightTerm(
                objeto || "Sem descrição do objeto",
                query
              ),
            }}
          />
        </div>

        <FiChevronRight className="text-slate-400 mt-1 shrink-0" />
      </div>

      {prazo && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
          <FiCalendar className="text-slate-400" />
          <span>
            até <strong>{prazo.dataFinal}</strong> —{" "}
            <span
              className={
                prazo.diffDias < 0
                  ? "text-red-600 font-medium"
                  : prazo.diffDias <= 15
                  ? "text-orange-500 font-medium"
                  : "text-green-600 font-medium"
              }
            >
              {prazo.textoPrazo}
            </span>
          </span>
        </div>
      )}
    </Card>
  );
}
