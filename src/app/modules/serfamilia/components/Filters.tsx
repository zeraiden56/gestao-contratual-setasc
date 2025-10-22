"use client";

interface FiltersProps {
  ano: number;
  setAno: (ano: number) => void;
  cidade: string;
  setCidade: (cidade: string) => void;
  cidades: string[];
}

export function Filters({ ano, setAno, cidade, setCidade, cidades }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <select
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Todas as cidades</option>
        {cidades.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={ano}
        onChange={(e) => setAno(Number(e.target.value))}
        className="border rounded px-3 py-2"
      >
        {[2023, 2024, 2025].map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}
