"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useContratos } from "../hooks/useContratos";
import { useBuscaInteligente } from "../hooks/useBuscaInteligente";
import { Input } from "@/app/components/ui/input";
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/app/components/ui/button";
import ContratoCard from "../components/ContratoCard";

export default function Lista() {
  const { contratos, loading } = useContratos();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { filtrados, highlight } = useBuscaInteligente(
    contratos,
    query,
    ["numero", "contratada", "objeto", "vigencia"]
  );

  const [pagina, setPagina] = useState(1);
  const porPagina = 15;
  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const visiveis = useMemo(() => {
    const start = (pagina - 1) * porPagina;
    return filtrados.slice(start, start + porPagina);
  }, [filtrados, pagina]);

  const mudarPagina = (n: number) => {
    setPagina((p) => Math.max(1, Math.min(totalPaginas, p + n)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500 text-lg">
        Carregando contratos...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#f6f9fc] min-h-screen">
      {/* Barra de busca */}
      <div className="flex items-center gap-2 sticky top-0 bg-[#f6f9fc] py-2 z-10">
        <FiSearch className="text-slate-400" />
        <Input
          placeholder="Pesquisar contrato por número, empresa ou objeto..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPagina(1);
          }}
        />
      </div>

      {/* Resultados */}
      {visiveis.length === 0 && (
        <p className="text-slate-500 text-center mt-6">
          Nenhum contrato encontrado.
        </p>
      )}

      <div className="grid gap-4">
        {visiveis.map((c) => (
          <ContratoCard
            key={c.id}
            id={c.id}
            numero={c.numero}
            contratada={c.contratada}
            sigadoc={c.sigadoc}
            tipo={c.tipo}
            objeto={c.objeto}
            vigencia={c.vigencia}
            valorTotal={String(Number(c.valorTotal) || 0)}
            saldoAtual={String(Number(c.saldoAtual) || 0)}
            onClick={() => navigate(`/contratos/${c.id}`)}
          />
        ))}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-3 mt-4 items-center">
          <Button
            variant="outline"
            onClick={() => mudarPagina(-1)}
            disabled={pagina === 1}
          >
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
  );
}
