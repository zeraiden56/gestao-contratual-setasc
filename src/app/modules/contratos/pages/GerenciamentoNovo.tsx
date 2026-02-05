"use client";

import {
  FormEvent,
  useState,
  ChangeEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";

interface NovoContratoForm {
  numero: string;
  processo: string;
  contratada: string;
  tipo: string;
  objeto: string;
  unidade: string;
  ano: string;
  valorTotal: string;
  dataInicio: string;
  dataVencimento: string;
  gestor: string;
  fiscal: string;
  suplente: string;
}

// === Estruturas de detalhe (alinhadas ao CSV) ===
interface AditivoForm {
  id: string;
  tipo: string;
  numero: string;
  dataAssinatura: string;
  novaVigenciaFinal: string;
  valorNovo: string;
  observacoes: string;
  processoProrrogacao: string;
}

interface LoteForm {
  id: string;
  numeroLote: string;
  item: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  valorTotal: string;
}

interface EmpenhoForm {
  id: string;
  numeroEmpenho: string;
  data: string;
  dotacao: string;
  valorEmpenhado: string;
  valorLiquidado: string;
  valorEstornado: string;
  saldo: string;
  observacoes: string;
}

interface PagamentoForm {
  id: string;
  numeroOrdem: string;
  data: string;
  processoPagamento: string;
  notaFiscal: string;
  status: string;
  valor: string;
  empenhoRelaciondo: string;
}

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export default function GerenciamentoNovoContratoPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<NovoContratoForm>({
    numero: "",
    processo: "",
    contratada: "",
    tipo: "",
    objeto: "",
    unidade: "",
    ano: "",
    valorTotal: "",
    dataInicio: "",
    dataVencimento: "",
    gestor: "",
    fiscal: "",
    suplente: "",
  });

  const [aditivos, setAditivos] = useState<AditivoForm[]>([]);
  const [lotes, setLotes] = useState<LoteForm[]>([]);
  const [empenhos, setEmpenhos] = useState<EmpenhoForm[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoForm[]>([]);

  function handleChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function parseValorToNumber(v: string): number | null {
    if (!v) return null;
    const s = v.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return isNaN(n) ? null : n;
  }

  // === helpers de listas =========================
  function updateRow<T extends { id: string }>(
    list: T[],
    setList: (fn: (prev: T[]) => T[]) => void,
    id: string,
    field: keyof T,
    value: string
  ) {
    setList((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  }

  function removeRow<T extends { id: string }>(
    setList: (fn: (prev: T[]) => T[] ) => void,
    id: string
  ) {
    setList((prev) => prev.filter((row) => row.id !== id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      cabecalho: {
        ...form,
        valorTotalNumber: parseValorToNumber(form.valorTotal),
      },
      aditivos: aditivos.map((a) => ({
        ...a,
        valorNovoNumber: parseValorToNumber(a.valorNovo),
      })),
      lotes: lotes.map((l) => ({
        ...l,
        quantidadeNumber: parseValorToNumber(l.quantidade),
        valorUnitarioNumber: parseValorToNumber(l.valorUnitario),
        valorTotalNumber: parseValorToNumber(l.valorTotal),
      })),
      empenhos: empenhos.map((e) => ({
        ...e,
        valorEmpenhadoNumber: parseValorToNumber(e.valorEmpenhado),
        valorLiquidadoNumber: parseValorToNumber(e.valorLiquidado),
        valorEstornadoNumber: parseValorToNumber(e.valorEstornado),
        saldoNumber: parseValorToNumber(e.saldo),
      })),
      pagamentos: pagamentos.map((p) => ({
        ...p,
        valorNumber: parseValorToNumber(p.valor),
      })),
    };

    // 👉 futuramente: POST /contratos
    console.log("Novo contrato cadastrado (fake payload):", payload);

    navigate("/contratos/gerenciamento");
  }

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
      <div className="absolute inset-0 bg-white/80" />

      <div className="relative max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                Novo contrato
              </h1>
              <p className="text-xs md:text-sm text-slate-600">
                Preencha os dados do contrato e seus detalhes
                financeiros.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            form="novo-contrato-form"
            className="rounded-full px-5 h-10 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400"
          >
            <FiSave className="h-4 w-4" />
            Salvar contrato
          </Button>
        </div>

        <form
          id="novo-contrato-form"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {/* DADOS PRINCIPAIS */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-base">
                Dados principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nº do contrato
                  </label>
                  <Input
                    id="numero"
                    name="numero"
                    value={form.numero}
                    onChange={handleChange}
                    required
                    placeholder="043/2025/SETASC"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ano
                  </label>
                  <Input
                    id="ano"
                    name="ano"
                    value={form.ano}
                    onChange={handleChange}
                    placeholder="2025"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tipo de contrato
                  </label>
                  <Input
                    id="tipo"
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    placeholder="Contrato, Ata de Registro, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Processo (SIGADOC / SEI)
                  </label>
                  <Input
                    id="processo"
                    name="processo"
                    value={form.processo}
                    onChange={handleChange}
                    placeholder="SETASC-PRO-2025/000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Unidade orçamentária
                  </label>
                  <Input
                    id="unidade"
                    name="unidade"
                    value={form.unidade}
                    onChange={handleChange}
                    placeholder="SECR. ESTADUAL DE ..."
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Contratada
                  </label>
                  <Input
                    id="contratada"
                    name="contratada"
                    value={form.contratada}
                    onChange={handleChange}
                    placeholder="EMPRESA EXEMPLO LTDA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Objeto do contrato
                </label>
                <textarea
                  id="objeto"
                  name="objeto"
                  value={form.objeto}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  placeholder="Descreva resumidamente o objeto do contrato..."
                />
              </div>
            </CardContent>
          </Card>

          {/* VIGÊNCIA / VALORES */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-base">
                Vigência e valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Data de início
                  </label>
                  <Input
                    id="dataInicio"
                    name="dataInicio"
                    type="date"
                    value={form.dataInicio}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Data de vencimento
                  </label>
                  <Input
                    id="dataVencimento"
                    name="dataVencimento"
                    type="date"
                    value={form.dataVencimento}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valor total do contrato (R$)
                  </label>
                  <Input
                    id="valorTotal"
                    name="valorTotal"
                    value={form.valorTotal}
                    onChange={handleChange}
                    placeholder="291.289,41"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RESPONSÁVEIS */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-base">
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Gestor(a)
                  </label>
                  <Input
                    id="gestor"
                    name="gestor"
                    value={form.gestor}
                    onChange={handleChange}
                    placeholder="Nome completo / matrícula"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Fiscal
                  </label>
                  <Input
                    id="fiscal"
                    name="fiscal"
                    value={form.fiscal}
                    onChange={handleChange}
                    placeholder="Nome completo / matrícula"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Suplente
                  </label>
                  <Input
                    id="suplente"
                    name="suplente"
                    value={form.suplente}
                    onChange={handleChange}
                    placeholder="Nome completo / matrícula"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ADITIVOS */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm md:text-base">
                Aditivos ({aditivos.length})
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 h-8 text-xs flex items-center gap-1"
                onClick={() =>
                  setAditivos((prev) => [
                    ...prev,
                    {
                      id: makeId(),
                      tipo: "",
                      numero: "",
                      dataAssinatura: "",
                      novaVigenciaFinal: "",
                      valorNovo: "",
                      observacoes: "",
                      processoProrrogacao: "",
                    },
                  ])
                }
              >
                <FiPlus className="h-3 w-3" />
                Adicionar aditivo
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {aditivos.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  Nenhum aditivo cadastrado.
                </p>
              )}

              {aditivos.map((a, idx) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      Aditivo #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() =>
                        removeRow<AditivoForm>(setAditivos, a.id)
                      }
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Tipo
                      </label>
                      <Input
                        value={a.tipo}
                        onChange={(e) =>
                          updateRow(
                            aditivos,
                            setAditivos,
                            a.id,
                            "tipo",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Nº Aditivo
                      </label>
                      <Input
                        value={a.numero}
                        onChange={(e) =>
                          updateRow(
                            aditivos,
                            setAditivos,
                            a.id,
                            "numero",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Data assinatura
                      </label>
                      <Input
                        type="date"
                        value={a.dataAssinatura}
                        onChange={(e) =>
                          updateRow(
                            aditivos,
                            setAditivos,
                            a.id,
                            "dataAssinatura",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Nova vigência final
                      </label>
                      <Input
                        type="date"
                        value={a.novaVigenciaFinal}
                        onChange={(e) =>
                          updateRow(
                            aditivos,
                            setAditivos,
                            a.id,
                            "novaVigenciaFinal",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Valor novo (R$)
                      </label>
                      <Input
                        value={a.valorNovo}
                        onChange={(e) =>
                          updateRow(
                            aditivos,
                            setAditivos,
                            a.id,
                            "valorNovo",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Processo de prorrogação
                      </label>
                      <Input
                        value={a.processoProrrogacao}
                        onChange={(e) =>
                          updateRow(
                            aditivos,
                            setAditivos,
                            a.id,
                            "processoProrrogacao",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Observações
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      value={a.observacoes}
                      onChange={(e) =>
                        updateRow(
                          aditivos,
                          setAditivos,
                          a.id,
                          "observacoes",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* LOTES */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm md:text-base">
                Lotes / Itens ({lotes.length})
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 h-8 text-xs flex items-center gap-1"
                onClick={() =>
                  setLotes((prev) => [
                    ...prev,
                    {
                      id: makeId(),
                      numeroLote: "",
                      item: "",
                      descricao: "",
                      unidade: "",
                      quantidade: "",
                      valorUnitario: "",
                      valorTotal: "",
                    },
                  ])
                }
              >
                <FiPlus className="h-3 w-3" />
                Adicionar lote
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {lotes.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  Nenhum registro em lotes.
                </p>
              )}

              {lotes.map((l, idx) => (
                <div
                  key={l.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      Lote #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => removeRow<LoteForm>(setLotes, l.id)}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Nº Lote
                      </label>
                      <Input
                        value={l.numeroLote}
                        onChange={(e) =>
                          updateRow(
                            lotes,
                            setLotes,
                            l.id,
                            "numeroLote",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Item
                      </label>
                      <Input
                        value={l.item}
                        onChange={(e) =>
                          updateRow(
                            lotes,
                            setLotes,
                            l.id,
                            "item",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Unidade
                      </label>
                      <Input
                        value={l.unidade}
                        onChange={(e) =>
                          updateRow(
                            lotes,
                            setLotes,
                            l.id,
                            "unidade",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Quantidade
                      </label>
                      <Input
                        value={l.quantidade}
                        onChange={(e) =>
                          updateRow(
                            lotes,
                            setLotes,
                            l.id,
                            "quantidade",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Valor unitário (R$)
                      </label>
                      <Input
                        value={l.valorUnitario}
                        onChange={(e) =>
                          updateRow(
                            lotes,
                            setLotes,
                            l.id,
                            "valorUnitario",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Descrição do item
                      </label>
                      <textarea
                        rows={2}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        value={l.descricao}
                        onChange={(e) =>
                          updateRow(
                            lotes,
                            setLotes,
                            l.id,
                            "descricao",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="max-w-xs">
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Valor total do lote (R$)
                      </label>
                      <Input
                        value={l.valorTotal}
                        onChange={(e) =>
                          updateRow(
                            lotes,
                            setLotes,
                            l.id,
                            "valorTotal",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* EMPENHOS */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm md:text-base">
                Empenhos ({empenhos.length})
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 h-8 text-xs flex items-center gap-1"
                onClick={() =>
                  setEmpenhos((prev) => [
                    ...prev,
                    {
                      id: makeId(),
                      numeroEmpenho: "",
                      data: "",
                      dotacao: "",
                      valorEmpenhado: "",
                      valorLiquidado: "",
                      valorEstornado: "",
                      saldo: "",
                      observacoes: "",
                    },
                  ])
                }
              >
                <FiPlus className="h-3 w-3" />
                Adicionar empenho
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {empenhos.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  Nenhum registro em empenhos.
                </p>
              )}

              {empenhos.map((emp, idx) => (
                <div
                  key={emp.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      Empenho #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() =>
                        removeRow<EmpenhoForm>(setEmpenhos, emp.id)
                      }
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Nº Empenho
                      </label>
                      <Input
                        value={emp.numeroEmpenho}
                        onChange={(e) =>
                          updateRow(
                            empenhos,
                            setEmpenhos,
                            emp.id,
                            "numeroEmpenho",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Data
                      </label>
                      <Input
                        type="date"
                        value={emp.data}
                        onChange={(e) =>
                          updateRow(
                            empenhos,
                            setEmpenhos,
                            emp.id,
                            "data",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Dotação
                      </label>
                      <Input
                        value={emp.dotacao}
                        onChange={(e) =>
                          updateRow(
                            empenhos,
                            setEmpenhos,
                            emp.id,
                            "dotacao",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Valor empenhado (R$)
                      </label>
                      <Input
                        value={emp.valorEmpenhado}
                        onChange={(e) =>
                          updateRow(
                            empenhos,
                            setEmpenhos,
                            emp.id,
                            "valorEmpenhado",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Valor liquidado (R$)
                      </label>
                      <Input
                        value={emp.valorLiquidado}
                        onChange={(e) =>
                          updateRow(
                            empenhos,
                            setEmpenhos,
                            emp.id,
                            "valorLiquidado",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Valor estornado (R$)
                      </label>
                      <Input
                        value={emp.valorEstornado}
                        onChange={(e) =>
                          updateRow(
                            empenhos,
                            setEmpenhos,
                            emp.id,
                            "valorEstornado",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Saldo (R$)
                      </label>
                      <Input
                        value={emp.saldo}
                        onChange={(e) =>
                          updateRow(
                            empenhos,
                            setEmpenhos,
                            emp.id,
                            "saldo",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Observações
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      value={emp.observacoes}
                      onChange={(e) =>
                        updateRow(
                          empenhos,
                          setEmpenhos,
                          emp.id,
                          "observacoes",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* PAGAMENTOS */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm md:text-base">
                Pagamentos ({pagamentos.length})
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 h-8 text-xs flex items-center gap-1"
                onClick={() =>
                  setPagamentos((prev) => [
                    ...prev,
                    {
                      id: makeId(),
                      numeroOrdem: "",
                      data: "",
                      processoPagamento: "",
                      notaFiscal: "",
                      status: "",
                      valor: "",
                      empenhoRelaciondo: "",
                    },
                  ])
                }
              >
                <FiPlus className="h-3 w-3" />
                Adicionar pagamento
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {pagamentos.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  Nenhum registro em pagamentos.
                </p>
              )}

              {pagamentos.map((p, idx) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      Pagamento #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() =>
                        removeRow<PagamentoForm>(setPagamentos, p.id)
                      }
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Nº Ordem
                      </label>
                      <Input
                        value={p.numeroOrdem}
                        onChange={(e) =>
                          updateRow(
                            pagamentos,
                            setPagamentos,
                            p.id,
                            "numeroOrdem",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Data
                      </label>
                      <Input
                        type="date"
                        value={p.data}
                        onChange={(e) =>
                          updateRow(
                            pagamentos,
                            setPagamentos,
                            p.id,
                            "data",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Processo de pagamento
                      </label>
                      <Input
                        value={p.processoPagamento}
                        onChange={(e) =>
                          updateRow(
                            pagamentos,
                            setPagamentos,
                            p.id,
                            "processoPagamento",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Nota fiscal
                      </label>
                      <Input
                        value={p.notaFiscal}
                        onChange={(e) =>
                          updateRow(
                            pagamentos,
                            setPagamentos,
                            p.id,
                            "notaFiscal",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Status
                      </label>
                      <Input
                        value={p.status}
                        onChange={(e) =>
                          updateRow(
                            pagamentos,
                            setPagamentos,
                            p.id,
                            "status",
                            e.target.value
                          )
                        }
                        placeholder="Pago, em análise, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Valor (R$)
                      </label>
                      <Input
                        value={p.valor}
                        onChange={(e) =>
                          updateRow(
                            pagamentos,
                            setPagamentos,
                            p.id,
                            "valor",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Empenho relacionado
                      </label>
                      <Input
                        value={p.empenhoRelaciondo}
                        onChange={(e) =>
                          updateRow(
                            pagamentos,
                            setPagamentos,
                            p.id,
                            "empenhoRelaciondo",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rodapé simples extra, opcional */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-4 h-9 text-sm"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-full px-5 h-9 text-sm bg-emerald-500 hover:bg-emerald-400 flex items-center gap-2"
            >
              <FiSave className="h-4 w-4" />
              Salvar contrato
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
