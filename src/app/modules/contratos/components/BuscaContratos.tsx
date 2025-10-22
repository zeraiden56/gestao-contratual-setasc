"use client";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useContratos } from "../hooks/useContratos";
import { Input } from "@/app/components/ui/input";
import { FiSearch } from "react-icons/fi";

// 🔹 Normaliza texto removendo acentos e caixa
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// 🔹 Realça termos no texto original, mesmo que os acentos ou maiúsculas não coincidam
function destacarTexto(textoOriginal: string, termosBusca: string[]) {
  if (!termosBusca.length) return textoOriginal;

  // Normaliza o texto para comparação
  const textoNormalizado = normalizar(textoOriginal);

  // Cria uma lista com os intervalos que precisam ser destacados
  const indices: [number, number][] = [];

  termosBusca.forEach((termo) => {
    const termoNorm = normalizar(termo);
    let idx = textoNormalizado.indexOf(termoNorm);
    while (idx !== -1) {
      indices.push([idx, idx + termoNorm.length]);
      idx = textoNormalizado.indexOf(termoNorm, idx + termoNorm.length);
    }
  });

  if (indices.length === 0) return textoOriginal;

  // Junta intervalos sobrepostos
  const unidos: [number, number][] = [];
  indices
    .sort((a, b) => a[0] - b[0])
    .forEach(([ini, fim]) => {
      const ultimo = unidos[unidos.length - 1];
      if (!ultimo || ini > ultimo[1]) {
        unidos.push([ini, fim]);
      } else {
        ultimo[1] = Math.max(ultimo[1], fim);
      }
    });

  // Reconstrói o texto com <mark>
  let resultado = "";
  let pos = 0;
  unidos.forEach(([ini, fim]) => {
    resultado += textoOriginal.slice(pos, ini);
    resultado += `<mark class="bg-yellow-200">${textoOriginal.slice(
      ini,
      fim
    )}</mark>`;
    pos = fim;
  });
  resultado += textoOriginal.slice(pos);

  return resultado;
}

export default function BuscaContratos() {
  const { contratos } = useContratos();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const resultados = useMemo(() => {
    if (!busca.trim()) return [];
    const termos = normalizar(busca).split(/\s+/);
    return contratos.filter((c) => {
      const texto = normalizar(
        `${c.numero} ${c.contratada} ${c.objeto} ${c.sigadoc}`
      );
      return termos.every((t) => texto.includes(t));
    });
  }, [busca, contratos]);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <Input
        placeholder="Buscar contrato..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="pl-10 bg-white/70 border-blue-300 text-center rounded-full shadow-sm"
      />

      {busca && resultados.length > 0 && (
        <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {resultados.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                navigate(`/contratos/${r.id}`);
                setBusca("");
              }}
              className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b"
            >
              <p
                className="font-medium"
                dangerouslySetInnerHTML={{
                  __html: destacarTexto(
                    `${r.numero} — ${r.contratada}`,
                    busca.split(/\s+/)
                  ),
                }}
              />
              <p
                className="text-xs text-slate-600"
                dangerouslySetInnerHTML={{
                  __html: destacarTexto(r.objeto, busca.split(/\s+/)),
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
