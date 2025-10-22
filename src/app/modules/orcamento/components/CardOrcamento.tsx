"use client";
import React from "react";

const DESCRICOES = {
  orcado: "Valor ajustado após créditos adicionais, anulações ou suplementações — o orçamento em vigor no momento.",
  empenhado: "Valor da despesa formalmente comprometido — o governo assumiu a obrigação de pagar.",
  liquidado: "Valor da despesa após comprovação da entrega do bem ou serviço.",
  pago: "Valor efetivamente desembolsado.",
};

interface CardOrcamentoProps {
  titulo: string;
  valor: number;
  percentual?: number;
  corFundo?: string;
  corTexto?: string;
  icone?: React.ReactNode;
  tooltip?: string;
}

export default function CardOrcamento({
  titulo,
  valor,
  percentual,
  corFundo = "bg-slate-700",
  corTexto = "text-white",
  icone,
  tooltip,
}: CardOrcamentoProps) {
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div
      className={`rounded-2xl shadow p-4 ${corFundo} ${corTexto} flex flex-col justify-between transition hover:scale-[1.01]`}
      title={tooltip || DESCRICOES[titulo.toLowerCase() as keyof typeof DESCRICOES]}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-base">{titulo}</div>
        {icone && <div className="opacity-80">{icone}</div>}
      </div>

      <div className="text-xl font-bold">{fmt(valor)}</div>

      {percentual !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-white/20 h-2 rounded">
            <div
              className="h-2 bg-white rounded"
              style={{ width: `${Math.min(percentual, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs mt-1 opacity-80 text-right">
            {percentual.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}
