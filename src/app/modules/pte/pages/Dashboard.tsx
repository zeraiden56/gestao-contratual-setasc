"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/app/lib/api";
import { Card, CardContent } from "@/app/components/ui/card";
import { FiAlertTriangle, FiClock, FiCheckCircle, FiShoppingCart, FiFileText, FiTool } from "react-icons/fi";

interface Projeto {
  id: number;
  descricao: string;
  prazoDias: number;
  dataInicio: string;
  tipo: "Aquisicoes" | "Pregao" | "Obras";
}

export default function PTE() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/PTE")
      .then((res) => setProjetos(res.data))
      .catch((err) => {
        console.error("Erro ao buscar projetos:", err);
        setProjetos([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = projetos.length;
    const hoje = new Date();

    const vencidos = projetos.filter((p) => {
      const fim = new Date(p.dataInicio);
      fim.setDate(fim.getDate() + p.prazoDias);
      return fim < hoje;
    }).length;

    const aVencer = projetos.filter((p) => {
      const fim = new Date(p.dataInicio);
      fim.setDate(fim.getDate() + p.prazoDias);
      const diff = (fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 30;
    }).length;

    const aquisicoes = projetos.filter((p) => p.tipo === "Aquisicoes").length;
    const pregao = projetos.filter((p) => p.tipo === "Pregao").length;
    const obras = projetos.filter((p) => p.tipo === "Obras").length;

    return { total, vencidos, aVencer, aquisicoes, pregao, obras };
  }, [projetos]);

  if (loading) return <div className="p-6">Carregando dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#f1f7ff] p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard PTE</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="bg-blue-600 text-white">
          <CardContent className="p-6 flex flex-col gap-2">
            <FiCheckCircle className="w-6 h-6" />
            <p>Projetos Totais</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-600 text-white">
          <CardContent className="p-6 flex flex-col gap-2">
            <FiAlertTriangle className="w-6 h-6" />
            <p>Vencidos</p>
            <p className="text-2xl font-bold">{stats.vencidos}</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500 text-white">
          <CardContent className="p-6 flex flex-col gap-2">
            <FiClock className="w-6 h-6" />
            <p>A vencer (30 dias)</p>
            <p className="text-2xl font-bold">{stats.aVencer}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-600 text-white">
          <CardContent className="p-6 flex flex-col gap-2">
            <FiShoppingCart className="w-6 h-6" />
            <p>Aquisições</p>
            <p className="text-2xl font-bold">{stats.aquisicoes}</p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-600 text-white">
          <CardContent className="p-6 flex flex-col gap-2">
            <FiFileText className="w-6 h-6" />
            <p>Pregões</p>
            <p className="text-2xl font-bold">{stats.pregao}</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-600 text-white">
          <CardContent className="p-6 flex flex-col gap-2">
            <FiTool className="w-6 h-6" />
            <p>Obras</p>
            <p className="text-2xl font-bold">{stats.obras}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
