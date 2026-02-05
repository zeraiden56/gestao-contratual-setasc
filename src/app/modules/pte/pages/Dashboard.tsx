// src/app/modules/pte/pages/Dashboard.tsx
"use client";

import { useMemo, useState } from "react";
import { usePTE, PTE, Modalidade } from "../hooks/usePTE";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingCart,
  FileText,
  Wrench,
  ChevronDown,
  Search,
} from "lucide-react";

/* ----------------------- helpers ----------------------- */

function parseBR(d?: string | null): Date | null {
  if (!d) return null;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  return isNaN(dt.getTime()) ? null : dt;
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
function sla(mod: Modalidade) {
  switch (mod) {
    case "AQUISICOES": return 110;
    case "PREGOES":    return 140;
    case "OBRAS":      return 225;
    default:           return 140;
  }
}
function duracaoAdmDias(r: PTE) {
  const start = parseBR(r.fase_01_marco_zero);
  if (!start) return 0;
  const end = parseBR(r.fase_08_os_of) ?? new Date();
  return Math.max(0, diffDays(start, end));
}
function estaVencido(r: PTE) {
  const start = parseBR(r.fase_01_marco_zero);
  if (!start) return false;
  const end = parseBR(r.fase_08_os_of) ?? new Date();
  return diffDays(start, end) > sla(r.modalidade);
}
function classNameModalidade(mod: Modalidade) {
  if (mod === "AQUISICOES") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (mod === "PREGOES")    return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
  if (mod === "OBRAS")      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}
function formatNum(n?: number | null) {
  return (n ?? 0).toLocaleString("pt-BR");
}
function extractContratoNumero(r: PTE): string | null {
  const blob = `${r.produto ?? ""} ${r.descricao ?? ""}`;
  const m = blob.match(/(\d{2,}\/\d{4})/);
  return m ? m[1] : null;
}
function contratoURL(numero: string) {
  const base =
    typeof window !== "undefined" && window.location.origin.includes("localhost")
      ? window.location.origin
      : "https://setasc.blucaju.com.br";
  return `${base}/contratos/${encodeURIComponent(numero)}`;
}

/* ----------------------- página ----------------------- */

export default function PTEDashboard() {
  const { loading, error, rows, cidades, programas } = usePTE({ chunkSize: 0 });

  // filtros + busca
  const [cidade, setCidade] = useState("");
  const [programa, setPrograma] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtrados = useMemo(() => {
    let base = rows;
    if (cidade) base = base.filter((r) => r.local === cidade);
    if (programa) base = base.filter((r) => r.programa === programa);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter((r) =>
        (r.descricao ?? "").toLowerCase().includes(q) ||
        (r.produto ?? "").toLowerCase().includes(q) ||
        (r.programa ?? "").toLowerCase().includes(q) ||
        (r.acao ?? "").toLowerCase().includes(q) ||
        (r.local ?? "").toLowerCase().includes(q)
      );
    }
    return base.filter((r) => (r.descricao ?? "").trim().length > 0);
  }, [rows, cidade, programa, query]);

  const cards = useMemo(() => {
    const total = filtrados.length;
    let vencidos = 0, aVencer = 0, aquis = 0, pregoes = 0, obras = 0;
    for (const r of filtrados) {
      if (r.modalidade === "AQUISICOES") aquis++;
      else if (r.modalidade === "PREGOES") pregoes++;
      else if (r.modalidade === "OBRAS") obras++;

      const start = parseBR(r.fase_01_marco_zero);
      if (!start) continue;

      const prazo = sla(r.modalidade);
      const fim = parseBR(r.fase_08_os_of);
      if (fim) {
        if (diffDays(start, fim) > prazo) vencidos++;
      } else {
        const rest = prazo - diffDays(start, new Date());
        if (rest < 0) vencidos++;
        else if (rest <= 30) aVencer++;
      }
    }
    return { total, vencidos, aVencer, aquis, pregoes, obras };
  }, [filtrados]);

  return (
    <div className="relative min-h-screen">
      {/* BG com brasão + overlay ~90% */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(248,250,252,0.9), rgba(248,250,252,0.9)), url('/brasao-estado-mt.jpeg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundAttachment: "fixed",
        }}
      />

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-extrabold text-[#1f3a8a]">Gestão de PTE</h1>
          {loading && <span className="text-sm text-gray-500">carregando…</span>}
          {error && <span className="text-sm text-red-600">Erro: {error}</span>}
        </div>

        {/* filtros + legenda SLA */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-700 flex items-center gap-2">
            <span>Município:</span>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
            >
              <option value="">Todos</option>
              {cidades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-700 flex items-center gap-2">
            <span>Programa:</span>
            <select
              value={programa}
              onChange={(e) => setPrograma(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
            >
              <option value="">Todos</option>
              {programas.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por descrição, produto, programa, ação ou município…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white shadow-sm placeholder:text-gray-400"
            />
          </div>

          <div className="w-full md:w-auto md:ml-auto flex items-center gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              Prazo até OS/OF:
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">Aquisições 110d</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">Pregões 140d</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">Obras 225d</span>
              <span className="hidden sm:inline">• Duração Adm (d) = Marco Zero → OS/OF (ou hoje)</span>
              <span className="inline-flex items-center gap-1">• <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> prazo estourado</span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card color="bg-blue-600"  icon={<CheckCircle2 />} title="Projetos Totais" value={cards.total} />
          <Card color="bg-red-600"   icon={<AlertTriangle />} title="Vencidos" value={cards.vencidos} />
          <Card color="bg-amber-500" icon={<Clock />} title="A vencer (30 dias)" value={cards.aVencer} />
          <Card color="bg-green-600" icon={<ShoppingCart />} title="Aquisições" value={cards.aquis} />
          <Card color="bg-indigo-600" icon={<FileText />} title="Pregões" value={cards.pregoes} />
          <Card color="bg-orange-600" icon={<Wrench />} title="Obras" value={cards.obras} />
        </div>

        {/* ---------- Tabela com largura/altura padronizadas ---------- */}
        <div className="rounded-2xl border shadow-sm overflow-hidden bg-white/80 backdrop-blur">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">PTEs</h2>
          </div>

          <div className="max-w-full overflow-x-auto">
            {/* table-fixed garante colunas consistentes; colgroup dita as larguras */}
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "40px" }} />     {/* caret */}
                <col style={{ width: "28%" }} />      {/* Descrição (com truncate) */}
                <col style={{ width: "12%" }} />      {/* Produto */}
                <col style={{ width: "9%" }} />       {/* Modalidade */}
                {/* 10 colunas “data/numéricas” de 88px para caber dd/mm/aaaa sem cortar */}
                <col style={{ width: "88px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "96px" }} />     {/* Duração Adm (d) */}
                <col style={{ width: "88px" }} />     {/* Conclusão */}
                <col style={{ width: "40px" }} />     {/* alerta */}
              </colgroup>

              <thead className="bg-slate-50/80 text-slate-700">
                <tr>
                  <Th className="text-center" />
                  <Th>Descrição</Th>
                  <Th>Produto</Th>
                  <Th>Modalidade</Th>
                  <Th>Projeto Iniciado (Marco Zero)</Th>
                  <Th>Projeto Elaborado</Th>
                  <Th>TR Elaborado</Th>
                  <Th>Edital Publicado</Th>
                  <Th>Licitação Realizada</Th>
                  <Th>Licitação Homologada</Th>
                  <Th>Contrato Assinado</Th>
                  <Th>OS/OF Emitida</Th>
                  <Th className="text-right">Duração Adm. (d)</Th>
                  <Th>Conclusão</Th>
                  <Th />
                </tr>
              </thead>

              <tbody>
                {filtrados.map((r, idx) => {
                  const over = estaVencido(r);
                  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/60";
                  const dur = duracaoAdmDias(r);
                  const toggle = () => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }));
                  const onKey = (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle();
                    }
                  };

                  return (
                    <>
                      {/* LINHA PRINCIPAL — clique na linha toda */}
                      <tr
                        key={r.id}
                        tabIndex={0}
                        onClick={toggle}
                        onKeyDown={onKey}
                        className={`${rowBg} border-t hover:bg-blue-50/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300`}
                      >
                        <Td className="h-14 align-middle text-center">
                          <ChevronDown
                            className={`w-4 h-4 inline-block transition-transform ${expanded[r.id] ? "rotate-180" : "rotate-0"}`}
                          />
                        </Td>

                        {/* Descrição — ÚNICA com ellipsis */}
                        <Td className="h-14 align-middle">
                          <div className="font-medium text-gray-900 truncate">
                            {r.descricao ?? "—"}
                          </div>
                        </Td>

                        {/* Demais colunas SEM corte */}
                        <Td className="h-14 align-middle text-gray-700">{r.produto ?? "—"}</Td>

                        <Td className="h-14 align-middle">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${classNameModalidade(r.modalidade)}`}>
                            {r.modalidade === "AQUISICOES" ? "Aquisições" :
                             r.modalidade === "PREGOES"    ? "Pregões" :
                             r.modalidade === "OBRAS"      ? "Obras" : "—"}
                          </span>
                        </Td>

                        {/* Datas/numéricas: nowrap para nunca cortar */}
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_01_marco_zero ?? "—"}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_02_projeto_elaborado ?? "—"}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_03_tr_elaborado ?? "—"}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_04_edital_publicado ?? "—"}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_05_licitacao_realizada ?? "—"}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_06_licitacao_homologada ?? "—"}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_07_contrato_assinado ?? "—"}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.fase_08_os_of ?? "—"}</Td>

                        <Td className="h-14 align-middle text-right tabular-nums whitespace-nowrap">{formatNum(dur)}</Td>
                        <Td className="h-14 align-middle whitespace-nowrap">{r.data_conclusao_entrega ?? "—"}</Td>

                        <Td className="h-14 align-middle text-center">
                          {over && (
                            <span title="prazo estourado" className="inline-flex">
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </span>
                          )}
                        </Td>
                      </tr>

                      {/* LINHA DE DETALHES */}
                      {expanded[r.id] && (
                        <tr className={`${rowBg} border-t`}>
                          <td className="px-4 py-4" colSpan={15}>
                            <DetailCard row={r} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {filtrados.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={15}>
                      Nada encontrado para os filtros/busca atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- componentes UI ----------------------- */

function Card({
  color,
  icon,
  title,
  value,
}: {
  color: string;
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-sm ${color}`}>
      <div className="flex items-start gap-3">
        <div className="opacity-90">{icon}</div>
        <div className="ml-auto text-3xl font-extrabold">
          {value.toLocaleString("pt-BR")}
        </div>
      </div>
      <div className="mt-2 text-sm opacity-90">{title}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold align-middle ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 h-14 align-middle ${className}`}>{children}</td>;
}

function DetailCard({ row }: { row: PTE }) {
  const numero = extractContratoNumero(row);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div className="md:col-span-3 p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Descrição completa</div>
        <div className="mt-1 font-medium text-slate-800">{row.descricao ?? "—"}</div>
      </div>

      <div className="p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Município</div>
        <div className="font-medium text-slate-800">{row.local ?? "—"}</div>
      </div>
      <div className="p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Programa</div>
        <div className="font-medium text-slate-800">{row.programa ?? "—"}</div>
      </div>
      <div className="p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Ação</div>
        <div className="font-medium text-slate-800">{row.acao ?? "—"}</div>
      </div>

      <div className="p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Contrato vinculado</div>
        {numero ? (
          <a className="font-medium text-blue-700 hover:underline" href={contratoURL(numero)} target="_blank" rel="noreferrer">
            {numero}
          </a>
        ) : (
          <div className="text-slate-500">—</div>
        )}
      </div>

      <div className="p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Tesouro</div>
        <div className="font-medium text-slate-800">R$ {formatNum(row.tesouro)}</div>
      </div>
      <div className="p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Recurso Vinculado</div>
        <div className="font-medium text-slate-800">R$ {formatNum(row.recurso_vinculado)}</div>
      </div>
      <div className="p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Outras Fontes</div>
        <div className="font-medium text-slate-800">R$ {formatNum(row.outras_fontes)}</div>
      </div>

      <div className="md:col-span-3 p-4 rounded-xl border bg-white/70">
        <div className="text-xs uppercase tracking-wide text-slate-500">Fases</div>
        <ul className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700">
          <li><b>Marco Zero:</b> {row.fase_01_marco_zero ?? "—"}</li>
          <li><b>Projeto Elaborado:</b> {row.fase_02_projeto_elaborado ?? "—"}</li>
          <li><b>TR Elaborado:</b> {row.fase_03_tr_elaborado ?? "—"}</li>
          <li><b>Edital Publicado:</b> {row.fase_04_edital_publicado ?? "—"}</li>
          <li><b>Licitação Realizada:</b> {row.fase_05_licitacao_realizada ?? "—"}</li>
          <li><b>Homologada:</b> {row.fase_06_licitacao_homologada ?? "—"}</li>
          <li><b>Contrato Assinado:</b> {row.fase_07_contrato_assinado ?? "—"}</li>
          <li><b>OS/OF:</b> {row.fase_08_os_of ?? "—"}</li>
          <li><b>Conclusão:</b> {row.data_conclusao_entrega ?? "—"}</li>
          <li><b>Duração Adm:</b> {formatNum(duracaoAdmDias(row))} dias</li>
          <li><b>Nec. Sup. PTA:</b> {row.necessidade_suplementacao_pta ?? "—"}</li>
          <li><b>EntregasMT:</b> {row.num_no_entregas_mt ?? "—"}</li>
        </ul>
      </div>
    </div>
  );
}
