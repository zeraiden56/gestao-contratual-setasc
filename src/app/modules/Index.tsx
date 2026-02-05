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
  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white">
      <img
        src="/logo_helium.png"
        alt="Helium"
        className="h-24 w-auto mb-8 drop-shadow-xl animate-fade-in"
      />
      <h1 className="text-4xl font-bold tracking-tight mb-2">Sistema Helium</h1>
      <p className="text-white/80 mb-10 text-sm">Gestão Integrada — Governo de Mato Grosso</p>
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
        <p className="text-white/70 text-sm animate-pulse">Inicializando módulos...</p>
      </div>
    </div>
  );
};

export default Index;
