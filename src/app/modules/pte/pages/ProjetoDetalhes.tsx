"use client";

import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { FiArrowLeft } from "react-icons/fi";

export default function ProjetoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 🔹 Mock de dados — futuramente você pode puxar da API
  const projeto = {
    id,
    descricao: "Aquisição de filtros de barro para comunidades rurais",
    produto: "Filtro de barro",
    quantidade: 90000,
    local: "Estado",
    programa: "512",
    acao: "2621",
    status: "Em andamento",
  };

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <FiArrowLeft /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Projeto #{projeto.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Descrição:</strong> {projeto.descricao}</p>
          <p><strong>Produto:</strong> {projeto.produto}</p>
          <p><strong>Quantidade:</strong> {projeto.quantidade}</p>
          <p><strong>Local:</strong> {projeto.local}</p>
          <p><strong>Programa:</strong> {projeto.programa}</p>
          <p><strong>Ação:</strong> {projeto.acao}</p>
          <p><strong>Status:</strong> {projeto.status}</p>
        </CardContent>
      </Card>
    </div>
  );
}
