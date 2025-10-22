"use client";

import React from "react";
import { Despesa } from "../hooks/useOrcamentoLocal"; // ← use o mesmo tipo

export default function TabelaOrcamento({ dados }: { dados: Despesa[] }) {
  const formatarValor = (valor: number | undefined) =>
    valor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg border">
      <table className="min-w-full border-collapse">
        <thead className="bg-blue-600 text-white text-sm uppercase">
          <tr>
            <th className="px-4 py-2 text-left">Ação Orçamentária</th>
            <th className="px-4 py-2 text-right">Fonte</th>
            <th className="px-4 py-2 text-right">Orçado Inicial</th>
            <th className="px-4 py-2 text-right">Orçado Atual</th>
            <th className="px-4 py-2 text-right">Bloqueado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {dados.map((linha, i) => (
            <tr key={i} className="hover:bg-blue-50">
              <td className="px-4 py-2">{linha.paoe || "-"}</td>
              <td className="px-4 py-2 text-right">{linha.fonte || "-"}</td>
              <td className="px-4 py-2 text-right">
                {formatarValor(linha.orcado_inicial)}
              </td>
              <td className="px-4 py-2 text-right">
                {formatarValor(linha.orcado_atual)}
              </td>
              <td className="px-4 py-2 text-right">
                {formatarValor(linha.bloqueado_creditos)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
