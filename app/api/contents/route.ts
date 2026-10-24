import { NextRequest, NextResponse } from "next/server";
import {
  addCourseContent,
  deleteCourseContent,
  getContentsByTeacher,
  type ContentCategory,
} from "@/src/knowledge/db";

const VALID_CATEGORIES: ContentCategory[] = [
  "Plataformas",
  "Tareas",
  "Notas",
  "Información general",
];

export async function GET(request: NextRequest) {
  try {
    const teacherId =
      request.nextUrl.searchParams.get("teacherId")?.trim() || undefined;
    const contents = await getContentsByTeacher(teacherId);
    return NextResponse.json({ contents });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error consultando contenidos en Neon Postgres.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teacherId = String(body.teacherId ?? "").trim();
    const categoryRaw = String(
      body.category ?? "Información general"
    ).trim() as ContentCategory;
    const category: ContentCategory = VALID_CATEGORIES.includes(categoryRaw)
      ? categoryRaw
      : "Información general";
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!teacherId || !title || !content) {
      return NextResponse.json(
        { error: "Docente, título y contenido son obligatorios." },
        { status: 400 }
      );
    }

    const created = await addCourseContent({
      teacherId,
      category,
      title,
      content,
    });

    return NextResponse.json({ content: created });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar el contenido.";
    const status = message.includes("no ha sido aceptado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")?.trim();
    const teacherId =
      request.nextUrl.searchParams.get("teacherId")?.trim() || undefined;

    if (!id) {
      return NextResponse.json(
        { error: "ID de contenido requerido." },
        { status: 400 }
      );
    }

    const deleted = await deleteCourseContent(id, teacherId);
    return NextResponse.json({ deleted });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error eliminando contenido en Neon Postgres.",
      },
      { status: 500 }
    );
  }
}
