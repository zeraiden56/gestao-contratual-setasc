import { Toaster } from "@/app/components/ui/toaster";
import { Toaster as Sonner } from "@/app/components/ui/sonner";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";

import Layout from "@/app/components/Layout";

// 🔹 Contratos
import ContratosDashboard from "@/app/modules/contratos/pages/Dashboard";
import ContratosLista from "@/app/modules/contratos/pages/Lista";
import ContratoDetalhes from "@/app/modules/contratos/pages/Detalhes";
import ContratosRelatorios from "@/app/modules/contratos/pages/Relatorios"; // 🟩 novo import

// 🔹 PTE
import PTEDashboard from "@/app/modules/pte/pages/Dashboard";
import PTEPlanos from "@/app/modules/pte/pages/Planos";
import PTEEntregas from "@/app/modules/pte/pages/Entregas";
import PTEDetalhes from "@/app/modules/pte/pages/Detalhes";
import NovoProjeto from "@/app/modules/pte/pages/NovoProjeto";

// 🔹 SER Família
import SerfamiliaDashboard from "@/app/modules/serfamilia/pages/Dashboard";

// 🔹 Orçamento
import OrcamentoDashboard from "@/app/modules/orcamento/pages/Dashboard";
import OrcamentoDetalhes from "@/app/modules/orcamento/pages/Detalhes";
import OrcamentoLista from "@/app/modules/orcamento/pages/Lista"; // 🟩 adicionada

// 🔹 Gerais
import Modulos from "@/app/modules/Modulos";
import NotFound from "@/app/modules/NotFound";

const queryClient = new QueryClient();

/* --------------------------------------------------
   🌐 Aplicação principal
-------------------------------------------------- */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center text-lg font-medium">
              Carregando...
            </div>
          }
        >
          <Routes>
            {/* 🏁 Início direto em /modulos */}
            <Route path="/" element={<Navigate to="/modulos" replace />} />

            {/* 🧭 Layout principal (Sidebar + Header) */}
            <Route element={<Layout />}>
              {/* Menu principal */}
              <Route path="/modulos" element={<Modulos />} />

              {/* 🧾 CONTRATOS */}
              <Route path="/contratos" element={<ContratosDashboard />} />
              <Route path="/contratos/lista" element={<ContratosLista />} />
              <Route path="/contratos/:id" element={<ContratoDetalhes />} />
              <Route
                path="/contratos/relatorios"
                element={<ContratosRelatorios />} // 🟩 nova rota de relatórios
              />

              {/* 📘 PTE */}
              <Route path="/pte" element={<PTEDashboard />} />
              <Route path="/pte/planos" element={<PTEPlanos />} />
              <Route path="/pte/entregas" element={<PTEEntregas />} />
              <Route path="/pte/:id" element={<PTEDetalhes />} />
              <Route path="/pte/novo" element={<NovoProjeto />} />

              {/* 🧍‍♀️ SER FAMÍLIA */}
              <Route path="/serfamilia" element={<SerfamiliaDashboard />} />

              {/* 💰 ORÇAMENTO */}
              <Route path="/orcamento" element={<OrcamentoDashboard />} />
              <Route path="/orcamento/:id" element={<OrcamentoDetalhes />} />
              <Route
                path="/orcamento/lista"
                element={<OrcamentoLista titulo={""} grupo={""} dados={[]} />}
              />
            </Route>

            {/* ❌ Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
