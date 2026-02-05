"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { useContratos } from "@/app/modules/contratos/hooks/useContratos";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Progress } from "../../../components/ui/progress";
import {
  ArrowLeft,
  Home,
  Search,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  FileText,
  Layers,
  Users,
  Calculator,
  Info,
  Hash,
  FileSpreadsheet,
  ClipboardList,
  PenLine,
  Receipt,
  Package,
  Bookmark,
} from "lucide-react";

/* =========================
   Utils
========================= */
const fmtBRL = (valor?: number | string | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(valor) || 0
  );

const fmtData = (valor?: string) => {
  if (!valor) return "—";
  const d = new Date(valor);
  return isNaN(d.getTime()) ? valor : d.toLocaleDateString("pt-BR");
};

const fmt = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (!isNaN(Number(v)) && Number(v) > 0.009) return fmtBRL(v);
  if (String(v).match(/^\d{4}-\d{2}-\d{2}/)) return fmtData(v);
  return v;
};

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const destacar = (texto: string, termo: string) => {
  if (!termo) return texto;
  const regex = new RegExp(`(${termo})`, "gi");
  return texto.replace(regex, `<mark class="bg-yellow-200">$1</mark>`);
};

const getIcon = (nome: string) => {
  const n = nome.toLowerCase();
  if (n.includes("tipo")) return <PenLine size={14} />;
  if (n.includes("nº") || n.includes("numero")) return <Hash size={14} />;
  if (n.includes("data")) return <Calendar size={14} />;
  if (n.includes("vigência") || n.includes("vigencia")) return <Calendar size={14} />;
  if (n.includes("valor")) return <DollarSign size={14} />;
  if (n.includes("processo")) return <FileSpreadsheet size={14} />;
  if (n.includes("observa")) return <FileText size={14} />;
  if (n.includes("nota")) return <Receipt size={14} />;
  if (n.includes("setor")) return <Users size={14} />;
  if (n.includes("item")) return <Bookmark size={14} />;
  if (n.includes("descr")) return <Package size={14} />;
  if (n.includes("unidade")) return <Layers size={14} />;
  if (n.includes("quant")) return <ClipboardList size={14} />;
  return <Layers size={14} />;
};

const colunas: Record<string, string[]> = {
  Aditivos: [
    "Tipo",
    "Nº Aditivo",
    "Data Assinatura",
    "Nova Vigência Final",
    "Valor Novo",
    "Observações",
    "Processo de Prorrogação",
  ],
  Lotes: [
    "Nº Lote",
    "Item",
    "Descrição",
    "Unidade",
    "Quantidade",
    "Valor Unitário",
    "Valor Total",
  ],
  Empenhos: [
    "Nº Empenho",
    "Data",
    "Dotação",
    "Valor Empenhado",
    "Valor Liquidado",
    "Valor Estornado",
    "Saldo",
    "Observações",
  ],
  Pagamentos: [
    "Nº Ordem de Fornecimento",
    "Data",
    "Processo Pagamento",
    "Nota Fiscal",
    "Setor Demandante",
    "Empenho",
    "Valor",
    "Observações",
  ],
};

const somaTotais = (dados: any[], campos: string[]) => {
  const total: Record<string, number> = {};
  campos.forEach((c) => (total[c] = 0));
  dados.forEach((linha) => {
    campos.forEach((c) => {
      const v = linha?.[c];
      if (!isNaN(Number(v)) && v !== null && v !== "") total[c] += Number(v);
    });
  });
  return total;
};

/* =========================
   Detalhes
========================= */
export default function DetalhesContrato() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // hook: índice + fetch de detalhe
  const { contratos, loading, getContratoDetalhado } = useContratos();

  // busca dropdown
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 250);
  const [filtrados, setFiltrados] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // detalhe remoto
  const [detalheRemoto, setDetalheRemoto] = useState<any | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  // seções abertas
  const [abertas, setAbertas] = useState<Record<string, boolean>>({
    Gerais: true,
    Aditivos: true,
    Lotes: true,
    Empenhos: true,
    Pagamentos: true,
  });

  // contrato alvo
  const contratoSlug = decodeURIComponent(id || "");
  const contrato = useMemo(
    () =>
      contratos.find((c) => c.slug === contratoSlug) ||
      contratos.find((c) => c.numero === contratoSlug) ||
      contratos.find((c) => c.id === contratoSlug) ||
      null,
    [contratos, contratoSlug]
  );

  // identificador preferido para fetch do detalhe (estável)
  const identMemo = useMemo(() => {
    if (!contrato) return null;
    const nomeAba = (contrato as any).nomeAba?.trim();
    return nomeAba ? nomeAba : `${contrato.numero} - ${contrato.contratada}`;
  }, [contrato?.numero, contrato?.contratada, (contrato as any)?.nomeAba]);

  // estabiliza a função e evita refetch do mesmo ident
  const getDetRef = useRef(getContratoDetalhado);
  useEffect(() => {
    getDetRef.current = getContratoDetalhado;
  }, [getContratoDetalhado]);

  const lastIdentRef = useRef<string | null>(null);

  // carrega detalhe remoto sem loop
  useEffect(() => {
    if (!identMemo) return;
    if (lastIdentRef.current === identMemo) return; // já buscou esse

    let cancelado = false;
    setCarregandoDetalhe(true);

    (async () => {
      try {
        const det = await getDetRef.current(identMemo);
        if (!cancelado) {
          setDetalheRemoto(det || null);
          lastIdentRef.current = identMemo;
        }
      } catch (e) {
        if (!cancelado) setDetalheRemoto(null);
        console.error("Falha ao carregar detalhe remoto:", e);
      } finally {
        if (!cancelado) setCarregandoDetalhe(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [identMemo]);

  // busca global dropdown
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFiltrados([]);
      return;
    }
    const termos = normalizar(debouncedQuery).split(/\s+/).filter(Boolean);
    const results = contratos.filter((c) =>
      termos.every((t) =>
        normalizar(`${c.numero} ${c.contratada} ${c.objeto || ""}`).includes(t)
      )
    );
    setFiltrados(results.slice(0, 8));
  }, [debouncedQuery, contratos]);

  // fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-slate-500">
        Carregando...
      </div>
    );
  if (!contrato)
    return (
      <div className="p-6 text-center text-slate-500">
        Contrato não encontrado.
      </div>
    );

  // merge detalhe remoto com local
  const detalhes =
    detalheRemoto?.DETALHES ||
    detalheRemoto?.detalhes ||
    contrato.detalhes ||
    {};

  const cab =
    detalhes.CABECALHO ||
    detalhes.Cabecalho ||
    contrato.detalhes?.CABECALHO ||
    {};

  const valorTotal =
    Number(cab["Valor Inicial"]) ||
    Number(contrato.valorTotal || 0);

  const valorEmpenhado = Number(contrato.empenhado || 0);
  const valorGasto = Number(cab["Valor Gasto"] || contrato.pago || 0);
  const saldoAtual =
    Number(cab["Saldo Atual"]) ||
    Number(contrato.restoEmpenhar || 0);

  const processo = (cab["Processo"] || contrato.sigadoc || "")
    .toString()
    .trim();

  const toggle = (sec: string) =>
    setAbertas((p) => ({ ...p, [sec]: !p[sec] }));

  const aditivos = detalhes.ADITIVOS || detalhes.Aditivos || [];
  const lotes = detalhes.LOTES || detalhes.Lotes || [];
  const empenhos = detalhes.EMPENHOS || detalhes.Empenhos || [];
  const pagamentos = detalhes.PAGAMENTOS || detalhes.Pagamentos || [];

  const secoes = [
    { nome: "Aditivos", dados: aditivos },
    { nome: "Lotes", dados: lotes },
    { nome: "Empenhos", dados: empenhos },
    { nome: "Pagamentos", dados: pagamentos },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden p-6"
      style={{
        backgroundImage: "url('/brasao-estado-mt.jpeg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      {/* overlay igual ao dashboard */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-white/95 to-white pointer-events-none" />
      <div className="relative z-10 space-y-6">
        {/* Navegação + busca */}
        <div className="flex justify-between items-center relative">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/contratos")}>
              <Home />
            </Button>
          </div>

          {/* Busca inteligente dropdown */}
          <div className="relative w-96" ref={dropdownRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              placeholder="Buscar contrato..."
              className="pl-10 rounded-full bg-white"
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && query && (
              <div className="absolute top-11 left-0 right-0 bg-white border rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
                {filtrados.length > 0 ? (
                  filtrados.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        navigate(`/contratos/${c.slug}`);
                        setQuery("");
                        setShowDropdown(false);
                      }}
                      className="p-3 border-b last:border-none hover:bg-blue-50 cursor-pointer"
                    >
                      <p
                        className="font-medium text-slate-800 text-sm"
                        dangerouslySetInnerHTML={{
                          __html: destacar(`${c.numero ?? ""} — ${c.contratada ?? ""}`, debouncedQuery),
                        }}
                      />
                      <p
                        className="text-xs text-slate-600"
                        dangerouslySetInnerHTML={{
                          __html: destacar(c.objeto || "", debouncedQuery),
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-500 text-sm">
                    Nenhum contrato encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cabeçalho */}
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">
            {cab["Código do Contrato"] || contrato.numero}
          </h1>
          <p className="text-lg font-medium text-slate-600">
            {cab["Empresa"] || contrato.contratada}
          </p>

          {processo && (
            <a
              href={`https://www.sigadoc.mt.gov.br/sigaex/app/expediente/doc/exibir?sigla=${encodeURIComponent(
                processo
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline inline-flex items-center gap-1"
            >
              <LinkIcon size={14} /> Processo SIGADOC: {processo}
            </a>
          )}

          <div className="flex justify-center items-center gap-3 text-sm text-slate-600">
            <Calendar size={14} />
            <span>
              {fmtData(cab["Data de Início"] || contrato.dataInicio)} —{" "}
              {fmtData(cab["Data de Vencimento"] || contrato.dataVencimento)}
            </span>
          </div>

          {carregandoDetalhe && (
            <p className="text-xs text-slate-400 mt-1">Carregando dados detalhados…</p>
          )}
        </header>

        {/* Cards principais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {[
            {
              label: "Valor Total",
              valor: valorTotal,
              cor: "from-green-500 to-emerald-600",
              icon: <DollarSign size={16} />,
              pct: 100,
            },
            {
              label: "Empenhado",
              valor: valorEmpenhado,
              cor: "from-indigo-500 to-purple-600",
              icon: <Layers size={16} />,
              pct: valorTotal ? (valorEmpenhado / valorTotal) * 100 : 0,
            },
            {
              label: "Liquidado",
              valor: valorGasto,
              cor: "from-orange-400 to-orange-600",
              icon: <Users size={16} />,
              pct: valorTotal ? (valorGasto / valorTotal) * 100 : 0,
            },
            {
              label: "Saldo Atual",
              valor: saldoAtual,
              cor: "from-cyan-500 to-sky-600",
              icon: <Calculator size={16} />,
              pct: valorTotal ? (saldoAtual / valorTotal) * 100 : 0,
            },
          ].map((c) => (
            <Card
              key={c.label}
              className={`rounded-2xl shadow-md bg-gradient-to-r ${c.cor} text-white`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    {c.icon} {c.label}
                  </div>
                  <span className="text-xs opacity-80">
                    {isFinite(c.pct) ? `${c.pct.toFixed(1)}%` : "0%"}
                  </span>
                </div>
                <p className="text-2xl font-bold">{fmtBRL(c.valor)}</p>
                <Progress value={c.pct} className="h-1 bg-white/40" />
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Informações Gerais */}
        <Card className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm">
          <CardHeader
            onClick={() => toggle("Gerais")}
            className="cursor-pointer flex justify-between items-center hover:bg-slate-50/70"
          >
            <CardTitle className="flex gap-2 items-center text-slate-800">
              <Info size={18} className="text-blue-600" /> Informações Gerais
            </CardTitle>
            {abertas.Gerais ? <ChevronUp /> : <ChevronDown />}
          </CardHeader>
          {abertas.Gerais && (
            <CardContent className="space-y-2 text-slate-700">
              <p>{cab["Objeto"] || contrato.objeto || "—"}</p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm mt-3">
                <div className="p-3 bg-emerald-50 border rounded-lg">
                  <b>Gestor:</b> {cab["Gestor"] || "—"}
                </div>
                <div className="p-3 bg-blue-50 border rounded-lg">
                  <b>Fiscal:</b> {cab["Fiscal"] || "—"}
                </div>
                <div className="p-3 bg-amber-50 border rounded-lg">
                  <b>Suplente:</b> {cab["Suplente"] || "—"}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabelas: Aditivos, Lotes, Empenhos, Pagamentos */}
        {secoes.map(({ nome, dados }) => {
          const cols = colunas[nome];
          const totais = somaTotais(dados, cols);
          return (
            <Card key={nome} className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm">
              <CardHeader
                onClick={() => toggle(nome)}
                className="cursor-pointer flex justify-between items-center hover:bg-slate-50/70"
              >
                <CardTitle className="flex gap-2 items-center text-slate-800">
                  <Layers size={18} className="text-slate-700" /> {nome}{" "}
                  <span className="text-slate-400 text-sm font-normal">
                    ({Array.isArray(dados) ? dados.length : 0})
                  </span>
                </CardTitle>
                {abertas[nome] ? <ChevronUp /> : <ChevronDown />}
              </CardHeader>
              {abertas[nome] && (
                <CardContent>
                  {Array.isArray(dados) && dados.length ? (
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-lg border">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-100 border-b sticky top-0">
                          <tr>
                            {cols.map((c) => (
                              <th key={c} className="p-2 text-left font-semibold text-slate-700">
                                <div className="flex items-center gap-1">
                                  {getIcon(c)} {c}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dados.map((linha: any, i: number) => (
                            <tr
                              key={i}
                              className={`${i % 2 ? "bg-slate-50" : "bg-white"} border-t`}
                            >
                              {cols.map((c) => (
                                <td key={c} className="p-2 text-slate-800 align-top">
                                  {fmt(linha?.[c])}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr className="bg-blue-50 font-semibold border-t border-blue-200">
                            {cols.map((c) => (
                              <td key={c} className="p-2 text-blue-800">
                                {totais[c] ? fmtBRL(totais[c]) : ""}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-sm">
                      Nenhum registro em {nome.toLowerCase()}.
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
