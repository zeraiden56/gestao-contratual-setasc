import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiMaximize, FiMinimize, FiExternalLink } from "react-icons/fi";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
}

export const Header = ({
  onMenuClick,
  sidebarOpen = true,
  sidebarCollapsed = false,
}: HeaderProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 🔹 Verifica se está no módulo de contratos
  const estaNosContratos = location.pathname.startsWith("/contratos");

  return (
    <header
      className={cn(
        "h-[90px] lg:h-[112px] px-6 flex items-center justify-between w-full bg-slate-900 text-white shadow transition-all duration-300",
        sidebarOpen
          ? sidebarCollapsed
            ? "lg:pl-16"
            : "lg:pl-64"
          : "lg:pl-6"
      )}
    >
      {/* Logo e menu lateral */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="text-white hover:bg-white/10 lg:hidden"
        >
          <FiMenu className="h-6 w-6" />
        </Button>

        <img
          src="/layout_set_logo.png"
          alt="SETASC Logo"
          className="h-[73px] lg:h-[84px] w-auto object-contain"
        />
      </div>

      {/* Botões do lado direito */}
      <div className="flex items-center gap-4">
        {/* 🔹 Botão para abrir a planilha — só aparece no módulo de contratos */}
        {estaNosContratos && (
          <a
            href="https://docs.google.com/spreadsheets/d/1S_0lT44HGEWlB04mFB6AWco5YkK0f_bFbQjRZFJ-JgI/edit?gid=1360085164#gid=1360085164"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="default"
              size="sm"
              className="bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 flex items-center gap-2 border border-blue-300"
              title="Abrir planilha de controle de contratos"
            >
              <FiExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Planilha de Contratos</span>
            </Button>
          </a>
        )}

        {/* Botão de Tela Cheia */}
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? (
            <FiMinimize className="h-6 w-6" />
          ) : (
            <FiMaximize className="h-6 w-6" />
          )}
        </Button>
      </div>
    </header>
  );
};
