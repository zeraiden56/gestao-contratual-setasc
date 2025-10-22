"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { api } from "@/app/lib/api";

// Interface genérica para qualquer contrato
export interface Contrato {
  [key: string]: any;
}

/**
 * Hook de busca inteligente com suporte a destaque de texto e busca no backend.
 */
export function useBuscaInteligente(
  base: Contrato[] = [],
  termo: string = "",
  chaves: string[] = []
) {
  const [resultados, setResultados] = useState<Contrato[]>(base);
  const [loading, setLoading] = useState(false);
  const [debounced] = useDebounce(termo, 300);

  // 🔹 Normalização de texto (remove acentos, caixa etc.)
  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  // 🔹 Realce visual dos termos encontrados
  const highlight = (texto: string): string => {
    if (!debounced.trim()) return texto;
    const termos = normalizar(debounced)
      .split(/\s+/)
      .filter(Boolean);

    let novoTexto = texto;
    termos.forEach((t) => {
      const regex = new RegExp(`(${t})`, "gi");
      novoTexto = novoTexto.replace(
        regex,
        '<mark class="bg-yellow-200">$1</mark>'
      );
    });
    return novoTexto;
  };

  // 🔹 Efeito: filtra localmente e busca no backend se necessário
  useEffect(() => {
    const buscar = async () => {
      if (!debounced.trim()) {
        setResultados(base);
        return;
      }

      setLoading(true);
      try {
        // 🔸 Primeiro tenta usar os dados locais, se houver
        let filtrados = base;

        if (base.length === 0) {
          // 🔸 Se não houver dados locais, busca no backend GAS
          const res = await api.get("", { params: { q: debounced } });
          const data = Array.isArray(res.data) ? res.data : [];
          filtrados = data;
        }

        const termos = normalizar(debounced)
          .split(/\s+/)
          .filter(Boolean);

        const novos = filtrados.filter((item) =>
          chaves.some((chave) =>
            termos.every((t) =>
              normalizar(String(item[chave] ?? "")).includes(t)
            )
          )
        );

        setResultados(novos);
      } catch (err) {
        console.error("Erro ao buscar contratos:", err);
        setResultados([]);
      } finally {
        setLoading(false);
      }
    };

    buscar();
  }, [debounced, base, chaves]);

  return {
    filtrados: resultados,
    highlight,
    loading,
  };
}
