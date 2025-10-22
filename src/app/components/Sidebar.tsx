import { useLocation, NavLink } from "react-router-dom";
import {
  FiFileText,
  FiCheckCircle,
  FiUsers,
  FiDollarSign,
  FiClipboard,
  FiFolder,
  FiBarChart,
  FiSettings,
  FiHome,
  FiChevronLeft,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { useState } from "react";

/* ============================================================
   📦 Estrutura principal — módulos e submódulos
============================================================ */
const modules = [
  {
    key: "contratos",
    title: "Contratos",
    color: "text-green-500",
    accent: "bg-green-600",
    icon: FiFileText,
    routes: [
      { name: "Dashboard", href: "/contratos", icon: FiHome },
      { name: "Contratos", href: "/contratos/lista", icon: FiFileText },
      { name: "Relatórios", href: "/contratos/relatorios", icon: FiBarChart },
      { name: "Gestão", href: "/contratos/gestao", icon: FiUsers },
      { name: "Pagamentos", href: "/contratos/pagamentos", icon: FiDollarSign },
      { name: "Documentos", href: "/contratos/documentos", icon: FiFolder },
      { name: "Configurações", href: "/contratos/configuracoes", icon: FiSettings },
    ],
  },
  {
    key: "pte",
    title: "PTE",
    color: "text-purple-500",
    accent: "bg-purple-600",
    icon: FiClipboard,
    routes: [
      { name: "Dashboard", href: "/pte", icon: FiClipboard },
      { name: "Planos", href: "/pte/planos", icon: FiFileText },
      { name: "Entregas", href: "/pte/entregas", icon: FiBarChart },
      { name: "Configurações", href: "/pte/configuracoes", icon: FiSettings },
    ],
  },
  {
    key: "entregas",
    title: "Entregas",
    color: "text-pink-500",
    accent: "bg-pink-600",
    icon: FiCheckCircle,
    routes: [
      { name: "Dashboard", href: "/entregas", icon: FiHome },
      { name: "Programas", href: "/entregas/programas", icon: FiUsers },
      { name: "Indicadores", href: "/entregas/indicadores", icon: FiBarChart },
      { name: "Configurações", href: "/entregas/configuracoes", icon: FiSettings },
    ],
  },
  {
    key: "serfamilia",
    title: "SER Família",
    color: "text-orange-500",
    accent: "bg-orange-600",
    icon: FiUsers,
    routes: [
      { name: "Dashboard", href: "/serfamilia", icon: FiUsers },
      { name: "Mapa", href: "/serfamilia/mapa", icon: FiCheckCircle },
      { name: "Relatórios", href: "/serfamilia/relatorios", icon: FiBarChart },
      { name: "Configurações", href: "/serfamilia/configuracoes", icon: FiSettings },
    ],
  },
  {
    key: "orcamento",
    title: "Orçamento",
    color: "text-blue-500",
    accent: "bg-blue-600",
    icon: FiDollarSign,
    routes: [
      { name: "Dashboard", href: "/orcamento", icon: FiHome },
      { name: "Lista", href: "/orcamento/lista", icon: FiFileText },
      { name: "Análises", href: "/orcamento/analises", icon: FiBarChart },
      { name: "Configurações", href: "/orcamento/configuracoes", icon: FiSettings },
    ],
  },
];

/* ============================================================
   🧭 Sidebar unificada
============================================================ */
export const Sidebar = ({
  isOpen = true,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) => {
  const location = useLocation();
  const [openModule, setOpenModule] = useState<string | null>(null);

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 bg-sidebar text-sidebar-foreground",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between h-14">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <img
                src="/logo_helium.png"
                alt="Helium Logo"
                className="h-7 w-auto filter brightness-0 invert"
              />
              <div className="leading-tight">
                <h2 className="text-sm font-semibold text-slate-100">
                  SETASC Painel
                </h2>
                <p className="text-xs text-sidebar-foreground/60">
                  Gestão Integrada
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex justify-center w-full cursor-pointer"
              onClick={onToggleCollapse}
            >
              <img
                src="/logo_helium.png"
                alt="Helium Logo"
                className="h-7 w-auto filter brightness-0 invert"
              />
            </div>
          )}

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-sidebar-foreground hover:bg-sidebar-accent p-1.5 h-auto hidden lg:flex"
            >
              <FiChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-3">
          {modules.map((mod) => {
            const active =
              location.pathname.startsWith(`/${mod.key}`) ||
              openModule === mod.key;

            return (
              <div key={mod.key}>
                <button
                  onClick={() =>
                    setOpenModule(openModule === mod.key ? null : mod.key)
                  }
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium",
                    active
                      ? `${mod.accent} text-white`
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <mod.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{mod.title}</span>}
                  </div>

                  {!isCollapsed &&
                    (openModule === mod.key ? (
                      <FiChevronUp className="h-4 w-4 opacity-70" />
                    ) : (
                      <FiChevronDown className="h-4 w-4 opacity-70" />
                    ))}
                </button>

                {/* Submódulos */}
                {!isCollapsed && openModule === mod.key && (
                  <div className="mt-1 ml-4 space-y-1">
                    {mod.routes.map((r) => (
                      <NavLink
                        key={r.href}
                        to={r.href}
                        end
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                            isActive
                              ? `${mod.accent} text-white shadow-sm`
                              : "hover:bg-sidebar-accent text-sidebar-foreground/70"
                          )
                        }
                      >
                        <r.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{r.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Rodapé (versão apenas) */}
        <div className="p-4 border-t border-sidebar-border">
          <p
            className={cn(
              "text-xs text-sidebar-foreground/50",
              isCollapsed ? "text-center" : "text-left"
            )}
          >
            v1.0
          </p>
        </div>
      </aside>
    </>
  );
};
