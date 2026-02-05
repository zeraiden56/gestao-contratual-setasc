// src/app/modules/entregas/components/Filters.tsx
"use client";

import { memo, useMemo } from "react";

export interface FiltersProps {
  /** ano selecionado; use 0 para "Todos os anos" */
  ano: number;
  setAno: (a: number) => void;

  /** cidade selecionada; string vazia = todas */
  cidade: string;
  setCidade: (c: string) => void;

  /** lista de cidades para o select */
  cidades: string[];

  /** (opcional) anos disponíveis; se não vier, usa fallback */
  anos?: number[];
}

export const Filters = memo(function Filters({
  ano,
  setAno,
  cidade,
  setCidade,
  cidades,
  anos,
}: FiltersProps) {
  const anosOptions = useMemo(() => {
    // fallback caso você não passe anos pelo hook
    const base = anos && anos.length ? anos.slice().sort((a, b) => a - b) : [2023, 2024, 2025];
    return base;
  }, [anos]);

  return (
    <div className="flex flex-wrap gap-3 mb-6 items-center">
      {/* Município */}
      <label className="text-sm text-gray-600 flex items-center gap-2">
        <span className="whitespace-nowrap">Município:</span>
        <select
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos os municípios</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Ano */}
      <label className="text-sm text-gray-600 flex items-center gap-2">
        <span className="whitespace-nowrap">Ano:</span>
        <select
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value={0}>Todos os anos</option>
          {anosOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      {/* Botão limpar filtros (opcional) */}
      {(cidade || ano !== 0) && (
        <button
          type="button"
          onClick={() => {
            setCidade("");
            setAno(0);
          }}
          className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
});
