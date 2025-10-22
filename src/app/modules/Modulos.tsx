"use client";

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { FiFileText, FiCheckCircle, FiUsers, FiDollarSign } from "react-icons/fi";

export default function Modulos() {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Dashboard de Contratos",
      description: "Gestão completa e análise de contratos da SETASC",
      icon: <FiFileText className="w-6 h-6" />,
      path: "/contratos",
      dev: false,
    },
    {
      title: "Plano de Trabalho de Entrega (PTE)",
      description: "Gerencie planos de trabalho e entregas",
      icon: <FiCheckCircle className="w-6 h-6" />,
      path: "/pte",
      dev: true,
    },
    {
      title: "Dashboard de Entregas",
      description: "Monitoramento de programas e entregas sociais em Mato Grosso",
      icon: <FiCheckCircle className="w-6 h-6" />,
      path: "/entregas",
      dev: true,
    },
    {
      title: "Dashboard SER Família",
      description: "Gestão e acompanhamento dos programas sociais do SER Família",
      icon: <FiUsers className="w-6 h-6" />,
      path: "/serfamilia",
      dev: true,
    },
    {
      title: "Dashboard do Orçamento (FIPLAN)",
      description: "Acompanhe saldos, despesas e dotações do sistema FIPLAN",
      icon: <FiDollarSign className="w-6 h-6" />,
      path: "/orcamento",
      dev: false,
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-[#f9fafb]">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Selecione um Módulo</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div
                className={`relative ${m.dev ? "cursor-not-allowed opacity-85" : "cursor-pointer"}`}
                onClick={() => !m.dev && navigate(m.path)}
              >
                <Card
                  className={`hover:shadow-xl hover:scale-[1.02] transition transform overflow-hidden relative ${
                    m.dev ? "pointer-events-none" : ""
                  }`}
                >
                  {/* Faixa dentro do card */}
                  {m.dev && (
                    <div
                      className="absolute top-2 right-[-30px] w-36 text-center transform rotate-45 z-10 shadow-sm"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, #facc15 0, #facc15 6px, #000 6px, #000 12px)",
                        color: "#fff",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        padding: "0.15rem 0",
                        textShadow: "0 0 2px rgba(0,0,0,0.6)",
                        letterSpacing: "0.5px",
                        borderRadius: "2px",
                      }}
                    >
                      EM DESENVOLVIMENTO
                    </div>
                  )}

                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                      {m.icon}
                    </div>
                    <CardTitle>{m.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{m.description}</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>

            {m.dev && (
              <TooltipContent
                side="bottom"
                className="bg-yellow-100 text-slate-800 border border-yellow-300 shadow-md text-xs px-2 py-1 rounded"
              >
                Módulo em desenvolvimento 🚧
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
