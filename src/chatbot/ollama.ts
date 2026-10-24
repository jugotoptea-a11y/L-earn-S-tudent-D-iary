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
        `--- CONTENIDO #${idx + 1} [${c.category}] Título: ${c.title} ---\n${c.content}`
    )
    .join("\n\n");

  const systemPrompt = `Eres un asistente académico (basado en Gemma 4) para los estudiantes del docente ${teacher.name} en el curso "${teacher.course}".
INSTRUCCIONES ESTRICTAS:
1. Responde ÚNICAMENTE utilizando la información proporcionada en los CONTENIDOS DEL CURSO a continuación.
2. NO inventes fechas, notas, enlaces ni políticas que no estén explícitamente en los contenidos.
3. Si la pregunta del estudiante NO se puede responder con los contenidos proporcionados, responde EXACTAMENTE con la palabra: NO_SE

CONTENIDOS DEL CURSO CARGADOS POR EL DOCENTE:
${formattedContents}`;

  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma4";
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

  return {
    known: true,
    answer: rawText,
  };
}
