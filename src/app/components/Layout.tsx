import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/app/lib/utils";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const hideSidebar =
    location.pathname === "/modulos" || location.pathname === "/";

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar fixa */}
      {!hideSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Área principal */}
      <div
        className={cn(
          "flex flex-col flex-1 transition-all duration-300 overflow-hidden",
          !hideSidebar &&
            (sidebarOpen
              ? sidebarCollapsed
                ? "lg:ml-16"
                : "lg:ml-64"
              : "lg:ml-0")
        )}
      >
        {/* Header fixo */}
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Conteúdo rolável — sem padding/borda/fundo claro */}
        <main className="flex-1 overflow-y-auto p-0 bg-transparent min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
