import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filePath = path.join(process.cwd(), "public", "ibge_cache.json");
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Erro ao salvar cache IBGE:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
