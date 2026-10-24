import { NextRequest, NextResponse } from "next/server";
import {
  addEscalationRecord,
  getContentsByTeacher,
  getTeacherByCode,
  getTeacherByCourse,
  getTeacherById,
  type CourseContent,
  type Teacher,
} from "@/src/knowledge/db";
import { askGemmaWithContents } from "@/src/chatbot/ollama";
import { sendEscalationEmailToTeacher } from "@/src/email/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessCode = String(body.accessCode ?? "")
      .trim()
      .toUpperCase();
    const teacherId = String(body.teacherId ?? "").trim();
    const teacherEmailParam = String(body.teacherEmail ?? "").trim();
    const teacherNameParam = String(body.teacherName ?? "").trim();
    const courseName = String(body.courseName ?? "").trim() || "Cálculo II";
    const studentName = String(body.studentName ?? "").trim() || "Estudiante";
    const studentEmail =
      String(body.studentEmail ?? "").trim() || "estudiante@curso.edu";
    const question = String(body.question ?? "").trim();
    const action = String(body.action ?? "ask").trim();
    const deferEscalation = Boolean(body.deferEscalation);
    const extraContents: CourseContent[] = Array.isArray(body.extraContents)
      ? body.extraContents.map((c: Record<string, unknown>, idx: number) => ({
          id: String(c.id ?? `extra_${idx}`),
          teacherId: String(c.teacherId ?? "local"),
          teacherEmail: String(c.teacherEmail ?? "profesor@curso.edu"),
          teacherName: String(c.teacherName ?? "Profesor"),
          category:
            (String(c.category ?? "Información general") as CourseContent["category"]),
          title: String(c.title ?? `Archivo #${idx + 1}`),
          content: String(c.content ?? ""),
          createdAt: new Date().toISOString(),
        }))
      : [];

    if (!question) {
      return NextResponse.json(
        { error: "Escribe una pregunta para consultar." },
        { status: 400 }
      );
    }

    // Look up registered teacher by accessCode -> teacherId -> courseName in Neon Postgres
    const dbTeacher = accessCode
      ? await getTeacherByCode(accessCode)
      : teacherId
        ? await getTeacherById(teacherId)
        : await getTeacherByCourse(courseName);

    const effectiveTeacher: Teacher = dbTeacher ?? {
      id: "local-teacher",
      name: teacherNameParam || "Profesor del Curso",
      email:
        teacherEmailParam ||
        process.env.PROFESSOR_EMAIL ||
        "profesor@universidad.edu",
      course: courseName,
      accessCode: "LOCAL",
      status: "approved",
      createdAt: new Date().toISOString(),
    };

    // Explicit ticket submission from the student's editable draft
    if (action === "send_ticket") {
      const emailResult = await sendEscalationEmailToTeacher({
        teacherEmail: effectiveTeacher.email,
        teacherName: effectiveTeacher.name,
        courseName: effectiveTeacher.course,
        studentName,
        studentEmail,
        question,
      });

      const escalation = dbTeacher
        ? await addEscalationRecord({
            teacherId: dbTeacher.id,
            teacherName: dbTeacher.name,
            teacherEmail: dbTeacher.email,
            studentName,
            studentEmail,
            question,
            emailSent: emailResult.sent,
            emailId: emailResult.emailId,
            emailError: emailResult.error,
          })
        : undefined;

      return NextResponse.json({
        answered: false,
        ticketCreated: true,
        answer: "No encuentro esto en el material del curso.",
        escalatedTo: effectiveTeacher.email,
        teacherName: effectiveTeacher.name,
        emailSent: emailResult.sent,
        emailId: emailResult.emailId,
        emailError: emailResult.error,
        escalation,
      });
    }

    const dbContents = dbTeacher ? await getContentsByTeacher(dbTeacher.id) : [];
    const combinedContents = [...extraContents, ...dbContents];

    const gemmaResult = await askGemmaWithContents({
      teacher: effectiveTeacher,
      contents: combinedContents,
      question,
    });

    if (gemmaResult.known) {
      return NextResponse.json({
        answered: true,
        answer: gemmaResult.answer,
        source: gemmaResult.source,
        confidence: gemmaResult.confidence ?? "Basada en el syllabus",
      });
    }

    // If the UI wants to show the editable ticket draft first (STYLES.md §1)
    if (deferEscalation) {
      return NextResponse.json({
        answered: false,
        needsTicketConfirmation: true,
        answer: "No encuentro esto en el material del curso.",
        draftQuestion: question,
        draftContext: `Asignatura: ${effectiveTeacher.course} (${effectiveTeacher.name} · ${effectiveTeacher.email}) · La consulta no aparece en el syllabus ni en los ${combinedContents.length} archivos/materiales cargados.`,
      });
    }

    // Gemma 4 returned NO_SE: escalate via Resend to the teacher in question
    const emailResult = await sendEscalationEmailToTeacher({
      teacherEmail: effectiveTeacher.email,
      teacherName: effectiveTeacher.name,
      courseName: effectiveTeacher.course,
      studentName,
      studentEmail,
      question,
    });

    const escalation = dbTeacher
      ? await addEscalationRecord({
          teacherId: dbTeacher.id,
          teacherName: dbTeacher.name,
          teacherEmail: dbTeacher.email,
          studentName,
          studentEmail,
          question,
          emailSent: emailResult.sent,
          emailId: emailResult.emailId,
          emailError: emailResult.error,
        })
      : undefined;

    return NextResponse.json({
      answered: false,
      answer: "No encuentro esto en el material del curso.",
      escalatedTo: effectiveTeacher.email,
      teacherName: effectiveTeacher.name,
      emailSent: emailResult.sent,
      emailId: emailResult.emailId,
      emailError: emailResult.error,
      escalation,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error procesando la consulta en el chatbot.",
      },
      { status: 500 }
    );
  }
}
