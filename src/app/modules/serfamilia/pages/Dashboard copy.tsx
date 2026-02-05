"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSerfamilia } from "../hooks/useSerfamilia";
import { useIBGE } from "../hooks/useIBGE";
import { Mapa } from "../components/Mapa";

/* ==== Logos & Paleta por Programa ==== */
const programaLogos: Record<string, string> = {
  CRIANÇA: "/SER Familia Criança.png",
  HABITAÇÃO: "/SER Familia Habitacao.png",
  IDOSO: "/SER Familia Idoso.png",
  INCLUSIVO: "/SER Familia Inclusivo.png",
  INDÍGENA: "/SER Familia Indigena.png",
  MULHER: "/SER Familia Mulher.png",
  SOLIDÁRIO: "/SER Familia Solidario.png",
  CNH: "/SER-FAMÍLIA-CNH-SOCIAL.png",
  PADRÃO: "/SER Familia.png",
};

const programaCores: Record<string, { bg: string; ring: string; text: string }> = {
  CRIANÇA:   { bg: "from-pink-100 to-pink-50",       ring: "ring-pink-200",   text: "text-pink-700" },
  HABITAÇÃO: { bg: "from-rose-100 to-rose-50",       ring: "ring-rose-200",   text: "text-rose-700" },
  IDOSO:     { bg: "from-amber-100 to-amber-50",     ring: "ring-amber-200",  text: "text-amber-700" },
  INCLUSIVO: { bg: "from-sky-100 to-sky-50",         ring: "ring-sky-200",    text: "text-sky-700" },
  INDÍGENA:  { bg: "from-green-100 to-green-50",     ring: "ring-green-200",  text: "text-green-700" },
  MULHER:    { bg: "from-rose-100 to-rose-50",       ring: "ring-rose-200",   text: "text-rose-700" },
  SOLIDÁRIO: { bg: "from-indigo-100 to-indigo-50",   ring: "ring-indigo-200", text: "text-indigo-700" },
  CNH:       { bg: "from-blue-100 to-blue-50",       ring: "ring-blue-200",   text: "text-blue-700" },
  PADRÃO:    { bg: "from-gray-100 to-gray-50",       ring: "ring-gray-200",   text: "text-gray-700" },
};

/* ==== Utils ==== */
const moeda = (v?: number) =>
  v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const numero = (v?: number) => (v ? v.toLocaleString("pt-BR") : "—");

/* ==== Cartão de programa ==== */
function ProgramCard({ nome, quantidade, valor }:{
  nome: string; quantidade: number; valor: number;
}) {
  const upper = nome.toUpperCase();
  const key =
    (Object.keys(programaCores).find((k) => upper.includes(k)) as keyof typeof programaCores) ||
    "PADRÃO";
  const pal = programaCores[key];
  const logoKey =
    (Object.keys(programaLogos).find((k) => upper.includes(k)) as keyof typeof programaLogos) ||
    "PADRÃO";

  return (
    <div className={`flex flex-col items-center justify-between bg-gradient-to-br ${pal.bg} ring-1 ${pal.ring} rounded-2xl p-4 w-full shadow-sm`}>
      <img src={programaLogos[logoKey]} alt={nome} className="w-20 h-20 object-contain" />
      <h3 className={`font-bold text-center text-sm leading-tight uppercase mt-2 ${pal.text}`}>{nome}</h3>
      <div className="mt-1 text-center space-y-0.5">
        <div className="text-blue-900 text-sm font-semibold">{numero(quantidade)} famílias</div>
        <div className="text-green-700 font-bold text-sm">{moeda(valor)}</div>
      </div>
    </div>
  );
}

/* ==== KPI ==== */
function Kpi({ label, value, tone = "blue" }:{
  label: string; value: string; tone?: "blue"|"green";
}) {
  const toneClasses = tone === "blue"
    ? "bg-blue-50 border-blue-200 text-blue-800"
    : "bg-green-50 border-green-200 text-green-800";
  return (
    <div className={`rounded-2xl border ${toneClasses} p-4 flex-1 min-w-[220px]`}>
      <div className="text-xs uppercase tracking-wide font-semibold opacity-70">{label}</div>
      <div className="text-3xl font-extrabold leading-tight mt-1">{value}</div>
    </div>
  );
}

/* ==== Dropdown de municípios (search + lista com bandeira) ==== */
function CityDropdown({
  aberto, setAberto, cidades, bandeiras, onEscolher, valorInput, setValorInput
}:{
  aberto: boolean;
  setAberto: React.Dispatch<React.SetStateAction<boolean>>; // permite setAberto(a => !a)
  cidades: string[];
  bandeiras: {cidade: string; url: string}[];
  onEscolher: (nome: string)=>void;
  valorInput: string;
  setValorInput: (v: string)=>void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [setAberto]);

  const itens = useMemo(() => {
    const q = valorInput.trim().toLowerCase();
    const arr = q ? cidades.filter(c => c.toLowerCase().includes(q)) : cidades;
    return arr.slice(0, 60);
  }, [cidades, valorInput]);

  const urlFlag = (nome: string) =>
    bandeiras.find(b => b.cidade.toLowerCase() === nome.toLowerCase())?.url || "/bandeiras/mt.png";

  return (
    <div className="relative" ref={boxRef}>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">Município</label>
        <div className="relative">
          <input
            value={valorInput}
            onChange={(e)=>{ setValorInput(e.target.value); setAberto(true); }}
            onFocus={()=>setAberto(true)}
            placeholder="Digite ou selecione…"
            className="border rounded-lg px-3 py-2 w-72 shadow-sm bg-white pr-8"
          />
          <button
            aria-label="Abrir lista"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-2 text-slate-500"
            onClick={()=>setAberto(a=>!a)}
          >▾</button>
        </div>
      </div>

      {aberto && (
        <div className="absolute z-[70] mt-2 w-[22rem] max-h-80 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg">
          <div className="p-2 text-xs text-slate-500">Selecione um município</div>
          {itens.map((nome) => (
            <button
              key={nome}
              onClick={() => { onEscolher(nome); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left"
            >
              <img src={urlFlag(nome)} alt="" className="w-6 h-4 object-cover border rounded" />
              <span className="text-sm text-slate-800">{nome}</span>
            </button>
          ))}
          {itens.length === 0 && (
            <div className="p-3 text-sm text-slate-500">Nenhum município encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==== Página principal ==== */
export default function SerfamiliaDashboard() {
  const { dados, loading } = useSerfamilia();

  // seleção
  const [cidade, setCidade] = useState<string>(""); // vazio = MT
  const [ano, setAno] = useState<number>(2025);

  // dropdown/busca
  const [ddAberto, setDdAberto] = useState(false);
  const [valorInput, setValorInput] = useState("");

  // bandeiras
  const [bandeiras, setBandeiras] = useState<{ cidade: string; url: string }[]>([]);
  const [bandeiraErro, setBandeiraErro] = useState(false);

  // carregar bandeiras
  useEffect(() => {
    fetch("/bandeiras_mt.json").then(r=>r.json()).then(setBandeiras).catch(()=>{});
  }, []);

  // lista de cidades
  const cidades = useMemo(
    () =>
      [...new Set((dados?.cidades || []).map((c) => c.cidade))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [dados]
  );

  // anos presentes (não é usado nos botões fixos, mas útil se quiser validar)
  const anosDisponiveis = useMemo<number[]>(() => {
    const brutos = (dados?.cidades || []).map((c: any) => Number(c.ano));
    const soNumeros = brutos.filter((x): x is number => Number.isFinite(x));
    const unicos = Array.from(new Set(soNumeros));
    unicos.sort((a, b) => b - a);
    return unicos;
  }, [dados]);

  const ANOS_FIXOS: number[] = [2023, 2024, 2025];

  // escolha (dropdown ou mapa)
  const escolherCidade = (nome: string) => {
    setCidade(nome);
    setValorInput(nome);
    setBandeiraErro(false);
    setDdAberto(false);
  };
  const handleSelectCidade = (nome: string) => {
    setCidade(nome || "");
    setValorInput(nome || "");
    setBandeiraErro(false);
  };

  // brasão/bandeira
  const bandeiraSrc = useMemo(() => {
    if (!cidade) return "/brasao-mt.png";
    const b = bandeiras.find((b) => b.cidade.toLowerCase() === cidade.toLowerCase());
    return b?.url || "/bandeiras/mt.png";
  }, [cidade, bandeiras]);

  // agregados
  const cidadeDados =
    cidade && cidade !== "Mato Grosso"
      ? (dados?.cidades || []).find((c) => c.cidade === cidade && c.ano === ano)
      : null;

  const totalCartoes = useMemo(() => {
    if (!dados) return 0;
    return cidadeDados
      ? cidadeDados.quantidade
      : (dados.cidades || [])
          .filter((c) => c.ano === ano)
          .reduce((acc, c) => acc + c.quantidade, 0);
  }, [dados, cidadeDados, ano]);

  const totalValor = useMemo(() => {
    if (!dados) return 0;
    return cidadeDados
      ? cidadeDados.valor
      : (dados.cidades || [])
          .filter((c) => c.ano === ano)
          .reduce((acc, c) => acc + c.valor, 0);
  }, [dados, cidadeDados, ano]);

  const programas = useMemo(() => {
    if (!dados) return [];
    if (cidadeDados) return cidadeDados.programas || [];
    const progAgg: Record<number, any> = {};
    (dados.cidades || [])
      .filter((c) => c.ano === ano)
      .forEach((c) =>
        c.programas.forEach((p: any) => {
          if (!progAgg[p.codProduto]) progAgg[p.codProduto] = { ...p, quantidade: 0, valor: 0 };
          progAgg[p.codProduto].quantidade += p.quantidade;
          progAgg[p.codProduto].valor += p.valor;
        })
      );
    return Object.values(progAgg);
  }, [dados, cidadeDados, ano]);

  // IBGE (município selecionado) — usar o hook atualizado que restringe à UF 51
  const { dados: ibge, loading: ibgeLoading } = useIBGE(cidade || "");

  // ─────────────────────────────────────────────
  if (loading || !dados) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 bg-white">
        Carregando SER Família…
      </div>
    );
  }
  // ─────────────────────────────────────────────

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-white"
      style={{
        backgroundImage: "url('/brasao-estado-mt.jpeg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-white/95 to-white pointer-events-none" />

      <div className="relative z-10 p-6 space-y-6">
        {/* Cabeçalho + controles */}
        <div className="relative z-[60] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow p-5 flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex items-center gap-4">
            <img src="/SER Familia.png" alt="SER Família" className="h-16 object-contain" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SER Família · Cartões</h1>
              <p className="text-slate-600 text-sm">Panorama por município e ano de referência</p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex flex-wrap items-end gap-4">
            <CityDropdown
              aberto={ddAberto}
              setAberto={setDdAberto}
              cidades={cidades}
              bandeiras={bandeiras}
              onEscolher={escolherCidade}
              valorInput={valorInput}
              setValorInput={setValorInput}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Ano</label>
              <div className="flex gap-2">
                {ANOS_FIXOS.map((a: number) => (
                  <button
                    key={a}
                    onClick={() => setAno(a)}
                    className={`px-3 py-2 rounded-lg border text-sm transition ${
                      ano === a
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 hover:bg-blue-50 border-slate-300"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Linha principal: Card do município + Mapa (mapa maior) */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Card do município (inclui Programas) — 3 colunas */}
          <div className="xl:col-span-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {!bandeiraErro && (
                <img
                  src={bandeiraSrc}
                  alt={`Bandeira de ${cidade || "Mato Grosso"}`}
                  className="w-20 h-14 border rounded object-contain"
                  onError={() => setBandeiraErro(true)}
                />
              )}
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {cidade ? "Município" : "Estado"}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{cidade || "Mato Grosso"}</h2>
                <div className="text-sm text-slate-500">Ano: {ano}</div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Kpi label="Famílias beneficiadas" value={String(numero(totalCartoes))} tone="blue" />
              <Kpi label="Valor investido" value={String(moeda(totalValor))} tone="green" />
            </div>

            {/* IBGE (se município) */}
            {cidade && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl border p-3">
                  <div className="text-[11px] text-slate-500">População</div>
                  <div className="text-lg font-semibold">{ibgeLoading ? "—" : numero(ibge?.populacao || undefined)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl border p-3">
                  <div className="text-[11px] text-slate-500">PIB (R$)</div>
                  <div className="text-lg font-semibold">{ibgeLoading ? "—" : moeda(ibge?.pib || undefined)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl border p-3">
                  <div className="text-[11px] text-slate-500">Renda per capita (R$)</div>
                  <div className="text-lg font-semibold">{ibgeLoading ? "—" : moeda(ibge?.renda || undefined)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl border p-3">
                  <div className="text-[11px] text-slate-500">Ano referência</div>
                  <div className="text-lg font-semibold">{ibgeLoading ? "—" : (ibge?.anoReferencia ?? "—")}</div>
                </div>
              </div>
            )}

            {/* Programas dentro do card */}
            <div className="mt-2">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Programas SER Família</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {programas.map((p: any) => (
                  <ProgramCard key={`${p.codProduto}-${p.nome}`} nome={p.nome} quantidade={p.quantidade} valor={p.valor} />
                ))}
              </div>
            </div>
          </div>

          {/* Mapa — 2 colunas, alto e com z-index abaixo do dropdown */}
          <div className="xl:col-span-2 relative z-[40] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow p-3">
            <div className="h-[560px]"> {/* altura maior */}
              <Mapa
                dados={dados}
                cidadeSelecionada={cidade}
                onSelectCidade={handleSelectCidade}
                anoSelecionado={String(ano)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
