"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { Input } from "@/app/components/ui/input";
import { useContratos } from "../hooks/useContratos";
import { useBuscaInteligente } from "../hooks/useBuscaInteligente";

export default function BuscaContratos() {
  const { contratos, loading: carregandoContratos } = useContratos();
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();

  const { filtrados, highlight, loading } = useBuscaInteligente(
    contratos,
    busca,
    ["numero", "contratada", "objeto", "sigadoc"]
  );

  const exibeResultados = busca.trim() && !loading && filtrados.length > 0;
  const semResultados = busca.trim() && !loading && filtrados.length === 0;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <Input
        placeholder="Buscar contrato..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="pl-10 bg-white/70 border-blue-300 text-center rounded-full shadow-sm focus:ring-2 focus:ring-blue-400"
      />

      {/* Resultados */}
      {exibeResultados && (
        <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto z-50 animate-fadeIn">
          {filtrados.slice(0, 15).map((r) => (
            <div
              key={r.id || r.slug || r.numero}
              onClick={() => {
                navigate(`/contratos/${r.slug || r.id || r.numero}`);
                setBusca("");
              }}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b transition-colors"
            >
              <p
                className="font-medium text-slate-800"
                dangerouslySetInnerHTML={{
                  __html: highlight(`${r.numero ?? ""} — ${r.contratada ?? ""}`),
                }}
              />
              <p
                className="text-xs text-slate-600 line-clamp-2"
                dangerouslySetInnerHTML={{
                  __html: highlight(r.objeto ?? ""),
                }}
              />
              {r.sigadoc && (
                <p className="text-[10px] text-blue-600 mt-1">
                  {r.sigadoc}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nenhum resultado */}
      {semResultados && (
        <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow p-3 text-sm text-slate-600 text-center animate-fadeIn">
          Nenhum contrato encontrado.
        </div>
      )}

      {/* Carregando */}
      {loading && busca && (
        <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow p-3 text-sm text-slate-500 text-center animate-pulse">
          Buscando...
        </div>
      )}

      {/* Sem dados locais */}
      {carregandoContratos && (
        <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow p-3 text-sm text-slate-400 text-center animate-pulse">
          Carregando base de contratos...
        </div>
      )}
    </div>
  );
}
