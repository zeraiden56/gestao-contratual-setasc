// src/app/modules/serfamilia/pages/Dashboard.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { useSerfamilia } from "../hooks/useSerfamilia";
import { useIBGE } from "../hooks/useIBGE";
import { Mapa } from "../components/Mapa";
import { RelatorioPdfButton } from "../components/RelatorioPdfButton";

/* ──────────────────────────────────────────────────────────────
  Utils
────────────────────────────────────────────────────────────── */
const moeda = (v?: number | null) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

const numero = (v?: number | null) =>
  v != null ? v.toLocaleString("pt-BR") : "—";

const decimal = (v?: number | null, digits = 1) =>
  v != null
    ? v.toLocaleString("pt-BR", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";

const percentual = (v?: number | null, digits = 1) =>
  v != null ? `${decimal(v, digits)} %` : "—";

function norm(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

const sameCity = (a?: string, b?: string) => {
  if (!a || !b) return false;
  return norm(a) === norm(b);
};

/* ──────────────────────────────────────────────────────────────
  FitNumber — ajusta o font-size para sempre caber no container
────────────────────────────────────────────────────────────── */
function FitNumber({
  children,
  min = 12,
  max = 20,
  step = 1,
  className = "",
}: {
  children: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [size, setSize] = useState(max);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const txt = textRef.current;
    if (!box || !txt) return;

    let s = max;
    txt.style.fontSize = `${s}px`;
    txt.style.whiteSpace = "nowrap";

    const limit = box.clientWidth || 0;
    if (!limit) return;

    for (let i = 0; i < 200 && txt.scrollWidth > limit && s > min; i++) {
      s -= step;
      txt.style.fontSize = `${s}px`;
    }
    setSize(s);
  }, [max, min, step]);

  useLayoutEffect(() => {
    fit();
  }, [fit, children]);

  useEffect(() => {
    const ro = new ResizeObserver(() => fit());
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div
      ref={boxRef}
      className={`w-full min-w-0 overflow-hidden ${className}`}
    >
      <span
        ref={textRef}
        style={{ fontSize: size }}
        className="block font-bold leading-none"
      >
        {children}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
  Programas – cores + ícones
────────────────────────────────────────────────────────────── */
type ProgramMeta = { title: string; bg: string; icon: string };

// metas “clássicas”
const META_CRIANCA: ProgramMeta = {
  title: "SER Família Criança",
  bg: "bg-rose-600",
  icon: "SER Familia Criança.png",
};
const META_IDOSO: ProgramMeta = {
  title: "SER Família Idoso",
  bg: "bg-slate-700",
  icon: "SER Familia Idoso.png",
};
const META_INCLUSIVO: ProgramMeta = {
  title: "SER Família Inclusivo",
  bg: "bg-sky-600",
  icon: "SER Familia Inclusivo.png",
};
const META_INDIGENA: ProgramMeta = {
  title: "SER Família Indígena",
  bg: "bg-emerald-700",
  icon: "SER Familia Indigena.png",
};
const META_FAMILIA: ProgramMeta = {
  title: "SER Família",
  bg: "bg-slate-700",
  icon: "SER Familia.png",
};

// metas extras (todos usam SER Família em alguma variação)
const META_AUTISTA: ProgramMeta = {
  title: "Carteira do Autista",
  bg: "bg-indigo-600",
  icon: "SER Familia Carteira Autista.png",
};
const META_CASAMENTO: ProgramMeta = {
  title: "Casamento Abençoado",
  bg: "bg-purple-700",
  icon: "SER Familia Casamento Abençoado.png",
};
const META_ACONCHEGO: ProgramMeta = {
  title: "SER Família Aconchego",
  bg: "bg-orange-500",
  icon: "SER Familia Aconchego.png",
};
const META_CAPACITA: ProgramMeta = {
  title: "SER Família Capacita",
  bg: "bg-teal-600",
  icon: "SER Familia.png",
};
const META_EMERGENCIAL: ProgramMeta = {
  title: "SER Família Emergencial",
  bg: "bg-rose-700",
  icon: "SER Familia.png",
};
const META_FE_VIDA: ProgramMeta = {
  title: "SER Família Fé e Vida",
  bg: "bg-violet-700",
  icon: "SER Familia Fe e Vida.png",
};
const META_HABITACAO: ProgramMeta = {
  title: "SER Família Habitação",
  bg: "bg-amber-600",
  icon: "SER Familia.png",
};
const META_MULHER: ProgramMeta = {
  title: "SER Família Mulher",
  bg: "bg-pink-600",
  icon: "SER Familia Mulher.png",
};
const META_SOLIDARIO: ProgramMeta = {
  title: "SER Família Solidário",
  bg: "bg-emerald-800",
  icon: "SER Familia Solidario.png",
};

// mapeamento direto por código de produto
const PROGRAM_META_BY_CODE: Record<number, ProgramMeta> = {
  1054: META_CRIANCA,
  1055: META_IDOSO,
  1056: META_INCLUSIVO,
  1057: META_INDIGENA,
  1058: META_FAMILIA,

  763: META_AUTISTA,
  365: META_CASAMENTO,
  79: META_ACONCHEGO,
  618: META_CAPACITA,
  289: META_EMERGENCIAL,
  406: META_HABITACAO,
  943: META_MULHER,
};

function getProgramMeta(p: { codProduto?: number; nome?: string }): ProgramMeta {
  if (p.codProduto && PROGRAM_META_BY_CODE[p.codProduto]) {
    return PROGRAM_META_BY_CODE[p.codProduto];
  }

  const n = norm(p.nome || "");

  // programas "clássicos"
  if (n.includes("CRIAN")) return META_CRIANCA;
  if (n.includes("IDOS")) return META_IDOSO;
  if (n.includes("INCLUS")) return META_INCLUSIVO;
  if (n.includes("INDIG")) return META_INDIGENA;

  // novos programas por nome (caso um dia venha sem código certo)
  if (n.includes("AUTISTA")) return META_AUTISTA;
  if (n.includes("CASAMENTO")) return META_CASAMENTO;
  if (n.includes("ACONCHEGO")) return META_ACONCHEGO;
  if (n.includes("CAPACITA")) return META_CAPACITA;
  if (n.includes("EMERGENCIAL")) return META_EMERGENCIAL;
  if (n.includes("FE") && n.includes("VIDA")) return META_FE_VIDA;
  if (n.includes("HABITAC")) return META_HABITACAO;
  if (n.includes("MULHER")) return META_MULHER;
  if (n.includes("SOLIDARIO")) return META_SOLIDARIO;

  // fallback
  return META_FAMILIA;
}

/* Programas extras que você quer sempre mostrar, mas ainda NÃO têm código/dados */
const EXTRA_PROGRAMS_STATIC = [
  "SER Família Fé e Vida",
  "SER Família Sensorial",
  "SER Família Solidário",
];

/* ──────────────────────────────────────────────────────────────
  ProgramRow – card horizontal (faixa) com ícone grande
────────────────────────────────────────────────────────────── */
function ProgramRow({
  nome,
  beneficiarios,
  valor,
  codProduto,
  placeholder = false,
}: {
  nome: string;
  beneficiarios?: number | null;
  valor?: number | null;
  codProduto?: number;
  placeholder?: boolean;
}) {
  const meta = getProgramMeta({ codProduto, nome });

  const beneficiariosTexto =
    placeholder || beneficiarios == null
      ? "—"
      : beneficiarios.toLocaleString("pt-BR");
  const valorTexto =
    placeholder || valor == null ? "—" : moeda(Number(valor));

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-xl ${meta.bg} text-white px-4 md:px-5 py-3 md:py-4 shadow-sm`}
    >
      {/* Lado esquerdo: logo maior + nome + INVESTIMENTO */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        <img
          src={meta.icon}
          alt={meta.title}
          className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow"
          loading="lazy"
        />
        <div className="leading-tight min-w-0">
          <div className="font-extrabold tracking-tight text-sm md:text-base leading-snug whitespace-normal break-words">
            {meta.title}
          </div>
          <div className="mt-1">
            <div className="text-[11px] md:text-xs opacity-80">
              Investimento
            </div>
            <FitNumber min={10} max={20} className="mt-0.5">
              {valorTexto}
            </FitNumber>
          </div>
        </div>
      </div>

      {/* Lado direito: BENEFICIÁRIOS */}
      <div className="leading-tight w-full sm:w-auto sm:min-w-[160px] lg:min-w-[190px] text-left sm:text-right">
        <div className="text-[11px] md:text-xs opacity-80">
          Beneficiários
        </div>
        <FitNumber min={10} max={22} className="mt-0.5">
          {beneficiariosTexto}
        </FitNumber>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
  Dropdown de Municípios (com z-index alto)
────────────────────────────────────────────────────────────── */
function CityDropdown({
  aberto,
  setAberto,
  cidades,
  bandeiras,
  onEscolher,
  valorInput,
  setValorInput,
  cidadeSelecionada,
}: {
  aberto: boolean;
  setAberto: React.Dispatch<React.SetStateAction<boolean>>;
  cidades: string[];
  bandeiras: { cidade: string; url: string }[];
  onEscolher: (nome: string) => void;
  valorInput: string;
  setValorInput: (v: string) => void;
  cidadeSelecionada: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [setAberto]);

  const urlFlag = (nome: string) =>
    bandeiras.find(
      (b) => b.cidade.toLowerCase() === nome.toLowerCase()
    )?.url || "/bandeiras/mt.png";

  const itens = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const arr = q ? cidades.filter((c) => c.toLowerCase().includes(q)) : cidades;
    return arr.slice(0, 200);
  }, [cidades, searchTerm]);

  const selectedFlagUrl =
    cidadeSelecionada && bandeiras.length
      ? urlFlag(cidadeSelecionada)
      : null;

  const hasText = valorInput.trim().length > 0;

  const clear = () => {
    setValorInput("");
    setSearchTerm("");
    onEscolher(""); // volta para “Mato Grosso” / vazio
  };

  return (
    <div className="relative z-50" ref={boxRef}>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          Município
        </label>

        <div className="relative w-full sm:w-[320px]">
          {/* Bandeira da cidade selecionada */}
          {selectedFlagUrl && (
            <img
              src={selectedFlagUrl}
              alt={cidadeSelecionada}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-4 object-cover border rounded"
            />
          )}

          <input
            value={valorInput}
            onChange={(e) => {
              const v = e.target.value;
              setValorInput(v);
              setSearchTerm(v); // filtra só quando digita
              setAberto(true);
            }}
            onFocus={() => setAberto(true)}
            placeholder="Digite ou selecione…"
            className={`border rounded-lg w-full shadow-sm bg-white pr-16 py-2 ${
              selectedFlagUrl ? "pl-10" : "pl-3"
            }`}
          />

          {/* Botão X para limpar */}
          {hasText && (
            <button
              type="button"
              aria-label="Limpar município"
              className="absolute right-8 top-1/2 -translate-y-1/2 px-1 text-slate-400 hover:text-slate-600"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clear();
                setAberto(true);
              }}
            >
              ×
            </button>
          )}

          {/* Seta abre a lista completa (sem filtro) */}
          <button
            type="button"
            aria-label="Abrir lista"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-2 text-slate-500"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAberto((a) => !a);
              setSearchTerm(""); // lista completa
            }}
          >
            ▾
          </button>
        </div>
      </div>

      {aberto && (
        <div className="absolute z-[70] mt-2 w-full sm:w-[26rem] max-h-96 overflow-auto bg-white border border-slate-200 rounded-xl shadow-2xl">
          <div className="p-2 text-xs text-slate-500 sticky top-0 bg-white border-b">
            Selecione um município
          </div>
          {itens.map((nome) => (
            <button
              key={nome}
              onClick={() => {
                onEscolher(nome);
                setSearchTerm(""); // depois de escolher, próxima vez mostra tudo
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left"
            >
              <img
                src={urlFlag(nome)}
                alt=""
                className="w-6 h-4 object-cover border rounded"
              />
              <span className="text-sm text-slate-800">{nome}</span>
            </button>
          ))}
          {itens.length === 0 && (
            <div className="p-3 text-sm text-slate-500">
              Nenhum município encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
  Tipos e builder para o PDF
────────────────────────────────────────────────────────────── */
type PdfProgramCard = {
  titulo: string;
  icon: string;
  valor: number;
  quantidade: number;
};

type PdfLinhaDetalhamento = {
  cidade: string;
  ano: number;
  programa: string;
  valor: number;
  quantidade: number;
};

/** Gera todas as combinações cidade x ano x programa, zerando quando não há dado */
function buildLinhasRelatorio(
  dados: any,
  anosDisponiveis: number[],
  periodo: string
): PdfLinhaDetalhamento[] {
  if (!dados?.cidades?.length) return [];

  const anosBase =
    periodo === "ALL"
      ? anosDisponiveis
      : [Number(periodo)].filter((n) => !Number.isNaN(n));

  // cidades que têm algum dado no período escolhido
  const cidadesSet = new Set<string>();
  (dados.cidades as any[]).forEach((c) => {
    if (periodo !== "ALL" && String(c.ano) !== String(periodo)) return;
    cidadesSet.add(c.cidade);
  });
  const cidades = Array.from(cidadesSet).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  // todos os programas existentes em qualquer ano/cidade
  const programasMap = new Map<number, { codProduto: number; nome: string }>();
  (dados.cidades as any[]).forEach((c) =>
    (c.programas || []).forEach((p: any) => {
      if (!p.codProduto) return;
      if (!programasMap.has(p.codProduto)) {
        programasMap.set(p.codProduto, {
          codProduto: p.codProduto,
          nome: p.nome,
        });
      }
    })
  );
  const programas = Array.from(programasMap.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );

  // índice cidade|ano|codProduto -> agregados
  const index = new Map<string, { valor: number; quantidade: number }>();
  (dados.cidades as any[]).forEach((c) => {
    if (periodo !== "ALL" && String(c.ano) !== String(periodo)) return;
    (c.programas || []).forEach((p: any) => {
      if (!p.codProduto) return;
      const key = `${c.cidade}|${c.ano}|${p.codProduto}`;
      const prev = index.get(key) || { valor: 0, quantidade: 0 };
      prev.valor += p.valor || 0;
      prev.quantidade += p.quantidade || 0;
      index.set(key, prev);
    });
  });

  const linhas: PdfLinhaDetalhamento[] = [];

  cidades.forEach((cidade) => {
    anosBase.forEach((ano) => {
      programas.forEach((prog) => {
        const key = `${cidade}|${ano}|${prog.codProduto}`;
        const agg = index.get(key) || { valor: 0, quantidade: 0 };

        linhas.push({
          cidade,
          ano,
          programa: prog.nome,
          valor: agg.valor || 0,
          quantidade: agg.quantidade || 0,
        });
      });
    });
  });

  return linhas;
}

/* ──────────────────────────────────────────────────────────────
  Indicadores sociais (CAD/ SUAS) – placeholder seguro
────────────────────────────────────────────────────────────── */
type SocialIndicators = {
  familiasCad?: number | null;
  pessoasCad?: number | null;
  bolsa?: number | null;
  bpc?: number | null;
  cras?: number | null;
  creas?: number | null;
  pop?: number | null;
  beneficiosEventuais?: number | null;
};
async function tryFetch<T = any>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────
  Página
────────────────────────────────────────────────────────────── */
export default function SerfamiliaDashboard() {
  const { dados, loading } = useSerfamilia();

  // seleção
  const [cidade, setCidade] = useState<string>(""); // vazio = MT
  const [periodo, setPeriodo] = useState<string>("ALL");

  // dropdown/busca
  const [ddAberto, setDdAberto] = useState(false);
  const [valorInput, setValorInput] = useState("");

  // bandeiras
  const [bandeiras, setBandeiras] = useState<{ cidade: string; url: string }[]>(
    []
  );
  const [bandeiraErro, setBandeiraErro] = useState(false);
  useEffect(() => {
    fetch("/bandeiras_mt.json")
      .then((r) => r.json())
      .then(setBandeiras)
      .catch(() => {});
  }, []);

  // lista de cidades
  const cidades = useMemo(
    () =>
      [...new Set((dados?.cidades || []).map((c) => c.cidade))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [dados]
  );

  // anos disponíveis (ex.: 2019–2025) – vindo do hook
  const anosDisponiveis = useMemo(
    () => (dados?.anos ?? []).filter((a) => a >= 2019),
    [dados]
  );

  // escolhas
  const escolherCidade = (nome: string) => {
    setCidade(nome);
    setValorInput(nome);
    setBandeiraErro(false);
    setDdAberto(false);
  };

  const normalizarCidadeDoMapa = (nome?: string | null) => {
    const n = (nome || "").trim();
    if (!n) {
      setCidade("");
      setValorInput("");
      setBandeiraErro(false);
      return;
    }
    const match =
      cidades.find((c) => sameCity(c, n)) ||
      n; // fallback para caso venha um nome fora da lista
    setCidade(match);
    setValorInput(match);
    setBandeiraErro(false);
  };

  const voltarPadrao = () => {
    setCidade("");
    setValorInput("");
    setPeriodo("ALL");
    setBandeiraErro(false);
  };

  const bandeiraSrc = useMemo(() => {
    if (!cidade) return "/brasao-mt.png";
    const b = bandeiras.find((b) => sameCity(b.cidade, cidade));
    return b?.url || "/bandeiras/mt.png";
  }, [cidade, bandeiras]);

  // IBGE
  const { dados: ibge, loading: ibgeLoading } = useIBGE(cidade || "");

  // Indicadores sociais (placeholder)
  const [sociais, setSociais] = useState<SocialIndicators>({});
  useEffect(() => {
    let abort = false;
    async function load() {
      const fake = await tryFetch<any>("about:blank"); // sempre null
      if (!abort) {
        setSociais({
          familiasCad: fake?.familias || null,
          pessoasCad: fake?.pessoas || null,
          bolsa: fake?.bolsa || null,
          bpc: fake?.bpc || null,
          cras: fake?.cras || null,
          creas: fake?.creas || null,
          pop: fake?.pop || null,
          beneficiosEventuais: fake?.beneficios || null,
        });
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [cidade, periodo]);

  // Agregações
  const anoAtivoLabel = periodo === "ALL" ? "Todos os anos" : periodo;
  const cidadeDados = useMemo(() => {
    if (!dados) return null;
    if (!cidade) return null; // estado inteiro

    if (periodo === "ALL") {
      const blocos = (dados.cidades || []).filter((c: any) =>
        sameCity(c.cidade, cidade)
      );
      if (!blocos.length) return null;
      const programasAgg: any = {};
      let qtd = 0;
      let val = 0;
      blocos.forEach((b: any) => {
        qtd += b.quantidade || 0;
        val += b.valor || 0;
        (b.programas || []).forEach((p: any) => {
          if (!programasAgg[p.codProduto])
            programasAgg[p.codProduto] = { ...p, quantidade: 0, valor: 0 };
          programasAgg[p.codProduto].quantidade += p.quantidade || 0;
          programasAgg[p.codProduto].valor += p.valor || 0;
        });
      });
      return {
        cidade,
        ano: "ALL",
        quantidade: qtd,
        valor: val,
        programas: Object.values(programasAgg),
      };
    } else {
      return (dados.cidades || []).find(
        (c: any) =>
          sameCity(c.cidade, cidade) && String(c.ano) === String(periodo)
      );
    }
  }, [dados, cidade, periodo]);

  const totalValor = useMemo(() => {
    if (!dados) return 0;
    if (cidadeDados) return cidadeDados.valor || 0;
    if (periodo === "ALL")
      return (dados.cidades || []).reduce(
        (acc: number, c: any) => acc + (c.valor || 0),
        0
      );
    return (dados.cidades || [])
      .filter((c: any) => String(c.ano) === periodo)
      .reduce((acc: number, c: any) => acc + (c.valor || 0), 0);
  }, [dados, cidadeDados, periodo]);

  const totalCartoes = useMemo(() => {
    if (!dados) return 0;
    if (cidadeDados) return cidadeDados.quantidade || 0;
    if (periodo === "ALL")
      return (dados.cidades || []).reduce(
        (acc: number, c: any) => acc + (c.quantidade || 0),
        0
      );
    return (dados.cidades || [])
      .filter((c: any) => String(c.ano) === periodo)
      .reduce((acc: number, c: any) => acc + (c.quantidade || 0), 0);
  }, [dados, cidadeDados, periodo]);

  const programas = useMemo(() => {
    if (!dados) return [];
    if (cidadeDados) return cidadeDados.programas || [];

    const progAgg: Record<number, any> = {};
    const base =
      periodo === "ALL"
        ? (dados.cidades || [])
        : (dados.cidades || []).filter((c: any) => String(c.ano) === periodo);

    base.forEach((c: any) =>
      (c.programas || []).forEach((p: any) => {
        if (!progAgg[p.codProduto])
          progAgg[p.codProduto] = { ...p, quantidade: 0, valor: 0 };
        progAgg[p.codProduto].quantidade += p.quantidade || 0;
        progAgg[p.codProduto].valor += p.valor || 0;
      })
    );
    return Object.values(progAgg);
  }, [dados, cidadeDados, periodo]);

  // adiciona placeholders dos programas extras que ainda não existem no banco
  const programasComExtras = useMemo(() => {
    const existentesNorm = new Set(
      (programas as any[]).map((p) => norm(p.nome || ""))
    );

    const extrasPlaceholder = EXTRA_PROGRAMS_STATIC.filter(
      (nome) => !existentesNorm.has(norm(nome))
    ).map((nome) => ({
      nome,
      quantidade: null,
      valor: null,
      __placeholder: true,
    }));

    return [...(programas as any[]), ...extrasPlaceholder];
  }, [programas]);

  // Dados para o PDF
  const programCardsPdf = useMemo<PdfProgramCard[]>(() => {
    return (programasComExtras as any[])
      .slice()
      .sort((a: any, b: any) => {
        const order = [1054, 1055, 1056, 1057, 1058];
        const ia = order.indexOf(Number(a.codProduto));
        const ib = order.indexOf(Number(b.codProduto));
        const pa = ia === -1 ? 99 : ia;
        const pb = ib === -1 ? 99 : ib;
        if (pa !== pb) return pa - pb;
        return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
      })
      .map((p: any) => {
        const meta = getProgramMeta({
          codProduto: p.codProduto,
          nome: p.nome,
        });
        return {
          titulo: meta.title,
          icon: meta.icon,
          valor: p.__placeholder ? 0 : Number(p.valor || 0),
          quantidade: p.__placeholder ? 0 : Number(p.quantidade || 0),
        };
      });
  }, [programasComExtras]);

  const linhasDetalhamentoPdf = useMemo<PdfLinhaDetalhamento[]>(
    () => buildLinhasRelatorio(dados, anosDisponiveis, periodo),
    [dados, anosDisponiveis, periodo]
  );

  // Loading com brasão girando/pulando
  if (loading || !dados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-bounce">
            <img
              src="/brasao-carregamento.png"
              alt="Carregando página"
              className="w-24 h-24 sm:w-32 sm:h-32 animate-spin"
            />
          </div>
          <div className="text-sm sm:text-base font-medium text-slate-600">
            Carregando página!
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.96)), url('/brasao-estado-mt.jpeg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      {/* container mais largo, aproveitando melhor a tela */}
      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cabeçalho / filtros em card branco */}
        <div className="bg-white/95 border rounded-2xl shadow-sm px-4 sm:px-5 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between z-40">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src="SER Familia.png"
                className="h-12 sm:h-16 lg:h-20 object-contain"
                alt="SER Família"
              />
              <div>
                <div className="text-lg sm:text-2xl lg:text-[28px] font-semibold text-slate-700">
                  SER Família · Painel Social
                </div>
                <div className="text-xs sm:text-sm text-slate-500">
                  Filtros por município e período
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 lg:items-end">
              <div className="w-full sm:w-auto">
                <CityDropdown
                  aberto={ddAberto}
                  setAberto={setDdAberto}
                  cidades={cidades}
                  bandeiras={bandeiras}
                  onEscolher={escolherCidade}
                  valorInput={valorInput}
                  setValorInput={setValorInput}
                  cidadeSelecionada={cidade}
                />
              </div>

              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-xs font-semibold text-slate-600 block">
                  Período
                </label>
                <div className="flex flex-wrap gap-2">
                  {anosDisponiveis.map((a) => {
                    const label = String(a);
                    return (
                      <button
                        key={a}
                        onClick={() => setPeriodo(label)}
                        className={`px-3 py-2 rounded-lg text-sm transition border ${
                          periodo === label
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 hover:bg-blue-50 border-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPeriodo("ALL")}
                    className={`px-3 py-2 rounded-lg text-sm transition border ${
                      periodo === "ALL"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 hover:bg-blue-50 border-slate-300"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={voltarPadrao}
                    className="px-3 py-2 rounded-lg text-sm transition border bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
                    title="Voltar ao padrão (Estado de Mato Grosso • Todos os anos)"
                  >
                    Estado de Mato Grosso
                  </button>
                </div>
              </div>

              {/* Botão do PDF */}
              <div className="w-full sm:w-auto flex sm:justify-end">
                <RelatorioPdfButton
                  cidade={cidade}
                  periodoLabel={anoAtivoLabel}
                  periodoRaw={periodo}
                  totalValor={totalValor}
                  totalCartoes={totalCartoes}
                  cardsProgramas={programCardsPdf}
                  linhasDetalhamento={linhasDetalhamentoPdf}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Linha principal */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Coluna esquerda (hero + programas) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Hero */}
            <div className="rounded-2xl shadow-sm border overflow-hidden bg-gradient-to-r from-fuchsia-500 via-fuchsia-400 to-pink-400 text-white">
              <div className="p-5 flex items-center gap-3 sm:gap-4">
                {!bandeiraErro && (
                  <img
                    src={bandeiraSrc}
                    alt={cidade || "Mato Grosso"}
                    className="w-16 h-10 sm:w-20 sm:h-12 border-2 rounded-md object-cover shadow-sm"
                    onError={() => setBandeiraErro(true)}
                  />
                )}
                <div className="text-[11px] font-semibold uppercase opacity-90 tracking-wide">
                  Social
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="text-[clamp(22px,2.8vw,36px)] font-extrabold tracking-tight">
                  Investimento em {cidade || "Mato Grosso"}
                </div>
                <div className="text-sm opacity-90">{anoAtivoLabel}</div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Investimento */}
                  <div className="bg-white/10 rounded-xl p-4 ring-1 ring-white/15">
                    <div className="text-sm opacity-90">Investimento</div>
                    <FitNumber min={20} max={50} className="mt-1">
                      {moeda(totalValor)}
                    </FitNumber>
                    <div className="text-xs opacity-90 mt-1">
                      Recursos consolidados
                    </div>
                  </div>
                  {/* Famílias */}
                  <div className="bg-white/10 rounded-xl p-4 ring-1 ring-white/15">
                    <div className="text-sm opacity-90">
                      Famílias atendidas
                    </div>
                    <FitNumber min={20} max={50} className="mt-1">
                      {numero(totalCartoes)}
                    </FitNumber>
                    <div className="text-xs opacity-90 mt-1">
                      Registros no período selecionado
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Programas – faixas com ícone */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700">
                Programas SER Família
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {programasComExtras
                  .slice()
                  .sort((a: any, b: any) => {
                    const order = [1054, 1055, 1056, 1057, 1058];
                    const ia = order.indexOf(Number(a.codProduto));
                    const ib = order.indexOf(Number(b.codProduto));
                    const pa = ia === -1 ? 99 : ia;
                    const pb = ib === -1 ? 99 : ib;
                    if (pa !== pb) return pa - pb;
                    return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
                  })
                  .map((p: any) => (
                    <ProgramRow
                      key={`${p.codProduto || p.nome}-row`}
                      codProduto={p.codProduto}
                      nome={p.nome}
                      beneficiarios={
                        p.__placeholder ? null : Number(p.quantidade || 0)
                      }
                      valor={p.__placeholder ? null : Number(p.valor || 0)}
                      placeholder={Boolean(p.__placeholder)}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Coluna direita (mapa + indicadores) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-sm p-4">
              <div className="h-[260px] sm:h-[320px] lg:h-[380px]">
                <Mapa
                  dados={dados}
                  cidadeSelecionada={cidade}
                  onSelectCidade={normalizarCidadeDoMapa}
                  anoSelecionado={periodo === "ALL" ? "Todos" : periodo}
                />
              </div>
            </div>

            {/* IBGE – agora com blocos extras */}
            <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700">
                  Indicadores IBGE
                </h3>
                <div className="text-xs text-slate-500 text-right">
                  <div>{cidade || "Mato Grosso"}</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Bloco básico: população / PIB / renda / densidade */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl border p-3 min-h-[80px]">
                    <div className="flex items-baseline justify-between text-[11px] text-slate-500">
                      <span>População</span>
                      {ibge?.anoReferenciaPopulacao && (
                        <span className="text-[10px] text-slate-400">
                          {ibge.anoReferenciaPopulacao}
                        </span>
                      )}
                    </div>
                    <FitNumber min={10} max={18} className="mt-1">
                      {ibgeLoading ? "—" : numero(ibge?.populacao ?? null)}
                    </FitNumber>
                  </div>

                  <div className="bg-slate-50 rounded-xl border p-3 min-h-[80px]">
                    <div className="flex items-baseline justify-between text-[11px] text-slate-500">
                      <span>PIB (R$)</span>
                      {ibge?.anoReferenciaEconomia && (
                        <span className="text-[10px] text-slate-400">
                          {ibge.anoReferenciaEconomia}
                        </span>
                      )}
                    </div>
                    <FitNumber min={10} max={18} className="mt-1">
                      {ibgeLoading ? "—" : moeda(ibge?.pib ?? null)}
                    </FitNumber>
                  </div>

                  <div className="bg-slate-50 rounded-xl border p-3 min-h-[80px]">
                    <div className="flex items-baseline justify-between text-[11px] text-slate-500">
                      <span>Renda per capita (R$)</span>
                      {ibge?.anoReferenciaEconomia && (
                        <span className="text-[10px] text-slate-400">
                          {ibge.anoReferenciaEconomia}
                        </span>
                      )}
                    </div>
                    <FitNumber min={10} max={18} className="mt-1">
                      {ibgeLoading ? "—" : moeda(ibge?.renda ?? null)}
                    </FitNumber>
                  </div>

                  <div className="bg-slate-50 rounded-xl border p-3 min-h-[80px]">
                    <div className="flex items-baseline justify-between text-[11px] text-slate-500">
                      <span>Densidade demográfica</span>
                      {ibge?.anoReferenciaPopulacao && (
                        <span className="text-[10px] text-slate-400">
                          {ibge.anoReferenciaPopulacao}
                        </span>
                      )}
                    </div>
                    <FitNumber min={10} max={18} className="mt-1">
                      {ibgeLoading
                        ? "—"
                        : `${decimal(
                            ibge?.densidadeDemografica ?? null,
                            1
                          )} hab/km²`}
                    </FitNumber>
                  </div>
                </div>

                {/* Perfil demográfico */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Perfil demográfico
                    </div>
                    {ibge?.anoReferenciaPopulacao && (
                      <div className="text-[10px] text-slate-400">
                        Ano ref. {ibge.anoReferenciaPopulacao}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        População urbana
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(ibge?.proporcaoUrbana ?? null, 1)}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        População rural
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(ibge?.proporcaoRural ?? null, 1)}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Crianças 0–14 anos
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualCriancas0a14 ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Idosos 60+ anos
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualIdosos60Mais ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                  </div>
                </div>

                {/* Renda e vulnerabilidade */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Renda e vulnerabilidade
                    </div>
                    {ibge?.anoReferenciaEconomia && (
                      <div className="text-[10px] text-slate-400">
                        Ano ref. {ibge.anoReferenciaEconomia}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Renda domiciliar per capita
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : moeda(
                              ibge?.rendaDomiciliarPerCapita ??
                                ibge?.renda ??
                                null
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        % até ½ salário mínimo
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualBaixaRendaAteMeioSM ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Índice de Gini
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : decimal(ibge?.indiceGiniRenda ?? null, 2)}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Taxa de desocupação
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(ibge?.taxaDesocupacao ?? null, 1)}
                      </FitNumber>
                    </div>
                  </div>
                </div>

                {/* Moradia e saneamento */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Moradia e saneamento
                    </div>
                    {ibge?.anoReferenciaSaneamento && (
                      <div className="text-[10px] text-slate-400">
                        Ano ref. {ibge.anoReferenciaSaneamento}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Água via rede geral
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualDomiciliosComAguaRede ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Esgotamento adequado
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualDomiciliosComEsgotamentoAdequado ??
                                null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Coleta de lixo
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualDomiciliosComColetaLixo ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Banheiro de uso exclusivo
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualDomiciliosComBanheiroExclusivo ??
                                null,
                              1
                            )}
                      </FitNumber>
                    </div>
                  </div>
                </div>

                {/* Educação */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Educação
                    </div>
                    {ibge?.anoReferenciaEducacao && (
                      <div className="text-[10px] text-slate-400">
                        Ano ref. {ibge.anoReferenciaEducacao}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Analfabetismo (15+)
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.taxaAnalfabetismo15Mais ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Escolarização 6–14 anos
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.taxaEscolarizacao6a14 ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Escolarização 15–17 anos
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.taxaEscolarizacao15a17 ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                    <div className="bg-slate-50 rounded-xl border p-3 min-h-[70px]">
                      <div className="text-[11px] text-slate-500">
                        Jovens 15–24 nem estudam nem trabalham
                      </div>
                      <FitNumber min={10} max={18} className="mt-1">
                        {ibgeLoading
                          ? "—"
                          : percentual(
                              ibge?.percentualNemNem15a24 ?? null,
                              1
                            )}
                      </FitNumber>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicadores sociais */}
            <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700">
                  Indicadores sociais (CADÚnico / SUAS)
                </h3>
                <div className="text-xs text-slate-500">{anoAtivoLabel}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Famílias CADÚnico", v: sociais.familiasCad },
                  { label: "Pessoas CADÚnico", v: sociais.pessoasCad },
                  { label: "Bolsa Família (benef.)", v: sociais.bolsa },
                  { label: "BPC", v: sociais.bpc },
                  { label: "CRAS", v: sociais.cras },
                  { label: "CREAS", v: sociais.creas },
                  { label: "Centros POP", v: sociais.pop },
                  {
                    label: "Benefícios eventuais",
                    v: sociais.beneficiosEventuais,
                  },
                ].map((k, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-xl border p-3 min-h-[80px]"
                  >
                    <div className="text-[11px] text-slate-500">{k.label}</div>
                    <FitNumber min={10} max={18} className="mt-1">
                      {numero(k.v ?? null)}
                    </FitNumber>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
