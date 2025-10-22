import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        {/* Logo SETASC */}
        <img
          src="/layout_set_logo.png"
          alt="SETASC Logo"
          className="w-48 h-auto mx-auto mb-6"
        />

        {/* Mensagem de erro */}
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-lg text-gray-700">
          Não encontramos a página que você procura.
        </p>

        {/* Botão para voltar */}
        <Button
          onClick={() => navigate("/")}
          className="helium-button-primary"
        >
          Voltar para o Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
