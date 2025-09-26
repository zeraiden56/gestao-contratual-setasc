import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Contratos from "./pages/Contratos";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/contratos" element={
            <Layout>
              <Contratos />
            </Layout>
          } />
          <Route path="/gestores" element={
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Gestores</h1>
                <p className="text-muted-foreground mt-2">Módulo em desenvolvimento</p>
              </div>
            </Layout>
          } />
          <Route path="/fiscais" element={
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Fiscais</h1>
                <p className="text-muted-foreground mt-2">Módulo em desenvolvimento</p>
              </div>
            </Layout>
          } />
          <Route path="/pagamentos" element={
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Pagamentos</h1>
                <p className="text-muted-foreground mt-2">Módulo em desenvolvimento</p>
              </div>
            </Layout>
          } />
          <Route path="/documentos" element={
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Documentos</h1>
                <p className="text-muted-foreground mt-2">Módulo em desenvolvimento</p>
              </div>
            </Layout>
          } />
          <Route path="/configuracoes" element={
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-muted-foreground mt-2">Módulo em desenvolvimento</p>
              </div>
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
