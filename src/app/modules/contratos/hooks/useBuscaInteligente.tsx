"use client";
import { useEffect, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { api } from "@/app/lib/api";

export interface Contrato {
  [key: string]: any;
}

export function useBuscaInteligente(
  base: Contrato[] = [],
  termo: string = "",
  chaves: string[] = []
) {
  const [resultados, setResultados] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounced] = useDebounce(termo, 300);

  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlight = (texto: string): string => {
    if (!debounced.trim()) return texto;
    const termos = normalizar(debounced).split(/\s+/).filter(Boolean);
    let novo = texto;
    termos.forEach((t) => {
      const regex = new RegExp(`(${escapeRegex(t)})`, "gi");
      novo = novo.replace(regex, `<mark class="bg-yellow-200">$1</mark>`);
    });
    return novo;
  };

  // 🔒 Garante que "base" só muda se o conteúdo mudar
  const baseMemo = useMemo(() => base, [JSON.stringify(base)]);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      const busca = debounced.trim();
      if (!busca) {
        setResultados(baseMemo);
        return;
      }

      setLoading(true);
      try {
        let dados = baseMemo;
        if (!baseMemo.length) {
          const res = await api.get("", { params: { q: busca } });
          dados = Array.isArray(res.data) ? res.data : [];
        }

        const termos = normalizar(busca).split(/\s+/).filter(Boolean);

        const filtrados = dados
          .map((item) => {
            let score = 0;
            chaves.forEach((ch) => {
              const campo = normalizar(String(item[ch] ?? ""));
              termos.forEach((t) => {
                if (campo.includes(t)) score += 1;
              });
            });
            return { ...item, _score: score };
          })
          .filter((i) => i._score > 0)
          .sort((a, b) => b._score - a._score);

        if (ativo) setResultados(filtrados);
      } catch (err) {
        console.error("❌ Erro ao buscar:", err);
        if (ativo) setResultados([]);
      } finally {
        if (ativo) setLoading(false);
      }
    };

    buscar();
    return () => {
      ativo = false;
    };
  }, [debounced, baseMemo, chaves]);

  return { filtrados: resultados, highlight, loading };
}
