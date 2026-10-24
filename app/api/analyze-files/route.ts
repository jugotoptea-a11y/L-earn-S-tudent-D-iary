import { NextRequest, NextResponse } from "next/server";
import { inflateSync, unzipSync } from "node:zlib";
import {
  analyzeFilesWithGemma,
  type UploadedFileItem,
} from "@/src/chatbot/ollama";
import {
  addCourseContent,
  type ContentCategory,
  type CourseContent,
} from "@/src/knowledge/db";

function decodePdfLiteralString(raw: string): string {
  return raw
    .replace(/\\(\d{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    )
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function decodePdfHexString(hex: string): string {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, "");
  if (!clean) return "";
  // Check UTF-16BE BOM (FEFF)
  if (clean.toUpperCase().startsWith("FEFF")) {
    let out = "";
    for (let i = 4; i + 3 < clean.length; i += 4) {
      const code = parseInt(clean.slice(i, i + 4), 16);
      if (code >= 32) out += String.fromCharCode(code);
    }
    return out;
  }
  let out = "";
  for (let i = 0; i + 1 < clean.length; i += 2) {
    const code = parseInt(clean.slice(i, i + 2), 16);
    if (code >= 32 && code <= 255) {
      out += String.fromCharCode(code);
    }
  }
  return out;
}

function extractTextFromPdfTextChunk(chunk: string): string[] {
  const pieces: string[] = [];

  // Match TJ arrays: [(text) -12 (more)] TJ
  const tjArrayRegex = /\[((?:[^[\]]|\([^)]*\))*)\]\s*TJ/g;
  let match: RegExpExecArray | null;
  while ((match = tjArrayRegex.exec(chunk)) !== null) {
    const inner = match[1];
    const litRegex = /\(((?:\\.|[^\\()])*)\)|<([0-9A-Fa-f\s]+)>/g;
    let sub: RegExpExecArray | null;
    let line = "";
    while ((sub = litRegex.exec(inner)) !== null) {
      if (sub[1] !== undefined) {
        line += decodePdfLiteralString(sub[1]);
      } else if (sub[2] !== undefined) {
        line += decodePdfHexString(sub[2]);
      }
    }
    if (line.trim()) pieces.push(line.trim());
  }

  // Match single (text) Tj or ' or "
  const singleTjRegex = /\(((?:\\.|[^\\()])*)\)\s*(?:Tj|'|")/g;
  while ((match = singleTjRegex.exec(chunk)) !== null) {
    const decoded = decodePdfLiteralString(match[1]).trim();
    if (decoded) pieces.push(decoded);
  }

  // Match hex <...> Tj
  const hexTjRegex = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
  while ((match = hexTjRegex.exec(chunk)) !== null) {
    const decoded = decodePdfHexString(match[1]).trim();
    if (decoded) pieces.push(decoded);
  }

  return pieces;
}

function extractTextFromPdfBuffer(buffer: Buffer, fileName: string): string {
  const rawLatin1 = buffer.toString("latin1");
  const collected: string[] = [];

  // 1. Decompress FlateDecode streams and extract BT..ET text blocks
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawLatin1)) !== null) {
    const streamBodyLatin1 = match[1];
    const streamBuf = Buffer.from(streamBodyLatin1, "latin1");
    let decodedContent = streamBodyLatin1;

    try {
      decodedContent = inflateSync(streamBuf).toString("latin1");
    } catch {
      try {
        decodedContent = unzipSync(streamBuf).toString("latin1");
      } catch {
        // Keep raw stream content if not compressed with zlib
      }
    }

    const fromOperators = extractTextFromPdfTextChunk(decodedContent);
    if (fromOperators.length > 0) {
      collected.push(fromOperators.join(" "));
    }
  }

  // 2. Also scan top-level uncompressed text operators
  if (collected.length === 0) {
    const direct = extractTextFromPdfTextChunk(rawLatin1);
    if (direct.length > 0) {
      collected.push(direct.join(" "));
    }
  }

  // 3. Fallback: extract readable printable sentences if PDF uses custom font encodings
  const joined = collected.join("\n").replace(/\s+/g, " ").trim();
  if (joined.length >= 25) {
    return joined;
  }

  const printableMatches = rawLatin1.match(
    /[A-Za-zÁÉÍÓÚáéíóúÑñ0-9,.;:()¿?¡!%/-]{4,}(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ0-9,.;:()¿?¡!%/-]{2,})+/g
  );
  const filtered = (printableMatches || []).filter(
    (s) =>
      !/obj|endobj|stream|endstream|xref|trailer|FlateDecode|FontDescriptor|Type|Page|Parent|Resources|MediaBox/i.test(
        s
      )
  );

  if (filtered.length > 0) {
    return filtered.join("\n").slice(0, 12000);
  }

  return `Documento PDF "${fileName}" (${buffer.byteLength} bytes) cargado e indexado en la base de conocimiento del curso.`;
}

function formatCsvContent(rawCsv: string, fileName: string): string {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return `Archivo CSV "${fileName}" vacío.`;
  }

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows = lines.slice(1);

  const formattedRows = rows.slice(0, 150).map((row, idx) => {
    const cols = row.split(delimiter).map((c) => c.trim());
    const pairs = headers.map((h, i) => `${h || `Col${i + 1}`}: ${cols[i] ?? ""}`);
    return `Registro #${idx + 1} -> ${pairs.join(" | ")}`;
  });

  return [
    `Tabla CSV: ${fileName} (${rows.length} filas, Columnas: ${headers.join(", ")})`,
    ...formattedRows,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const courseName =
      String(formData.get("courseName") ?? "").trim() || "Cálculo II";
    const teacherId = String(formData.get("teacherId") ?? "").trim() || undefined;
    const categoryRaw = String(
      formData.get("category") ?? "Información general"
    ).trim() as ContentCategory;
    const customPrompt =
      String(formData.get("customPrompt") ?? "").trim() || undefined;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Selecciona al menos un archivo (.pdf, .txt, .csv)." },
        { status: 400 }
      );
    }

    const processedFiles: UploadedFileItem[] = [];
    const savedContents: CourseContent[] = [];

    for (const file of files) {
      const name = file.name || "documento";
      const ext = name.split(".").pop()?.toLowerCase() || "";
      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      let fileType: UploadedFileItem["fileType"] = "TXT";
      let extractedText = "";

      if (ext === "pdf" || file.type === "application/pdf") {
        fileType = "PDF";
        extractedText = extractTextFromPdfBuffer(buffer, name);
      } else if (ext === "csv" || file.type === "text/csv") {
        fileType = "CSV";
        const rawText = buffer.toString("utf-8");
        extractedText = formatCsvContent(rawText, name);
      } else if (ext === "md") {
        fileType = "MD";
        extractedText = buffer.toString("utf-8");
      } else if (ext === "json") {
        fileType = "JSON";
        extractedText = buffer.toString("utf-8");
      } else {
        fileType = "TXT";
        extractedText = buffer.toString("utf-8");
      }

      processedFiles.push({
        fileName: name,
        fileType,
        sizeBytes: file.size,
        extractedText: extractedText.trim() || `Contenido de ${name}`,
        category: categoryRaw,
      });

      if (teacherId) {
        try {
          const saved = await addCourseContent({
            teacherId,
            category: categoryRaw,
            title: `Archivo ${fileType} · ${name}`,
            content: extractedText.slice(0, 15000),
          });
          savedContents.push(saved);
        } catch {
          // If teacher is not approved yet in Neon DB, we still return the parsed file for immediate AI analysis
        }
      }
    }

    const analysis = await analyzeFilesWithGemma({
      files: processedFiles,
      courseName,
      customPrompt,
    });

    return NextResponse.json({
      files: processedFiles,
      savedContents,
      analysis,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error al procesar y analizar los archivos con la IA.",
      },
      { status: 500 }
    );
  }
}
