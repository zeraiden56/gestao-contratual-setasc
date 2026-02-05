// src/app/modules/serfamilia/components/RelatorioPdfButton.tsx
"use client";

import { useState, useCallback } from "react";

type PdfProgramCard = {
  titulo: string;
  icon: string; // caminho relativo em /public, ex: "SER Familia Criança.png"
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

type Props = {
  cidade: string;
  periodoLabel: string; // "Todos os anos" ou "2024"
  periodoRaw: string; // "ALL" ou "2024"
  totalValor: number;
  totalCartoes: number;
  cardsProgramas: PdfProgramCard[];
  linhasDetalhamento: PdfLinhaDetalhamento[];
};

const moeda = (v?: number | null) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

const numero = (v?: number | null) =>
  v != null ? v.toLocaleString("pt-BR") : "—";

/** Carrega uma imagem (de /public) e converte para dataURL PNG. */
async function loadImageAsDataUrl(
  src: string,
  alpha = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas não suportado"));
        return;
      }
      if (alpha < 1) ctx.globalAlpha = alpha;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function RelatorioPdfButton({
  cidade,
  periodoLabel,
  periodoRaw,
  totalValor,
  totalCartoes,
  cardsProgramas,
  linhasDetalhamento,
}: Props) {
  const [gerando, setGerando] = useState(false);

  const handleClick = useCallback(async () => {
    if (gerando) return;
    setGerando(true);

    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const autoTable =
        (autoTableModule as any).default || (autoTableModule as any);

      // 📄 A4 retrato, tipo o modelo oficial
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const HEADER_HEIGHT = 26;
      const CONTENT_TOP = HEADER_HEIGHT + 10;

      // Imagens principais do /public
      const [
        bgDataUrl,
        headerBrasao,
        headerSerFamilia,
      ] = await Promise.all([
        loadImageAsDataUrl("/brasao-carregamento.png", 0.06).catch(
          () => null
        ),
        loadImageAsDataUrl("/brasao-carregamento.png", 1).catch(
          () => null
        ),
        loadImageAsDataUrl("/SER Familia.png", 1).catch(() => null),
      ]);

      // Pré-carrega logos dos programas (evita repetir requests)
      const logoMap = new Map<string, string>();
      for (const card of cardsProgramas) {
        const raw = card.icon || "";
        if (!raw) continue;
        const iconPath = raw.startsWith("/") ? raw : `/${raw}`;
        if (logoMap.has(iconPath)) continue;
        try {
          const dataUrl = await loadImageAsDataUrl(iconPath, 1);
          logoMap.set(iconPath, dataUrl);
        } catch {
          // se uma logo falhar, só não mostra ela
        }
      }

      // Fundo branco + brasão bem clarinho
      const applyBackground = () => {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        if (bgDataUrl) {
          const imgWidth = pageWidth * 0.9;
          const imgHeight = imgWidth; // mantém quase quadrado
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2 + 10;
          doc.addImage(bgDataUrl, "PNG", x, y, imgWidth, imgHeight);
        }
      };

      // Faixa azul do topo + logos
      const drawHeader = () => {
        doc.setFillColor(0, 90, 170);
        doc.rect(0, 0, pageWidth, HEADER_HEIGHT, "F");

        if (headerBrasao) {
          doc.addImage(headerBrasao, "PNG", 8, 4, 26, 18);
        }

        if (headerSerFamilia) {
          doc.addImage(
            headerSerFamilia,
            "PNG",
            pageWidth - 58,
            4,
            50,
            18
          );
        }
      };

      /* ──────────────────────────────
         PÁGINA 1 – RESUMO + CARDS
      ─────────────────────────────── */
      applyBackground();
      drawHeader();

      const lugar = cidade || "Mato Grosso";

      // BLOCO HERO (rosa)
      const heroX = 10;
      const heroY = CONTENT_TOP;
      const heroW = pageWidth - 20;
      const heroH = 58;

      doc.setFillColor(236, 72, 153); // rosa
      doc.roundedRect(heroX, heroY, heroW, heroH, 4, 4, "F");

      // Título dentro do hero
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Investimento em ${lugar}`, heroX + 8, heroY + 14);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Período: ${periodoLabel}`, heroX + 8, heroY + 22);

      // Caixinhas internas: Investimento total / Famílias atendidas
      const innerMargin = 8;
      const boxY = heroY + 28;
      const boxH = heroH - 28 - innerMargin;
      const boxW = (heroW - innerMargin * 3) / 2;

      // Investimento
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(
        heroX + innerMargin,
        boxY,
        boxW,
        boxH,
        3,
        3,
        "F"
      );
      doc.setTextColor(90);
      doc.setFontSize(8);
      doc.text("Investimento total", heroX + innerMargin + 4, boxY + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40);
      doc.text(
        moeda(totalValor),
        heroX + innerMargin + 4,
        boxY + 18
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(
        "Recursos consolidados",
        heroX + innerMargin + 4,
        boxY + 24
      );

      // Famílias atendidas
      const box2X = heroX + innerMargin * 2 + boxW;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(box2X, boxY, boxW, boxH, 3, 3, "F");
      doc.setTextColor(90);
      doc.setFontSize(8);
      doc.text("Famílias atendidas", box2X + 4, boxY + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40);
      doc.text(numero(totalCartoes), box2X + 4, boxY + 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(
        "Registros no período selecionado",
        box2X + 4,
        boxY + 24
      );

      // Título Programas
      let cardY = heroY + heroH + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(50);
      doc.text("Programas SER Família", 10, cardY);

      cardY += 6;

      const cards = cardsProgramas;
      const cols = 2;
      const marginLeft = 10;
      const marginRight = 10;
      const gapX = 6;
      const gapY = 6;
      const cardWidth =
        (pageWidth - marginLeft - marginRight - gapX) / cols;
      const cardHeight = 24;
      let cardX = marginLeft;

      // Desenha os cards como no modelo (2 colunas)
      cards.forEach((card, index) => {
        if (index > 0 && index % cols === 0) {
          cardX = marginLeft;
          cardY += cardHeight + gapY;

          // quebra para nova página se necessário
          if (cardY + cardHeight > pageHeight - 20) {
            doc.addPage();
            applyBackground();
            drawHeader();
            cardY = CONTENT_TOP;
          }
        }

        const iconPath = card.icon
          ? card.icon.startsWith("/")
            ? card.icon
            : `/${card.icon}`
          : "";
        const logo = iconPath ? logoMap.get(iconPath) : undefined;

        // Card
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, "FD");

        // Logo
        if (logo) {
          doc.addImage(logo, "PNG", cardX + 4, cardY + 6, 12, 12);
        }

        const textX = cardX + (logo ? 20 : 6);

        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(card.titulo, textX, cardY + 9);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(90);
        doc.text(
          `Investimento: ${moeda(card.valor)}`,
          textX,
          cardY + 16
        );
        doc.text(
          `Beneficiários: ${numero(card.quantidade)}`,
          textX,
          cardY + 21
        );

        cardX += cardWidth + gapX;
      });

      /* ──────────────────────────────
         TABELAS POR PROGRAMA
         (cidades A–Z e anos lado a lado)
      ─────────────────────────────── */

      // Agrupa linhas por programa
      const mapaPorPrograma = new Map<
        string,
        PdfLinhaDetalhamento[]
      >();

      for (const l of linhasDetalhamento) {
        const arr = mapaPorPrograma.get(l.programa) || [];
        arr.push(l);
        mapaPorPrograma.set(l.programa, arr);
      }

      // nomes dos programas em ordem alfabética
      const nomesProgramas = Array.from(mapaPorPrograma.keys()).sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      );

      for (const nomePrograma of nomesProgramas) {
        const linhasProg = mapaPorPrograma.get(nomePrograma);
        if (!linhasProg || linhasProg.length === 0) continue;

        // anos presentes nesse programa (ordenados)
        const anos = Array.from(
          new Set(linhasProg.map((l) => l.ano))
        ).sort((a, b) => a - b);

        // cidades (ordenadas A–Z)
        const cidadesSet = new Set<string>();
        linhasProg.forEach((l) => cidadesSet.add(l.cidade));
        const cidades = Array.from(cidadesSet).sort((a, b) =>
          a.localeCompare(b, "pt-BR")
        );

        // índice cidade|ano -> agregados
        const index = new Map<
          string,
          { valor: number; quantidade: number }
        >();
        for (const l of linhasProg) {
          const key = `${l.cidade}|${l.ano}`;
          const prev = index.get(key) || { valor: 0, quantidade: 0 };
          prev.valor += l.valor || 0;
          prev.quantidade += l.quantidade || 0;
          index.set(key, prev);
        }

        // Cabeçalho: Município | Qtde 2019 | Valor 2019 | Qtde 2020 | Valor 2020 | ...
        const headRow: (string | number)[] = ["Município"];
        anos.forEach((ano) => {
          headRow.push(`Qtde ${ano}`, `Valor ${ano}`);
        });

        // Linhas: 1 por cidade, anos nas colunas
        const body: (string | number)[][] = cidades.map(
          (cidadeNome) => {
            const row: (string | number)[] = [cidadeNome];
            anos.forEach((ano) => {
              const key = `${cidadeNome}|${ano}`;
              const agg =
                index.get(key) || ({ valor: 0, quantidade: 0 } as const);
              row.push(
                numero(agg.quantidade || 0),
                moeda(agg.valor || 0)
              );
            });
            return row;
          }
        );

        // Nova página para cada programa (sem fundo escuro – estilo planilha)
        doc.addPage();
        drawHeader();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(40);
        doc.text("Detalhamento por município e ano", 10, CONTENT_TOP);
        doc.setFontSize(10);
        doc.text(`Programa: ${nomePrograma}`, 10, CONTENT_TOP + 6);

        autoTable(doc, {
          startY: CONTENT_TOP + 12,
          head: [headRow],
          body,
          styles: {
            fontSize: 7,
            cellPadding: 1.2,
          },
          headStyles: {
            fillColor: [37, 99, 235], // azul cabeçalho
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252], // cinza bem claro
          },
          margin: { left: 10, right: 10 },
          pageBreak: "auto",
          columnStyles: {
            0: { cellWidth: 32 }, // município mais largo
          },
        });
      }

      // nome de arquivo bonitinho
      const safeCidade = (cidade || "mato-grosso")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const safePeriodo =
        periodoRaw === "ALL" ? "todos-os-anos" : periodoRaw;

      doc.save(`ser-familia-${safeCidade}-${safePeriodo}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF SER Família:", err);
      alert("Não foi possível gerar o PDF. Veja o console para detalhes.");
    } finally {
      setGerando(false);
    }
  }, [
    cidade,
    periodoLabel,
    periodoRaw,
    totalValor,
    totalCartoes,
    cardsProgramas,
    linhasDetalhamento,
    gerando,
  ]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={gerando}
      className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border ${
        gerando
          ? "bg-slate-200 text-slate-500 cursor-wait border-slate-200"
          : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
      }`}
    >
      {gerando ? "Gerando PDF…" : "Gerar PDF"}
    </button>
  );
}
