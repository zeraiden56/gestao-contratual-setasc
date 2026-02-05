// src/app/modules/serfamilia/components/Mapa.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  onSelectCidade: (nome: string) => void;
  dados: any;
  cidadeSelecionada: string;
  anoSelecionado: string; // "2023" | "2024" | "2025" | "Todos"
}

/* Utils de formatação e normalização (iguais ao dashboard) */
const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatNumber = (v: number) => v.toLocaleString("pt-BR");

const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const sameCity = (a?: string, b?: string) =>
  !!a && !!b && norm(a) === norm(b);

export function Mapa({
  onSelectCidade,
  dados,
  cidadeSelecionada,
  anoSelecionado,
}: Props) {
  const [geojson, setGeojson] = useState<any>(null);
  const geoJsonRef = useRef<L.GeoJSON>(null);

  useEffect(() => {
    fetch("/mt-municipios.json")
      .then((r) => r.json())
      .then(setGeojson)
      .catch((err) => console.error("Erro ao carregar o GeoJSON:", err));
  }, []);

  const baseStyle: L.PathOptions = {
    color: "#cbd5e1", // stroke cinza claro
    weight: 1.2,
    fillColor: "#f8fafc", // quase branco
    fillOpacity: 0.6,
  };

  function styleFor(nome: string): L.PathOptions {
    const sel =
      cidadeSelecionada &&
      sameCity(nome, cidadeSelecionada);

    return sel
      ? {
          color: "#ea580c",
          weight: 2.2,
          fillColor: "#fb923c",
          fillOpacity: 0.85,
        }
      : baseStyle;
  }

  const tooltipOptions: L.TooltipOptions = {
    direction: "top",
    opacity: 0.95,
    sticky: true,
  };

  /** Calcula os valores e monta o HTML do tooltip (com ícones SVG) */
  const buildTooltipHtml = useCallback(
    (nome: string) => {
      const lista = (dados?.cidades || []) as any[];

      const dadosCidade = lista.filter((d) => {
        const condCidade = sameCity(d.cidade, nome);
        const condAno =
          !anoSelecionado || anoSelecionado === "Todos"
            ? true
            : String(d.ano) === String(anoSelecionado);
        return condCidade && condAno;
      });

      const totalCartoes = dadosCidade.reduce(
        (s, x) => s + (x.quantidade || 0),
        0
      );
      const totalInvest = dadosCidade.reduce(
        (s, x) => s + (x.valor || 0),
        0
      );

      const cartoesStr =
        totalCartoes > 0 ? formatNumber(totalCartoes) : "—";
      const investStr =
        totalInvest > 0 ? formatCurrency(totalInvest) : "—";

      // SVGs no estilo Lucide (credit-card + cash)
      const cartaoSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      `;
      const moneySvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M12 8v8"></path>
          <path d="M9.5 10.5a2.5 2.5 0 0 1 2.5-2.5h1a2.5 2.5 0 0 1 0 5h-1a2.5 2.5 0 0 0 0 5h3.5"></path>
        </svg>
      `;

      return `
        <div style="font-size:11px; color:#0f172a;">
          <div style="font-weight:600;margin-bottom:2px;">${nome}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
            ${cartaoSvg}
            <span>${cartoesStr} cartões</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
            ${moneySvg}
            <span>${investStr}</span>
          </div>
        </div>
      `;
    },
    [dados, anoSelecionado]
  );

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const nome =
      feature?.properties?.NM_MUN || feature?.properties?.name;
    if (!nome) return;

    const html = buildTooltipHtml(nome);
    (layer as L.Path).bindTooltip(html, tooltipOptions);

    // cursor pointer via DOM
    (layer as any).on("add", () => {
      const el = (layer as any).getElement?.();
      if (el) el.style.cursor = "pointer";
    });

    layer.on({
      click: () => onSelectCidade(nome),
      mouseover: (e: any) => {
        e.target.setStyle({ color: "#ea580c", weight: 2.0 });
        e.target.bringToFront();
      },
      mouseout: (e: any) => {
        e.target.setStyle(styleFor(nome));
      },
    });
  };

  // Reestiliza e atualiza tooltips sempre que seleção/ano/dados mudarem
  useEffect(() => {
    if (!geoJsonRef.current) return;

    geoJsonRef.current.eachLayer((layer: any) => {
      const nome =
        layer?.feature?.properties?.NM_MUN ||
        layer?.feature?.properties?.name;
      if (!nome) return;

      // estilo (selecionado x normal)
      layer.setStyle(styleFor(nome));

      // tooltip com dados atualizados
      const html = buildTooltipHtml(nome);
      const tooltip = layer.getTooltip?.();
      if (tooltip) {
        tooltip.setContent(html);
      } else {
        (layer as L.Path).bindTooltip(html, tooltipOptions);
      }
    });
  }, [cidadeSelecionada, anoSelecionado, dados, buildTooltipHtml]);

  if (!geojson) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400">
        Carregando mapa...
      </div>
    );
  }

  return (
    <MapContainer
      center={[-13.4, -55.9]}
      zoom={5}
      zoomControl={false}
      dragging={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      attributionControl={false}
      style={{
        height: "100%", // respeita o tamanho do card pai
        width: "100%",
        backgroundColor: "transparent",
      }}
    >
      <GeoJSON
        ref={geoJsonRef}
        data={geojson}
        style={(feature) =>
          styleFor(
            feature?.properties?.NM_MUN || feature?.properties?.name
          )
        }
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
