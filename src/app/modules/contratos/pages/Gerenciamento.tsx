"use client";

import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { useContratos, Contrato } from "../hooks/useContratos";
import { useBuscaInteligente } from "../hooks/useBuscaInteligente";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

const PAGE_SIZE = 25;

// faixa fixa 2015–2026
const ANOS_FIXOS = Array.from({ length: 2026 - 2015 + 1 }, (_, i) => 2015 + i);

const extrairAno = (v?: string | null): number | undefined => {
  if (!v) return undefined;
  const m = String(v).match(/(\d{4})/);
  return m ? Number(m[1]) : undefined;
};

export default function GerenciamentoContratosPage() {
  const { contratos, loading } = useContratos();
  const navigate = useNavigate();

  const [termo, setTermo] = useState("");
  const [filtroAno, setFiltroAno] = useState<"todos" | number>("todos");
  const [filtroElemento, setFiltroElemento] = useState<"todos" | string>("todos");
  const [page, setPage] = useState(1);

  // elementos de despesa disponíveis (quando existir no hook)
  const elementosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    contratos.forEach((c) => {
      const el = (c as any).elementoDespesa;
      if (el) set.add(String(el));
    });
    return Array.from(set).sort();
  }, [contratos]);

  const baseFiltrada = useMemo(
    () =>
      contratos.filter((c) => {
        const anoContrato =
          extrairAno(c.dataInicio || "") ||
          extrairAno(c.dataVencimento || "") ||
          undefined;

        if (filtroAno !== "todos" && anoContrato !== filtroAno) return false;

        const elemento = (c as any).elementoDespesa;
        if (filtroElemento !== "todos" && elemento !== filtroElemento) {
          return false;
        }

        return true;
      }),
    [contratos, filtroAno, filtroElemento]
  );

  const {
    filtrados,
    highlight,
    loading: loadingBusca,
  } = useBuscaInteligente(
    baseFiltrada as unknown as Contrato[],
    termo,
    ["numero", "contratada", "objeto", "unidade", "sigadoc", "tipo"]
  );

  const lista = filtrados as unknown as typeof contratos;
  const isLoading = loading || loadingBusca;

  // resetar para página 1 quando filtros/busca mudam
  useEffect(() => {
    setPage(1);
  }, [termo, filtroAno, filtroElemento]);

  const total = lista.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, total);
  const pagina = lista.slice(startIndex, endIndex);

  const handleAnterior = () =>
    setPage((p) => Math.max(1, p - 1));
  const handleProxima = () =>
    setPage((p) => Math.min(pageCount, p + 1));

  return (
    <div
      className="min-h-screen relative overflow-hidden p-4 md:p-6 lg:p-8"
      style={{
        backgroundImage: "url('/brasao-estado-mt.jpeg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      {/* overlay claro */}
      <div className="absolute inset-0 bg-white/80" />

      {/* conteúdo */}
      <div className="relative space-y-4 max-w-7xl mx-auto">
        {/* Cabeçalho principal */}
        <div className="flex flex-col gap-1 mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Gerenciamento e Cadastro de Contratos
          </h1>
          <p className="text-xs md:text-sm text-slate-600">
            Cadastre novos contratos e gerencie os existentes em um único lugar.
          </p>
        </div>

        {/* Header de filtros + ações */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Busca + filtros */}
          <div className="flex-1 flex flex-col gap-2">
            {/* busca */}
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar por número, empresa, objeto..."
                className="pl-9 bg-white border-slate-300 rounded-full text-sm"
              />
            </div>

            {/* filtros */}
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between text-xs md:text-sm">
              {/* filtro ano */}
              <div className="flex items-center gap-2 flex-wrap text-slate-700">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <FiFilter className="h-3 w-3" />
                  <span>Ano:</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant={filtroAno === "todos" ? "default" : "outline"}
                    onClick={() => setFiltroAno("todos")}
                    className="rounded-full px-4 h-8 text-xs"
                  >
                    Todos
                  </Button>
                  {ANOS_FIXOS.map((ano) => (
                    <Button
                      key={ano}
                      size="sm"
                      variant={filtroAno === ano ? "default" : "outline"}
                      onClick={() => setFiltroAno(ano)}
                      className="rounded-full px-4 h-8 text-xs"
                    >
                      {ano}
                    </Button>
                  ))}
                </div>
              </div>

              {/* filtro elemento despesa */}
              <div className="flex items-center gap-2 flex-wrap text-slate-700">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <FiFilter className="h-3 w-3" />
                  <span>Elemento de Despesa:</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant={
                      filtroElemento === "todos" ? "default" : "outline"
                    }
                    onClick={() => setFiltroElemento("todos")}
                    className="rounded-full px-4 h-8 text-xs"
                  >
                    Todos
                  </Button>
                  {elementosDisponiveis.map((el) => (
                    <Button
                      key={el}
                      size="sm"
                      variant={filtroElemento === el ? "default" : "outline"}
                      onClick={() => setFiltroElemento(el)}
                      className="rounded-full px-4 h-8 text-xs"
                    >
                      {el}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Botão Novo contrato */}
          <div className="flex justify-end">
            <Button
              asChild
              className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs md:text-sm px-6 py-2 shadow-sm h-9 md:h-10"
            >
              <Link to="/contratos/gerenciamento/novo">+ Novo contrato</Link>
            </Button>
          </div>
        </div>

        {/* Card da tabela */}
        <Card className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-4 md:px-6 py-3 border-b bg-slate-50">
            <div className="flex flex-col">
              <CardTitle className="text-sm md:text-base font-semibold text-slate-700">
                Contratos cadastrados
              </CardTitle>
              <span className="text-[11px] md:text-xs text-slate-500">
                {isLoading
                  ? "Carregando..."
                  : total === 0
                  ? "Nenhum contrato encontrado para os filtros atuais."
                  : `Exibindo ${startIndex + 1}–${endIndex} de ${total} contrato${
                      total === 1 ? "" : "s"
                    } (página ${currentPage} de ${pageCount})`}
              </span>
            </div>

            {/* paginação topo */}
            {total > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 h-9"
                  disabled={currentPage <= 1}
                  onClick={handleAnterior}
                >
                  <FiChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 h-9"
                  disabled={currentPage >= pageCount}
                  onClick={handleProxima}
                >
                  <FiChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {total === 0 && !isLoading ? (
              <div className="p-6 text-sm text-center text-slate-500">
                Nenhum contrato encontrado para os filtros atuais.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-xs md:text-sm border-collapse">
                  <colgroup>
                    {/* Nº Contrato */}
                    <col className="w-[80px]" />
                    {/* Contratada */}
                    <col className="w-[190px] md:w-[220px]" />
                    {/* Objeto */}
                    <col className="w-auto" />
                    {/* Unidade */}
                    <col className="w-[150px]" />
                    {/* Vigência */}
                    <col className="w-[170px]" />
                    {/* Valor total */}
                    <col className="w-[130px]" />
                    {/* Ações */}
                    <col className="w-[120px]" />
                  </colgroup>
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-600 font-semibold">
                      <th className="px-3 md:px-4 py-2 text-left whitespace-nowrap">
                        Nº Contrato
                      </th>
                      <th className="px-3 md:px-4 py-2 text-left whitespace-nowrap">
                        Contratada
                      </th>
                      <th className="px-3 md:px-4 py-2 text-left">
                        Objeto
                      </th>
                      <th className="px-3 md:px-4 py-2 text-left whitespace-nowrap hidden lg:table-cell">
                        Unidade
                      </th>
                      <th className="px-3 md:px-4 py-2 text-left whitespace-nowrap hidden md:table-cell">
                        Vigência
                      </th>
                      <th className="px-3 md:px-4 py-2 text-right whitespace-nowrap hidden sm:table-cell">
                        Valor total
                      </th>
                      <th className="px-3 md:px-4 py-2 text-right whitespace-nowrap">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.map((c) => {
                      const slugParam = c.slug ?? encodeURIComponent(c.numero);

                      return (
                        <tr
                          key={c.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/contratos/gerenciamento/${slugParam}`
                            )
                          }
                        >
                          {/* Nº contrato */}
                          <td className="px-3 md:px-4 py-2 align-middle font-semibold text-slate-800 whitespace-nowrap">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlight(String(c.numero ?? "")),
                              }}
                            />
                          </td>

                          {/* Contratada */}
                          <td className="px-3 md:px-4 py-2 align-middle text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
                            <span
                              className="block max-w-[180px] md:max-w-[220px] truncate"
                              dangerouslySetInnerHTML={{
                                __html: highlight(String(c.contratada ?? "")),
                              }}
                            />
                          </td>

                          {/* Objeto */}
                          <td className="px-3 md:px-4 py-2 align-middle text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">
                            <span
                              className="block truncate"
                              dangerouslySetInnerHTML={{
                                __html: highlight(String(c.objeto ?? "")),
                              }}
                            />
                          </td>

                          {/* Unidade */}
                          <td className="px-3 md:px-4 py-2 align-middle text-slate-600 whitespace-nowrap hidden lg:table-cell">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlight(String(c.unidade ?? "")),
                              }}
                            />
                          </td>

                          {/* Vigência */}
                          <td className="px-3 md:px-4 py-2 align-middle text-slate-600 whitespace-nowrap hidden md:table-cell">
                            {c.dataInicio || "—"}
                            {c.dataVencimento && " a "}
                            {c.dataVencimento || ""}
                          </td>

                          {/* Valor total */}
                          <td className="px-3 md:px-4 py-2 align-middle text-right text-slate-800 whitespace-nowrap hidden sm:table-cell">
                            {c.valorTotal !== undefined
                              ? c.valorTotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })
                              : "—"}
                          </td>

                          {/* Ações */}
                          <td className="px-3 md:px-4 py-2 align-middle text-right whitespace-nowrap">
                            <Button
                              asChild
                              size="sm"
                              variant="default"
                              className="rounded-full px-5 h-9 text-xs bg-emerald-500 hover:bg-emerald-400 text-white"
                            >
                              <Link
                                to={`/contratos/gerenciamento/${slugParam}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Gerenciar
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* paginação inferior */}
            {total > 0 && (
              <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-slate-100 text-[11px] md:text-xs text-slate-500">
                <span>
                  Página {currentPage} de {pageCount}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-3 h-9"
                    disabled={currentPage <= 1}
                    onClick={handleAnterior}
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-3 h-9"
                    disabled={currentPage >= pageCount}
                    onClick={handleProxima}
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
