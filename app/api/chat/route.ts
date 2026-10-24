import { NextRequest, NextResponse } from "next/server";
import {
  addEscalationRecord,
  getContentsByTeacher,
  getTeacherByCode,
  getTeacherById,
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
    const studentName = String(body.studentName ?? "").trim() || "Estudiante";
    const studentEmail =
      String(body.studentEmail ?? "").trim() || "estudiante@curso.edu";
    const question = String(body.question ?? "").trim();
    const action = String(body.action ?? "ask").trim();
    const deferEscalation = Boolean(body.deferEscalation);

    const teacher = accessCode
      ? await getTeacherByCode(accessCode)
      : teacherId
        ? await getTeacherById(teacherId)
        : null;

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Código de docente inválido. Ingresa un código válido compartido por tu docente.",
        },
        { status: 404 }
      );
    }

    if (teacher.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "El docente de este código aún no ha sido aprobado por el Admin.",
        },
        { status: 403 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: "Escribe una pregunta para consultar." },
        { status: 400 }
      );
    }

    // Explicit ticket submission from the student's editable draft
    if (action === "send_ticket") {
      const emailResult = await sendEscalationEmailToTeacher({
        teacherEmail: teacher.email,
        teacherName: teacher.name,
        courseName: teacher.course,
        studentName,
        studentEmail,
        question,
      });

      const escalation = await addEscalationRecord({
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        studentName,
        studentEmail,
        question,
        emailSent: emailResult.sent,
        emailId: emailResult.emailId,
        emailError: emailResult.error,
      });

      return NextResponse.json({
        answered: false,
        ticketCreated: true,
        answer: "No encuentro esto en el material del curso.",
        escalatedTo: teacher.email,
        emailSent: emailResult.sent,
        emailId: emailResult.emailId,
        emailError: emailResult.error,
        escalation,
      });
    }

    const contents = await getContentsByTeacher(teacher.id);
    const gemmaResult = await askGemmaWithContents({
      teacher,
      contents,
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
        draftContext: `Asignatura: ${teacher.course} (${teacher.name}) · La consulta no aparece en el syllabus ni en los ${contents.length} materiales cargados.`,
      });
    }

    // Gemma 4 returned NO_SE: escalate via Resend to the teacher in question
    const emailResult = await sendEscalationEmailToTeacher({
      teacherEmail: teacher.email,
      teacherName: teacher.name,
      courseName: teacher.course,
      studentName,
      studentEmail,
      question,
    });

    const escalation = await addEscalationRecord({
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      studentName,
      studentEmail,
      question,
      emailSent: emailResult.sent,
      emailId: emailResult.emailId,
      emailError: emailResult.error,
    });

    return NextResponse.json({
      answered: false,
      answer: "No encuentro esto en el material del curso.",
      escalatedTo: teacher.email,
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
