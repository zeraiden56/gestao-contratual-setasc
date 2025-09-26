import { useState } from "react";
import { FiMenu, FiUser, FiBell, FiSettings, FiLogOut } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  onMenuClick?: () => void;
  userName?: string;
  userEmail?: string;
  systemTitle?: string;
}

export const Header = ({ 
  onMenuClick, 
  userName = "João Silva", 
  userEmail = "joao.silva@setasc.mt.gov.br",
  systemTitle = "Sistema de Gestão de Contratos - SETASC/MT"
}: HeaderProps) => {
  const [notifications] = useState(3);

  return (
    <header className="helium-header h-16 px-6 flex items-center justify-between w-full">
      {/* Logo e Menu */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="text-header-foreground hover:bg-white/10 lg:hidden"
        >
          <FiMenu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center">
            <span className="text-sm font-bold text-white">H</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-header-foreground">Helium</h1>
            <p className="text-xs text-header-foreground/80">{systemTitle}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notificações */}
        <Button
          variant="ghost"
          size="sm"
          className="text-header-foreground hover:bg-white/10 relative"
        >
          <FiBell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>

        {/* Menu do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full text-header-foreground hover:bg-white/10"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.jpg" alt={userName} />
                <AvatarFallback className="bg-white/20 text-header-foreground">
                  {userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <FiUser className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FiSettings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <FiLogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};