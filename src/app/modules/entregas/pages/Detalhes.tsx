"use client";

import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEntregas } from "../hooks/useEntregas";

export default function EntregasDetalhes() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const programa = params.get("programa") ?? "(sem valor)";
  const ano = params.get("ano") ? Number(params.get("ano")) : undefined;
  const cidade = params.get("cidade") ?? "";

  const { loading, error, getItensDoPrograma } = useEntregas({
    chunkSize: 0,
    groupBy: "produto_tipo", // mude aqui se o Dashboard usar outra chave
  });

  const itens = useMemo(
    () => getItensDoPrograma({ nome: programa, ano, cidade }),
    [getItensDoPrograma, programa, ano, cidade]
  );

  const totalValor = itens.reduce((s, r) => s + (r.valor_total || 0), 0);
  const totalQtd = itens.reduce((s, r) => s + (r.qtde || 0), 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {programa}
          {ano ? ` — ${ano}` : ""} {cidade ? ` — ${cidade}` : ""}
        </h1>
        {loading && <span className="text-sm text-gray-500">carregando…</span>}
        {error && <span className="text-sm text-red-600">Erro: {error}</span>}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="px-4 py-3 rounded-xl bg-white border">
          <div className="text-xs text-gray-500">Valor total</div>
          <div className="text-lg font-semibold">
            R$ {totalValor.toLocaleString("pt-BR")}
          </div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-white border">
          <div className="text-xs text-gray-500">Quantidade total</div>
          <div className="text-lg font-semibold">
            {totalQtd.toLocaleString("pt-BR")}
          </div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-white border">
          <div className="text-xs text-gray-500">Registros</div>
          <div className="text-lg font-semibold">{itens.length}</div>
        </div>
      </div>

      {/* Tabela simples */}
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Entrega</th>
              <th className="text-left px-4 py-3">Local</th>
              <th className="text-left px-4 py-3">Ação</th>
              <th className="text-left px-4 py-3">Início</th>
              <th className="text-left px-4 py-3">Conclusão</th>
              <th className="text-right px-4 py-3">Qtde</th>
              <th className="text-right px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.produto ?? r.acao ?? "—"}</td>
                <td className="px-4 py-3">{r.local ?? "—"}</td>
                <td className="px-4 py-3">{r.acao ?? "—"}</td>
                <td className="px-4 py-3">{r.data_inicio ?? "—"}</td>
                <td className="px-4 py-3">{r.data_conclusao ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {(r.qtde ?? 0).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right">
                  R$ {(r.valor_total ?? 0).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                  Nenhum registro encontrado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
