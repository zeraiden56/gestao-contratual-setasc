"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

interface MapaProps {
  cidadeSelecionada: string;
  onSelectCidade: (cidade: string) => void;
}

export function Mapa({ cidadeSelecionada, onSelectCidade }: MapaProps) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/mt-municipios.json")
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error("Erro ao carregar GeoJSON:", err));
  }, []);

  if (!geoData) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-100 rounded-lg border">
        Carregando mapa...
      </div>
    );
  }

  const getStyle = (feature: any) => ({
    fillColor:
      feature.properties.NM_MUN === cidadeSelecionada ? "#2563EB" : "#60A5FA",
    weight: 1,
    color: "white",
    fillOpacity: feature.properties.NM_MUN === cidadeSelecionada ? 0.8 : 0.4,
  });

  const onEachFeature = (feature: any, layer: any) => {
    const nome = feature.properties.NM_MUN;
    layer.bindTooltip(nome, { direction: "center" });
    layer.on({
      click: () => onSelectCidade(nome),
      mouseover: (e: any) => e.target.setStyle({ fillOpacity: 0.7 }),
      mouseout: (e: any) =>
        e.target.setStyle({
          fillOpacity: nome === cidadeSelecionada ? 0.8 : 0.4,
        }),
    });
  };

  return (
    <div className="w-full h-80 border rounded-lg overflow-hidden">
      <MapContainer
        center={[-12.64, -55.42]}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="Map data © OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON data={geoData} style={getStyle} onEachFeature={onEachFeature} />
      </MapContainer>
    </div>
  );
}
