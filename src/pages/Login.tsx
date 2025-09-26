import { useState } from "react";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulação de login
    setTimeout(() => {
      setIsLoading(false);
      // Salvar token/estado de autenticação aqui
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: 'var(--gradient-primary)' }}>
      <div className="w-full max-w-md">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">H</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Helium</h1>
          <p className="text-white/80">Sistema de Gestão Governamental</p>
        </div>

        {/* Card de login */}
        <Card className="helium-card backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Entrar no Sistema
            </CardTitle>
            <p className="text-muted-foreground">
              SETASC - Secretaria de Administração
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@setasc.mt.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 helium-input"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 helium-input"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Lembrar-me */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal"
                >
                  Lembrar-me neste dispositivo
                </Label>
              </div>

              {/* Botão de submit */}
              <Button 
                type="submit" 
                className="w-full helium-button-primary"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>

              {/* Links */}
              <div className="text-center space-y-2">
                <Button variant="link" className="text-sm text-muted-foreground">
                  Esqueceu sua senha?
                </Button>
                <div className="text-xs text-muted-foreground">
                  Precisa de ajuda? Entre em contato com o suporte técnico
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-white/60 text-sm">
          <p>© 2024 SETASC - Mato Grosso</p>
          <p>Sistema desenvolvido para gestão de contratos administrativos</p>
        </div>
      </div>
    </div>
  );
}