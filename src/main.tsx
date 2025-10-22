import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";


// Elemento raiz
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Elemento #root não encontrado no documento HTML.");
}

const root = createRoot(rootElement);

// Renderiza o app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
