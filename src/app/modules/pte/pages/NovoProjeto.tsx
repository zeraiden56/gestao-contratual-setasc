"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function NovoProjeto() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    descricao: "",
    produto: "",
    quantidade: "",
    local: "",
    programa: "",
    acao: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Projeto salvo:", form);
    navigate("/pte"); // volta para dashboard PTE
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Novo Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Descrição", name: "descricao" },
              { label: "Produto", name: "produto" },
              { label: "Quantidade", name: "quantidade" },
              { label: "Local", name: "local" },
              { label: "Programa", name: "programa" },
              { label: "Ação", name: "acao" },
            ].map((f) => (
              <div key={f.name} className="space-y-1">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input
                  id={f.name}
                  name={f.name}
                  value={(form as any)[f.name]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/pte")}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
