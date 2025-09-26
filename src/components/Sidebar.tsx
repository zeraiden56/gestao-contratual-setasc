import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  FiFileText, 
  FiUsers, 
  FiDollarSign, 
  FiFolder,
  FiBarChart,
  FiSettings,
  FiHome,
  FiChevronLeft
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: FiHome },
  { name: "Contratos", href: "/contratos", icon: FiFileText },
  { name: "Gestores", href: "/gestores", icon: FiUsers },
  { name: "Fiscais", href: "/fiscais", icon: FiBarChart },
  { name: "Pagamentos", href: "/pagamentos", icon: FiDollarSign },
  { name: "Documentos", href: "/documentos", icon: FiFolder },
  { name: "Configurações", href: "/configuracoes", icon: FiSettings },
];

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "helium-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header da sidebar */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center">
                  <span className="text-sm font-bold text-sidebar-primary-foreground">S</span>
                </div>
                <div>
                  <h2 className="text-sm font-semibold">SETASC</h2>
                  <p className="text-xs text-sidebar-foreground/70">Contratos</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="text-sidebar-foreground hover:bg-sidebar-accent p-1.5 h-auto hidden lg:flex"
            >
              <FiChevronLeft 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isCollapsed && "rotate-180"
                )}
              />
            </Button>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "helium-nav-item group",
                  isActive && "active",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon 
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
                  )} 
                />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer da sidebar */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn(
            "text-xs text-sidebar-foreground/50",
            isCollapsed ? "text-center" : "text-left"
          )}>
            {isCollapsed ? "v1.0" : "SETASC Contratos v1.0"}
          </div>
        </div>
      </aside>
    </>
  );
};