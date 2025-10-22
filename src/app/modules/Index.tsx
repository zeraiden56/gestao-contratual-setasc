import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      navigate(token ? "/modulos" : "/login", { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-500">
      <div className="w-full max-w-md text-center">
        <img src="/logo_helium.png" alt="Helium" className="h-20 mx-auto mb-6 drop-shadow-lg" />
        <h1 className="text-4xl font-bold text-white">Helium</h1>
        <p className="text-white/70 mb-8">Sistema de Gestão Governamental</p>

        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/40 border-t-white rounded-full animate-spin"></div>
          <p className="text-white/80 animate-pulse">Inicializando...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
