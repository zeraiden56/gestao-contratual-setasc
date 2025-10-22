"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  onSelectCidade: (nome: string) => void;
  dados: any;
  cidadeSelecionada: string;
  anoSelecionado: string;
}

export function Mapa({ onSelectCidade, dados, cidadeSelecionada, anoSelecionado }: Props) {
  const [geojson, setGeojson] = useState<any>(null);
  const geoJsonRef = useRef<L.GeoJSON>(null);

  useEffect(() => {
    fetch("/mt-municipios.json")
      .then((r) => r.json())
      .then(setGeojson)
      .catch((err) => console.error("Erro ao carregar o GeoJSON:", err));
  }, []);

  // Função de estilo dinâmico
  const getStyle = (nome: string) => {
    const isSelected =
      cidadeSelecionada &&
      nome.toLowerCase() === cidadeSelecionada.toLowerCase();

    return {
      color: isSelected ? "#1d4ed8" : "#3388ff",
      weight: isSelected ? 2.5 : 1,
      fillColor: isSelected ? "#93c5fd" : "#60a5fa",
      fillOpacity: isSelected ? 0.6 : 0.3,
      cursor: "pointer",
    };
  };

  // Tooltip e interações
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const nome = feature.properties.NM_MUN || feature.properties.name;
    if (!nome) return;

    // Filtrar dados conforme cidade e ano
    const dadosCidade = dados.cidades.filter((d: any) => {
      const condCidade = d.cidade.toLowerCase() === nome.toLowerCase();
      const condAno = anoSelecionado ? d.ano === anoSelecionado : true;
      return condCidade && condAno;
    });

    const totalCartoes = dadosCidade.reduce(
      (s: number, x: any) => s + (x.quantidade || 0),
      0
    );
    const totalInvest = dadosCidade.reduce(
      (s: number, x: any) => s + (x.valor || 0),
      0
    );

    // Tooltip HTML
    const tooltip = `<b>${nome}</b><br/>
      Cartões: ${totalCartoes.toLocaleString("pt-BR")}<br/>
      Investimento: R$ ${totalInvest.toLocaleString("pt-BR")}`;

    (layer as L.Path).bindTooltip(tooltip, {
      direction: "center",
      opacity: 0.9,
      sticky: true,
    });

    // Eventos
    layer.on({
      click: () => onSelectCidade(nome),
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.6,
          color: "#1d4ed8",
          weight: 2,
        });
        target.bringToFront();
      },
      mouseout: (e: any) => {
        const target = e.target;
        target.setStyle(getStyle(nome));
      },
    });
  };

  // Atualiza estilos quando muda cidade selecionada ou ano
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer((layer: any) => {
      const nome = layer.feature.properties.NM_MUN || layer.feature.properties.name;
      layer.setStyle(getStyle(nome));
    });
  }, [cidadeSelecionada, anoSelecionado]);

  if (!geojson) {
    return (
      <div className="flex items-center justify-center h-[320px] w-[350px] bg-blue-50 text-blue-800 rounded">
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
      style={{
        height: 360,
        width: 400,
        backgroundColor: "#e0f2fe",
        borderRadius: "12px",
        border: "1px solid #bfdbfe",
      }}
    >
      <GeoJSON
        ref={geoJsonRef}
        data={geojson}
        style={(feature) =>
          getStyle(feature?.properties?.NM_MUN || feature?.properties?.name)
        }
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
