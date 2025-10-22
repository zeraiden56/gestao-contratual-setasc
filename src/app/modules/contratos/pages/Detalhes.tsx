"use client";
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContratos } from "../hooks/useContratos";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Progress } from "../../../components/ui/progress";
import {
  ArrowLeft,
  Home,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCcw,
  Layers,
  Package,
  Info,
  Clock,
  FileText,
  MapPin,
  DollarSign,
} from "lucide-react";

// ============================================
// HELPERS DE FORMATAÇÃO
// ============================================
const fmtBRL = (v?: number | null) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);

const fmtData = (d?: string | null) => {
  if (!d) return "Não informada";
  const data = new Date(d);
  if (isNaN(data.getTime())) return d;
  return data.toLocaleDateString("pt-BR");
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function DetalhesContrato() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contratos, loading } = useContratos();
  
  // Estado
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState<Record<string, boolean>>({
    "Informações Gerais": true,
    "Lotes": true,
    "Prorrogações e Reajustes": true,
    "Empenhos": true,
    "Pagamentos": true,
  });

  // Busca de contratos
  const resultados = useMemo(() => {
    if (!busca.trim()) return [];
    const termos = busca.toLowerCase().split(/\s+/);
    return contratos.filter((c) =>
      termos.every((t) =>
        `${c.numero} ${c.contratada} ${c.objeto} ${c.sigadoc}`
          .toLowerCase()
          .includes(t)
      )
    );
  }, [busca, contratos]);

  // Contrato atual
  const contrato = contratos.find((c) => c.id === Number(id));

  // ============================================
  // ESTADOS DE CARREGAMENTO E ERRO
  // ============================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Contrato não encontrado.
      </div>
    );
  }

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================
  const toggleSecao = (nome: string) =>
    setAbertas((p) => ({ ...p, [nome]: !p[nome] }));

  const linkSigadoc = contrato.sigadoc
    ? `https://www.sigadoc.mt.gov.br/sigaex/app/expediente/doc/exibir?sigla=${encodeURIComponent(
        contrato.sigadoc.trim()
      )}`
    : null;

  // ============================================
  // DADOS PROCESSADOS
  // ============================================
  const camposGerais = [
    { label: "Gestor", valor: contrato.gestor },
    { label: "Fiscal", valor: contrato.fiscal },
    { label: "Suplente", valor: contrato.suplente },
    { label: "Data de Início", valor: fmtData(contrato.dataInicio) },
    { label: "Data de Vencimento", valor: fmtData(contrato.dataVencimento) },
  ].filter((c) => c.valor && c.valor !== "-");

  const lotesLimpos = (contrato.lotes || []).filter(
    (l) => l.numero || l.descricao || l.valorTotal
  );

  const empenhosLimpos = (contrato.empenhos || []).filter(
    (e) => e.numero || e.valorEmpenhado
  );

  const aditivosLimpos = (contrato.aditivosDetalhe || []).filter(
    (a) => a.tipo || a.valorNovo
  );

  const pagamentosLimpos = (contrato.pagamentos || []).filter(
    (p) => p.valor || p.processo
  );

  const cardsFinanceiros = [
    { label: "Valor Inicial", valor: contrato.valorTotal, cor: "bg-green-600" },
    { label: "Total Empenhado", valor: contrato.empenhado, cor: "bg-indigo-600" },
    { label: "Total Estornado", valor: contrato.extornado, cor: "bg-rose-600" },
    { label: "Total Liquidado", valor: contrato.liquidado, cor: "bg-orange-500" },
    { label: "Total Pago", valor: contrato.pago, cor: "bg-sky-600" },
    { label: "Total Aditivos", valor: contrato.aditivos, cor: "bg-blue-700" },
    { label: "Saldo Atual", valor: contrato.restoEmpenhar, cor: "bg-emerald-600" },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 space-y-6">
      {/* ========== NAVEGAÇÃO E BUSCA ========== */}
      <header className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          {/* Botões de navegação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              aria-label="Ir para home"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>

          {/* Barra de busca */}
          <div className="relative flex-1 max-w-3xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar contrato por número, contratada ou objeto..."
              className="pl-10 rounded-full"
            />
            
            {/* Resultados da busca */}
            {busca && resultados.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {resultados.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      navigate(`/contratos/${r.id}`);
                      setBusca("");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                  >
                    <p className="font-medium text-sm">
                      {r.numero} — {r.contratada}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {r.objeto}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========== CABEÇALHO DO CONTRATO ========== */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {contrato.numero} — {contrato.contratada}
          </h1>
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-primary" /> {contrato.tipo}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary" /> {contrato.unidade}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              {fmtData(contrato.dataInicio)} — {fmtData(contrato.dataVencimento)}
            </span>
          </div>
        </div>
      </header>

      {/* ========== CARDS FINANCEIROS ========== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsFinanceiros.map((card) => {
          const perc = contrato.valorTotal
            ? Math.min((card.valor / contrato.valorTotal) * 100, 100)
            : 0;
          
          return (
            <Card
              key={card.label}
              className={`${card.cor} text-white border-0 shadow-md overflow-hidden`}
            >
              <CardContent className="p-4 space-y-2">
                <CardTitle className="text-sm font-semibold opacity-90">
                  {card.label}
                </CardTitle>
                <p className="text-xl sm:text-2xl font-bold">
                  {fmtBRL(card.valor)}
                </p>
                <Progress
                  value={perc}
                  className="h-1.5 bg-white/20"
                />
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* ========== SEÇÕES DETALHADAS ========== */}
      <section className="space-y-4">
        {/* Informações Gerais */}
        <Card className="shadow-sm">
          <CardHeader
            onClick={() => toggleSecao("Informações Gerais")}
            className="flex flex-row justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Info className="h-4 w-4" /> Informações Gerais
            </CardTitle>
            {abertas["Informações Gerais"] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
          
          {abertas["Informações Gerais"] && (
            <CardContent className="space-y-4">
              <div>
                <strong className="text-sm text-muted-foreground">Objeto:</strong>
                <p className="mt-1 leading-relaxed">{contrato.objeto}</p>
              </div>
              
              <div>
                <strong className="text-sm text-muted-foreground">Nº SIGADOC:</strong>
                <p className="mt-1">
                  {linkSigadoc ? (
                    <a
                      href={linkSigadoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {contrato.sigadoc}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Não informado</span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {camposGerais.map((campo, i) => (
                  <div key={i} className="bg-muted/30 p-3 rounded-lg border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {campo.label}
                    </p>
                    <p className="text-sm font-medium">{campo.valor}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Lotes */}
        <Card className="shadow-sm">
          <CardHeader
            onClick={() => toggleSecao("Lotes")}
            className="flex flex-row justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Package className="h-4 w-4" /> Lotes
            </CardTitle>
            {abertas["Lotes"] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
          
          {abertas["Lotes"] && (
            <CardContent>
              {lotesLimpos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-semibold">Lote</th>
                        <th className="p-2 text-left font-semibold">Item</th>
                        <th className="p-2 text-left font-semibold">Descrição</th>
                        <th className="p-2 text-right font-semibold">Qtd</th>
                        <th className="p-2 text-right font-semibold">Unitário</th>
                        <th className="p-2 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotesLimpos.map((lote, i) => (
                        <tr key={i} className="border-t hover:bg-muted/20">
                          <td className="p-2">{lote.numero}</td>
                          <td className="p-2">{lote.item}</td>
                          <td className="p-2">{lote.descricao}</td>
                          <td className="p-2 text-right">{lote.quantidade}</td>
                          <td className="p-2 text-right">{fmtBRL(lote.valorUnitario)}</td>
                          <td className="p-2 text-right font-medium">{fmtBRL(lote.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Sem lotes registrados
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Prorrogações e Reajustes */}
        <Card className="shadow-sm">
          <CardHeader
            onClick={() => toggleSecao("Prorrogações e Reajustes")}
            className="flex flex-row justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <RefreshCcw className="h-4 w-4" /> Prorrogações e Reajustes
            </CardTitle>
            {abertas["Prorrogações e Reajustes"] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
          
          {abertas["Prorrogações e Reajustes"] && (
            <CardContent>
              {aditivosLimpos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-semibold">Tipo</th>
                        <th className="p-2 text-left font-semibold">Data Início</th>
                        <th className="p-2 text-left font-semibold">Data Fim</th>
                        <th className="p-2 text-right font-semibold">Valor</th>
                        <th className="p-2 text-left font-semibold">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aditivosLimpos.map((aditivo, i) => (
                        <tr key={i} className="border-t hover:bg-muted/20">
                          <td className="p-2">{aditivo.tipo}</td>
                          <td className="p-2">{fmtData(aditivo.dataAssinatura)}</td>
                          <td className="p-2">{fmtData(aditivo.novaVigenciaFinal)}</td>
                          <td className="p-2 text-right font-medium">
                            {fmtBRL(aditivo.valorNovo)}
                          </td>
                          <td className="p-2">{aditivo.observacoes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Sem aditivos identificados
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Empenhos */}
        <Card className="shadow-sm">
          <CardHeader
            onClick={() => toggleSecao("Empenhos")}
            className="flex flex-row justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers className="h-4 w-4" /> Empenhos
            </CardTitle>
            {abertas["Empenhos"] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
          
          {abertas["Empenhos"] && (
            <CardContent>
              {empenhosLimpos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-semibold">Número</th>
                        <th className="p-2 text-left font-semibold">Data</th>
                        <th className="p-2 text-left font-semibold">Dotação</th>
                        <th className="p-2 text-right font-semibold">Valor Empenhado</th>
                        <th className="p-2 text-right font-semibold">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empenhosLimpos.map((empenho, i) => (
                        <tr key={i} className="border-t hover:bg-muted/20">
                          <td className="p-2">{empenho.numero}</td>
                          <td className="p-2">{empenho.data}</td>
                          <td className="p-2">{empenho.dotacao}</td>
                          <td className="p-2 text-right font-medium">
                            {fmtBRL(empenho.valorEmpenhado)}
                          </td>
                          <td className="p-2 text-right">{fmtBRL(empenho.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Sem empenhos registrados
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Pagamentos */}
        <Card className="shadow-sm">
          <CardHeader
            onClick={() => toggleSecao("Pagamentos")}
            className="flex flex-row justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <DollarSign className="h-4 w-4" /> Pagamentos
            </CardTitle>
            {abertas["Pagamentos"] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
          
          {abertas["Pagamentos"] && (
            <CardContent>
              {pagamentosLimpos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-semibold">Data</th>
                        <th className="p-2 text-left font-semibold">Processo</th>
                        <th className="p-2 text-left font-semibold">Mês Ref.</th>
                        <th className="p-2 text-left font-semibold">Empenho</th>
                        <th className="p-2 text-right font-semibold">Valor</th>
                        <th className="p-2 text-left font-semibold">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentosLimpos.map((pagamento, i) => (
                        <tr key={i} className="border-t hover:bg-muted/20">
                          <td className="p-2">{pagamento.data}</td>
                          <td className="p-2">{pagamento.processo}</td>
                          <td className="p-2">{pagamento.mesReferencia}</td>
                          <td className="p-2">{pagamento.empenho}</td>
                          <td className="p-2 text-right font-medium">
                            {fmtBRL(pagamento.valor)}
                          </td>
                          <td className="p-2">{pagamento.observacoes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Sem pagamentos identificados
                </p>
              )}
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  );
}
