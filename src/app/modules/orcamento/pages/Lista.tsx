import { useOrcamentoLocal } from "../hooks/useOrcamentoLocal";

export default function Lista() {
  const { dados, loading } = useOrcamentoLocal();
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tabela Orçamentária</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">UO</th>
            <th className="p-2">Sigla</th>
            <th className="p-2 text-right">Orçado Inicial</th>
            <th className="p-2 text-right">Orçado Atual</th>
            <th className="p-2 text-right">Empenhado</th>
            <th className="p-2 text-right">Liquidado</th>
            <th className="p-2 text-right">Pago</th>
            <th className="p-2 text-right">Livre</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.UO} className="border-b">
              <td className="p-2">{d.UO}</td>
              <td className="p-2">{d.SIGLA}</td>
              <td className="p-2 text-right">{fmt(d.orcado_inicial)}</td>
              <td className="p-2 text-right">{fmt(d.orcado_atual)}</td>
              <td className="p-2 text-right">{fmt(d.empenhado)}</td>
              <td className="p-2 text-right">{fmt(d.liquidado)}</td>
              <td className="p-2 text-right">{fmt(d.pago)}</td>
              <td className="p-2 text-right">{fmt(d.livre)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
