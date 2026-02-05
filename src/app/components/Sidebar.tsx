import { useLocation, useNavigate, NavLink } from "react-router-dom";
import {
  FiFileText,
  FiCheckCircle,
  FiUsers,
  FiDollarSign,
  FiClipboard,
  FiBarChart,
  FiChevronLeft,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { useState } from "react";

/* ============================================================
   📦 Estrutura principal — módulos e submódulos ativos
============================================================ */
const modules = [
  {
    key: "contratos",
    title: "Contratos",
    color: "text-green-500",
    accent: "bg-green-600",
    icon: FiFileText,
    routes: [
      { name: "Dashboard", href: "/contratos", icon: FiFileText },
      {
        name: "Gerenciamento",
        href: "/contratos/gerenciamento",
        icon: FiClipboard,
      },
      { name: "Contratos", href: "/contratos/lista", icon: FiFileText },
      { name: "Relatórios", href: "/contratos/relatorios", icon: FiBarChart },
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
      { name: "Entregas", href: "/pte/entregas", icon: FiBarChart },
    ],
  },
  {
    key: "entregas",
    title: "Entregas",
    color: "text-pink-500",
    accent: "bg-pink-600",
    icon: FiCheckCircle,
    routes: [
      { name: "Dashboard", href: "/entregas", icon: FiCheckCircle },
      { name: "Programas", href: "/entregas/programas", icon: FiUsers },
      { name: "Indicadores", href: "/entregas/indicadores", icon: FiBarChart },
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
    ],
  },
  {
    key: "orcamento",
    title: "Orçamento",
    color: "text-blue-500",
    accent: "bg-blue-600",
    icon: FiDollarSign,
    routes: [
      { name: "Dashboard", href: "/orcamento", icon: FiDollarSign },
      { name: "Lista", href: "/orcamento/lista", icon: FiFileText },
    ],
  },
  // 🆕 NOVO MÓDULO: Adjuntas
  {
    key: "adjuntas",
    title: "Adjuntas",
    color: "text-teal-500",
    accent: "bg-teal-600",
    icon: FiUsers,
    routes: [
      { name: "SACIS", href: "/adjuntas/sacis", icon: FiUsers },
      { name: "SAAS", href: "/adjuntas/saas", icon: FiUsers },
      { name: "SAASCOM", href: "/adjuntas/saascom", icon: FiUsers },
      { name: "SADH", href: "/adjuntas/sadh", icon: FiUsers },
      { name: "SAPPEAF", href: "/adjuntas/sappeaf", icon: FiUsers },
      { name: "PROCON", href: "/adjuntas/procon", icon: FiUsers },
      { name: "SAADS", href: "/adjuntas/saads", icon: FiUsers },
      { name: "SAEDPE", href: "/adjuntas/saedpe", icon: FiUsers },
      { name: "SAPPM", href: "/adjuntas/sappm", icon: FiUsers },
    ],
  },
];

/* ============================================================
   🧭 Sidebar unificada (sem bordas)
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
  const navigate = useNavigate();
  const [openModule, setOpenModule] = useState<string | null>(null);

  const safeNavigate = (path: string) => {
    try {
      navigate(path);
    } catch {
      // rota pode não existir; ignora
    }
  };

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
        <div className="p-4 flex items-center justify-between h-14 shadow-sm">
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
                    "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium outline-none",
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
                      <div
                        key={r.href}
                        onClick={() => safeNavigate(r.href)}
                        className="cursor-pointer"
                      >
                          <NavLink
                            to={r.href}
                            end
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all outline-none",
                                isActive
                                  ? `${mod.accent} text-white shadow-sm`
                                  : "hover:bg-sidebar-accent text-sidebar-foreground/70"
                              )
                            }
                          >
                            <r.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{r.name}</span>
                          </NavLink>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="p-4">
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
