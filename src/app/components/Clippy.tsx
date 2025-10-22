import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export default function Clippy() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 right-6 flex flex-col items-end z-50 animate-fadeIn group">
      {/* Balão de mensagem */}
      <div className="relative mb-2 max-w-xs">
        <div className="bg-white/95 border border-slate-300 shadow-md rounded-xl px-4 py-2 text-sm text-slate-700 flex items-center gap-2">
          Olá, eu sou o Demárcio, posso te ajudar?
          <button
            className="ml-2 text-slate-500 hover:text-slate-700"
            onClick={() => setVisible(false)}
          >
            <FiChevronDown />
          </button>
        </div>
        {/* Setinha apontando para o Clippy */}
        <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white border-b border-r border-slate-300 rotate-45"></div>
      </div>

      {/* Imagem do Clippy */}
      <a
        href="https://www.setasc.mt.gov.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="relative"
      >
        <img
          src="/clippy.png"
          alt="Clippy"
          className="w-52 h-auto transform scale-x-[-1] group-hover:-translate-y-2 transition-transform duration-300 cursor-pointer drop-shadow-lg"
        />
      </a>
    </div>
  );
}
