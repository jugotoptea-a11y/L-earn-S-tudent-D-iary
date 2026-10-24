import { NextRequest, NextResponse } from "next/server";
import {
  getContentsByTeacher,
  getDb,
  getTeacherByCode,
  loginOrRequestTeacher,
  updateTeacherStatus,
  type TeacherStatus,
} from "@/src/knowledge/db";

export async function GET(request: NextRequest) {
  try {
    const codeQuery = request.nextUrl.searchParams
      .get("code")
      ?.trim()
      .toUpperCase();

    if (codeQuery) {
      const teacher = await getTeacherByCode(codeQuery);
      if (!teacher) {
        return NextResponse.json(
          { error: `No existe ningún docente con el código "${codeQuery}".` },
          { status: 404 }
        );
      }
      if (teacher.status !== "approved") {
        return NextResponse.json(
          {
            error: `El docente del código "${codeQuery}" aún no ha sido aprobado por el Admin.`,
          },
          { status: 403 }
        );
      }

      const teacherContents = await getContentsByTeacher(teacher.id);

      return NextResponse.json({
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          course: teacher.course,
          accessCode: teacher.accessCode,
          contentsCount: teacherContents.length,
        },
      });
    }

    const onlyApproved =
      request.nextUrl.searchParams.get("onlyApproved") === "true";
    const emailQuery = request.nextUrl.searchParams
      .get("email")
      ?.trim()
      .toLowerCase();

    const db = await getDb();

    if (emailQuery) {
      const teacher =
        db.teachers.find((t) => t.email.toLowerCase() === emailQuery) ?? null;
      const teacherContents = teacher
        ? db.contents.filter((c) => c.teacherId === teacher.id)
        : [];
      const teacherEscalations = teacher
        ? db.escalations.filter((e) => e.teacherId === teacher.id)
        : [];
      return NextResponse.json({
        teacher,
        contents: teacherContents,
        escalations: teacherEscalations,
      });
    }

    const teachers = onlyApproved
      ? db.teachers.filter((t) => t.status === "approved")
      : db.teachers;

    return NextResponse.json({
      teachers,
      contents: db.contents,
      escalations: db.escalations,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error consultando docentes en Neon Postgres.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim();
    const course = String(body.course ?? "").trim();
    const customCode = String(body.customCode ?? "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Debes ingresar un correo electrónico válido." },
        { status: 400 }
      );
    }

    const teacher = await loginOrRequestTeacher({
      email,
      name,
      course,
      customCode,
    });
    return NextResponse.json({ teacher });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error al procesar el login.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const teacherId = String(body.teacherId ?? "").trim();
    const status = String(body.status ?? "").trim() as TeacherStatus;
    const accessCode = body.accessCode
      ? String(body.accessCode).trim()
      : undefined;

    if (
      !teacherId ||
      !["pending", "approved", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Parámetros inválidos para actualizar el estado del docente." },
        { status: 400 }
      );
    }

    const updated = await updateTeacherStatus(teacherId, status, accessCode);
    if (!updated) {
      return NextResponse.json(
        { error: "Docente no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ teacher: updated });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error actualizando estado del docente.",
      },
      { status: 400 }
    );
  }
}
