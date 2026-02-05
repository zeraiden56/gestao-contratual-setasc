"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useContratos,
  Contrato,
  ContratoDetalhado,
} from "../hooks/useContratos";

/* ========================================================================
   Tipos de formulário
   ======================================================================== */

interface AditivoForm {
  id: string;
  descricao: string;
  data: string;
  valorTexto: string;
}

interface ItemLoteForm {
  id: string;
  descricao: string;
  quantidade: string;
  unidadeMedida: string;
  valorUnitarioTexto: string;
}

interface LoteForm {
  id: string;
  numero: string;
  descricao: string;
  valorTexto: string;
  itens: ItemLoteForm[];
}

interface CabecalhoForm {
  numero: string;
  contratada: string;
  tipo: string;
  unidade: string;
  objeto: string;
  ano: string;
  dataInicio: string;
  dataVencimento: string;
  valorTotalTexto: string;
}

/* ========================================================================
   Utils
   ======================================================================== */

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 11);

/* ========================================================================
   Página
   ======================================================================== */

export default function GerenciamentoDetalhesContratoPage() {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { contratos, getContratoDetalhado } = useContratos();

  // tenta decodificar o slug 1x (caso tenha vindo como 060%2F2025 etc)
  let slugDecoded = "";
  try {
    slugDecoded = slugParam ? decodeURIComponent(slugParam) : "";
  } catch {
    slugDecoded = slugParam || "";
  }

  const contratoBase: Contrato | undefined = useMemo(() => {
    if (!slugParam) return undefined;

    return (
      // 1) slug exatamente como veio
      contratos.find((c) => c.slug === slugParam) ||
      // 2) slug decodificado
      contratos.find((c) => c.slug === slugDecoded) ||
      // 3) bate com o número do contrato (fallback)
      contratos.find((c) => c.numero === slugDecoded)
    );
  }, [contratos, slugParam, slugDecoded]);

  const [detalhe, setDetalhe] = useState<ContratoDetalhado | null>(null);
  const [cabecalho, setCabecalho] = useState<CabecalhoForm | null>(null);
  const [aditivos, setAditivos] = useState<AditivoForm[]>([]);
  const [lotes, setLotes] = useState<LoteForm[]>([]);
  const [loading, setLoading] = useState(true);

  /* ======================================================================
     Carregar detalhe do GAS
     ====================================================================== */

  useEffect(() => {
    let ativo = true;

    async function loadDetalhe() {
      if (!contratoBase) {
        setLoading(false);
        return;
      }

      try {
        const ident = contratoBase.nomeAba || contratoBase.numero;
        const det = await getContratoDetalhado(ident);
        if (!ativo) return;

        setDetalhe(det || null);

        const ano =
          contratoBase.dataInicio?.slice(0, 4) ||
          contratoBase.dataVencimento?.slice(0, 4) ||
          "";

        // cabeçalho (dados principais)
        setCabecalho({
          numero: contratoBase.numero,
          contratada: contratoBase.contratada,
          tipo: contratoBase.tipo || "",
          unidade: contratoBase.unidade || "",
          objeto: contratoBase.objeto || "",
          ano,
          dataInicio: contratoBase.dataInicio || "",
          dataVencimento: contratoBase.dataVencimento || "",
          valorTotalTexto:
            contratoBase.valorTotal !== undefined
              ? contratoBase.valorTotal.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "",
        });

        // aditivos
        const aditivosOrig: AditivoForm[] =
          det?.DETALHES.ADITIVOS?.map((row: any, idx: number) => ({
            id: String(row.id || idx),
            descricao: row.DESCRICAO || row.descricao || "",
            data: row.DATA || row.data || "",
            valorTexto:
              row.VALOR !== undefined
                ? String(row.VALOR).replace(".", ",")
                : "",
          })) || [];

        setAditivos(aditivosOrig);

        // lotes (sem itens por enquanto – GAS não traz assim)
        const lotesOrig: LoteForm[] =
          det?.DETALHES.LOTES?.map((row: any, idx: number) => ({
            id: String(row.id || idx),
            numero: row.LOTE || row.numero || String(idx + 1),
            descricao: row.DESCRICAO || row.descricao || "",
            valorTexto:
              row.VALOR !== undefined
                ? String(row.VALOR).replace(".", ",")
                : "",
            itens: [],
          })) || [];

        setLotes(lotesOrig);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    loadDetalhe();

    return () => {
      ativo = false;
    };
  }, [contratoBase, getContratoDetalhado]);

  /* ======================================================================
     Handlers
     ====================================================================== */

  function handleCabecalhoChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    if (!cabecalho) return;
    const { name, value } = e.target;
    setCabecalho({ ...cabecalho, [name]: value });
  }

  function handleAditivoChange(
    id: string,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setAditivos((ads) =>
      ads.map((a) => (a.id === id ? { ...a, [name]: value } : a))
    );
  }

  function addAditivo() {
    setAditivos((ads) => [
      ...ads,
      {
        id: makeId(),
        descricao: "",
        data: "",
        valorTexto: "",
      },
    ]);
  }

  function removeAditivo(id: string) {
    setAditivos((ads) => ads.filter((a) => a.id !== id));
  }

  function handleLoteChange(
    id: string,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setLotes((ls) =>
      ls.map((l) => (l.id === id ? { ...l, [name]: value } : l))
    );
  }

  function addLote() {
    setLotes((ls) => [
      ...ls,
      {
        id: makeId(),
        numero: String(ls.length + 1),
        descricao: "",
        valorTexto: "",
        itens: [],
      },
    ]);
  }

  function removeLote(id: string) {
    setLotes((ls) => ls.filter((l) => l.id !== id));
  }

  function addItemLote(loteId: string) {
    setLotes((ls) =>
      ls.map((l) =>
        l.id === loteId
          ? {
              ...l,
              itens: [
                ...l.itens,
                {
                  id: makeId(),
                  descricao: "",
                  quantidade: "",
                  unidadeMedida: "",
                  valorUnitarioTexto: "",
                },
              ],
            }
          : l
      )
    );
  }

  function removeItemLote(loteId: string, itemId: string) {
    setLotes((ls) =>
      ls.map((l) =>
        l.id === loteId
          ? { ...l, itens: l.itens.filter((it) => it.id !== itemId) }
          : l
      )
    );
  }

  function handleItemLoteChange(
    loteId: string,
    itemId: string,
    e: ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setLotes((ls) =>
      ls.map((l) =>
        l.id === loteId
          ? {
              ...l,
              itens: l.itens.map((it) =>
                it.id === itemId ? { ...it, [name]: value } : it
              ),
            }
          : l
      )
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contratoBase || !cabecalho) return;

    const payload = {
      id: contratoBase.id,
      numero: cabecalho.numero,
      cabecalho,
      aditivos,
      lotes,
      detalheOriginal: detalhe,
    };

    // futuramente: PUT/PATCH na API
    console.log("Salvar contrato (payload completo):", payload);

    navigate("/contratos/gerenciamento");
  }

  /* ======================================================================
     Estados de loading / erro
     ====================================================================== */

  if (loading || !cabecalho) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-slate-500 text-sm relative"
        style={{
          backgroundImage: "url('/brasao-estado-mt.jpeg')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-white/80" />
        <div className="relative">
          Carregando detalhe do contrato...
        </div>
      </div>
    );
  }

  if (!contratoBase) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: "url('/brasao-estado-mt.jpeg')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-white/80" />
        <div className="relative text-center space-y-3">
          <p className="text-slate-600 text-sm">
            Contrato não encontrado.
          </p>
          <button
            className="px-4 py-2 rounded-full text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            onClick={() => navigate("/contratos/gerenciamento")}
          >
            Voltar para gerenciamento
          </button>
        </div>
      </div>
    );
  }

  /* ======================================================================
     Render principal – formulário igual ao “Novo contrato”, mas preenchido
     ====================================================================== */

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

      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Gerenciamento do contrato {cabecalho.numero}
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {cabecalho.contratada}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajuste os dados do contrato, aditivos, lotes e itens. Por enquanto,
            as alterações são apenas locais (payload em console).
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CABEÇALHO */}
          <section className="bg-white/90 rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Dados do contrato
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="numero" className="text-xs font-medium text-slate-600">
                  Nº do contrato
                </label>
                <input
                  id="numero"
                  name="numero"
                  value={cabecalho.numero}
                  onChange={handleCabecalhoChange}
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="contratada" className="text-xs font-medium text-slate-600">
                  Contratada
                </label>
                <input
                  id="contratada"
                  name="contratada"
                  value={cabecalho.contratada}
                  onChange={handleCabecalhoChange}
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="tipo" className="text-xs font-medium text-slate-600">
                  Tipo
                </label>
                <input
                  id="tipo"
                  name="tipo"
                  value={cabecalho.tipo}
                  onChange={handleCabecalhoChange}
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="unidade" className="text-xs font-medium text-slate-600">
                  Unidade orçamentária
                </label>
                <input
                  id="unidade"
                  name="unidade"
                  value={cabecalho.unidade}
                  onChange={handleCabecalhoChange}
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="ano" className="text-xs font-medium text-slate-600">
                  Ano
                </label>
                <input
                  id="ano"
                  name="ano"
                  value={cabecalho.ano}
                  onChange={handleCabecalhoChange}
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="valorTotalTexto" className="text-xs font-medium text-slate-600">
                  Valor total (R$)
                </label>
                <input
                  id="valorTotalTexto"
                  name="valorTotalTexto"
                  value={cabecalho.valorTotalTexto}
                  onChange={handleCabecalhoChange}
                  placeholder="1.234,56"
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="dataInicio" className="text-xs font-medium text-slate-600">
                  Data de início
                </label>
                <input
                  id="dataInicio"
                  name="dataInicio"
                  type="date"
                  value={cabecalho.dataInicio}
                  onChange={handleCabecalhoChange}
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="dataVencimento" className="text-xs font-medium text-slate-600">
                  Data de vencimento
                </label>
                <input
                  id="dataVencimento"
                  name="dataVencimento"
                  type="date"
                  value={cabecalho.dataVencimento}
                  onChange={handleCabecalhoChange}
                  className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="objeto" className="text-xs font-medium text-slate-600">
                Objeto do contrato
              </label>
              <textarea
                id="objeto"
                name="objeto"
                rows={4}
                value={cabecalho.objeto}
                onChange={handleCabecalhoChange}
                className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </section>

          {/* ADITIVOS */}
          <section className="bg-white/90 rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Aditivos ({aditivos.length})
              </h2>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs md:text-sm bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
                onClick={addAditivo}
              >
                + Adicionar aditivo
              </button>
            </div>

            {aditivos.length === 0 && (
              <p className="text-xs text-slate-500">
                Nenhum aditivo cadastrado.
              </p>
            )}

            {aditivos.map((a, index) => (
              <div
                key={a.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-slate-800">
                    Aditivo {index + 1}
                  </h3>
                  <button
                    type="button"
                    className="px-2 py-1 rounded-full text-[11px] bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                    onClick={() => removeAditivo(a.id)}
                  >
                    Remover
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-medium text-slate-600">
                      Descrição
                    </label>
                    <input
                      name="descricao"
                      value={a.descricao}
                      onChange={(e) => handleAditivoChange(a.id, e)}
                      className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Data
                    </label>
                    <input
                      type="date"
                      name="data"
                      value={a.data}
                      onChange={(e) => handleAditivoChange(a.id, e)}
                      className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Valor (texto)
                    </label>
                    <input
                      name="valorTexto"
                      value={a.valorTexto}
                      placeholder="1.234,56"
                      onChange={(e) => handleAditivoChange(a.id, e)}
                      className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* LOTES + ITENS */}
          <section className="bg-white/90 rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Lotes e itens utilizados ({lotes.length})
              </h2>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs md:text-sm bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
                onClick={addLote}
              >
                + Adicionar lote
              </button>
            </div>

            {lotes.length === 0 && (
              <p className="text-xs text-slate-500">
                Nenhum lote cadastrado.
              </p>
            )}

            {lotes.map((lote, index) => (
              <div
                key={lote.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h3 className="font-medium text-sm text-slate-800">
                    Lote {lote.numero || index + 1}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full text-[11px] bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
                      onClick={() => addItemLote(lote.id)}
                    >
                      + Item
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full text-[11px] bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                      onClick={() => removeLote(lote.id)}
                    >
                      Remover lote
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Número do lote
                    </label>
                    <input
                      name="numero"
                      value={lote.numero}
                      onChange={(e) => handleLoteChange(lote.id, e)}
                      className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Valor do lote (texto)
                    </label>
                    <input
                      name="valorTexto"
                      value={lote.valorTexto}
                      placeholder="1.234,56"
                      onChange={(e) => handleLoteChange(lote.id, e)}
                      className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Descrição do lote
                  </label>
                  <textarea
                    name="descricao"
                    value={lote.descricao}
                    onChange={(e) => handleLoteChange(lote.id, e)}
                    rows={2}
                    className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  {lote.itens.length === 0 && (
                    <p className="text-xs text-slate-500">
                      Nenhum item cadastrado neste lote.
                    </p>
                  )}

                  {lote.itens.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border border-slate-200 rounded-md p-2 bg-white"
                    >
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs font-medium text-slate-600">
                          Descrição do item
                        </label>
                        <input
                          name="descricao"
                          value={item.descricao}
                          onChange={(e) =>
                            handleItemLoteChange(lote.id, item.id, e)
                          }
                          className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">
                          Quantidade
                        </label>
                        <input
                          name="quantidade"
                          value={item.quantidade}
                          onChange={(e) =>
                            handleItemLoteChange(lote.id, item.id, e)
                          }
                          className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">
                          Unidade
                        </label>
                        <input
                          name="unidadeMedida"
                          value={item.unidadeMedida}
                          onChange={(e) =>
                            handleItemLoteChange(lote.id, item.id, e)
                          }
                          className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">
                          Valor unitário (texto)
                        </label>
                        <input
                          name="valorUnitarioTexto"
                          value={item.valorUnitarioTexto}
                          placeholder="1,23"
                          onChange={(e) =>
                            handleItemLoteChange(lote.id, item.id, e)
                          }
                          className="input rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex md:justify-end">
                        <button
                          type="button"
                          className="mt-2 px-2 py-1 rounded-full text-[11px] bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                          onClick={() => removeItemLote(lote.id, item.id)}
                        >
                          Remover item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Rodapé do formulário */}
          <footer className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full text-sm bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm transition-colors"
            >
              Salvar alterações
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
