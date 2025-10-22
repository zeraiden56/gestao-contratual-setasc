"use client";
import { useState, useRef } from "react";

interface BuscaInteligenteProps {
  onSearch: (texto: string) => void;
  placeholder?: string;
  sugestoes?: string[];
}

export default function BuscaInteligente({
  onSearch,
  placeholder = "Buscar por nome, código, palavra ou valor...",
  sugestoes = [],
}: BuscaInteligenteProps) {
  const [valor, setValor] = useState("");
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const resultados = sugestoes
    .filter((s) => s.toLowerCase().includes(valor.toLowerCase()))
    .slice(0, 10);

  return (
    <div
      ref={ref}
      className="relative w-full max-w-xl mb-4"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <input
        type="text"
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          onSearch(e.target.value);
        }}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />

      {aberto && valor.length > 0 && resultados.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          {resultados.map((item, i) => (
            <li
              key={i}
              onClick={() => {
                setValor(item);
                onSearch(item);
                setAberto(false);
              }}
              className="p-2 text-slate-700 hover:bg-blue-50 cursor-pointer"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
