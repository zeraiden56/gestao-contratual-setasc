"use client";

import { useState, useEffect } from "react";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

// Função para embaralhar array
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔹 Célula do mosaico com flip automático e hover interativo
function FlipImage({
  images,
  startIndex,
  delay,
}: {
  images: string[];
  startIndex: number;
  delay?: number;
}) {
  const [index, setIndex] = useState(startIndex);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!images.length) return;

    let timer: NodeJS.Timeout;

    const flip = () => {
      setFlipped(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % images.length);
        setFlipped(false);
        const next = 10000 + Math.random() * 10000;
        timer = setTimeout(flip, next);
      }, 600);
    };

    timer = setTimeout(flip, 5000 + (delay || 0));
    return () => clearTimeout(timer);
  }, [images, delay]);

  return (
    <div
      className="relative w-full h-full aspect-square perspective cursor-pointer"
      onMouseEnter={() => {
        setFlipped(true);
        setTimeout(() => {
          setIndex((prev) => (prev + 1) % images.length);
          setFlipped(false);
        }, 600);
      }}
    >
      <div
        className={`absolute inset-0 transition-transform duration-700 transform ${
          flipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Frente */}
        <div className="absolute inset-0 backface-hidden">
          <img
            src={images[index]}
            alt=""
            className="w-full h-full object-cover rounded-sm brightness-90"
          />
        </div>
        {/* Verso */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <img
            src={images[(index + 1) % images.length]}
            alt=""
            className="w-full h-full object-cover rounded-sm brightness-90"
          />
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Imagens do mosaico
  const images = Object.values(
    import.meta.glob("/setasc/*.png", { eager: true, import: "default" })
  ) as string[];

  const shuffledIndexes = shuffle(
    Array.from({ length: 36 }, (_, i) => i % images.length)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/"); // Redireciona para dashboard
    }, 1500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Coluna esquerda - mosaico */}
      <div className="relative hidden md:flex items-center justify-center bg-black">
        <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full p-1">
          {Array.from({ length: 36 }).map((_, i) => {
            const logoStartIndex = 13;
            const logoCells = [13, 14, 15, 16, 19, 20, 21, 22];

            if (logoCells.includes(i)) {
              if (i === logoStartIndex) {
                return (
                  <div
                    key="logo"
                    className="col-span-4 row-span-2 flex items-center justify-center bg-neutral-800 rounded-lg shadow-xl"
                  >
                    <img
                      src="/layout_set_logo.png"
                      alt="Logo SETASC"
                      className="max-w-[420px] max-h-[240px] object-contain drop-shadow-xl"
                    />
                  </div>
                );
              }
              return null;
            }

            return (
              <FlipImage
                key={i}
                images={images}
                startIndex={shuffledIndexes[i]}
                delay={i * 120}
              />
            );
          })}
        </div>
        <div className="absolute inset-0 bg-white/20 pointer-events-none" />
      </div>

      {/* Coluna direita - login */}
      <div
        className="flex items-center justify-center p-8"
        style={{ background: "var(--gradient-login)" }}
      >
        <Card className="w-full max-w-md backdrop-blur-lg bg-white/95 dark:bg-zinc-900/90 shadow-xl rounded-2xl border border-white/30 dark:border-zinc-800 transition-helium animate-fadeIn text-slate-800 dark:text-slate-100">
          <CardHeader className="text-center space-y-4">
            <img
              src="/logo_helium.png"
              alt="Logo Helium"
              className="w-16 h-16 mx-auto"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(19%) sepia(92%) saturate(1741%) hue-rotate(199deg) brightness(92%) contrast(96%)",
              }}
            />
            <div>
              <h1 className="text-3xl font-bold text-[#1e3a8a] dark:text-white">
                Helium
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Sistema de Gestão de Contratos — SETASC/MT
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
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
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
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
                      <FiEyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <FiEye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Lembrar-me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Manter conectado
                </Label>
              </div>

              {/* Botão Entrar */}
              <Button
                type="submit"
                className="w-full helium-button-primary disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>

              {/* Links de suporte */}
              <div className="text-center space-y-2">
                <Button
                  variant="link"
                  className="text-sm text-[#1e3a8a]/70 hover:text-[#1e3a8a] dark:text-blue-400"
                >
                  Esqueceu sua senha?
                </Button>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Precisa de ajuda? Contate o suporte técnico
                  <br />
                  <strong>suporte@setasc.mt.gov.br</strong> | (65) 3613-3000
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
