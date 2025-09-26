import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para o dashboard após um breve delay
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center" 
         style={{ background: 'var(--gradient-primary)' }}>
      <div className="text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl font-bold">H</span>
        </div>
        <h1 className="mb-4 text-4xl font-bold">Helium</h1>
        <p className="text-xl mb-8 text-white/80">Sistema de Gestão Governamental</p>
        <div className="space-y-4">
          <p className="text-white/60">Carregando sistema...</p>
          <div className="animate-pulse">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white animate-[slide-right_2s_ease-in-out_infinite] w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
