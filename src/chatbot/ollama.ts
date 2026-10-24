import { Ollama } from "ollama";
import type { CourseContent, Teacher } from "../knowledge/db";

export interface AskGemmaParams {
  teacher: Teacher;
  contents: CourseContent[];
  question: string;
}

export interface AskGemmaResult {
  known: boolean;
  answer: string;
  source?: {
    id: string;
    category: string;
    title: string;
    snippet: string;
  };
  confidence?: "Basada en el syllabus" | "Respuesta inferida";
}

export interface UploadedFileItem {
  fileName: string;
  fileType: "PDF" | "CSV" | "TXT" | "MD" | "JSON";
  sizeBytes: number;
  extractedText: string;
  category?: string;
}

export interface FileAnalysisResult {
  usedGemma: boolean;
  modelName: string;
  summary: string;
  keyFindings: string[];
  suggestedQuestions: string[];
  perFileHighlights: {
    fileName: string;
    fileType: string;
    charCount: number;
    preview: string;
  }[];
}

export function findBestSource(
  contents: CourseContent[],
  question: string,
  answer: string
): AskGemmaResult["source"] {
  if (!contents.length) return undefined;
  const words = `${question} ${answer}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\W+/)
    .filter((w) => w.length > 2);

  let best = contents[0];
  let bestScore = -1;

  for (const item of contents) {
    const haystack = `${item.title} ${item.category} ${item.content}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let score = 0;
    for (const w of words) {
      if (haystack.includes(w)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return {
    id: best.id,
    category: best.category,
    title: best.title,
    snippet: best.content.slice(0, 600),
  };
}

function buildFallbackSearchAnswer(
  contents: CourseContent[],
  question: string
): AskGemmaResult {
  const qWords = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (qWords.length === 0) {
    return { known: false, answer: "NO_SE" };
  }

  let bestItem: CourseContent | null = null;
  let bestScore = 0;

  for (const item of contents) {
    const normContent = `${item.title} ${item.content}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let score = 0;
    for (const w of qWords) {
      if (normContent.includes(w)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  if (!bestItem || bestScore === 0) {
    return { known: false, answer: "NO_SE" };
  }

  // Extract the most relevant lines/sentences from bestItem.content
  const lines = bestItem.content
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const matchingLines = lines.filter((line) => {
    const normLine = line
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return qWords.some((w) => normLine.includes(w));
  });

  const excerpt =
    matchingLines.slice(0, 4).join(" ") || bestItem.content.slice(0, 450);

  return {
    known: true,
    answer: `Según el documento "${bestItem.title}" (${bestItem.category}):\n${excerpt}`,
    source: {
      id: bestItem.id,
      category: bestItem.category,
      title: bestItem.title,
      snippet: bestItem.content.slice(0, 600),
    },
    confidence: "Basada en el syllabus",
  };
}

export async function askGemmaWithContents(
  params: AskGemmaParams
): Promise<AskGemmaResult> {
  const { teacher, contents, question } = params;

  if (!contents || contents.length === 0) {
    return {
      known: false,
      answer: "NO_SE",
    };
  }

  const formattedContents = contents
    .map(
      (c, idx) =>
        `--- DOCUMENTO #${idx + 1} [${c.category}] Título: ${c.title} ---\n${c.content}`
    )
    .join("\n\n");

  const systemPrompt = `Eres un asistente académico (basado en Gemma 4) para los estudiantes del docente ${teacher.name} en el curso "${teacher.course}".
INSTRUCCIONES ESTRICTAS:
1. Responde ÚNICAMENTE utilizando la información proporcionada en los DOCUMENTOS Y ARCHIVOS DEL CURSO (PDF, CSV, TXT, Syllabus) a continuación.
2. NO inventes fechas, notas, enlaces ni políticas que no estén explícitamente en los contenidos.
3. Si la pregunta del estudiante NO se puede responder con los contenidos proporcionados, responde EXACTAMENTE con la palabra: NO_SE

DOCUMENTOS DEL CURSO CARGADOS POR EL DOCENTE:
${formattedContents}`;

  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma4";

  try {
    const ollama = new Ollama({ host });
    const response = await ollama.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      options: {
        temperature: 0.2,
      },
    });

    const rawText = (response?.message?.content || "").trim();

    if (!rawText || rawText.toUpperCase().includes("NO_SE")) {
      return {
        known: false,
        answer: "NO_SE",
      };
    }

    const source = findBestSource(contents, question, rawText);

    return {
      known: true,
      answer: rawText,
      source,
      confidence: "Basada en el syllabus",
    };
  } catch {
    // Fallback to deterministic document search if Ollama is not running locally
    return buildFallbackSearchAnswer(contents, question);
  }
}

function buildLocalHeuristicAnalysis(
  files: UploadedFileItem[],
  courseName: string
): FileAnalysisResult {
  const keyFindings: string[] = [];
  const suggestedQuestions: string[] = [];

  for (const f of files) {
    const lines = f.extractedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (f.fileType === "CSV") {
      const rowCount = Math.max(0, lines.length - 1);
      const headers = lines[0] || "Columnas detectadas";
      keyFindings.push(
        `Archivo CSV "${f.fileName}": ${rowCount} registros estructurados detectados (${headers.slice(0, 90)}).`
      );
      suggestedQuestions.push(
        `¿Qué datos o registros aparecen en ${f.fileName}?`
      );
    } else if (f.fileType === "PDF") {
      keyFindings.push(
        `Documento PDF "${f.fileName}": ${f.extractedText.length} caracteres extraídos e indexados para ${courseName}.`
      );
      suggestedQuestions.push(
        `¿Cuáles son los puntos principales de ${f.fileName}?`
      );
    } else {
      keyFindings.push(
        `Archivo de texto "${f.fileName}": ${lines.length} líneas procesadas e incorporadas a la base de conocimiento.`
      );
      suggestedQuestions.push(
        `¿Qué indica el documento ${f.fileName}?`
      );
    }

    // Detect dates, percentages, or evaluation keywords
    const dateMatches = f.extractedText.match(
      /\b(\d{1,2}\s+de\s+[a-záéíóú]+|\d{1,2}\/\d{1,2}\/\d{2,4}|lunes|martes|miércoles|miercoles|jueves|viernes|parcial|taller|examen|entrega|\d{1,3}\s*%)/gi
    );
    if (dateMatches && dateMatches.length > 0) {
      const unique = Array.from(
        new Set(dateMatches.map((m) => m.toLowerCase()))
      ).slice(0, 6);
      keyFindings.push(
        `Términos clave detectados en "${f.fileName}": ${unique.join(", ")}.`
      );
    }
  }

  if (suggestedQuestions.length < 3) {
    suggestedQuestions.push(
      "¿Cuáles son las fechas de entrega o evaluación en los archivos cargados?",
      "¿Cómo se califica según los documentos subidos?"
    );
  }

  return {
    usedGemma: false,
    modelName: "Analizador semántico local + Indexador RAG",
    summary: `Se analizaron e indexaron ${files.length} archivo(s) (${files
      .map((f) => `${f.fileName} [${f.fileType}]`)
      .join(", ")}) para la asignatura ${courseName}. Todo el contenido ya está disponible para responder preguntas de los estudiantes con cita de fuente.`,
    keyFindings,
    suggestedQuestions: suggestedQuestions.slice(0, 4),
    perFileHighlights: files.map((f) => ({
      fileName: f.fileName,
      fileType: f.fileType,
      charCount: f.extractedText.length,
      preview: f.extractedText.slice(0, 280).trim(),
    })),
  };
}

export async function analyzeFilesWithGemma(params: {
  files: UploadedFileItem[];
  courseName: string;
  customPrompt?: string;
}): Promise<FileAnalysisResult> {
  const { files, courseName, customPrompt } = params;
  const fallback = buildLocalHeuristicAnalysis(files, courseName);

  if (!files.length) {
    return fallback;
  }

  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma4";

  const combinedDocs = files
    .map(
      (f, i) =>
        `=== ARCHIVO #${i + 1}: ${f.fileName} (Tipo: ${f.fileType}) ===\n${f.extractedText.slice(0, 6000)}`
    )
    .join("\n\n");

  const prompt = customPrompt?.trim()
    ? `Analiza los siguientes archivos del curso "${courseName}" y responde a esta solicitud del docente: "${customPrompt}". Además, resume los puntos clave, fechas o criterios de evaluación encontrados.`
    : `Analiza los siguientes archivos (${files.length}) cargados para la asignatura "${courseName}".
Devuelve en español:
1. Un resumen ejecutivo claro de lo que contienen los documentos (PDF, CSV, TXT).
2. 3 a 5 hallazgos clave (fechas, entregas, ponderaciones, reglas o datos relevantes).
3. 3 preguntas frecuentes que los estudiantes podrían hacer y que ahora quedan resueltas con este material.`;

  try {
    const ollama = new Ollama({ host });
    const response = await ollama.chat({
      model,
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente pedagógico experto basado en Gemma 4. Analizas documentos académicos (PDF, CSV, TXT) de forma rigurosa, clara y estructurada en español.",
        },
        {
          role: "user",
          content: `${prompt}\n\nCONTENIDO DE LOS ARCHIVOS:\n${combinedDocs}`,
        },
      ],
      options: {
        temperature: 0.2,
      },
    });

    const aiText = (response?.message?.content || "").trim();
    if (!aiText) {
      return fallback;
    }

    return {
      ...fallback,
      usedGemma: true,
      modelName: `Gemma 4 (${model})`,
      summary: aiText,
    };
  } catch {
    return fallback;
  }
}
