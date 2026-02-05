"use client";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiChevronLeft, FiChevronRight, FiSliders } from "react-icons/fi";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useContratos } from "../hooks/useContratos";
import { useBuscaInteligente } from "../hooks/useBuscaInteligente";
import { DollarSign, Calendar, Info, Link as LinkIcon, Layers } from "lucide-react";

const fmtBRL = (valor?: number | string | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);

const fmtData = (valor?: string) => {
  if (!valor) return "—";
  const d = new Date(valor);
  return isNaN(d.getTime()) ? valor : d.toLocaleDateString("pt-BR");
};

// extrai ano tanto de "2025-01-01" quanto de "057/2025"
function extrairAno(c: { numero?: string; dataInicio?: string; dataVencimento?: string }) {
  const direto =
    (c.dataInicio && /\d{4}/.exec(c.dataInicio)?.[0]) ||
    (c.dataVencimento && /\d{4}/.exec(c.dataVencimento)?.[0]);
  if (direto) return direto;
  const doNumero = c.numero && /\d{4}$/.exec(c.numero)?.[0];
  return doNumero || "";
}

export default function ListaContratosAvancada() {
  const { contratos, loading } = useContratos();
  const navigate = useNavigate();

  // === Busca e filtros ===
  const [query, setQuery] = useState("");
  const [ano, setAno] = useState("");
  const [tipo, setTipo] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [selecionado, setSelecionado] = useState<any | null>(null);

  const { filtrados, highlight } = useBuscaInteligente(
    contratos as any[],
    query,
    ["numero", "contratada", "objeto", "sigadoc"]
  );

  // Filtros avançados aplicados localmente
  const filtradosComFiltro = useMemo(() => {
    return filtrados.filter((c: any) => {
      const anoContrato = extrairAno(c);
      const anoOk = !ano || anoContrato.includes(ano);
      const tipoOk = !tipo || (c.tipo || "").toLowerCase().includes(tipo.toLowerCase());
      const valor = Number(c.valorTotal || 0);
      const minOk = !valorMin || valor >= Number(valorMin);
      const maxOk = !valorMax || valor <= Number(valorMax);
      return anoOk && tipoOk && minOk && maxOk;
    });
  }, [filtrados, ano, tipo, valorMin, valorMax]);

  // Paginação
  const [pagina, setPagina] = useState(1);
  const porPagina = 12;
  const totalPaginas = Math.ceil(filtradosComFiltro.length / porPagina);
  const visiveis = useMemo(() => {
    const start = (pagina - 1) * porPagina;
    return filtradosComFiltro.slice(start, start + porPagina);
  }, [filtradosComFiltro, pagina]);

  const mudarPagina = (n: number) =>
    setPagina((p) => Math.max(1, Math.min(totalPaginas, p + n)));

  // Reset seleção ao mudar filtros/busca
  useEffect(() => {
    setSelecionado(null);
  }, [query, ano, tipo, valorMin, valorMax]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-slate-500 text-lg">
        Carregando contratos...
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50">
      {/* Painel de filtros e lista */}
      <div className="lg:w-1/2 xl:w-2/5 p-6 border-r border-slate-200 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <FiSearch className="text-slate-400" />
          <Input
            placeholder="Pesquisar contrato por número, empresa ou objeto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <details className="mb-4 bg-white border rounded-lg p-3 shadow-sm">
          <summary className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
            <FiSliders /> Filtros avançados
          </summary>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Input
              placeholder="Ano..."
              value={ano}
              onChange={(e) => setAno(e.target.value)}
            />
            <Input
              placeholder="Tipo de contrato..."
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            />
            <Input
              placeholder="Valor mín..."
              type="number"
              value={valorMin}
              onChange={(e) => setValorMin(e.target.value)}
            />
            <Input
              placeholder="Valor máx..."
              type="number"
              value={valorMax}
              onChange={(e) => setValorMax(e.target.value)}
            />
          </div>
        </details>

        {/* Lista */}
        {visiveis.length === 0 ? (
          <p className="text-slate-500 text-center mt-6">
            Nenhum contrato encontrado.
          </p>
        ) : (
          <div className="grid gap-3">
            {visiveis.map((c: any) => (
              <Card
                key={c.id}
                onClick={() => setSelecionado(c)}
                className={`cursor-pointer transition-all border-2 ${
                  selecionado?.id === c.id
                    ? "border-blue-500 shadow-md"
                    : "border-transparent hover:border-blue-200"
                }`}
              >
                <CardContent className="p-4">
                  <p
                    className="font-semibold text-slate-800"
                    dangerouslySetInnerHTML={{
                      __html: highlight(`${c.numero} — ${c.contratada}`),
                    }}
                  />
                  <p
                    className="text-sm text-slate-600"
                    dangerouslySetInnerHTML={{
                      __html: highlight(c.objeto || ""),
                    }}
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>
                      {fmtData(c.dataInicio)} — {fmtData(c.dataVencimento)}
                    </span>
                    <span>{fmtBRL(c.valorTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex justify-center gap-3 mt-4 items-center">
            <Button variant="outline" onClick={() => mudarPagina(-1)} disabled={pagina === 1}>
              <FiChevronLeft />
            </Button>
            <span className="text-slate-600 text-sm">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              onClick={() => mudarPagina(1)}
              disabled={pagina === totalPaginas}
            >
              <FiChevronRight />
            </Button>
          </div>
        )}
      </div>

      {/* Painel de detalhes */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selecionado ? (
          <div className="flex flex-col justify-center items-center h-full text-slate-400 italic">
            <Info size={32} className="mb-2" />
            Selecione um contrato para ver os detalhes.
          </div>
        ) : (
          <div className="space-y-6">
            <header className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-800">{selecionado.numero}</h2>
              <p className="text-slate-600 font-medium">{selecionado.contratada}</p>
              {selecionado.sigadoc && (
                <a
                  href={`https://www.sigadoc.mt.gov.br/sigaex/app/expediente/doc/exibir?sigla=${encodeURIComponent(
                    selecionado.sigadoc
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline flex justify-center items-center gap-1"
                >
                  <LinkIcon size={14} /> Processo SIGADOC: {selecionado.sigadoc}
                </a>
              )}
            </header>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Info size={16} className="text-blue-600" /> Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-2">
                <p>{selecionado.objeto || "Sem descrição."}</p>
                <p>
                  <Calendar size={14} className="inline mr-1" />
                  Vigência: {fmtData(selecionado.dataInicio)} — {fmtData(selecionado.dataVencimento)}
                </p>
                <p>
                  <Layers size={14} className="inline mr-1" /> Tipo: {selecionado.tipo || "—"}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <DollarSign size={16} className="text-green-600" /> Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="p-2 bg-emerald-50 rounded">
                    <b>Total:</b> {fmtBRL(selecionado.valorTotal)}
                  </div>
                  <div className="p-2 bg-indigo-50 rounded">
                    <b>Empenhado:</b> {fmtBRL(selecionado.empenhado)}
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <b>Utilizado (índice):</b> {fmtBRL(selecionado.liquidado)}
                  </div>
                  <div className="p-2 bg-cyan-50 rounded">
                    <b>Saldo Atual:</b> {fmtBRL(selecionado.saldoAtual)}
                  </div>
                  <div className="p-2 bg-amber-50 rounded">
                    <b>Resto a Empenhar:</b> {fmtBRL(selecionado.restoEmpenhar)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={() => navigate(`/contratos/${selecionado.slug}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Ver página completa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
