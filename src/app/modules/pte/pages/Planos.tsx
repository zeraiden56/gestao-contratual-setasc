"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/app/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FiSearch, FiPlus } from "react-icons/fi";

interface Projeto {
  id: number;
  descricao: string;
  produto: string;
  quantidade: number;
  local: string;
  programa: string;
  acao: string;
  prazoDias: number;
  dataInicio: string;
  fases: Record<string, string | null>; // exemplo: { marcoZero: "2023-10-01", edital: null }
}

export default function PTE() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/PTE") // sua API de projetos
      .then((res) => setProjetos(res.data))
      .catch((err) => {
        console.error("Erro ao buscar projetos:", err);
        setProjetos([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    if (!query.trim()) return projetos;
    return projetos.filter((p) =>
      `${p.descricao} ${p.produto} ${p.local}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [projetos, query]);

  if (loading) return <div className="p-6">Carregando projetos...</div>;

  return (
    <div className="min-h-screen bg-[#f1f7ff] p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard PTE</h1>
        <Button onClick={() => navigate("/pte/novo")}>
          <FiPlus className="mr-2" /> Novo Projeto
        </Button>
      </div>

      {/* Pesquisa */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Pesquisar projetos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de Projetos */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {filtrados.length > 0 ? (
              filtrados.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center py-3 cursor-pointer hover:bg-slate-50 px-2 rounded"
                  onClick={() => navigate(`/pte/${p.id}`)}
                >
                  <div>
                    <p className="font-medium">{p.descricao}</p>
                    <p className="text-xs text-slate-500">
                      {p.produto} – {p.local}
                    </p>
                  </div>
                  <Badge variant="outline">{p.prazoDias} dias</Badge>
                </li>
              ))
            ) : (
              <li className="p-4 text-slate-500">Nenhum projeto encontrado</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}